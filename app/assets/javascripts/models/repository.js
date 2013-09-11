river.model.Repository = Backbone.Model.extend({

  initialize: function(attributes, options) {
    this.tracks = new river.model.TrackSet();
    this.tracks.url = '/repositories/' + this.id + '/timings';
  },


});

river.model.RepositorySet = Backbone.Collection.extend({
  model: river.model.Repository,
  url: "/repositories",
});
