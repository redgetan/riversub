var popcorn = Popcorn("#video");
var subtitle = new Subtitle("one\ntwo\nthree");
var editor = new Editor(subtitle,popcorn);

test( "createTrack should create a new track", function() {
  editor.clearTracks();
  editor.seek(3);
  var track = editor.createTrack();

  equal(editor.numTracks,1);
  equal(track.startTime,3);
  equal(track.endTime,editor.media.duration);
});

test( "createTrack should extend duration of new track all the way till the duration if no other tracks exist", function() {
  editor.clearTracks();
  editor.seek(3);
  var track = editor.createTrack();

  equal(editor.numTracks,1);
  equal(track.startTime,3);
  equal(track.endTime,editor.media.duration);
});

test( "createTrack should extend duration of new track till the nearest track if other tracks exist right after it", function() {
  editor.clearTracks();
  editor.seek(20);
  var track = editor.createTrack();

  editor.seek(5);
  track = editor.createTrack();
  equal(editor.numTracks,2);
  equal(track.startTime,5);
  equal(track.endTime,20);
});

test( "currentUnmappedLine should work", function() {
  editor.clearTracks();
  var subtitleLine = subtitleText.currentUnmappedLine();

});

test( "currentUnmappedLine should work", function() {
  editor.clearTracks();
  editor.subtitle.clearMapping();
  var subtitleLine = subtitleText.currentUnmappedLine();

});

test( "createTrack should assign next unassigned subtitle text from subtitle list", function() {
  editor.clearTracks();
  var subtitleLine = subtitleText.currentUnmappedLine();
  editor.seek(1);
  var track = editor.createTrack();
  equal(track.text,subtitleLine.text);
});

test( "changing subtitle text should change the text of track that it is assigned to", function() {
  editor.clearTracks();
  var subtitleLine = subtitle.currentUnmappedLine();
  editor.seek(1);
  var track = editor.createTrack();
  var newText = "Now I'm new";

  subtitleLine.text = newText;
  equal(track.text,newText);
});

test( "endTrack should update endTime of track to currentTime", function() {
  editor.clearTracks();
  editor.seek(3);
  var track = editor.createTrack();
  editor.seek(15);
  editor.endTrack(track);

  equal(track.startTime,3);
  equal(track.endTime,15);
});

test( "endTrack cannot end a track at time less than its startTime", function() {
  editor.clearTracks();
  editor.seek(3);
  var track = editor.createTrack();
  editor.seek(1);
  throws(function() { editor.endTrack(track) });
});

test( "createTrack cannot overlap (identical start & end) ", function() {
  editor.clearTracks();
  editor.seek(3);
  var track = editor.createTrack();
  throws(function() { editor.createTrack() });
});

test( "createTrack cannot overlap (overlap tail) ", function() {
  editor.clearTracks();
  editor.seek(6);
  var track = editor.createTrack();
  editor.seek(10);
  editor.endTrack(track);

  editor.seek(7);
  throws(function() { editor.createTrack() });
});

test( "createTrack cannot overlap (overlap head) ", function() {
  editor.clearTracks();
  editor.seek(1);
  var track = editor.createTrack();
  editor.seek(5);
  editor.endTrack(track);

  editor.seek(4);
  throws(function() { editor.createTrack() });
});

test( "clearTrack should remove all tracks & their trackEvents", function() {
  editor.clearTracks();
  editor.seek(1);
  var track = editor.createTrack();
  editor.seek(5);
  editor.endTrack(track);

  track = editor.createTrack();
  editor.seek(10);
  editor.endTrack(track);

  equal(editor.numTracks,2);

  editor.clearTracks();

  equal(editor.numTracks,0);
  equal(popcorn.getTrackEvents().length,0);
});

// window pane must be 30 seconds long
//   wat if vid is only 7 seconds
// whole timeline must be equal to length of video
//
// [x] subtitle texts must be formatted, start times should be displayed well
// [ ]  click on subtitle line should seek to that track
//        subtitle determines which subtitleline was clicked
//        determine which track it belongs to. and use its start time to seek there
// [ ]  should be able to edit subtitle
// [ ]  inserting in between subtitlelines should work, save load should appear in right order
// [ ]  should have order and when saved and loaded should appear in right order
// [x] click on track should highlight subtitle line
// [x] replace popcorn.subtitle with just our own implementation
// [x] added summary + expanded timeline
// [x] timeline should have progress bar
// [x] summary timeline should have window to indicate where expanded timeline is
// [x] expanded timeline should move itself dynamically when out of bounds
// [x] expanded timeline should have time indicator
// [ ] expanded timeline should have time label every 5 second
// [ ] drag track should modify start/end times and should be reflected in ui
// [x] pressing fill button should show track fill animation
// [x] add window in summary
// [x] show scrubber
// [x] scrubber should  appear on top of any element
// [x] when playing,clicking on any space on timeline should move scrubber to that spot
// [x] when paused, clicking on any space on timeline should move scrubber to that spot
// [ ] double click on subtitle text on video and on subtitle pane should allow you to edit it
// [ ] should let user know if media cannot be loaded
// [ ] should let user know if media is buffering to avoid making them think that our app is slow when in fact its the video loading thats slow
// [ ] should not allow user to create track inside another track
//

