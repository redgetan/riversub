$.extend(river.controller,{
  "pages#show": function() {
    $(".page_available_videos").on("click", ".see_more_producer_uploads_btn", function(){
      event.preventDefault();

      var url = $(this).data("more-uploads-url");
      $(".see_more_producer_uploads_container").text("Loading...");

      $.ajax({
        url: url,
        type: "GET",
        dataType: "html",
        success: function(data,status) {
          $(".see_more_producer_uploads_container").last().replaceWith(data);
        },
        error: function(data) {
          $(".see_more_producer_uploads_container").text("something went wrong");
          throw(data.responseText);
        }.bind(this)
      });

    });
  }
});