$.extend(river.controller,{
  "registrations#edit": function() {
    // hide all forms initially
    $("div#edit_user_content form").each(function(){
      $(this).hide();
    });

    $("#edit_user_content form").on("submit", function(event) {
      event.preventDefault();

      var $form = $(event.target);

      $.ajax({
        url: "/users",
        type: "PUT",
        data: $(this).serialize(),
        success: function(data,status) {
          $form.find(".flash").remove();
          $form.prepend(data);
        },
        error: function(data) {
          $form.find(".flash").remove();
          $form.prepend(data.responseText);
        }
      });
    });

    $("#edit_user_sidebar a").on("click",function(event){
      var $target = $(event.target);
      $target.closest("ul").find(".active").removeClass("active");
      $target.closest("li").addClass("active");

      // hide previous active form
      var $prevActiveForm = $("div#edit_user_content form.active");
      if ($prevActiveForm) {
        $prevActiveForm.removeClass("active");
        $prevActiveForm.hide();
      }

      // determine which form to show
      var profile_type = $target.attr("id");

      // show form
      var $form = $("form#edit_" + profile_type);
      $form.show();
      $form.addClass("active");
    });

    $("form#edit_account input#user_avatar").on("change",function(event){
      // http://stackoverflow.com/questions/166221/how-can-i-upload-files-asynchronously-with-jquery

      var $form = $("form#edit_account");
      var formData = new FormData($form[0]);

      $.ajax({
        url: '/users/change_avatar',
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


    // by default account tab is active

    var activeTab;
    if (window.location.hash) {
      activeTab = window.location.hash;
    } else {
      activeTab = "#account";
    }
    $("#edit_user_sidebar a" + activeTab).trigger("click");
    
  }
});

