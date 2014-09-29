river.ui.Editor = river.ui.BasePlayer.extend({
  initialize: function(options) {
    river.ui.BasePlayer.prototype.initialize.call(this,options);

    this.timeline.setTracks(this.tracks);

    $("#subtitle_tab_anchor a").tab("show");

    this.currentGhostTrack = null;
    this.isGhostTrackStarted = false;
    this.safeEndGhostLock = false;

    this.MINIMUM_TRACK_DURATION = 0.50;
    this.DEFAULT_TRACK_DURATION = 3;
    this.TRACK_MARGIN = 0.20;
    this.SEEK_DURATION = 5;

    this.startTiming = false;

    // options
    this.addSubBackward = false;

    // temp hack. ugly
    if (!this.repo.parent_repository_id) {
      $(".header #original").hide();
    }
    // this.showGuidedWalkthroughWelcome();
    this.useLocalStorageIfNeeded();
  },

  useLocalStorageIfNeeded: function() {
    var self = this;
    Backbone.getSyncMethod = function(model) {
      if(self.repo.is_guided_walkthrough) {
        return Backbone.localSync;
      }

      return Backbone.ajaxSync;
    };
  },

  preRepositoryInitHook: function() {
    this.timeline = new river.ui.Timeline({media: this.popcorn.media, mediaDuration: this.mediaDuration() });
  },

  showGuidedWalkthroughWelcome: function() {
    if (this.repo.is_guided_walkthrough) {
      setTimeout(this.guideUser.bind(this),1000);
    }
  },

  bindEvents: function() {
    river.ui.BasePlayer.prototype.bindEvents.call(this);

    Backbone.on("editor.ready",this.onEditorReady.bind(this));
    Backbone.on("expandedtimelinedblclick",this.onExpandedTimelineDblClick.bind(this));
    Backbone.on("subtitleeditmode",this.onSubtitleEditMode.bind(this));
    Backbone.on("subtitleenter",this.onSubtitleEnter.bind(this));
    Backbone.on("subtitlelinedblclick",this.onSubtitleLineDblClick.bind(this));
    Backbone.on("subtitlelineedit",this.onSubtitleLineEdit.bind(this));
    Backbone.on("subtitlelineblur",this.onSubtitleLineBlur.bind(this));
    Backbone.on("subtitlechange",this.onSubtitleChange.bind(this));
    Backbone.on("ghosttrackstart",this.onGhostTrackStart.bind(this));
    Backbone.on("ghosttrackend",this.onGhostTrackEnd.bind(this));
    Backbone.on("trackstartchange",this.onTrackStartChange.bind(this));
    Backbone.on("trackendchange",this.onTrackEndChange.bind(this));
    Backbone.on("trackremove",this.onTrackRemove.bind(this));
    Backbone.on("trackinputfocus",this.onTrackInputFocus.bind(this));
    Backbone.on("trackinputblur",this.onTrackInputBlur.bind(this));
    Backbone.on("pauseadjust",this.onPauseAdjust.bind(this));
    Backbone.on("trackrequest",this.onTrackRequest.bind(this));
    Backbone.on("editor.sync",this.onEditorSync.bind(this));

    $(document).on("mousedown",this.onDocumentClick.bind(this));
    $(document).on("mousewheel",this.onDocumentScroll.bind(this));


    $('[data-toggle="tab"]').on('shown.bs.tab', this.onTabShown.bind(this));

    this.$publishBtn.on("mousedown",this.onPublishBtnClick.bind(this));
    this.$addSubInput.on("focus",this.onAddSubtitleInputFocus.bind(this));
    this.$addSubInput.on("keyup",this.onAddSubtitleInputKeyup.bind(this));
    this.$addSubInput.on("blur",this.onAddSubtitleInputBlur.bind(this));
    this.$addSubBtn.on("mousedown",this.onAddSubtitleBtnClick.bind(this));
    this.$addSubBackwardCheckbox.on("mousedown",this.onAddSubBackwardCheckboxClick.bind(this));
    this.$playBtn.on("mousedown",this.onPlayBtnClick.bind(this));
    this.$pauseBtn.on("mousedown",this.onPauseBtnClick.bind(this));
    this.$backwardBtn.on("mousedown",this.onBackwardBtnClick.bind(this));
    this.$forwardBtn.on("mousedown",this.onForwardBtnClick.bind(this));
    this.$startTimingBtn.on("mousedown",this.onStartTimingBtn.bind(this));
    this.$stopTimingBtn.on("mousedown",this.onStopTimingBtn.bind(this));
    this.$iframeOverlay.on("mousedown",this.onIframeOverlayClick.bind(this));
    this.$iframeOverlay.on("mouseenter",this.onIframeOverlayMouseEnter.bind(this));
    this.$iframeOverlay.on("mouseleave",this.onIframeOverlayMouseLeave.bind(this));
    this.$subtitleDisplay.on("dblclick",this.onSubtitleDisplayDblClick.bind(this));
    this.media.addEventListener("pause",this.onPause.bind(this));
    this.media.addEventListener("play",this.onPlay.bind(this));
    this.media.addEventListener("loadedmetadata",this.onLoadedMetadata.bind(this));
    this.media.addEventListener("timeupdate",this.onTimeUpdate.bind(this));
  },

  preventSubtileInputFromLosingFocus: function(event) {
    event.preventDefault();
  },

  onPublishBtnClick: function(event) {
    this.preventSubtileInputFromLosingFocus(event);

    if (this.$publishBtn.attr("disabled") == "disabled") return;

    $.ajax({
      url: this.repo.publish_url,
      type: "POST",
      dataType: "json",
      success: function(data) {
        window.location.href = window.location.href;
      },
      error: function(data) {
        alert("Publish failed. We would look into this shortly.");
        throw data.responseText;
      }
    });

  },

  onTimelineSeekHandler: function(time, $target) {
    if ($target.hasClass("track")) {
      var track = $target.data("model");
      this.replayTrackAndEdit(track);
    } else {
      this.seek(time);  
    }
  },

  onTrackStartChange: function(track) {
    if (track.isValid()) {
      this.seek(track.startTime(), function() {
        this.playTillEndOfTrack(track);
      }.bind(this));
    }
  },

  onTrackEndChange: function(track) {
    if (track.isValid()) {
      this.seek(track.startTime(), function() {
        this.playTillEndOfTrack(track);
      }.bind(this));
    }
  },

  onSubtitleLineClick: function(subtitle, $target) {
    if ($target.data("field") !== "start_time" && $target.data("field") !== "end_time") {
      var track = subtitle.track;

      this.seek(track.startTime(), function() {
        this.playTillEndOfTrack(track);
      }.bind(this));
    }
  },

  onAddSubtitleInputFocus: function(event) {
  },

  onAddSubtitleInputKeyup: function(event) {
    // if video is playing pause it
    if (!this.media.paused) {
      this.pause();
    }

    var text = this.$addSubInput.val();
    // show what is being typed on video
    this.$subtitleDisplay.text(text);

    // enter key
    if (event.which == 13 ) {
      this.addSubtitledTrack(text);
    }
  },

  addSubtitledTrack: function(text) {
    try {
      this.addTrack(this.media.currentTime,{
        preEndGhostCallback: function(track){
          track.subtitle.set({ "text": text});
          this.$subtitleDisplay.text(text);
          this.play();
        }.bind(this)
      });
    } catch (e) {
      if (e.name === "track_overlap") {
        this.showErrorOnStatusBar("Overlap Detected");  
      } 
      console.log(e.message);
    }
  },

  onAddSubtitleInputBlur: function(event) {
    var track = this.currentGhostTrack;
    if (track) {
      this.safeEndGhostTrack(track);
    }
  },

  onTabShown: function (e) {
    if ($(e.target).attr("href") === "#timeline_tab") {
      this.timeline.ensureCorrectWindowPosition();
    }

    if ($(e.target).attr("href") === "#subtitle_tab") {
      if (this.intro._currentStep === 11) { 
        $(".introjs-nextbutton").removeClass("introjs-disabled");
        $(".introjs-nextbutton").trigger("click");
      }
    }

  },

  getEditorElement: function() {
    return  "<div class='container'>" +
              "<div id='editor'> " +
                "<div id='editor-top' class='row'> " +
                  "<div class='span12'> " +
                    "<h5 id='repo_label'>" +
                      "<a href=" + this.repo.url + ">" + this.repo.video.name.substring(0,70) + "</a>" +
                    "</h5>" +
                    "<div id='language' class='pull-left'>" +
                      "<span>" + this.repo.language_pretty + "</span>" +
                    "</div>" +
                    "<h5 class='pull-right'>" +
                      "<a id='publish_btn' class='btn btn-success'>Publish</a>" +
                      "<a id='preview_btn' target='_blank' href=" + this.repo.url + " class='label'>View</a>" +
                    "</h5>" +
                    // "<h6 id='video_url'>" +
                    //   "<a href=" + this.repo.video.url + ">" + this.repo.video.url + "</a>" +
                    // "</h6> " +
                  "</div> " +
                  "<div class='span12'> " +
                    "<div id='media_container'> " +
                      "<div id='viewing_screen' >" +
                        "<div id='iframe_container'>" +
                          "<div id='iframe_overlay'>" +
                          "</div>" +
                          "<div id='overlay_btn'><i class='icon-play'></i></div>" +
                        "</div> " +
                        "<div id='subtitle_bar' class='span12 center'> " +
                          "<span id='subtitle_display' class='span5 center'></span> " +
                        "</div> " +
                      "</div> " +
                      "<div id='time_float'></div>" +
                      "<div id='seek_head'>" +
                        "<div class='scrubber'></div>" +
                        "<div id='seek_head_corner'></div>" +
                        "<div id='seek_head_body'></div>" +
                      "</div>" +
                    "</div> " +
                  "</div> " +
                  // "<div id='editor-top-right' class='span6'> " +
                  // "</div> " +
                "</div> " +
                "<div id='controls' class=''> " +
                  "<div id='text_control' class='pull-right'> " +
                    "<div id='add_sub_container' class='input-append '> " +
                      "<input id='add_sub_input' class='' type='text' placeholder='Enter Subtitle Here'>" + 
                      "<a id='add_sub_btn' class='btn btn-primary'>Add</a> " +
                    "</div> " +
                    "<div id='add_sub_options' class='pull-right'> " +
                      "<label class='checkbox'>" + 
                        "<input type='checkbox' id='add_sub_backward_checkbox'> Reverse" +
                      "</label>" +
                    "</div> " +
                  "</div> " +
                  "<div id='main_controls' class='pull-right'> " +
                    "<button type='button' id='backward_btn' class='river_btn'><i class='icon-backward'></i></button> " +
                    "<button type='button' id='play_btn' class='river_btn'><i class='icon-play'></i></button> " +
                    "<button type='button' id='pause_btn' class='river_btn'><i class='icon-pause'></i></button> " +
                    "<button type='button' id='forward_btn' class='river_btn'><i class='icon-forward'></i></button> " +
                    "<button id='start_timing_btn' class='river_btn'><i class='icon-film'></i></button> " +
                    "<button id='stop_timing_btn' class='river_btn'><i class='icon-circle'></i></button> " +
                  "</div> " +
                "</div> " +
                "<div id='editor-bottom' class='row'> " +
                  "<div class='span12'> " +
                    "<ul class='nav nav-tabs span12'>" +
                      "<li class='active'><a href='#timeline_tab' data-toggle='tab'>Timeline</a></li>" +
                      "<li id='subtitle_tab_anchor' ><a href='#subtitle_tab' data-toggle='tab'>Subtitle</a></li>" +
                      "<li id='download_tab_anchor' class='pull-right'><a href='#download_tab' data-toggle='tab'>Download</a></li>" +
                      // "<li><a id='help_btn' class='' href='#'><i class='icon-question-sign'></i></a></li>" +
                    "</ul>" +
                  "</div> " + // .span12

                  "<div class='span12'> " +
                    "<div class='tab-content timeline_tab_content'>" +
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
                  "<div id='status-bar' class='span8 pull-left'> " +
                  "</div> " +
                  "<div class='span12'> " +
                          "<div class='row'> " +
                            // "<div id='keyboard-shortcuts' class='span6 pull-right'> " +
                            //   "<span>" +
                            //     "<b>Keyboard Shortcuts: </b>  " +
                            //     "<kbd class='light'>Shift</kbd> Open/Close " +
                            //     "<kbd class='light'>Space</kbd> Play/Pause" +
                            //     "<kbd class='light'>Esc</kbd>   Cancel " +
                            //   "</span>" +
                            // "</div> " +
                          "</div> " +
                  "</div> " + // .span12

                "</div> " +   // #editor-bottom.row
              "</div>" +  // #editor
            "</div>";  // container
  },

  setupElement: function() {
    this.$container = this.options["container"] || $("#main_container");

    var el = this.getEditorElement();
    this.$container.append(el);

    this.$mediaContainer = $("#viewing_screen");

    river.ui.BasePlayer.prototype.setupElement.call(this);

    this.$el = $("#editor");

    if (this.repo.user) {
      var repo_owner = "<span id='repo_owner'>" +
                         "<a href='" + this.repo.owner_profile_url + "'>" + this.repo.owner + "</a>" +
                       "</span> / ";
      this.$el.find("#repo_label").prepend(repo_owner);
    }

    this.$playBtn = $("#play_btn");
    this.$pauseBtn = $("#pause_btn");
    this.$pauseBtn.hide();

    this.$backwardBtn = $("#backward_btn");
    this.$forwardBtn = $("#forward_btn");

    this.$backwardBtn.hide();
    this.$forwardBtn.hide();

    this.$startTimingBtn = $("#start_timing_btn");
    this.$startTimingBtn.attr("disabled","disabled");

    this.$stopTimingBtn = $("#stop_timing_btn");
    this.$stopTimingBtn.hide();

    this.$addSubInput = $("#add_sub_input");

    this.$addSubBtn = $("#add_sub_btn");
    this.$addSubBtn.attr("disabled","disabled");

    this.$addSubBackwardCheckbox = $("#add_sub_backward_checkbox");

    this.intro = introJs();

    this.$publishBtn = $("#publish_btn");
    this.$previewBtn = $("#preview_btn");

    if (this.repo.is_published) {
      this.$publishBtn.hide();
    } else {
      this.$previewBtn.hide();
    }

    // this.$helpBtn = $("#help_btn");
    // this.$helpBtn.tooltip({title: "Help"});
    // this.$helpBtn.popover({content: "Click Here to Start Walkthrough", placement: "top", trigger: "manual"});
    // this.$helpBtn.on("click",function(target){
    //   this.$helpBtn.popover("hide");
    //   this.intro.start();
    // }.bind(this));

    this.$iframeOverlay = $("#iframe_overlay");
    this.$overlay_btn = $("#overlay_btn");

    this.$video_name = $("#video_name");

    this.$video_url = $("#video_url");

    this.$language_select = $('#language_select');
    this.$language_select.selectpicker();

    this.$keyboard_shortcuts = $("#keyboard-shortcuts");
    this.$status_bar = $("#status-bar");


    // tooltips
    this.$backwardBtn.tooltip({title: "Back"});
    this.$forwardBtn.tooltip({title: "Forward"});
    this.$playBtn.tooltip({title: "Play"});
    this.$pauseBtn.tooltip({title: "Pause"});
    this.$startTimingBtn.tooltip({title: "Mark Start of Subtitle"});
    this.$stopTimingBtn.tooltip({title: "Mark End of Subtitle"});
    this.$publishBtn.tooltip({title: "Make video public"});
    this.$previewBtn.tooltip({title: "See how it'll look in public"});

    $("footer").hide();
    $("#controls").hide();
  },

  setupIntroJS: function() {
    this.intro.setOptions({
      keyboardNavigation: true,
      exitOnEsc: false,
      exitOnOverlayClick: false,
      steps: [
        {
          element: "#viewing_screen",
          intro: "This is the main screen. Click to Play or Pause the video."
        },
        {
          element: "#start_timing_btn",
          intro: "To add a subtitle that starts at current time, click 'open'. Try it now.",
          position: 'left'
        },
        {
          element: "#stop_timing_btn",
          intro: "Now click 'close' when you want your text to end",
          position: 'left'
        },
        {
          element: "#subtitle_bar",
          intro: "Here is where you type in the text. Press [Enter] after you're done typing",
        },
        {
          element: "#keyboard-shortcuts",
          intro: "Instead of using your mouse, you can also use the keyboard for controlling the editor.",
          position: "top",
        },
        {
          element: "#keyboard-shortcuts",
          intro: "Try play/pausing the video using [space]. ",
          position: "top",
        },
        {
          element: "#keyboard-shortcuts",
          intro: "Now press [shift] once to start a subtitle, and press [shift] again to end it",
          position: "top",
        },
        {
          element: "#summary.timeline",
          intro: "This is seek bar. It shows you the subtitles youve added during the entire duration of video. ",
        },
        {
          element: "#summary.timeline",
          intro: "The blue bar corresponds to the 30 second timeline that's shown below.",
        },
        {
          element: "#summary.timeline",
          intro: "Now, try clicking outside the blue bar, and then try clicking the green tracks",
        },
        {
          element: "#expanded.timeline",
          intro: "Double click one of the green tracks to edit the subtitle text.",
          position: "top"
        },
        {
          element: "#subtitle_tab_anchor",
          intro: "Another way to view the subtitles that you've created is throught the subtitles tab. Click it now",
          position: "top"
        },
        {
          element: "#subtitle_container",
          intro: "Double click the 'start', 'end', or 'text' section to edit the time or text of subtitle. ",
          position: "top"
        },
        {
          element: "#preview_btn",
          intro: "Finally, to see how your subtitles look in public, you can click the preview button. ",
          position: "left"
        },
        {
          element: "#preview_btn",
          intro: "That's the end of the walkthrough. If you enjoyed it, don't forget to sign up!",
          position: "left"
        }
      ]
    });

    this.intro.onafterchange(function(targetElement){
      var stepsToDisabledNextButton = [1,2,3,11];
      if (stepsToDisabledNextButton.indexOf(this.intro._currentStep) !== -1) { 
        $(".introjs-nextbutton").addClass("introjs-disabled");
        $(".introjs-prevbutton").addClass("introjs-disabled");
      }
    }.bind(this));
  },

  resetState: function(callback) {
    this.clearTracks();
    this.currentTrack = null;
    this.currentGhostTrack = null;
    this.isGhostTrackStarted = false;
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

  onDocumentClick: function(event) {
    if (!$(event.target).hasClass("sub_text_area") && 
      !$(event.target).hasClass("track_text") && 
      !$(event.target).hasClass("ui-spinner")) {
      this.preventSubtileInputFromLosingFocus(event);
    }
  },

  onDocumentScroll: function(event,delta) {
    // disallow horizontal scroll
    if (event.originalEvent.wheelDeltaX !== 0) {
      event.preventDefault();
    }
  },

  getSecondsFromCurrentPosition: function($target,eventPageX) {
    var $container = this.$progress_bar;

    var containerX = $container.position().left;
    var posX = eventPageX - containerX;
    var seconds = posX / this.resolution($container);
    seconds = Math.round(seconds * 1000) / 1000;
    return seconds;
  },

  // how many pixels per second
  resolution: function($container) {
    var widthPixel = $container.width();
    var widthSeconds = this.mediaDuration();

    return widthPixel / widthSeconds ;
  },

  onTimeUpdate: function(event) {
    this.lastTimeUpdateTime = this.media.currentTime;
  },

  onDocumentKeydown: function(event) {
    
    if (event.which === 16) { 
      // shift key
    } else if (event.which === 8) {  
      // backspace

      this.preventAccidentalPreviousPageNavigation($(event.target));
    } else if (event.which === -99) { 
      // ctrl + p

      this.togglePlayPause();
    } else if (event.which == 13) { 
      // enter key

      this.goToNextTrack();
    } else if (event.which == 38) {
      // up arrow

      this.replayTrackAndEdit(this.currentTrack.prev());
    } else if (event.which == 40) {
      // down arrow

      this.replayTrackAndEdit(this.currentTrack.next());
    } else if (event.which == 27) {
      // escape key

      this.cancelGhostTrack();
    }
  },


  goToNextTrack: function() {
    var nextTrack = this.currentTrack.next();

    if (typeof nextTrack !== "undefined") {
      this.replayTrackAndEdit(nextTrack);
    } else {
      var time = this.currentTrack.endTime() + this.TRACK_MARGIN;
      time = Math.round(time * 1000) / 1000;
      var track = this.addFullTrack(time, { isGhost: false });
      this.replayTrackAndEdit(track);
    }
  },

  preventAccidentalPreviousPageNavigation: function($target) {
    if (!$target.is("input") && !$target.is("textarea")) {
      event.preventDefault();
    }
  },

  cancelGhostTrack: function() {
    this.isGhostTrackStarted = false;

    var track = this.currentGhostTrack;
    if (track) {
      track.remove();
    }
  },

  timeSubtitle: function() {
    if (!this.isGhostTrackStarted) {
    // first time, you start timing
      this.safeCreateGhostTrack(this.media.currentTime);
      this.play();
    } else {
      // second time, you stop timing
      var track = this.currentGhostTrack;
      this.safeEndGhostTrack(track);
    }
  },

  playTillEndOfTrack: function(track) {
    track.setPauseOnTrackEnd();
    this.play();
  },

  onPlay: function(event) {
    this.$overlay_btn.find("i").removeClass("icon-play");
    this.$overlay_btn.find("i").addClass("icon-pause");
    this.$playBtn.hide();
    this.$pauseBtn.show();
  },

  onPause: function(event) {
    this.seek(this.lastTimeUpdateTime);
    this.$overlay_btn.find("i").removeClass("icon-pause");
    this.$overlay_btn.find("i").addClass("icon-play");
    this.$overlay_btn.show();
    this.$pauseBtn.hide();
    this.$playBtn.show();
  },

  onLoadedMetadata: function(event) {
    this.$startTimingBtn.removeAttr("disabled");
    this.$addSubBtn.removeAttr("disabled");
    Backbone.trigger("editor.ready");
    this.setupIntroJS();
  },


  onEditorReady: function(event) {
    var track;

    if (editor.tracks.length === 0) {
      this.addFullTrack(0, {isGhost: false, skip_track_slot: true});
    }

    track = this.tracks.at(0);

    this.seekTrackAndEdit(track);
    this.currentTrack = track;

    $(document).on("keydown",this.onDocumentKeydown.bind(this));
  },

  onPauseAdjust: function(correctPauseTime) {
  },

  onTrackRequest: function() {
    this.$status_bar.text("Saving...");
  },

  onEditorSync: function(syncMethod,model) {
    if (syncMethod === "save" ) {
      Backbone.Model.prototype[syncMethod].call(model,{},{
        timeout: 10000,
        success: this.onTrackRequestSuccess.bind(this), 
        error:   this.onTrackRequestError.bind(this)
      });
    } else {
      Backbone.Model.prototype[syncMethod].call(model,{
        timeout: 10000,
        success: this.onTrackRequestSuccess.bind(this), 
        error:   this.onTrackRequestError.bind(this)
      });
     }
  },

  onTrackRequestSuccess: function(track) {
    Backbone.trigger("tracksuccess");
    setTimeout(function(){ this.$status_bar.text(""); }.bind(this),500);
  },

  onTrackRequestError: function(track, status) {
    // dont show error to detailed user. currently confusing
    // hopefully, the red highlight is good enough warning
    setTimeout(function(){ this.$status_bar.text(""); }.bind(this),500);
    // var msg = "";
    // var errors = JSON.parse(status.responseText)["error"];
    // for (key in errors) {
    //   msg += errors[key];
    //   msg + ". ";
    // }
    // this.showErrorOnStatusBar(msg);
  },

  showErrorOnStatusBar: function(msg) {
    this.$status_bar.text(msg);
    this.$status_bar.addClass("failed");

    setTimeout(function(){ 
      this.$status_bar.text(""); 
      this.$status_bar.removeClass("failed");
    }.bind(this),5000);
  },

  onSubtitleLineDblClick: function(subtitle) {
    this.pause();
  },

  onSubtitleEditMode: function(track, options) {
    if (track.isRemoved()) return;

    options = options || {};

    if (typeof options.pause === "undefined") {
      options.pause = true;
    }

    if (options.pause) {
      this.ensurePauseAtTrack(track, options, function() {
        this.showSubtitleEdit(track);
      }.bind(this));
    } else {
      this.seek(track.startTime());
      this.showSubtitleEdit(track);
    }
  },

  onSubtitleEnter: function() {
    this.goToNextTrack();
  },

  showSubtitleEdit: function(track) {
    this.openEditor(track);
  },

  seekTrackAndEdit: function(track) {
    if (typeof track === "undefined") return;
    this.seek(track.startTime());
    this.openEditor(track);
  },

  replayTrackAndEdit: function(track) {
    if (typeof track === "undefined") return;

    this.seek(track.startTime(), function() {
      this.playTillEndOfTrack(track);
    }.bind(this));

    this.openEditor(track);
  },

  openEditor: function(track) {
    if ($(".tab-pane.active").attr("id") === "subtitle_tab" ) {
      track.subtitle.openEditor();
    } else {
     track.openEditor();
    }
  },

  onGhostTrackStart: function(track) {
    this.isGhostTrackStarted = true;
    this.currentGhostTrack = track;
    this.$startTimingBtn.hide({duration: 0});
    this.$stopTimingBtn.show({
      duration: 0,
      complete: function() {
        if (this.intro._currentStep === 1) { 
          $(".introjs-nextbutton").removeClass("introjs-disabled");
          $(".introjs-nextbutton").trigger("click");
        }
      }.bind(this)
    });
  },

  onGhostTrackEnd: function(track) {
    this.$addSubInput.val("");

    this.isGhostTrackStarted = false;
    this.currentGhostTrack = null;
    this.$stopTimingBtn.hide({
      duration: 0,
      complete: function() {
        if (this.intro._currentStep === 2) { 
          $(".introjs-nextbutton").removeClass("introjs-disabled");
          $(".introjs-nextbutton").trigger("click");
        }
        this.$startTimingBtn.show({duration: 0});
      }.bind(this)
    });
    track.fadingHighlight();
  },

  onTrackStart: function(track) {
    // console.log("ontrackstart" + track.toString());
    this.currentTrack = track;

    var subtitle = track.subtitle;
    track.highlight();

    this.showSubtitleInSubtitleBar(subtitle);
  },

  onTrackEnd: function(track) {
    // console.log("ontrackend" + track.toString());
    this.hideSubtitleInSubtitleBar();

    track.unhighlight();

    if (track.shouldPauseOnTrackEnd()) {
      track.unsetPauseOnTrackEnd();
      this.ensurePauseAtTrack(track, {pauseAtStart: true});
    } 

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
      if (this.startTiming) {
        this.startTiming = false; 
        this.requestSubtitleFromUser(track);
      }
    } 
  },

  onTrackRemove: function(track) {
    if (this.currentTrack === track) {
      var prevTrack = this.prevNearestTrack(track.startTime());
      this.currentTrack = prevTrack;
    }
  },

  onTrackInputFocus: function(track) {
  },

  onTrackInputBlur: function(track) {
    track.save();
  },

  onIframeOverlayClick: function(event) {
    this.preventSubtileInputFromLosingFocus(event);
    this.togglePlayPause();
  },

  onSubtitleBarClick: function(event) {
    this.preventSubtileInputFromLosingFocus(event);
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
  
  onSubtitleLineEdit: function() {
  },

  onSubtitleLineBlur: function(subtitle) {
    subtitle.track.save();
  },


  onSubtitleEditKeyup: function(event) {
    track.subtitle.set({ "text": text});
  },

  onSubtitleChange: function(subtitle) {
    this.$subtitleDisplay.text(subtitle.get("text"));
  },

  onSubtitleDisplayDblClick: function(event) {
    var $target = $(event.target);

    this.requestSubtitleFromUser(this.currentTrack);
  },

  onPlayBtnClick: function(event) {
    this.preventSubtileInputFromLosingFocus(event);
    this.play();
  },

  onPauseBtnClick: function(event) {
    this.preventSubtileInputFromLosingFocus(event);
    this.pause();
  },

  onBackwardBtnClick: function(event) {
    this.preventSubtileInputFromLosingFocus(event);
    this.seek(this.media.currentTime - this.SEEK_DURATION);
  },

  onForwardBtnClick: function(event) {
    this.preventSubtileInputFromLosingFocus(event);
    this.seek(this.media.currentTime + this.SEEK_DURATION);
  },

  onStartTimingBtn: function(event) {
    this.preventSubtileInputFromLosingFocus(event);

    if (this.$startTimingBtn.attr("disabled") == "disabled") return;
    this.startTiming = true;
    this.safeCreateGhostTrack(this.media.currentTime);
    this.play();
  },

  onStopTimingBtn: function(event) {
    this.preventSubtileInputFromLosingFocus(event);

    var track = this.currentGhostTrack;
    this.safeEndGhostTrack(track);
    if (this.startTiming) {
      this.startTiming = false; 
      this.requestSubtitleFromUser(track);
    }
  },

  // returns null if unsuccessful
  safeCreateGhostTrack: function(startTime) {
    try {
      return this.createGhostTrack(startTime);
    } catch(e) {
      console.log(e);
    }
  },

  // should only get called one at a time
  safeEndGhostTrack: function(track,endTime) {
    if (this.safeEndGhostLock) return;

    this.safeEndGhostLock = true

    try {
      this.endGhostTrack(track,endTime);
    } catch(e) {
      console.log(e.stack);
    }

    this.safeEndGhostLock = false
  },

  onAddSubtitleBtnClick: function(event) {
    this.preventSubtileInputFromLosingFocus(event);
    var text = this.$addSubInput.val();
    this.addSubtitledTrack(text);
  },

  onAddSubBackwardCheckboxClick: function(event) {
    this.preventSubtileInputFromLosingFocus(event);
    this.addSubBackward = this.$addSubBackwardCheckbox.is(":checked");
  },

  onExpandedTimelineDblClick: function(event) {
    var $target = $(event.target);

    if ($target.hasClass("track") || $target.hasClass("track_text")) {
      return;  
    }

    this.addTrack(this.media.currentTime,{
      postEndGhostCallback: function(track){
        this.requestSubtitleFromUser(track);
      }.bind(this)
    });
  },

  addTrack: function(time, callbacks) {
    callbacks = callbacks || {};

    var trackSlot = this.getTrackSlot(time);
    var startTime = trackSlot.startTime;
    var endTime   = trackSlot.endTime;

    var track = this.safeCreateGhostTrack(startTime);

    if (track) {
      this.seek(endTime,function(){
        if (typeof callbacks.preEndGhostCallback !== "undefined") {
          callbacks.preEndGhostCallback(track);
        }

        this.safeEndGhostTrack(track);

        if (typeof callbacks.postEndGhostCallback !== "undefined") {
          callbacks.postEndGhostCallback(track);
        }
      }.bind(this));
    }
  },

  addFullTrack: function(startTime, options) {

    if (options.skip_track_slot) {
      var endTime = startTime + this.DEFAULT_TRACK_DURATION;
    } else {
      var trackSlot = this.getTrackSlot(startTime);
      startTime = trackSlot.startTime;
      var endTime   = trackSlot.endTime;
    }

    options.isGhost = options.isGhost || false;

    var attributes = {
      start_time: startTime,
      end_time: endTime
    };

    var track = new river.model.Track(attributes, { popcorn: this.popcorn, isGhost: options.isGhost});
    this.tracks.add(track);

    return track;
  },

  getTrackSlot: function(currentTime) {
    var prevNearestEdgeTime = this.prevNearestEdgeTime(currentTime);
    var nextNearestEdgeTime = this.nextNearestEdgeTime(currentTime);

    if (currentTime > this.DEFAULT_TRACK_DURATION && (currentTime - prevNearestEdgeTime) > this.MINIMUM_TRACK_DURATION ) {
      if (this.addSubBackward) {
        endTime   = currentTime;   
        startTime = endTime - this.DEFAULT_TRACK_DURATION;   
      } else {
        startTime = currentTime;   
        endTime   = startTime + this.DEFAULT_TRACK_DURATION;   
      }

      // possible to overlap prev track
      if (startTime <= prevNearestEdgeTime) {
        startTime = prevNearestEdgeTime + this.TRACK_MARGIN;
      }

      // possible to overlap next track
      if (endTime >= nextNearestEdgeTime) {
        endTime = nextNearestEdgeTime - this.TRACK_MARGIN;
      }
    } else {
      startTime   = currentTime;   
      endTime     = startTime + this.DEFAULT_TRACK_DURATION;   

      // possible to overlap prev track
      if (startTime <= prevNearestEdgeTime) {
        startTime = prevNearestEdgeTime + this.TRACK_MARGIN;
      }

      // possible to overlap next track
      if (endTime >= nextNearestEdgeTime) {
        endTime = nextNearestEdgeTime - this.TRACK_MARGIN;
      }

      // possible that end less than start due to TRACK_MARGIN
      if (endTime <= startTime) {
        endTime = startTime;
      }
    }

    var overlapTracks = this.getOverlapTracks(startTime,endTime) ;
    
    if (overlapTracks.length !== 0) {
      var trackSlot = this.getNextAvailableTrackSlot(startTime);
      startTime = trackSlot.startTime;
      endTime   = trackSlot.endTime;
    }

    return {
      startTime: startTime,
      endTime: endTime
    }
  },

  getNextAvailableTrackSlot: function(time) {
    var timeGap;
    var curr;
    var next;

    for (var i = 0; i < this.tracks.length; i++) {
      curr = this.tracks.at(i);
      next = this.tracks.at(i + 1);

      if (curr.endTime() < time) continue;

      if (typeof next === "undefined") {
        timeGap = this.mediaDuration() - curr.endTime() - this.TRACK_MARGIN;
      } else {
        timeGap = next.startTime() - curr.endTime() - this.TRACK_MARGIN;
      }

      if (timeGap >= this.MINIMUM_TRACK_DURATION) break;
    }

    return {
      startTime: curr.endTime() + this.TRACK_MARGIN,
      endTime: curr.endTime() + Math.min(timeGap, this.DEFAULT_TRACK_DURATION)
    }
  },

  seek: function(time,callback) {
    Backbone.trigger("editorseek");

    if (time < 0 || time > this.mediaDuration()) {
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

  createGhostTrack: function(startTime) {

    var startTime = Math.round(startTime * 1000) / 1000;
    var endTime   = this.nextNearestEdgeTime(startTime);

    this.validateNoTrackOverlap(startTime,endTime);

    var attributes = {
      start_time: startTime,
      end_time: endTime
    };

    var track = new river.model.Track(attributes, { popcorn: this.popcorn, isGhost: true});
    this.tracks.add(track);

    return track;
  },

  endGhostTrack: function(track,endTime) {
    var time = endTime || this.lastTimeUpdateTime;
    try {
      track.end(time);

      if (this.popcorn.paused()) {
        // manually trigger onTrackEnd callback to request input from user
        this.onTrackEnd(track);
      }
      track.subtitle.view.render(); //temp hack to fix bug
    } catch(e) {
      track.remove();
      throw e;
    }
  },

  requestSubtitleFromUser: function(track, options) {
    Backbone.trigger("subtitleeditmode", track, options);
  },

   /* When you're timing a track while media is playing, and you're very near the start of next track,
   *   pausing might result in scrubber being inside next track since pausing is not immediate (it takes a few millisec
   * This function would ensure that pausing would stop at current track
   */
  ensurePauseAtTrack: function(track, options, callback) {
    var seekBackToTrack = function() {
      // make sure to remove this callback
      this.media.removeEventListener("pause",seekBackToTrack);

      var executeCallback = function() {
        this.popcorn.off("seeked",executeCallback);
        if (typeof callback !== "undefined") {
          callback();
        }
      }.bind(this);

      this.popcorn.on("seeked",executeCallback);

      if (options.pauseAtStart) {
        this.seek(track.startTime());
      } else {
        this.seek(track.endTime() - 0.01);
      }
    }.bind(this);

    this.media.addEventListener("pause",seekBackToTrack);

    // if already paused, manually trigger the callback to seek to right time
    if (this.popcorn.paused()) {
      seekBackToTrack();
      return;
    }

    this.pause();
  },

    /*
   *   startTime should not be less than any existing track endTime
   *   endTime should not be greater than any existing track startTime
   */
  validateNoTrackOverlap: function(startTime,endTime,track) {
    var tracks = this.getOverlapTracks(startTime,endTime,track) ;

    if (tracks.length != 0) {
      throw {
        name: "track_overlap",
        message: "Track Overlap Detected. Track(" + startTime + "," + endTime + ") " +
                 "would overlap with " + $.map(tracks,function(track) { return track.toString(); })
      };
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
    // its possible that this gets triggered when we are still on subtitleEditMode
    // i.e ghostrack hit start time of next track (ontrackend, subtitleEditMode, 
    //     then next track ontrackstart gets triggered which calls this function )
    this.$subtitleDisplay.show();
    this.$subtitleDisplay.text(subtitle.get("text"));
  },

  hideSubtitleInSubtitleBar: function(subtitle) {
    this.$subtitleDisplay.text("");
  },

   // either the start of media or the endTime of prev nearest track
  prevNearestEdgeTime: function(startTime) {
    var track = this.prevNearestTrack(startTime)
    if (track) {
      return track.endTime();
    } else {
      return 0;
    }
  },

  prevNearestTrack: function(startTime) {
    var prev = null;
    var prevNearestEdgeTime = 0;
    var curr;

    for (var i = this.tracks.length - 1; i >= 0; i--) {
      curr = this.tracks.at(i);
      if (curr.endTime() <= startTime && curr.endTime() >= prevNearestEdgeTime) {
        prev = curr;
        prevNearestEdgeTime = prev.endTime();
      }
    };

    return prev;
  },

  // either the end of media or the starttime next nearest track
  nextNearestEdgeTime: function(time) {
    var nextNearestEdgeTime = this.mediaDuration();
    var curr;

    for (var i = this.tracks.length - 1; i >= 0; i--) {
      curr = this.tracks.at(i);
      if (curr.startTime() >= time && curr.startTime() <= nextNearestEdgeTime) {
        nextNearestEdgeTime = curr.startTime();
      }
    };

    return nextNearestEdgeTime;
  },

  clearTracks: function() {
    for (var i = this.tracks.models.length - 1; i >= 0; i--) {
      this.tracks.models[i].remove();
    }
    this.tracks.reset();
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

});
