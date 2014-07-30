river.model.Subtitle = Backbone.Model.extend({
  defaults: {
    text: ""
  },

  initialize: function(attributes, options) {
    this.options = options;
    
    this.track = options["track"];
    if (this.options.view_enabled) {
      this.view = new river.ui.Subtitle({model: this});
    }

    this.listenTo(this, "change", this.onChanged);
  },

  onChanged: function() {

  },

  startTime: function() {
    return this.track.startTime();
  },

  endTime: function() {
    return this.track.endTime();
  },

  highlight: function() {
    if (this.options.view_enabled) {
      this.view.highlight();
    }
  },

  unhighlight: function() {
    if (this.options.view_enabled) {
      this.view.unhighlight();
    }
  },

  openEditor: function(event, $el) {
    this.view.openEditor(event, $el);
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
    this.add(subtitle);
  },

  comparator: function(subtitle) {
    return subtitle.startTime();
  }

});
