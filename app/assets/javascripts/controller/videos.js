$.extend(river.controller,{
  "videos#show": function() {
    repo = $("#river_player").data("repo") ;
    $("#river_player").removeAttr("data-repo");
    player = new river.ui.Player({repo: repo});
  },
  "videos#editor": function() {
    // add ?local=true to url to test locally w/o internet connection
    if (location.search.match("local=true")) {
      repo = {
         video: { duration: 64, name: "Local"},
         user: null,
         is_guided_walkthrough: false
       };

       var media = "<video id='media' controls width='250px' poster='/poster.png'>" +
               "<source id='mp4' src='/trailer.mp4' type=\"video/mp4; codecs='avc1, mp4a'\">" +
               "<p>Your user agent does not support the HTML5 Video element.</p>" +
             "</video>";

      editor = new river.ui.Editor({repo: repo, media: media, local: true, targetSelector: "video#media"});
    } else {
      repo = $("#editor_data").data("repo") ;
      $("#editor_data").remove();
      editor = new river.ui.Editor({repo: repo});
    }

    if (repo.parent_repository_id) {
      $("#subtitle_tab_anchor a").tab("show");
    }
  }
});

