function Player (repo,options) {
  this.repo = repo || {};
  this.video = this.repo.video || {};
  this.user = this.repo.user || {};
  this.options = options || {};

  var timings = this.repo.timings || [];
  var mediaSource = typeof this.video.url === "undefined" ? "" : this.video.url;

  var targetSelector = this.options["targetSelector"] || "div#media";

  this.setupElement();
  this.popcorn = this.loadMedia(targetSelector,mediaSource);
  this.popcorn.volume(0.2);

  this.subtitles = new SubtitleSet();

  this.trackMap = {}
  this.tracks = this.loadTracks(timings);

  this.hideEditing();
  this.bindEvents();
}

Player.prototype = {
  setupElement: function() {
    this.$el = $("#player");

    this.$subtitleBar = $("#subtitle_bar");

    this.$subtitleEditorBtn = $("#subtitle_editor_btn");
    this.$subtitleEditorBtn.tooltip({title: "Opens Editor in new tab", placement: 'bottom'});

    this.$downloadBtn = $("#download_btn");
    this.$downloadBtn.tooltip({title: "Download subtitle file in .srt format"});


    this.$subtitleDisplay = $("#subtitle_display");
  },

  hideEditing: function() {
    $("#subtitle_bar").css("background","none");

    $("#subtitle_bar").css("margin-top","-70px");
    $("#subtitle_bar").css("z-index","6");
    $("#subtitle_bar").css("position","absolute");

    $("#subtitle_display").css("background-color","black");
    $("#subtitle_display").css("opacity",0.8);

    $("#subtitle_list").css("height","315px");
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

    $("#media").css("height","315px");
  },

  loadMedia: function(targetSelector,url) {
    var popcorn;
    if (url == "") {
      popcorn = Popcorn(targetSelector);
    } else {
      url = url + "&controls=1"; // make sure youtube controls are shown
      popcorn = Popcorn.smart(targetSelector,url);
    }
    return popcorn;
  },

  bindEvents: function() {
    Backbone.on("subtitlelineclick",this.onSubtitleLineClick.bind(this));
    Backbone.on("trackstart",this.onTrackStart.bind(this));
    Backbone.on("trackend",this.onTrackEnd.bind(this));
  },

  onSubtitleLineClick: function(subtitle) {
    this.seek(subtitle.track.startTime());
  },

  seek: function(time) {
    this.popcorn.currentTime(time);
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

  showSubtitleInSubtitleBar: function(subtitle) {
    this.$subtitleDisplay.text(subtitle.get("text"));
    this.$subtitleDisplay.css("padding","5px");
  },

  hideSubtitleInSubtitleBar: function(subtitle) {
    this.$subtitleDisplay.text("");
    this.$subtitleDisplay.css("padding","0px");
  },

  loadTracks: function(timings) {
    var tracks = [];

    if (typeof timings !== "undefined") {
      for (var i = 0; i < timings.length; i++) {
        var track = new Track(timings[i], { popcorn: this.popcorn });
        this.trackMap[track.getAttributes().client_id] = track;
        tracks.push(track);
      };
    }

    return tracks;
  },
}
