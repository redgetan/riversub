function Editor (song) {
  this.setupElement();
  this.defineAttributeAccessors();

  this.song = song;
  this.isKeydownPressed = false;
  this.currentTrack = null;

  this.subtitleView = new SubtitleView(song.subtitles,this);
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
      "<div id='editor'>" +
        "<div id='editor-top' class='row'>" +
          "<div id='editor-top-left' class='span7'>" +
            "<div id='media_container'>" +
              "<div id='media'><div id='iframe_overlay'></div></div>" +
              "<div id='subtitle_bar'></div>" +
              "<div id='controls' class='row'>" +
                "<div class='pull-left span1'>" +
                  "<button type='button' id='play_btn' class='btn'><i class='icon-play'></i></button>" +
                  "<button type='button' id='pause_btn' class='btn'><i class='icon-pause'></i></button>" +
                "</div>" +
                "<div class='btn-group pull-right'>" +
                  "<a id='save_btn' class='btn'><i class='icon-save'></i> Save</a>" +
                  "<a data-toggle='modal' data-target='#myModal' class='btn pull-right'><i class='icon-question-sign'></i> Help</a>" +
                "</div>" +
              "</div>" +
            "</div>" +
          "</div>" +
          "<div id='editor-top-right' class='span5'>" +
            "<div id='subtitle_container'></div>" +
          "</div>" +
        "</div>" +
        "<div id='editor-bottom' class='row'>" +
          "<div class='span12'>" +
            "<div id='timeline_container'></div>" +
          "</div>" +
        "</div>" +
      "</div>";

    this.$container.append(el);

    this.$el = $("#editor");

    this.$subtitleBar = $("#subtitle_bar");

    this.$saveBtn = $("#save_btn");
    this.$saveBtn.attr("disabled","disabled");

    this.$playBtn = $("#play_btn");
    this.$pauseBtn = $("#pause_btn");
    this.$pauseBtn.hide();
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
    this.$playBtn.on("click",this.onPlayBtnClick.bind(this));
    this.$pauseBtn.on("click",this.onPauseBtnClick.bind(this));
  },

  onKeydownHandler: function(event) {
    // enter key
    if (event.which === 13) {
      if (!this.isKeydownPressed) {
        this.currentTrack = this.createGhostTrack();
        this.$el.trigger("marktrackstart",[this.currentTrack]);
        this.isKeydownPressed = true;
      }
    }
  },

  onKeyupHandler: function(event) {
    // enter key
    if (event.which === 13) {
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

    // space key
    if (event.which === 32) {
      if (!this.$playBtn.is(':hidden')) {
        this.$playBtn.trigger("click");
      } else {
        this.$pauseBtn.trigger("click");
      }
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

  onPlayBtnClick: function(event) {
    this.popcorn.play();
    this.$playBtn.hide();
    this.$pauseBtn.show();
  },

  onPauseBtnClick: function(event) {
    this.popcorn.pause();
    this.$pauseBtn.hide();
    this.$playBtn.show();
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
        url: "/songs/" + this.song.id +"/timings",
        type: "POST",
        data: { timings: creates },
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
        url: "/songs/" + this.song.id +"/timings",
        type: "PUT",
        data: { timings: updates },
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

    var subtitle = this.subtitleView.nextUnmappedSubtitle();
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
