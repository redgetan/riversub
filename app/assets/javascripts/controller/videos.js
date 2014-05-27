$.extend(river.controller,{
  "videos#show": function() {
    var repo = $("#river_player").data("repo") ;
    $("#river_player").removeAttr("data-repo");
    player = new river.ui.Player({repo: repo});
  },
  "videos#editor": function() {
    var repo = $("#editor_data").data("repo") ;
    $("#editor_data").remove();
    editor = new river.ui.Editor({repo: repo});
  }
});

