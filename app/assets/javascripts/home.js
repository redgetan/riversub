(function() {

  var popcorn;

  var loadMedia = function(url) {
    popcorn = Popcorn.smart("#media",url);
  };

  var loadLyrics = function(text) {

    var lines = text.split("\n");

    $("div#lyrics").append("<table></table>");

    for (var i = 0, length = lines.length; i < length; i++) {
      var line = "<tr class='row'>" +
                   "<td>" +
                     "<pre class='line' id='" + i + "'>" + lines[i] + "</pre>" +
                   "</td>" +
                 "</tr>";
      $("div#lyrics table").append(line);
    }
  };

  var syncLyricsToMedia = function(timecode) {

    timecode = timecode.split(",");
    var $lines = $("div#lyrics .row .line");

    for (var i = 0, length = timecode.length; i < length; i++) {
      popcorn.code({
        start: timecode[i],
        end:   timecode[i + 1],
        onStart: function(i) {
          return function(options) {
            console.log("line: " + i + "  start: " + options.start + "   " + $lines.eq(i).text());
            $lines.eq(i).addClass("selected");
          }
        }(i),
        onEnd: function(i) {
          return function(options) {
            $lines.eq(i).removeClass("selected");
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

    $("div#notice").empty();
    $("div#media").empty();
    loadMedia(mediaUrl);
    $("div#lyrics").empty();
    loadLyrics(lyrics);

    if (syncFile) {
      syncLyricsToMedia(syncFile.timecode);
      popcorn.play();
    } else {
      $("div#notice").text("Once you Start Sync Mode, you can start pressing [Enter] to mark the 'End Time' of current line in lyrics as the media's current playback time");
      addTimeSlotsToLyrics();

      // add highlight to first line of lyrics
      $("div#lyrics .row .line").first().addClass("selected");

      var startSyncBtn = "<input type='button' name='' value='Start Sync Mode' id='start_sync_btn'/>";
      var pauseSyncBtn = "<input type='button' name='' value='Pause Sync Mode' id='pause_sync_btn' disabled='disabled'/>";
      var saveSyncBtn = "<input type='button' name='' value='Save SyncFile' id='save_sync_btn'/>";
      $("div#notice").append(startSyncBtn);
      $("div#notice").append(pauseSyncBtn);
      $("div#notice").append(saveSyncBtn);
    }
  };

  var lyricsMediaSync = function(event){
    var ENTER_KEY = 13;

    $timeSlots = $("div#lyrics .row .time_slot");
    $lines = $("div#lyrics .row .line");

    if (event.which === ENTER_KEY) {
      var index = parseInt($lines.parent().find(".selected").attr("id"));
      var currentTime = popcorn.currentTime().toFixed(1);

      $timeSlots.eq(index).text(currentTime);
      $lines.eq(index).removeClass("selected");
      $lines.eq(index + 1).addClass("selected");
    }
  };

  var addTimeSlotsToLyrics = function(text) {
    $("div#lyrics .row").each(function(i) {
      $(this).append("<td><div class='time_slot' id='" + i + "'></div></td>");
    });
  }

  $(document).ready(function(){

    $(document).on("click", "a.song", function(event) {
      event.preventDefault();

      $("div#songs li.selected").removeClass("selected");
      $(this).parent().addClass("selected");

      $.ajax({
        url: "/songs/play",
        data: { "id": this.id },
        dataType: "json",
        success: playSong
      });
    });

    $(document).on("click", "input#new_song_btn", function(event) {

      $.ajax({
        url: "/songs/new",
        type: "GET",
        success: function(data) {
          $("div#new_song").append(data);
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
          var songLink = "<li><a href='#' class='song' id=" + data.song_id + ">" + $("form#new_song #song_name").val() + "</a></li>";
          $("div#no_sync_files ul").prepend(songLink);
          $(this).remove();
        }.bind(this),
        error: function(data) {
          alert(data.responseText);
        }
      });

    });


    $(document).on("click", "input#start_sync_btn", function(event) {
      $(document).on("keyup",lyricsMediaSync);
      popcorn.play();
      $(this).attr("disabled","disabled");
      $("input#pause_sync_btn").removeAttr('disabled');
    });

    $(document).on("click", "input#pause_sync_btn", function(event) {
      $(document).off("keyup",lyricsMediaSync);
      popcorn.pause();
      $(this).attr("disabled","disabled");
      $("input#start_sync_btn").removeAttr('disabled');
    });

    // saves sync file to associated song
    $(document).on("click", "input#save_sync_btn", function(event) {
      $(document).off("keyup",lyricsMediaSync);
      $(this).attr("disabled","disabled");
      $("input#start_sync_btn").removeAttr('disabled');
      var timecode = $("div#lyrics .row .time_slot")
                       .filter(function(){ return $(this).text() !== "" })
                       .map(   function(){ return $(this).text() })
                       .get()
                       .join(",");

      var $song = $("div#songs li.selected a");

      $.ajax({
        url: "/songs/" + $song.attr("id") + "/sync_files",
        type: "POST",
        data: { "timecode" : timecode },
        success: function(data) {
          var songLink = "<li><a href='#' class='song' id=" + $song.attr("id") + ">" + $song.text() + "</a></li>";
          $("div#with_sync_files ul").append(songLink);
        },
        error: function(data) {
          alert(data.responseText);
        }
      });

    });

    $(document).on("click", "form#new_song input#cancel", function(event) {
      $("form#new_song").remove();
    });

    // Allow you to change the endTime of previous lines
    $(document).on("click", "div#lyrics .row", function(event) {
      var endTime = $(this).find(".time_slot").text();

      if (endTime !== "") {
        // remove prev highlighted line
        var $lines = $("div#lyrics .row .line");
        var index = parseInt($lines.parent().find(".selected").attr("id"));
        $lines.eq(index).removeClass("selected");

        // add highlight to current line
        $(this).find(".line").addClass("selected");

        // set media currentTime to prev end time
        var prevEndTime = $(this).prev().find(".time_slot").text();
        popcorn.currentTime(prevEndTime);
      }
    });

  });

})();
