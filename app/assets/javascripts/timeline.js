function Timeline () {
  this.media = null;
  this.setupElement();
  this.bindEvents();
}

Timeline.prototype = {

  setupElement: function() {
    this.$container = $("#timeline_container");

    var el = "<div id='summary' class='timeline'>" + 
               "<div class='progress_bar'></div>" +
               "<div class='scrubber'></div>" +
             "</div>" +
             "<div id='expanded' class='timeline'>" + 
               "<div class='filler'>" + 
                 "<div class='progress_bar'></div>" +
                 "<div class='scrubber'></div>" +
                 "<div class='time_indicator'>0</div>" +
               "</div>" +
             "</div>";

    this.$container.append(el);

    this.$summary = $("#summary");
    this.$progress_bar_summary = $("#summary .progress_bar");
    this.$scrubber_summary = $("#summary .scrubber");

    this.$expanded = $("#expanded");
    this.$progress_bar_expanded = $("#expanded .progress_bar");
    this.$scrubber_expanded = $("#expanded .scrubber");
    this.$time_indicator = $("#expanded .time_indicator");

    this.$filler = $("#expanded .filler");

    this.$progress_bar_summary.css("width","0px");
    this.$progress_bar_expanded.css("width","0px");
  },

  bindEvents: function() {
    this.$summary.on("click",this.onClickHandler.bind(this));
    this.$expanded.on("click",this.onClickHandler.bind(this));
  },

  onClickHandler: function(event) {
    // given pixel position, find out what seconds in time it corresponds to
    var $target = $(event.target);
    var $timeline;

    if (!$target.hasClass("timeline")) {
      $timeline = $target.closest(".timeline");
    } else {
      $timeline = $target;
    }

    // if its track then seek to start time of track
    if (!$target.hasClass("track")) {
      var timelineX = $timeline.position().left;
      var posX = event.pageX - timelineX;
      var seconds = posX / this.resolution($timeline) + $timeline.scrollLeft() / this.resolution($timeline);
      this.$container.trigger("timelineseek",[seconds]);
    }

  },

  setMedia: function(media) {
    this.media = media;
    this.media.addEventListener("play",this.onPlay.bind(this));
    this.media.addEventListener("pause",this.onPause.bind(this));
    this.media.addEventListener("seeking",this.onSeeking.bind(this));
    this.media.addEventListener("loadedmetadata",this.onLoadedMetadata.bind(this));
  },

  onPlay: function() {
    this.scrubberInterval = setInterval(this.renderScrubber.bind(this),10);
    this.progressBarInterval = setInterval(this.renderProgressBar.bind(this),10);
    this.timeIndicatorInterval = setInterval(this.renderTimeIndicator.bind(this),10);
  },

  onPause: function() {
    clearInterval(this.scrubberInterval);
    clearInterval(this.progressBarInterval);
    clearInterval(this.timeIndicatorInterval);
  },

  onSeeking: function() {
    this.renderProgressBar();  
    this.renderScrubber();  
    this.renderTimeIndicator();  
  },

  onLoadedMetadata: function() {
    this.$filler.css("width",this.resolution(this.$expanded) * this.media.duration);
  },

  renderScrubber: function() {
    this.renderInContainer(this.$summary, this.$scrubber_summary, { left: this.media.currentTime.toFixed(3) });
    this.renderInContainer(this.$expanded,this.$scrubber_expanded,{ left: this.media.currentTime.toFixed(3) });
  },


  renderProgressBar: function() {
    this.renderInContainer(this.$summary, this.$progress_bar_summary, { width: this.media.currentTime.toFixed(3) });
    this.renderInContainer(this.$expanded,this.$progress_bar_expanded,{ width: this.media.currentTime.toFixed(3) });

    if (this.isOutOfBounds(this.$expanded,this.$progress_bar_expanded)) {
      this.scrollContainerToElement(this.$expanded,this.$progress_bar_expanded);
    }
  },

  renderTimeIndicator: function() {
    this.renderInContainer(this.$expanded,this.$time_indicator,{ 
      left: this.media.currentTime.toFixed(3),
      text: this.media.currentTime.toFixed(3) 
    });
  },

  // given container, element, and time position you want to position element on, it will
  // position element on container on appropriate pixel location
  renderInContainer: function($container,$el,property) {

    for (var key in property) {
      if (key === "text") {
        $el.text(property[key]);
      } else {
        $el.css(key, this.resolution($container) * property[key]);
      }
    }

  },

  // how many pixels per second
  resolution: function($container) {
    var widthPixel = $container.width();
    var widthSeconds = $container.attr("id") === "summary" ? 
                         this.summaryTimelineWidthInSeconds() :
                         this.expandedTimelineWidthInSeconds();

    return widthPixel / widthSeconds ;
  },

  summaryTimelineWidthInSeconds: function() {
    return this.media.duration || 30;
  },

  expandedTimelineWidthInSeconds: function() {
    return 30; //always 30 seconds
  },

  isOutOfBounds: function($container,$el) {
    var containerStart = $container.scrollLeft();
    var containerEnd   = containerStart + $container.width();
    var elRight        = this.getRightPos($el);

    // console.log("start: " + containerStart + " end: "   + containerEnd + " el: "   +  elRight);

    if (elRight >= containerStart && elRight <= containerEnd ) {
      return false;
    } else {
      return true;
    }
  },

  scrollContainerToElement: function($container,$el) {
    var elRight = this.getRightPos($el);
    var width = $container.width();
    var index = Math.floor(elRight / width);
    var pos   = index * width;
    // console.log(pos);
    $container.scrollLeft(pos);
  },

  getRightPos: function($el) {
    return parseFloat($el.css("left"),10) + $el.width();
  }

};


