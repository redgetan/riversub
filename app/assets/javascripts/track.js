function Track (startTime,endTime,popcorn,editor) {
	this.popcorn = popcorn;
  this.editor = editor;
	this.codeTrackEvent     = this.createCodeTrackEvent(startTime,endTime);
	this.subtitleTrackEvent = this.createSubtitleTrackEvent(startTime,endTime);
  this.id = this.codeTrackEvent._id + this.subtitleTrackEvent._id;
  this.subtitleLine = null;

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

Track.prototype.render = function() {
  this.$el.css("height",this.$container.css("height"));
  this.$el.css("width", this.toPixel(this.endTime() - this.startTime())  + "px");
  this.$el.offset({
    left: this.popcorn.media.offsetLeft + this.toPixel(this.startTime())
  })
};

Track.prototype.bindEvents = function() {
  this.$el.on("click",this.onClickHandler.bind(this));
};

Track.prototype.onClickHandler = function(event) {
  console.log("clicked " + this);
  this.editor.seek(this.startTime());
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
};

Track.prototype.endTime = function() {
    return this.codeTrackEvent.end;
};

Track.prototype.setEndTime = function(time) {
    this.codeTrackEvent.end = time;
    this.subtitleTrackEvent.end = time;
    this.render();
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

Track.prototype.setSubtitleLine = function(subtitleLine) {
  this.subtitleLine = subtitleLine;
  subtitleLine.setTrack(this);
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
      text:  "subtitle startTime: " + startTime
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
