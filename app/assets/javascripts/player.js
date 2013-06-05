function Player (repo,options) {
  this.repo = repo || {};
  this.video = this.repo.video || {};
  this.user = this.repo.user || {};
  this.options = options || {};

  var timings = this.repo.timings || [];
  var subtitles = $.map(timings,function(timing){ return timing.subtitle; });
  var mediaSource = typeof this.video.url === "undefined" ? "" : this.video.url;

  var targetSelector = this.options["targetSelector"] || "div#media";

  this.setupElement();
  this.popcorn = this.loadMedia(targetSelector,mediaSource);
  this.subtitleView = new SubtitleView(subtitles);
  this.timeline = new Timeline({ "hide_expanded": true});
  this.timeline.setMedia(this.popcorn.media);



  this.trackMap = {}
  this.tracks = this.loadTracks(timings);
  this.timeline.setTracks(this.tracks);



  this.hideEditing();
  this.bindEvents();
}

Player.prototype = {
  setupElement: function() {
    this.$el = $("#player");

    this.$subtitleBar = $("#subtitle_bar");

    this.$playBtn = $("#play_btn");
    this.$pauseBtn = $("#pause_btn");
    this.$pauseBtn.hide();

    this.$downloadBtn = $("#download_btn");
    this.$downloadBtn.tooltip({title: "Download subtitle file in .srt format"});

    this.$subtitleDisplay = $("#subtitle_display");
  },

  hideEditing: function() {
    $("#player-top-left").removeClass("span6");
    $("#player-top-left").addClass("span7");

    $("#player-top-right").removeClass("span6");
    $("#player-top-right").addClass("span5");

    $("#subtitle_bar").removeClass("span6");
    $("#subtitle_bar").addClass("span7");

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
  },

  loadMedia: function(targetSelector,url) {
    var popcorn;
    if (url == "") {
      popcorn = Popcorn(targetSelector);
    } else {
      popcorn = Popcorn.smart(targetSelector,url);
    }
    return popcorn;
  },

  bindEvents: function() {
    $(document).on("timelineseek",this.onTimelineSeekHandler.bind(this));
    $(document).on("trackseek",this.onTrackSeekHandler.bind(this));
    $(document).on("subtitlelineclick",this.onSubtitleLineClick.bind(this));
    $(document).on("trackstart",this.onTrackStart.bind(this));
    $(document).on("trackend",this.onTrackEnd.bind(this));
    this.$playBtn.on("click",this.onPlayBtnClick.bind(this));
    this.$pauseBtn.on("click",this.onPauseBtnClick.bind(this));
    this.popcorn.media.addEventListener("pause",this.onPause.bind(this));
    this.popcorn.media.addEventListener("play",this.onPlay.bind(this));
  },

  onTimelineSeekHandler: function(event,time) {
    this.seek(time);
  },

  onTrackSeekHandler: function(event,time) {
    this.seek(time);
  },


  onSubtitleLineClick: function(event,subtitle) {
    this.seek(subtitle.track.startTime());
  },

  seek: function(time) {
    this.popcorn.currentTime(time);
  },

  onTrackStart: function(event,track) {
    var subtitle = track.subtitle;
    this.showSubtitleInSubtitleBar(subtitle);
    subtitle.highlight();
  },

  onTrackEnd: function(event,track) {
    this.hideSubtitleInSubtitleBar(track.subtitle);
    track.subtitle.unhighlight();
  },

  showSubtitleInSubtitleBar: function(subtitle) {
    this.$subtitleDisplay.text(subtitle.text);
  },

  hideSubtitleInSubtitleBar: function(subtitle) {
    this.$subtitleDisplay.text("");
  },

  onPlayBtnClick: function(event) {
    this.popcorn.play();
    this.$playBtn.hide();
    this.$pauseBtn.show();
  },

  onPauseBtnClick: function(event) {
    this.popcorn.pause();
    this.$pauseBtn.hide();
    this.$playBtn.show();
  },

  onPlay: function(event) {
    this.$playBtn.hide();
    this.$pauseBtn.show();
  },

  onPause: function(event) {
    this.$pauseBtn.hide();
    this.$playBtn.show();
  },

  loadTracks: function(timings) {
    var tracks = [];

    if (typeof timings !== "undefined") {
      for (var i = 0; i < timings.length; i++) {
        var track = new Track(timings[i], this.popcorn, { isSaved: true });
        this.trackMap[track.getAttributes().client_id] = track;
        tracks.push(track);
      };
    }

    return tracks;
  },
}
