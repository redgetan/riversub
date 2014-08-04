river.ui.Player = river.ui.BasePlayer.extend({

  initialize: function(options) {
    river.ui.BasePlayer.prototype.initialize.call(this,options);
    this.hideEditing();

    this.$el = $("#river_player");

    this.timeline.setTracks(this.tracks);

    this.$subtitleEditorBtn = $("#subtitle_editor_btn");
    this.$subtitleEditorBtn.tooltip({title: "Opens Editor in new tab", placement: 'bottom'});
      
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
    this.timeline = new river.ui.Timeline({media: this.popcorn.media, mediaDuration: this.mediaDuration() });
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

  onMediaMouseMove: function(event) {

        if (!this.$fadeInBuffer) {
            if (this.$timer) {
                clearTimeout(this.$timer);
                this.$timer = 0;
            }
           $(".icon-pause").fadeIn();
        } else {
            this.$fadeInBuffer = false;
        }

    this.$timer = setTimeout(function () {
            $(".icon-pause").fadeOut();
            this.$fadeInBuffer = true;
        }, 2000)

  },

  onPlay: function(event) {
    this.$overlay_btn.find("i").removeClass("icon-play");
    this.$overlay_btn.find("i").addClass("icon-pause");
  },

  onPause: function(event) {
    this.seek(this.lastTimeUpdateTime);
    this.$overlay_btn.find("i").removeClass("icon-pause");
    this.$overlay_btn.find("i").addClass("icon-play");
  },

  togglePlayPause: function() {
    if (this.media.paused) {
      this.play();
    } else {
      this.pause();
    }
  },

  bindEvents: function() {
    river.ui.BasePlayer.prototype.bindEvents.call(this);
    Backbone.on("trackseek",this.onTrackSeekHandler.bind(this));
    this.$iframeOverlay.on("click",this.onIframeOverlayClick.bind(this));
    this.$iframeOverlay.on("mouseenter",this.onIframeOverlayMouseEnter.bind(this));
    this.$iframeOverlay.on("mouseleave",this.onIframeOverlayMouseLeave.bind(this));
    this.$iframeOverlay.on("mousemove",this.onMediaMouseMove.bind(this));
    this.media.addEventListener("pause",this.onPause.bind(this));
    this.media.addEventListener("play",this.onPlay.bind(this));
  },

  onTrackSeekHandler: function(time) {
    this.seek(time);
  },

  hideEditing: function() {
    this.$iframeOverlay.css("height","450px");
    this.$subtitleBar.css("background-color","rgba(255,0,0,0)");
    this.$subtitleBar.css("z-index","6");
    this.$subtitleBar.css("line-height","25px");

    this.$subtitleDisplay.css("background-color","black");
    this.$subtitleDisplay.css("opacity",0.8);
    this.$subtitleDisplay.css("font-size","20px");

    this.$subtitleList.css("height","500px");
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

    // remove subtitle lines that are blank
    $(".subtitle").each(function(){
      if ($(this).find(".text").text().length === 0) {
        $(this).remove();
      }
    });

    this.$media.css("height","550px");

  },

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

  setVolume: function(value) {
    this.popcorn.volume(value);
  },

  bindEvents: function() {
    river.ui.BasePlayer.prototype.bindEvents.call(this);
  },

  hideEditing: function() {
    river.ui.Player.prototype.hideEditing.call(this);
    this.$media.css("height","300px");
    this.$media.css("width","400px");

    this.$subtitleBar.css("margin-top","-35px");
    this.$subtitleBar.css("margin-left","10px");
    this.$subtitleBar.css("z-index","6");
    this.$subtitleBar.css("position","absolute");
    this.$subtitleBar.css("line-height","16px");

    this.$subtitleDisplay.css("background-color","black");
    this.$subtitleDisplay.css("opacity",0.8);
    this.$subtitleDisplay.css("font-size","12px");
    this.$subtitleDisplay.css("padding","3px");
  }

});
