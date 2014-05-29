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
    console.log("shitman");
    this.$iframeOverlay.on("click",this.onIframeOverlayClick.bind(this));
    this.$iframeOverlay.on("mouseenter",this.onIframeOverlayMouseEnter.bind(this));
    this.$iframeOverlay.on("mouseleave",this.onIframeOverlayMouseLeave.bind(this));
    this.media.addEventListener("pause",this.onPause.bind(this));
    this.media.addEventListener("play",this.onPlay.bind(this));
  },

  onTrackSeekHandler: function(time) {
    this.seek(time);
  },

  hideEditing: function() {
    $("#subtitle_bar").css("background-color","rgba(255,0,0,0)");

    $("#subtitle_bar").css("margin-top","-75px");
    $("#subtitle_bar").css("z-index","6");
    $("#subtitle_bar").css("position","absolute");
    $("#subtitle_bar").css("line-height","25px");

    $("#subtitle_display").css("background-color","black");
    $("#subtitle_display").css("opacity",0.8);
    $("#subtitle_display").css("font-size","20px");

    $(".subtitle .text").css("font-size","14px");
    $(".subtitle .text").css("width","350px");
    $("#subtitle_list").css("height","500px");
    $("#subtitle_list").find("th").first().remove(); // remove start heading
    $("#subtitle_list").find("th").first().remove(); // remove end   heading
    $("#subtitle_list").find(".start_time").closest("td").each(function(){
      $(this).remove();
    });
    $("#subtitle_list").find(".end_time").closest("td").each(function(){
      $(this).remove();
    });
    $("#subtitle_list").find(".delete").each(function(){
      $(this).remove();
    });

    // remove subtitle lines that are blank
    $(".subtitle").each(function(){
      if ($(this).find(".text").text().length === 0) {
        $(this).remove();  
      }
    });

    // this.letterBoxMedia();
  },

  letterBoxMedia: function() {
    if (this.options.repo.video.aspect_ratio === "widescreen") {
      // convert 16:9 to 4:3
      $("#media").css("width","780px");
      $("#media").css("height","600px");
    } else {
      // convert 4:3 to 1:1
      $("#media").css("width","600px");
      $("#media").css("height","600px");
      $("#subtitle_bar").removeClass("span8");
      $("#subtitle_bar").addClass("span6");
    }
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

  setVolume: function(value) {
    this.popcorn.volume(value);
  },

  bindEvents: function() {
    river.ui.BasePlayer.prototype.bindEvents.call(this);
  },

  hideEditing: function() {
    river.ui.Player.prototype.hideEditing.call(this);
    $("#media").css("height","300px");
    $("#media").css("width","400px");

    $("#subtitle_bar").css("margin-top","-35px");
    $("#subtitle_bar").css("margin-left","10px");
    $("#subtitle_bar").css("z-index","6");
    $("#subtitle_bar").css("position","absolute");
    $("#subtitle_bar").css("line-height","16px");

    $("#subtitle_display").css("background-color","black");
    $("#subtitle_display").css("opacity",0.8);
    $("#subtitle_display").css("font-size","12px");
    $("#subtitle_display").css("padding","3px");
  }

});
