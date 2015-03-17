$.extend(river.controller,{
  "releases#show": function() {
    var release = $(".release_show_container").data("release") ;
    river.model.SocialShare.populateShareCounts(release.url);
  }
});
