river.ui.Timeline = Backbone.View.extend({
  /**
    options:
      @media    - media DOM element 
      @duration - duration of video (based on metadata, will exist even if media is not available)
  */

  initialize: function(options) {
    this.WINDOW_WIDTH_IN_SECONDS = 30;

    this.tracks = options.tracks;
    this.hideTracks = options.hideTracks;
    this.mediaDuration = options.mediaDuration; 
    this.window_slide_duration = this.WINDOW_WIDTH_IN_SECONDS;
    this.disable_expanded = options.disable_expanded || false;
    this.lastWindowSlideTimeout = null;
    this.current_window_slide = { start: 0, end: this.mediaDuration < this.WINDOW_WIDTH_IN_SECONDS ? this.mediaDuration : this.WINDOW_WIDTH_IN_SECONDS };
    this.prevScrollerHandlerPageX = null;    
    this.setMedia(options.media);

    this.render();
  },

  render: function() {
    this.setupElement();
    this.bindEvents();
  },

  setupElement: function() {
  },

  setMedia: function(media) {
    this.media = media;
  },

  bindEvents: function() {
    this.media.addEventListener("timeupdate",this.onTimeUpdate.bind(this));
    this.media.addEventListener("loadedmetadata",this.onLoadedMetadata.bind(this));

    Backbone.on("ghosttrackstart",this.onGhostTrackStart.bind(this));
    Backbone.on("ghosttrackend",this.onGhostTrackEnd.bind(this));
    Backbone.on("trackchange",this.onTrackChange.bind(this));
    Backbone.on("trackadd",this.onTrackAdd.bind(this));

    $(document).on("mouseup",this.onDocumentMouseUpHandler.bind(this));

  },

  onLoadedMetadata: function() {
  },

  onTrackChange: function(track) {
    if (!this.hideTracks) {
      this.renderTrack(track);
    }
  },

  onTrackAdd: function(track) {
    if (track.isGhost) {
      this.renderGhostTrack(track);
    } else {
      this.renderTrack(track);
    }
  },

  onTimeUpdate: function(event) {
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
    var track = null;
    var seconds;

    if ($target.hasClass("track")) {
      track = $target.data("model");
    }

    if ($target.hasClass("track_text")) {
      track = $target.parent().data("model");
    }

    if (track && !track.isGhost) {
      seconds = track.startTime();
    } else { 
      if (!$target.hasClass("timeline")) {
        $timeline = $target.closest(".timeline");
      } else {
        $timeline = $target;
      }
      seconds = this.getSecondsFromCurrentPosition($timeline,event.pageX);
    }

    Backbone.trigger("timelineseek",seconds, $target);
  },

  onMouseMoveHandler: function(event) {
    if (!this.seekmode) return;

    // given pixel position, find out what seconds in time it corresponds to
    var $target = $(event.target);
    var $timeline;

    if (!$target.hasClass("timeline")) {
      $timeline = $target.closest(".timeline");
    } else {
      $timeline = $target;
    }

    var seconds = this.getSecondsFromCurrentPosition($timeline,event.pageX);

    // seek
    Backbone.trigger("timelineseek",seconds, $target);
  },

  getSecondsFromCurrentPosition: function($container,eventPageX) {
    var timelineX = $container.offset().left;
    var posX = eventPageX - timelineX;
    var seconds = posX / this.resolution($container) + $container.scrollLeft() / this.resolution($container);
    seconds = Math.round(seconds * 1000) / 1000;
    return seconds;
  },

  onDocumentMouseUpHandler: function(event) {
    this.seekmode = false;
    if ($(event.target).attr("id") !== "summary" && $(event.target).closest("#summary").length === 0) {
      this.$time_float.hide();
    }
  },

  scrollWindow: function(secondsToScroll) {
    var deltaX = secondsToScroll * this.resolution(this.$expanded);
    this.$expanded.scrollLeft(this.$expanded.scrollLeft() - deltaX) ;
    var numPixelsToScrollSummary = this.resolution(this.$summary) * secondsToScroll;
    var oldWindowSliderLeft = parseFloat(this.$window_slider.css("left"));
    var newWindowSliderLeft = oldWindowSliderLeft - numPixelsToScrollSummary;

    newWindowSliderLeft = this.normalizeTargetXPosInContainer(this.$summary, this.$window_slider, newWindowSliderLeft);

    this.updateCurrentWindowSlideRelative(secondsToScroll);
    this.$window_slider.css("left",newWindowSliderLeft);
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

  renderTracks: function() {
    for (var i = 0; i < this.tracks.length; i++) {
      this.renderTrack(this.tracks.at(i));
    };
  },

  renderTrack: function(track) {
  },

  renderGhostTrack: function(track) {
  },

  renderFillProgress: function(track) {
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

  setTimelineWidth: function() {
  },

  // how many pixels per second
  resolution: function($container) {
    var widthPixel = this.getContainerWidthInPixels($container);
    var widthSeconds = this.getContainerWidthInSeconds($container);

    return widthPixel / widthSeconds ;
  },

  getContainerWidthInPixels: function($container) {
    if ($container.attr("id") === "summary") {
      return this.summaryWidth;
    } else {
      return this.expandedWidth;
    }
  },

  getContainerWidthInSeconds: function($container) {
    if ($container.attr("id") === "summary") {
      return this.mediaDuration || this.WINDOW_WIDTH_IN_SECONDS;
    } else {
      return this.WINDOW_WIDTH_IN_SECONDS;
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

  normalizeTargetXPosInContainer: function($container, $el, xPos) {
    // cannot go beyond the min/max left
    var maxLeft = $container.width() - $el.width();
    var minLeft = 0;
    var pos = xPos;

    if (pos < minLeft) pos = minLeft;
    if (pos > maxLeft) pos = maxLeft;

    return pos;
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

});

river.ui.SummaryTimeline = river.ui.Timeline.extend({
  setupElement: function() {
    this.$summary_container = $("#media_container");

    var summary = "<div id='time_float'><div id='summary' class='timeline' >" +
                     // "<div class='window_slider'></div>" +
                   "</div>";

    this.$summary_container.find("#viewing_screen").after(summary);
    this.$summary = $("#summary");

    this.setTimelineWidth();

    this.$time_float = $("#time_float");
    this.$time_float.hide();

    this.$seek_head = $("#seek_head");
    this.$seek_head.hide();

    this.$seek_head.draggable({
      cursor: "pointer",
      axis: "x",
      containment: "parent",
      drag: this.onSeekHeadDragHandler.bind(this)
    });

    // current time display indicator
    this.$time_indicator = $("<div class='time_indicator'>00:00:00.000</div>");
    $("#viewing_screen").append(this.$time_indicator);
  },

  bindEvents: function() {
    river.ui.Timeline.prototype.bindEvents.call(this);

    this.$summary.on("mousedown",this.onMouseDownHandler.bind(this));
    this.$summary.on("mousemove",this.onMouseMoveHandler.bind(this));

    this.$summary.on("mouseenter",this.onSummaryMouseEnterHandler.bind(this));
    this.$summary.on("mousemove",this.onSummaryMouseMoveHandler.bind(this));
    this.$summary.on("mouseleave",this.onSummaryMouseLeaveHandler.bind(this));

    this.$summary.on("touchstart",this.onSummaryTouchStartHandler.bind(this));

    this.$seek_head.on("mousedown",this.onSeekHeadMouseDownHandler.bind(this));
  },

  onLoadedMetadata: function() {
    this.renderSeekHead();
    this.$seek_head.show(); 
  },

  renderSeekHead: function() {
    if (this.$seek_head.length === 0) return;
    
    this.renderInContainer(this.$summary, this.$seek_head, { left: this.media.currentTime.toFixed(3) });
    var time = Math.round(this.media.currentTime * 1000) / 1000;
    var relativePixelPos = time * this.resolution(this.$summary);
    this.$seek_head.css('left',this.$summary.position().left + relativePixelPos)
  },

  setTimelineWidth: function() {
    debugger
    this.summaryWidth  = this.$summary.width();
  },

  onTrackAdd: function(track) {
    if (this.hideTracks) return;

    river.ui.Timeline.prototype.onTrackAdd.call(track);
    this.$summary.append(track.summaryView.$el);
  },

  renderTrack: function(track) {
    if (typeof track === "undefined") return;
    if (track.isGhost) return;

    var duration = track.endTime() - track.startTime();

    this.renderInContainer(this.$summary,track.summaryView.$el,   { width: duration, left: track.startTime() });
  },

  onTimeUpdate: function(event) {
    this.renderSeekHead();

    this.renderTimeIndicator();
  },

  renderTimeIndicator: function() {
    var time = this.stringifyTime(this.media.currentTime);
    this.$time_indicator.text(time);
  },

  renderGhostTrack: function(track) {
    this.renderInContainer(this.$summary,track.summaryView.$el,   { width: 0, left: track.startTime() });
  },

  renderFillProgress: function(track) {
    var progress = track.progressTime() - track.startTime();

    this.renderInContainer(this.$summary,track.summaryView.$el,  { width: progress, left: track.startTime() });
  },

  onSummaryMouseEnterHandler: function(event) {
    this.$time_float.show();
  },

  onSummaryTouchStartHandler: function(event) {
    this.$time_float.show();

    if (this.lastTimeFloatHideTimeout) clearTimeout(this.lastTimeFloatHideTimeout);

    this.lastTimeFloatHideTimeout = setTimeout(function(){
      this.$time_float.hide();
    }.bind(this),3000);
  },

  onSummaryMouseMoveHandler: function(event) {
    // move and update time float
    var $target = $(event.target);
    this.renderTimeFloat(event.pageX);
  },

  onSeekHeadMouseDownHandler: function(event) {
    this.seekmode = true;
    this.$time_float.show();
  },

  renderTimeFloat: function(posX) {
    debugger
    var seconds = this.getSecondsFromCurrentPosition(this.$summary,posX);

    // do not allow seeking to negative duration
    if (seconds < 0) seconds = 0;
    if (seconds > this.mediaDuration) seconds = this.mediaDuration;

    this.$time_float.text(this.stringifyTimeShort(seconds));
    this.$time_float.css("left",posX - this.$time_float.width() / 2);
  },

  onSeekHeadDragHandler: function(event) {
    // move and update time float
    var $target = $(event.target);
    this.renderTimeFloat(event.pageX);

    // if seekmode, seek
    if (this.seekmode) {
      var seconds = this.getSecondsFromCurrentPosition(this.$summary,event.pageX);
      Backbone.trigger("timelineseek",seconds, $target);
    }
  },

  onSummaryMouseLeaveHandler: function(event) {
    if (!this.seekmode) {
      this.$time_float.hide();
    }
  },



});

river.ui.ExpandedTimeline = river.ui.Timeline.extend({
  setupElement: function() {
    if (this.disable_expanded) return;

    var expanded = "<div id='expanded' class='timeline'>" +
                     "<div class='filler'>" +
                       "<div id='time_label'>" +
                       "</div>" +
                       "<div id='track_viewport'>" +
                         "<div class='scrubber'></div>" +
                       "</div>" +
                     "</div>" +
                   "</div>" +
                   "<div id='timeline_scroller'>" +
                     "<div id='scroller_handle'>" +
                     "</div>" + 
                   "</div>"; 

    this.$expanded_container = $("#timeline_container");
    this.$expanded_container.prepend(expanded);

    this.$expanded = $("#expanded");
    this.$expanded_track_viewport = $("#track_viewport");

    this.setTimelineWidth();

    // expanded timeline filler
    this.$filler = $("#expanded .filler");
    this.$filler.css("width",this.resolution(this.$expanded) * this.mediaDuration);

    // window slider
    this.$window_slider = $("#summary .window_slider");
    this.$window_slider.css("left",0);
    this.$window_slider.css("width",this.resolution(this.$summary) * this.WINDOW_WIDTH_IN_SECONDS);
    if (this.mediaDuration < this.WINDOW_WIDTH_IN_SECONDS) this.$window_slider.hide();


    // scrubber
    this.$scrubber_expanded = $("#expanded .scrubber");

    var move_left_btn = "<a href='#' class='move_left_btn'>" +
                         "<i class='glyphicon glyphicon-chevron-left'></i>" +
                        "</a>";

    var move_right_btn = "<a href='#' class='move_right_btn'>" +
                           "<i class='glyphicon glyphicon-chevron-right'></i>" +
                         "</a>";

    this.$expanded_container.append(move_left_btn);
    this.$expanded_container.append(move_right_btn);

    this.$move_left_btn = $(".move_left_btn");
    this.$move_right_btn = $(".move_right_btn");


    // timeline label
    var timeline_label = this.createTimeLabelHTMLString(this.$filler.width(),this.mediaDuration);
    this.$expanded_time_label = $("#time_label");
    this.$expanded_time_label.append(timeline_label);

    this.$timeline_scroller = $("#timeline_scroller");
    this.$scroller_handle = $("#scroller_handle");
    this.$scroller_handle.css("left",0);

    this.$timeline_scroller.hover(
      this.setScrollerColor.bind(this),
      this.resetScrollerColor.bind(this)
    );

    this.$scroller_handle.draggable({
      cursor: "move",
      axis: "x",
      containment: "parent",
      drag: this.onScrollerHandleDrag.bind(this),
      stop: this.onScrollerHandleStop.bind(this)
    });
  },

  bindEvents: function() {
    if (this.disable_expanded) return;

    this.$move_left_btn.on("click",this.onMoveLeftBtnClick.bind(this));
    this.$move_right_btn.on("click",this.onMoveRightBtnClick.bind(this));

    this.onExpandedTimelineScrollCallback = this.onExpandedTimelineScroll.bind(this);
    this.$expanded.on("mousewheel",this.onExpandedTimelineScrollCallback);
    this.$expanded.on("dblclick",this.onExpandedTimelineDblClick.bind(this));
    this.$expanded.on("mousedown",this.onMouseDownHandler.bind(this));
    this.$expanded.on("mousemove",this.onMouseMoveHandler.bind(this));

    Backbone.on("trackresize",this.onTrackResize.bind(this));
    Backbone.on("trackdrag",this.onTrackDrag.bind(this));

  },

  onExpandedTimelineDblClick: function(event) {
    Backbone.trigger("expandedtimelinedblclick", event);
  },


  onTrackAdd: function(track) {
    if (this.hideTracks) return;

    river.ui.Timeline.prototype.onTrackAdd.call(track);
    this.$expanded_track_viewport.append(track.expandedView.$el);
  },

  onScrollerHandleDrag: function(event) {
    this.setScrollerColor();
    if (!this.prevScrollerHandlerPageX) {
      this.prevScrollerHandlerPageX = event.pageX;    
    }
    var deltaX = event.pageX - this.prevScrollerHandlerPageX;
    this.prevScrollerHandlerPageX = event.pageX;    

    var scrollFactor = this.mediaDuration/this.WINDOW_WIDTH_IN_SECONDS;
    deltaX = -(deltaX * scrollFactor);
    var secondsToScroll = deltaX / this.resolution(this.$expanded);

    this.scrollWindow(secondsToScroll);
  },

  onScrollerHandleStop: function(event) {
    this.resetScrollerColor();
    this.prevScrollerHandlerPageX = null;
  },

  setScrollerColor: function() {
    this.$timeline_scroller.css("background-color","rgb(240,240,240)");
    this.$timeline_scroller.css("border","solid 1px gray");
    this.$timeline_scroller.css("border-top","none");
  },

  resetScrollerColor: function() {
    this.$timeline_scroller.css("background-color","transparent");
    this.$timeline_scroller.css("border","none");
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
          label =    "<g transform='translate(" + xPos + ",-2)' style='opacity: 1;'>" +
                       "<line class='tick' y2='3' x2='0'></line>" +
                       "<text class='time' fill='#777777' y='-2' x='0' text-anchor='middle'>" + time + "</text>" +
                     "</g>";
        } else {
          label =    "<g transform='translate(" + xPos + ",-5)' style='opacity: 1;'>" +
                       "<line class='tick' y2='5' x2='0'></line>" +
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

  onTrackResize: function(event,track,ui) {
    var $container = $(event.target).closest(".timeline");

    var seconds = ui.position.left / this.resolution($container);
    var duration = ui.size.width   / this.resolution($container);

    track.setStartTime(seconds);
    track.setEndTime(seconds + duration);
  },

  onTrackDrag: function(event,track,ui) {
    var $container = $(event.target).closest(".timeline");

    var seconds = ui.position.left / this.resolution($container);

    var origStartTime = track.startTime();
    var origEndTime = track.endTime();

    var delta = seconds - origStartTime;

    track.setStartTime(origStartTime + delta);
    track.setEndTime(origEndTime + delta);
  },

  renderTrack: function(track) {
    if (typeof track === "undefined") return;
    if (track.isGhost) return;

    var duration = track.endTime() - track.startTime();

    this.renderInContainer(this.$expanded,track.expandedView.$el, { width: duration, left: track.startTime() });
  },

  onTimeUpdate: function(event) {
    if (this.disable_expanded) return;
    this.renderScrubber();
    this.scrollWindowIfOutOfBounds();
  },

  renderScrubber: function(time) {
    if (this.disable_expanded) return;
    this.renderInContainer(this.$expanded,this.$scrubber_expanded,{ left: this.media.currentTime.toFixed(3) });
  },

  scrollWindowIfOutOfBounds: function() {
    if (this.isOutOfBounds()) {
      this.scrollToScrubber();
    }
  },

  scrollToScrubber: function() {
      // find out which window_slide index to scroll element to
      var index = Math.floor(this.media.currentTime / this.window_slide_duration);
      var startTime   = index * this.window_slide_duration;
      this.scrollContainerToTime(startTime);
  },


  scrollContainerToTime: function(startTime) {
    var windowSlideTimeout;

    // return from function if target timeout is similar to what we already have
    if (this.lastWindowSlideTimeout) {
      if (this.lastWindowSlideTimeout.startTime == startTime) {
        return; 
      } else {
        // clear previous timeout if its not the same target time
        clearTimeout(this.lastWindowSlideTimeout.windowSlideTimeout);
        this.lastWindowSlideTimeout = null;
      }
    }

    windowSlideTimeout = setTimeout(function() {
      this.$expanded.off("mousewheel",this.onExpandedTimelineScrollCallback);
      this.$expanded.animate({scrollLeft: startTime * this.resolution(this.$expanded)},300,function(){

        // make sure scrolling callback only gets enabled after a second to prevent choppy scroll
        // otherwise, onExpandedTimelineScrollCallback will do extra scrolling that resulted from residual scroll
        // 
        setTimeout(function(){ 
          this.$expanded.on("mousewheel",this.onExpandedTimelineScrollCallback)
        }.bind(this),500);
        
        this.updateCurrentWindowSlideAbsolute(startTime);
      }.bind(this));

      var xPos = this.resolution(this.$timeline_scroller) * startTime;
      var scrollerHandleXPos = this.normalizeTargetXPosInContainer(this.$timeline_scroller, this.$scroller_handle, xPos); 

      this.$scroller_handle.animate({ left: scrollerHandleXPos },300);
    }.bind(this),300);

    this.lastWindowSlideTimeout = { startTime: startTime, timeout: windowSlideTimeout };
  },

  renderFillProgress: function(track) {
    var progress = track.progressTime() - track.startTime();

    this.renderInContainer(this.$expanded,track.expandedView.$el,{ width: progress, left: track.startTime() });
  },

  onExpandedTimelineScroll: function(event,delta,deltaX,deltaY){
    deltaX = -(deltaX * 2);
    var secondsToScroll = deltaX / this.resolution(this.$expanded);
    if (!isNaN(deltaX)) {
      this.scrollWindow(secondsToScroll);
      this.updateScrollerHandlePosition(secondsToScroll);
    }
  },

  onMoveLeftBtnClick: function(event) {
    event.preventDefault();
    this.scrollContainerToTime(this.current_window_slide.start - 10);
  },

  onMoveRightBtnClick: function(event) {
    event.preventDefault();
    this.scrollContainerToTime(this.current_window_slide.start + 10);
  },

  updateScrollerHandlePosition: function(secondsToScroll) {
    var numPixelsToScrollSummary = this.resolution(this.$summary) * secondsToScroll;
    var oldWindowSliderLeft = parseFloat(this.$scroller_handle.css("left"));
    var newWindowSliderLeft = oldWindowSliderLeft - numPixelsToScrollSummary;

    newWindowSliderLeft = this.normalizeTargetXPosInContainer(this.$summary, this.$scroller_handle, newWindowSliderLeft);

    this.$scroller_handle.css("left",newWindowSliderLeft);
  },

  renderGhostTrack: function(track) {
    this.renderInContainer(this.$expanded,track.expandedView.$el, { width: 0, left: track.startTime() });
  },

  setTimelineWidth: function() {
    this.expandedWidth = this.$expanded.width();
  },

  ensureCorrectWindowPosition: function() {
    // check scrollLeft - it must be equal to index * this.summaryWidth, otherwise set it to that
    var correctWindowPos = this.current_window_slide.start * this.resolution(this.$expanded) ;
    if (this.$expanded.scrollLeft !== correctWindowPos) {
      this.$expanded.animate({scrollLeft: correctWindowPos},300);
    }
  }


});
