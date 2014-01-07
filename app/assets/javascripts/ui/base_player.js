river.ui.BasePlayer = Backbone.View.extend({
  initialize: function(options) {
    this.options = options || {};
    this.repo = this.options.repo || {};
    this.video = this.repo.video || {};
    this.user = this.repo.user || {};

    var targetSelector = this.options["targetSelector"] || "div#media";

    var timings = this.repo.timings || [];
    var mediaSource = typeof this.video.url === "undefined" ? "" : this.video.url;


    this.setupElement();
    this.popcorn = this.loadMedia(targetSelector,mediaSource);
    this.popcorn.volume(0.2);

    this.defineAttributeAccessors();

    this.preRepositoryInitHook();

    this.repository = new river.model.Repository(this.repo);
    this.subtitles  = new river.model.SubtitleSet();

    this.tracks = this.repository.tracks;
    this.loadTracks(timings);

    this.bindEvents();
  },

  mediaDuration: function() {
    return this.repo.video.duration;
  },

  preRepositoryInitHook: function() {
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
    this.$el = $("#player");

    this.$subtitleBar = $("#subtitle_bar");

    this.$subtitleEditorBtn = $("#subtitle_editor_btn");
    this.$subtitleEditorBtn.tooltip({title: "Opens Editor in new tab", placement: 'bottom'});

    this.$downloadBtn = $("#download_btn");
    this.$downloadBtn.tooltip({title: "Download subtitle file in .srt format"});


    this.$subtitleDisplay = $("#subtitle_display");
  },

  loadMedia: function(targetSelector,url) {
    var popcorn;
    if (url == "") {
      popcorn = Popcorn(targetSelector);
    } else {
      url = url + this.options.url_options; // make sure youtube controls are shown
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
    if (typeof timings !== "undefined") {
      for (var i = 0; i < timings.length; i++) {
        try {
          var track = new river.model.Track(timings[i], { popcorn: this.popcorn });
          this.tracks.add(track);
        } catch(e) {
          console.log(e.stack);
        }
      };
    }
  }

});
