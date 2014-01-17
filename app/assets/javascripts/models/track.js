river.model.Track = Backbone.Model.extend({

  initialize: function(attributes, options) {

    if (typeof options['popcorn'] === "undefined") throw new Error("Missing popcorn object in Track options attribute");
    this.popcorn = options['popcorn'];
    this.isGhost = options['isGhost'] || false;

    this.subtitle = new river.model.Subtitle(attributes['subtitle'], {track: this});
    Backbone.trigger("subtitlecreate",this.subtitle);

    // when trackEvent is created, trackstart event is triggered, received by editor.js and it
    // will use subtitle so by that time subtitle should already exist. Its very tightly coupled....
    this.trackEvent     = this.createTrackEvent(attributes.start_time,attributes.end_time);


    this.expandedView = new river.ui.ExpandedTrack({model: this});
    this.summaryView  = new river.ui.SummaryTrack({model: this});

    this.views = [this.expandedView,this.summaryView];

    if (this.isGhost) {
      Backbone.trigger("ghosttrackstart",this);

      _.each(this.views,function(view){
        view.addGhost();
      });

    }

    this.listenTo(this, "change", this.touchSubtitle);
    this.listenTo(this, "request", this.onRequest);
    
    this.initial_subtitle_request = true;

  },

  touchSubtitle: function() {
    this.subtitle.trigger("change",this.subtitle,{});
  },

  onRequest: function() {
    Backbone.trigger("trackrequest");
  },

  save: function() {
    if (this.isGhost) return;
    Backbone.trigger("editor.sync","save",this);
  },

  destroy: function() {
    Backbone.trigger("editor.sync","destroy",this);
  },

  getAttributes: function(attributes) {
    return {
      id: this.id,
      start_time: this.startTime(),
      end_time: this.endTime(),
      subtitle_attributes: this.subtitle.getAttributes(),
    }
  },

  toJSON: function() {
    var json = Backbone.Model.prototype.toJSON.call(this);
    json["subtitle_attributes"] = this.subtitle.toJSON();
    return json;
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
    this.set("start_time",time);
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
    this.set("end_time",time);
  },

  text: function() {
    return this.subtitle.get("text");
  },

  end: function(time) {
    var duration = time - this.startTime();

    if (duration <= 0) {
      throw new Error("Track Duration of " + duration + " is invalid");
    }

    this.setEndTime(time);
    
    Backbone.trigger("ghosttrackend",this);

    this.isGhost = false;

    _.each(this.views,function(view){
      view.removeGhost();
    });

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
    if (this.isGhost) {
      this.end(this.endTime());  
    }
    
    this.isDeleted = true;

    this.trackEvent._running = false; // disallow trackend event from getting triggered
    this.popcorn.removeTrackEvent(this.trackEvent._id);

    this.destroy();

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

river.model.TrackSet = Backbone.Collection.extend({
  model: river.model.Track,

  localStorage: new Backbone.LocalStorage("river-local"),

  initialize: function(attributes, options) {
    // setInterval(this.autoSaveTracks.bind(this),5000);
  },

  comparator: function(track) {
    return track.startTime();
  }

});
