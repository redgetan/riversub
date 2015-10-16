$.extend(river.controller,{
  "users#show": function() {
    river.utility.enableHashTab();
    river.model.Comment.bindCommentEvents();
  }
});
