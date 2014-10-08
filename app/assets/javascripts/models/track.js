river.model.Track = Backbone.Model.extend({
  initialize: function(attributes, options) {

    if (typeof options['popcorn'] === "undefined") throw new Error("Missing popcorn object in Track options attribute");
    this.popcorn = options['popcorn'];
    this.isGhost = options['isGhost'] || false;


    if (typeof options.view_enabled === "undefined" ) {
      options.view_enabled = true;
    }

    var options = $.extend(options,{track: this});

    this.subtitle = new river.model.Subtitle(attributes['subtitle'], options);
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

    this.listenTo(this, "change", this.onChanged);
    this.listenTo(this, "add", this.onAdd);
    this.listenTo(this, "request", this.onRequest);
    Backbone.on("editorseek", this.unsetPauseOnTrackEnd.bind(this));
    Backbone.on("tracksuccess", this.onTrackSuccess.bind(this));
    Backbone.on("trackchange", this.onTrackChange.bind(this));

  },

  autoSetStartEndTime: function() {
    this.timeUpdateCallback = this.onTimeUpdate.bind(this);
    this.popcorn.on("timeupdate", this.timeUpdateCallback);
  },

  removeAutoSetStartEndTime: function() {
    if (typeof this.timeUpdateCallback !== "undefined") {
      this.popcorn.off("timeupdate", this.timeUpdateCallback);
    }
  },

  normalizeTime: function(time) {
    return river.utility.normalizeTime(time);
  },

  onTimeUpdate: function() {
    var time = Math.floor(this.popcorn.media.currentTime * 1000) / 1000;
    var endTime = this.normalizeTime(time + editor.DEFAULT_TRACK_DURATION);
    
    this.setStartTime(time);
    this.setEndTime(endTime);
  },

  prev: function() {
    var index = this.collection.indexOf(this);
    return this.collection.at(index - 1);
  },

  next: function() {
    var index = this.collection.indexOf(this);
    return this.collection.at(index + 1);
  },

  setPauseOnTrackEnd: function() {
    this.pauseOnTrackEnd = true;
  },

  unsetPauseOnTrackEnd: function() {
    this.pauseOnTrackEnd = false;
  },

  shouldPauseOnTrackEnd: function() {
    return this.pauseOnTrackEnd;
  },

  onChanged: function() {
    this.isDirty = true;
    Backbone.trigger("trackchange", this);
  },


  onTrackChange: function(track) {
    if (this.isRemoved()) return;

    // if changes in other track makes this track valid/invalid, show it as well
    if (this.isValid()) {
      this.showValid();
    } else {
      this.showInvalid();
    }
  },

  showInvalid: function() {
    _.each(this.views,function(view){
      view.showInvalid();
    });

    this.subtitle.view.showInvalid();
  },

  showValid: function() {
    _.each(this.views,function(view){
      view.showValid();
    });

    this.subtitle.view.showValid();
  },

  isValid: function() {
    return !this.overlapsTrack() && this.validDuration();
  },

  overlapsTrack: function(startTime, endTime) {
    startTime = startTime || this.startTime();
    endTime   = endTime   || this.endTime();

    return this.overlapsPrev(startTime) ||
           this.overlapsNext(startTime) ||
           this.overlapsPrev(endTime)   ||
           this.overlapsNext(endTime);   
  },

  validDuration: function(startTime, endTime) {
    startTime = startTime || this.startTime();
    endTime   = endTime   || this.endTime();

    return endTime - startTime > 0;
  },

  overlapsPrev: function(time) {
    if (typeof this.prev() === "undefined") return false;
    return time <= this.prev().endTime();
  },

  overlapsNext: function(time) {
    if (typeof this.next() === "undefined") return false;
    return time >= this.next().startTime();
  },

  onTrackSuccess: function() {
    this.isDirty = false;
  },

  onAdd: function() {
    this.save(true);

    if (this.collection.indexOf(this) === 0 && this.isGhost) {
      this.autoSetStartEndTime();
    }

    Backbone.trigger("trackadd", this);
  },

  removeGhost: function() {
    this.removeAutoSetStartEndTime();
    this.isGhost = false;

    _.each(this.views,function(view){
      view.removeGhost();
    });
  },

  updateSubtitleAttributes: function() {
    this.set("subtitle",_.clone(this.subtitle.attributes));
  },

  onRequest: function() {
    Backbone.trigger("trackrequest");
  },

  save: function(force) {
    if (force) {
      Backbone.trigger("editor.sync","save",this);
    } else {
      if (this.isGhost) return;
      if (this.hasChanged()) {
        Backbone.trigger("editor.sync","save",this);
      }
    }
  },

  hasChanged: function() {
    return Backbone.Model.prototype.hasChanged.call(this) || this.isDirty;
  },

  destroy: function() {
    Backbone.trigger("editor.sync","destroy",this);
  },

  openEditor: function() {
    this.expandedView.openEditor();
    this.highlight();
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
    Backbone.trigger("trackstartchange", this); 
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
    Backbone.trigger("trackendchange", this); 
  },

  text: function() {
    return this.subtitle.get("text");
  },

  // use to end a ghosttrack
  end: function(time) {
    if (!this.isGhost) {
      console.log("[WARN] ending a track that is no longer ghost.");
    }

    var duration = time - this.startTime();

    if (duration <= 0) {
      throw new Error("Track Duration of " + duration + " is invalid");
    }

    // isGhost must be set to false first before setting endTime so that by
    // the time ui/subtitle.js calls on 'changed' callback (render), it'll display endTime
    this.removeGhost();

    this.setEndTime(time);
    
    // another hack (for some reason setEndTime 
    // which is suppoed to call track#onChanged doesnt trigger trackchange)
    Backbone.trigger("trackchange", this); 

    // call ghosttarckend only after isGhost is set to false to allow proper saving on onGhostTrackEnd callback
    // since we prevent isGhost tracks from being saved
    // also, since we save after ghosttrack has ended, we need to make sure endTime has been set properly
    Backbone.trigger("ghosttrackend",this);


    this.save();
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
        Backbone.trigger("trackstart",self);
      },
      onEnd: function() {
        Backbone.trigger("trackend",self);
      }
    });

    var trackEventId = this.popcorn.getLastTrackEventId();

    return this.popcorn.getTrackEvent(trackEventId);
  },

  remove: function() {
    this.isDeleted = true;

    this.trackEvent._running = false; // disallow trackend event from getting triggered
    this.popcorn.removeTrackEvent(this.trackEvent._id);

    this.destroy();
    this.subtitle.remove();

    _.each(this.views,function(view){
      view.remove();
    });

    // we need to trigger ghosttrackend on remove so that ghosttrackstart can get triggered again
    Backbone.trigger("ghosttrackend",this);

    Backbone.trigger("trackremove",this);
  },

  highlight: function() {
    _.each(this.views,function(view){
      view.highlight();
    });

    this.subtitle.highlight();
  },

  unhighlight: function() {
    _.each(this.views,function(view){
      view.unhighlight();
    });

    this.subtitle.unhighlight();
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
  },

  comparator: function(track) {
    return track.startTime();
  }

});
