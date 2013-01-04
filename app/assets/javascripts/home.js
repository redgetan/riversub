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

  var addHighlightSync = function(options) {
    var $lines = $("div#lyrics .row .line");

    popcorn.code({
      start: options.start,
      end:   options.end,
      onStart: function(i) {
        return function(options) {
          console.log("line: " + i + "  start: " + options.start + "   " + "  end: " + options.end + "   " + $lines.eq(i).text());
          $lines.parent().find(".selected").removeClass("selected");
          $lines.eq(i).addClass("selected");
        }
      }(options.index)
    });

    lastTrackEventId = popcorn.data.history[popcorn.data.history.length-1]
    $lines.eq(options.index).data("code-track-event-id",lastTrackEventId);
  };

  var addSubtitleSync = function(options) {
    var $lines = $("div#lyrics .row .line");

    popcorn.subtitle({
      start: options.start,
      end:   options.end,
      text: $lines.eq(options.index).text(),
    });

    lastTrackEventId = popcorn.data.history[popcorn.data.history.length-1]
    $lines.eq(options.index).data("subtitle-track-event-id",lastTrackEventId);
  };

  var syncLyricsToMedia = function(timecode) {

    timecode = timecode.split(",");
    var lastTrackEventId;
    var $lines = $("div#lyrics .row .line");

    // remove any previously highlighted lines
    $lines.filter(".selected").each(function(){
      $(this).removeClass("selected");
    });

    for (var i = 0, length = timecode.length; i < length; i++) {
      addHighlightSync({
        index: i,
        start: timecode[i],
        end: timecode[i + 1]
      });

      addSubtitleSync({
        index: i,
        start: timecode[i],
        end: timecode[i + 1]
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
    //$("div#sync_files").append("<input type='button' name='' value='Add Sync File' id='add_sync_file_btn'/>");
    $("div#sync_files ul li").first().addClass("selected");
  };

  var displaySyncFileControls = function() {
    $(".timespan").show();

    var startSyncBtn = "<input type='button' name='' value='Start Sync Mode' id='start_sync_btn'/>";
    var pauseSyncBtn = "<input type='button' name='' value='Pause Sync Mode' id='pause_sync_btn' disabled='disabled'/>";
    var saveSyncBtn = "<input type='button' name='' value='Save SyncFile' id='update_sync_btn'/>";
    $("div#create").append(startSyncBtn);
    $("div#create").append(pauseSyncBtn);
    $("div#create").append(saveSyncBtn);

    // must highlight first line if none highlighted
    var $lines = $("div#lyrics .row .line");
    var $selectedLyricsLine = $lines.parent().find(".selected");
    if ($selectedLyricsLine.length === 0) {
      $lines.first().addClass("selected");
    }
  };

  // if endTime is blank
  var calculateWaveformWidth = function(startTime,endTime) {
    startTime = parseFloat(startTime);
    endTime   = parseFloat(endTime);
    if (isNaN(startTime) || isNaN(endTime)) {
      return "0px";
    }
    return (endTime - startTime) * 10 + "px";
  };

  var updateHighlightSync = function(options) {
    var $lines = $("div#lyrics .row .line");
    popcorn.removeTrackEvent($lines.eq(options.index).data("code-track-event-id"));

    addHighlightSync({
      index: options.index,
      start: options.start,
      end: options.end
    });
  };

  var updateSubtitleSync = function(options) {
    var $lines = $("div#lyrics .row .line");
    popcorn.removeTrackEvent($lines.eq(options.index).data("subtitle-track-event-id"));

    addSubtitleSync({
      index: options.index,
      start: options.start,
      end: options.end
    });
  };

  var changeTimespan = function(options) {
    console.log("options.position: " + options.position + "time: " + options.time);
    if (options.position !== "start" && options.position !== "end") {
      throw "Invalid position: " + options.position + " . Could only be 'start' or 'end'";
    }

    var $timespans = $("div#lyrics .row .timespan");
    var index = options.index;

    if (index < 0 || index > $timespans.length - 1) {
      throw "Index out of bounds. (" + index + " out of " + ($timespans.length - 1) + ") " ;
    }

    var timespan = $timespans.eq(index);
    var startTime;
    var endTime;
    var waveformWidth;

    // set new start/end time
    if (options.position === "start") {
      startTime = options.time;
      endTime = timespan.find(".end_time").text();
      timespan.find(".start_time").text(startTime);
    } else {
      startTime = timespan.find(".start_time").text();
      endTime = options.time;
      timespan.find(".end_time").text(endTime);
    }

    // modify waveform width
    waveformWidth = calculateWaveformWidth(startTime,endTime);
    timespan.find(".waveform").css("width",waveformWidth);

    // update synchronization data
    // but only when both startTime & endTime is already set
    if (startTime !== "" && endTime !== "") {
      updateHighlightSync({
        index: index,
        start: startTime,
        end: endTime
      });

      updateSubtitleSync({
        index: index,
        start: startTime,
        end: endTime
      });
    }

  };

  var changeCurrEndTime = function(index,time) {
    changeTimespan({
      index: index,
      position: "end",
      time: time
    });

    changeTimespan({
      index: index + 1,
      position: "start",
      time: time
    });
  };

  var changeCurrStartTime = function(index,time) {
    changeTimespan({
      index: index - 1,
      position: "end",
      time: time
    });

    changeTimespan({
      index: index,
      position: "start",
      time: time
    });
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
                    "<div class='timespan'>" +
                      "<div class='start_time'></div>" +
                      "<div class='waveform'></div>" +
                      "<div class='end_time'></div>" +
                    "</div>" +
                  "</td>";
        $(this).prepend(content);
      });

      $(".timespan").hide();
    }

    // fill in or update values
    timecode = timecode.split(",");
    $timespans = $("div#lyrics .row .timespan");

    for (var i = 0, length = timecode.length; i < length - 1; i++) {
      var startTime = timecode[i];
      var endTime = timecode[i + 1];
      var width = calculateWaveformWidth(startTime,endTime);
      $timespans.eq(i).find(".start_time").text(startTime);
      $timespans.eq(i).find(".end_time").text(endTime);
      $timespans.eq(i).find(".waveform").css("width",width);
    }

    // if there are no timecodes available yet,
    // initialize startTime of first line to 0
    if (timecode[0] === "") {
      $timespans.first().find(".start_time").text("0");
    }

    // make start_time and end_time inplace editable

    $("div#lyrics .row .start_time").editInPlace({
      callback: function(unused, enteredText) {
        var index = parseInt($(this).closest(".row").attr("id"));
        changeCurrStartTime(index,enteredText);
        return enteredText;
      },
      text_size: "2",
      default_text: ""
    });

    $("div#lyrics .row .end_time").editInPlace({
      callback: function(unused, enteredText) {
        var index = parseInt($(this).closest(".row").attr("id"));
        changeCurrEndTime(index,enteredText);
        return enteredText;
      },
      text_size: "2",
      default_text: ""
    });

  };

  var playSong = function(data) {
    console.log(data);

    $("div#create").empty();

    displayMediaSources(data.media_sources);
    displaySyncFiles(data.sync_files);
    loadLyrics(data.lyrics);

    $("div#media_sources ul li").first().trigger("click");

    $("div#lyrics").prepend("<input type='button' id='edit_timecode_btn' value='Edit Timecode'/>");
    var timecode = $("div#sync_files ul li.selected").data("timecode");
    if (typeof timecode === "undefined") {
      loadTimespan("");
    } else {
      loadTimespan(timecode);
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

      index = parseInt($selectedLyricsLine.attr("id"));
      $lines.eq(index).removeClass("selected");
      console.log("curr player time: " + currentPlayerTime);
      changeCurrEndTime(index,currentPlayerTime);

      // if there is next line to be highlighted
      // highlight next line
      // set its startTime to currentPlayerTime
      if (index === -1 || index < $lines.length - 1) {
        $lines.eq(index + 1).addClass("selected");
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
    $(document).on("click", "div#lyrics .row .line", function(event) {
      var startTime = $(this).closest(".row").find(".timespan .start_time").text();

      if (startTime !== "") {
        popcorn.currentTime(startTime);
      }
    });

    // Double click on lyrics row
    //   plays the media for current lyric line timespan
    //   *** What if no start/end time
    $(document).on("dblclick", "div#lyrics .row .line", function(event) {
      //var i = $(this).attr("id");
      //var startTime = $(this).find(".timespan .start_time").text();
      //var endTime = $(this).find(".timespan .end_time").text();

      //popcorn.code({
        //start: startTime,
        //end:   endTime,
        //onEnd: function(i,endTime) {
          //return function(options) {
            //console.log("must pause " + i + "endTime: " + endTime);
            //popcorn.pause();
          //}
        //}(i,endTime)
      //});
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

    // some fiddling. must remove in production
    $("#top_container").append("<div id='position_indicator'></div>");

  });



//})();
