function Timeline () {
  this.media = null;
  this.setupElement();
}

Timeline.prototype = {

  setupElement: function() {
    this.$container = $("#timeline_container");

    var el = "<div id='summary' class='timeline'>" + 
               // "<div class='progress_bar'></div>" +
               "<div class='scrubber'></div>" +
               "<div class='window_slider'></div>" +
             "</div>" +
             "<div id='expanded' class='timeline'>" + 
               "<div class='filler'>" + 
                 // "<div class='progress_bar'></div>" +
                 "<div class='scrubber'></div>" +
                 "<div class='time_indicator'>0</div>" +
               "</div>" +
             "</div>";

    this.$container.append(el);

    this.$summary = $("#summary");
    this.$progress_bar_summary = $("#summary .progress_bar");
    this.$scrubber_summary = $("#summary .scrubber");
    this.$window_slider = $("#summary .window_slider");

    this.$expanded = $("#expanded");
    this.$progress_bar_expanded = $("#expanded .progress_bar");
    this.$scrubber_expanded = $("#expanded .scrubber");
    this.$time_indicator = $("#expanded .time_indicator");

    this.$filler = $("#expanded .filler");

    this.$progress_bar_summary.css("width","0px");
    this.$progress_bar_expanded.css("width","0px");
  },

  setTracks: function(tracks) {
    this.tracks = tracks;
  },

  setMedia: function(media) {
    this.media = media;
    this.bindEvents();
  },

  bindEvents: function() {
    this.media.addEventListener("pause",this.onPause.bind(this));
    this.media.addEventListener("seeking",this.onSeeking.bind(this));
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

    this.$expanded.on("mousedown",this.onMouseDownHandler.bind(this));
    this.$expanded.on("mousemove",this.onMouseMoveHandler.bind(this));
    this.$expanded.on("mouseup",this.onMouseUpHandler.bind(this));
  },

  onPause: function() {
    var pauseTime = Math.floor(this.media.currentTime * 1000) / 1000;
    this.$container.trigger("pauseadjust",[pauseTime]);
  },

  onTimeUpdate: function(event) {
    this.renderScrubber();
    this.renderTimeIndicator();
  },

  onSeeking: function() {
    // console.log("seeking " + this.media.currentTime);
    // this.renderProgressBar();  
    // this.renderScrubber();  
    // this.renderTimeIndicator();  
  },

  onLoadedMetadata: function() {
    this.$window_slider.css("width",this.resolution(this.$summary) * 30);
    this.$filler.css("width",this.resolution(this.$expanded) * this.media.duration);

    this.renderTracks();
  },

  onGhostTrackStart: function(event,track) {
    this.renderFillProgressInterval = setInterval(this.renderFillProgress.bind(this,track),10);
  },

  onGhostTrackEnd: function(event,track) {
    clearInterval(this.renderFillProgressInterval);
  },

  onMouseDownHandler: function(event) {
    this.seekmode = true;
    // given pixel position, find out what seconds in time it corresponds to

    var $target = $(event.target);
    var seconds = this.getSecondsFromCurrentPosition($target,event.pageX);

    if (!$target.hasClass("track")) {
      this.$container.trigger("timelineseek",[seconds]);
    }
  },

  onMouseMoveHandler: function(event) {
    // given pixel position, find out what seconds in time it corresponds to
    var $target = $(event.target);
    var seconds = this.getSecondsFromCurrentPosition($target,event.pageX);
    if (this.seekmode) {
      if (!$target.hasClass("track")) {
        this.$container.trigger("timelineseek",[seconds]);
      }
    }
  },

  getSecondsFromCurrentPosition: function($target,eventPageX) {
    var $timeline;

    if (!$target.hasClass("timeline")) {
      $timeline = $target.closest(".timeline");
    } else {
      $timeline = $target;
    }

    var timelineX = $timeline.position().left;
    var posX = eventPageX - timelineX;
    var seconds = posX / this.resolution($timeline) + $timeline.scrollLeft() / this.resolution($timeline);
    seconds = Math.round(seconds * 1000) / 1000;
    return seconds;
  },

  onMouseUpHandler: function(event) {
    this.seekmode = false;
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
    this.renderInContainer(this.$expanded,track.$el_expanded, { width: duration, left: track.startTime() });

  },


  renderFillProgress: function(track) {
    var progress = this.media.currentTime - track.startTime();

    this.renderInContainer(this.$summary,track.$el_summary,  { width: progress, left: track.startTime() });
    this.renderInContainer(this.$expanded,track.$el_expanded,{ width: progress, left: track.startTime() });
  },

  renderScrubber: function(time) {
    this.renderInContainer(this.$summary, this.$scrubber_summary, { left: this.media.currentTime.toFixed(3) });
    this.renderInContainer(this.$expanded,this.$scrubber_expanded,{ left: this.media.currentTime.toFixed(3) });

    if (this.isOutOfBounds(this.$expanded,this.$scrubber_expanded)) {
      this.scrollContainerToElementAndMoveWindowSlider(this.$expanded,this.$scrubber_expanded);
    }
  },

  renderProgressBar: function() {
    this.renderInContainer(this.$summary, this.$progress_bar_summary, { width: this.media.currentTime.toFixed(3) });
    this.renderInContainer(this.$expanded,this.$progress_bar_expanded,{ width: this.media.currentTime.toFixed(3) });

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
    var elRight = this.getRightPos($el);
    var width = $container.width();
    var index = Math.floor(elRight / width);
    var pos   = index * width;
    
    $container.scrollLeft(pos);
    this.$window_slider.css("left",this.resolution(this.$summary) * 30 * index);
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


