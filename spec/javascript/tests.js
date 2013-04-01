var popcorn = Popcorn("#video");
var editor = new Editor(popcorn);

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


