//(function() {

var popcorn;
var editor;
var metadata;

var getMetadata = function(url,done) {

  // get youtube video id
  // http://stackoverflow.com/questions/3452546/javascript-regex-how-to-get-youtube-video-id-from-url
  var videoId = url.split('v=')[1];
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
  if (new RegExp("/videos/\\w+/editor").test(location.pathname)) {
    var video = $("#editor").data("video");
    $("#editor").removeData("video");
    editor = new Editor(video);
  };
};


$(document).ready(function(){

  handleRoute();

  $("#sub_btn").on("click",function(event) {
    $("form#sub").trigger("submit");
  });

  $("form#sub").on("submit",function(event) {
    event.preventDefault();

    var url = $("input#media_url").val();
    // verify embeddable

    if (url.match(/youtube/)) {
      getMetadata(url,function(data){
        metadata  = data;

        if (typeof metadata["error"] !== "undefined") {
          $("form#sub .control-group").addClass("error");
          $("form#sub .control-group").append("<span class='help-inline'>Invalid Youtube Url - " + metadata["error"]["message"] + "</span>");
          setTimeout(function(){
            $("form#sub span.help-inline").remove();
            $("form#sub .control-group").removeClass("error");
          },2000);

          return;
        }

        if (isEmbeddable(metadata)) {
          $.ajax({
            url: "/videos/sub",
            type: "POST",
            data: {
              media_url : $("input#media_url").val(),
              video_metadata: metadata
            },
            dataType: "json",
            error: function(data) {
              alert(data.responseText);
            }
          });
        } else {
          $("form#sub .control-group").addClass("error");
          $("form#sub .control-group").append("<span class='help-inline'>Video is not embeddable. Try another url</span>");
          setTimeout(function(){
            $("form#sub span.help-inline").remove();
            $("form#sub .control-group").removeClass("error");
          },2000);
        }
      });
    } else {
      $("form#sub .control-group").addClass("error");
      $("form#sub .control-group").append("<span class='help-inline'>Only youtube urls are allowed</span>");
      setTimeout(function(){
        $("form#sub span.help-inline").remove();
        $("form#sub .control-group").removeClass("error");
      },2000);
    }


  });

});



//})();
