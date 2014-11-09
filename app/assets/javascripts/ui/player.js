river.ui.Player = river.ui.BasePlayer.extend({

  initialize: function(options) {
    this.IFRAME_OVERLAY_NON_AD_OVERLAPPING_FACTOR = 2.3;

    river.ui.BasePlayer.prototype.initialize.call(this,options);
    this.hideEditing();
    this.addPlayerControls();
    this.postBindEvents();

    this.$el = $("#river_player");

  },

  setupElement: function() {
    river.ui.BasePlayer.prototype.setupElement.call(this);
    this.$iframeOverlay = $("#iframe_overlay");
    this.$overlay_btn = $("#overlay_btn");
    this.$subtitleList = $("#subtitle_list");
    this.$media = $("#media");
    this.$timer;
    this.$fadeInBuffer = false;
  },

  preRepositoryInitHook: function() {
    this.timeline = new river.ui.Timeline({media: this.popcorn.media, mediaDuration: this.mediaDuration(), hideTracks: true });
  },

  onIframeOverlayClick: function(event) {
    this.togglePlayPause();
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

  onProgress: function() {
    var secondsLoaded = this.popcorn.video.buffered.end(0);
    var width = secondsLoaded * this.resolution(this.timeline.$summary);
    this.$timeLoaded.css("width", width);
  },

  onTimeUpdate: function(event) {
    var seconds = this.media.currentTime;  
    var width = seconds * this.resolution(this.timeline.$summary);
    this.$timeCurrent.css("width", width);
  },

  bindEvents: function() {
    river.ui.BasePlayer.prototype.bindEvents.call(this);
    this.$iframeOverlay.on("click",this.onIframeOverlayClick.bind(this));
    this.$mediaContainer.on("mousemove",this.onMediaMouseMove.bind(this));
    this.media.addEventListener("pause",this.onPause.bind(this));
    this.media.addEventListener("play",this.onPlay.bind(this));
  },

  postBindEvents: function() {
    this.popcorn.on("progress", this.onProgress.bind(this) );
    this.$playBtn.on("mousedown",this.onPlayBtnClick.bind(this));
    this.$pauseBtn.on("mousedown",this.onPauseBtnClick.bind(this));
    this.$expandBtn.on("mousedown",this.onExpandBtnClick.bind(this));
    this.media.addEventListener("timeupdate",this.onTimeUpdate.bind(this));
  },

  hideEditing: function() {
    this.$iframeOverlay.css("height",this.$mediaContainer.width() / this.IFRAME_OVERLAY_NON_AD_OVERLAPPING_FACTOR);

    this.$subtitleBar.css("background-color","rgba(255,0,0,0)");
    this.$subtitleBar.css("z-index","6");
    this.$subtitleBar.css("line-height","20px");

    this.$subtitleDisplay.css("background-color","black");
    this.$subtitleDisplay.css("opacity",0.8);
    this.$subtitleDisplay.css("font-size","17px");

    this.$subtitleList.css("height","300px");
    this.$subtitleList.find(".table .header").remove(); // remove heading
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
  },

  addPlayerControls: function() {
    $("#viewing_screen").after("<div class='player_controls_container'><div class='player_controls'></div></div>");    
    $(".player_controls").append("<button type='button' class='play_btn river_btn'><i class='icon-play'></i></button>");
    $(".player_controls").append("<button type='button' class='pause_btn river_btn'><i class='icon-pause'></i></button>");
    $(".player_controls").append("<div class='player_timeline_container'></div>");
    $("#summary").appendTo(".player_timeline_container")
    $("#summary").append("<span class='time_loaded'></span>");
    $("#summary").append("<span class='time_current'></span>");
    $(".player_controls").append("<button type='button' class='expand_btn river_btn'><i class='icon-fullscreen'></i></button>");

    this.$playBtn = $(".play_btn");
    this.$pauseBtn = $(".pause_btn");
    this.$expandBtn = $(".expand_btn");
    this.$pauseBtn.hide();
    this.$timeLoaded = $(".time_loaded");
    this.$timeCurrent = $(".time_current");
    this.timeline.setTimelineWidth();
  }


});

river.ui.MiniPlayer = river.ui.Player.extend({

  initialize: function(options) {
    river.ui.BasePlayer.prototype.initialize.call(this,options);
    this.hideEditing();
    this.$el = $("#river_player");
  },

  preRepositoryInitHook: function() {
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

    this.$subtitleBar.css("margin-top","-35px");
    this.$subtitleBar.css("margin-left","10px");
    this.$subtitleBar.css("z-index","6");
    this.$subtitleBar.css("position","absolute");
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
