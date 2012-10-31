(function() {

  var popcorn;

  var loadMedia = function(url) {
    $("div#media").empty();
    $("div#notice").empty();
    popcorn = Popcorn.youtube("#media",url);
  };

  var loadLyrics = function(text) {
    $("div#lyrics").empty();

    var lines = text.split("\n");

    for (var i = 0, length = lines.length; i < length; i++) {
      var line = "<div class='line' id='" + i + "'" + ">" +
                   "<pre>" + lines[i] + "</pre>" +
                 "</div>";
      $("div#lyrics").append(line);
    }
  };

  var syncLyricsToMedia = function(timecode) {

    timecode = timecode.split(",");
    var $lines = $("div#lyrics .line");

    for (var i = 1, length = timecode.length; i < length; i++) {
      popcorn.code({
        start: timecode[i],
        end:   timecode[i + 1],
        onStart: function(i) {
          return function(options) {
            console.log("line: " + i + "  start: " + options.start + "   " + $lines.eq(i).text());
            $lines.eq(i).css("background-color","yellow");
          }
        }(i),
        onEnd: function(i) {
          return function(options) {
            $lines.eq(i).css("background-color","");
          }
        }(i),
      });
    }
  };

  var playSong = function(data) {
    console.log(data);

    var mediaUrl = data.media_sources[0].url;
    var lyrics   = data.lyrics;
    var syncFile = data.sync_files[0];

    loadMedia(mediaUrl);
    loadLyrics(lyrics);

    if (syncFile == null) {
      $("div#notice").text("This song does not have any synchorized lyrics file yet. Why not create one?");
    } else {
      syncLyricsToMedia(syncFile.timecode);
    }

    popcorn.play();
  };

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

})();
