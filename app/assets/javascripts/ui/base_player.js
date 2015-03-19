river.ui.BasePlayer = Backbone.View.extend({
  initialize: function(options) {
    this.options = options || {};
    this.initializeCommon();

    if (this.options.video) {
      this.initializeVideo();
    } else {
      this.initializeRepository();
    }

    this.initializeKeyboardShortcuts();
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
    var mediaSource = typeof this.video.source_url === "undefined" ? "" : this.video.source_url;
    this.popcorn = this.loadMedia(targetSelector,mediaSource);

    // player settings
    this.popcorn.volume(0.2);

    // misc
    this.defineAttributeAccessors();
    this.displayNoInternetConnectionIfNeeded();

    this.postInitializeCommon();
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
    this.loadTracks(timings);

    this.bindEvents();
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
    this.$downloadBtn.tooltip({title: "Download subtitle", placement: "bottom"});

    this.$subtitleDisplay = $("#subtitle_display");

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
      url = url + this.options.url_options; // make sure youtube controls are shown
      popcorn = Popcorn.smart(targetSelector,url);
    }
    return popcorn;
  },

  bindEvents: function() {
    Backbone.on("timelineseek",this.onTimelineSeekHandler.bind(this));
    Backbone.on("subtitlelineclick",this.onSubtitleLineClick.bind(this));
    Backbone.on("trackstart",this.onTrackStart.bind(this));
    this.$subtitleBar.on("mousedown",this.onSubtitleBarClick.bind(this));
    Backbone.on("trackend",this.onTrackEnd.bind(this));
  },

  addPlayerControls: function() {
    $("#viewing_screen").after("<div class='player_controls_container'><div class='player_controls'></div></div>");    
    $(".player_controls").append("<button type='button' class='backward_btn river_btn'><i class='glyphicon glyphicon-backward'></i> </button> ");
    $(".player_controls").append("<button type='button' class='play_btn river_btn'><i class='glyphicon glyphicon-play'></i></button>");
    $(".player_controls").append("<button type='button' class='pause_btn river_btn'><i class='glyphicon glyphicon-pause'></i></button>");
    $(".player_controls").append("<button type='button' class='forward_btn river_btn'><i class='glyphicon glyphicon-forward'></i> </button> ");
    $(".player_controls").append("<div class='player_timeline_container'></div>");
    $("#summary").appendTo(".player_timeline_container")
    $(".player_controls").append("<button type='button' class='expand_btn river_btn'><i class='glyphicon glyphicon-fullscreen'></i></button>");

    this.$playBtn = $(".play_btn");
    this.$pauseBtn = $(".pause_btn");
    this.$backwardBtn = $(".backward_btn");
    this.$forwardBtn = $(".forward_btn");
    this.$expandBtn = $(".expand_btn");
    this.$pauseBtn.hide();
    
    if (this.timeline) {
      this.timeline.setTimelineWidth();
    }
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
  },

  // how many pixels per second
  resolution: function($container) {
    var widthPixel = $container.width();
    var widthSeconds = this.mediaDuration();

    return widthPixel / widthSeconds ;
  }


});
