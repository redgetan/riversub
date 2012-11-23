//(function() {

  var popcorn;
  var editTimecodeMode;

  var loadMedia = function(url) {
    $("div#media").empty();
    popcorn = Popcorn.smart("#media",url);
  };

  var loadLyrics = function(text) {
    $("div#lyrics").empty();
    $("div#lyrics").append("<table></table>");

    var lines = text.split("\n");
    for (var i = 0, length = lines.length; i < length; i++) {
      var line = "<tr class='row'>" +
                   "<td>" +
                     "<pre class='line' id='" + i + "'>" + lines[i] + "</pre>" +
                   "</td>" +
                 "</tr>";
      $("div#lyrics table").append(line);
    }
  };

  var loadTimeslots = function() {
    $("div#lyrics .row").each(function(i) {
      $(this).append("<td><div class='time_slot' id='" + i + "'></div></td>");
    });

    $(".time_slot").hide();
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
            $lines.parent().find(".selected").removeClass("selected");
            $lines.eq(i).addClass("selected");
          }
        }(i)
      });
    }

  };

  var displayMediaSources = function(mediaSources) {
    $("div#media_sources").empty();
    var builder = "<ul>";
    $.each(mediaSources, function(i,e) {
      builder += "<li><a href='#'>" + e.url + "</a></li>";
    });
    builder += "</ul>";

    $("div#media_sources").append("<p>Media Sources</p>");
    $("div#media_sources").append(builder);
    $("div#media_sources").append("<input type='button' name='' value='Add Media Source' id='add_media_source_btn'/>");
    $("div#media_sources ul li").first().addClass("selected");

  };

  var displaySyncFiles = function(syncFiles) {
    $("div#sync_files").empty();

    var builder = "<ul>";
    $.each(syncFiles, function(i,e) {
      builder += "<li id='" + e.id + "' data-timecode=" + e.timecode + "><a href='#'>" + e.id + "</a></li>";
    });
    builder += "</ul>";
    $("div#sync_files").append("<p>Sync Files</p>");
    $("div#sync_files").append(builder);
    $("div#sync_files").append("<input type='button' name='' value='Add Sync File' id='add_sync_file_btn'/>");
    $("div#sync_files ul li").first().addClass("selected");
  };

  var displaySyncFileControls = function(method) {
    $(".time_slot").show();

    // set highlight to first line of lyrics
    $("div#lyrics .row .line.selected").removeClass("selected");
    $("div#lyrics .row .line").first().addClass("selected");

    var startSyncBtn = "<input type='button' name='' value='Start Sync Mode' id='start_sync_btn'/>";
    var pauseSyncBtn = "<input type='button' name='' value='Pause Sync Mode' id='pause_sync_btn' disabled='disabled'/>";
    if (method === "create") {
      var saveSyncBtn = "<input type='button' name='' value='Save SyncFile' id='create_sync_btn'/>";
    } else {
      var saveSyncBtn = "<input type='button' name='' value='Save SyncFile' id='update_sync_btn'/>";
    }
    $("div#create").append("<p id='edit_sync_file'>Once you Start Sync Mode, you can start pressing [Enter] to mark the 'End Time' of current line in lyrics as the media's current playback time</p>");
    $("div#create").append(startSyncBtn);
    $("div#create").append(pauseSyncBtn);
    $("div#create").append(saveSyncBtn);
  };

  var addTimecodeToTimeslots = function(timecode){
    timecode = timecode.split(",");
    $timeSlots = $("div#lyrics .row .time_slot");

    for (var i = 0, length = timecode.length; i < length; i++) {
      $timeSlots.eq(i).text(timecode[i]);
    }
  };

  var playSong = function(data) {
    console.log(data);

    $("div#create").empty();

    displayMediaSources(data.media_sources);
    displaySyncFiles(data.sync_files);
    loadLyrics(data.lyrics);
    loadTimeslots();

    $("div#media_sources ul li").first().trigger("click");

    if (data.sync_files.length !== 0) {
      $("div#lyrics").prepend("<input type='button' id='edit_timecode_btn' value='Edit Timecode'/>");
      $("div#lyrics").prepend("<input type='button' id='show_timecode_btn' value='Show/Hide Timecode'/>");
      var timecode = $("div#sync_files ul li.selected").data("timecode");
      addTimecodeToTimeslots(timecode);
      $("input#add_sync_file_btn").hide();
    }
  };

  var enableTimecodeEdit = function(event){
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

  var getCurrentTimecode = function() {
    return $("div#lyrics .row .time_slot")
             .filter(function(){ return $(this).text() !== "" })
             .map(   function(){ return $(this).text() })
             .get()
             .join(",");
  };

  $(document).ready(function(){

    $(document).on("click", "div#with_sync_files a.song", function(event) {
      editTimecodeMode = false;
    });

    $(document).on("click", "div#no_sync_files a.song", function(event) {
      editTimecodeMode = true;
    });

    $(document).on("click", "div#songs li", function(event) {
      event.preventDefault();

      $("div #songs").find(".selected").removeClass("selected");
      $(this).addClass("selected");

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
          var songLink = "<li id='" + data.song_id + "'><a href='#' class='song'>" + $("form#new_song #song_name").val() + "</a></li>";
          $("div#no_sync_files ul").prepend(songLink);
          $(this).remove();
        }.bind(this),
        error: function(data) {
          alert(data.responseText);
        }
      });

    });


    $(document).on("click", "input#start_sync_btn", function(event) {
      $(document).off("keyup",enableTimecodeEdit);
      $(document).on("keyup",enableTimecodeEdit);
      popcorn.play();
      $(this).attr("disabled","disabled");
      $("input#pause_sync_btn").removeAttr('disabled');
    });

    $(document).on("click", "input#pause_sync_btn", function(event) {
      $(document).off("keyup",enableTimecodeEdit);
      popcorn.pause();
      $(this).attr("disabled","disabled");
      $("input#start_sync_btn").removeAttr('disabled');
    });

    $(document).on("click", "input#create_sync_btn", function(event) {
      var timecode = getCurrentTimecode();
      var $song = $("div#songs li.selected");

      $.ajax({
        url: "/songs/" + $song.attr("id") + "/sync_files",
        type: "POST",
        data: { "timecode" : timecode },
        success: function(data) {
          var songLink = "<li id='" + $song.attr("id") + "'><a href='#' class='song'>" + $song.text() + "</a></li>";
          $("div#with_sync_files ul").append(songLink);
        },
        error: function(data) {
          alert(data.responseText);
        }
      });
    });

    $(document).on("click", "input#update_sync_btn", function(event) {
      var timecode = getCurrentTimecode();
      var $song = $("div#songs li.selected");
      var $syncFile = $("div#sync_files li.selected");

      $.ajax({
        url: "/songs/" + $song.attr("id") + "/sync_files/" + $syncFile.attr("id"),
        type: "PUT",
        data: { "timecode" : timecode },
        success: function(data) {
          $("div#sync_files li#" + data.id).data("timecode",data.timecode);
          addTimecodeToTimeslots(data.timecode);
          alert("Timecode updated");
        },
        error: function(data) {
          alert(data.responseText);
        }
      });
    });

    // Remove form when cancel is pressed
    $(document).on("click", "form input#cancel", function(event) {
      $(this).closest("form").remove();
    });

    // Allow you to go to previous line/time
    $(document).on("click", "div#lyrics .row", function(event) {
      var endTime = $(this).find(".time_slot").text();

      if (endTime !== "") {
        popcorn.currentTime(endTime);
      }
    });


    $(document).on("click", "input#add_media_source_btn", function(event) {
      $song = $("div#songs li.selected");

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

      $(this).parent().find(".selected").removeClass("selected");
      $(this).addClass("selected");

      var mediaUrl = $(this).text();

      if (editTimecodeMode === true) {
        loadMedia(mediaUrl);
      } else {
        loadMedia(mediaUrl);
        var timecode = $("div#sync_files li.selected").data("timecode");
        syncLyricsToMedia(timecode);
        popcorn.play();
      }
    });

    $(document).on("click", "input#add_sync_file_btn", function(event) {
      displaySyncFileControls("create");
    });

    $(document).on("click", "div#sync_files li", function(event) {
      event.preventDefault();
    });

    $(document).on("click", "input#show_timecode_btn", function(event) {
      $(".time_slot").toggle();
    });

    $(document).on("click", "input#edit_timecode_btn", function(event) {
      editTimecodeMode = true;

      $(this).val("Cancel Edit");
      $(this).addClass("cancel");

      displaySyncFileControls("update");

      popcorn.pause();
      popcorn.currentTime(0);
    });

    $(document).on("click", "input#edit_timecode_btn.cancel", function(event) {
      editTimecodeMode = false;
      $("input#pause_sync_btn").trigger("click");

      // reload the original timecode
      var timecode = $("div#sync_files ul li.selected").data("timecode");
      addTimecodeToTimeslots(timecode);

      $(this).val("Edit Timecode");
      $(this).removeClass("cancel");

      $(".time_slot").hide();
      $("div#lyrics .row .line.selected").removeClass("selected");
      $("div#create").empty();

      $("div#media_sources ul li.selected").trigger("click");
    });

  });

//})();
