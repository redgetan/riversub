  $("#layout_new_project_btn").tooltip({title: "Subtitle Video", placement: "bottom"});

  $(".new_project").hover(function(event) {
    $(this).find("i").css("background-color","green");
    $(this).find("h6").css("color","green");
  },function(event){
    $(this).find("i").css("background-color","lightgray");
    $(this).find("h6").css("color","gray");
  });

  $(".share_btn").on("click",function(event) {
    event.preventDefault();
  });

  $('#share_modal').on('shown', function () {
    $(this).find("input").select();
  })

  $(".sub_btn").on("click",function(event) {
    event.preventDefault();
    $(this).closest("form").trigger("submit");
  });

  $("form.sub").on("submit",function(event) {
    event.preventDefault();

    var url = $(this).find(".media_url").val();

    $(this).find(".sub_btn").button('loading');

    try {
      openSubtitleEditor(url);
    } catch(e) {
      handleOpenSubtitleEditorError(e,$(this));
      throw e;
    }

  });

  $(".new_repo_btn").on("click",function(event) {
    event.preventDefault();
    var url = player.repo.video.url;
    openSubtitleEditor(url);
  });

