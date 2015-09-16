//(function() {

var popcorn;
var editor;
var repo;
var player;
var metadata;


$(document).ready(function(){

  $('[data-toggle="tooltip"]').tooltip();

  var action = river.controller[river.route];
  if (typeof action !== "undefined") {
    action.call();
  }

  $("#layout_new_project_btn").hover(
    function(){
      $(this).addClass("btn-info");
    },function(){
      $(this).removeClass("btn-info");
    }
  );

  $(".new_project_user_btn").hover(function(event) {
    $(this).find("i").css("background-color","green");
    $(this).find("h6").css("color","green");
  },function(event){
    $(this).find("i").css("background-color","lightgray");
    $(this).find("h6").css("color","gray");
  });

  $(".share_repo_btn").on("click",function(event) {
    event.preventDefault();

    $(".share_container").toggle();
    var $icon = $(this).find("i");

    if ($icon.hasClass("glyphicon-chevron-down")) {
      $icon.removeClass("glyphicon-chevron-down");
      $icon.addClass("glyphicon-chevron-up");
    } else {
      $icon.removeClass("glyphicon-chevron-up");
      $icon.addClass("glyphicon-chevron-down");
    }
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

    var url = $(this).find(".source_url").val();

    $(this).find(".sub_btn").button('loading');
    var options = { 
      group_id: $(this).find("[name='group_id']").val(),
      hide_group: $(this).find("[name='hide_group']").val(),
      request_id: $(this).find("[name='request_id']").val()
    };

    try {
      subtitleVideo(url, options);
    } catch(e) {
      handleSubtitleVideoError(e,$(this));
      throw e;
    }
  });
  

  $("form.add_release_item").on("submit",function(event) {
    event.preventDefault();

    var url = $(this).find(".source_url").val();
    var options = { 
      release_id: $(this).data("release-id"),
      video_language_code: $(this).find("[name='video_language_code']").val(),
      repo_language_code: $(this).find("[name='repo_language_code']").val(),
    };

    $(this).find(".sub_btn").button('loading');

    try {
      addReleaseItem(url, options);
    } catch(e) {
      handleSubtitleVideoError(e,$(this));
      throw e;
    }
  });


  $(".page_new_sub_btn").click(function (event) {
    var url = $(this).data("source-url");
    var options = {
      page_id: $(".page_id_container").text(),
      hide_group: true
    }

    subtitleVideo(url, options);
  });
 

});

function subtitleVideo(url, options) {

  if (!url.match(/youtu\.?be/)) {
    throw "Only youtube urls are allowed";
  }

  var data = {source_url: url};
  if (typeof options.group_id !== "undefined")   data["group_id"]   = options.group_id;  
  if (typeof options.hide_group !== "undefined") data["hide_group"] = options.hide_group;  
  if (typeof options.request_id !== "undefined") data["request_id"] = options.request_id;  
  if (typeof options.page_id !== "undefined")    data["page_id"]    = options.page_id;  

  $.ajax({
    url: "/videos/sub",
    type: "POST",
    data: data,
    dataType: "json",
    success: function(data,status) {
      var redirectUrl = data.redirect_url;
      window.location.href = redirectUrl;
    },
    error: function(data) {
      try {
        var error = JSON.parse(data.responseText).error;
        this.handleSubtitleVideoError(error);
      } catch (e) {
        this.handleSubtitleVideoError("something went weird wrong");
        throw e;
      }
    }.bind(this)
  });
}

function handleSubtitleVideoError(e,$form) {
  $subtitle_video_container = $form ? $form.find(".subtitle_video_container") : $(".subtitle_video_container");
  $subtitle_video_container.addClass("error");
  $subtitle_video_container.append("<span class='help-inline'>" + e + "</span>");
  setTimeout(function(){
    $subtitle_video_container.find("span.help-inline").remove();
    $subtitle_video_container.removeClass("error");
  },2000);

  $("#ajax_loader").remove();
  $subtitle_video_container.find(".sub_btn").button('reset');
}

function addRequest(url, options) {

}


function addReleaseItem(url, options) {

  if (!url.match(/youtu\.?be/)) {
    throw "Only youtube urls are allowed";
  }

  $.ajax({
    url: "/releases/" + options.release_id + "/release_items",
    type: "POST",
    data: {
      source_url : url,
      video_metadata: metadata,
      video_language_code: options.video_language_code,
      repo_language_code: options.repo_language_code
    },
    dataType: "json",
    success: function(data,status) {
      var redirectUrl = data.redirect_url;
      window.location.href = redirectUrl;
    },
    error: function(data,x,y) {
      try {
        var error = JSON.parse(data.responseText).error;
        this.handleSubtitleVideoError(error);
      } catch (e) {
        this.handleSubtitleVideoError("something went wrong");
        throw e;
      }
    }.bind(this)
  });
}

function setCookie(c_name,value,exdays)
{
  var exdate=new Date();
  exdate.setDate(exdate.getDate() + exdays);
  var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
  document.cookie=c_name + "=" + c_value;
}

function getCookie(c_name)
{
  var c_value = document.cookie;
  var c_start = c_value.indexOf(" " + c_name + "=");
  if (c_start == -1) {
    c_start = c_value.indexOf(c_name + "=");
  }
  if (c_start == -1) {
    c_value = null;
  } else {
    c_start = c_value.indexOf("=", c_start) + 1;
    var c_end = c_value.indexOf(";", c_start);
    if (c_end == -1) {
      c_end = c_value.length;
    }
    c_value = unescape(c_value.substring(c_start,c_end));
  }
  return c_value;
}

window.onerror = function(message, file, lineNumber) {
  if (typeof ga !== "undefined") {
    ga('send','event', 'error', 'any', 'message', file + ":" + lineNumber + " - " + message);
  }
};

//})();
