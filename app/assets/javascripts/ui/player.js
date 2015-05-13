river.ui.Player = river.ui.BasePlayer.extend({

  initialize: function(options) {
    this.IFRAME_OVERLAY_NON_AD_OVERLAPPING_FACTOR = 2.3;
    this.MAX_SUBTITLE_DISPLAY_FONT_SIZE = 24;
    this.MIN_SUBTITLE_DISPLAY_FONT_SIZE = 12;

    river.ui.BasePlayer.prototype.initialize.call(this,options);

    this.setupLanguageSelect();
    this.setupSubtitleZoom();

    this.hideEditing();
    this.postBindEvents();

    if (repo.highlight_subtitle_short_id) {
      var subtitle = this.subtitles.filter(function(subtitle){ 
        return subtitle.get("short_id") === repo.highlight_subtitle_short_id; 
      })[0];

      this.seek(subtitle.track.startTime());
    }

    this.$el = $("#river_player");

    this.enableHashTab();

    // ensure first subtitle appears if it start_time is 0
    this.onTrackStart(this.tracks.at(0));
  },

  initializeRepository: function() {
    river.ui.BasePlayer.prototype.initializeRepository.call(this);

    var timings = this.repo.original_timings || [];
    var options = $.extend(this.options,{ 
      popcorn: this.popcorn,
      original: true
    });

    this.loadTracks(timings, options);

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

    var html = "<select class='player_language_select' style='width: 17%; float: left;'>";

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
    // var zoomInBtn = "<i class='subtitle_zoom_in_btn glyphicon glyphicon-zoom-in'></i>";
    // var zoomOutBtn = "<i class='subtitle_zoom_in_btn glyphicon glyphicon-zoom-out'></i>";
    var zoomInBtn = "<i class='subtitle_zoom_in_btn fa fa-search-plus'></i>";
    var zoomOutBtn = "<i class='subtitle_zoom_out_btn fa fa-search-minus'></i>";

    $(".player_controls").append(zoomInBtn);
    $(".player_controls").append(zoomOutBtn);

    this.$zoomInBtn = $(".subtitle_zoom_in_btn");
    this.$zoomOutBtn = $(".subtitle_zoom_out_btn");
  },

  enableHashTab: function() {
    // http://stackoverflow.com/questions/12131273/twitter-bootstrap-tabs-url-doesnt-change
    var hash = window.location.hash;

    if (hash) {
      $('ul.nav a[href="' + hash + '"]').tab('show');
    }

    $('.nav-tabs a').click(function (e) {
      $(this).tab('show');
      var scrollmem = $('body').scrollTop();
      window.location.hash = this.hash;
      $('html,body').scrollTop(scrollmem);
    });
  },

  seekDuration: function() {
    return 5;
  },

  postInitializeCommon: function() {
    this.timeline = new river.ui.Timeline({media: this.popcorn.media, mediaDuration: this.mediaDuration(), hideTracks: true });
  },

  onIframeOverlayClick: function(event) {
    this.togglePlayPause();
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
  },

  bindEvents: function() {
    river.ui.BasePlayer.prototype.bindEvents.call(this);
    this.$iframeOverlay.on("click",this.onIframeOverlayClick.bind(this));
    this.$overlay_btn.on("click",this.onOverlayBtnClick.bind(this));
    this.media.addEventListener("pause",this.onPause.bind(this));
    this.media.addEventListener("play",this.onPlay.bind(this));
    this.$mediaContainer.on("mousemove",this.onMediaMouseMove.bind(this));
    this.popcorn.on("timeupdate",this.onTimeUpdate.bind(this));
    this.popcorn.on("progress", this.onProgress.bind(this) );
  },

  postBindEvents: function() {
    this.$playBtn.on("mousedown",this.onPlayBtnClick.bind(this));
    this.$pauseBtn.on("mousedown",this.onPauseBtnClick.bind(this));
    this.$expandBtn.on("mousedown",this.onExpandBtnClick.bind(this));
    this.$playerLanguageSelect.on("change", this.onPlayerLanguageSelectChange.bind(this));
    this.$zoomInBtn.on("click", this.onZoomInBtnClick.bind(this));
    this.$zoomOutBtn.on("click", this.onZoomOutBtnClick.bind(this));
  },

  onPlayerLanguageSelectChange: function(event) {
    var url = this.$playerLanguageSelect.find("option:selected").data("url");
    window.location.href = url;
  },

  onZoomInBtnClick: function(event) {
    var originalFontSize = parseInt(this.$subtitleDisplay.css("font-size"));
    var secondaryOriginalFontSize = parseInt(this.$subtitleOriginalDisplay.css("font-size"));

    if (originalFontSize < this.MAX_SUBTITLE_DISPLAY_FONT_SIZE) {
      this.$subtitleDisplay.css("font-size",originalFontSize + 2);
      this.$subtitleOriginalDisplay.css("font-size",secondaryOriginalFontSize + 2);
    }
  },

  onZoomOutBtnClick: function(event) {
    var originalFontSize = parseInt(this.$subtitleDisplay.css("font-size"));
    var secondaryOriginalFontSize = parseInt(this.$subtitleOriginalDisplay.css("font-size"));

    if (originalFontSize > this.MIN_SUBTITLE_DISPLAY_FONT_SIZE) {
      this.$subtitleDisplay.css("font-size",originalFontSize - 2);
      this.$subtitleOriginalDisplay.css("font-size",secondaryOriginalFontSize - 2);
    }
  },

  onMediaMouseMove: function(event) {
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
    }, 2000)
  },

  onProgress: function() {
    var secondsLoaded = this.popcorn.video.buffered.end(0);
    var width = secondsLoaded * this.resolution(this.timeline.$summary);
    this.$timeLoaded.css("width", width);
  },

  onTimeUpdate: function(event) {
    var seconds = this.media.currentTime;  
    var width = seconds * this.resolution(this.timeline.$summary);
    this.$timeCurrent.css("width", width);

    if (seconds >= (this.media.duration - this.VIDEO_END_PADDING)) {
      this.goToBeginningOfVideo();
    }
  },

  goToBeginningOfVideo: function() {
    this.pause();
    this.seek(0);
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
    
    this.$timeLoaded = $(".time_loaded");
    this.$timeCurrent = $(".time_current");
  },

  hideEditing: function() {
    this.$backwardBtn.hide();
    this.$forwardBtn.hide();
    this.$iframeOverlay.css("height",this.$mediaContainer.height() - 
                                      $(".player_controls_container").height() - 
                                      $("#subtitle_bar").height());

    this.$subtitleBar.css("background-color","rgba(255,0,0,0)");
    this.$subtitleBar.css("z-index","6");
    this.$subtitleBar.css("line-height","20px");

    this.$subtitleDisplay.css("background-color","black");
    this.$subtitleDisplay.css("opacity",0.8);

    this.$subtitleList.css("height","430px");
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

    this.$subtitleBar.css("margin-top","-35px");
    this.$subtitleBar.css("background-color","black");
    this.$subtitleBar.css("z-index","6");
    this.$subtitleBar.css("line-height","16px");
    this.$subtitleBar.addClass("span5");

    this.$subtitleDisplay.css("background-color","black");
    this.$subtitleDisplay.css("opacity",0.8);
    this.$subtitleDisplay.css("font-size","12px");
    this.$subtitleDisplay.css("padding","3px");

    this.$overlay_btn.hide();
    $("#time_float").hide();
    $("#seek_head").hide();
    $("#blackbar").css("height","5px");
  },
});
