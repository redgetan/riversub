$.extend(river.controller,{
  "home#index": function() {
    var repo = $("#player").data("repo") ;
    $("#player").removeAttr("data-repo");
    player = new river.ui.MiniPlayer({
      repo: repo, 
      url_options: "&autoplay=1&loop=1&iv_load_policy=3",
      view_enabled: false,
    });
    
    player.setVolume(0);
  }
});

