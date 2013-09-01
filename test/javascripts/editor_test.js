// setup video container

var editor;

$(document).ready(function(){

  $(document.body).append("<div id='test_container'></div>");
  var media = "<video id='media' controls width='250px' poster='/poster.png'>" +
                 "<source id='mp4' src='/trailer.mp4' type=\"video/mp4; codecs='avc1, mp4a'\">" +
                 "<p>Your user agent does not support the HTML5 Video element.</p>" +
               "</video>";

  var repo = {
    video: {},
    user: {}
  };

  editor = new Editor(repo,{ media: media, container: $("#test_container") } );

  $(document).on("editor.ready", function(){

    asyncTest( "createGhostTrack should create a new track", 1, function() {
      editor.resetState(function(){
        editor.seek(3,function(){
          var track = editor.createGhostTrack();
          equal(editor.numTracks,1);
          start();
        });
      });
    });

    asyncTest( "endGhostTrack that happens on same time as startGhostTrack should remove track",2, function() {
      editor.resetState(function(){
        editor.seek(3,function(){
          var track = editor.createGhostTrack();
          throws(function() { editor.endGhostTrack(track); });
          equal(editor.numTracks,0);
          start();
        });
      });
    });

    asyncTest( "cleartracks should remove existing tracks",3, function() {
      editor.resetState(function(){
        var track = editor.createGhostTrack();
        editor.seek(5,function(){
          editor.endGhostTrack(track);
          editor.seek(7,function(){
            track = editor.createGhostTrack();
            editor.seek(8,function(){
              editor.endGhostTrack(track);

              equal(editor.numTracks,2);
              editor.clearTracks();
              equal(editor.numTracks,0);
              equal(editor.popcorn.getTrackEvents().length,0);
              start();
            });
          });
        });
      });
    });

    asyncTest( "createGhostTrack should extend duration of new track all the way till the duration if no other tracks exist", 3, function() {
      editor.resetState(function(){
        editor.seek(3,function(){
          var track = editor.createGhostTrack();

          equal(editor.numTracks,1);
          equal(track.startTime(),3);
          equal(track.endTime(),editor.media.duration);
          start();
        });
      });
    });

    asyncTest( "createGhostTrack should extend duration of new track till the nearest track if other tracks exist right after it", 3,function() {
      editor.resetState(function(){
        editor.seek(20,function(){
          var track = editor.createGhostTrack();
          editor.seek(23,function(){
            editor.endGhostTrack(track);
            editor.seek(5,function(){
              track = editor.createGhostTrack();
              equal(editor.numTracks,2);
              equal(track.startTime(),5);
              equal(track.endTime(),20);
              start();
            });
          });
        });
      });
    });

    asyncTest( "endGhostTrack should update endTime of track to currentTime", 2,function() {
      editor.resetState(function(){
        editor.seek(3,function(){
          var track = editor.createGhostTrack();
          editor.seek(15,function(){
            editor.endGhostTrack(track);

            equal(track.startTime(),3);
            equal(track.endTime(),15);
            start();
          });
        });
      });
    });

    asyncTest( "after createGhostTrack, seeking to time less than its startTime will automatically endGhostTrack and subsequently remove that invalid track of negative duration", 3, function() {
      console.log("AFTER SEEKING LESS THAN START TIME");
      editor.resetState(function(){
        var numOfGhostTrackStart = 0;
        var numOfGhostTrackEnd = 0;

        $(document).on("ghosttrackstart",function() { numOfGhostTrackStart += 1; });
        $(document).on("ghosttrackend",function() { numOfGhostTrackEnd += 1; });

        editor.seek(3,function(){
          var track = editor.createGhostTrack();
          editor.seek(1,function(){
            equal(numOfGhostTrackStart,1);
            equal(numOfGhostTrackEnd,1);
            equal(editor.numTracks,0);
            start();
          });
        });
      });
    });

    asyncTest( "createGhostTrack cannot overlap (identical start & end) ",1, function() {
      editor.resetState(function(){
        editor.seek(3,function(){
          var track = editor.createGhostTrack();
          throws(function() { editor.createGhostTrack(); });
          start();
        });
      });
    });

    asyncTest( "createGhostTrack cannot overlap (overlap tail) ", 1,function() {
      editor.resetState(function(){
        editor.seek(6,function(){
          var track = editor.createGhostTrack();
          editor.seek(10,function(){
            editor.endGhostTrack(track);
            editor.seek(7,function(){
              throws(function() { editor.createGhostTrack(); });
              start();
            });
          });
        });
      });
    });

    asyncTest( "createGhostTrack cannot overlap (overlap head) ", 1,function() {
      editor.resetState(function(){
        editor.seek(1,function(){
          var track = editor.createGhostTrack();
          editor.seek(5,function(){
            editor.endGhostTrack(track);
            editor.seek(4,function(){
              throws(function() { editor.createGhostTrack(); });
              start();
            });
          });
        });
      });
    });


    asyncTest( "timeSubtitle should initially call createGhostTrack",2, function() {
      editor.resetState(function(){
        var numOfGhostTrackStart = 0;
        var numOfGhostTrackEnd = 0;

        $(document).on("ghosttrackstart",function() { numOfGhostTrackStart += 1; });
        $(document).on("ghosttrackend",function() { numOfGhostTrackEnd += 1; });

        editor.timeSubtitle();
        equal(numOfGhostTrackStart,1);
        equal(numOfGhostTrackEnd,0);
        start();
      });
    });

    asyncTest( "timeSubtitle should call endGhostTrack after createGhostTrack has been called previously",2, function() {
      editor.resetState(function(){
        var numOfGhostTrackStart = 0;
        var numOfGhostTrackEnd = 0;

        $(document).on("ghosttrackstart",function() { numOfGhostTrackStart += 1; });
        $(document).on("ghosttrackend",function() { numOfGhostTrackEnd += 1; });

        editor.timeSubtitle();
        editor.timeSubtitle();
        equal(numOfGhostTrackStart,1);
        equal(numOfGhostTrackEnd,1);
        start();
      });
    });

    asyncTest( "timeSubtitle should call createGhostTrack when cancelGhostTrack is called right after createGhostTrack", 2, function() {
      editor.resetState(function(){
        var numOfGhostTrackStart = 0;
        var numOfGhostTrackEnd = 0;

        $(document).on("ghosttrackstart",function() { numOfGhostTrackStart += 1; });
        $(document).on("ghosttrackend",function() { numOfGhostTrackEnd += 1; });

        editor.timeSubtitle();
        editor.cancelGhostTrack();
        editor.timeSubtitle();
        editor.pause();
        equal(numOfGhostTrackStart,2);
        equal(numOfGhostTrackEnd,1);
        start();
      });
    });

    asyncTest( "should not allow seeking beyond video duration", 2,function() {
      editor.resetState(function(){
        var lessThanVideoStartTime = -6;
        var moreThanVideoEndTime = editor.media.duration + 5;
        var numOfSeeks = 0;

        editor.popcorn.on("seeked",function(){ numOfSeeks += 1; });

        editor.seek(5,function(){
          editor.seek(lessThanVideoStartTime,function(){
            editor.seek(moreThanVideoEndTime,function(){
              equal(editor.media.currentTime,5);
              equal(numOfSeeks,1);
              start();
            });
          });
        });
      });
    });

    // asyncTest( "1 track has a sub and another doesnt, when subedit 1st track, then seek to subedit 2nd track, it should be editing 2nd track's sub", 2,function() {
    //   editor.resetState(function(){
    //     var track = editor.createGhostTrack();

    //   });
    // });

    // createGhost + seek to before + createGhost + seek to before + not deleting ghost for some reason
    // ADD + DELETE + subedit should be hidden
    // ADD + ADD + click on prev. editing sub should be on curr track not on other one
    // createGhost + ADD
    // in between 2 tracks + ADD should hit until start of next track
    // double click on track . click on another track. should be editing new track not old one
    // player YOUTUBE LINK BROKEN
    // DEMO
    // 1. start time + stop time + type
    // 2. ADD + type
    // 3. Delete 2nd
    // 4. resize 1st
    // 6. scroll
    // 5. dblclick 1st + type
    // 5. dblclick sublist + type
    // 7. save



    /*
     *
     *  ---------- TRACK TEST ---------------------
     *
     */

    test( "track needs start_time & end_time & popcorn object", function() {
      var popcorn = Popcorn("#media");
      var track;

      throws(function() { track = new Track({},popcorn); });
      throws(function() { track = new Track({ start_time: 4, end_time: 7}); });

      track = new Track({ start_time: 4, end_time: 7}, popcorn);
      equal(track.toString(),"Track(4,7)");
    });

    test( "normal track when created and removed should not trigger ghosttrackstart nor ghosttrackend", function() {
      var popcorn = Popcorn("#media");
      var track;

      var numOfGhostTrackStart = 0;
      var numOfGhostTrackEnd = 0;

      $(document).on("ghosttrackstart",function() { numOfGhostTrackStart += 1; });
      $(document).on("ghosttrackend",function() { numOfGhostTrackEnd += 1; });

      track = new Track({ start_time: 4, end_time: 7}, popcorn);

      track.remove();
      equal(numOfGhostTrackStart,0);
      equal(numOfGhostTrackEnd,0);
    });

    test( "ghost track when created should trigger ghosttrackstart ", function() {
      var popcorn = Popcorn("#media");
      var track;

      var numOfGhostTrackStart = 0;
      $(document).on("ghosttrackstart",function() { numOfGhostTrackStart += 1; });

      track = new Track({ start_time: 4, end_time: 7}, popcorn,{ "isGhost": true});

      equal(numOfGhostTrackStart,1);
    });

    test( "ghost track when ended should trigger ghosttrackend", function() {
      var popcorn = Popcorn("#media");
      var track;

      var numOfGhostTrackEnd = 0;
      $(document).on("ghosttrackend",function() { numOfGhostTrackEnd += 1; });

      track = new Track({ start_time: 4, end_time: 7}, popcorn,{ "isGhost": true});

      track.end(6);
      equal(numOfGhostTrackEnd,1);
    });

    test( "ghost track when removed should trigger ghosttrackend ", function() {
      var popcorn = Popcorn("#media");
      var track;

      var numOfGhostTrackEnd = 0;
      $(document).on("ghosttrackend",function() { numOfGhostTrackEnd += 1; });

      track = new Track({ start_time: 4, end_time: 7}, popcorn,{ "isGhost": true});

      track.remove();
      equal(numOfGhostTrackEnd,1);
    });

    test( "track.remove should remove track event", function() {
      var popcorn = Popcorn("#media");
      var track;

      track = new Track({ start_time: 4, end_time: 7}, popcorn);

      equal(popcorn.getTrackEvents().length,1);
      track.remove();
      equal(popcorn.getTrackEvents().length,0);
    });

    // test( "removing a track should not trigger track end", function() {
    //   var popcorn = Popcorn("#media");
    //   var track = new Track({},popcorn);


    //   equal(editor.numTracks,1);
    // });



    /*
     *
     *  ---------- TIMELINE TEST ---------------------
     *
     */

     // presence of expanded should not affect:
     //   summary window sliding
     //     current window start/end
     //     if currentTime is beyond that, slide window in 30 sec increment to that currentime
     //      initially, current_window = [0,30]
     //      if seek to 42, current_window = [30,60], should trigger event, window_slide, [30,60]

     //   track rendering
     //   resolution

    test( "timeline resolution should work whether or not elements are visible", function() {
      var media = $("#media")[0];
      var timeline = new Timeline(media);
      var summaryWidth = timeline.$summary.width();
      var expandedWidth = timeline.$expanded.width();
      var summaryWidthInSec = media.duration;
      var expandedWidthInSec = 30;
      equal(timeline.resolution(timeline.$summary),summaryWidth / summaryWidthInSec);
      equal(timeline.resolution(timeline.$expanded),expandedWidth / expandedWidthInSec);
      timeline.$summary.hide();
      timeline.$expanded.hide();
      equal(timeline.resolution(timeline.$summary),summaryWidth / summaryWidthInSec);
      equal(timeline.resolution(timeline.$expanded),expandedWidth / expandedWidthInSec);
    });

    asyncTest( "timeline isOutOfBounds should work independently of element visibility",4, function() {
      var media = $("#media")[0];
      var timeline = new Timeline(media);

      equal(timeline.isOutOfBounds(),false);
      deepEqual(timeline.current_window_slide,{start: 0, end: 30});
      timeline.media.currentTime = 35;
      equal(timeline.isOutOfBounds(),true);
      timeline.on("window.scroll",function(){
        console.log(timeline.current_window_slide);
        deepEqual(timeline.current_window_slide,{start: 30, end: 60});
        start();
      });

    });


  });

});




// window pane must be 30 seconds long
//   wat if vid is only 7 seconds
// whole timeline must be equal to length of video
//
// [x] subtitle texts must be formatted, start times should be displayed well
// [x]  click on subtitle line should seek to that track
//        subtitle determines which subtitleline was clicked
//        determine which track it belongs to. and use its start time to seek there
// [x] click on track should highlight subtitle line
// [x] replace popcorn.subtitle with just our own implementation
// [x] added summary + expanded timeline
// [x] timeline should have progress bar
// [x] summary timeline should have window to indicate where expanded timeline is
// [x] expanded timeline should move itself dynamically when out of bounds
// [x] expanded timeline should have time indicator
// [x] drag track should modify start/end times and should be reflected in ui
// [x] pressing fill button should show track fill animation
// [x] should distinguish mapped subtitle line from unmapped ones
// [x] add window in summary
// [x] show scrubber
// [x] scrubber should  appear on top of any element
// [x] when playing,clicking on any space on timeline should move scrubber to that spot
// [x] when paused, clicking on any space on timeline should move scrubber to that spot
// [x] removing track means unmapping the subtitleline
// [x] use twitter bootstrap
// [x] double click on subtitle text on subtitle container should allow you to edit it
// [ ] if media cannot be loaded, let user choose another url
// [x] should not allow user to create track inside another track
// [x] change add song to subtitle song - needs only url, extract name, lyrics, let user paste that on 2nd step, 1st step has to be extremely convenient
// [x] display video thumbnail instead of just text
// [ ] add county label
// [ ] paginate through subtitled video list
// [ ] add about page
// [ ] test email registration
// [ ] when logged in, make formatting better, replace Edit Profile with my username with dropdown ability to edit profile
// [x] add google analytics
// [x] add instructions in editor
// [x] when typing in subtitle input, editor_space_listener should not get triggered
// [x] while typing in subtitle input, subtitle text should immediately be modified
// [ ] bug: pressing shift multiple times would fill up entire timeline
// [ ] bug: create 2 tracks. svae. create another track. save. error. its saving the previously created 2 tracks again to server
// [ ] bug: create a track. start another before that track. right when its about to reach start of next track, release shift, and you'll see it jumps to end of next track
// [x] bug: paused video somewhere. press shift, while holding click on subbar so that you can type.press enter. track fills whole container

// [ ] ui: instructions on how to start. popover tooltip, 1,2,3 [andre]
// [ ] click and drag timeline to create segment like aegis
// [ ] ui: when error, instead of alert, show flash. let user know that we will take care of it
// [x] permalinks: so back button would work
// [ ] dealing with duplicate youtube links
// [ ] saving should just do one request, and payload should be in json instead of form encoded
// [x] editing/deleting subitile should be obvious
// [x] save/download buttons should be outside media container. because it makes it look like you're saving the video.
// [x] should be able to undo creation of a track easily in case user decided oh that's a mistake

// 2.0
// [ ] destroy subtitle should destroy track (server model/javascript)
// [ ] destroy track should destroy subtitle (server model/javascript)
// [ ] should be able to delete track using keyboard
// [ ] play only up to current track endtime
// [ ] allow user to sync timing of existing transcripts
// [ ] use speech recognition to automatically detect timeslices
// [ ] allow user to tab through time slices
// [ ] drag track should modify subtitle bar meaning if you drag track from 3 to 5 second, and scrubber currently at 3
//       then after dragging, the subtitle bar should be blank since the subtitle should start at 5th second
// [ ] expanded timeline should have time label every 5 second
// [ ] should let user know if media is buffering to avoid making them think that our app is slow when in fact its the video loading thats slow
// [ ] inserting in between subtitlelines should work, save load should appear in right order
// [ ]   should have order and when saved and loaded should appear in right order
// [ ] should test determineEndTime
// [ ] double click on track should lock into that track and play until end of that track only, press space will replay that track again
// [ ] should be able to drag tracks across timeline window boundaries
// // [ ] start timing + escape - would not be able to end timing, next action should be start timing
// [ ] edit subtitle + escape - should not delete that track
// [ ] start timing + pause - click left of track should end that track
// [ ] start timing + pause + end timing + start timing - breaks
// [ ] when user asked to input subtitle, not obvious where it is.
// [ ] when user asked to input subtitle, paused, but once i switch tabs,
//       it loses focus and auto plays the video, should only play when user presses enter
// [ ] currentTrack/currentGhostTrack should become null when scrubber is not in any track
// [ ]   when ontrackend happens
// [ ] think about when ghost track becomes null
// [ ]   endGhosttrack
// [ ] fix GA analytics
// [ ] change all zeroplay to riversub
// [ ] test ensurePauseAtTrack
// [ ] test endGhost while playing
// [ ] test endGhost while paused
// [ ] test endGhost triggerd by hitting next track and having track end triggered
// [ ] subtitle editmode should only be triggered ONE at a TIME
// [ ] what if 2 tracks trigger subtitleditmode simultaneously
//      track 1 hits track 2 - both doesnt have sub yet
// [x] when on subtitle edit focused. you switch tabs and come back. commands should be enabled. you can still play
// [ ] dbl click edit + enter + dbl click edit should still work
// [ ] subtitleline edit. when move to another line. the inplaceedit should be gone
// [x] must be able to drag seek head
// [ ] click here for isntructions is not obvious
// [x] when subtitle line is blank. clicking on it does nothing !!!!!
// [x] subedit Keyup should change 1. track.subtitle.text 2. subtitleDisplay
// [ ] ghosttrack end while playing/paused should stop at exact time you paused
// [x] while on ghosttrack mode, delete track should cancel ghostrack mode
// [ ] let user know internet is slow

// solr search - if no matches found (give suggestions)
// exception notification

// [ ] Share buttons (twitter/facebook/google+) textbox url to paste in stuff
//     somehow show orig youtube link
// [ ] show other related videos (only ones that are subbed) when watching a video with sub
// [ ] startGhost + endGhost + removeTrack -> subtitleedit should be hidden.
// [ ] test enable/disable commands
// [ ] scroll window to curr scrubber no longer working - broken during b0600252d609d78d4923c89111347b30ae02387d - suspect that when scrolling horizontally, window_slide.start/end not being updated
// [x] seeking to middle of track currently restarts the track instead of seeking to that time.
// [x] instructions should show only "Adding Subtitles" initially, with lists being expandable/collapsible
// [x] make timeline scrolling more sensitive/ too slow and feels a bit buggy
// [ ] update video demo

