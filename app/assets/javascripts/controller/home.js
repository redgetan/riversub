$.extend(river.controller,{
  "home#index": function() {
    var repo = $("#river_player").data("repo") ;
    $("#river_player").removeAttr("data-repo");
    player = new river.ui.MiniPlayer({
      repo: repo, 
      url_options: "&autoplay=1&loop=1&iv_load_policy=3",
      view_enabled: false,
    });
    
    player.setVolume(0);
  }
});
