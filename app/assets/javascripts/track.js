function Track (startTime,endTime,subtitleLine,popcorn,editor) {
  this.popcorn = popcorn;
  this.editor = editor;
  this.setSubtitleLine(subtitleLine);

  this.codeTrackEvent     = this.createCodeTrackEvent(startTime,endTime);
  this.subtitleTrackEvent = this.createSubtitleTrackEvent(startTime,endTime);
  this.id = this.codeTrackEvent._id + this.subtitleTrackEvent._id;

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
    return this.codeTrackEvent.start;
  },

  setStartTime: function(time) {
    this.codeTrackEvent.start = time;
    this.subtitleTrackEvent.start = time;
    this.render();
    this.subtitleLine.render();
  },

  endTime: function() {
    return this.codeTrackEvent.end;
  },

  setEndTime: function(time) {
    this.codeTrackEvent.end = time;
    this.subtitleTrackEvent.end = time;
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

  createCodeTrackEvent: function(startTime,endTime) {
    this.popcorn.code({
      start: startTime,
    end:   endTime,
    onStart: function() {
      // console.log("code startTime: " + startTime);
    }
    });

    var trackEventId = this.popcorn.getLastTrackEventId();
    return this.popcorn.getTrackEvent(trackEventId);
  },

  createSubtitleTrackEvent: function(startTime,endTime) {
    this.popcorn.subtitle({
      start: startTime,
    end:   endTime,
    text:  this.subtitleLine.text
    });

    var trackEventId = this.popcorn.getLastTrackEventId();
    return this.popcorn.getTrackEvent(trackEventId);
  },

  remove: function() {
    this.$el.remove();
    this.removeTrackEvents();
  },

  removeTrackEvents: function() {
    this.popcorn.removeTrackEvent(this.codeTrackEvent._id);
    this.popcorn.removeTrackEvent(this.subtitleTrackEvent._id);
  },

  toString: function() {
    return "Track(" + this.startTime() + "," + this.endTime() + ")";
  }
};
