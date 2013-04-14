function Timeline () {
  this.media = null;
  this.setupElement();
  this.bindEvents();
}

Timeline.prototype = {

  setupElement: function() {
    this.$container = $("#timeline_container");

    var el = "<div id='summary' class='timeline'>" + 
               "<div class='scrubber'></div>" +
             "</div>" +
             "<div id='expanded' class='timeline'>" + 
               "<div class='filler'>" + 
                 "<div class='scrubber'></div>" +
               "</div>" +
             "</div>";

    this.$container.append(el);

    this.$summary = $("#summary");
    this.$scrubber_summary = $("#summary .scrubber");

    this.$expanded = $("#expanded");
    this.$scrubber_expanded = $("#expanded .scrubber");

    this.$filler = $("#expanded .filler");
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
      console.log("play");
      console.log("interval" + this.scrubberInterval);
    clearInterval(this.scrubberInterval);
    this.scrubberInterval = setInterval(this.renderScrubber.bind(this),10);
  },

  onPause: function() {
    clearInterval(this.scrubberInterval);
  },

  onSeeking: function() {
    this.renderScrubber();  
  },

  onLoadedMetadata: function() {
    this.$filler.css("width",this.resolution(this.$expanded) * this.media.duration);
  },

  renderScrubber: function() {
    this.renderInContainer(this.$summary, this.$scrubber_summary, this.media.currentTime);
    this.renderInContainer(this.$expanded,this.$scrubber_expanded,this.media.currentTime);
  },

  // given container, element, and time position you want to position element on, it will
  // position element on container on appropriate pixel location
  renderInContainer: function($container,$el,time) {

    $el.css("left", this.resolution($container) * time);

    if (this.isOutOfBounds($container,$el)) {
      console.log("out");
      this.scrollContainerToElement($container,$el);
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
    var elPos          = parseFloat($el.css("left"),10);

    // console.log("start: " + containerStart + " end: "   + containerEnd + " el: "   +  elPos);

    if (elPos >= containerStart && elPos <= containerEnd ) {
      return false;
    } else {
      return true;
    }
  },

  scrollContainerToElement: function($container,$el) {
    var elPos = parseFloat($el.css("left"),10);
    var width = $container.width();
    var index = Math.floor(elPos / width);
    var pos   = index * width;
    // console.log(pos);
    $container.scrollLeft(pos);
  }

};


