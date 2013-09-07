var Subtitles = Backbone.Collection.extend({
  model: Subtitle,

  initialize: function(attributes, options) {
    this.view = new SubtitleListView({collection: this});
  }
});
