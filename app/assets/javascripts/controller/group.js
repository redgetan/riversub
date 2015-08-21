$.extend(river.controller,{
  "groups#edit": function() {

    $("form.edit_group input#group_avatar").on("change",function(event){
      // http://stackoverflow.com/questions/166221/how-can-i-upload-files-asynchronously-with-jquery
      var $form = $("form.edit_group");
      var groupId = $form.data("group-id");
      var formData = new FormData($form[0]);

      $.ajax({
        url: '/groups/' + groupId + '/change_avatar',
        type: 'PUT',
        data: formData,
        beforeSend: function() {

        },
        success: function(data) {
          var avatarUrl = data;
          $("div#avatar img").attr("src",avatarUrl);
        },
        error: function(data) {
          $form.find(".flash").remove();
          $form.prepend(data.responseText);
        },
        //Options to tell JQuery not to process data or worry about content-type
        cache: false,
        contentType: false,
        processData: false
      });
    });
  },
  "groups#show": function() {
    river.model.Comment.bindCommentEvents();
    river.utility.enableHashTab();
  }

});
