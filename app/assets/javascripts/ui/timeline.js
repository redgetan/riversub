river.ui.Timeline = Backbone.View.extend({
  /**
    options:
      @media    - media DOM element 
      @duration - duration of video (based on metadata, will exist even if media is not available)
  */

  initialize: function(options) {
    this.mediaDuration = options.mediaDuration; 
    this.setupElement();

    this.setMedia(options.media);

    this.window_slide_duration = 30;

    this.isScrubberVisible = true;
    this.force_scroll_window = false;
    this.windowSlideTimeoutQueue = [];

    this.current_window_slide = { start: 0, end: this.mediaDuration < 30 ? this.mediaDuration : 30 };
  },

  setupElement: function() {
    this.$summary_container = $("#media_container");

    var summary = "<div id='summary' class='timeline' >" +
                     "<div class='scrubber'></div>" +
                     "<div class='window_slider'></div>" +
                   "</div>";

    this.$summary_container.find("#viewing_screen").after(summary);
    this.$summary = $("#summary");
    this.$scrubber_summary = $("#summary .scrubber");

    // window slider
    this.$window_slider = $("#summary .window_slider");
    this.$window_slider.css("left",0);
    this.$window_slider.css("width",this.resolution(this.$summary) * 30);

    this.$time_float = $("#time_float");
    this.$time_float.hide();

    this.$seek_head = $("#seek_head");
    this.$seek_head.css("left",this.$summary.position().left);

    this.$seek_head.draggable({
      cursor: "pointer",
      axis: "x",
      containment: "parent",
      drag: this.onSeekHeadDragHandler.bind(this)
    });

    var expanded = "<div id='expanded' class='timeline'>" +
                     "<div class='filler'>" +
                       "<div id='track_viewport'>" +
                         "<div class='scrubber'></div>" +
                         "<div class='time_indicator'>0</div>" +
                       "</div>" +
                       "<div id='time_label'>" +
                       "</div>" +
                     "</div>" +
                   "</div>";


    this.$expanded_container = $("#timeline_container");
    this.$expanded_container.prepend(expanded);

    this.$expanded = $("#expanded");
    this.$expanded_track_viewport = $("#track_viewport");

    // expanded timeline filler
    this.$filler = $("#expanded .filler");
    this.$filler.css("width",this.resolution(this.$expanded) * this.mediaDuration);

    // scrubber
    this.$scrubber_expanded = $("#expanded .scrubber");

    // current time display indicator
    this.$time_indicator = $("#expanded .time_indicator");

    // timeline label
    var timeline_label = this.createTimeLabelHTMLString(this.$filler.width(),this.mediaDuration);
    this.$expanded_time_label = $("#time_label");
    this.$expanded_time_label.append(timeline_label);

  },

  setTracks: function(tracks) {
    this.tracks = tracks ;
    this.renderTracks();
  },

  setMedia: function(media) {
    this.media = media;
    this.bindEvents();
  },

  createTimeLabelHTMLString: function(svgWidth,timelineDuration) {
    var timeIncrement = 1;
    var numOfLabel = timelineDuration / timeIncrement; // plus 1 for 0:00
    var labelDistance = timeIncrement * this.resolution(this.$expanded);

    var labels = "";
    var label;
    var xPos = 0;


    for (var i = 0; i < numOfLabel; i++) {
      if (i === 0) {
        time = "00";
      } else {
        time = this.stringifyTimeShort(i*5);
      }

      for (var x = 0; x < 5; x++) {
        if (x === 0) {
          label =    "<g transform='translate(" + xPos + ",-15)' style='opacity: 1;'>" +
                       "<line class='tick' y2='3' x2='0'></line>" +
                       "<text class='time' fill='#777777' y='13' x='0' text-anchor='middle'>" + time + "</text>" +
                     "</g>";
        } else {
          label =    "<g transform='translate(" + xPos + ",-15)' style='opacity: 1;'>" +
                       "<line class='tick' y2='4' x2='0'></line>" +
                     "</g>";
        }

        labels += label;
        xPos += labelDistance;
      }
    };

    var result =   "<svg id='timeline' width='" + svgWidth + "' height='15'>" +
                     "<g class='x axis' transform='translate(0,15)'>" +
                       labels +
                    "</g>" +
                   "</svg>";

    return result;
  },

  bindEvents: function() {
    this.media.addEventListener("timeupdate",this.onTimeUpdate.bind(this));

    this.onExpandedTimelineScrollCallback = this.onExpandedTimelineScroll.bind(this);
    this.$expanded.on("mousewheel",this.onExpandedTimelineScrollCallback);
    this.$summary.on("mousedown",this.onMouseDownHandler.bind(this));
    this.$summary.on("mousemove",this.onMouseMoveHandler.bind(this));
    this.$summary.on("mouseup",this.onMouseUpHandler.bind(this));

    this.$summary.on("mouseenter",this.onSummaryMouseEnterHandler.bind(this));
    this.$summary.on("mousemove",this.onSummaryMouseMoveHandler.bind(this));
    this.$summary.on("mouseleave",this.onSummaryMouseLeaveHandler.bind(this));

    this.$seek_head.on("mousedown",this.onSeekHeadMouseDownHandler.bind(this));
    this.$seek_head.on("mouseup",this.onSeekHeadMouseUpHandler.bind(this));

    this.$expanded.on("mousedown",this.onMouseDownHandler.bind(this));
    this.$expanded.on("mousemove",this.onMouseMoveHandler.bind(this));
    this.$expanded.on("mouseup",this.onMouseUpHandler.bind(this));

    Backbone.on("timelineseek",this.onTimelineSeek.bind(this));
    Backbone.on("ghosttrackstart",this.onGhostTrackStart.bind(this));
    Backbone.on("ghosttrackend",this.onGhostTrackEnd.bind(this));
    Backbone.on("trackchange",this.onTrackChange.bind(this));
    Backbone.on("trackresize",this.onTrackResize.bind(this));
    Backbone.on("trackdrag",this.onTrackDrag.bind(this));
    Backbone.on("scrubberdisappear",this.onScrubberDisappear.bind(this));
  },

  onTrackChange: function(track) {
    this.renderTrack(track);
  },

  onTimeUpdate: function(event) {
    this.renderScrubber();
    this.renderSeekHead();

    this.renderTimeIndicator();

    // trigger appear/disappear events
    if (this.isOutOfBounds()) {
      if (this.force_scroll_window || this.isScrubberVisible) {
        Backbone.trigger("scrubberdisappear");
        this.isScrubberVisible = false;
        this.force_scroll_window = false;
      }
    } else {
      if (!this.isScrubberVisible) {
        Backbone.trigger("scrubberappear");
        this.isScrubberVisible = true;
      }
    }
  },

  onTimelineSeek: function() {
    // always scroll window, do not care if appeared/disappeared
    this.force_scroll_window = true;
  },

  onGhostTrackStart: function(track) {
    this.trackFillProgressCallback = this.renderFillProgress.bind(this,track);
    this.media.addEventListener("timeupdate",this.trackFillProgressCallback);
  },

  onGhostTrackEnd: function(track) {
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

    if ($target.hasClass("track")) {
      var track = $target.data("model");
      if (!track.isGhost) {
        Backbone.trigger("timelineseek",track.startTime());
      }
    } else {
      Backbone.trigger("timelineseek",seconds);
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

    // seek
    if (this.seekmode) {
      Backbone.trigger("timelineseek",seconds);
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

  onSummaryMouseEnterHandler: function(event) {
    this.$time_float.show();
  },

  onSummaryMouseMoveHandler: function(event) {
    // move and update time float
    var $target = $(event.target);
    var seconds = this.getSecondsFromCurrentPosition(this.$summary,$target,event.pageX);

    this.renderTimeFloat(seconds);
  },

  onSeekHeadMouseDownHandler: function(event) {
    this.seekmode = true;
    this.$time_float.show();
  },

  onSeekHeadMouseUpHandler: function(event) {
    this.seekmode = false;
    this.$time_float.hide();
  },

  renderTimeFloat: function(seconds) {
    // do not allow seeking to negative duration
    if (seconds < 0) seconds = 0;
    if (seconds > this.mediaDuration) seconds = this.mediaDuration;

    this.$time_float.text(this.stringifyTimeShort(seconds));
    this.$time_float.css("left",event.pageX - this.$time_float.width() / 2);
  },

  onSeekHeadDragHandler: function(event) {
    // move and update time float
    var $target = $(event.target);
    var seconds = this.getSecondsFromCurrentPosition(this.$summary,$target,event.pageX);

    this.renderTimeFloat(seconds);

    // if seekmode, seek
    if (this.seekmode) {
      Backbone.trigger("timelineseek",seconds);
    }
  },

  seek: function(seconds,callback) {

  },

  onSummaryMouseLeaveHandler: function(event) {
    if (!this.seekmode) {
      this.$time_float.hide();
    }
  },

  onExpandedTimelineScroll: function(event,delta,deltaX,deltaY){
    deltaX = -(deltaX * 2);
    this.$expanded.scrollLeft(this.$expanded.scrollLeft() - deltaX) ;
    var secondsToScroll = deltaX / this.resolution(this.$expanded);
    var numPixelsToScrollSummary = this.resolution(this.$summary) * secondsToScroll;
    var oldWindowSliderLeft = parseFloat(this.$window_slider.css("left"));
    var newWindowSliderLeft = oldWindowSliderLeft - numPixelsToScrollSummary;

    // cannot go beyond the min/max left
    var maxLeft = this.$summary.width() - this.$window_slider.width();
    var minLeft = 0;

    if (newWindowSliderLeft >= minLeft && newWindowSliderLeft <= maxLeft) {
      this.updateCurrentWindowSlideRelative(secondsToScroll);
      this.$window_slider.css("left",newWindowSliderLeft);
    }
  },

  updateCurrentWindowSlideRelative: function(secondsToScroll) {
    var newStart = this.current_window_slide.start - secondsToScroll;
    var newEnd =   this.current_window_slide.end   - secondsToScroll;
    this.updateCurrentWindowSlide(newStart,newEnd);
  },

  updateCurrentWindowSlideAbsolute: function(startSeconds) {
    var newStart = startSeconds;
    var newEnd =   startSeconds + this.window_slide_duration;
    this.updateCurrentWindowSlide(newStart,newEnd);
  },

  updateCurrentWindowSlide: function(newStart,newEnd) {
    if (newStart < 0 || newEnd > this.mediaDuration) return;

    this.current_window_slide.start = newStart;
    this.current_window_slide.end   = newEnd;

    // console.log(this.current_window_slide);
  },

  onTrackResize: function(track,ui) {
    var handle= $(event.target).css("cursor").split("-")[0];

    var $container = $(event.target).closest(".timeline");

    var seconds = ui.position.left / this.resolution($container);
    var duration = ui.size.width   / this.resolution($container);

    if (handle === "w") {
      track.setStartTime(seconds);
    } else {
      track.setEndTime(seconds + duration);
    }
  },

  onTrackDrag: function(track,ui) {
    var $container = $(event.target).closest(".timeline");

    var seconds = ui.position.left / this.resolution($container);

    var origStartTime = track.startTime();
    var origEndTime = track.endTime();

    var delta = seconds - origStartTime;

    track.setStartTime(origStartTime + delta);
    track.setEndTime(origEndTime + delta);
  },

  renderTracks: function() {
    for (var i = 0; i < this.tracks.length; i++) {
      this.renderTrack(this.tracks.at(i));
    };
  },

  renderTrack: function(track) {

    var duration = track.endTime() - track.startTime();

    this.renderInContainer(this.$summary,track.summaryView.$el,   { width: duration, left: track.startTime() });
    this.renderInContainer(this.$expanded,track.expandedView.$el, { width: duration, left: track.startTime() });

  },


  renderFillProgress: function(track) {
    var progress = track.progressTime() - track.startTime();

    this.renderInContainer(this.$summary,track.summaryView.$el,  { width: progress, left: track.startTime() });
    this.renderInContainer(this.$expanded,track.expandedView.$el,{ width: progress, left: track.startTime() });
  },

  renderSeekHead: function() {
    // this.renderInContainer(this.$summary, this.$seek_head, { left: this.media.currentTime.toFixed(3) });
    var time = Math.round(this.media.currentTime * 1000) / 1000;
    var relativePixelPos = time * this.resolution(this.$summary);
    this.$seek_head.css('left',this.$summary.position().left + relativePixelPos)
  },

  renderScrubber: function(time) {
    this.renderInContainer(this.$summary, this.$scrubber_summary, { left: this.media.currentTime.toFixed(3) });
    this.renderInContainer(this.$expanded,this.$scrubber_expanded,{ left: this.media.currentTime.toFixed(3) });

  },

  onScrubberDisappear: function(event) {
    this.scrollContainerToElementAndMoveWindowSlider(this.$expanded,this.$scrubber_expanded);
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
    var widthPixel = this.getContainerWidthInPixels($container);
    var widthSeconds = this.getContainerWidthInSeconds($container);

    return widthPixel / widthSeconds ;
  },

  getContainerWidthInPixels: function($container) {
    if ($container.attr("id") === "summary") {
      this.summaryWidth  = this.summaryWidth  || this.$summary.width();
      return this.summaryWidth;
    } else {
      this.expandedWidth = this.expandedWidth || this.$expanded.width();
      return this.expandedWidth;
    }
  },

  getContainerWidthInSeconds: function($container) {
    if ($container.attr("id") === "summary") {
      return this.mediaDuration || 30;
    } else {
      return 30;
    }
  },

  isOutOfBounds: function() {
    // is current time with current_window_slide
    if (this.media.currentTime < this.current_window_slide.start ||
        this.media.currentTime > this.current_window_slide.end      ) {
      return true;
    } else {
      return false;
    }
  },

  ensureCorrectWindowPosition: function() {
    // check scrollLeft - it must be equal to index * this.summaryWidth, otherwise set it to that
    var correctWindowPos = this.current_window_slide.start * this.resolution(this.$expanded) ;
    if (this.$expanded.scrollLeft !== correctWindowPos) {
      this.$expanded.animate({scrollLeft: correctWindowPos},300);
    }
  },

  scrollContainerToElementAndMoveWindowSlider: function($container,$el) {
    // if (!this.media.paused) {

      // find out which window_slide index to scroll element to
      var index = Math.floor(this.media.currentTime / this.window_slide_duration);
      var startTime   = index * this.window_slide_duration;

      var windowSlideTimeout;

      // if queue is not empty, clear all timeouts and replace it with our new one
      if (this.windowSlideTimeoutQueue) {
        for (var i = 0; i < this.windowSlideTimeoutQueue.length; i++) {
          windowSlideTimeout = this.windowSlideTimeoutQueue[i];
          clearTimeout(windowSlideTimeout);
        }
        this.windowSlideTimeoutQueue.length = 0;
      }

      windowSlideTimeout = setTimeout(function() {
        this.$expanded.off("mousewheel",this.onExpandedTimelineScrollCallback);
        $container.animate({scrollLeft: startTime * this.resolution($container)},300,function(){

          // make sure scrolling callback only gets enabled after a second to prevent choppy scroll
          // otherwise, onExpandedTimelineScrollCallback will do extra scrolling that resulted from residual scroll
          // 
          setTimeout(function(){ 
            this.$expanded.on("mousewheel",this.onExpandedTimelineScrollCallback)
          }.bind(this),500);
          

          this.updateCurrentWindowSlideAbsolute(startTime);

          // trigger appear/disappear events
          if (this.isOutOfBounds()) {
            if (this.isScrubberVisible) {
              Backbone.trigger("scrubberdisappear");
              this.isScrubberVisible = false;
            }
          } else {
            if (!this.isScrubberVisible) {
              Backbone.trigger("scrubberappear");
              this.isScrubberVisible = true;
            }
          }
        }.bind(this));
        this.$window_slider.animate({ left: this.resolution(this.$summary) * this.window_slide_duration * index },300);
      }.bind(this),300);

      this.windowSlideTimeoutQueue.push(windowSlideTimeout);
      this.$summary.trigger("window.scroll");
    // }
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
  },

  stringifyTimeShort: function(time) {
    time = Math.round(time * 1000) / 1000;

    var hours = parseInt( time / 3600 ) % 24;
    var minutes = parseInt( time / 60 ) % 60;
    var seconds = Math.floor(time % 60);
    var milliseconds = Math.floor(time * 1000) % 1000

    var result = "";
    var zeroPrependCheck = false;

    if (hours !== 0) {
      result = result + hours;
      zeroPrependCheck = true;
      result += ":";
    }

    if (zeroPrependCheck) {
      result = result + (minutes < 10 ? "0" + minutes : minutes);
    } else {
      result = result + minutes;
    }
    result += ":";

    zeroPrependCheck = true;

    // if (seconds !== 0) {
    if (zeroPrependCheck) {
      result = result + (seconds < 10 ? "0" + seconds : seconds);
    } else {
      result = result + seconds;
    }
    // }

    return result;
  },

  on: function(event_name,callback) {
    this.$summary.on(event_name,callback);
  }

});

