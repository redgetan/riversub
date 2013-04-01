function Editor (popcorn) {
	this._popcorn = popcorn;
	this.media = popcorn.media;
	this.tracks = [];
	this.timeline = new Timeline();

	Object.defineProperty( this, "numTracks", {
      get: function() {
		return this.tracks.length;
      },
      enumerable: true
    });
}

Editor.prototype.seek = function(time) {
	this._popcorn.currentTime(time);
};

Editor.prototype.createTrack = function() {
	var startTime = this.media.currentTime;
	var endTime   = this.determineEndTime(startTime);

	this.validateNoTrackOverlap(startTime,endTime);

	var track = new Track(startTime,endTime,this._popcorn);	
	this.tracks.push(track);
	return track;
};

Editor.prototype.endTrack = function(track) {
	var duration = this.media.currentTime - track.startTime;

	if (duration <= 0) {
		throw "Track Duration of " + duration + " is invalid";
	}

	track.endTime = this.media.currentTime;
};

/*
*   startTime should not be less than any existing track endTime
*   endTime should not be greater than any existing track startTime
*/
Editor.prototype.validateNoTrackOverlap = function(startTime,endTime) {
	for (var i = this.tracks.length - 1; i >= 0; i--) {
		if (startTime >= this.tracks[i].startTime && startTime < this.tracks[i].endTime || 
			endTime   <= this.tracks[i].endTime   && endTime   > this.tracks[i].startTime) {
				throw "Track Overlap Detected. Track(" + startTime + "," + endTime + ") " + 
			          "would overlap with " + this.tracks[i].toString(); 
		}
	};

};

// either the end of media or the starttime next nearest track
Editor.prototype.determineEndTime = function(startTime) {
	var nextNearestEdgeTime = this.media.duration;

	for (var i = this.tracks.length - 1; i >= 0; i--) {
		if (this.tracks[i].startTime > startTime && this.tracks[i].startTime < nextNearestEdgeTime) {
			nextNearestEdgeTime = this.tracks[i].startTime;
		}
	};

	return nextNearestEdgeTime;
};

Editor.prototype.clearTracks = function(time) {
	for (var i = this.tracks.length - 1; i >= 0; i--) {
		this.tracks[i].removeTrackEvents();
	};

	this.tracks.length = 0;
};
