function Editor (video) {
  this.video = video;
  this.setupElement();
  this.defineAttributeAccessors();

  this.currentTrack = null;
  this.currentGhostTrack = null;
  this.ghostTrackStarted = false;

  this.subtitleView = new SubtitleView($.map(video.timings,function(timing){ return timing.subtitle; }),this);
  this.timeline = new Timeline();

  this.popcorn = this.loadMedia(video.media_sources[0].url);

  this.trackMap = {}
  this.tracks = this.loadTracks(video.timings);
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
                "<div id='subtitle_display' class='span5 center'></div>" +
                "<input id='subtitle_edit' class='span5 center' type='text' maxlength='60' placeholder='Enter Subtitle Here'>" +
              "</div>" +
              "<div id='controls' class='row'>" +
                "<div class='pull-left span1'>" +
                  "<button type='button' id='play_btn' class='btn'><i class='icon-play'></i></button>" +
                  "<button type='button' id='pause_btn' class='btn'><i class='icon-pause'></i></button>" +
                "</div>" +
                "<div class='btn-group pull-right'>" +
                  "<a id='start_timing_btn' class='btn'><i class='icon-circle'></i> Start Timing</a>" +
                  "<a id='stop_timing_btn' class='btn'><i class='icon-circle'></i> Stop Timing</a>" +
                  // "<a id='save_btn' class='btn'><i class='icon-save'></i> Save</a>" +
                  // "<a id='download_btn' class='btn' href='/videos/" + this.video.id + "/timings'><i class='icon-download-alt'></i> Download</a>" +
                  // "<a data-toggle='modal' data-target='#myModal' class='btn'><i class='icon-question-sign'></i> Help</a>" +
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

    this.$startTimingBtn = $("#start_timing_btn");
    this.$stopTimingBtn = $("#stop_timing_btn");
    this.$stopTimingBtn.hide();

    this.$subtitleDisplay = $("#subtitle_display");

    this.$subtitleEdit = $("#subtitle_edit");
    this.$subtitleEdit.hide();

    this.$iframeOverlay = $("#iframe_overlay");

    this.$video_name = $("#video_name");
    this.$video_name.text(this.video.name);

    this.$video_url = $("#video_url");
    this.$video_url.text(this.video.media_sources[0].url);
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
    $(document).on("keyup",this.onKeyupHandler.bind(this));
    $(document).on("timelineseek",this.onTimelineSeekHandler.bind(this));
    $(document).on("subtitlelineclick",this.onSubtitleLineClick.bind(this));
    $(document).on("subtitlelineedit",this.onSubtitleLineEdit.bind(this));
    $(document).on("subtitlelineblur",this.onSubtitleLineBlur.bind(this));
    $(document).on("subtitlelinekeyup",this.onSubtitleLineKeyup.bind(this));
    $(document).on("ghosttrackstart",this.onGhostTrackStart.bind(this));
    $(document).on("ghosttrackend",this.onGhostTrackEnd.bind(this));
    $(document).on("trackstart",this.onTrackStart.bind(this));
    $(document).on("trackend",this.onTrackEnd.bind(this));
    $(document).on("trackchange",this.onTrackChange.bind(this));
    $(document).on("trackremove",this.onTrackRemove.bind(this));
    $(document).on("subtitleremove",this.onSubtitleRemove.bind(this));
    $(document).on("pauseadjust",this.onPauseAdjust.bind(this));
    this.$saveBtn.on("click",this.onSaveBtnClick.bind(this));
    this.$playBtn.on("click",this.onPlayBtnClick.bind(this));
    this.$pauseBtn.on("click",this.onPauseBtnClick.bind(this));
    this.$startTimingBtn.on("click",this.onStartTimingBtn.bind(this));
    this.$stopTimingBtn.on("click",this.onStopTimingBtn.bind(this));
    this.$iframeOverlay.on("click",this.onIframeOverlayClick.bind(this));
    this.$subtitleEdit.on("focus",this.onSubtitleEditFocus.bind(this));
    this.$subtitleEdit.on("blur",this.onSubtitleEditBlur.bind(this));
    this.$subtitleEdit.on("keyup",this.onSubtitleEditKeyup.bind(this));
    this.$subtitleDisplay.on("dblclick",this.onSubtitleDisplayDblClick.bind(this));
    this.media.addEventListener("pause",this.onPause.bind(this));
    this.media.addEventListener("play",this.onPlay.bind(this));
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
      if (!this.ghostTrackStarted) {
      // first time, you start timing
        var track = this.createGhostTrack();
        if (track) {
          this.currentGhostTrack = this.currentTrack = track;
        }
      } else {
      // second time, you stop timing
        this.endGhostTrack(this.currentGhostTrack);
      }
    }

    // space key
    if (event.which === 32) {
      this.togglePlayPause();
    }
  },

  onTimelineSeekHandler: function(event,time) {
    this.seek(time);
  },

  onPlay: function(event) {
    this.$playBtn.hide();
    this.$pauseBtn.show();
  },

  onPause: function(event) {
    this.$pauseBtn.hide();
    this.$playBtn.show();

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

  onGhostTrackStart: function(event,track) {
    this.ghostTrackStarted = true;
    this.$startTimingBtn.hide();
    this.$stopTimingBtn.show();
  },

  onGhostTrackEnd: function(event,track) {
    this.ghostTrackStarted = false;
    this.$stopTimingBtn.hide();
    this.$startTimingBtn.show();
  },

  onTrackChange: function(track) {
    this.$saveBtn.removeAttr("disabled");
  },

  onTrackStart: function(event,track) {
    this.currentTrack = track;

    var subtitle = track.subtitle;

    if (typeof subtitle.text === "undefined" || /^\s*$/.test(subtitle.text) ) {
      if (!track.isGhost()) {
        this.$subtitleDisplay.hide();
        this.$subtitleEdit.val("");
        this.$subtitleEdit.show();
      }
    } else {
      this.showSubtitleInSubtitleBar(subtitle);
    }

    track.highlight();
    subtitle.highlight();

    if (this.edit_sub_mode) {
      // seeking will trigger trackEvent.start which will show subtitle edit input, only then do we focus
      // but we also want to avoid focus on normal trackEvent.start, so we only focus on case where user just ended
      // the track and is about to edit sub
      this.$subtitleEdit.focus();
    }

  },

  onTrackEnd: function(event,track) {
    this.hideSubtitleInSubtitleBar(track.subtitle);

    track.unhighlight();
    track.subtitle.unhighlight();

    if (typeof track.subtitle.text === "undefined" || /^\s*$/.test(track.subtitle.text) ) {
      // if playing, pause playback to let user type subtitle
      this.popcorn.pause();
      this.edit_sub_mode = true;
    }
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
    this.togglePlayPause();
  },

  togglePlayPause: function() {
    if (this.media.paused) {
      this.popcorn.play();  
    } else {
      this.popcorn.pause();  
    }
  },

  onSubtitleEditFocus: function(event) {
    this.disableCommands();
  },

  onSubtitleEditBlur: function(event) {
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
      if (this.currentTrack && this.currentTrack.isGhost()) {
        this.endGhostTrack(this.currentTrack);
        this.$subtitleDisplay.text("");
        this.$subtitleDisplay.hide();
      }

      this.edit_sub_mode = false;

      this.enableCommands();
  },

  onSubtitleLineEdit: function(event) {
    this.disableCommands();
  },

  onSubtitleLineBlur: function(event) {
    this.enableCommands();
  },

  enableCommands: function(event) {
    $(document).on("keyup",this.onKeyupHandler.bind(this));
  },

  disableCommands: function(event) {
    $(document).off("keydown");
    $(document).off("keyup");
  },

  onSubtitleEditKeyup: function(event) {
    // escape key
    if (event.which == 27) {
      this.currentTrack.remove();
      this.$subtitleEdit.blur();
    } 

    // enter key
    if (event.which == 13) {
      this.$subtitleEdit.blur();

      if (this.media.paused) this.popcorn.play();
    } 
    
    var text = this.$subtitleEdit.val();
    this.currentTrack.subtitle.setAttributes({ "text": text})
  },

  onSubtitleLineKeyup: function(event,text) {
    this.$subtitleDisplay.text(text);
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

  onStartTimingBtn: function(event) {
    var track = this.createGhostTrack();
    if (track) {
      this.currentGhostTrack = this.currentTrack = track;
    }
    this.popcorn.play();
  },

  onStopTimingBtn: function(event) {
    this.endGhostTrack(this.currentGhostTrack);
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
    //     url: "/videos/" + this.video.id +"/subtitles",
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
        url: "/videos/" + this.video.id +"/timings",
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
        url: "/videos/" + this.video.id +"/timings",
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
        url: "/videos/" + this.video.id +"/timings",
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
    if (this.insideAnotherTrack()) return null;

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

    this.$el.trigger("ghosttrackstart",[track]);
    return track;
  },

  endGhostTrack: function(track) {
    var time = Math.round(this.media.currentTime * 1000) / 1000;

    try {
      track.end(time);
    } catch (e) {
      console.log(e);
      console.log("Removing invalid track");
      this.currentGhostTrack.remove();
      this.currentTrack = null;
      this.tracks.pop();
      this.$subtitleEdit.hide();
    }
    this.currentGhostTrack = null;
    this.$el.trigger("ghosttrackend",[track]);
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

      this.$subtitleEdit.hide();
      this.$subtitleDisplay.show();
      this.$subtitleDisplay.text(subtitle.text);
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
