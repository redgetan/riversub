$.extend(river.controller,{
  "repositories#new": function() {
    $("body").addClass("ricepaper");

    // $("#video_language_code").select2();
    // $("#repo_language_code").select2();
    // $(".editor_language_select").select2();

    $(".editor_language_select").on("change", function(){
      var url = $(".editor_language_select").find("option:selected").data("url");
      var videoLanguageCode = $("#video_language_code").find("option:selected").val();
      var repoLanguageCode = $("#repo_language_code").find("option:selected").val();
      var groupId = $("#group_id").find("option:selected").val();

      if (typeof videoLanguageCode !== "undefined") {
        url = url + "&video_language_code=" + videoLanguageCode;
      }

      if (typeof repoLanguageCode !== "undefined") {
        url = url + "&repo_language_code=" + repoLanguageCode;
      }

      window.location.href = url;
    });

  },
  "repositories#show": function() {
    repo = $("#river_player").data("repo") ;
    $("#river_player").removeAttr("data-repo");
    player = new river.ui.Player({repo: repo});
    player.play();

    river.model.SocialShare.populateShareCounts(repo.url);

    $(".forks_list_item").click(function(event){ 
      window.location.href = $(this).data("url");
    });

    $('.subtitle_selection_owner_avatar').tooltip();

    $(".comment a.downvoter").click(function() {
      river.model.Vote.downvoteComment(this);
    });

    $(".comment a.upvoter").click(function() {
      river.model.Vote.upvoteComment(this);
    });

    $(".repository a.repo_favorite_btn").click(function() {
      river.model.Vote.upvoteRepository(this);
    });

    $(".subtitle a.subtitle_favorite_btn").click(function() {
      river.model.Vote.upvoteSubtitle(this);
    });

    // $(".repository a.downvoter").click(function() {
    //   river.model.Vote.downvoteRepository(this);
    // });

    // $(".repository a.upvoter").click(function() {
    //   river.model.Vote.upvoteRepository(this);
    // });

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

  },
  "repositories#editor": function() {
    // add ?local=true to url to test locally w/o internet connection
    if (location.search.match("local=true")) {
      repo = $("#editor_container").data("repo") ;
      repo.video.duration = 360;
      repo.video.source_url = undefined;

      // repo = {
      //    video: { duration: 128, name: "Local"},
      //    user: null,
      //    token: "8k4FUFDjtWM",
      //    is_guided_walkthrough: false,
      //    repository_languages: []
      //  };

       var media = "<video id='media' width='250px' poster='/poster.png'>" +
               "<source id='mp4' src='/trailer.mp4' type=\"video/mp4\">" +
               "<p>Your user agent does not support the HTML5 Video element.</p>" +
             "</video>";

      editor = new river.ui.Editor({repo: repo, media: media, local: true, targetSelector: "video#media"});
    } else {
      repo = $("#editor_container").data("repo") ;
      $("#editor_container").removeAttr("data-repo");

      editor = new river.ui.Editor({repo: repo});
    }
  }
});
