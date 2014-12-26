$.extend(river.controller,{
  "videos#show": function() {
    repo = $("#river_player").data("repo") ;
    $("#river_player").removeAttr("data-repo");
    player = new river.ui.Player({repo: repo});
    player.play();

    $(".comment a.downvoter").click(function() {
      river.model.Vote.downvoteComment(this);
      return false;
    });

    $(".comment a.upvoter").click(function() {
      river.model.Vote.upvoteComment(this);
      return false;
    });


    $(document).on("click", "button.comment-post", function() {
      river.model.Comment.postComment($(this).parents("form").first());
    });

    $(document).on("click", "a.comment_replier", function() {
      var comment = $(this).closest(".comment");
      if ($("#reply_form_" + comment.attr("id")).length > 0)
        return false;

      var replies = comment.nextAll(".comments").first();
      $.get("/comments/" + comment.attr("data-shortid") + "/reply",
      function(data) {
        var reply = $($.parseHTML(data));
        reply.attr("id", "reply_form_" + comment.attr("id"));
        replies.prepend(reply);
        reply.find("textarea").focus();
      });

      return false;
    });

    $(document).on("click", "button.comment-cancel", function() {
      var comment = $(this).closest(".comment");
      var comment_id = comment.attr("data-shortid");
      if (comment_id != null && comment_id !== '') {
        $.get("/comments/" + comment_id, function(data) {
          comment.replaceWith($.parseHTML(data));
        });
      } else {
        comment.remove();
      }
    });


    $(document).on("click", "a.comment_editor", function() {
      var comment = $(this).closest(".comment");
      $.get("/comments/" + comment.attr("data-shortid") + "/edit",
      function(data) {
        comment.replaceWith($.parseHTML(data));
      });
    });

    $(document).on("click", "a.comment_deletor", function() {
      if (confirm("Are you sure you want to delete this comment?")) {
        var li = $(this).closest(".comment");
        $.post("/comments/" + $(li).attr("data-shortid") + "/delete",
        function(d) {
          $(li).replaceWith(d);
        });
      }
    });

    $(document).on("click", "a.comment_undeletor", function() {
      if (confirm("Are you sure you want to undelete this comment?")) {
        var li = $(this).closest(".comment");
        $.post("/comments/" + $(li).attr("data-shortid") + "/undelete",
        function(d) {
          $(li).replaceWith(d);
        });
      }
    });


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

