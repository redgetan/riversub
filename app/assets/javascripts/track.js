function Track(attributes,editor,options) {
  this.editor = editor;
  this.popcorn = editor.popcorn;

  // var subtitle = this.editor.subtitleView.find(attributes.subtitle_id);
  // this.setSubtitle(subtitle);


  this.setAttributes(attributes);

  this.setupElement(options);
  this.bindEvents();

  this.setSubtitle(this.editor.subtitleView.createSubtitle(attributes['subtitle']));
  this.trackEvent     = this.createTrackEvent(attributes.start_time,attributes.end_time);

  this.isSaved = typeof options['isSaved'] === "undefined" ? false : options['isSaved']; 
  this.isDeleted = false;

}

Track.prototype = {

  setAttributes: function(attributes) {
    for (var prop in attributes) {
      this[prop] = attributes[prop];  
    }
  },

  getAttributes: function(attributes) {
    return {
      id: this.id,
      start_time: this.startTime(),
      end_time: this.endTime(),
      client_id: this.trackEvent._id,
      subtitle_attributes: this.subtitle.getAttributes(),
    }
  },

  setupElement: function(options) {

    this.$container_summary = $("#timeline_container #summary");

    var el_summary = "<div id='" + this.id + "' class='track'>" +
                     "</div>"

    this.$el_summary = $(el_summary);
    this.$container_summary.append(this.$el_summary);

    this.$container_expanded = $("#timeline_container #expanded");

    var el_expanded = "<div id='" + this.id + "' class='track'>" +
                       "<button type='button' class='close corner'>×</button>" +
                     "</div>"

    this.$el_expanded = $(el_expanded);
    this.$container_expanded.find(".filler").append(this.$el_expanded);

    if (typeof options !== "undefined" && options["isGhost"]) {
      this.$el_summary.addClass("ghost");
      this.$el_expanded.addClass("ghost");
    }

    this.$close = this.$el_expanded.find(".close");
    this.$close.hide();

    this.$el_expanded.resizable({
      handles: 'e, w',
      resize: this.onResizableResize.bind(this)
    });

    this.$el_expanded.draggable({
      cursor: "move",
      containment: "parent",
      drag: this.onDraggableDrag.bind(this)
    });
  },

  bindEvents: function() {
    this.$el_expanded.on("click",this.onMouseClickHandler.bind(this));
    this.$el_summary.on("click",this.onMouseClickHandler.bind(this));

    this.$el_expanded.on("mouseenter",this.onMouseEnter.bind(this));
    this.$el_expanded.on("mouseleave",this.onMouseLeave.bind(this));
    this.$close.on("mousedown",this.onCloseMouseDown.bind(this));
  },

  onMouseEnter: function() {
    this.$close.show();
  },

  onMouseLeave: function() {
    this.$close.hide();
  },

  onCloseMouseDown: function(event) {
    event.stopPropagation();
    this.remove();
  },

  onMouseClickHandler: function(event) {
    this.editor.seek(this.startTime());
  },

  onResizableResize: function(event, ui) {
    this.$el_expanded.trigger("trackresize",[this,ui]);
  },

  onDraggableDrag: function(event, ui) {
    this.$el_expanded.trigger("trackdrag",[this,ui]);
  },

  setSubtitle: function(subtitle) {
    this.subtitle = subtitle;
    subtitle.setTrack(this);
  },

  startTime: function() {
    if (typeof this.trackEvent !== "undefined") {
      return this.trackEvent.start;
    } else {
      return this.start_time;
    }
  },

  setStartTime: function(time) {
    time = Math.round(time * 1000) / 1000;
    this.trackEvent.start = time;

    this.isSaved = false;
    this.$el_expanded.trigger("trackchange",[this]);
  },

  endTime: function() {
    if (typeof this.trackEvent !== "undefined") {
      return this.trackEvent.end;
    } else {
      return this.end_time;
    }
  },

  setEndTime: function(time) {
    time = Math.round(time * 1000) / 1000;
    this.trackEvent.end = time;

    this.isSaved = false;
    this.$el_expanded.trigger("trackchange",[this]);
  },

  text: function() {
    return this.subtitle.text;
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

  isGhost: function() {
    return this.$el_expanded.hasClass("ghost");
  },

  createTrackEvent: function(startTime,endTime) {
    var self = this;

    this.popcorn.code({
      start: startTime,
      end:   endTime,
      onStart: function() {
        self.$el_expanded.trigger("trackstart",[self]);
      },
      onEnd: function() {
        self.$el_expanded.trigger("trackend",[self]);
      },
    });

    var trackEventId = this.popcorn.getLastTrackEventId();

    return this.popcorn.getTrackEvent(trackEventId);
  },

  remove: function() {
    this.$el_expanded.remove();
    this.$el_summary.remove();
    this.popcorn.removeTrackEvent(this.trackEvent._id);
    // this.subtitle.unmapTrack();
    this.isDeleted = true;
    this.subtitle.remove();
    $(document).trigger("trackremove",this);
  },

  highlight: function() {
    this.$el_summary.addClass("selected");
    this.$el_expanded.addClass("selected");
  },

  unhighlight: function() {
    this.$el_summary.removeClass("selected");
    this.$el_expanded.removeClass("selected");
  },

  toString: function() {
    return "Track(" + this.startTime() + "," + this.endTime() + ")";
  }
};
