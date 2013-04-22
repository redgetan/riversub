function Editor (song) {
  this.setupElement();
  this.defineAttributeAccessors();

  this.song = song;
  this.isKeydownPressed = false;
  this.currentTrack = null;

  this.subtitleCollection = new SubtitleCollection(song.subtitles);
  this.timeline = new Timeline();

  this.popcorn = this.loadMedia(song.media_sources[0].url);

  this.trackMap = {}
  this.tracks = this.loadTracks(song.timings);
  this.timeline.setTracks(this.tracks);

  this.bindEvents();
}

Editor.prototype = {

  setupElement: function() {
    this.$container = $("#main_container");
    var el = 
      "<div id='top_container'>" +
        "<div id='media_container'>" +
          "<div id='media'></div>" +
          "<div id='subtitle_bar'></div>" +
        "</div>" +
        "<button type='button' id='save_btn'>Save</button>" +
        "<div id='subtitle_container'></div>" +
      "</div>" +
      "<div id='timeline_container'>" + 
      "</div>"; 
    this.$el = $(el);

    this.$container.append(this.$el);
    this.$subtitleBar = $("#subtitle_bar");

    this.$saveBtn = $("#save_btn");
    this.$saveBtn.attr("disabled","disabled");
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
    var popcorn = Popcorn.smart("div#media",url);
    this.timeline.setMedia(popcorn.media);
    return popcorn;
  },

  bindEvents: function() {
    $(document).on("keydown",this.onKeydownHandler.bind(this));
    $(document).on("keyup",this.onKeyupHandler.bind(this));
    $(document).on("timelineseek",this.onTimelineSeekHandler.bind(this));
    $(document).on("subtitlelineclick",this.onSubtitleLineClick.bind(this));
    $(document).on("trackchange",this.onTrackChange.bind(this));
    this.$saveBtn.on("click",this.onSaveBtnClick.bind(this));
  },

  onKeydownHandler: function(event) {
    // K key
    if (event.which === 75) {
      if (!this.isKeydownPressed) {
        this.currentTrack = this.createGhostTrack();
        this.$el.trigger("marktrackstart",[this.currentTrack]);
        this.isKeydownPressed = true;
      }
    }
  },

  onKeyupHandler: function(event) {
    // K key
    if (event.which === 75) {
      try {
        this.$el.trigger("marktrackend");
        this.endGhostTrack(this.currentTrack);
      } catch (e) {
        console.log(e.stack);
        console.log("Removing invalid track");
        this.currentTrack.remove();
        this.tracks.pop();
      }
      this.isKeydownPressed = false;
    }
  },

  onTimelineSeekHandler: function(event,time) {
    this.seek(time);
  },

  onSubtitleLineClick: function(event,subtitle) {
    this.seek(subtitle.track.startTime());
  },

  onTrackChange: function() {
    for (var i = 0; i < this.tracks.length; i++) {
      if (!this.tracks[i].isSaved) {
        this.$saveBtn.removeAttr("disabled");
        return;
      }
    };
    // if changes are saved and nothing is changed
    this.$saveBtn.attr("disabled", "disabled");
  },

  onSaveBtnClick: function(event) {
    var creates = [];
    var updates = [];
    var track;
    for (var i = 0; i < this.tracks.length; i++) {
      track = this.tracks[i];
      if (!track.isSaved) {
        if (typeof track.attributes.id === "undefined") {
          creates.push(this.tracks[i].attributes);
        } else {
          updates.push(this.tracks[i].attributes);
        }
      }
    };

    if (creates.length > 0 ) {
      $.ajax({
        url: "/songs/" + this.song.id +"/timing",
        type: "POST",
        data: { timing: creates },
        dataType: "json",
        success: function(data) {
          this.setTrackIds(data);
          this.$saveBtn.attr("disabled", "disabled");
        }.bind(this),
        error: function(data,e,i) {
          try {
            var result = JSON.parse(data);
            this.setTrackIds(result.created);
            alert(result.error);
          } catch (e) {
            alert(data.responseText);
          }
        }
      });
    }

    if (updates.length > 0 ) {
      $.ajax({
        url: "/songs/" + this.song.id +"/timing",
        type: "PUT",
        data: { timing: updates },
        dataType: "json",
        success: function(data) {
          this.setTrackIds(data);
          this.$saveBtn.attr("disabled", "disabled");
        }.bind(this),
        error: function(data,e,i) {
          try {
            var result = JSON.parse(data);
            this.setTrackIds(result.updated);
            alert(result.error);
          } catch (e) {
            alert(data.responseText);
          }
        }
      });
    }

  },

  seek: function(time) {
    this.popcorn.currentTime(time);
  },

  loadTracks: function(timings) {
    var tracks = [];

    if (typeof timings !== "undefined") { 
      for (var i = 0; i < timings.length; i++) {
        var track = new Track(timings[i],this, { isSaved: true });
        this.trackMap[track.attributes.client_id] = track;
        tracks.push(track);
      };
    }

    return tracks;
  },

  createGhostTrack: function() {
    var startTime = Math.round(this.media.currentTime * 1000) / 1000;
    var endTime   = this.determineEndTime(startTime);

    this.validateNoTrackOverlap(startTime,endTime);

    var subtitle = this.subtitleCollection.nextUnmappedSubtitle();
    var attributes = {
      start_time: startTime, 
      end_time: endTime,
      subtitle_id: subtitle.attributes.id
    };

    var track = new Track(attributes, this, { "isGhost": true });
    this.trackMap[track.attributes.client_id] = track;
    this.tracks.push(track);
    return track;
  },

  endGhostTrack: function(track) {
    var time = Math.round(this.media.currentTime * 1000) / 1000;
    track.end(time);
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

  setTrackIds: function(timings) {
    var track;
    for (var i = 0; i < timings.length; i++) {
      track = this.trackMap[timings[i].client_id];
      track.attributes.id = timings[i].id;
      track.isSaved = true;
    };
  },

  clearTracks: function(time) {
    for (var i = this.tracks.length - 1; i >= 0; i--) {
      this.tracks[i].remove();
    };

    this.tracks.length = 0;
  }
}

