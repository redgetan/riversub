river.ui.BasePlayer = Backbone.View.extend({
  initialize: function(options) {
    this.options = options || {};
    this.initializeCommon();

    if (this.options.video) {
      this.initializeVideo();
    } else {
      this.initializeRepository();
    }

    if (river.utility.isMobile()) {
      $("html").addClass("mobile");
    }

    this.initializeKeyboardShortcuts();

    // hide it initially so that we can click on flash object to load/request the actual nicoplayer
    if (this.isNicoEmbed() || this.repo.video.source_type === "vimeo") {
      this.$overlay_btn.remove();
      this.$iframeOverlay.hide();
    }
  },

  seekDuration: function() {
    throw "seekDuration must be implemented by subclass of BasePlayer";
  },

  initializeKeyboardShortcuts: function() {
    Mousetrap.bind(['left'], function() { this.backwardTime(); return false; }.bind(this), 'keydown');
    Mousetrap.bind(['space'], function() { this.togglePlayPause(); return false; }.bind(this), 'keydown');
    Mousetrap.bind(['right'], function() { this.forwardTime(); return false; }.bind(this), 'keydown');
  },

  initializeCommon: function() {
    this.VIDEO_END_PADDING = 0.5;
    
    this.repo = this.options.repo || {};
    this.video = this.options.video || this.repo.video || {};
    this.group = this.options.group || this.repo.group || {};
    this.release = this.options.release || this.repo.release || {};
    this.user = this.options.user || this.repo.user || {};

    this.setupElement();

    // initialize popcorn
    var targetSelector = this.options["targetSelector"] || "div#media";
    this.popcorn = this.loadMedia(targetSelector,this.mediaSource());

    if (this.isNicoEmbed()) {
      this.$nicoplayerLoading = $("<div class='nicoplayer_loading'>Loading Niconico Player...please wait a few seconds.</div>");
      this.$media.append(this.$nicoplayerLoading);
      this.popcorn.on("nicothumbloaded", this.onNicoThumbLoaded.bind(this));
    }

    // misc
    this.defineAttributeAccessors();
    this.displayNoInternetConnectionIfNeeded();

    this.postInitializeCommon();
  },

  mediaSource: function() {
    return typeof this.video.source_url === "undefined" ? "" : this.video.source_url;
  },

  initializeVideo: function() {
    this.addPlayerControls();
    this.bindEvents();
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

    this.bindEvents();
  },

  onNicoThumbLoaded: function() {
    $(this.playerObject()).attr("wmode", "transparent");
    this.onNicoThumbMousedownCallback = this.onNicoThumbMousedown.bind(this);
    this.$media.on("mousedown",this.onNicoThumbMousedownCallback);
    this.setupNicoFrame();
    this.renderNicoFramePosition();
  },

  onNicoThumbMousedown: function(event) {
    this.$nicoplayerLoading.show();
    this.$frameCenter.show();
  },

  setupNicoFrame: function() {
    $(document.body).append($("<div class='nico_frame_top'>"));
    $(document.body).append($("<div class='nico_frame_bottom'>"));
    $(document.body).append($("<div class='nico_frame_left'>"));
    $(document.body).append($("<div class='nico_frame_right'>"));
    $(document.body).append($("<div class='nico_frame_center'>"));
    this.$frameTop = $(".nico_frame_top");
    this.$frameBottom = $(".nico_frame_bottom");
    this.$frameLeft = $(".nico_frame_left");
    this.$frameRight = $(".nico_frame_right");
    this.$frameCenter = $(".nico_frame_center");
  },

  renderNicoFramePosition: function() {
    var thumbOffset = $(this.popcorn.media.playerObject).offset();
    var thumbHeight = $(this.popcorn.media.playerObject).height();
    var thumbWidth  = $(this.popcorn.media.playerObject).width();

    var thumbPlayBtnHalfHeight = thumbWidth / 16;
    var thumbPlayBtnHalfWidth  = thumbWidth / 9;

    this.$frameTop.css("width", thumbWidth);
    this.$frameTop.css("height", thumbHeight / 2 - thumbPlayBtnHalfHeight);
    this.$frameBottom.css("width", thumbWidth);
    this.$frameBottom.css("height", thumbHeight / 2 - thumbPlayBtnHalfHeight);

    this.$frameLeft.css("width", thumbWidth / 2 - thumbPlayBtnHalfWidth);
    this.$frameLeft.css("height", thumbHeight);
    this.$frameRight.css("width", thumbWidth / 2 - thumbPlayBtnHalfWidth);
    this.$frameRight.css("height", thumbHeight);

    this.$frameCenter.css("height", thumbPlayBtnHalfHeight * 2);
    this.$frameCenter.css("width", thumbPlayBtnHalfWidth * 2);

    this.$frameTop.offset(thumbOffset);
    this.$frameBottom.offset({ top: thumbOffset.top + thumbHeight / 2 + thumbPlayBtnHalfHeight, left: thumbOffset.left });
    this.$frameLeft.offset(thumbOffset);
    this.$frameRight.offset({ top: thumbOffset.top, left: thumbOffset.left + thumbWidth / 2 + thumbPlayBtnHalfWidth });
    this.$frameCenter.css({ top: thumbOffset.top + thumbHeight / 2 - thumbPlayBtnHalfHeight, left: thumbOffset.left + thumbWidth / 2 - thumbPlayBtnHalfWidth});
  },

  displayNoInternetConnectionIfNeeded: function() {
    if (!navigator.onLine && !this.options.local) {
      var height = this.$mediaContainer.css("height");
      this.$mediaContainer.html("<div style='height: " + height + ";line-height: " + height + ";text-align: center'>" + 
                                  "No Internet Connection" + 
                                "</div>");
    }
  },

  displayNicoVideoMobileNotSupported: function() {
    var height = this.$mediaContainer.css("height");
    var noticeHalfHeight = 60;
    var paddingTop = parseInt(height) / 2 - noticeHalfHeight;
    this.$mediaContainer.html("<div style='height: " + height + ";text-align: center; background-color: black; color: white; font-size: 24px; padding-top: " + paddingTop + "px; '>" + 
                                "Subtitles for NicoNicoDouga is currently only viewable in Desktop." + 
                              "</div>");
  },

  setVolume: function(level) {
    this.lastSavedVolume = this.popcorn.volume() * 100;
    this.popcorn.volume(level);

    var percentage = level * 100;
    $("._3par").css("height",  percentage + "%");

    if (percentage > 50) {
      $(".mute_btn i").removeClass("fa-volume-off");
      $(".mute_btn i").removeClass("fa-volume-down");
      $(".mute_btn i").addClass("fa-volume-up");
    } else if (percentage > 0) {
      $(".mute_btn i").removeClass("fa-volume-up");
      $(".mute_btn i").removeClass("fa-volume-off");
      $(".mute_btn i").addClass("fa-volume-down");
    } else {
      $(".mute_btn i").removeClass("fa-volume-down");
      $(".mute_btn i").removeClass("fa-volume-up");
      $(".mute_btn i").addClass("fa-volume-off");
    }
  },

  mediaDuration: function() {
    return Math.floor(parseFloat(this.video.duration) * 1000) / 1000;
  },

  postInitializeCommon: function() {
    // subclass implements callback if needed
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

  setupElement: function() {
    this.$subtitleBar = $("#subtitle_bar");

    this.$downloadBtn = $("#download_btn");
    
    if (typeof this.$downloadBtn.tooltip === "function") {
      this.$downloadBtn.tooltip({title: "Download subtitle", placement: "bottom"});
    }

    this.$subtitleDisplay = $("#subtitle_display");
    this.applyFontSettings();

    this.$mediaContainer = this.$mediaContainer || $("#media_container");

    var media = this.options.media || "<div id='media'></div>";

    this.$mediaContainer.find("#iframe_container").append(media);
    this.$media = this.$mediaContainer.find("#media");
  },

  loadMedia: function(targetSelector,url) {
    var popcorn;
    if (url == "") {
      popcorn = Popcorn(targetSelector);
    } else {
      if (typeof this.options.url_options !== "undefined") {
        url = url + this.options.url_options; 
      }
      if (repo.video.source_type === "vimeo") {
        popcorn = Popcorn.vimeo(targetSelector,url);
      } else if (this.isNicoEmbed()) {
        if (river.utility.isMobile()) {
          this.displayNicoVideoMobileNotSupported();
        } else {
          popcorn = Popcorn.nicovideo(targetSelector,url);
        }
      } else {
        popcorn = Popcorn.smart(targetSelector,url);
      }
    }
    return popcorn;
  },

  bindEvents: function() {
    Backbone.on("timelineseek",this.onTimelineSeekHandler.bind(this));
    Backbone.on("subtitlelineclick",this.onSubtitleLineClick.bind(this));
    Backbone.on("trackstart",this.onTrackStart.bind(this));
    this.$subtitleBar.on("mousedown",this.onSubtitleBarClick.bind(this));
    Backbone.on("trackend",this.onTrackEnd.bind(this));
    this.popcorn.media.addEventListener("loadedmetadata",this.onLoadedMetadata.bind(this));
    this.popcorn.media.addEventListener("playprogress",this.onPlayProgress.bind(this));
    if (this.isNicoEmbed()) {
      $(window).on("resize",this.onWindowResize.bind(this));
    }
    this.handleVolumeEvents();
  },

  onPlayProgress: function(event) {
    if (this.media.paused) {
      this.onPause(event);  
    } else {
      this.onPlay(event);
    }
  },

  onWindowResize: function() {
    this.renderNicoFramePosition();
  },

  handleVolumeEvents: function() {
    $(".mute_btn").on("click", function(event) {
      event.preventDefault();

      if (this.popcorn.volume() === 0) {
        this.setVolume(this.lastSavedVolume);
      } else {
        this.setVolume(0)
      }
    }.bind(this));

    $(".volume_control, ._3pao").on("mouseover", function(event){ 
      $("._3pao").show();  
    }.bind(this));

    $(".volume_control, ._3pao").on("mouseout", function(event){ 
      if (!this.isVolumeDragging) {
        $("._3pao").hide();  
      }
    }.bind(this));

    $("._3pao").on("click", function(event){ 
      this.setVolume(this.getVolumeFromY(event.pageY));
    }.bind(this));

    $("._3pao").on("mousedown", function(event) {
      this.pauseEvent(event);
      this.isVolumeDragging = true;
    }.bind(this));

    $("._3pao, #viewing_screen").on("mousemove", function(event) {
      this.pauseEvent(event);
      if (this.isVolumeDragging) {
        this.setVolume(this.getVolumeFromY(event.pageY));
      }
    }.bind(this));

    $("#viewing_screen").on("mouseup", function(event) {
      $("._3pao").hide();  
    }.bind(this));

    $("._3pao, #viewing_screen").on("mouseup", function(event) {
      this.isVolumeDragging = false;
    }.bind(this));

  },

  playerObject: function() {
    return this.popcorn.media.playerObject;
  },

  onLoadedMetadata: function() {
    this.isLoadedMetadata = true;
    // prevent Youtube's caption from showing up - we only show Yasub Subtitles :)
    if (repo.video.source_type == "youtube") {
      this.playerObject().unloadModule("cc");        // for AS3 player
      this.playerObject().unloadModule("captions");  // for HTML5 player
    } else if (repo.video.source_type == "vimeo") {
      // vimeo autoplays but doesnt trigger the onPlay callback 
      // (trigger playprogress instead), so we trigger it manually
      this.onPlay(); 
    } else if (this.isNicoEmbed()) {
      // hide the nicothumbwatch frame blocker 
      this.$frameTop.hide();
      this.$frameBottom.hide();
      this.$frameLeft.hide();
      this.$frameRight.hide();
      this.$frameCenter.hide();
      // show the previously hidden iframeoverlay
      this.$iframeOverlay.show();
      $(".player_controls_container").show();
      // hide nico comments initially
      this.popcorn.media.playerObject.ext_setCommentVisible(false);

      this.$nicoplayerLoading.hide();
      this.$media.off("mousedown",this.onNicoThumbMousedownCallback);
    }

    // player settings
    this.setVolume(0.5);
  },

  applyFontSettings: function() {
    var $el = this.getTargetFontSettingElement();
    $el.css("font-family", this.repo.font_family);
    $el.css("font-size", this.repo.font_size);
    $el.css("line-height", parseInt(this.repo.font_size) + 2 + "px");
    $el.css("font-weight", this.repo.font_weight);
    $el.css("font-style", this.repo.font_style);
    $el.css("color", this.repo.font_color);
    this.applyOutlineColor($el,this.repo.font_outline_color);
  },

  applyOutlineColor: function($el, color) {
    $el.css("text-shadow", "-1px 0 " + color + ", " +
                           "0  1px " + color + ", " +
                           "1px  0 " + color + ", " +
                           "0 -1px " + color + "  ");
  },

  getTargetFontSettingElement: function() {
    return this.$subtitleDisplay;
  },


  addPlayerControls: function() {
    var volumeControl = "<div class='volume_control'>" + 
                          "<button type='button' class='mute_btn'><i class='fa fa-volume-up'></i></button>" + 
                          "<div class='_3pao'>" + 
                            "<div class='_3paq'>" + 
                              "<div style='height: 40%;' class='_3par'>" + 
                                "<div class='_3pas'>" + 
                                "</div>" + 
                              "</div>" + 
                            "</div>" + 
                            "<div class='_3pat'>" + 
                            "</div>" + 
                          "</div>" + 
                        "</div>";
    $("#viewing_screen").after("<div class='player_controls_container'><div class='player_controls'></div></div>");    
    $(".player_controls").append("<button type='button' class='backward_btn river_btn'><i class='fa fa-backward'></i> </button> ");
    $(".player_controls").append("<button type='button' class='play_btn river_btn'><i class='fa fa-play'></i></button>");
    $(".player_controls").append("<button type='button' class='pause_btn river_btn'><i class='fa fa-pause'></i></button>");
    $(".player_controls").append("<button type='button' class='forward_btn river_btn'><i class='fa fa-forward'></i> </button> ");
    $(".player_controls").append("<div class='player_timeline_container'></div>");
    $(".player_controls").append(volumeControl);
    $("#summary").appendTo(".player_timeline_container")

    this.$playBtn = $(".play_btn");
    this.$pauseBtn = $(".pause_btn");
    this.$backwardBtn = $(".backward_btn");
    this.$forwardBtn = $(".forward_btn");
    this.$pauseBtn.hide();

    if (this.timeline) {
      this.timeline.setTimelineWidth();
    }
  },

  pauseEvent: function(e){
      if(e.stopPropagation) e.stopPropagation();
      if(e.preventDefault) e.preventDefault();
      e.cancelBubble=true;
      e.returnValue=false;
      return false;
  },

  getVolumeFromY: function(pageY) {
    var maxHeight = 80;
    var actualMaxTop = $("._3pao").offset().top + 10;
    var currHeight = actualMaxTop - pageY + maxHeight ;
    var ratio = currHeight / maxHeight;
    if (ratio > 1) ratio = 1;
    if (ratio < 0) ratio = 0;

    // console.log("_3pao_top: " + $("._3pao").offset().top + " pageY: " + event.pageY + " calc: " + currHeight + "ratio: " + ratio);
    return ratio;
  },

  onTimelineSeekHandler: function(time) {
    this.seek(time);
  },

  onSubtitleLineClick: function(subtitle) {
    this.seek(subtitle.track.startTime());
  },

  seek: function(time) {
    this.popcorn.currentTime(time);

    if (this.isNicoEmbed()) {
      // nico doesnt give u the accurate seeked time unless its playing
      if (this.media.paused) {
        this.play();      
      }
    }
  },

  backwardTime: function() {
    this.seek(this.media.currentTime - this.seekDuration());
  },

  forwardTime: function() {
    this.seek(this.media.currentTime + this.seekDuration());
  },

  onTrackStart: function(track) {
    var subtitle = track.subtitle;
    this.showSubtitleInSubtitleBar(subtitle);
    subtitle.highlight();
  },

  onTrackEnd: function(track) {
    this.hideSubtitleInSubtitleBar(track.subtitle);
    track.subtitle.unhighlight();
  },

  onSubtitleBarClick: function(event) {
    this.togglePlayPause();
  },

  togglePlayPause: function() {
    if (this.media.paused) {
      this.play();
    } else {
      this.pause();
    }
  },


  showSubtitleInSubtitleBar: function(subtitle) {
    this.$subtitleDisplay.text(subtitle.get("text"));
  },

  hideSubtitleInSubtitleBar: function(subtitle) {
    this.$subtitleDisplay.text("");
  },

  loadTracks: function(timings, options) {
    if (typeof timings !== "undefined") {
      for (var i = 0; i < timings.length; i++) {
        try {
          var track = new river.model.Track(timings[i],options);
          this.tracks.add(track);
        } catch(e) {
          console.log(e.stack);
        }
      };
    }
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

  // nico nico douga specific
  showNicoComments: function() {
    this.popcorn.media.playerObject.ext_setCommentVisible(true);
  },

  hideNicoComments: function() {
    this.popcorn.media.playerObject.ext_setCommentVisible(false);
  },

  isNicoEmbed: function() {
    if (this.video.source_type === "nicovideo" && this.repo.is_player) {
      return true;
    } else if (this.video.source_type === "nicovideo" && !this.repo.is_player) {
      return !this.video.source_local_url;
    }
  },

  isNicoMp4: function() {
    return this.video.source_type === "nicovideo" && this.video.source_local_url;
  },

  // how many pixels per second
  resolution: function($container) {
    var widthPixel = $container.width();
    var widthSeconds = this.mediaDuration();

    return widthPixel / widthSeconds ;
  }


});

