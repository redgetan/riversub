function Track (startTime,endTime,subtitleLine,popcorn,editor) {
  this.popcorn = popcorn;
  this.editor = editor;
  this.setSubtitleLine(subtitleLine);

  this.trackEvent     = this.createTrackEvent(startTime,endTime);
  this.id = this.trackEvent._id; 

  this.setupElement();
  this.bindEvents();

}

Track.prototype = {

  setupElement: function() {
    this.$container_summary = $("#timeline_container #summary");
    this.$el_summary = $("<div id='" + this.id + "' class='track'>");
    this.$container_summary.append(this.$el_summary);

    this.$container_expanded = $("#timeline_container #expanded");
    this.$el_expanded = $("<div id='" + this.id + "' class='track'>");
    this.$container_expanded.find(".filler").append(this.$el_expanded);

    this.$el_summary.addClass("ghost");
    this.$el_expanded.addClass("ghost");

  },

  // perhaps track should only render width & height
  // position should be left up to editor
  render: function() {
    this.renderInContainer(this.$container_summary,this.$el_summary);
    this.renderInContainer(this.$container_expanded,this.$el_expanded);
  },

  // needs container,element

  renderInContainer: function($container,$el) {
    console.log("[track] container: " + $container.attr("id") + " resolution: " + this.resolution($container));
    var duration = this.endTime() - this.startTime();
    $el.css("width", this.resolution($container) * duration  + "px");
    $el.css("left",  this.resolution($container) * this.startTime());
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
    return this.popcorn.media.duration || 30;
  },

  expandedTimelineWidthInSeconds: function() {
    return 30; //always 30 seconds
  },

  bindEvents: function() {
    this.$el_expanded.on("click",this.onMouseClickHandler.bind(this));
    this.$el_summary.on("click",this.onMouseClickHandler.bind(this));
  },

  onMouseClickHandler: function(event) {
    this.editor.seek(this.startTime());
    this.subtitleLine.highlight();
  },

  setSubtitleLine: function(subtitleLine) {
    this.subtitleLine = subtitleLine;
    subtitleLine.setTrack(this);
  },

  startTime: function() {
    return this.trackEvent.start;
  },

  setStartTime: function(time) {
    this.trackEvent.start = time;
    this.render();
    this.subtitleLine.render();
  },

  endTime: function() {
    return this.trackEvent.end;
  },

  setEndTime: function(time) {
    this.trackEvent.end = time;
    this.render();
    this.subtitleLine.render();
  },

  text: function() {
    return this.subtitleLine.text;
  },

  end: function(time) {
    var duration = time - this.startTime();

    if (duration <= 0) {
      throw "Track Duration of " + duration + " is invalid";
    }

    if (this.$el_summary.hasClass("ghost")) {
      this.$el_summary.removeClass("ghost");
    }

    if (this.$el_expanded.hasClass("ghost")) {
      this.$el_expanded.removeClass("ghost");
    }

    this.setEndTime(time);
  },

  createTrackEvent: function(startTime,endTime) {
    var self = this;

    this.popcorn.code({
      start: startTime,
      end:   endTime,
      onStart: function() {
        self.showSubtitleInSubtitleBar();
      },
      onEnd: function() {
        self.hideSubtitleInSubtitleBar();
      },
    });

    var trackEventId = this.popcorn.getLastTrackEventId();
    return this.popcorn.getTrackEvent(trackEventId);
  },

  showSubtitleInSubtitleBar: function() {
    this.editor.$subtitleBar.text(this.subtitleLine.text);
  },

  hideSubtitleInSubtitleBar: function() {
    this.editor.$subtitleBar.text("");
  },

  remove: function() {
    this.$el_expanded.remove();
    this.$el_summary.remove();
    this.popcorn.removeTrackEvent(this.trackEvent._id);
  },

  toString: function() {
    return "Track(" + this.startTime() + "," + this.endTime() + ")";
  }
};
