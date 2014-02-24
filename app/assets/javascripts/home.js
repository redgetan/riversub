//(function() {

var popcorn;
var editor;
var player;
var metadata;

var getMetadata = function(url,done) {

  // get youtube video id
  // http://stackoverflow.com/questions/3452546/javascript-regex-how-to-get-youtube-video-id-from-url
  var videoId = url.split('v=')[1];

  if (typeof videoId === "undefined") {
    throw "Invalid youtube Url";
  }

  var ampersandPosition = videoId.indexOf('&');
  if(ampersandPosition != -1) {
    videoId = videoId.substring(0, ampersandPosition);
  }

  $.ajax({
    url: "https://gdata.youtube.com/feeds/api/videos/" + videoId + "?v=2&alt=jsonc",
    type: "GET",
    dataType: "jsonp",
    success: function(data) {
      done(data);
    },
    error: function(data) {
      done(JSON.parse(data.responseText));
    }
  });
};

var isEmbeddable = function(metadata) {
  if (Object.keys(metadata).length === 0) {
    return true; // assume embeddable if no youtube metadata
  }

  if (metadata["data"]["accessControl"]["embed"] === "allowed") {
    return true;
  } else {
    return false;
  }
};


$(document).ready(function(){

  var action = river.controller[river.route];
  if (typeof action !== "undefined") {
    action.call();  
  }

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

});


function handleOpenSubtitleEditorError(e,$form) {
  $form.find(".control-group").addClass("error");
  $form.find(".control-group").append("<span class='help-inline'>" + e + "</span>");
  setTimeout(function(){
    $form.find("span.help-inline").remove();
    $form.find(".control-group").removeClass("error");
  },2000);

  $("#ajax_loader").remove();
  $form.find(".sub_btn").button('reset');
}

function openSubtitleEditor(url) {

  if (!url.match(/youtube/)) {
    throw "Only youtube urls are allowed";
  }

  getMetadata(url,function(data){
    metadata  = data;

    if (typeof metadata["error"] !== "undefined") {
      var e = "Invalid youtube Url - " + metadata["error"]["message"];
      throw e;
    }

    if (!isEmbeddable(metadata)) {
      var e = "Video is not embeddable. Try another url.";
      throw e;
    }

    $.ajax({
      url: "/videos/sub",
      type: "POST",
      data: {
        media_url : url,
        video_metadata: metadata
      },
      dataType: "json",
      success: function(data,status) {
        window.location.href = data.redirect_url;
      },
      error: function(data) {
        var error_type = JSON.parse(data.responseText).error_type;
        if (data.status === 401) {
          // if error due to user not logged in, show login modal
          $("#login_modal").modal();
        } else {
          throw data.responseText;
        }
      }
    });
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
  ga('send','event', 'error', 'any', 'message', file + ":" + lineNumber + " - " + message);
};

//})();
