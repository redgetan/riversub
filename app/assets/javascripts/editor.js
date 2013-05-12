function Editor (song) {
  this.song = song;
  this.setupElement();
  this.defineAttributeAccessors();

  this.isKeydownPressed = false;
  this.currentTrack = null;

  this.subtitleView = new SubtitleView($.map(song.timings,function(timing){ return timing.subtitle; }),this);
  this.timeline = new Timeline();

  this.popcorn = this.loadMedia(song.media_sources[0].url);

  this.trackMap = {}
  this.tracks = this.loadTracks(song.timings);
  this.timeline.setTracks(this.tracks);

  this.changes = {
    tracks: {
      creates: [],
      updates: [],
      deletes: []
    },
    subtitles: {
      creates: [],
      updates: [],
      deletes: []
    }
  };

  this.bindEvents();

}

Editor.prototype = {

  setupElement: function() {
    this.$container = $("#main_container");
    var el =
      "<div id='editor'>" +
        "<div id='editor-top' class='row'>" +
          "<div id='editor-top-left' class='span6'>" +
            "<div id='media_container'>" +
              "<div id='media'><div id='iframe_overlay'></div></div>" +
              "<div id='subtitle_bar' class='span6 center'>" +
                "<div id='subtitle_display'></div>" +
                "<input id='subtitle_edit' class='span5 center' type='text' placeholder='Enter Subtitle Here'>" +
              "</div>" +
              "<div id='controls' class='row'>" +
                "<div class='pull-left span1'>" +
                  "<button type='button' id='play_btn' class='btn'><i class='icon-play'></i></button>" +
                  "<button type='button' id='pause_btn' class='btn'><i class='icon-pause'></i></button>" +
                "</div>" +
                "<div class='btn-group pull-right'>" +
                  "<a id='save_btn' class='btn'><i class='icon-save'></i> Save</a>" +
                  "<a id='download_btn' class='btn' href='/songs/" + this.song.id + "/timings'><i class='icon-download-alt'></i> Download</a>" +
                  "<a data-toggle='modal' data-target='#myModal' class='btn'><i class='icon-question-sign'></i> Help</a>" +
                "</div>" +
              "</div>" +
            "</div>" +
          "</div>" +
          "<div id='editor-top-right' class='span6'>" +
            "<div id='subtitle_container'></div>" +
          "</div>" +
        "</div>" +
        "<div id='editor-bottom' class='row'>" +
          "<div class='span12'>" +
            "<div id='timeline_container'></div>" +
          "</div>" +
        "</div>" +
      "</div>";

    this.$container.append(el);

    this.$el = $("#editor");

    this.$subtitleBar = $("#subtitle_bar");

    this.$saveBtn = $("#save_btn");
    this.$saveBtn.attr("disabled","disabled");

    this.$playBtn = $("#play_btn");
    this.$pauseBtn = $("#pause_btn");
    this.$pauseBtn.hide();

    this.$subtitleDisplay = $("#subtitle_display");

    this.$subtitleEdit = $("#subtitle_edit");
    this.$subtitleEdit.hide();

    this.$iframeOverlay = $("#iframe_overlay");
  },

  defineAttributeAccessors: function() {
    Object.defineProperty( this, "numTracks", {
      get: function() {
        return this.tracks.length;
      },
      enumerable: true
    });

    Object.defineProperty( this, "media", {
      get: function() {
        return this.popcorn.media;
      },
      enumerable: true
    });
  },

  loadMedia: function(url) {
    var popcorn = Popcorn.smart("div#media",url);
    this.timeline.setMedia(popcorn.media);
    return popcorn;
  },

  bindEvents: function() {
    $(document).on("keydown",this.onKeydownHandler.bind(this));
    $(document).on("keyup",this.onKeyupHandler.bind(this));
    $(document).on("timelineseek",this.onTimelineSeekHandler.bind(this));
    $(document).on("subtitlelineclick",this.onSubtitleLineClick.bind(this));
    $(document).on("trackstart",this.onTrackStart.bind(this));
    $(document).on("trackend",this.onTrackEnd.bind(this));
    $(document).on("trackchange",this.onTrackChange.bind(this));
    $(document).on("trackremove",this.onTrackRemove.bind(this));
    $(document).on("subtitleremove",this.onSubtitleRemove.bind(this));
    $(document).on("pauseadjust",this.onPauseAdjust.bind(this));
    this.$saveBtn.on("click",this.onSaveBtnClick.bind(this));
    this.$playBtn.on("click",this.onPlayBtnClick.bind(this));
    this.$pauseBtn.on("click",this.onPauseBtnClick.bind(this));
    this.$iframeOverlay.on("click",this.onIframeOverlayClick.bind(this));
    this.$subtitleEdit.on("focus",this.onSubtitleEditFocus.bind(this));
    this.$subtitleEdit.on("blur",this.onSubtitleEditBlur.bind(this));
    this.$subtitleEdit.on("keydown",this.onSubtitleEditKeydown.bind(this));
    this.$subtitleEdit.on("keyup",this.onSubtitleEditKeyup.bind(this));
    this.$subtitleDisplay.on("dblclick",this.onSubtitleDisplayDblClick.bind(this));
  },

  onKeydownHandler: function(event) {
    // space key
    if (event.which === 32) {
      if (!this.isKeydownPressed) {
        this.currentTrack = this.createGhostTrack();
        this.$el.trigger("marktrackstart",[this.currentTrack]);
        this.isKeydownPressed = true;
      }
    }
  },

  onKeyupHandler: function(event) {
    // space key
    if (event.which === 32) {
      try {
        this.$el.trigger("marktrackend");
        this.endGhostTrack(this.currentTrack);
        // this.$subtitleEdit.show();
      } catch (e) {
        console.log(e.stack);
        console.log("Removing invalid track");
        this.currentTrack.remove();
        this.tracks.pop();
      }
      this.isKeydownPressed = false;

    }

    // // space key
    // if (event.which === 32) {
    //   if (!this.$playBtn.is(':hidden')) {
    //     this.$playBtn.trigger("click");
    //   } else {
    //     this.$pauseBtn.trigger("click");
    //   }
    // }
  },

  onTimelineSeekHandler: function(event,time) {
    this.seek(time);
  },

  onPauseAdjust: function(event,correctPauseTime) {
  },

  onSubtitleLineClick: function(event,subtitle) {
    this.seek(subtitle.track.startTime());
  },

  onTrackChange: function(track) {
    this.$saveBtn.removeAttr("disabled");
  },

  onTrackStart: function(event,track) {
    this.currentTrack = track;
    if (this.edit_sub_mode) {
      this.$subtitleEdit.focus();
    }
  },

  onTrackEnd: function(event,track) {
    if (typeof track.subtitle.text === "undefined" || /^\s*$/.test(track.subtitle.text) ) {
      // if playing, pause playback to let user type subtitle
      if (!this.$pauseBtn.is(':hidden')) {
        this.$pauseBtn.trigger("click");
        // we want to seek to a few millseconds before end just so 
        // 1. that the text from input would disappear triggered by the end event of track
        // 2. scrubber is positioned nicely inside track instead of a bit outside.
        //    this is to indicated were editing subtitle of that track
        var time = Math.floor((this.currentTrack.endTime() - 0.01) * 1000) / 1000;
        this.seek(time);
        // seeking will trigger trackEvent.start which will show subtitle edit input, only then do we focus
        // but we also want to avoid focus on normal trackEvent.start, so we only focus on case where user just ended 
        // the track and is about to edit sub
        this.edit_sub_mode = true;
      } 
    }
  },

  onTrackRemove: function(event,trackId) {
    // removing a track that is not yet saved in server
    if (typeof trackId === "undefined") {
      return;  
    }
    this.changes["tracks"]["deletes"].push(trackId);
    this.$saveBtn.removeAttr("disabled");
  },

  onSubtitleRemove: function(event,subtitleId) {
    // removing a subtitle that is not yet saved in server
    if (typeof subtitleId === "undefined") {
      return;  
    }
    this.changes["subtitles"]["deletes"].push(subtitleId);
    this.$saveBtn.removeAttr("disabled");
  },

  onIframeOverlayClick: function(event) {
    if (!this.$playBtn.is(':hidden')) {
      this.$playBtn.trigger("click");
    } else {
      this.$pauseBtn.trigger("click");
    }
  },

  onSubtitleEditFocus: function(event) {
    $(document).off("keydown");
    $(document).off("keyup");
  },

  onSubtitleEditBlur: function(event) {
    $(document).on("keydown",this.onKeydownHandler.bind(this));
    $(document).on("keyup",this.onKeyupHandler.bind(this));
  },

  onSubtitleEditKeydown: function(event) {
    var text = this.$subtitleEdit.val();
    this.currentTrack.subtitle.setAttributes({ "text": text})
  },

  onSubtitleEditKeyup: function(event) {
    // enter key
    if (event.which == 13) {
      this.$subtitleEdit.blur();  
      var text = this.$subtitleEdit.val();
      this.$subtitleEdit.hide();  
      this.$subtitleDisplay.text(text);  
      this.$subtitleDisplay.show();  

      // if puased, resume playback 
      if (!this.$playBtn.is(':hidden')) {
        this.$playBtn.trigger("click");
      } 



      this.edit_sub_mode = false;
    }
  },

  onSubtitleDisplayDblClick: function(event) {
    var text = this.$subtitleDisplay.text();  
    this.$subtitleEdit.val(text);
    this.$subtitleDisplay.hide();  
    this.$subtitleEdit.show();
    this.$subtitleEdit.focus();
  },

  onPlayBtnClick: function(event) {
    this.popcorn.play();
    this.$playBtn.hide();
    this.$pauseBtn.show();
  },

  onPauseBtnClick: function(event) {
    this.popcorn.pause();
    this.$pauseBtn.hide();
    this.$playBtn.show();
  },

  onSaveBtnClick: function(event) {
    if (this.$saveBtn.attr("disabled") === "disabled") {
      return;
    } else {
      this.$saveBtn.attr("disabled","disabled");
    }

    // save subtitles
    // if (this.changes["subtitles"]["creates"].length > 0 ) {
    //   $.ajax({
    //     url: "/songs/" + this.song.id +"/subtitles",
    //     type: "POST",
    //     data: { subtitles: this.changes["subtitles"]["creates"].attributes },
    //     dataType: "json",
    //     success: function(data) {
    //       this.setSubtitleIds(data);
    //       this.$saveBtn.attr("disabled", "disabled");
    //     }.bind(this),
    //     error: function(data,e,i) {
    //       try {
    //         var result = JSON.parse(data);
    //         this.setSubtitleIds(result.created);
    //         alert(result.error);
    //       } catch (e) {
    //         alert(data.responseText);
    //       }
    //     }
    //   });
    // }

    // save timings and subtitles

    var track;
    for (var i = 0; i < this.tracks.length; i++) {
      track = this.tracks[i];
      // add track to creates/updates list
      if (!track.isSaved) {
        if (typeof track.getAttributes().id === "undefined") {
          this.changes["tracks"]["creates"].push(track);
        } else {
          this.changes["tracks"]["updates"].push(track);
        }
      } 
    };

    if (this.changes["tracks"]["creates"].length > 0 ) {
      $.ajax({
        url: "/songs/" + this.song.id +"/timings",
        type: "POST",
        data: { timings: $.map(this.changes["tracks"]["creates"],function(track){ return track.getAttributes(); } ) },
        dataType: "json",
        success: function(data) {
          this.setIds(data);
          this.$saveBtn.attr("disabled", "disabled");
        }.bind(this),
        error: function(data,e,i) {
          try {
            var result = JSON.parse(data);
            this.setIds(result.created);
            alert(result.error);
            this.$saveBtn.removeAttr("disabled");
          } catch (e) {
            alert(data.responseText);
          }
        }
      });
    }

    if (this.changes["tracks"]["updates"].length > 0 ) {
      $.ajax({
        url: "/songs/" + this.song.id +"/timings",
        type: "PUT",
        data: { timings: $.map(this.changes["tracks"]["updates"],function(track){ return track.getAttributes(); } ) },
        dataType: "json",
        success: function(timings) {
          for (var i = 0; i < timings.length; i++) {
            timings[i].isSaved = true;
          }
          this.$saveBtn.attr("disabled", "disabled");
        }.bind(this),
        error: function(data,e,i) {
          try {
            var result = JSON.parse(data);
            this.setIds(result.updated);
            alert(result.error);
            this.$saveBtn.removeAttr("disabled");
          } catch (e) {
            alert(data.responseText);
          }
        }
      });
    }

    if (this.changes["tracks"]["deletes"].length > 0 ) {
      $.ajax({
        url: "/songs/" + this.song.id +"/timings",
        type: "DELETE",
        data: { timings: this.changes["tracks"]["deletes"] },
        dataType: "json",
        success: function(timings) {
          this.$saveBtn.attr("disabled", "disabled");
        }.bind(this),
        error: function(data,e,i) {
          try {
            var result = JSON.parse(data);
            alert(result.error);
            this.$saveBtn.removeAttr("disabled");
          } catch (e) {
            alert(data.responseText);
          }
        }
      });
    }

  },

  seek: function(time) {
    this.popcorn.currentTime(time);
  },

  loadTracks: function(timings) {
    var tracks = [];

    if (typeof timings !== "undefined") {
      for (var i = 0; i < timings.length; i++) {
        var track = new Track(timings[i],this, { isSaved: true });
        this.trackMap[track.getAttributes().client_id] = track;
        tracks.push(track);
      };
    }

    return tracks;
  },

  createGhostTrack: function() {
    var startTime = Math.round(this.media.currentTime * 1000) / 1000;
    var endTime   = this.determineEndTime(startTime);

    this.validateNoTrackOverlap(startTime,endTime);

    var attributes = {
      start_time: startTime,
      end_time: endTime
    };

    var track = new Track(attributes, this, { "isGhost": true});
    this.trackMap[track.getAttributes().client_id] = track;
    this.tracks.push(track);
    return track;
  },

  endGhostTrack: function(track) {
    var time = Math.round(this.media.currentTime * 1000) / 1000;
    track.end(time);
  },

  /*
   *   startTime should not be less than any existing track endTime
   *   endTime should not be greater than any existing track startTime
   */
  validateNoTrackOverlap: function(startTime,endTime) {
    for (var i = this.tracks.length - 1; i >= 0; i--) {
      if (startTime >= this.tracks[i].startTime && startTime < this.tracks[i].endTime ||
          endTime   <= this.tracks[i].endTime   && endTime   > this.tracks[i].startTime) {
            throw "Track Overlap Detected. Track(" + startTime + "," + endTime + ") " +
              "would overlap with " + this.tracks[i].toString();
          }
    };

  },

  showSubtitleEdit: function() {
    this.$subtitleEdit.show();
  },

  hideSubtitleEdit: function() {
    this.$subtitleEdit.hide();
  },

  // either the end of media or the starttime next nearest track
  determineEndTime: function(startTime) {
    var nextNearestEdgeTime = this.media.duration;

    for (var i = this.tracks.length - 1; i >= 0; i--) {
      if (this.tracks[i].startTime() > startTime && this.tracks[i].startTime() < nextNearestEdgeTime) {
        nextNearestEdgeTime = this.tracks[i].startTime();
      }
    };

    return nextNearestEdgeTime;
  },

  setIds: function(timings) {
    var track;
    for (var i = 0; i < timings.length; i++) {
      track = this.trackMap[timings[i].client_id];
      track.id = timings[i].id;
      track.subtitle.id = timings[i].subtitle.id;
      track.isSaved = true;
    };
  },

  clearTracks: function(time) {
    for (var i = this.tracks.length - 1; i >= 0; i--) {
      this.tracks[i].remove();
    };

    this.tracks.length = 0;
  }
}
