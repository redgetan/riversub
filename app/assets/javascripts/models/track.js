var Track = Backbone.Model.extend({

  initialize: function(attributes, options) {

    if (typeof options['popcorn'] === "undefined") throw "Missing popcorn object in Track options attribute";
    this.popcorn = options['popcorn'];
    this.isGhost = options['isGhost'] || false;

    this.subtitle = new Subtitle(attributes['subtitle'], {track: this});

    // when trackEvent is created, trackstart event is triggered, received by editor.js and it 
    // will use subtitle so by that time subtitle should already exist. Its very tightly coupled....
    this.trackEvent     = this.createTrackEvent(attributes.start_time,attributes.end_time);
    

    this.expandedView = new ExpandedTrackView({model: this});
    this.summaryView = new SummaryTrackView({model: this});

    this.views = [this.expandedView,this.summaryView];

    if (this.isGhost) {
      Backbone.trigger("ghosttrackstart",this);

      _.each(this.views,function(view){
        view.addGhost();
      });

      this.initial_subtitle_request = true;
    }

  },

  getAttributes: function(attributes) {
    return {
      id: this.id,
      start_time: this.startTime(),
      end_time: this.endTime(),
      subtitle_attributes: this.subtitle.getAttributes(),
    }
  },

  startTime: function() {
    if (typeof this.trackEvent !== "undefined") {
      return this.trackEvent.start;
    } else {
      return this.get("start_time");
    }
  },

  setStartTime: function(time) {
    time = Math.round(time * 1000) / 1000;
    this.trackEvent.start = time;

    Backbone.trigger("trackchange",this);
  },

  endTime: function() {
    if (typeof this.trackEvent !== "undefined") {
      return this.trackEvent.end;
    } else {
      return this.get("end_time");
    }
  },

  setEndTime: function(time) {
    time = Math.round(time * 1000) / 1000;
    this.trackEvent.end = time;

    Backbone.trigger("trackchange",this);
  },

  text: function() {
    return this.subtitle.get("text");
  },

  end: function(time) {
    this.isGhost = false;

    Backbone.trigger("ghosttrackend",this);

    _.each(this.views,function(view){
      view.removeGhost();
    });

    var duration = time - this.startTime();

    if (duration <= 0) {
      throw "Track Duration of " + duration + " is invalid";
    }

    this.setEndTime(time);
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
        Backbone.trigger("trackstart",self);
      },
      onEnd: function() {
        // console.log("track end: " + self);
        Backbone.trigger("trackend",self);
      }
    });

    var trackEventId = this.popcorn.getLastTrackEventId();

    return this.popcorn.getTrackEvent(trackEventId);
  },

  remove: function() {
    this.isDeleted = true;
    if (this.isGhost) {
      this.end(this.endTime());   // why do we need to end ghost track before removing it?
    }
    this.trackEvent._running = false; // disallow trackend event from getting triggered
    this.popcorn.removeTrackEvent(this.trackEvent._id);

    _.each(this.views,function(view){
      view.remove();
    });

    Backbone.trigger("trackremove",this);
  },

  highlight: function() {
    _.each(this.views,function(view){
      view.highlight();
    });
  },

  unhighlight: function() {
    _.each(this.views,function(view){
      view.unhighlight();
    });
  },

  fadingHighlight: function() {
    this.expandedView.fadingHighlight();
  },

  progressTime: function() {
    if (this.isGhost) {
      return this.popcorn.currentTime();
    } else {
      return this.endTime();
    }
  },

  toString: function() {
    return "Track(" + this.startTime() + "," + this.endTime() + ")";
  }
});
