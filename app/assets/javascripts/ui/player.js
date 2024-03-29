river.ui.Player = river.ui.BasePlayer.extend({

  initialize: function(options) {
    this.IFRAME_OVERLAY_NON_AD_OVERLAPPING_FACTOR = 2.3;
    this.MAX_SUBTITLE_DISPLAY_FONT_SIZE = 80;
    this.MIN_SUBTITLE_DISPLAY_FONT_SIZE = 12;

    river.ui.BasePlayer.prototype.initialize.call(this,options);

    this.setupOverlayBtn();
    this.setupSubtitleZoom();
    this.setupLanguageSelect();

    this.hideEditing();
    this.postBindEvents();

    if (repo.highlight_subtitle_short_id) {
      var subtitle = this.subtitles.filter(function(subtitle){ 
        return subtitle.get("short_id") === repo.highlight_subtitle_short_id; 
      })[0];

      this.seek(subtitle.track.startTime());
    }

    this.$el = $("#river_player");

    river.utility.enableHashTab();

    // // ensure first subtitle appears 
    this.onTrackStart(this.tracks.at(0));
  },

  setupOverlayBtn: function () {
    this.$overlay_btn.html("<i class='fa fa-play'></i>");
  },

  initializeRepository: function() {
    this.user = this.repo.user;
    this.addPlayerControls();

    this.repository = new river.model.Repository(this.repo);
    this.subtitles  = new river.model.SubtitleSet("",this.options);
    this.tracks = this.repository.tracks;

    var timings = this.repo.timings || [];
    var options = $.extend(this.options,{ popcorn: this.popcorn });
    this.loadTracks(timings, options);

    // show second subtitle (i.e eng/jap - show jap "original"  below eng sub)
    var timings = this.repo.original_timings || [];
    var options = $.extend(this.options,{ 
      popcorn: this.popcorn,
      original: true
    });

    this.loadTracks(timings, options);

    this.bindEvents();
  },

  loadTracks: function(timings, options) {
    if (typeof timings !== "undefined") {
      for (var i = 0; i < timings.length; i++) {
        try {
          var track = new river.model.Track(timings[i],$.extend(options,{showUI: false}));
          this.tracks.add(track);
        } catch(e) {
          console.log(e.stack);
        }
      };
    }
  },

  setupElement: function() {
    river.ui.BasePlayer.prototype.setupElement.call(this);
    this.$iframeOverlay = $("#iframe_overlay");
    this.$overlay_btn = $("#overlay_btn");
    this.$subtitleList = $("#subtitle_list");
    this.$subtitleContainer = $("#transcript_container");
    this.$media = $("#media");
    this.$timer;
    this.$subtitleOriginalDisplay = $("#subtitle_original_display");
    this.$subtitleOriginalDisplay.css("opacity",0.8);
  },

  setupLanguageSelect: function() {
    var repo_language;
    var selectedAttr;
    var option;

    var html = "<select class='player_language_select' style=''>";

    for (var i = 0; i < this.repo.player_repository_languages.length ; i++) {
      repo_language = this.repo.player_repository_languages[i];
      selectedAttr = (repo_language.url === this.repo.url) ? "selected" : "";
      option = "<option data-url='" + repo_language.url + "' " + selectedAttr + " >" + repo_language.language + "</option>";
      html += option;
    }

    html += "</select>";

    $(".player_controls").append(html);

    this.$playerLanguageSelect = $(".player_language_select");
    // this.$playerLanguageSelect.select2();


    // prevent selection from showing the focus highlight
    $(".select2-selection--single").on("focus",function(){ 
      $(".select2-selection--single").blur(); 
    });
  },

  setupSubtitleZoom: function() {
    var zoomInBtn = "<i class='subtitle_zoom_in_btn fa fa-search-plus'></i>";
    var zoomOutBtn = "<i class='subtitle_zoom_out_btn fa fa-search-minus'></i>";
    var expandBtn = "<i class='expand_btn fa fa-arrows-alt'></i>";
    var rightControls = "<div class='player_right_controls'></div>";

    $(".player_controls").append(rightControls);
    $(".player_right_controls").append(zoomInBtn);
    $(".player_right_controls").append(zoomOutBtn);
    $(".player_right_controls").append(expandBtn);

    this.$zoomInBtn = $(".subtitle_zoom_in_btn");
    this.$zoomOutBtn = $(".subtitle_zoom_out_btn");
    this.$expandBtn = $(".expand_btn");
  },

  seekDuration: function() {
    return 5;
  },

  postInitializeCommon: function() {
    this.summaryTimeline = new river.ui.SummaryTimeline({
      tracks: this.tracks,
      media: this.popcorn.media, 
      mediaDuration: this.mediaDuration(), 
      hideTracks: true 
    });
  },

  onIframeOverlayClick: function(event) {
    if (river.utility.isMobile()) {
      if (!$("html").hasClass("fullscreen")) {
        this.enterFullscreenMode();
      }

      // on mobile, clicking overlay always plays the video
      if ((repo.video.source_type === "youtube") && (this.playerObject().playVideo !== "undefined")) {
        this.playerObject().playVideo();
      } else {
        this.play();
      }

      if (!this.media.paused) {
        // if its already playing, clicking would toggle playercontrols
        if ($(".player_controls").is(":visible")) {
          $(".player_controls").fadeOut();
        } else {
          $(".player_controls").fadeIn();
        }

      }
    } else {
      this.togglePlayPause();
    }
  },

  onOverlayBtnClick: function(event) {
    this.togglePlayPause();
  },

  onPlay: function(event) {
    this.$overlay_btn.hide();
    this.$playBtn.hide();
    this.$pauseBtn.show();
  },

  onPause: function(event) {
    this.$overlay_btn.show();
    this.$pauseBtn.hide();
    this.$playBtn.show();
  },

  onPlayBtnClick: function(event) {
    event.preventDefault();
    this.play();
  },

  onPauseBtnClick: function(event) {
    event.preventDefault();
    this.pause();
  },

  onExpandBtnClick: function(event) {
    event.preventDefault();
    
    $(".player_controls").show(); // make sure its visible so dimensions can be adjusted

    if ($("html").hasClass("fullscreen")) {
      this.exitFullscreenMode(event);
    } else {
      this.enterFullscreenMode(event);
    }
  },

  enterFullscreenMode: function(event) {
    $("#media_container").fullscreen();    

    $("html").addClass("fullscreen");
    this.$expandBtn.removeClass("fa-arrows-alt");
    this.$expandBtn.addClass("fa-compress");

    // make subtitle look bigger unless mobile
    if (!river.utility.isMobile()) {
      this.$subtitleDisplay.css("font-size",40);
      this.$subtitleDisplay.css("line-height","42px");
      this.$subtitleOriginalDisplay.css("font-size",36);
      this.$subtitleOriginalDisplay.css("line-height","38px");
    }

    this.resizePlayerTimeline();
  },

  exitFullscreenMode: function(event) {
    $.fullscreen.exit();
  },

  onFullScreenChange: function(event) {
    if (this.subtitleViewingScreenMarginPercentage) {
      var subtitleTop = this.getSubtitleTop(this.subtitleViewingScreenMarginPercentage);
      this.$subtitleBar.css("top", subtitleTop + "px");
    }
  },

  onFullScreenClose: function(event) {
    $("html").removeClass("fullscreen");

    this.$expandBtn.removeClass("fa-compress");
    this.$expandBtn.addClass("fa-arrows-alt");
    this.resizePlayerTimeline();

    this.$subtitleDisplay.css("font-size",this.repo.font_size);
    this.$subtitleDisplay.css("line-height",parseInt(this.repo.font_size) + 2 + "px");
    this.$subtitleOriginalDisplay.css("font-size",this.repo.font_size);
    this.$subtitleOriginalDisplay.css("line-height",parseInt(this.repo.font_size) + 2 + "px");
  },

  bindEvents: function() {
    river.ui.BasePlayer.prototype.bindEvents.call(this);
    this.$iframeOverlay.on("click",this.onIframeOverlayClick.bind(this));
    this.$overlay_btn.on("click",this.onOverlayBtnClick.bind(this));
    this.media.addEventListener("pause",this.onPause.bind(this));
    this.media.addEventListener("play",this.onPlay.bind(this));
    this.$mediaContainer.on("mousemove",this.onMediaMouseMove.bind(this));
    $("#viewing_screen").on("mousemove",this.onMediaMouseMove.bind(this));
    this.popcorn.on("timeupdate",this.onTimeUpdate.bind(this));
    this.popcorn.on("progress", this.onProgress.bind(this) );
    document.addEventListener(screenfull.raw.fullscreenchange, this.onFullScreenChange.bind(this));
    
  },

  postBindEvents: function() {
    this.$playBtn.on("mousedown",this.onPlayBtnClick.bind(this));
    this.$pauseBtn.on("mousedown",this.onPauseBtnClick.bind(this));
    this.$expandBtn.on("mousedown",this.onExpandBtnClick.bind(this));
    this.$playerLanguageSelect.on("change", this.onPlayerLanguageSelectChange.bind(this));
    this.$zoomInBtn.on("click", this.onZoomInBtnClick.bind(this));
    this.$zoomOutBtn.on("click", this.onZoomOutBtnClick.bind(this));
    this.$mediaContainer.on("fscreenclose", this.onFullScreenClose.bind(this));
  },

  onPlayerLanguageSelectChange: function(event) {
    var url = this.$playerLanguageSelect.find("option:selected").data("url");
    window.location.href = url;
  },

  onZoomInBtnClick: function(event) {
    event.preventDefault();
    var originalFontSize = parseInt(this.$subtitleDisplay.css("font-size"));
    var secondaryOriginalFontSize = parseInt(this.$subtitleOriginalDisplay.css("font-size"));

    if (originalFontSize < this.MAX_SUBTITLE_DISPLAY_FONT_SIZE) {
      this.$subtitleDisplay.css("font-size",originalFontSize + 2);
      this.$subtitleDisplay.css("line-height",originalFontSize + 2 + "px");
      this.$subtitleOriginalDisplay.css("font-size",secondaryOriginalFontSize + 2);
      this.$subtitleOriginalDisplay.css("line-height",secondaryOriginalFontSize + 2 + "px");
    }
  },

  onZoomOutBtnClick: function(event) {
    event.preventDefault();
    var originalFontSize = parseInt(this.$subtitleDisplay.css("font-size"));
    var secondaryOriginalFontSize = parseInt(this.$subtitleOriginalDisplay.css("font-size"));

    if (originalFontSize > this.MIN_SUBTITLE_DISPLAY_FONT_SIZE) {
      this.$subtitleDisplay.css("font-size",originalFontSize - 2);
      this.$subtitleDisplay.css("line-height",originalFontSize - 2 + "px");
      this.$subtitleOriginalDisplay.css("font-size",secondaryOriginalFontSize - 2);
      this.$subtitleOriginalDisplay.css("line-height",secondaryOriginalFontSize - 2 + "px");
    }
  },

  onMediaMouseMove: function(event) {
    if (!river.utility.isMobile()) {
      this.showPlayerControlsFor(5000);
    }
  },

  showPlayerControlsFor: function(milliseconds) {
    if (!this.$fadeInBuffer) {
      if (this.$timer) {
          clearTimeout(this.$timer);
          this.$timer = 0;
      }
     $(".player_controls").fadeIn();
    } else {
      this.$fadeInBuffer = false;
    }

    this.$timer = setTimeout(function () {
      $(".player_controls").fadeOut();
      this.$fadeInBuffer = true;
    }, milliseconds);
  },


  onProgress: function() {
    this.renderTimeLoaded();
  },

  onTimeUpdate: function(event) {
    this.renderTimeCurrent();
  },

  renderTimeLoaded: function() {
    var secondsLoaded = this.popcorn.video.buffered.end(0);
    var width = secondsLoaded * this.summaryTimeline.resolution(this.summaryTimeline.$summary);
    this.$timeLoaded.css("width", width);
  },

  renderTimeCurrent: function() {
    var seconds = this.media.currentTime;  
    var width = seconds * this.summaryTimeline.resolution(this.summaryTimeline.$summary);
    this.$timeCurrent.css("width", width);

    if (seconds >= (this.mediaDuration() - this.VIDEO_END_PADDING)) {
      this.goToBeginningOfVideo();
    }
  },

  goToBeginningOfVideo: function() {
    this.pause();
    this.seek(0);
  },

  onWindowResize: function(event) {
    river.ui.BasePlayer.prototype.onWindowResize.call(this, event);
    $(".player_controls").show(); // make sure its visible so dimensions can be adjusted
    this.resizePlayerTimeline();
  },

  resizePlayerTimeline: function() {
    this.summaryTimeline.setTimelineWidth();
    this.renderTimeCurrent();
    
    if (this.isLoadedMetadata) {
      this.renderTimeLoaded();
    }
  },

  onTrackStart: function(track) {
    if (typeof track === "undefined") return;
    this.showSubtitleInSubtitleBar(track.subtitle);
    if (!track.isOriginal) track.subtitle.highlight();
  },

  onTrackEnd: function(track) {
    this.hideSubtitleInSubtitleBar(track.subtitle);
    if (!track.isOriginal) track.subtitle.unhighlight();
  },

  showSubtitleInSubtitleBar: function(subtitle) {
    if (subtitle.isOriginal) {
      this.$subtitleOriginalDisplay.text(subtitle.get("text"));
    } else {
      this.$subtitleDisplay.text(subtitle.get("text"));
    }
  },

  hideSubtitleInSubtitleBar: function(subtitle) {
    if (subtitle.isOriginal) {
      this.$subtitleOriginalDisplay.text("");
    } else {
      this.$subtitleDisplay.text("");
    }
  },

  addPlayerControls: function() {
    river.ui.BasePlayer.prototype.addPlayerControls.call(this);
    $("#summary").append("<span class='time_total'></span>");
    $("#summary").append("<span class='time_loaded'></span>");
    $("#summary").append("<span class='time_current'></span>");
    
    this.$timeTotal = $(".time_total");
    this.$timeLoaded = $(".time_loaded");
    this.$timeCurrent = $(".time_current");
  },

  hideEditing: function() {
    this.$backwardBtn.hide();
    this.$forwardBtn.hide();

    this.$subtitleContainer.find(".header").remove(); // remove heading
    this.$subtitleList.find(".start_time").each(function(){
      $(this).remove();
    });
    this.$subtitleList.find(".end_time").each(function(){
      $(this).remove();
    });
    this.$subtitleList.find(".delete").each(function(){
      $(this).remove();
    });

    $(".time_indicator").hide();

    // remove subtitle lines that are blank
    $(".subtitle").each(function(){
      if ($(this).find(".text").text().length === 0) {
        $(this).remove();
      }
    });

    // remove parent text
    $(".subtitle .parent_text").remove();
  },

});

river.ui.MiniPlayer = river.ui.Player.extend({

  initialize: function(options) {
    river.ui.BasePlayer.prototype.initialize.call(this,options);
    this.hideEditing();
    this.$el = $("#river_player");
  },

  postInitializeCommon: function() {
    // override player's hook - set to empty
    $("#player_loading_notice").hide();
  },

  bindEvents: function() {
    river.ui.BasePlayer.prototype.bindEvents.call(this);
  },

  hideEditing: function() {
    river.ui.Player.prototype.hideEditing.call(this);
    this.$media.css("height","300px");
    this.$media.css("width","400px");
    this.$mediaContainer.css("width","400px");

    this.$iframeOverlay.hide();
   $(".player_controls").hide();

    this.$overlay_btn.hide();
    $("#time_float").hide();
    $("#seek_head").hide();
    $("#blackbar").css("height","5px");
  }

});
