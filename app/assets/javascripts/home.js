//(function() {

  var popcorn;
  var editTimecodeMode;
  var showPositionInterval;

  var loadMedia = function(url) {
    $("div#media").empty();
    popcorn = Popcorn.smart("#media",url);
  };

  var loadLyrics = function(text) {
    $("div#lyrics").empty();
    $("div#lyrics").append("<table></table>");

    var lines = text.split("\n");
    for (var i = 0, length = lines.length; i < length; i++) {
      var line = "<tr class='row' id='" +  i + "'>" +
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
            $lines.parent().find(".selected").removeClass("selected");
            $lines.eq(i).addClass("selected");
          }
        }(i)
      });

      popcorn.subtitle({
        start: timecode[i],
        end:   timecode[i + 1],
        text: $lines.eq(i).text(),
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

  var displaySyncFileControls = function() {
    $(".timespan").show();

    var startSyncBtn = "<input type='button' name='' value='Start Sync Mode' id='start_sync_btn'/>";
    var pauseSyncBtn = "<input type='button' name='' value='Pause Sync Mode' id='pause_sync_btn' disabled='disabled'/>";
    var saveSyncBtn = "<input type='button' name='' value='Save SyncFile' id='update_sync_btn'/>";
    $("div#create").append("<p id='edit_sync_file'>Once you Start Sync Mode, you can start pressing [Enter] to mark the 'End Time' of current line in lyrics as the media's current playback time</p>");
    $("div#create").append(startSyncBtn);
    $("div#create").append(pauseSyncBtn);
    $("div#create").append(saveSyncBtn);
  };

  /**
   *  Timespan has 3 componenets
   *    div#timespan i
   *      div#start_time
   *      div#waveform
   *      div#end_time
   *
   *  This method fills up those values using just timecode
   *        0 [   ] 2
   *      2 [     ] 6
   *    6 [       ] 11
   *
   *  Algo:
   *    for i in timecode array
   *      startTime = timecode[i]
   *      endTime = timecode[i + 1]
   *      waveform = endTime - startTime pixels
   *
   *
   **/
  var loadTimespan = function(timecode){
    // create divs if they don't exist
    if ($("div#lyrics .timespan").length === 0) {
      $("div#lyrics .row").each(function(i) {
        var content = "<td>" +
                    "<div class='timespan' id='" + i + "'>" +
                      "<div class='start_time' id='" + i + "'></div>" +
                      "<div class='waveform' id='" + i + "'></div>" +
                      "<div class='end_time' id='" + i + "'></div>" +
                    "</div>" +
                  "</td>";
        $(this).prepend(content);
      });

      $(".timespan").hide();
    }

    // fill in or update values
    timecode = timecode.split(",");
    $timespans = $("div#lyrics .row .timespan");

    for (var i = 0, length = timecode.length; i < length; i++) {
      var startTime = timecode[i];
      var endTime = timecode[i + 1];
      var width = (endTime - startTime) * 10 + "px";
      $timespans.eq(i).find(".start_time").text(startTime);
      $timespans.eq(i).find(".end_time").text(endTime);
      $timespans.eq(i).find(".waveform").css("width",width);
    }
  };

  var playSong = function(data) {
    console.log(data);

    $("div#create").empty();

    displayMediaSources(data.media_sources);
    displaySyncFiles(data.sync_files);
    loadLyrics(data.lyrics);

    $("div#media_sources ul li").first().trigger("click");

    if (data.sync_files.length !== 0) {
      $("div#lyrics").prepend("<input type='button' id='edit_timecode_btn' value='Edit Timecode'/>");
      var timecode = $("div#sync_files ul li.selected").data("timecode");
      loadTimespan(timecode);
      $("input#add_sync_file_btn").hide();
    }
  };

  /**
   *  Main handler for sync mode
   *  When user press [Enter],
   *    if there is line that is already highlighted
   *      endTime = floored time when [Enter] key was pressed
   *      waveform width stops expanding
   *    end
   *
   *    if there is next line to be highlighted
   *      next lyrics line is highlighted
   *      highlighted lyrics line will have a timespan dynamically
   *        change according to player time
   *      startTime = floored time when [Enter] key was pressed
   *      waveform width expands according to player time
   *    end
   *
   *    states
   *
   *    nothing highlighted
   *      before
   *              1
   *              2
   *              3
   *
   *      after
   *      2[]     1 <-
   *              2
   *              3
   *
   *
   *    middle highlighted
   *      before
   *      2[]     1 <-
   *              2
   *              3
   *
   *      after
   *      2[  ]5  1
   *      5[]     2 <-
   *              3
   *
   *    last highlighted
   *      before
   *      2[  ]5  1
   *      5[   ]9 2
   *      9[]     3 <-
   *
   *      after
   *      2[  ]5  1
   *      5[   ]9 2
   *      9[  ]11 3
   *
   */
  var enableTimecodeEdit = function(event){
    var ENTER_KEY = 13;
    var index = -1;

    $timespans = $("div#lyrics .row .timespan");
    $lines = $("div#lyrics .row .line");


    if (event.which === ENTER_KEY) {
      var currentPlayerTime = Math.floor(popcorn.currentTime());
      var $selectedLyricsLine = $lines.parent().find(".selected");

      // if there is line that is already highlighted
      // set its endTime to currentPlayerTime
      // remove current highlight
      if ($selectedLyricsLine.length > 0) {
        index = parseInt($selectedLyricsLine.attr("id"));
        $timespans.eq(index).find(".end_time").text(currentPlayerTime);
        $lines.eq(index).removeClass("selected");
      }

      // if there is next line to be highlighted
      // highlight next line
      // set its startTime to currentPlayerTime
      if (index === -1 || index < $lines.length - 1) {
        $lines.eq(index + 1).addClass("selected");
        $timespans.eq(index + 1).find(".start_time").text(currentPlayerTime);
      }
    }
  };

  var showPositionIndicator = function(){
    var currentTime = popcorn.currentTime()
    var position = Math.floor(currentTime * 10) + "px";
    $("div#position_indicator").css("left",position);
  };

  var getCurrentTimecode = function() {
    return $("div#lyrics .row .timespan .start_time")
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
      showPositionInterval = setInterval(showPositionIndicator,100);
      popcorn.play();
      $(this).attr("disabled","disabled");
      $("input#pause_sync_btn").removeAttr('disabled');
    });

    $(document).on("click", "input#pause_sync_btn", function(event) {
      $(document).off("keyup",enableTimecodeEdit);
      clearInterval(showPositionInterval);
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
          loadTimespan(data.timecode);
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

    // Click on lyrics row
    //   allows you to go to previous line/time
    $(document).on("click", "div#lyrics .row", function(event) {
      var startTime = $(this).find(".timespan .start_time").text();

      if (startTime !== "") {
        popcorn.currentTime(startTime);
      }
    });

    // Double click on lyrics row
    //   plays the media for current lyric line timespan
    //   *** What if no start/end time
    $(document).on("dblclick", "div#lyrics .row", function(event) {
      console.log("double clicked");
      var i = $(this).attr("id");
      console.log("REG" + i);
      var startTime = $(this).find(".timespan .start_time").text();
      var endTime = $(this).find(".timespan .end_time").text();

      popcorn.code({
        start: startTime,
        end:   endTime,
        onEnd: function(i,endTime) {
          return function(options) {
            console.log("must pause " + i + "endTime: " + endTime);
            popcorn.pause();
          }
        }(i,endTime)
      });
      // we will add an event handler for the timecode in that row
      //   but:
      //    1. we will have to remove this event handler when we want to play entire lyrics w/o pauses
      //    2. does this add or replace the event handler for timespan?
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
      displaySyncFileControls();
    });

    $(document).on("click", "div#sync_files li", function(event) {
      event.preventDefault();
    });

    $(document).on("click", "input#edit_timecode_btn", function(event) {
      editTimecodeMode = true;

      $(this).val("Cancel Edit");
      $(this).addClass("cancel");

      displaySyncFileControls();

      popcorn.pause();
      popcorn.currentTime(0);
    });

    $(document).on("click", "input#edit_timecode_btn.cancel", function(event) {
      editTimecodeMode = false;
      $("input#pause_sync_btn").trigger("click");

      // reload the original timecode
      var timecode = $("div#sync_files ul li.selected").data("timecode");
      loadTimespan(timecode);

      $(this).val("Edit Timecode");
      $(this).removeClass("cancel");

      $(".timespan").hide();
      $("div#lyrics .row .line.selected").removeClass("selected");
      $("div#create").empty();

      $("div#media_sources ul li.selected").trigger("click");
    });

    $("#top_container").append("<div id='position_indicator'></div>");

  });



//})();
