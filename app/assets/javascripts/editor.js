function Editor (song) {
	this.setupElement();
	this.defineAttributeAccessors();
	this.bindEvents();

	this.song = song;
	this.tracks = [];
	this.isKeydownPressed = false;
	this.currentTrack = null;

	this.popcorn = this.loadMedia(song.media_sources[0].url);
	this.subtitle = new Subtitle(song.lyrics);
}

Editor.prototype.setupElement = function() {
	this.$container = $("#main_container");
	var el = "<div id='media_container'>" + 
				"<div id='media'></div>" + 
			 "</div>" + 
			 "<div id='timeline'></div>" + 
			 "<div id='subtitle'><h1>Subtitle</h1></br></div>";
	this.$el = $(el);
				
	this.$container.append(this.$el);
};

Editor.prototype.defineAttributeAccessors = function() {
	Object.defineProperty( this, "numTracks", {
      get: function() {
		return this.tracks.length;
      },
      enumerable: true
    });

	Object.defineProperty( this, "media", {
      get: function() {
		return this.popcorn.media;
      },
      enumerable: true
    });
};

Editor.prototype.loadMedia = function(url) {
    return Popcorn.smart("div#media",url);
};

Editor.prototype.bindEvents = function() {
	$(document).on("keydown",this.onKeydownHandler.bind(this));
	$(document).on("keyup",this.onKeyupHandler.bind(this));
};

Editor.prototype.onKeydownHandler = function(event) {
	// K key
    if (event.which === 75) {
      if (!this.isKeydownPressed) {
      	this.currentTrack = this.createTrack();
      	this.isKeydownPressed = true;
      }
  	}
};

Editor.prototype.onKeyupHandler = function(event) {
	// K key
    if (event.which === 75) {
    	try {
      		this.endTrack(this.currentTrack);
    	} catch (e) {
    		console.log(e + ". Removing invalid track");
    		this.currentTrack.remove();
    		this.tracks.pop();
    	}
      	this.isKeydownPressed = false;
  	}
};


Editor.prototype.seek = function(time) {
	this.popcorn.currentTime(time);
};

Editor.prototype.createTrack = function() {
	var startTime = this.media.currentTime;
	var endTime   = this.determineEndTime(startTime);

	this.validateNoTrackOverlap(startTime,endTime);

	var subtitleLine = this.subtitle.currentUnmappedLine();
	var track = new Track(startTime,endTime,this.popcorn,this);	
	this.subtitle.mapTrack(track,subtitleLine);
	this.tracks.push(track);
	return track;
};

Editor.prototype.endTrack = function(track) {
	track.end(this.media.currentTime);
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
		this.tracks[i].remove();
	};

	this.tracks.length = 0;
};
