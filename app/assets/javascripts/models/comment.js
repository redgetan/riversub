river.model.Comment = {
  postComment: function(form) {
    $.post($(form).attr("action") + "?" + river.model.Comment.commentableTypeQueryParam(form) , $(form).serializeArray(), function(data) {
      if ($(form).find('#parent_comment_short_id').length) {
        $(form).closest('.comment').replaceWith($.parseHTML(data));
      } else {
        if ($(form).attr("id").match(/^edit_comment_.+$/) || data.match(/.*flash-error.*/)) {
          $(form).parent(".comment").replaceWith($.parseHTML(data));
        } else {
          $(form).closest('.comment').after($.parseHTML(data));
          $(form).find('textarea').val('');
        }
      }
    });
  },
  commentableTypeQueryParam: function(form) {
    return "commentable_type=" + $(form).data("commentable-type");
  },
  bindCommentEvents: function() {
    $(".comment a.downvoter").click(function() {
      river.model.Vote.downvoteComment(this);
    });

    $(".comment a.upvoter").click(function() {
      river.model.Vote.upvoteComment(this);
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
  }
}

