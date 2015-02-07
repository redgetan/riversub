river.ui.Editor = river.ui.BasePlayer.extend({
  initialize: function(options) {
    river.ui.BasePlayer.prototype.initialize.call(this,options);

    this.timeline.setTracks(this.tracks);

    $("#subtitle_tab_anchor a").tab("show");

    this.$fadeInBuffer = false;
    this.currentGhostTrack = null;
    this.isGhostTrackStarted = false;
    this.safeEndGhostLock = false;

    this.MINIMUM_TRACK_DURATION = 0.50;
    this.DEFAULT_TRACK_DURATION = 3;
    this.TRACK_MARGIN = 0.20;
    this.SEEK_DURATION = 1;
    this.KEYCODE_THAT_PAUSES_VIDEO = this.getKeycodeThatPausesVideo();

    this.startTiming = false;

    // options
    this.addSubBackward = true;

    if (!repo.parent_repository_id) {
      $(".header #original").hide();
    }
    // this.showGuidedWalkthroughWelcome();
    this.useLocalStorageIfNeeded();
    this.$expandBtn.hide();

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

  previewRepo: function(event) {
    if ((this.$titleInput.val().length > 0) || (repo.title && repo.title.length > 0)) {
      window.location.href = this.repo.url;
    } else {
      event.preventDefault();
      alert("Please Enter a Title");
    }
  },

  getKeycodeThatPausesVideo: function() {
    var list = [];

    for (var i = 48; i <= 90; i++) {
      list.push(i);
    };

    return list;
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
    Backbone.on("subtitleenter",this.onSubtitleEnter.bind(this));
    Backbone.on("subtitlelinedblclick",this.onSubtitleLineDblClick.bind(this));
    Backbone.on("subtitlelineinputclick",this.onSubtitleLineInputClick.bind(this));
    Backbone.on("subtitlelineedit",this.onSubtitleLineEdit.bind(this));
    Backbone.on("subtitlelineblur",this.onSubtitleLineBlur.bind(this));
    Backbone.on("subtitlelinekeydown",this.onSubtitleLineKeydown.bind(this));
    Backbone.on("subtitlechange",this.onSubtitleChange.bind(this));
    Backbone.on("ghosttrackstart",this.onGhostTrackStart.bind(this));
    Backbone.on("ghosttrackend",this.onGhostTrackEnd.bind(this));
    Backbone.on("trackstartchange",this.onTrackStartChange.bind(this));
    Backbone.on("trackendchange",this.onTrackEndChange.bind(this));
    Backbone.on("trackremove",this.onTrackRemove.bind(this));
    Backbone.on("trackinputfocus",this.onTrackInputFocus.bind(this));
    Backbone.on("trackinputblur",this.onTrackInputBlur.bind(this));
    Backbone.on("trackinputkeyup",this.onTrackInputKeyup.bind(this));
    Backbone.on("pauseadjust",this.onPauseAdjust.bind(this));
    Backbone.on("trackrequest",this.onTrackRequest.bind(this));
    Backbone.on("editor.sync",this.onEditorSync.bind(this));

    $(document).on("mousedown",this.onDocumentClick.bind(this));
    $(document).on("mousewheel",this.onDocumentScroll.bind(this));


    $('[data-toggle="tab"]').on('shown.bs.tab', this.onTabShown.bind(this));

    this.$previewBtn.on("click", this.onPreviewBtnClick.bind(this));
    this.$publishBtn.on("mousedown",this.onPublishBtnClick.bind(this));
    this.$addSubInput.on("focus",this.onAddSubtitleInputFocus.bind(this));
    this.$addSubInput.on("keyup",this.onAddSubtitleInputKeyup.bind(this));
    this.$addSubInput.on("blur",this.onAddSubtitleInputBlur.bind(this));
    this.$addSubBtn.on("mousedown",this.onAddSubtitleBtnClick.bind(this));
    this.$addSubBackwardCheckbox.on("mousedown",this.onAddSubBackwardCheckboxClick.bind(this));
    this.$playBtn.on("mousedown",this.onPlayBtnClick.bind(this));
    this.$pauseBtn.on("mousedown",this.onPauseBtnClick.bind(this));
    this.$replayBtn.on("mousedown",this.onReplayBtnClick.bind(this));
    this.$timelineBtn.on("mousedown",this.onTimelineBtnClick.bind(this));
    this.$subtitleBtn.on("mousedown",this.onSubtitleBtnClick.bind(this));
    this.$backwardBtn.on("mousedown",this.onBackwardBtnClick.bind(this));
    this.$forwardBtn.on("mousedown",this.onForwardBtnClick.bind(this));
    this.$startTimingBtn.on("mouseenter",this.onStartTimingBtnMouseEnter.bind(this));
    this.$startTimingBtn.on("mouseleave",this.onStartTimingBtnMouseLeave.bind(this));
    this.$stopTimingBtn.on("mouseenter",this.onStopTimingBtnMouseEnter.bind(this));
    this.$stopTimingBtn.on("mouseleave",this.onStopTimingBtnMouseLeave.bind(this));
    this.$startTimingBtn.on("mousedown",this.onStartTimingBtn.bind(this));
    this.$stopTimingBtn.on("mousedown",this.onStopTimingBtn.bind(this));
    this.$iframeOverlay.on("mousedown",this.onIframeOverlayClick.bind(this));
    this.$iframeOverlay.on("mouseenter",this.onIframeOverlayMouseEnter.bind(this));
    this.$iframeOverlay.on("mouseleave",this.onIframeOverlayMouseLeave.bind(this));
    this.$subtitleDisplay.on("dblclick",this.onSubtitleDisplayDblClick.bind(this));
    this.$askInputAfterTimingCheckbox.on("click", this.onAskInputAfterTimingCheckbox.bind(this));
    this.media.addEventListener("pause",this.onPause.bind(this));
    this.media.addEventListener("play",this.onPlay.bind(this));
    this.media.addEventListener("loadedmetadata",this.onLoadedMetadata.bind(this));
    this.media.addEventListener("timeupdate",this.onTimeUpdate.bind(this));

    // keyboard shortcuts
    Mousetrap.bind(['space'], function() { this.timeSubtitle(); }.bind(this), 'keydown');
  },

  preventSubtileInputFromLosingFocus: function(event) {
    event.preventDefault();
  },

  onPreviewBtnClick: function(event) {
    window.location.href = this.repo.url;
  },

  onPublishBtnClick: function(event) {
    this.publishRepo(event);
  },

  publishRepo: function(event) {
    this.preventSubtileInputFromLosingFocus(event);

    if (this.$publishBtn.attr("disabled") == "disabled") return;

    $.ajax({
      url: this.repo.publish_url,
      type: "POST",
      dataType: "json",
      success: function(data) {
        window.location.href = data.redirect_url;
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

  normalizeTime: function(time) {
    return river.utility.normalizeTime(time);
  },

  onTrackStartChange: function(track) {
  },

  onTrackEndChange: function(track) {
  },


  onSubtitleLineInputClick: function(subtitle, $target) {
    this.pause();
    var track = subtitle.track;

    this.seek(track.startTime(), function() {
      this.playTillEndOfTrack(track);
    }.bind(this));

    if ($target.closest(".start_time").length === 0 &&
        $target.closest(".end_time").length === 0) {
      this.openEditor(track);
    }
  },

  onAddSubtitleInputFocus: function(event) {
  },

  onAddSubtitleInputKeyup: function(event) {
    if (this.shouldPauseAndPlayAfterTime()) {
      this.pauseAndPlayAfterTime(800);
    }

    var text = this.$addSubInput.val();
    // show what is being typed on video
    this.$subtitleDisplay.text(text);

    // enter key
    if (event.which == 13 ) {
      this.addSubtitledTrack(text);
    }
  },

  shouldPauseAndPlayAfterTime: function() {
    return (!this.media.paused || (this.media.paused && this.playVideoTimeout)) &&
           (this.KEYCODE_THAT_PAUSES_VIDEO.indexOf(event.which) !== -1)
  },

  pauseAndPlayAfterTime: function(milliseconds) {
    if (!this.media.paused) {
      this.pause();
    }

    if (this.playVideoTimeout) {
      clearTimeout(this.playVideoTimeout);
    }

    this.playVideoTimeout = setTimeout(function(){
      this.play();
      this.playVideoTimeout = null;
    }.bind(this), milliseconds);
  },

  addSubtitledTrack: function(text) {
    try {
      this.addTrack(this.media.currentTime,{
        preEndGhostCallback: function(track){
          track.subtitle.set({ "text": text});
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
      this.$addSubInput.hide();
      this.$addSubBtn.hide();

      this.timeline.ensureCorrectWindowPosition();
      $(".window_slider").show();
      this.$startTimingBtn.show();
      this.$askInputAfterTimingCheckbox.show();
    }

    if ($(e.target).attr("href") === "#subtitle_tab") {
      this.$startTimingBtn.hide();
      this.$stopTimingBtn.hide();
      $(".window_slider").hide();
      this.$askInputAfterTimingCheckbox.hide();

      this.$addSubInput.show();
      this.$addSubBtn.show();

      if (this.intro._currentStep === 11) {
        $(".introjs-nextbutton").removeClass("introjs-disabled");
        $(".introjs-nextbutton").trigger("click");
      }
    }

    if (this.currentTrack && this.currentTrack.isGhost) {
      this.safeEndGhostTrack(this.currentTrack);
    }
  },

  getEditorElement: function() {
    return  "<div class=''>" +
              "<div id='editor'> " +
                "<div id='editor-top' class='row'> " +
                  "<div class='repo_label_container'> " +
                    "<h5 id='repo_label'>" +
                      "<a href=" + this.repo.url + ">" + this.repo.video.name.substring(0,70) + "</a>" +
                    "</h5>" +
                    // "<div id='language' class='pull-left'>" +
                    //   "<span>" + this.repo.language_pretty + "</span>" +
                    // "</div>" +
                    // "<h6 id='video_url'>" +
                    //   "<a href=" + this.repo.video.source_url + ">" + this.repo.video.source_url + "</a>" +
                    // "</h6> " +
                  "</div> " +
                  "<div class='editor_video_container'> " +
                    "<div id='media_container'> " +
                      "<div id='viewing_screen' >" +
                        "<div id='iframe_container'>" +
                          "<div id='iframe_overlay'>" +
                          "</div>" +
                          "<div id='overlay_btn'><i class='glyphicon glyphicon-play'></i></div>" +
                        "</div> " +
                        "<div id='subtitle_bar' class='center'> " +
                          "<span id='subtitle_display' class='center'></span> " +
                        "</div> " +
                      "</div> " +
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
                "<div id='editor-bottom' class='row'> " +
                  // "<div id='tab_controls' class='pull-right'> " +
                  //     "<button type='button' id='timeline_btn' class='river_btn'> Timeline</button> " +
                  //     "<button type='button' id='subtitle_btn' class='river_btn'> Subtitle</button> " +
                  // "</div> " +
                  "<div class=''> " +
                    "<ul class='nav nav-tabs'>" +
                      "<li id='timeline_tab_anchor' class='active'><a href='#timeline_tab' data-toggle='tab'>Timeline</a></li>" +
                      "<li id='subtitle_tab_anchor' ><a href='#subtitle_tab' data-toggle='tab'>Subtitle</a></li>" +
                      "<li id='download_tab_anchor' class='pull-right'><a href='#download_tab' data-toggle='tab'>Download</a></li>" +
                      // "<li><a id='help_btn' class='' href='#'><i class='icon-question-sign'></i></a></li>" +
                    "</ul>" +
                  "</div> " + // .span12

                  "<div class=''> " +
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

                    "<div class='controls' class=''> " +
                      "<div id='main_controls' class='pull-left'> " +
                        "<button type='button' class='timeline_btn river_btn'> <i class='glyphicon glyphicon-film'></i></button> " +
                        "<button type='button' class='subtitle_btn river_btn'> <i class='glyphicon glyphicon-list'></i></button> " +
                        "<button type='button' class='start_timing_btn river_btn'> <i class=''></i>Start</button> " +
                        "<button type='button' class='stop_timing_btn river_btn'> <i class='glyphicon glyphicon-stop'></i> Stop</button> " +
                        "<div class='checkbox ask_input_after_timing_checkbox'><label><input type='checkbox' checked>Ask input after timing</label></div>" +
                        "<input class='add_sub_input' class='' placeholder='Enter Subtitle Here'> " +
                        "<button type='button' class='add_sub_btn river_btn'>Enter</a>" +
                      "</div> " +
                      "<a class='publish_btn river_btn pull-right'>Publish</a>" +
                      "<a class='preview_btn river_btn pull-right'><i class=''></i>Preview</a>" +
                    "</div> " +
                  "</div> " + // .span12
                  "<div id='status-bar' class='pull-left'> " +
                  "</div> " +
                  "<div class='template_publish_preview_container pull-right'> " +
                            // "<div id='keyboard-shortcuts' class='pull-right'> " +
                            //   "<span>" +
                            //     "<b>Keyboard Shortcuts: </b>  " +
                            //     "<kbd class='light'>Shift</kbd> Open/Close " +
                            //     "<kbd class='light'>Space</kbd> Play/Pause" +
                            //     "<kbd class='light'>Esc</kbd>   Cancel " +
                            //   "</span>" +
                            // "</div> " +
                  "</div> " + // .span12

                "</div> " +   // #editor-bottom.row
              "</div>" +  // #editor
            "</div>";  // container
  },

  setupElement: function() {
    this.$container = this.options["container"] || $("#editor_container");

    var el = this.getEditorElement();
    this.$container.append(el);

    this.$mediaContainer = $("#viewing_screen");

    river.ui.BasePlayer.prototype.setupElement.call(this);

    this.$el = $("#editor");

    if (this.user) {
      var repo_owner = "<span id='repo_owner'>" +
                         "<a href='" + this.repo.owner_profile_url + "'>" + this.repo.owner + "</a>" +
                       "</span> / ";
      this.$el.find("#repo_label").prepend(repo_owner);
    }

    this.$playBtn = $(".play_btn");
    this.$pauseBtn = $(".pause_btn");
    this.$pauseBtn.hide();

    this.$replayBtn = $("#replay_btn");
    this.$timelineBtn = $(".timeline_btn");
    this.$subtitleBtn = $(".subtitle_btn");

    $("#seek_head_body").hide();

    this.$startTimingBtn = $(".start_timing_btn");
    this.$startTimingBtn.attr("disabled","disabled");
    // this.$startTimingBtn.tooltip({trigger: "manual", title: "Mark beginning of a subtitle (Shortcut: Spacebar)"});
    this.$startTimingBtn.hide();

    this.$stopTimingBtn = $(".stop_timing_btn");
    // this.$stopTimingBtn.tooltip({trigger: "manual", title: "Mark end of a subtitle (Shortcut: Spacebar or Escape to cancel)"});
    this.$stopTimingBtn.hide();

    this.$addSubInput = $(".add_sub_input");
    this.$addSubInput.attr("maxlength", 90);

    this.$addSubBtn = $(".add_sub_btn");
    this.$addSubBtn.attr("disabled","disabled");

    this.$addSubBackwardCheckbox = $("#add_sub_backward_checkbox");
    this.$askInputAfterTimingCheckbox = $(".ask_input_after_timing_checkbox");
    this.$askInputAfterTimingCheckbox.hide();

    this.intro = introJs();

    this.$publishBtn = $(".publish_btn");
    this.$previewBtn = $(".preview_btn");

    if (this.repo.is_published) {
      this.$publishBtn.attr("disabled","disabled");
      this.$publishBtn.text("Published");
      this.$previewBtn.text("View");
      $("#editor").addClass("published");
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
    this.$timelineBtn.tooltip({title: "Timer Mode"});
    this.$subtitleBtn.tooltip({title: "Subtitle Mode"});


    $("footer").hide();
    $("#timeline_tab_anchor").hide();
    $("#subtitle_tab_anchor").hide();
    $("#download_tab_anchor").hide();
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
          element: ".preview_btn",
          intro: "Finally, to see how your subtitles look in public, you can click the preview button. ",
          position: "left"
        },
        {
          element: ".preview_btn",
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
      !$(event.target).hasClass("ui-spinner") &&
      !$(event.target).hasClass("repo_title_input") &&
      !$(event.target).hasClass("add_sub_input")) {
      this.preventSubtileInputFromLosingFocus(event);
    }
  },

  onDocumentScroll: function(event,delta) {
    // disallow horizontal scroll
    if (event.originalEvent.wheelDeltaX !== 0) {
      event.preventDefault();
    }
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
    } else if (event.which == 38) {
      // up arrow

      this.replayTrackAndEdit(this.currentTrack.prev());
    } else if (event.which == 40) {
      // down arrow

      this.replayTrackAndEdit(this.currentTrack.next());
    } else if (event.which == 27) {
      // escape key

      this.cancelGhostTrack();
    } else if (event.which >= 48 && event.which <= 90) {
      // alphanumeric
      
      if (!this.$addSubInput.is(":focus") && !$(document.activeElement).hasClass("sub_text_area")) {
        this.$addSubInput.focus();
      }
    }
  },

  onDocumentKeyup: function(event) {
    if (event.which === 13) {

      // enter key

      // this.goToNextTrack();
    }
  },

  goToNextTrack: function() {
    var nextTrack = this.focusedTrack.next();
    this.replayTrackAndEdit(nextTrack);
  },

  getTimeGap: function(currentTrack, nextTrack) {
    if (typeof nextTrack === "undefined") {
      return this.normalizeTime(this.mediaDuration() - currentTrack.endTime());
    } else {
      return this.normalizeTime(nextTrack.startTime() - currentTrack.endTime());
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

    this.hideStopShowStart();
  },

  timeSubtitle: function() {
    if (!this.isGhostTrackStarted) {
      this.hideStartShowStop();
      this.openSegment();
    } else {
      this.hideStopShowStart();
      this.closeSegment();
    }
  },

  playTillEndOfTrack: function(track) {
    track.setPauseOnTrackEnd();
    this.play();
  },

  onPlay: function(event) {
    this.$overlay_btn.find("i").removeClass("glyphicon-play");
    this.$overlay_btn.find("i").addClass("glyphicon-pause");
    this.$overlay_btn.hide();
    this.$playBtn.hide();
    this.$pauseBtn.show();
  },

  onPause: function(event) {
    this.$overlay_btn.find("i").removeClass("glyphicon-pause");
    this.$overlay_btn.find("i").addClass("glyphicon-play");
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
    this.$addSubInput.focus();

    this.currentTrack = this.tracks.at(0);

    $(document).on("keydown",this.onDocumentKeydown.bind(this));
    $(document).on("keyup",this.onDocumentKeyup.bind(this));
  },

  onPauseAdjust: function(correctPauseTime) {
  },

  onTrackRequest: function() {
    this.saveNotify();
  },

  saveNotify: function() {
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
    this.clearStatusBar();
  },

  onTrackRequestError: function(track, status) {
    this.clearStatusBar();
  },

  clearStatusBar: function() {
    setTimeout(function(){ this.$status_bar.text(""); }.bind(this),500);
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

  onSubtitleEnter: function(subtitle) {
    this.replayTrackAndEdit(subtitle.track);
  },

  seekTrackAndEdit: function(track) {
    if (typeof track === "undefined") return;

    this.seek(track.startTime());
    this.openEditorAndHighlight(track);
  },

  replayTrackAndEdit: function(track) {
    if (typeof track === "undefined") return;

    this.seek(track.startTime(), function() {
      this.playTillEndOfTrack(track);
    }.bind(this));

    this.openEditorAndHighlight(track);
  },

  openEditor: function(track) {
    track.subtitle.openEditor();
    track.openEditor();
  },

  highlight: function(track) {
    track.subtitle.highlight();
    track.highlight();
  },

  openEditorAndHighlight: function(track) {
    this.openEditor(track);
    this.highlight(track);
  },

  closeEditor: function(track) {
    track.subtitle.closeEditor();
    track.closeEditor();
  },

  onGhostTrackStart: function(track) {
    this.isGhostTrackStarted = true;
    this.currentGhostTrack = track;
  },

  hideStartShowStop: function() {
    if ($("#timeline_tab").hasClass("active")) {
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
    }
  },

  hideStopShowStart: function() {
    if ($("#timeline_tab").hasClass("active")) {
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
    }
  },

  onGhostTrackEnd: function(track) {
    this.$addSubInput.val("");

    this.isGhostTrackStarted = false;
    this.currentGhostTrack = null;

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

    if (track.shouldPauseOnTrackEnd()) {
      track.unsetPauseOnTrackEnd();
      this.ensurePauseAtTrack(track, {});
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
        if (this.shouldAskInputAfterTiming()) {
          this.openEditorAndHighlight(track);
        }
      }
    }
  },

  onTrackRemove: function(track) {
    if (this.currentTrack === track) {
      var prevTrack = this.prevNearestTrack(track.startTime());
      this.currentTrack = prevTrack;
    }

    if (this.focusedTrack === track) {
      this.focusedTrack = null;
    }

    if (track.subtitle === this.$subtitleDisplay.data("subtitle")) {
      this.$subtitleDisplay.data("subtitle", null);
      this.$subtitleDisplay.text("");
    }
  },

  onTrackInputFocus: function(track) {
    this.focusedTrack = track;
  },

  onTrackInputBlur: function(track) {
    track.save();
  },

  onTrackInputKeyup: function(event, text, track) {
    if (event.which === 13) {
      track.closeEditor();
      this.play();
    }
  },

  onSubtitleLineKeydown: function(subtitle) {
    if (event.which == 13 ) { // ENTER
      if (this.focusedTrack.isLast()) {
        time = this.normalizeTime(this.focusedTrack.endTime() + this.TRACK_MARGIN);
        track = this.addFullTrack(time, { isGhost: false, isAddSubBackward: false });
        this.replayTrackAndEdit(track);
      } else {
        this.goToNextTrack();
      }
    }
  },

  onIframeOverlayClick: function(event) {
    this.preventSubtileInputFromLosingFocus(event);
    this.closeAllEditors();
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

  onSubtitleLineEdit: function(track) {
    this.focusedTrack = track;
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

    this.openEditorAndHighlight(this.currentTrack);
  },

  onAskInputAfterTimingCheckbox: function(event) {
    event.preventDefault();

    var $checkbox = this.$askInputAfterTimingCheckbox.find("input");
    if ($checkbox.is(":checked")) {
      $checkbox.attr("checked", false);
    } else {
      $checkbox.attr("checked", true);
    }
  },

  onPlayBtnClick: function(event) {
    this.preventSubtileInputFromLosingFocus(event);
    this.closeAllEditors();
    this.play();
  },

  onPauseBtnClick: function(event) {
    this.preventSubtileInputFromLosingFocus(event);
    this.pause();
  },

  onReplayBtnClick: function(event) {
    this.preventSubtileInputFromLosingFocus(event);
    this.replayTrackAndEdit(this.currentTrack);
  },

  onTimelineBtnClick: function(event) {
    this.preventSubtileInputFromLosingFocus(event);
    $("#timeline_tab_anchor a").tab("show");
  },

  onSubtitleBtnClick: function(event) {
    this.preventSubtileInputFromLosingFocus(event);
    $("#subtitle_tab_anchor a").tab("show");
  },

  onBackwardBtnClick: function(event) {
    this.preventSubtileInputFromLosingFocus(event);
    this.seek(this.media.currentTime - this.SEEK_DURATION);
  },

  onForwardBtnClick: function(event) {
    this.preventSubtileInputFromLosingFocus(event);
    this.seek(this.media.currentTime + this.SEEK_DURATION);
  },

  onStartTimingBtnMouseEnter: function(event) {
    // this.$startTimingBtn.tooltip('show');
  },

  onStartTimingBtnMouseLeave: function(event) {
    // this.$startTimingBtn.tooltip('hide');
  },

  onStopTimingBtnMouseEnter: function(event) {
    // this.$stopTimingBtn.tooltip('show');
  },

  onStopTimingBtnMouseLeave: function(event) {
    // this.$stopTimingBtn.tooltip('hide');
  },

  onStartTimingBtn: function(event) {
    this.hideStartShowStop();
    this.preventSubtileInputFromLosingFocus(event);
    this.openSegment();
  },

  onStopTimingBtn: function(event) {
    this.hideStopShowStart();
    this.preventSubtileInputFromLosingFocus(event);
    this.closeSegment();
  },

  openSegment: function() {
    if (typeof this.focusedTrack !== "undefined" && this.focusedTrack) {
      this.closeEditor(this.focusedTrack);
    }

    if (this.$startTimingBtn.attr("disabled") == "disabled") return;
    this.startTiming = true;
    this.safeCreateGhostTrack(this.media.currentTime);
    this.play();
  },

  closeSegment: function() {
    var track = this.currentGhostTrack;
    this.safeEndGhostTrack(track);
    
    if (this.startTiming) {
      this.startTiming = false;
      if (this.shouldAskInputAfterTiming()) {
        this.pause();
        this.openEditorAndHighlight(track);
      }
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

  shouldAskInputAfterTiming: function() {
    return this.$askInputAfterTimingCheckbox.find("input").is(":checked");
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

    var track = this.addFullTrack(this.media.currentTime, { isAddSubBackward: false });
    this.openEditorAndHighlight(track);
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

        this.safeEndGhostTrack(track, endTime);

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
      var trackSlot = this.getTrackSlot(startTime, options.isAddSubBackward);
      startTime = trackSlot.startTime;
      var endTime   = trackSlot.endTime;
    }

    options.isGhost = options.isGhost || false;

    var attributes = {
      start_time: startTime,
      end_time: endTime
    };

    var track = new river.model.Track(attributes, { popcorn: this.popcorn, isGhost: options.isGhost});
    track.fadingHighlight();

    this.tracks.add(track);

    return track;
  },

  getTrackSlot: function(currentTime, isAddSubBackward) {
    var prevNearestEdgeTime = this.prevNearestEdgeTime(currentTime);
    var nextNearestEdgeTime = this.nextNearestEdgeTime(currentTime);

    if (typeof isAddSubBackward === "undefined") {
      isAddSubBackward = this.addSubBackward;
    }

    if (isAddSubBackward) {
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

    var overlapTracks = this.getOverlapTracks(startTime,endTime) ;

    if (overlapTracks.length !== 0) {
      var trackSlot = this.getNextAvailableTrackSlot(startTime);
      startTime = trackSlot.startTime;
      endTime   = trackSlot.endTime;
    }

    if (endTime < startTime) {
      endTime = startTime + this.MINIMUM_TRACK_DURATION;
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

  closeAllEditors: function() {
    if (typeof this.currentTrack !== "undefined" && this.currentTrack) {
      this.closeEditor(this.currentTrack);
    }

    if (typeof this.focusedTrack !== "undefined" && this.focusedTrack) {
      this.closeEditor(this.focusedTrack);
    }
  },

  seek: function(time,callback) {
    Backbone.trigger("editorseek");

    if (time < 0 )                   time = 0;
    if (time > this.mediaDuration()) time = this.mediaDuration();

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

    endTime = endTime - this.TRACK_MARGIN;

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
      // will get here if duration becomes negative. This can get triggered when track is ghost
      // and user seek to before track start time. In this case assume user wants to move ghost
      // track to that point

      track.setStartTime(time);

      // track.remove();
      // throw e;
    }
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
    this.$subtitleDisplay.data("subtitle", subtitle);
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
