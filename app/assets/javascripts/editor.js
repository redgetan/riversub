function Editor (repo,options) {
  this.repo = repo || {};
  this.video = this.repo.video || {};
  this.user = this.repo.user || {};
  
  this.options = options || {};
  var timings = this.repo.timings || [];
  var subtitles = $.map(timings,function(timing){ return timing.subtitle; });
  var mediaSource = typeof this.video.url === "undefined" ? "" : this.video.url;

  var targetSelector = this.options["targetSelector"] || "div#media";

  this.setupElement();
  this.defineAttributeAccessors();

  this.popcorn = this.loadMedia(targetSelector,mediaSource);
  this.popcorn.volume(0.2);

  this.subtitleView = new SubtitleView(subtitles);
  this.timeline = new Timeline();
  this.timeline.setMedia(this.popcorn.media);

  this.trackMap = {}
  this.tracks = this.loadTracks(timings);
  this.timeline.setTracks(this.tracks);

  this.currentTrack = null;
  this.currentGhostTrack = null;
  this.ghostTrackStarted = false;
  this.isOnSubtitleEditMode = false;

  this.changes = {
    tracks: {
      creates: [],
      updates: [],
      deletes: []
    }
  };

  this.bindEvents();

  // initally commands are disabled/ enabled only when things are loaded
  this.disableCommands();
}

Editor.prototype = {

  setupElement: function() {
    this.$container = $("#main_container");

    this.$el = $("#editor");

    this.$subtitleBar = $("#subtitle_bar");

    this.$playBtn = $("#play_btn");
    this.$pauseBtn = $("#pause_btn");
    this.$pauseBtn.hide();

    this.$startTimingBtn = $("#start_timing_btn");
    this.$startTimingBtn.attr("disabled","disabled");

    this.$stopTimingBtn = $("#stop_timing_btn");
    this.$stopTimingBtn.hide();

    this.$saveBtn = $("#save_btn");
    this.$saveBtn.attr("disabled","disabled");
    this.$saveBtn.tooltip({title: "Save changes"});

    this.$downloadBtn = $("#download_btn");
    this.$downloadBtn.tooltip({title: "Download subtitle file in .srt format"});
    this.$helpBtn = $("#help_btn");
    this.$helpBtn.tooltip({title: "Help"});
    this.$helpBtn.popover({content: "Click Here for Instructions", placement: "top", trigger: "manual"});
    this.$helpBtn.on("click",function() {
      $(this).popover("hide");
    });

    this.$subtitleDisplay = $("#subtitle_display");

    this.$subtitleEdit = $("#subtitle_edit");
    this.$subtitleEdit.hide();

    this.$iframeOverlay = $("#iframe_overlay");

    this.$video_name = $("#video_name");

    this.$video_url = $("#video_url");
  },

  guideUser: function() {
    this.$helpBtn.popover("show");
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

  loadMedia: function(targetSelector,url) {
    var popcorn;
    if (url == "") {
      popcorn = Popcorn(targetSelector);
    } else {
      popcorn = Popcorn.smart(targetSelector,url);
    }
    return popcorn;
  },

  bindEvents: function() {
    $(document).on("click",this.onDocumentClick.bind(this));
    $(document).on("mousewheel",this.onDocumentScroll.bind(this));
    $(document).on("keyup",this.onKeyupHandler.bind(this));
    $(document).on("timelineseek",this.onTimelineSeekHandler.bind(this));
    $(document).on("trackseek",this.onTrackSeekHandler.bind(this));
    $(document).on("subtitleeditmode",this.onSubtitleEditMode.bind(this));
    $(document).on("subtitlelineclick",this.onSubtitleLineClick.bind(this));
    $(document).on("subtitlelinedblclick",this.onSubtitleLineDblClick.bind(this));
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
    this.media.addEventListener("loadedmetadata",this.onLoadedMetadata.bind(this));
    this.media.addEventListener("timeupdate",this.onTimeUpdate.bind(this));
  },

  onDocumentClick: function(event) {
    if ($(event.target).attr("id") !== "subtitle_edit" && !$(event.target).hasClass("track")) {
      this.$subtitleEdit.hide(0,function(){
        this.isOnSubtitleEditMode = false;
      }.bind(this));
      this.$subtitleDisplay.show();
    }
  },

  onDocumentScroll: function(event,delta) { 
    // disallow horizontal scroll
    if (event.originalEvent.wheelDeltaX !== 0) {
      event.preventDefault();
    }
  },

  getSecondsFromCurrentPosition: function($target,eventPageX) {
    $container = this.$progress_bar;

    var containerX = $container.position().left;
    var posX = eventPageX - containerX;
    var seconds = posX / this.resolution($container);
    seconds = Math.round(seconds * 1000) / 1000;
    return seconds;
  },

  // how many pixels per second
  resolution: function($container) {
    var widthPixel = $container.width();
    var widthSeconds = this.media.duration;

    return widthPixel / widthSeconds ;
  },

  onTimeUpdate: function(event) {
    this.lastTimeUpdateTime = this.media.currentTime;
  },

  // given container, element, and time position you want to position element on, it will
  // position element on container on appropriate pixel location
  renderInContainer: function($container,$el,property) {

    for (var key in property) {
      if (key === "text") {
        $el.text(property[key]);
      } else {
        $el.css(key, this.resolution($container) * property[key]);
      }
    }

  },

  onKeyupHandler: function(event) {
    // shift key
    if (event.which === 16) {
      if (!this.ghostTrackStarted) {
      // first time, you start timing
        try {
          this.createGhostTrack();
          this.popcorn.play();
        } catch(e) {
          console.log(e);  
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

    // escape key
    if (event.which == 27) {
      if (this.currentGhostTrack) {
        this.currentGhostTrack.remove();
        this.currentTrack = null;
        this.currentGhostTrack = null;
      }  
    }
  },

  onTimelineSeekHandler: function(event,time) {
    this.seek(time);
  },

  onTrackSeekHandler: function(event,time) {
    this.seek(time);
  },

  onPlay: function(event) {
    this.$playBtn.hide();
    this.$pauseBtn.show();
  },

  onPause: function(event) {
    this.seek(this.lastTimeUpdateTime);
    this.$pauseBtn.hide();
    this.$playBtn.show();
  },

  onLoadedMetadata: function(event) {
    this.$startTimingBtn.removeAttr("disabled");
    this.enableCommands();
  },

  onPauseAdjust: function(event,correctPauseTime) {
  },

  onSubtitleLineClick: function(event,subtitle) {
    this.seek(subtitle.track.startTime());
  },

  onSubtitleLineDblClick: function(event,subtitle) {
    this.popcorn.pause();
    subtitle.openEditor(event);
  },

  onSubtitleEditMode: function(event,track) {
    // can only get triggered one at a time
    // console.log("IS ON SUB EDIT MODE: " + this.isOnSubtitleEditMode);
    if (this.isOnSubtitleEditMode) return;

    // set the lock flag
    this.isOnSubtitleEditMode = true;

    this.$subtitleEdit.data("track",track);

    this.ensurePauseAtTrack(track,function() {
      this.showSubtitleEdit(track);
    }.bind(this));

  },

  showSubtitleEdit: function(track) {
    // console.log("show edit");
    // get subtitle text to edit
    var text = track.subtitle.text || "";

    // display the text in input
    this.$subtitleEdit.val(text);


    // make sure sub display is hidden
    this.$subtitleDisplay.hide();

    // show the input bar
    this.$subtitleEdit.show();
    this.$subtitleEdit.focus();
    this.$subtitleEdit.effect("highlight", { color: "moccasin" },1000);
  },

  onGhostTrackStart: function(event,track) {
    this.ghostTrackStarted = true;
    this.currentGhostTrack = track;
    this.$startTimingBtn.hide();
    this.$stopTimingBtn.show();
  },

  onGhostTrackEnd: function(event,track) {
    this.ghostTrackStarted = false;
    this.currentGhostTrack = null
    this.$stopTimingBtn.hide();
    this.$startTimingBtn.show();
    track.fadingHighlight();
  },

  onTrackChange: function(track) {
    this.$saveBtn.removeAttr("disabled");
  },

  onTrackStart: function(event,track) {
    this.currentTrack = track;

    var subtitle = track.subtitle;
    track.highlight();
    subtitle.highlight();

    if (typeof subtitle.text === "undefined" || /^\s*$/.test(subtitle.text) ) {
      if (!track.isGhost()) {
        this.popcorn.pause();
        track.$el_expanded.trigger("subtitleeditmode",[track]);
      }
    } else {
      this.showSubtitleInSubtitleBar(subtitle);
    }
  },

  onTrackEnd: function(event,track) {
    this.currentTrack = null;

    this.hideSubtitleInSubtitleBar();

    track.unhighlight();
    track.subtitle.unhighlight();
    track.subtitle.hideEditorIfNeeded();

    if (typeof track.subtitle.text === "undefined" || /^\s*$/.test(track.subtitle.text) ) {
      if (track.isGhost()) {
        // will reach this state if user presses space_key until startTime of next track,
        // in which it immediately stops since ghostTrack ends at starttime of next track
        // but it is not stopped by explicit user action which would be to release space_key, we would have
        // known that track should end at that point and ghost status should be removed
        //
        // thus, in this case, we automatically remove ghost status of the track knowing that it is
        // the maximum endTime of the current track since it can't go beyond start time of next track
        var endTime = Math.floor(this.media.currentTime * 1000) / 1000;
        var overlapTracks = this.getOverlapTracks(track.startTime(),endTime,track);

        if (overlapTracks.length != 0) {
          endTime = track.endTime();
        }

        this.endGhostTrack(track,endTime);
      } 
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

  onSubtitleRemove: function(event,subtitle) {
    // remove references that must be deleted
    var index = this.subtitleView.subtitles.indexOf(subtitle);
    this.subtitleView.subtitles.splice(index,1);

    // if subtitle was previously saved to server, make sure to delete server side as well
    if (typeof subtitleId !== "undefined") {
      this.changes["subtitles"]["deletes"].push(subtitle.id);
      this.$saveBtn.removeAttr("disabled");
    }
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
    if (this.$subtitleEdit.is(":visible")) {
      this.disableCommands();
    }
  },

  onSubtitleEditBlur: function(event) {
    // console.log("subEdit BLUR");

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
    this.$startTimingBtn.removeAttr("disabled");
  },

  disableCommands: function(event) {
    $(document).off("keydown");
    $(document).off("keyup");
    this.$startTimingBtn.attr("disabled","disabled");
  },

  onSubtitleEditKeyup: function(event) {
    var text  = this.$subtitleEdit.val();
    var track = this.$subtitleEdit.data("track");

    track.subtitle.setAttributes({ "text": text});
    this.$subtitleDisplay.text(text);

    // escape key
    if (event.which == 27) {
      this.isOnSubtitleEditMode = false;
      this.$subtitleEdit.blur();
      this.$subtitleEdit.hide();
      this.$subtitleDisplay.show();
      this.popcorn.play();
    } 

    // enter key
    if (event.which == 13) {
      this.isOnSubtitleEditMode = false;
      this.$subtitleEdit.blur();
      this.$subtitleEdit.hide();
      this.$subtitleDisplay.show();
      this.popcorn.play();
    } 
  },

  onSubtitleLineKeyup: function(event,text) {
    this.$subtitleDisplay.text(text);
  },

  onSubtitleDisplayDblClick: function(event) {
    var $target = $(event.target);

    $target.trigger("subtitleeditmode",[this.currentTrack]);
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
    if (this.$startTimingBtn.attr("disabled") == "disabled") return;

    try {
      this.createGhostTrack();
      this.popcorn.play();
    } catch(e) {
      console.log(e);  
    }
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
        url: "/repositories/" + this.repo.id +"/timings",
        type: "POST",
        data: { timings: $.map(this.changes["tracks"]["creates"],function(track){ return track.getAttributes(); } ) },
        dataType: "json",
        success: function(data) {
          this.setIds(data);
          this.$saveBtn.attr("disabled", "disabled");
          this.changes["tracks"]["creates"] = [];
        }.bind(this),
        error: function(data,e,i) {
          try {
            var result = JSON.parse(data);
            this.setIds(result.created);
            alert(result.error);
            this.$saveBtn.removeAttr("disabled");
          } catch (e) {
            alert("Failed to save changes");
          }
          this.changes["tracks"]["creates"] = [];
        }
      });
    }

    if (this.changes["tracks"]["updates"].length > 0 ) {
      $.ajax({
        url: "/repositories/" + this.repo.id +"/timings",
        type: "PUT",
        data: { timings: $.map(this.changes["tracks"]["updates"],function(track){ return track.getAttributes(); } ) },
        dataType: "json",
        success: function(timings) {
          for (var i = 0; i < timings.length; i++) {
            timings[i].isSaved = true;
          }
          this.$saveBtn.attr("disabled", "disabled");
          this.changes["tracks"]["updates"] = [];
        }.bind(this),
        error: function(data,e,i) {
          try {
            var result = JSON.parse(data);
            this.setIds(result.updated);
            alert(result.error);
            this.$saveBtn.removeAttr("disabled");
          } catch (e) {
            alert("Failed to save changes");
          }
          this.changes["tracks"]["updates"] = [];
        }
      });
    }

    if (this.changes["tracks"]["deletes"].length > 0 ) {
      $.ajax({
        url: "/repositories/" + this.repo.id +"/timings",
        type: "DELETE",
        data: { timings: this.changes["tracks"]["deletes"] },
        dataType: "json",
        success: function(timings) {
          this.$saveBtn.attr("disabled", "disabled");
          this.changes["tracks"]["deletes"] = [];
        }.bind(this),
        error: function(data,e,i) {
          try {
            var result = JSON.parse(data);
            alert(result.error);
            this.$saveBtn.removeAttr("disabled");
          } catch (e) {
            alert("Failed to save changes");
          }
          this.changes["tracks"]["deletes"] = [];
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
        var track = new Track(timings[i], this.popcorn, { isSaved: true });
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

    var track = new Track(attributes, this.popcorn, { "isGhost": true});
    this.trackMap[track.getAttributes().client_id] = track;
    this.tracks.push(track);

    this.$el.trigger("ghosttrackstart",[track]);

    return track;
  },

  endGhostTrack: function(track,endTime) {
    var time = endTime || Math.round(this.media.currentTime * 1000) / 1000;

    try {
      track.end(time);
    } catch (e) {
      console.log(e);
      console.log("Removing invalid track");
      this.currentGhostTrack.remove();
      this.$subtitleEdit.hide(0,function(){
        this.isOnSubtitleEditMode = false;
      }.bind(this));
    }
    this.requestSubtitleFromUser(track);

    this.$el.trigger("ghosttrackend",[track]);

  },



  requestSubtitleFromUser: function(track) {
    if (track.initial_subtitle_request && !track.isDeleted) {
      track.initial_subtitle_request = false;
      track.$el_expanded.trigger("subtitleeditmode",[track]);
    }
  },

   /* When you're timing a track while media is playing, and you're very near the start of next track, 
   *   pausing might result in scrubber being inside next track since pausing is not immediate (it takes a few millisec
   * This function would ensure that pausing would stop at current track
   * Would only run if media is currently playing, if its paused, don't do anything
   */
  ensurePauseAtTrack: function(track,callback) {
    if (this.popcorn.paused()) {
      callback();
      return;
    }

    var seekBackToTrack = function() {
      // make sure to remove this callback
      this.media.removeEventListener("pause",seekBackToTrack);

      // console.log("[seeking] curr_track: " + this.currentTrack + " - track: " + track);
      // check if track that we want to pause  at is same as this.currentTrack
      // if not, seek back to track
      if (track !== this.currentTrack) {
        var executeCallback = function() {
          this.popcorn.off("seeked",executeCallback);
          callback();
        }.bind(this);

        this.popcorn.on("seeked",executeCallback);

        var timeSlightlyBeforeTrackEnd = Math.floor((track.endTime() - 0.01) * 1000) / 1000;
        this.seek(timeSlightlyBeforeTrackEnd);
      } else {
        callback();
      }

    }.bind(this);

    this.media.addEventListener("pause",seekBackToTrack);

    // if playing, pause playback to let user type subtitle

    this.popcorn.pause();
  }, 

    /*
   *   startTime should not be less than any existing track endTime
   *   endTime should not be greater than any existing track startTime
   */
  validateNoTrackOverlap: function(startTime,endTime,track) {
    var tracks = this.getOverlapTracks(startTime,endTime,track) ;

    if (tracks.length != 0) {
      throw "Track Overlap Detected. Track(" + startTime + "," + endTime + ") " +
        "would overlap with " + $.map(tracks,function(track) { return track.toString(); });
    }
  },

  getOverlapTracks: function(startTime,endTime,track) {
    var tracks = [];

    for (var i = this.tracks.length - 1; i >= 0; i--) {
      var curr = this.tracks[i];
      if (curr !== track) {
        // console.log("start: " + startTime + " end: " + endTime + " curr: " + curr);
        if (curr.startTime() <= startTime && startTime < curr.endTime() ||
            startTime   <= curr.startTime()  && curr.startTime() < endTime) {
          tracks.push(curr);
        }
      }
    }

    // console.log("track overlap: [ " + tracks + "] start: " + startTime + " end: " + endTime);

    return tracks;
  },

  showSubtitleInSubtitleBar: function(subtitle) {
    // console.log("show sub display");
    if (this.$subtitleEdit.is(':visible')) {
      this.$subtitleEdit.hide(0,function(){
        this.isOnSubtitleEditMode = false;
      }.bind(this));
    }
    this.$subtitleDisplay.show();
    this.$subtitleDisplay.text(subtitle.text);
  },

  hideSubtitleInSubtitleBar: function(subtitle) {
    this.$subtitleDisplay.text("");
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
  },

  stringifyTime: function(time) {
    time = Math.round(time * 1000) / 1000;

    var hours = parseInt( time / 3600 ) % 24;
    var minutes = parseInt( time / 60 ) % 60;
    var seconds = Math.floor(time % 60);
    var milliseconds = Math.floor(time * 1000) % 1000

    var result = (hours < 10 ? "0" + hours : hours) + ":" + 
                 (minutes < 10 ? "0" + minutes : minutes) + ":" + 
                 (seconds  < 10 ? "0" + seconds : seconds) + "." +
                 (milliseconds  < 10 ? "00" + milliseconds : (milliseconds < 100 ? "0" + milliseconds : milliseconds)); 
    return result;
  }
}
