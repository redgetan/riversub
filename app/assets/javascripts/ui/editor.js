river.ui.Editor = river.ui.BasePlayer.extend({
  initialize: function(options) {
    river.ui.BasePlayer.prototype.initialize.call(this,options);

    this.timeline.setTracks(this.tracks);

    // initally commands are disabled/ enabled only when things are loaded
    this.disableCommands();

    this.currentTrack = null;
    this.currentGhostTrack = null;
    this.isGhostTrackStarted = false;
    this.isOnSubtitleEditMode = null;
    this.safeEndGhostLock = false;

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

    Backbone.on("expandedtimelinedblclick",this.onExpandedTimelineDblClick.bind(this));
    Backbone.on("trackseek",this.onTrackSeekHandler.bind(this));
    Backbone.on("subtitleeditmode",this.onSubtitleEditMode.bind(this));
    Backbone.on("subtitlelinedblclick",this.onSubtitleLineDblClick.bind(this));
    Backbone.on("subtitlelineedit",this.onSubtitleLineEdit.bind(this));
    Backbone.on("subtitlelineblur",this.onSubtitleLineBlur.bind(this));
    Backbone.on("subtitletextkeyup",this.onSubtitleTextKeyup.bind(this));
    Backbone.on("ghosttrackstart",this.onGhostTrackStart.bind(this));
    Backbone.on("ghosttrackend",this.onGhostTrackEnd.bind(this));
    Backbone.on("trackremove",this.onTrackRemove.bind(this));
    Backbone.on("pauseadjust",this.onPauseAdjust.bind(this));
    Backbone.on("trackrequest",this.onTrackRequest.bind(this));
    Backbone.on("editor.sync",this.onEditorSync.bind(this));

    $(document).on("click",this.onDocumentClick.bind(this));
    $(document).on("mousewheel",this.onDocumentScroll.bind(this));


    $('[data-toggle="tab"]').on('shown.bs.tab', this.onTabShown.bind(this));

    this.$publishBtn.on("click",this.onPublishBtnClick.bind(this));
    this.$addSubInput.on("focus",this.onAddSubtitleInputFocus.bind(this));
    this.$addSubInput.on("keyup",this.onAddSubtitleInputKeyup.bind(this));
    this.$addSubInput.on("blur",this.onAddSubtitleInputBlur.bind(this));
    this.$addSubBtn.on("click",this.onAddSubtitleBtnClick.bind(this));
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
  },

  onPublishBtnClick: function(event) {
    if (this.$publishBtn.attr("disabled") == "disabled") return;

    $.ajax({
      url: this.repo.publish_url,
      type: "POST",
      data: {
        token: this.repo.token
      },
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

  onAddSubtitleInputFocus: function(event) {
    this.disableCommands();
  },

  onAddSubtitleInputKeyup: function(event) {
    // enter key
    if (event.which == 13 ) {
      var track = this.currentGhostTrack;
      this.safeEndGhostTrack(track);
    } else if (!this.isGhostTrackStarted && this.$addSubInput.val().trim() !== "") {
      this.safeCreateGhostTrack();
      this.play();
    }

    var track = this.currentGhostTrack;
    if (track) {
      var text = this.$addSubInput.val();
      track.subtitle.set({ "text": text});
      this.$subtitleDisplay.text(text);
    }
  },

  onAddSubtitleInputBlur: function(event) {
    var track = this.currentGhostTrack;
    if (track) {
      this.safeEndGhostTrack(track);
    }
    this.enableCommands();
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
                      "<a href=" + this.repo.url + ">" + this.repo.video.name + "</a>" +
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
                          "<input id='subtitle_edit' class='span7 center' type='text' maxlength='90' placeholder='Enter Subtitle Here'> " +
                        "</div> " +
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
                      "<li id='subtitle_tab_anchor' ><a href='#subtitle_tab' data-toggle='tab'>Subtitle</a></li>" +
                      "<li id='download_tab_anchor' ><a href='#download_tab' data-toggle='tab'>Download</a></li>" +
                      // "<li><a id='help_btn' class='' href='#'><i class='icon-question-sign'></i></a></li>" +
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
                      // "<div id='open_close_btns' class='btn-group pull-right'> " +
                      //   "<a id='start_timing_btn' class='btn btn-primary'>Open</a> " +
                      //   "<a id='stop_timing_btn' class='btn btn-primary'>Close</a> " +
                      // "</div> " +
                      "<div id='add_sub_container' class='input-append pull-right'> " +
                        "<input id='add_sub_input' class='span3' type='text' placeholder='type here and press [enter]'>" + 
                        "<a id='add_sub_btn' class='btn btn-primary'>Add</a> " +
                      "</div> " +
                      // "<div class='btn-group pull-right'> " +
                      // "</div> " +
                    "</div> " +
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
                  "<div class='span12'> " +
                          "<div class='row'> " +
                            "<div id='status-bar' class='span3'> " +
                            "</div> " +
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

    this.$startTimingBtn = $("#start_timing_btn");
    this.$startTimingBtn.attr("disabled","disabled");

    this.$stopTimingBtn = $("#stop_timing_btn");
    this.$stopTimingBtn.hide();

    this.$addSubInput = $("#add_sub_input");

    this.$addSubBtn = $("#add_sub_btn");
    this.$addSubBtn.attr("disabled","disabled");

    this.intro = introJs();

    this.$publishBtn = $("#publish_btn");

    this.$publishBtn.tooltip({title: "Make video public"});

    this.$previewBtn = $("#preview_btn");

    if (this.repo.is_published) {
      this.$previewBtn.tooltip({title: "See how it'll look in public"});
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

    this.$subtitleEdit = $("#subtitle_edit");
    this.hideSubtitleEdit();

    this.$iframeOverlay = $("#iframe_overlay");
    this.$overlay_btn = $("#overlay_btn");

    this.$video_name = $("#video_name");

    this.$video_url = $("#video_url");

    this.$language_select = $('#language_select');
    this.$language_select.selectpicker();

    this.$keyboard_shortcuts = $("#keyboard-shortcuts");
    this.$status_bar = $("#status-bar");



    $("footer").hide();
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

  onDocumentClick: function(event) {
    var $target = $(event.target);
    var isSubtitleEdit = $target.attr("id") === "subtitle_edit" ;

    var isSubtitleEditTrack = false;

    if ($target.hasClass("track") && this.$subtitleEdit.data("track")) {
      isSubtitleEditTrack = $target.data("model") === this.$subtitleEdit.data("track");
    }

    if (isSubtitleEdit || isSubtitleEditTrack) {
    } else {
      this.hideSubtitleEdit();
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

  onKeyupHandler: function(event) {
    // shift key
    if (event.which === 16) {
      // this.timeSubtitle();
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
    }
  },

  onTrackSeekHandler: function(time) {
    this.seek(time, function() {
      this.playTillEndOfTrack();
    }.bind(this));
  },

  playTillEndOfTrack: function() {
    this.pauseOnTrackEnd = true;
    this.play();
  },

  onPlay: function(event) {
    this.$overlay_btn.find("i").removeClass("icon-play");
    this.$overlay_btn.find("i").addClass("icon-pause");
  },

  onPause: function(event) {
    this.seek(this.lastTimeUpdateTime);
    this.$overlay_btn.find("i").removeClass("icon-pause");
    this.$overlay_btn.find("i").addClass("icon-play");
    this.$overlay_btn.show();
  },

  onLoadedMetadata: function(event) {
    this.$startTimingBtn.removeAttr("disabled");
    this.$addSubBtn.removeAttr("disabled");
    this.enableCommands();
    Backbone.trigger("editor.ready");
    this.setupIntroJS();
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

  onTrackRequestSuccess: function() {
    setTimeout(function(){ this.$status_bar.text(""); }.bind(this),500);
  },

  onTrackRequestError: function() {
    this.$status_bar.text("Save Failed");
    this.$status_bar.addClass("failed");

    setTimeout(function(){ 
      this.$status_bar.text(""); 
      this.$status_bar.removeClass("failed");
    }.bind(this),3000);
  },

  onSubtitleLineDblClick: function(subtitle) {
    this.pause();
  },

  onSubtitleEditMode: function(track) {
    if (track.isRemoved()) return;

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
    this.$stopTimingBtn.show({
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
    this.currentTrack = null;
    this.$stopTimingBtn.hide({
      complete: function() {
        if (this.intro._currentStep === 2) { 
          $(".introjs-nextbutton").removeClass("introjs-disabled");
          $(".introjs-nextbutton").trigger("click");
        }
        this.$startTimingBtn.show();
      }.bind(this)
    });
    track.fadingHighlight();
  },

  onTrackStart: function(track) {
    // console.log("ontrackstart" + track.toString());
    this.currentTrack = track;

    var subtitle = track.subtitle;
    track.highlight();
    subtitle.highlight();

    this.showSubtitleInSubtitleBar(subtitle);
  },

  onTrackEnd: function(track) {
    // console.log("ontrackend" + track.toString());
    this.currentTrack = null;

    this.hideSubtitleInSubtitleBar();

    track.unhighlight();
    track.subtitle.unhighlight();

    if (this.pauseOnTrackEnd) {
      this.pauseOnTrackEnd = false;
      this.pause();
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
    } 
  },

  onTrackRemove: function(track) {
    this.isOnSubtitleEditMode = null;
    this.hideSubtitleEdit();
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
    var track = this.$subtitleEdit.data("track")
    track.save();
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
    this.$addSubBtn.removeAttr("disabled");
  },

  disableCommands: function(event) {
    $(document).off("keyup");
    this.$startTimingBtn.attr("disabled","disabled");
    this.$addSubBtn.attr("disabled","disabled");
  },

  onSubtitleEditKeyup: function(event) {
    var text  = this.$subtitleEdit.val();
    var track = this.$subtitleEdit.data("track");

    track.subtitle.set({ "text": text});
    this.$subtitleDisplay.text(text);

    // escape key
    if (event.which == 27) {
      this.isOnSubtitleEditMode = null;
      this.hideSubtitleEdit();
      this.$subtitleDisplay.show();
      this.play();
    }

    // enter key
    if (event.which == 13) {
      this.isOnSubtitleEditMode = null;
      this.hideSubtitleEdit();
      this.$subtitleDisplay.show();
      this.play();
    }
  },

  onSubtitleTextKeyup: function(text) {
    this.$subtitleDisplay.text(text);
  },

  onSubtitleDisplayDblClick: function(event) {
    var $target = $(event.target);

    this.requestSubtitleFromUser(this.currentTrack);
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
  },

  // returns null if unsuccessful
  safeCreateGhostTrack: function() {
    try {
      return this.createGhostTrack();
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
    this.$addSubInput.focus();
  },

  onExpandedTimelineDblClick: function(event) {
    var $target = $(event.target);

    if ($target.hasClass("track") || $target.hasClass("track_text")) {
      return;  
    }

    // add a track
    var trackDuration = 4;
    var track = this.safeCreateGhostTrack();

    if (track) {
      var endTime   = this.determineEndTime(track.startTime());

      // if seeking to less than start time next track, we have to endGhostTrack ourselves
      // otherwise, if were seeking to start time of next track, we simply let onTrackEnd to trigger safeEndGhostTrack,
      //            and avoid calling safeEndGhostTrack again
      if (this.media.currentTime + trackDuration < endTime) {
        endTime = this.media.currentTime + trackDuration;

        this.seek(endTime,function(){
          this.safeEndGhostTrack(track);
        }.bind(this));
      } else {
        this.seek(endTime);
      }
    }
  },

  seek: function(time,callback) {
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

  createGhostTrack: function() {

    var startTime = Math.round(this.media.currentTime * 1000) / 1000;
    var endTime   = this.determineEndTime(startTime);

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
    } catch(e) {
      track.remove();
      throw e;
    }
  },

  requestSubtitleFromUser: function(track) {
    Backbone.trigger("subtitleeditmode",track);
  },

   /* When you're timing a track while media is playing, and you're very near the start of next track,
   *   pausing might result in scrubber being inside next track since pausing is not immediate (it takes a few millisec
   * This function would ensure that pausing would stop at current track
   */
  ensurePauseAtTrack: function(track,callback) {
    var seekBackToTrack = function() {
      // make sure to remove this callback
      this.media.removeEventListener("pause",seekBackToTrack);

      var executeCallback = function() {
        this.popcorn.off("seeked",executeCallback);
        callback();
      }.bind(this);

      this.popcorn.on("seeked",executeCallback);

      this.seek(track.startTime());

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
      throw new Error("Track Overlap Detected. Track(" + startTime + "," + endTime + ") " +
        "would overlap with " + $.map(tracks,function(track) { return track.toString(); })
      );
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
    if (this.isOnSubtitleEditMode) return;
    this.hideSubtitleEdit();
    this.$subtitleDisplay.show();
    this.$subtitleDisplay.text(subtitle.get("text"));
  },

  hideSubtitleInSubtitleBar: function(subtitle) {
    this.$subtitleDisplay.text("");
  },

  hideSubtitleEdit: function() {
    if (!this.$subtitleEdit.is(':visible')) return;

    this.$subtitleEdit.blur();

    this.$subtitleEdit.hide(0,function(){
      this.isOnSubtitleEditMode = null;

      if (this.intro._currentStep === 3 ) { 
        if (this.currentTrack.text().length === 0 ) {
          this.showSubtitleEdit(this.currentTrack);
        } else {
          $(".introjs-nextbutton").removeClass("introjs-disabled");
          $(".introjs-nextbutton").trigger("click");
        }
      }
    }.bind(this));
  },

  // either the end of media or the starttime next nearest track
  determineEndTime: function(startTime) {
    var nextNearestEdgeTime = this.mediaDuration();
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
    for (var i = this.tracks.models.length - 1; i >= 0; i--) {
      this.tracks.models[i].remove();
    }
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

});
