function Track(attributes,popcorn,options) {
  if (typeof popcorn === "undefined") throw "Missing popcorn object. Pass popcorn to new Track in 2nd argument";
  this.popcorn = popcorn;

  this.options = options || {};

  this.setAttributes(attributes);

  this.setupElement();
  this.bindEvents();

  var subtitle = new Subtitle(attributes['subtitle']);
  this.setSubtitle(subtitle);
  this.trackEvent     = this.createTrackEvent(attributes.start_time,attributes.end_time);

  this.isSaved = typeof this.options['isSaved'] === "undefined" ? false : this.options['isSaved'];
  this.isDeleted = false;

}

Track.prototype = {

  setAttributes: function(attributes) {
    if (!attributes.hasOwnProperty("start_time") || !attributes.hasOwnProperty("end_time")) {
      throw "Missing start_time or end_time attribute for Track";
    }

    for (var prop in attributes) {
      this[prop] = attributes[prop];
    }
  },

  getAttributes: function(attributes) {
    return {
      id: this.id,
      start_time: this.startTime(),
      end_time: this.endTime(),
      client_id: this.trackEvent._id,
      subtitle_attributes: this.subtitle.getAttributes(),
    }
  },

  setupElement: function() {

    this.$container_summary = $("#summary.timeline");

    var el_summary = "<div id='" + this.id + "' class='track'>" +
                     "</div>"

    this.$el_summary = $(el_summary);
    this.$container_summary.append(this.$el_summary);

    this.$container_expanded = $("#expanded.timeline");

    var el_expanded = "<div id='" + this.id + "' class='track'>" +
                       "<button type='button' class='close corner'>×</button>" +
                     "</div>"

    this.$el_expanded = $(el_expanded);
    this.$container_expanded.find("#track_viewport").append(this.$el_expanded);

    if (this.options["isGhost"]) {
      this.$el_summary.addClass("ghost");
      this.$el_expanded.addClass("ghost");
      this.$el_expanded.trigger("ghosttrackstart",[this]);
      this.initial_subtitle_request = true;
    }

    this.$close = this.$el_expanded.find(".close");
    this.$close.hide();

    this.$el_expanded.resizable({
      handles: 'e, w',
      resize: this.onResizableResize.bind(this)
    });

    this.$el_expanded.draggable({
      cursor: "move",
      axis: "x",
      containment: "parent",
      drag: this.onDraggableDrag.bind(this)
    });
    this.$el_expanded.data("model",this);
    this.$el_summary.data("model",this);
  },

  bindEvents: function() {
    this.$el_expanded.on("mousedown",this.onMouseDownHandler.bind(this));
    this.$el_summary.on("mousedown",this.onMouseDownHandler.bind(this));

    this.$el_expanded.on("dblclick",this.onMouseDblClickHandler.bind(this));

    this.$el_expanded.on("mouseenter",this.onMouseEnter.bind(this));
    this.$el_expanded.on("mouseleave",this.onMouseLeave.bind(this));
    this.$close.on("mousedown",this.onCloseMouseDown.bind(this));
  },

  onMouseEnter: function() {
    this.$close.show();
  },

  onMouseLeave: function() {
    this.$close.hide();
  },

  onCloseMouseDown: function(event) {
    event.stopPropagation();
    this.remove();
  },

  onMouseDownHandler: function(event) {
    $(event.target).trigger("trackseek",[this.startTime()]);
  },

  onMouseDblClickHandler: function(event) {
    this.$el_expanded.trigger("subtitleeditmode",[this]);
  },

  onResizableResize: function(event, ui) {
    this.$el_expanded.trigger("trackresize",[this,ui]);
  },

  onDraggableDrag: function(event, ui) {
    this.$el_expanded.trigger("trackdrag",[this,ui]);
  },

  setSubtitle: function(subtitle) {
    this.subtitle = subtitle;
    subtitle.setTrack(this);
  },

  startTime: function() {
    if (typeof this.trackEvent !== "undefined") {
      return this.trackEvent.start;
    } else {
      return this.start_time;
    }
  },

  setStartTime: function(time) {
    time = Math.round(time * 1000) / 1000;
    this.trackEvent.start = time;

    this.isSaved = false;
    this.$el_expanded.trigger("trackchange",[this]);
  },

  endTime: function() {
    if (typeof this.trackEvent !== "undefined") {
      return this.trackEvent.end;
    } else {
      return this.end_time;
    }
  },

  setEndTime: function(time) {
    time = Math.round(time * 1000) / 1000;
    this.trackEvent.end = time;

    this.isSaved = false;
    this.$el_expanded.trigger("trackchange",[this]);
  },

  text: function() {
    return this.subtitle.text;
  },

  end: function(time) {
    this.removeGhostClass();
    this.$el_expanded.trigger("ghosttrackend",[this]);

    var duration = time - this.startTime();

    if (duration <= 0) {
      throw "Track Duration of " + duration + " is invalid";
    }

    this.setEndTime(time);
  },

  removeGhostClass: function() {
    if (this.$el_summary.hasClass("ghost")) {
      this.$el_summary.removeClass("ghost");
    }

    if (this.$el_expanded.hasClass("ghost")) {
      this.$el_expanded.removeClass("ghost");
    }
  },

  isGhost: function() {
    return this.$el_expanded.hasClass("ghost");
  },

  isRemoved: function() {
    return this.isDeleted;
  },

  createTrackEvent: function(startTime,endTime) {
    var self = this;

    this.popcorn.code({
      start: startTime,
      end:   endTime,
      onStart: function() {
        // console.log("track start: " + self);
        $(document).trigger("trackstart",[self]);
      },
      onEnd: function() {
        // console.log("track end: " + self);
        $(document).trigger("trackend",[self]);
      }
    });

    var trackEventId = this.popcorn.getLastTrackEventId();

    return this.popcorn.getTrackEvent(trackEventId);
  },

  remove: function() {
    this.isDeleted = true;
    if (this.isGhost()) {
      this.end(this.endTime());  
    }
    this.$el_expanded.remove();
    this.$el_summary.remove();

    this.trackEvent._running = false; // disallow trackend event from getting triggered
    this.popcorn.removeTrackEvent(this.trackEvent._id);
    // this.subtitle.unmapTrack();
    this.subtitle.remove();
    $(document).trigger("trackremove",this);
  },

  highlight: function() {
    this.$el_summary.addClass("selected");
    this.$el_expanded.addClass("selected");
  },

  unhighlight: function() {
    this.$el_summary.removeClass("selected");
    this.$el_expanded.removeClass("selected");
  },

  fadingHighlight: function() {
    this.$el_expanded.effect("highlight", {color: "moccasin"}, 1000);
  },

  progressTime: function() {
    if (this.isGhost()) {
      return this.popcorn.currentTime();
    } else {
      return this.endTime();
    }
  },

  toString: function() {
    return "Track(" + this.startTime() + "," + this.endTime() + ")";
  }
};
