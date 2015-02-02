$.extend(river.controller,{
  "videos#show": function() {
    video = $("#river_player").data("video") ;
    $("#river_player").removeAttr("data-video");
    player = new river.ui.Player({video: video});
    player.play();

    $(".forks_list_item").click(function(event){ 
      window.location.href = $(this).data("url");
    });

    $('.subtitle_selection_owner_avatar').tooltip();

  }
});

