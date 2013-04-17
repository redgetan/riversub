//(function() {

var popcorn;
var editor;

var editSong = function(song) {
  $("#main_container").empty();
  editor = new Editor(song);
}

$(document).ready(function(){

  $(document).on("click", "div#songs li", function(event) {
    event.preventDefault();

    $("div #songs").find(".selected").removeClass("selected");
    $(this).addClass("selected");

    $.ajax({
      url: "/songs/" + this.id,
      dataType: "json",
      success: editSong
    });
  });

  $(document).on("click", "input#add_song_btn", function(event) {

    $.ajax({
      url: "/songs/new",
      type: "GET",
      success: function(data) {
        $("div#songs #new").append(data);
      },
      error: function(data) {
        alert(data.responseText);
      }
    });

  });

  $(document).on("submit", "form#new_song", function(event) {
    event.preventDefault();

    $.ajax({
      url: "/songs",
      type: "POST",
      data: $(this).serialize(),
      dataType: "json",
      success: function(data) {
        var songLink = "<li id='" + data.song_id + "'><a href='#' class='song'>" + $("form#new_song #song_name").val() + "</a></li>";
        $("div#songs ul").append(songLink);
        $(this).remove();
      }.bind(this),
      error: function(data) {
        alert(data.responseText);
      }
    });

  });

  // Remove form when cancel is pressed
  $(document).on("click", "form input#cancel", function(event) {
    $(this).closest("form").remove();
  });


});



//})();
