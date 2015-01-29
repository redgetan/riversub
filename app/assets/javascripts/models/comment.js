river.model.Comment = {
  postComment: function(form) {
    $.post($(form).attr("action"), $(form).serializeArray(), function(data) {
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
}

