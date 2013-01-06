//(function() {

  var popcorn;
  var editTimecodeMode;
  var showPositionInterval;
  var positionIndicator;

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
    var $waveforms;

    popcorn.code({
      start: options.start,
      end:   options.end,
      onStart: function(i) {
        return function(options) {
          $waveforms = $("div#lyrics .timespan .waveform");

          console.log("line: " + i + "  start: " + options.start + "   " + "  end: " + options.end + "   " + $lines.eq(i).text());
          $lines.parent().find(".selected").removeClass("selected");
          $lines.eq(i).addClass("selected");

          $waveforms.parent().find(".active").removeClass("active");
          $waveforms.eq(i).addClass("active");
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
    var $waveforms = $("div#lyrics .timespan .waveform");

    // remove any previously highlighted lines
    $lines.filter(".selected").each(function(){
      $(this).removeClass("selected");
    });

    // remove any previously active waveforms
    $waveforms.filter(".active").each(function(){
      $(this).removeClass("active");
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

  var loadSyncFile = function(timecode) {
    $("div#media").data("timecode",timecode);
  };

  var displaySyncFileControls = function() {
    $(".timespan").show();

    $("div#sync_mode_controls #main").append(
      "<input type='button' name='' value='Start' id='start_sync_btn'/>" +
      "<input type='button' name='' value='Pause' id='pause_sync_btn' disabled='disabled'/>" +
      "<input type='button' name='' value='save' id='update_sync_btn'/>"
    );

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
    // remove any existing position indicators
    $("div#position_indicator").remove();

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

    // make first waveform active
    $timespans.first().find(".waveform").addClass("active");

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

    $("div#sync_mode_controls").empty();

    displayMediaSources(data.media_sources);

    var timecode = data.sync_file ? data.sync_file.timecode : ""

    loadSyncFile(timecode);
    loadLyrics(data.lyrics);

    $("div#media_sources ul li").first().trigger("click");

    $("div#sync_mode_controls").append(
        "<input type='button' id='edit_timecode_btn' value='Edit Timecode'/>" +
        "<div id='main'></div>"
    );

    loadTimespan(timecode);
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

    $lines = $("div#lyrics .row .line");
    $waveforms = $("div#lyrics .row .waveform");

    if (event.which === ENTER_KEY) {
      var currentPlayerTime = Math.floor(popcorn.currentTime());
      var $selectedLyricsLine = $lines.parent().find(".selected");

      index = parseInt($selectedLyricsLine.attr("id"));
      $lines.eq(index).removeClass("selected");
      $waveforms.eq(index).removeClass("active");
      changeCurrEndTime(index,currentPlayerTime);

      // if there is next line to be highlighted
      // highlight next line
      // set its startTime to currentPlayerTime
      if (index === -1 || index < $lines.length - 1) {
        $lines.eq(index + 1).addClass("selected");
        $waveforms.eq(index + 1).addClass("active");
      }
    }
  };

  // red vertical bar indicating which second of media we are at.
  // if it is currently not visible
  // initialize position to be same as left position of first lyrics line's waveform
  //   its y position depends on where current active waveform is
  //   its x position simply increments steadily depending on interval number used on this function
  //   x position would be reset to 0 if:
  //     it waveform is played from beginning again
  //       restart parameter
  //       if restart === true (default is false)
  //     active waveform changes
  //       track old and new waveform. if new !== old, reset to 0

  // constructor function
  var PositionIndicator = function(){
    this.waveform = $("div#lyrics .waveform.active");

    // create position indicator if it doesnt exist
    if ($("div#position_indicator").length === 0) {
      $("body").append("<div id='position_indicator'></div>");
    }

    this.elem = $("div#position_indicator");

    // initialize position
    this.elem.css("left",this.waveform.position().left + "px");
    this.elem.css("top", this.waveform.position().top  + "px");
  };

  // public methods via prototype
  PositionIndicator.prototype.move = function(){
    var oldWaveform = this.waveform;
    var newWaveform = $("div#lyrics .waveform.active");

    // if active waveform has changed
    if ($("div#lyrics .waveform").index(oldWaveform) !==
        $("div#lyrics .waveform").index(newWaveform)) {
      this.waveform = newWaveform;
      this.elem.css("left",this.waveform.position().left + "px");
      this.elem.css("top", this.waveform.position().top  + "px");
    }

    var activeWaveformStartTime = parseFloat(this.waveform.parent().find(".start_time").text());
    var progress = (popcorn.currentTime() - activeWaveformStartTime) * 10;
    var base = this.waveform.position().left;
    var left = base + progress;
    this.elem.css("left",left + "px");
  };

  var showPositionIndicator = function(){
    if (typeof positionIndicator === "undefined") {
      positionIndicator = new PositionIndicator;
    }

    positionIndicator.move();
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
          $("div#media").data("timecode",data.timecode);
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
          $("div#media_sources ul").append(data);
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
        var timecode = $("div#media").data("timecode");
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
      var timecode = $("div#media").data("timecode");
      loadTimespan(timecode);

      $(this).val("Edit Timecode");
      $(this).removeClass("cancel");

      $(".timespan").hide();
      $("div#lyrics .timespan .waveform").removeClass("active");
      $("div#lyrics .row .line.selected").removeClass("selected");
      $("div#sync_mode_controls #main").empty();

      $("div#media_sources ul li.selected").trigger("click");
    });

  });



//})();
