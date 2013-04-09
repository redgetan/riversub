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

Editor.prototype = {

  setupElement: function() {
    this.$container = $("#main_container");
    var el = 
      "<div id='media_container'>" +
        "<div id='media'></div>" +
        "<div id='subtitle_bar'></div>" +
      "</div>" +
      "<div id='timeline'>" + 
        "<div id='summary'></div>" +
        "<div id='expanded'></div>" +
      "</div>" + 
      "<div id='subtitle'><h1>Subtitle</h1></br></div>";
    this.$el = $(el);

    this.$container.append(this.$el);
    this.$subtitleBar = $("#subtitle_bar");
  },

  defineAttributeAccessors: function() {
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
  },

  loadMedia: function(url) {
    // return Popcorn.smart("div#media",url);
    return Popcorn.smart("div#media",url);
  },

  bindEvents: function() {
    $(document).on("keydown",this.onKeydownHandler.bind(this));
    $(document).on("keyup",this.onKeyupHandler.bind(this));
  },

  onKeydownHandler: function(event) {
    // K key
    if (event.which === 75) {
      if (!this.isKeydownPressed) {
        this.currentTrack = this.createTrack();
        this.isKeydownPressed = true;
      }
    }
  },

  onKeyupHandler: function(event) {
    // K key
    if (event.which === 75) {
      try {
        this.endTrack(this.currentTrack);
      } catch (e) {
        console.log(e.stack);
        console.log("Removing invalid track");
        this.currentTrack.remove();
        this.tracks.pop();
      }
      this.isKeydownPressed = false;
    }
  },


  seek: function(time) {
    this.popcorn.currentTime(time);
  },

  createTrack: function() {
    var startTime = this.media.currentTime.toFixed(3);
    var endTime   = this.determineEndTime(startTime);

    this.validateNoTrackOverlap(startTime,endTime);

    var subtitleLine = this.subtitle.nextUnmappedLine();
    var track = new Track(startTime,endTime,subtitleLine,this.popcorn,this);
    this.tracks.push(track);
    return track;
  },

  endTrack: function(track) {
    track.end(this.media.currentTime.toFixed(3));
  },

  /*
   *   startTime should not be less than any existing track endTime
   *   endTime should not be greater than any existing track startTime
   */
  validateNoTrackOverlap: function(startTime,endTime) {
    for (var i = this.tracks.length - 1; i >= 0; i--) {
      if (startTime >= this.tracks[i].startTime && startTime < this.tracks[i].endTime ||
          endTime   <= this.tracks[i].endTime   && endTime   > this.tracks[i].startTime) {
            throw "Track Overlap Detected. Track(" + startTime + "," + endTime + ") " +
              "would overlap with " + this.tracks[i].toString();
          }
    };

  },

  // either the end of media or the starttime next nearest track
  determineEndTime: function(startTime) {
    var nextNearestEdgeTime = this.media.duration;

    for (var i = this.tracks.length - 1; i >= 0; i--) {
      if (this.tracks[i].startTime > startTime && this.tracks[i].startTime < nextNearestEdgeTime) {
        nextNearestEdgeTime = this.tracks[i].startTime;
      }
    };

    return nextNearestEdgeTime;
  },

  clearTracks: function(time) {
    for (var i = this.tracks.length - 1; i >= 0; i--) {
      this.tracks[i].remove();
    };

    this.tracks.length = 0;
  }
}

