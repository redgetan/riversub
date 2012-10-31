var playSong = function(data) {
  console.log(data);
}

$(document).ready(function(){

  $("a.song").click(function(event) {
    event.preventDefault();

    $.ajax({
      url: "/play?song_id=" + this.id,
      dataType: "json",
      success: playSong
    });

  });

});


