function Track (startTime,endTime,subtitleLine,popcorn,editor) {
  this.popcorn = popcorn;
  this.editor = editor;
  this.setSubtitleLine(subtitleLine);

  this.trackEvent     = this.createTrackEvent(startTime,endTime);
  this.id = this.trackEvent._id; 

  this.setupElement();
  this.bindEvents();

  this.$el.addClass("ghost");
}

Track.prototype = {

  setupElement: function() {
    this.$container = $("#timeline");
    this.$el = $("<div id='" + this.id + "' class='track'>");
    this.$container.append(this.$el);
    this.render();
  },

  // perhaps track should only render width & height
  // position should be left up to editor
  render: function() {
    this.$el.css("height",this.$container.css("height"));
    this.$el.css("width", this.toPixel(this.endTime() - this.startTime())  + "px");
    this.$el.offset({
      left: this.editor.$container.find("#media").offset().left + this.toPixel(this.startTime())
    })
  },

  bindEvents: function() {
    this.$el.on("click",this.onMouseClickHandler.bind(this));
  },

  onMouseClickHandler: function(event) {
    this.editor.seek(this.startTime());
    this.subtitleLine.highlight();
  },

  setSubtitleLine: function(subtitleLine) {
    this.subtitleLine = subtitleLine;
    subtitleLine.setTrack(this);
  },

  toPixel: function(time) {
    var pixelWidth = this.$container.width() / this.popcorn.media.duration;
    return pixelWidth * time;
  },

  startTime: function() {
    return this.trackEvent.start;
  },

  setStartTime: function(time) {
    this.trackEvent.start = time;
    this.render();
    this.subtitleLine.render();
  },

  endTime: function() {
    return this.trackEvent.end;
  },

  setEndTime: function(time) {
    this.trackEvent.end = time;
    this.render();
    this.subtitleLine.render();
  },

  text: function() {
    return this.subtitleLine.text;
  },

  end: function(time) {
    var duration = time - this.startTime();

    if (duration <= 0) {
      throw "Track Duration of " + duration + " is invalid";
    }

    if (this.$el.hasClass("ghost")) {
      this.$el.removeClass("ghost");
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
      },
      onEnd: function() {
        self.hideSubtitleInSubtitleBar();
      },
    });

    var trackEventId = this.popcorn.getLastTrackEventId();
    return this.popcorn.getTrackEvent(trackEventId);
  },

  showSubtitleInSubtitleBar: function() {
    this.editor.$subtitleBar.text(this.subtitleLine.text);
  },

  hideSubtitleInSubtitleBar: function() {
    this.editor.$subtitleBar.text("");
  },

  remove: function() {
    this.$el.remove();
    this.popcorn.removeTrackEvent(this.trackEvent._id);
  },

  toString: function() {
    return "Track(" + this.startTime() + "," + this.endTime() + ")";
  }
};
