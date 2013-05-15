function Editor (song) {
  this.song = song;
  this.setupElement();
  this.defineAttributeAccessors();

  this.isKeydownPressed = false;
  this.currentTrack = null;
  this.currentGhostTrack = null;

  this.subtitleView = new SubtitleView($.map(song.timings,function(timing){ return timing.subtitle; }),this);
  this.timeline = new Timeline();

  this.popcorn = this.loadMedia(song.media_sources[0].url);

  this.trackMap = {}
  this.tracks = this.loadTracks(song.timings);
  this.timeline.setTracks(this.tracks);

  this.changes = {
    tracks: {
      creates: [],
      updates: [],
      deletes: []
    },
    subtitles: {
      creates: [],
      updates: [],
      deletes: []
    }
  };

  this.bindEvents();

}

Editor.prototype = {

  setupElement: function() {
    this.$container = $("#main_container");
    var el =
      "<div id='editor'>" +
        "<div id='editor-top' class='row'>" +
          "<div class='span12'>" +
            "<h4 id='video_name'></h4>" +
            "<h6 id='video_url'></h6>" +
          "</div>" +
          "<div id='editor-top-left' class='span6'>" +
            "<div id='media_container'>" +
              "<div id='media'><div id='iframe_overlay'></div></div>" +
              "<div id='subtitle_bar' class='span6 center'>" +
                "<div id='subtitle_display'></div>" +
                "<input id='subtitle_edit' class='span5 center' type='text' placeholder='Enter Subtitle Here'>" +
              "</div>" +
              "<div id='controls' class='row'>" +
                "<div class='pull-left span1'>" +
                  "<button type='button' id='play_btn' class='btn'><i class='icon-play'></i></button>" +
                  "<button type='button' id='pause_btn' class='btn'><i class='icon-pause'></i></button>" +
                "</div>" +
                "<div class='btn-group pull-right'>" +
                  "<a id='save_btn' class='btn'><i class='icon-save'></i> Save</a>" +
                  "<a id='download_btn' class='btn' href='/songs/" + this.song.id + "/timings'><i class='icon-download-alt'></i> Download</a>" +
                  "<a data-toggle='modal' data-target='#myModal' class='btn'><i class='icon-question-sign'></i> Help</a>" +
                "</div>" +
              "</div>" +
            "</div>" +
          "</div>" +
          "<div id='editor-top-right' class='span6'>" +
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

    this.$subtitleDisplay = $("#subtitle_display");

    this.$subtitleEdit = $("#subtitle_edit");
    this.$subtitleEdit.hide();

    this.$iframeOverlay = $("#iframe_overlay");

    this.$video_name = $("#video_name");
    this.$video_name.text(this.song.name);

    this.$video_url = $("#video_url");
    this.$video_url.text(this.song.media_sources[0].url);
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
    $(document).on("trackstart",this.onTrackStart.bind(this));
    $(document).on("trackend",this.onTrackEnd.bind(this));
    $(document).on("trackchange",this.onTrackChange.bind(this));
    $(document).on("trackremove",this.onTrackRemove.bind(this));
    $(document).on("subtitleremove",this.onSubtitleRemove.bind(this));
    $(document).on("subtitledblclick",this.onSubtitleDblClick.bind(this));
    $(document).on("pauseadjust",this.onPauseAdjust.bind(this));
    this.$saveBtn.on("click",this.onSaveBtnClick.bind(this));
    this.$playBtn.on("click",this.onPlayBtnClick.bind(this));
    this.$pauseBtn.on("click",this.onPauseBtnClick.bind(this));
    this.$iframeOverlay.on("click",this.onIframeOverlayClick.bind(this));
    this.$subtitleEdit.on("focus",this.onSubtitleEditFocus.bind(this));
    this.$subtitleEdit.on("blur",this.onSubtitleEditBlur.bind(this));
    this.$subtitleEdit.on("keydown",this.onSubtitleEditKeydown.bind(this));
    this.$subtitleEdit.on("keyup",this.onSubtitleEditKeyup.bind(this));
    this.$subtitleDisplay.on("dblclick",this.onSubtitleDisplayDblClick.bind(this));
    this.media.addEventListener("pause",this.onPause.bind(this));
  },

  onKeydownHandler: function(event) {
    // shift key
    if (event.which === 16) {
      if (!this.isKeydownPressed) {
        if (!this.insideAnotherTrack()) {
          // console.log("ghost track gonna start");
          this.currentTrack = this.createGhostTrack();
          this.currentGhostTrack = this.currentTrack;
          this.$el.trigger("marktrackstart",[this.currentTrack]);
          this.ghostTrackStarted = true;
          this.isKeydownPressed = true;
        }
      }
    }
  },

  insideAnotherTrack: function() {
    if (this.currentTrack !== null) {
      if (this.media.currentTime >= this.currentTrack.startTime() && 
          this.media.currentTime <= this.currentTrack.endTime()) {
        return true;
      }
    }

    return false;  
  },

  onKeyupHandler: function(event) {
    // shift key
    if (event.which === 16) {
      try {
        if (this.ghostTrackStarted) {
          // console.log("ghost track gonna end");
          this.$el.trigger("marktrackend");
          this.endGhostTrack(this.currentGhostTrack);
          this.currentGhostTrack = null;
          this.ghostTrackStarted = false;
        }
        // this.$subtitleEdit.show();
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

  onPause: function(event) {
    if (this.edit_sub_mode) {
      // on edit subtitle mode, 2 cases:
      //1. ghost track has been ended and thus currentghosttrack is null, here we use currenttrack
      //2. ghost track has not been ended, and current track has changed to next one,
      //   this happens when a ghost track bumps right into next track and pause is triggered by its own end time
      //   but by the time pause happens, ghost track has overlapped next track and thus
      //   currenttrack changes to next track, we want to switch currenttrack back to unfinished ghost track, and seek
      //   to its end time
      this.currentTrack = this.currentGhostTrack || this.currentTrack;
      // we want to seek to a few millseconds before end just so 
      // 1. that the text from input would disappear triggered by the end event of track
      // 2. scrubber is positioned nicely inside track instead of a bit outside.
      //    this is to indicated were editing subtitle of that track
      var time = Math.floor((this.currentTrack.endTime() - 0.01) * 1000) / 1000;
      this.seek(time);
    }
  },

  onPauseAdjust: function(event,correctPauseTime) {
  },

  onSubtitleLineClick: function(event,subtitle) {
    this.seek(subtitle.track.startTime());
  },

  onTrackChange: function(track) {
    this.$saveBtn.removeAttr("disabled");
  },

  onTrackStart: function(event,track) {
    this.currentTrack = track;
    if (this.edit_sub_mode) {
      this.$subtitleEdit.focus();
    }

    this.showSubtitleInSubtitleBar(track.subtitle);
    track.subtitle.highlight();
  },

  onTrackEnd: function(event,track) {
    if (typeof track.subtitle.text === "undefined" || /^\s*$/.test(track.subtitle.text) ) {
      // if playing, pause playback to let user type subtitle
      if (!this.$pauseBtn.is(':hidden')) {
        this.$pauseBtn.trigger("click");
        // seeking will trigger trackEvent.start which will show subtitle edit input, only then do we focus
        // but we also want to avoid focus on normal trackEvent.start, so we only focus on case where user just ended 
        // the track and is about to edit sub
        this.edit_sub_mode = true;
      } 
    }

    this.hideSubtitleInSubtitleBar(track.subtitle);
    track.subtitle.unhighlight();
  },

  onTrackRemove: function(event,track) {
    // remove references to track that must be deleted
    var index = this.tracks.indexOf(track);
    delete this.trackMap[track.client_id];
    this.tracks.splice(index,1);

    // if track was previously saved to server, make sure to delete server side track as well
    if (typeof track.id !== "undefined") {
      this.changes["tracks"]["deletes"].push(track.id);
      this.$saveBtn.removeAttr("disabled");
    }

  },

  onSubtitleRemove: function(event,subtitleId) {
    // removing a subtitle that is not yet saved in server
    if (typeof subtitleId === "undefined") {
      return;  
    }
    this.changes["subtitles"]["deletes"].push(subtitleId);
    this.$saveBtn.removeAttr("disabled");
  },

  onIframeOverlayClick: function(event) {
    if (!this.$playBtn.is(':hidden')) {
      this.$playBtn.trigger("click");
    } else {
      this.$pauseBtn.trigger("click");
    }
  },

  onSubtitleEditFocus: function(event) {
    this.isKeydownPressed = false;
    $(document).off("keydown");
    $(document).off("keyup");
  },

  onSubtitleEditBlur: function(event) {
    $(document).on("keydown",this.onKeydownHandler.bind(this));
    $(document).on("keyup",this.onKeyupHandler.bind(this));
  },

  onSubtitleEditKeydown: function(event) {
    var text = this.$subtitleEdit.val();
    this.currentTrack.subtitle.setAttributes({ "text": text})
  },

  onSubtitleEditKeyup: function(event) {
    // enter key
    if (event.which == 13) {
      this.$subtitleEdit.blur();  
      var text = this.$subtitleEdit.val();
      this.$subtitleEdit.hide();  
      this.$subtitleDisplay.text(text);  
      this.$subtitleDisplay.show();  

      // will reach this state if user presses space_key until startTime of next track,
      // in which it immediately stops since ghostTrack ends at starttime of next track
      // but it is not stopped by explicit user action which would be to release space_key, we would have
      // known that track should end at that point and ghost status should be removed
      // 
      // thus, in this case, we automatically remove ghost status of the track knowing that it is 
      // the maximum endTime of the current track since it can't go beyond start time of next track
      if (this.currentTrack.isGhost()) {
        this.$el.trigger("marktrackend");
        this.currentTrack.end(this.currentTrack.endTime());
        this.ghostTrackStarted = false;
      }

      // if puased, resume playback 
      if (!this.$playBtn.is(':hidden')) {
        this.$playBtn.trigger("click");
      } 



      this.edit_sub_mode = false;
    }
  },

  onSubtitleDblClick: function(event) {
    if (!this.$pauseBtn.is(":hidden")) {
      this.$pauseBtn.trigger("click");
    }
    this.onSubtitleDisplayDblClick();
  },

  onSubtitleDisplayDblClick: function(event) {
    var text = this.$subtitleDisplay.text();  
    this.$subtitleEdit.val(text);
    this.$subtitleDisplay.hide();  
    this.$subtitleEdit.show();
    this.$subtitleEdit.focus();
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
    if (this.$saveBtn.attr("disabled") === "disabled") {
      return;
    } else {
      this.$saveBtn.attr("disabled","disabled");
    }

    // save subtitles
    // if (this.changes["subtitles"]["creates"].length > 0 ) {
    //   $.ajax({
    //     url: "/songs/" + this.song.id +"/subtitles",
    //     type: "POST",
    //     data: { subtitles: this.changes["subtitles"]["creates"].attributes },
    //     dataType: "json",
    //     success: function(data) {
    //       this.setSubtitleIds(data);
    //       this.$saveBtn.attr("disabled", "disabled");
    //     }.bind(this),
    //     error: function(data,e,i) {
    //       try {
    //         var result = JSON.parse(data);
    //         this.setSubtitleIds(result.created);
    //         alert(result.error);
    //       } catch (e) {
    //         alert(data.responseText);
    //       }
    //     }
    //   });
    // }

    // save timings and subtitles

    var track;
    for (var i = 0; i < this.tracks.length; i++) {
      track = this.tracks[i];
      // add track to creates/updates list
      if (!track.isSaved) {
        if (typeof track.getAttributes().id === "undefined") {
          this.changes["tracks"]["creates"].push(track);
        } else {
          this.changes["tracks"]["updates"].push(track);
        }
      } 
    };

    if (this.changes["tracks"]["creates"].length > 0 ) {
      $.ajax({
        url: "/songs/" + this.song.id +"/timings",
        type: "POST",
        data: { timings: $.map(this.changes["tracks"]["creates"],function(track){ return track.getAttributes(); } ) },
        dataType: "json",
        success: function(data) {
          this.setIds(data);
          this.$saveBtn.attr("disabled", "disabled");
        }.bind(this),
        error: function(data,e,i) {
          try {
            var result = JSON.parse(data);
            this.setIds(result.created);
            alert(result.error);
            this.$saveBtn.removeAttr("disabled");
          } catch (e) {
            alert(data.responseText);
          }
        }
      });
    }

    if (this.changes["tracks"]["updates"].length > 0 ) {
      $.ajax({
        url: "/songs/" + this.song.id +"/timings",
        type: "PUT",
        data: { timings: $.map(this.changes["tracks"]["updates"],function(track){ return track.getAttributes(); } ) },
        dataType: "json",
        success: function(timings) {
          for (var i = 0; i < timings.length; i++) {
            timings[i].isSaved = true;
          }
          this.$saveBtn.attr("disabled", "disabled");
        }.bind(this),
        error: function(data,e,i) {
          try {
            var result = JSON.parse(data);
            this.setIds(result.updated);
            alert(result.error);
            this.$saveBtn.removeAttr("disabled");
          } catch (e) {
            alert(data.responseText);
          }
        }
      });
    }

    if (this.changes["tracks"]["deletes"].length > 0 ) {
      $.ajax({
        url: "/songs/" + this.song.id +"/timings",
        type: "DELETE",
        data: { timings: this.changes["tracks"]["deletes"] },
        dataType: "json",
        success: function(timings) {
          this.$saveBtn.attr("disabled", "disabled");
        }.bind(this),
        error: function(data,e,i) {
          try {
            var result = JSON.parse(data);
            alert(result.error);
            this.$saveBtn.removeAttr("disabled");
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
        this.trackMap[track.getAttributes().client_id] = track;
        tracks.push(track);
      };
    }

    return tracks;
  },

  createGhostTrack: function() {
    var startTime = Math.round(this.media.currentTime * 1000) / 1000;
    var endTime   = this.determineEndTime(startTime);

    this.validateNoTrackOverlap(startTime,endTime);

    var attributes = {
      start_time: startTime,
      end_time: endTime
    };

    var track = new Track(attributes, this, { "isGhost": true});
    this.trackMap[track.getAttributes().client_id] = track;
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

  showSubtitleInSubtitleBar: function(subtitle) {

    if (typeof subtitle.text === "undefined" || /^\s*$/.test(subtitle.text) ) {
      this.$subtitleDisplay.hide();
      this.$subtitleEdit.val("");
      this.$subtitleEdit.show();
    } else {
      this.$subtitleEdit.hide();
      this.$subtitleDisplay.show();
      this.$subtitleDisplay.text(subtitle.text);
    }
  },

  hideSubtitleInSubtitleBar: function(subtitle) {
    if (typeof subtitle.text === "undefined" || /^\s*$/.test(subtitle.text) ) {
      this.$subtitleEdit.hide();
    } else {
      this.$subtitleDisplay.text("");
    }
  },

  // either the end of media or the starttime next nearest track
  determineEndTime: function(startTime) {
    var nextNearestEdgeTime = this.media.duration;

    for (var i = this.tracks.length - 1; i >= 0; i--) {
      if (this.tracks[i].startTime() > startTime && this.tracks[i].startTime() < nextNearestEdgeTime) {
        nextNearestEdgeTime = this.tracks[i].startTime();
      }
    };

    return nextNearestEdgeTime;
  },

  setIds: function(timings) {
    var track;
    for (var i = 0; i < timings.length; i++) {
      track = this.trackMap[timings[i].client_id];
      track.id = timings[i].id;
      track.subtitle.id = timings[i].subtitle.id;
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
