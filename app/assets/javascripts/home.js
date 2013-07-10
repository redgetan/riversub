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
    dataType: "json",
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

// handles page specific javascript
var handleRoute = function() {
  if (new RegExp("/videos/.+/editor").test(location.pathname)) {
    var repo = $("#editor_data").data("repo") ;
    $("#editor_data").remove();
    editor = new Editor(repo);

    var has_seen_instructions = getCookie("has_seen_instructions");
    if (!has_seen_instructions) {
      setTimeout(editor.guideUser.bind(editor),2000);
    }

    $('#instructions_modal').on('hidden', function () {
      setCookie("has_seen_instructions","yes",365);
    })

  } else if (new RegExp("/videos/.+").test(location.pathname)) {
    var repo = $("#player").data("repo") ;
    $("#player").removeAttr("data-repo");
    player = new Player(repo);
  } else if (new RegExp("/users/edit").test(location.pathname)) {
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
};


$(document).ready(function(){

  handleRoute();

  $("#sub_btn").on("click",function(event) {
    $("form#sub").trigger("submit");
  });

  $("form#sub").on("submit",function(event) {
    event.preventDefault();

    var url = $("input#media_url").val();

    try {
      openSubtitleEditor(url);
    } catch(e) {
      handleOpenSubtitleEditorError(e);
      throw e;
    }

  });

});

function handleOpenSubtitleEditorError(e) {
  $("form#sub .control-group").addClass("error");
  $("form#sub .control-group").append("<span class='help-inline'>" + e + "</span>");
  setTimeout(function(){
    $("form#sub span.help-inline").remove();
    $("form#sub .control-group").removeClass("error");
  },2000);

  $("#ajax_loader").remove();
  $("#sub_btn").button('reset');
}

function openSubtitleEditor(url) {

  if (!url.match(/youtube/)) {
    throw "Only youtube urls are allowed";
  }

  $("form#sub").append("<img id='ajax_loader' src='/assets/ajax-loader.gif' >");
  $("#sub_btn").button('loading');

  getMetadata(url,function(data){
    metadata  = data;

    if (typeof metadata["error"] !== "undefined") {
      var e = "Invalid youtube Url - " + metadata["error"]["message"];
      handleOpenSubtitleEditorError(e);
      throw e;
    }

    if (!isEmbeddable(metadata)) {
      var e = "Video is not embeddable. Try another url.";
      handleOpenSubtitleEditorError(e);
      throw e;
    }

    $.ajax({
      url: "/videos/sub",
      type: "POST",
      data: {
        media_url : $("input#media_url").val(),
        video_metadata: metadata
      },
      dataType: "json",
      success: function(data,status) {
        window.location.href = data.redirect_url;
      },
      error: function(data) {
        throw "Failed to subtitle video."; 
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
