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
  },

  getAttributes: function() {
    return {
      id:   this.id,
      text: this.text
    }
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

  openEditor: function(event) {
    this.view.openEditor(event);
  },

  hideEditorIfNeeded: function() {
    this.view.hideEditorIfNeeded();
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
