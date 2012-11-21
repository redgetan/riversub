(function() {

  var popcorn;
  var createSyncMode;

  var loadMedia = function(url) {
    $("div#media").empty();
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

    // remove any previously highlighted lines
    $lines.filter(".selected").each(function(){
      $(this).removeClass("selected");
    });

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

    var lyrics   = data.lyrics;
    var syncFile = data.sync_files[0];

    var builder;

    $("div#create").empty();
    $("div#media_sources").empty();
    $("div#sync_files").empty();

    // build list of media sources
    builder = "<ul>";
    $.each(data.media_sources, function(i,e) {
      builder += "<li id='media_source'><a href='#'>" + e.url + "</a></li>";
    });
    builder += "</ul>";

    $("div#media_sources").append("<p>Media Sources</p>");
    $("div#media_sources").append(builder);
    $("div#media_sources").append("<input type='button' name='' value='Add Media Source' id='add_media_source_btn'/>");
    $("div#media_sources ul li").first().addClass("selected");


    // build list of sync files
    var builder = "<ul>";
    $.each(data.sync_files, function(i,e) {
      builder += "<li id='sync_file' data-timecode=" + e.timecode + "><a href='#'>" + e.id + "</a></li>";
    });
    builder += "</ul>";
    $("div#sync_files").append("<p>Sync Files</p>");
    $("div#sync_files").append(builder);
    $("div#sync_files").append("<input type='button' name='' value='Add Sync File' id='add_sync_file_btn'/>");
    $("div#sync_files ul li").first().addClass("selected");


    $("div#lyrics").empty();
    loadLyrics(lyrics);

    $("div#media_sources ul li").first().trigger("click");

    if (typeof syncFile === "undefined") {
      addTimeSlotsToLyrics();

      // add highlight to first line of lyrics
      $("div#lyrics .row .line").first().addClass("selected");


      var startSyncBtn = "<input type='button' name='' value='Start Sync Mode' id='start_sync_btn'/>";
      var pauseSyncBtn = "<input type='button' name='' value='Pause Sync Mode' id='pause_sync_btn' disabled='disabled'/>";
      var saveSyncBtn = "<input type='button' name='' value='Save SyncFile' id='save_sync_btn'/>";
      $("div#create").append("<p>Once you Start Sync Mode, you can start pressing [Enter] to mark the 'End Time' of current line in lyrics as the media's current playback time</p>");
      $("div#create").append(startSyncBtn);
      $("div#create").append(pauseSyncBtn);
      $("div#create").append(saveSyncBtn);
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

    $(document).on("click", "div#with_sync_files a.song", function(event) {
      createSyncMode = false;
    });

    $(document).on("click", "div#no_sync_files a.song", function(event) {
      createSyncMode = true;
    });

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

    $(document).on("click", "form input#cancel", function(event) {
      $(this).closest("form").remove();
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


    $(document).on("click", "input#add_media_source_btn", function(event) {
      $song = $("div#songs li.selected a");

      $.ajax({
        url: "/songs/" + $song.attr("id") + "/media_sources/new",
        type: "GET",
        success: function(data) {
          $("div#create").append(data);
        },
        error: function(data) {
          alert(data.responseText);
        }
      });
    });

    $(document).on("submit", "form#new_media_source", function(event) {
      event.preventDefault();

      $.ajax({
        url: $(this).attr("action"),
        type: "POST",
        data: $(this).serialize(),
        dataType: "json",
        success: function(data) {
          var mediaSourceLink = "<li id='media_source'><a href='#'>" + data.media_source_url + "</a></li>";
          $("div#media_sources ul").append(mediaSourceLink);
          $(this).remove();
        }.bind(this),
        error: function(data) {
          alert(data.responseText);
        }
      });
    });

    $(document).on("click", "div#media_sources li", function(event) {
      event.preventDefault();

      var mediaUrl = $(this).text();

      if (createSyncMode === true) {
        loadMedia(mediaUrl);
      } else {
        loadMedia(mediaUrl);
        var timecode = $("div#sync_files li.selected").data("timecode");
        syncLyricsToMedia(timecode);
        popcorn.play();
      }
    });

    $(document).on("click", "div#sync_files li", function(event) {
      event.preventDefault();
    });

    $(document).on("click", "input#add_media_source_btn", function(event) {

    });

  });

})();
