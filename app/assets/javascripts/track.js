function Track(attributes,editor,options) {
  this.attributes = attributes;

  this.editor = editor;
  this.popcorn = editor.popcorn;

  var subtitle = this.editor.subtitleView.find(attributes.subtitle_id);
  this.setSubtitle(subtitle);

  this.trackEvent     = this.createTrackEvent(this.attributes.start_time,this.attributes.end_time);

  this.setupElement(options);
  this.bindEvents();

  this.isSaved = typeof options['isSaved'] === "undefined" ? false : options['isSaved']; 
  this.isDeleted = false;
}

Track.prototype = {

  setupElement: function(options) {

    this.$container_summary = $("#timeline_container #summary");
    this.$el_summary = $("<div id='" + this.attributes.id + "' class='track'>");
    this.$container_summary.append(this.$el_summary);

    this.$container_expanded = $("#timeline_container #expanded");
    this.$el_expanded = $("<div id='" + this.attributes.id + "' class='track'>");
    this.$container_expanded.find(".filler").append(this.$el_expanded);

    if (typeof options !== "undefined" && options["isGhost"]) {
      this.$el_summary.addClass("ghost");
      this.$el_expanded.addClass("ghost");
    }

    this.$el_expanded.resizable({
      handles: 'e, w',
      stop: this.onResizableStop.bind(this)
    });
  },

  bindEvents: function() {
    this.$el_expanded.on("click",this.onMouseClickHandler.bind(this));
    this.$el_summary.on("click",this.onMouseClickHandler.bind(this));
  },

  onMouseClickHandler: function(event) {
    this.editor.seek(this.startTime());
  },

  onResizableStop: function(event, ui) {
    this.$el_expanded.trigger("trackresize",[this,ui]);
  },

  setSubtitle: function(subtitle) {
    this.subtitle = subtitle;
    this.attributes["subtitle_id"] = subtitle.attributes.id;
    subtitle.setTrack(this);
  },

  startTime: function() {
    return this.attributes["start_time"];
  },

  setStartTime: function(time) {
    this.trackEvent.start = time;
    this.attributes["start_time"] = time;

    this.isSaved = false;
    this.$el_expanded.trigger("trackchange",[this]);
  },

  endTime: function() {
    return this.attributes["end_time"];
  },

  setEndTime: function(time) {
    this.trackEvent.end = time;
    this.attributes["end_time"] = time;

    this.isSaved = false;
    this.$el_expanded.trigger("trackchange",[this]);
  },

  text: function() {
    return this.subtitle.attributes.text;
  },

  end: function(time) {
    var duration = time - this.startTime();

    if (duration <= 0) {
      throw "Track Duration of " + duration + " is invalid";
    }

    if (this.$el_summary.hasClass("ghost")) {
      this.$el_summary.removeClass("ghost");
    }

    if (this.$el_expanded.hasClass("ghost")) {
      this.$el_expanded.removeClass("ghost");
    }

    this.setEndTime(time);
  },

  createTrackEvent: function(startTime,endTime) {
    var self = this;

    this.popcorn.code({
      start: startTime,
      end:   endTime,
      onStart: function() {
        self.showSubtitleInSubtitleBar();
        self.subtitle.highlight();
      },
      onEnd: function() {
        self.hideSubtitleInSubtitleBar();
        self.subtitle.unhighlight();
      },
    });

    var trackEventId = this.popcorn.getLastTrackEventId();

    this.attributes["start_time"] = startTime;
    this.attributes["end_time"] = endTime;
    this.attributes["client_id"] = trackEventId;

    return this.popcorn.getTrackEvent(trackEventId);
  },

  showSubtitleInSubtitleBar: function() {
    this.editor.$subtitleBar.text(this.subtitle.attributes.text);
  },

  hideSubtitleInSubtitleBar: function() {
    this.editor.$subtitleBar.text("");
  },

  remove: function() {
    this.$el_expanded.remove();
    this.$el_summary.remove();
    this.popcorn.removeTrackEvent(this.trackEvent._id);
    this.subtitle.unmapTrack();
    this.isDeleted = true;
    $(document).trigger("trackremove",this.attributes.id);
  },

  toString: function() {
    return "Track(" + this.startTime() + "," + this.endTime() + ")";
  }
};
