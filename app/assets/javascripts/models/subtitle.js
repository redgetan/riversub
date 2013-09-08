var Subtitle = Backbone.Model.extend({
  defaults: {
    text: ""
  },

  initialize: function(attributes, options) {
    this.track = options["track"];
    this.view = new SubtitleView({model: this});
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

  setTrack: function(track) {
    Backbone.trigger("subtitletrackmapped",this);
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
  }

});

var Subtitles = Backbone.Collection.extend({
  model: Subtitle,

  initialize: function(attributes, options) {
    this.view = new SubtitleListView({collection: this});
  }
});
