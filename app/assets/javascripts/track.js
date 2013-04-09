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

Track.prototype.setupElement = function() {
  this.$container = $("#timeline");
  this.$el = $("<div id='" + this.id + "' class='track'>");
  this.$container.append(this.$el);
  this.render();
};

// perhaps track should only render width & height
// position should be left up to editor
Track.prototype.render = function() {
  this.$el.css("height",this.$container.css("height"));
  this.$el.css("width", this.toPixel(this.endTime() - this.startTime())  + "px");
  this.$el.offset({
    left: this.editor.$container.find("#media").offset().left + this.toPixel(this.startTime())
  })
};

Track.prototype.bindEvents = function() {
  this.$el.on("click",this.onMouseClickHandler.bind(this));
};

Track.prototype.onMouseClickHandler = function(event) {
  this.editor.seek(this.startTime());
  this.subtitleLine.highlight();
};

Track.prototype.setSubtitleLine = function(subtitleLine) {
  this.subtitleLine = subtitleLine;
  subtitleLine.setTrack(this);
};

Track.prototype.toPixel = function(time) {
  var pixelWidth = this.$container.width() / this.popcorn.media.duration;
  return pixelWidth * time;
};

Track.prototype.startTime = function() {
    return this.codeTrackEvent.start; 
};

Track.prototype.setStartTime = function(time) {
    this.codeTrackEvent.start = time;
    this.subtitleTrackEvent.start = time;
    this.render();
    this.subtitleLine.render();
};

Track.prototype.endTime = function() {
    return this.codeTrackEvent.end;
};

Track.prototype.setEndTime = function(time) {
    this.codeTrackEvent.end = time;
    this.subtitleTrackEvent.end = time;
    this.render();
    this.subtitleLine.render();
};

Track.prototype.text = function() {
  return this.subtitleLine.text;
};

Track.prototype.end = function(time) {
  var duration = time - this.startTime();

  if (duration <= 0) {
    throw "Track Duration of " + duration + " is invalid";
  }

  if (this.$el.hasClass("ghost")) {
    this.$el.removeClass("ghost");
  }

  this.setEndTime(time);
};

Track.prototype.createCodeTrackEvent = function(startTime,endTime) {
    this.popcorn.code({
      start: startTime,
      end:   endTime,
      onStart: function() {
      	// console.log("code startTime: " + startTime);
      }
    });

    var trackEventId = this.popcorn.getLastTrackEventId();
    return this.popcorn.getTrackEvent(trackEventId);
};

Track.prototype.createSubtitleTrackEvent = function(startTime,endTime) {
    this.popcorn.subtitle({
      start: startTime,
      end:   endTime,
      text:  this.subtitleLine.text
    });

    var trackEventId = this.popcorn.getLastTrackEventId();
    return this.popcorn.getTrackEvent(trackEventId);
};

Track.prototype.remove = function() {
  this.$el.remove();
  this.removeTrackEvents();
};

Track.prototype.removeTrackEvents = function() {
	this.popcorn.removeTrackEvent(this.codeTrackEvent._id);
	this.popcorn.removeTrackEvent(this.subtitleTrackEvent._id);
};

Track.prototype.toString = function() {
	return "Track(" + this.startTime() + "," + this.endTime() + ")";
};
