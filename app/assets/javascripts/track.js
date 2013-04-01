function Track (startTime,endTime,popcorn) {
	this._popcorn = popcorn;
	this._codeTrackEvent     = this.createCodeTrackEvent(startTime,endTime);
	this._subtitleTrackEvent = this.createSubtitleTrackEvent(startTime,endTime);

	Object.defineProperty( this, "startTime", {
      get: function() {
        return this._codeTrackEvent.start;
      },
      set: function( time ) {
      	this._codeTrackEvent.start = time;
      	this._subtitleTrackEvent.start = time;
      },
      enumerable: true
    });

	Object.defineProperty( this, "endTime", {
      get: function() {
        return this._codeTrackEvent.end;
      },
      set: function( time ) {
      	this._codeTrackEvent.end = time;
      	this._subtitleTrackEvent.end = time;
      },
      enumerable: true
    });

}

Track.prototype.createCodeTrackEvent = function(startTime,endTime) {
    this._popcorn.code({
      start: startTime,
      end:   endTime,
      onStart: function() {
      	// console.log("code startTime: " + startTime);
      }
    });

    var trackEventId = popcorn.getLastTrackEventId();
    return popcorn.getTrackEvent(trackEventId);
};

Track.prototype.createSubtitleTrackEvent = function(startTime,endTime) {
    this._popcorn.subtitle({
      start: startTime,
      end:   endTime,
      text:  "subtitle startTime: " + startTime
    });

    var trackEventId = popcorn.getLastTrackEventId();
    return popcorn.getTrackEvent(trackEventId);
};

Track.prototype.removeTrackEvents = function(startTime,endTime) {
	this._popcorn.removeTrackEvent(this._codeTrackEvent._id);
	this._popcorn.removeTrackEvent(this._subtitleTrackEvent._id);
};

Track.prototype.toString = function() {
	return "Track(" + this.startTime + "," + this.endTime + ")";
};
