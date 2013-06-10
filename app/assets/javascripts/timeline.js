function Timeline (options) {
  this.options = options || {};
  this.media = null;
  this.setupElement();
}

Timeline.prototype = {

  setupElement: function() {

    this.$summary_container = $("#media_container");

    var summary = "<div id='summary' class='timeline'>" + 
               // "<div class='progress_bar'></div>" +
               "<div class='scrubber'></div>" +
               "<div class='window_slider'></div>" +
             "</div>";

    this.$summary_container.find("#subtitle_bar").after(summary);
    this.$summary = $("#summary");
    this.$scrubber_summary = $("#summary .scrubber");
    this.$window_slider = $("#summary .window_slider");
    this.$window_slider.css("left",0);


    if (!this.options["hide_expanded"]) {
      var expanded = "<div id='expanded' class='timeline'>" + 
                 "<div class='filler'>" + 
                   // "<div class='progress_bar'></div>" +
                   "<div class='scrubber'></div>" +
                   "<div class='time_indicator'>0</div>" +
                 "</div>" +
               "</div>";

      this.$expanded_container = $("#timeline_container");
      this.$expanded_container.append(expanded);

      this.$expanded = $("#expanded");
      this.$scrubber_expanded = $("#expanded .scrubber");
      this.$time_indicator = $("#expanded .time_indicator");
      this.$filler = $("#expanded .filler");
    }
  },

  setTracks: function(tracks) {
    this.tracks = tracks;
  },

  setMedia: function(media) {
    this.media = media;
    this.bindEvents();
  },

  bindEvents: function() {
    this.media.addEventListener("loadedmetadata",this.onLoadedMetadata.bind(this));
    this.media.addEventListener("timeupdate",this.onTimeUpdate.bind(this));

    $(document).on("ghosttrackstart",this.onGhostTrackStart.bind(this));
    $(document).on("ghosttrackend",this.onGhostTrackEnd.bind(this));
    $(document).on("trackchange",this.onTrackChange.bind(this));
    $(document).on("trackresize",this.onTrackResize.bind(this));
    $(document).on("trackdrag",this.onTrackDrag.bind(this));

    this.$summary.on("mousedown",this.onMouseDownHandler.bind(this));
    this.$summary.on("mousemove",this.onMouseMoveHandler.bind(this));
    this.$summary.on("mouseup",this.onMouseUpHandler.bind(this));


    if (!this.options["hide_expanded"]) {
      this.$expanded.on("mousedown",this.onMouseDownHandler.bind(this));
      this.$expanded.on("mousemove",this.onMouseMoveHandler.bind(this));
      this.$expanded.on("mouseup",this.onMouseUpHandler.bind(this));
      this.$expanded.on("mousewheel",this.onExpandedTimelineScroll.bind(this));
    }
  },

  onTimeUpdate: function(event) {
    this.renderScrubber();

    if (!this.options["hide_expanded"]) {
      this.renderTimeIndicator();
    }
  },

  onLoadedMetadata: function() {

    if (!this.options["hide_expanded"]) {
      this.$window_slider.css("width",this.resolution(this.$summary) * 30);
      this.$filler.css("width",this.resolution(this.$expanded) * this.media.duration);
    }

    this.$summary.tooltip({title : "."});
    this.$summary.data("tooltip").tip().find(".tooltip-inner").css("background-color","white");
    this.$summary.data("tooltip").tip().find(".tooltip-inner").css("color","black");
    this.$summary.data("tooltip").tip().find(".tooltip-inner").css("border","solid 1px black");
    this.$summary.data("tooltip").tip().find(".tooltip-inner").css("position","relative");

    if (!this.options["hide_expanded"]) {
      this.renderTracks();
    }
  },

  onGhostTrackStart: function(event,track) {
    this.trackFillProgressCallback = this.renderFillProgress.bind(this,track);
    this.media.addEventListener("timeupdate",this.trackFillProgressCallback);
  },

  onGhostTrackEnd: function(event,track) {
    this.media.removeEventListener("timeupdate",this.trackFillProgressCallback);
  },

  onMouseDownHandler: function(event) {
    this.seekmode = true;
    // given pixel position, find out what seconds in time it corresponds to

    var $target = $(event.target);
    var $timeline;

    if (!$target.hasClass("timeline")) {
      $timeline = $target.closest(".timeline");
    } else {
      $timeline = $target;
    }

    var seconds = this.getSecondsFromCurrentPosition($timeline,$target,event.pageX);

    if (!$target.hasClass("track")) {
      $timeline.trigger("timelineseek",[seconds]);
    }
  },

  onMouseMoveHandler: function(event) {
    // given pixel position, find out what seconds in time it corresponds to
    var $target = $(event.target);
    var $timeline;

    if (!$target.hasClass("timeline")) {
      $timeline = $target.closest(".timeline");
    } else {
      $timeline = $target;
    }

    var seconds = this.getSecondsFromCurrentPosition($timeline,$target,event.pageX);

    // show current time using tooltip
    if ($timeline.data("tooltip")) {
      var tooltip = $timeline.data("tooltip").tip().find('.tooltip-inner');
      var tooltipArrow = $timeline.data("tooltip").arrow();
      tooltip.text(this.stringifyTime(seconds));
      this.renderInContainer($timeline, tooltip, { left: seconds - this.summaryTimelineWidthInSeconds() / 2 });
      this.renderInContainer($timeline, tooltipArrow, { left: seconds - this.summaryTimelineWidthInSeconds() / 2 });
    }

    // seek
    if (this.seekmode) {
      if (!$target.hasClass("track")) {
        $timeline.trigger("timelineseek",[seconds]);
      }
    }
  },

  getSecondsFromCurrentPosition: function($container,$target,eventPageX) {
    var timelineX = $container.position().left;
    var posX = eventPageX - timelineX;
    var seconds = posX / this.resolution($container) + $container.scrollLeft() / this.resolution($container);
    seconds = Math.round(seconds * 1000) / 1000;
    return seconds;
  },

  onMouseUpHandler: function(event) {
    this.seekmode = false;
  },

  onExpandedTimelineScroll: function(event,delta){
    this.$expanded.scrollLeft(this.$expanded.scrollLeft() - delta) ; 
    var secondsToScroll = delta / this.resolution(this.$expanded);
    var numPixelsToScrollSummary = this.resolution(this.$summary) * secondsToScroll;
    var oldWindowSliderLeft = parseFloat(this.$window_slider.css("left"));
    var newWindowSliderLeft = oldWindowSliderLeft - numPixelsToScrollSummary;

    // cannot go beyond the min/max left
    var maxLeft = this.$summary.width() - this.$window_slider.width();
    var minLeft = 0;
    if (newWindowSliderLeft >= minLeft && newWindowSliderLeft <= maxLeft) {
      this.$window_slider.css("left",newWindowSliderLeft);
    }
  },

  onTrackChange: function(event,track) {
    this.renderTrack(track);
  },

  onTrackResize: function(event,track,trackView) {
    var handle= $(event.target).css("cursor").split("-")[0]; 

    var $container = $(event.target).closest(".timeline");

    var seconds = trackView.position.left / this.resolution($container);
    var duration = trackView.size.width   / this.resolution($container);

    if (handle === "w") {
      track.setStartTime(seconds);
    } else {
      track.setEndTime(seconds + duration);
    }
  },

  onTrackDrag: function(event,track,trackView) {
    var $container = $(event.target).closest(".timeline");

    var seconds = trackView.position.left / this.resolution($container);

    var origStartTime = track.startTime();
    var origEndTime = track.endTime();

    var delta = seconds - origStartTime;

    track.setStartTime(origStartTime + delta);
    track.setEndTime(origEndTime + delta);
  },

  renderTracks: function() {
    for (var i = 0; i < this.tracks.length; i++) {
      this.renderTrack(this.tracks[i]);
    };
  },

  renderTrack: function(track) {

    var duration = track.endTime() - track.startTime();

    this.renderInContainer(this.$summary,track.$el_summary,   { width: duration, left: track.startTime() });

    if (!this.options["hide_expanded"]) {
      this.renderInContainer(this.$expanded,track.$el_expanded, { width: duration, left: track.startTime() });
    }

  },


  renderFillProgress: function(track) {
    var progress = this.media.currentTime - track.startTime();

    this.renderInContainer(this.$summary,track.$el_summary,  { width: progress, left: track.startTime() });

    if (!this.options["hide_expanded"]) {
      this.renderInContainer(this.$expanded,track.$el_expanded,{ width: progress, left: track.startTime() });
    }
  },

  renderScrubber: function(time) {
    this.renderInContainer(this.$summary, this.$scrubber_summary, { left: this.media.currentTime.toFixed(3) });


    if (!this.options["hide_expanded"]) {
      this.renderInContainer(this.$expanded,this.$scrubber_expanded,{ left: this.media.currentTime.toFixed(3) });

      if (this.isOutOfBounds(this.$expanded,this.$scrubber_expanded)) {
        this.scrollContainerToElementAndMoveWindowSlider(this.$expanded,this.$scrubber_expanded);
      }
    }
  },

  renderTimeIndicator: function() {
    this.renderInContainer(this.$expanded,this.$time_indicator,{ 
      left: this.media.currentTime.toFixed(3),
      text: this.stringifyTime(this.media.currentTime) 
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

  scrollContainerToElementAndMoveWindowSlider: function($container,$el) {
    if (!this.media.paused) {
      var elRight = this.getRightPos($el);
      var width = $container.width();
      var index = Math.floor(elRight / width);
      var pos   = index * width;
      
      $container.scrollLeft(pos);
      this.$window_slider.css("left",this.resolution(this.$summary) * 30 * index);
    }
  },

  getRightPos: function($el) {
    return parseFloat($el.css("left"),10) + $el.width();
  },

  stringifyTime: function(time) {
    time = Math.round(time * 1000) / 1000;

    var hours = parseInt( time / 3600 ) % 24;
    var minutes = parseInt( time / 60 ) % 60;
    var seconds = Math.floor(time % 60);
    var milliseconds = Math.floor(time * 1000) % 1000

    var result = (hours < 10 ? "0" + hours : hours) + ":" + 
                 (minutes < 10 ? "0" + minutes : minutes) + ":" + 
                 (seconds  < 10 ? "0" + seconds : seconds) + "." +
                 (milliseconds  < 10 ? "00" + milliseconds : (milliseconds < 100 ? "0" + milliseconds : milliseconds)); 
    return result;
  }

};


