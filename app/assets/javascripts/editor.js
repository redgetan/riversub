function Editor (repo,options) {
  this.repo = repo || {};
  this.video = this.repo.video || {};
  this.user = this.repo.user || {};

  this.currentTrack = null;
  this.currentGhostTrack = null;
  this.isGhostTrackStarted = false;
  this.isOnSubtitleEditMode = null;

  this.options = options || {};
  var timings = this.repo.timings || [];
  var mediaSource = typeof this.video.url === "undefined" ? "" : this.video.url;

  this.setupElement();
  this.defineAttributeAccessors();

  this.popcorn = this.loadMedia(mediaSource);
  this.popcorn.volume(0.2);

  this.repository = new Repository(repo);

  this.subtitles = new SubtitleSet();
  this.timeline = new Timeline(this.popcorn.media);

  this.tracks = this.repository.tracks;
  this.loadTracks(timings);
  this.timeline.setTracks(this.tracks);

  this.bindEvents();

  // initally commands are disabled/ enabled only when things are loaded
  this.disableCommands();
}

Editor.prototype = {

  setupElement: function() {
    this.$container = this.options["container"] || $("#main_container");

    var el = "<div class='container'>" +
              "<div id='editor'> " +
                "<div id='editor-top' class='row'> " +
                  "<div class='span12'> " +
                    "<h5 id='repo_label'>" +
                      "<a href=" + this.repo.url + ">" + this.repo.video.name + "</a>" +
                    "</h5>" +
                    // "<h6 id='video_url'>" +
                    //   "<a href=" + this.repo.video.url + ">" + this.repo.video.url + "</a>" +
                    // "</h6> " +
                  "</div> " +
                  "<div class='span12'> " +
                    "<div id='media_container'> " +
                      "<div id='subtitle_bar' class='span12 center'> " +
                        "<span id='subtitle_display' class='span5 center'></span> " +
                        "<input id='subtitle_edit' class='span5 center' type='text' maxlength='60' placeholder='Enter Subtitle Here'> " +
                      "</div> " +
                      "<div id='time_float'></div>" +
                      "<div id='seek_head'>" +
                        "<div id='seek_head_corner'></div>" +
                        "<div id='seek_head_body'></div>" +
                      "</div>" +
                    "</div> " +
                  "</div> " +
                  // "<div id='editor-top-right' class='span6'> " +
                  // "</div> " +
                "</div> " +
                "<div id='editor-bottom' class='row'> " +
                  "<div class='span12'> " +
                    "<ul class='nav nav-tabs span5'>" +
                      "<li class='active'><a href='#timeline_tab' data-toggle='tab'>Timeline</a></li>" +
                      "<li><a href='#subtitle_tab' data-toggle='tab'>Subtitle</a></li>" +
                      "<li><a href='#download_tab' data-toggle='tab'>Download</a></li>" +
                    "</ul>" +
                    "<div id='controls' class='span7'> " +
                      // "<div class='pull-left span1'> " +
                      //   "<button type='button' id='play_btn' class='btn'><i class='icon-play'></i></button> " +
                      //   "<button type='button' id='pause_btn' class='btn'><i class='icon-pause'></i></button> " +
                      // "</div> " +
                      // "<div class='pull-left span3 offset4'> " +
                        // "<ul class='nav nav-tabs btn-group'>" +
                        //   "<button href='#timeline_tab' class='btn' type='button' data-toggle='tab'>Timeline</button>" +
                        //   "<button href='#subtitle_tab' class='btn' type='button' data-toggle='tab'>Subtitle</button>" +
                        // "</ul>" +
                      // "</div> " +
                      "<div class='btn-group pull-right'> " +
                        "<a id='start_timing_btn' class='btn'><i class='icon-circle'></i> Start Timing</a> " +
                        "<a id='stop_timing_btn' class='btn'><i class='icon-circle'></i> Stop</a> " +
                        "<a id='help_btn' data-toggle='modal' data-target='#instructions_modal' class='btn'><i class='icon-question-sign'></i></a> " +
                      "</div> " +
                      // "<div class='btn-group pull-right'> " +
                      // "</div> " +
                    "</div> " +
                  "</div> " + // .span12

                  "<div class='span12'> " +
                    "<div class='tab-content'>" +
                      "<div class='tab-pane active' id='timeline_tab'>" +

                        "<div id='timeline_container'>" +
                        "</div> " +

                      "</div>" +
                      "<div class='tab-pane' id='subtitle_tab'>" +

                        "<div id='subtitle_container'> " +
                          "<div id='subtitle_list'></div> " +
                            // "<div class='pull-left'> " +
                            //   "<a id='add_subtitle_btn' class='btn'><i class='icon-plus'></i> Add</a> " +
                            // "</div> " +
                            // "<span class='pull-left '> " +
                            //   "<select id='language_select' data-style='btn-inverse' class='selectpicker span2'>" +
                            //     "<option>Portuguese</option>" +
                            //     "<option>Japanese</option>" +
                            //   "</select>" +
                            // "</span> " +
                        "</div> " +   // #subtitle_container

                      "</div>" +   // tab pane
                      "<div class='tab-pane' id='download_tab'>" +
                        "<div id='download_container'> " +
                          "<a id='download_btn' href='" + this.repo.subtitle_download_url + "'>" + this.repo.filename + "</a> " +
                        "</div> " +   // #subtitle_container
                      "</div>" +   // tab pane
                    "</div>" +     // tab content

                  "</div> " + // .span12
                  "<div class='span12'> " +
                          "<div class='row'> " +
                            "<div id='status-bar' class='span3'> " +
                            "</div> " +
                            "<div id='keyboard-shortcuts' class='span9'> " +
                              "<span class='pull-right'>" +
                                "<b>Keyboard Shortcuts: </b>  " +
                                "<kbd class='light'>Shift</kbd> Start/Stop Timing " +
                                "<kbd class='light'>Space</kbd> Play/Pause" +
                                "<kbd class='light'>Esc</kbd>   Cancel " +
                              "</span>" +
                            "</div> " +
                          "</div> " +
                  "</div> " + // .span12

                "</div> " +   // #editor-bottom.row
              "</div>" +  // #editor
            "</div>";  // container

    this.$container.append(el);
    this.$el = $("#editor");

    if (this.repo.user) {
      var repo_owner = "<span id='repo_owner'>" +
                         "<a href='" + this.repo.owner_profile_url + "'>" + this.repo.owner + "</a>" +
                       "</span> / ";
      this.$el.find("#repo_label").prepend(repo_owner);
    }

    var media = this.options["media"] || "<div id='iframe_container'>" +
                                             "<div id='overlay_btn'><i class='icon-play'></i></div>" +
                                           "<div id='iframe_overlay'>" +
                                           "</div>" +
                                           "<div id='media'></div>" +
                                         "</div> ";

    this.$container.find("#media_container").prepend(media);

    this.$subtitleBar = $("#subtitle_bar");

    this.$playBtn = $("#play_btn");
    this.$pauseBtn = $("#pause_btn");
    this.$pauseBtn.hide();

    this.$startTimingBtn = $("#start_timing_btn");
    this.$startTimingBtn.attr("disabled","disabled");

    this.$stopTimingBtn = $("#stop_timing_btn");
    this.$stopTimingBtn.hide();

    this.$addSubtitleBtn = $("#add_subtitle_btn");

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
    this.$overlay_btn = $("#overlay_btn");

    this.$video_name = $("#video_name");

    this.$video_url = $("#video_url");

    this.$language_select = $('#language_select');
    this.$language_select.selectpicker();

    this.$keyboard_shortcuts = $("#keyboard-shortcuts");
    this.$status_bar = $("#status-bar");
  },


  resetState: function(callback) {
    this.clearTracks();
    this.currentTrack = null;
    this.currentGhostTrack = null;
    this.isGhostTrackStarted = false;
    this.isOnSubtitleEditMode = null;
    this.pause(function(){
      this.seek(0,function(){
        if (typeof callback !== "undefined") {
          callback();
        }
      });
    }.bind(this));
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

  loadMedia: function(url) {
    var popcorn;
    if (url == "") {
      popcorn = Popcorn("#media");
    } else {
      popcorn = Popcorn.smart("#media",url);
    }
    return popcorn;
  },

  bindEvents: function() {
    $(document).on("click",this.onDocumentClick.bind(this));
    $(document).on("mousewheel",this.onDocumentScroll.bind(this));
    $(document).on("keyup",this.onKeyupHandler.bind(this));

    Backbone.on("timelineseek",this.onTimelineSeekHandler.bind(this));
    Backbone.on("trackseek",this.onTrackSeekHandler.bind(this));
    Backbone.on("subtitleeditmode",this.onSubtitleEditMode.bind(this));
    Backbone.on("subtitlelineclick",this.onSubtitleLineClick.bind(this));
    Backbone.on("subtitlelinedblclick",this.onSubtitleLineDblClick.bind(this));
    Backbone.on("subtitlelineedit",this.onSubtitleLineEdit.bind(this));
    Backbone.on("subtitlelineblur",this.onSubtitleLineBlur.bind(this));
    Backbone.on("subtitlelinekeyup",this.onSubtitleLineKeyup.bind(this));
    Backbone.on("ghosttrackstart",this.onGhostTrackStart.bind(this));
    Backbone.on("ghosttrackend",this.onGhostTrackEnd.bind(this));
    Backbone.on("trackstart",this.onTrackStart.bind(this));
    Backbone.on("trackend",this.onTrackEnd.bind(this));
    Backbone.on("trackremove",this.onTrackRemove.bind(this));
    Backbone.on("pauseadjust",this.onPauseAdjust.bind(this));
    Backbone.on("trackrequest",this.onTrackRequest.bind(this));
    Backbone.on("trackrequestsuccess",this.onTrackRequestSuccess.bind(this));
    Backbone.on("trackrequesterror",this.onTrackRequestError.bind(this));

    this.$addSubtitleBtn.on("click",this.onAddSubtitleBtnClick.bind(this));
    this.$playBtn.on("click",this.onPlayBtnClick.bind(this));
    this.$pauseBtn.on("click",this.onPauseBtnClick.bind(this));
    this.$startTimingBtn.on("click",this.onStartTimingBtn.bind(this));
    this.$stopTimingBtn.on("click",this.onStopTimingBtn.bind(this));
    this.$iframeOverlay.on("click",this.onIframeOverlayClick.bind(this));
    this.$iframeOverlay.on("mouseenter",this.onIframeOverlayMouseEnter.bind(this));
    this.$iframeOverlay.on("mouseleave",this.onIframeOverlayMouseLeave.bind(this));
    this.$subtitleEdit.on("focus",this.onSubtitleEditFocus.bind(this));
    this.$subtitleEdit.on("blur",this.onSubtitleEditBlur.bind(this));
    this.$subtitleEdit.on("keyup",this.onSubtitleEditKeyup.bind(this));
    this.$subtitleDisplay.on("dblclick",this.onSubtitleDisplayDblClick.bind(this));
    this.media.addEventListener("pause",this.onPause.bind(this));
    this.media.addEventListener("play",this.onPlay.bind(this));
    this.media.addEventListener("loadedmetadata",this.onLoadedMetadata.bind(this));
    this.media.addEventListener("timeupdate",this.onTimeUpdate.bind(this));

    $('a[data-toggle="tab"]').on('shown', this.onTabShown.bind(this));
  },

  onTabShown: function(event) {

  },

  onDocumentClick: function(event) {
    if ($(event.target).attr("id") !== "subtitle_edit" && !$(event.target).hasClass("track")) {
      this.$subtitleEdit.hide(0,function(){
        this.isOnSubtitleEditMode = null;
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
      this.timeSubtitle();
    }

    // space key
    if (event.which === 32) {
      this.togglePlayPause();
    }

    // escape key
    if (event.which == 27) {
      this.cancelGhostTrack();
    }
  },

  cancelGhostTrack: function() {
    this.lastTrack = null;
    this.isGhostTrackStarted = false;

    var track = this.currentGhostTrack;
    if (track) {
      track.remove();
    }
  },

  timeSubtitle: function() {
    if (!this.isGhostTrackStarted) {
    // first time, you start timing
      this.safeCreateGhostTrack();
      this.play();
    } else {
      // second time, you stop timing
      var track = this.currentGhostTrack;
      this.safeEndGhostTrack(track);
      this.requestSubtitleFromUser(track);
    }
  },

  onTimelineSeekHandler: function(time) {
    this.seek(time);
  },

  onTrackSeekHandler: function(time) {
    this.seek(time);
  },

  onPlay: function(event) {
    // this.$playBtn.hide();
    // this.$pauseBtn.show();
    this.$overlay_btn.find("i").removeClass("icon-play");
    this.$overlay_btn.find("i").addClass("icon-pause");
    // if ($("#expanded:hover").length === 0) {
    //   this.$overlay_btn.hide();
    // }
  },

  onPause: function(event) {
    this.seek(this.lastTimeUpdateTime);
    // this.$pauseBtn.hide();
    // this.$playBtn.show();
    this.$overlay_btn.find("i").removeClass("icon-pause");
    this.$overlay_btn.find("i").addClass("icon-play");
  },

  onLoadedMetadata: function(event) {
    this.$startTimingBtn.removeAttr("disabled");
    this.enableCommands();
    Backbone.trigger("editor.ready");
  },

  onPauseAdjust: function(correctPauseTime) {
  },

  onTrackRequest: function() {
    this.$status_bar.text("Saving...");
  },

  onTrackRequestSuccess: function() {
    setTimeout(function(){ this.$status_bar.text(""); }.bind(this),500);
  },

  onTrackRequestError: function() {
    this.$status_bar.text("Save Failed");
    setTimeout(function(){ this.$status_bar.text(""); }.bind(this),500);
  },

  onSubtitleLineClick: function(subtitle) {
    this.seek(subtitle.track.startTime());
  },

  onSubtitleLineDblClick: function(subtitle) {
    this.pause();
  },

  onSubtitleEditMode: function(track) {
    // can only get triggered one at a time unless its a different track
    if (this.isOnSubtitleEditMode && track === this.currentTrack ) return;

    // set the lock flag
    this.isOnSubtitleEditMode = track;

    this.$subtitleEdit.data("track",track);

    this.ensurePauseAtTrack(track,function() {
      this.showSubtitleEdit(track);
    }.bind(this));

  },

  showSubtitleEdit: function(track) {
    // console.log("show edit");
    // get subtitle text to edit
    var text = track.subtitle.get("text") || "";

    // display the text in input
    this.$subtitleEdit.val(text);


    // make sure sub display is hidden
    this.$subtitleDisplay.hide();

    // show the input bar
    this.$subtitleEdit.show();
    this.$subtitleEdit.focus();
    this.$subtitleEdit.effect("highlight", { color: "moccasin" },1000);
  },

  onGhostTrackStart: function(track) {
    this.isGhostTrackStarted = true;
    this.currentGhostTrack = track;
    this.$startTimingBtn.hide();
    this.$stopTimingBtn.show();
    this.$addSubtitleBtn.attr("disabled","disabled");
  },

  onGhostTrackEnd: function(track) {
    this.isGhostTrackStarted = false;
    this.currentGhostTrack = null;
    this.currentTrack = null;
    this.$stopTimingBtn.hide();
    this.$startTimingBtn.show();
    this.$addSubtitleBtn.removeAttr("disabled");
    track.fadingHighlight();
    track.save();
  },

  play: function() {
    this.popcorn.play();
  },

  pause: function(callback) {

    if (typeof callback !== "undefined") {
      if (this.popcorn.paused()) {
        callback();
        return;
      }

      var executeCallback = function() {
        this.popcorn.off("pause",executeCallback);
        callback();
      }.bind(this);

      this.popcorn.on("pause",executeCallback);
    }
    this.popcorn.pause();
  },

  onTrackStart: function(track) {
    this.currentTrack = track;
    this.lastTrack = track;

    var subtitle = track.subtitle;
    track.highlight();
    subtitle.highlight();

    if (typeof subtitle.get("text") === "undefined" || /^\s*$/.test(subtitle.get("text")) ) {
      if (!track.isGhost) {
        this.pause();
        Backbone.trigger("subtitleeditmode",track);
      }
    } else {
      this.showSubtitleInSubtitleBar(subtitle);
    }
  },

  onTrackEnd: function(track) {
    this.currentTrack = null;

    this.hideSubtitleInSubtitleBar();

    track.unhighlight();
    track.subtitle.unhighlight();
    track.subtitle.hideEditorIfNeeded();

    if (typeof track.subtitle.get("text") === "undefined" || /^\s*$/.test(track.subtitle.get("text")) ) {
      if (track.isGhost && !track.isRemoved()) {
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

        this.safeEndGhostTrack(track,endTime);
        this.requestSubtitleFromUser(track);
      }
    }
  },

  onTrackRemove: function(track) {
    this.isOnSubtitleEditMode = null;
    this.$subtitleEdit.blur();
    this.$subtitleEdit.hide();
  },

  onIframeOverlayClick: function(event) {
    this.togglePlayPause();
  },

  onIframeOverlayMouseEnter: function(event) {
    this.$overlay_btn.show();
  },

  onIframeOverlayMouseLeave: function(event) {
    if (!this.media.paused) {
      this.$overlay_btn.hide();
    }
  },

  togglePlayPause: function() {
    if (this.media.paused) {
      this.play();
    } else {
      this.pause();
    }
  },

  onSubtitleEditFocus: function() {
    if (this.$subtitleEdit.is(":visible")) {
      this.disableCommands();
    }
  },

  onSubtitleEditBlur: function() {
    // if this.lastTrack is undefined (happens when track is removed)
    if (this.lastTrack) this.lastTrack.save();
    this.enableCommands();
  },

  onSubtitleLineEdit: function() {
    this.disableCommands();
  },

  onSubtitleLineBlur: function(subtitle) {
    subtitle.track.save();
    this.enableCommands();
  },

  enableCommands: function(event) {
    $(document).off("keyup");
    $(document).on("keyup",this.onKeyupHandler.bind(this));
    this.$startTimingBtn.removeAttr("disabled");
  },

  disableCommands: function(event) {
    $(document).off("keyup");
    this.$startTimingBtn.attr("disabled","disabled");
  },

  onSubtitleEditKeyup: function(event) {
    var text  = this.$subtitleEdit.val();
    var track = this.$subtitleEdit.data("track");

    track.subtitle.set({ "text": text});
    this.$subtitleDisplay.text(text);

    // escape key
    if (event.which == 27) {
      this.isOnSubtitleEditMode = null;
      this.$subtitleEdit.blur();
      this.$subtitleEdit.hide();
      this.$subtitleDisplay.show();
      this.play();
    }

    // enter key
    if (event.which == 13) {
      this.isOnSubtitleEditMode = null;
      this.$subtitleEdit.blur();
      this.$subtitleEdit.hide();
      this.$subtitleDisplay.show();
      this.play();
    }
  },

  onSubtitleLineKeyup: function(text) {
    this.$subtitleDisplay.text(text);
  },

  onSubtitleDisplayDblClick: function(event) {
    var $target = $(event.target);

    Backbone.trigger("subtitleeditmode",this.currentTrack);
  },

  onPlayBtnClick: function(event) {
    this.play();
    this.$playBtn.hide();
    this.$pauseBtn.show();
  },

  onPauseBtnClick: function(event) {
    this.pause();
    this.$pauseBtn.hide();
    this.$playBtn.show();
  },

  onStartTimingBtn: function(event) {
    if (this.$startTimingBtn.attr("disabled") == "disabled") return;
    this.safeCreateGhostTrack();
    this.play();
  },

  onStopTimingBtn: function(event) {
    var track = this.currentGhostTrack;
    this.safeEndGhostTrack(track);
    this.requestSubtitleFromUser(track);
  },

  safeCreateGhostTrack: function() {
    try {
      return this.createGhostTrack();
    } catch(e) {
      console.log(e);
    }
  },

  safeEndGhostTrack: function(track,endTime) {
    try {
      this.endGhostTrack(track,endTime);
    } catch(e) {
      console.log(e.stack);
      // this.$subtitleEdit.hide(0,function(){
      //   this.isOnSubtitleEditMode = false;
      // }.bind(this));
    }
  },

  onAddSubtitleBtnClick: function(event) {
    if (this.$addSubtitleBtn.attr("disabled") == "disabled") return;
    // add a track
    var trackDuration = 5;
    var track = this.safeCreateGhostTrack();

    var endTime   = this.determineEndTime(track.startTime());

    if (endTime === this.media.duration) {
      endTime = this.media.currentTime + trackDuration;
    }

    this.seek(endTime,function(){
      this.safeEndGhostTrack(track);
      this.requestSubtitleFromUser(track);
    }.bind(this));
  },

  seek: function(time,callback) {
    if (time < 0 || time > this.media.duration) {
      if (typeof callback !== "undefined") {
        callback();
      }
      return;
    }

    if (typeof callback !== "undefined") {
      var executeCallback = function() {
        this.popcorn.off("seeked",executeCallback);
        callback();
      }.bind(this);

      this.popcorn.on("seeked",executeCallback);
    }
    this.popcorn.currentTime(time);
  },

  loadTracks: function(timings) {

    if (typeof timings !== "undefined") {
      for (var i = 0; i < timings.length; i++) {
        try {
          var track = new Track(timings[i], { popcorn: this.popcorn });
          this.tracks.add(track);
        } catch(e) {
          console.log(e.stack);
        }
      };
    }
  },

  createGhostTrack: function() {

    var startTime = Math.round(this.media.currentTime * 1000) / 1000;
    var endTime   = this.determineEndTime(startTime);

    this.validateNoTrackOverlap(startTime,endTime);

    var attributes = {
      start_time: startTime,
      end_time: endTime
    };

    var track = new Track(attributes, { popcorn: this.popcorn, isGhost: true});
    this.tracks.add(track);

    return track;
  },

  endGhostTrack: function(track,endTime) {
    var time = endTime || this.lastTimeUpdateTime;
    try {
      track.end(time);
    } catch(e) {
      track.remove();
      throw e;
    }
  },

  requestSubtitleFromUser: function(track) {
    if (track.initial_subtitle_request && !track.isRemoved()) {
      track.initial_subtitle_request = false;
      Backbone.trigger("subtitleeditmode",track);
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

    this.pause();
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
      var curr = this.tracks.at(i);
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
        this.isOnSubtitleEditMode = null;
      }.bind(this));
    }
    this.$subtitleDisplay.show();
    this.$subtitleDisplay.text(subtitle.get("text"));
  },

  hideSubtitleInSubtitleBar: function(subtitle) {
    this.$subtitleDisplay.text("");
  },

  // either the end of media or the starttime next nearest track
  determineEndTime: function(startTime) {
    var nextNearestEdgeTime = this.media.duration;
    var track;

    for (var i = this.tracks.length - 1; i >= 0; i--) {
      curr = this.tracks.at(i);
      if (curr.startTime() > startTime && curr.startTime() < nextNearestEdgeTime) {
        nextNearestEdgeTime = curr.startTime();
      }
    };

    return nextNearestEdgeTime;
  },

  clearTracks: function() {
    this.tracks.reset();
  },

  printStack: function() {
    var e = new Error('dummy');
    var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
        .replace(/^\s+at\s+/gm, '')
        .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
        .split('\n');
    console.log(stack);
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
