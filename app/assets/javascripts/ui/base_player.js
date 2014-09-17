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
    this.subtitles  = new river.model.SubtitleSet("",this.options);

    this.tracks = this.repository.tracks;
    this.loadTracks(timings);

    this.bindEvents();

    this.displayNoInternetConnectionIfNeeded();
  },

  displayNoInternetConnectionIfNeeded: function() {
    if (!navigator.onLine && !this.options.local) {
      var height = this.$mediaContainer.css("height");
      this.$mediaContainer.html("<div style='height: " + height + ";line-height: " + height + ";text-align: center'>" + 
                                  "No Internet Connection" + 
                                "</div>");
    }
  },

  setVolume: function(level) {
    this.popcorn.volume(level);
  },

  mediaDuration: function() {
    return Math.floor(parseFloat(this.repo.video.duration) * 1000) / 1000;
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
    this.$subtitleBar = $("#subtitle_bar");

    this.$downloadBtn = $("#download_btn");
    this.$downloadBtn.tooltip({title: "Download subtitle", placement: "bottom"});

    this.$subtitleDisplay = $("#subtitle_display");

    this.$mediaContainer = this.$mediaContainer || $("#media_container");

    var media = this.options.media || "<div id='media'></div>";

    this.$mediaContainer.find("#iframe_container").append(media);

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
    Backbone.on("timelineseek",this.onTimelineSeekHandler.bind(this));
    Backbone.on("subtitlelineclick",this.onSubtitleLineClick.bind(this));
    Backbone.on("trackstart",this.onTrackStart.bind(this));
    Backbone.on("trackend",this.onTrackEnd.bind(this));
  },

  onTimelineSeekHandler: function(time) {
    this.seek(time);
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
  },

  hideSubtitleInSubtitleBar: function(subtitle) {
    this.$subtitleDisplay.text("");
  },

  loadTracks: function(timings) {
    var options = $.extend(this.options,{ popcorn: this.popcorn });

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
  }


});
