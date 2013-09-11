river.model.Subtitle = Backbone.Model.extend({
  defaults: {
    text: ""
  },

  initialize: function(attributes, options) {
    this.track = options["track"];
    this.view = new river.ui.Subtitle({model: this});
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
    this.view.highlight();
  },

  unhighlight: function() {
    this.view.unhighlight();
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
    this.view = new river.ui.SubtitleList({collection: this});
    Backbone.on("subtitlecreate",this.onSubtitleCreate.bind(this));
    this.listenTo(this,"change",this.sort);
  },

  onSubtitleCreate: function(subtitle) {
    this.add(subtitle);
  },

  comparator: function(subtitle) {
    return subtitle.startTime();
  }

});
