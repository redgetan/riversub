river.model.Subtitle = Backbone.Model.extend({
  defaults: {
    text: ""
  },

  initialize: function(attributes, options) {
    this.options = options;
    
    this.track = options["track"];
    this.isOriginal = options['original'] || false;

    if (this.options.view_enabled && !this.isOriginal) {
      this.view = new river.ui.Subtitle({model: this});
    }

    this.listenTo(this, "change", this.onChanged);
  },

  onChanged: function() {
    this.track.updateSubtitleAttributes();

    Backbone.trigger("subtitlechange", this);
  },

  remove: function() {
    this.collection.remove(this);
    this.view.remove();
  },

  startTime: function() {
    return this.track.startTime();
  },

  endTime: function() {
    return this.track.endTime();
  },

  text: function() {
    return this.get("text");
  },

  score: function() {
    return this.get("score");
  },

  toJSON: function() {
    var json = Backbone.Model.prototype.toJSON.call(this);

    delete json["short_id"];
    delete json["score"];
    delete json["subtitle_item_class_for"];
    delete json["highlighted"];

    return json;
  },

  highlight: function() {
    if (!this.options.view_enabled || this.isOriginal) return;  

    if (typeof this.collection !== "undefined") {
      if (this.collection.currentTrackHighlight) {
        this.collection.currentTrackHighlight.unhighlight();
      }

      this.collection.currentTrackHighlight = this;
    }

    this.view.highlight();
    this.track.highlight();
  },

  overlapsPrev: function(time) {
    return this.track.overlapsPrev(time);
  },

  overlapsNext: function(time) {
    return this.track.overlapsNext(time);
  },

  unhighlight: function() {
    if (this.options.view_enabled && !this.isOriginal) {
      this.view.unhighlight();
    }
  },

  openEditor: function(options) {
    this.view.openEditor(options);
  },

  closeEditor: function(options) {
    this.view.closeEditor(options);
    this.track.unsetPauseOnTrackEnd();
  },

  prev: function() {
    var index = this.collection.indexOf(this);
    return this.collection.at(index - 1);
  },

  next: function() {
    var index = this.collection.indexOf(this);
    return this.collection.at(index + 1);
  },

  toString: function() {
    return "Subtitle(" + this.get("text") + ")";
  }

});

// needed to sort subtitles on collection which 
// will be used by view to render the subtitles in sorted order
river.model.SubtitleSet = Backbone.Collection.extend({
  model: river.model.Subtitle,

  initialize: function(attributes, options) {
    this.options = options;

    if (typeof this.options.view_enabled === "undefined" ) {
      this.options.view_enabled = true;
    }

    if (this.options.view_enabled) {
      this.view = new river.ui.SubtitleList({collection: this});
      this.listenTo(this,"change",this.sort);
    }
    Backbone.on("subtitlecreate",this.onSubtitleCreate.bind(this));
  },

  onSubtitleCreate: function(subtitle) {
    console.log("subtitle created.." + subtitle.toString());
    this.add(subtitle);
  },

  comparator: function(subtitle) {
    return subtitle.startTime();
  }

});
