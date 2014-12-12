$.extend(river.controller,{
  "videos#show": function() {
    repo = $("#river_player").data("repo") ;
    $("#river_player").removeAttr("data-repo");
    player = new river.ui.Player({repo: repo});
    player.play();

    $(".upvote_btn").on("click", function(event) {
      event.preventDefault();

      $.ajax({ 
        url: repo.upvote_url, 
        type: "POST", 
        dataType: "json", 
        success: function(data) {
          $(".vote_points_number").text(data.points);
          $(".upvote_btn").addClass("user_voted");
        },
        error: function(data) {
          if (data.status === 401) {
            alert("You must be logged in to upvote");
          }
        }
      });
    });

    $(".downvote_btn").on("click", function(event) {
      event.preventDefault();

      $.ajax({ 
        url: repo.downvote_url, 
        type: "POST", 
        dataType: "json", 
        success: function(data) {
          $(".vote_points_number").text(data.points);
          $(".downvote_btn").addClass("user_voted");
        },
        error: function(data) {
          if (data.status === 401) {
            alert("You must be logged in to downvote");
          }
        }
      });
    });

  },
  "videos#editor": function() {
    // add ?local=true to url to test locally w/o internet connection
    if (location.search.match("local=true")) {
      repo = {
         video: { duration: 128, name: "Local"},
         user: null,
         is_guided_walkthrough: false
       };

       var media = "<video id='media' width='250px' poster='/poster.png'>" +
               "<source id='mp4' src='/trailer.mp4' type=\"video/mp4; codecs='avc1, mp4a'\">" +
               "<p>Your user agent does not support the HTML5 Video element.</p>" +
             "</video>";

      editor = new river.ui.Editor({repo: repo, media: media, local: true, targetSelector: "video#media"});
    } else {
      repo = $("#editor_container").data("repo") ;

      if (repo.parent_repository_id) {
        editor = new river.ui.TemplateEditor({repo: repo});
      } else {
        editor = new river.ui.Editor({repo: repo});
      }
    }
  }
});

