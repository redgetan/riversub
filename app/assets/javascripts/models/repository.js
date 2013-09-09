var Repository = Backbone.Model.extend({

  initialize: function(attributes, options) {
    this.listenTo(this, "change", this.touchSubtitle);

    this.tracks = new TrackSet();
    this.tracks.url = '/repositories/' + this.id + '/timings';

  },


});

var RepositorySet = Backbone.Collection.extend({
  model: Repository,
  url: "/repositories",

  initialize: function(attributes, options) {

  },

});
