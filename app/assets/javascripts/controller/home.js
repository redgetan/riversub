$.extend(river.controller,{
  "home#index": function() {
    var repo = $("#river_player").data("repo") ;
    $("#river_player").removeAttr("data-repo");
    player = new river.ui.MiniPlayer({
      repo: repo, 
      url_options: "&iv_load_policy=3",
      view_enabled: false
    });
  }
});

