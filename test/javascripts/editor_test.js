// setup video container

var editor;

$(document).ready(function(){
  var videoContainer = "<video id='video' controls width='250px' poster='/poster.png'>" +
                         "<source id='mp4' src='/trailer.mp4' type=\"video/mp4; codecs='avc1, mp4a'\">" +
                         "<p>Your user agent does not support the HTML5 Video element.</p>" +
                       "</video>";
  $(document.body).append(videoContainer);
  var selector = "video#video";
  editor = new Editor({}, { targetSelector: "video#video" } );

  test( "createGhostTrack should create a new track", function() {
    editor.clearTracks();
    editor.seek(3);
    var track = editor.createGhostTrack();

    equal(editor.numTracks,1);
    equal(track.startTime(),3);
    equal(track.endTime(),editor.media.duration);
  });

  test( "createGhostTrack should extend duration of new track all the way till the duration if no other tracks exist", function() {
    editor.clearTracks();
    editor.seek(3);
    var track = editor.createGhostTrack();

    equal(editor.numTracks,1);
    equal(track.startTime(),3);
    equal(track.endTime(),editor.media.duration);
  });

  test( "createGhostTrack should extend duration of new track till the nearest track if other tracks exist right after it", function() {
    editor.clearTracks();
    editor.seek(20);
    var track = editor.createGhostTrack();

    editor.seek(5);
    track = editor.createGhostTrack();
    equal(editor.numTracks,2);
    equal(track.startTime(),5);
    equal(track.endTime(),20);
  });

  test( "endGhostTrack should update endTime of track to currentTime", function() {
    editor.clearTracks();
    editor.seek(3);
    var track = editor.createGhostTrack();
    editor.seek(15);
    editor.endGhostTrack(track);

    equal(track.startTime(),3);
    equal(track.endTime(),15);
  });

  test( "endGhostTrack cannot end a track at time less than its startTime", function() {
    editor.clearTracks();
    editor.seek(3);
    var track = editor.createGhostTrack();
    editor.seek(1);
    throws(function() { editor.endGhostTrack(track); });
  });

  test( "createGhostTrack cannot overlap (identical start & end) ", function() {
    editor.clearTracks();
    editor.seek(3);
    var track = editor.createGhostTrack();
    throws(function() { editor.createGhostTrack(); });
  });

  test( "createGhostTrack cannot overlap (overlap tail) ", function() {
    editor.clearTracks();
    editor.seek(6);
    var track = editor.createGhostTrack();
    editor.seek(10);
    editor.endGhostTrack(track);

    editor.seek(7);
    throws(function() { editor.createGhostTrack(); });
  });

  test( "createGhostTrack cannot overlap (overlap head) ", function() {
    editor.clearTracks();
    editor.seek(1);
    var track = editor.createGhostTrack();
    editor.seek(5);
    editor.endGhostTrack(track);

    editor.seek(4);
    throws(function() { editor.createGhostTrack(); });
  });

  test( "clearTrack should remove all tracks & their trackEvents", function() {
    editor.clearTracks();
    editor.seek(1);
    var track = editor.createGhostTrack();
    editor.seek(5);
    editor.endGhostTrack(track);

    track = editor.createGhostTrack();
    editor.seek(10);
    editor.endGhostTrack(track);

    equal(editor.numTracks,2);

    editor.clearTracks();

    equal(editor.numTracks,0);
    equal(editor.popcorn.getTrackEvents().length,0);
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
// [ ] if 1 track hits starttime of next track, and we have the seek back applied
//       assert track1.start -> track1.end -> track2.start -> track2.end -> track1.start
// [ ] when on subtitle edit focused. you switch tabs and come back. commands should be enabled. you can still play
// [ ] dbl click edit + enter + dbl click edit should still work 
// [ ] subtitleline edit. when move to another line. the inplaceedit should be gone
// [ ] must be able to drag seek head
// [ ] click here for isntructions is not obvious
// [ ] when subtitle line is blank. clicking on it does nothing !!!!!
// [ ] subedit Keyup should change 1. track.subtitle.text 2. subtitleDisplay

solr search - if no matches found (give suggestions)
paging (kaminari)
exception notification


