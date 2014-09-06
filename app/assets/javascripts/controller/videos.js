$.extend(river.controller,{
  "videos#show": function() {
    repo = $("#river_player").data("repo") ;
    $("#river_player").removeAttr("data-repo");
    player = new river.ui.Player({repo: repo});
  },
  "videos#editor": function() {
    repo = $("#editor_data").data("repo") ;
    $("#editor_data").remove();
    editor = new river.ui.Editor({repo: repo});

    if (repo.parent_repository_id) {
      $("#subtitle_tab_anchor a").tab("show");
    }
  }
});

