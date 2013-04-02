function Track (startTime,endTime,popcorn) {
	this.popcorn = popcorn;
	this.codeTrackEvent     = this.createCodeTrackEvent(startTime,endTime);
	this.subtitleTrackEvent = this.createSubtitleTrackEvent(startTime,endTime);
  this.id = this.codeTrackEvent.id + this.subtitleTrackEvent.id;
  this.subtitleLine = null;

  this.setupElement();

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
  this.$el.css("width", this.endTime() - this.startTime()  + "px");
  this.$el.offset({
    left: this.$container.offset().left + this.startTime()
  })
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

Track.prototype.removeTrackEvents = function(startTime,endTime) {
	this.popcorn.removeTrackEvent(this.codeTrackEvent.id);
	this.popcorn.removeTrackEvent(this.subtitleTrackEvent.id);
};

Track.prototype.toString = function() {
	return "Track(" + this.startTime() + "," + this.endTime() + ")";
};
