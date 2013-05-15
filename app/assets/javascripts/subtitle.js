Array.prototype.move = function (old_index, new_index) {
    if (new_index >= this.length) {
        var k = new_index - this.length;
        while ((k--) + 1) {
            this.push(undefined);
        }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this; // for testing purposes
};

function SubtitleView(subtitles,editor) {
  this.editor = editor;
  this.subtitles = [];

  this.setupElement(subtitles);
  this.selectedSubtitle = null;

  this.bindEvents();
}

SubtitleView.prototype = {

  setupElement: function(subtitles) {
    this.$container = $("#subtitle_container");
    // if (Object.keys(subtitles).length === 0) {
    //   this.createSubtitleForm();
    // }
  },

  // createSubtitles: function(subtitles) {
  //   for (var i = 0; i < subtitles.length; i++) {
  //     this.createSubtitle(subtitles[i]);
  //   };
  // },

  createSubtitle: function(subtitle) {
    var subtitle = new Subtitle(subtitle);
    this.subtitles.push(subtitle);
    return subtitle;
  },

  render: function(subtitle) {
    // render positions of subtitles
    // subtitle are arranged by start time
    // while subtitle.startTime > start time of other people, keep looping until its less than, then thats where u insert it
    // case 1: subtitle must be insert before all
    // case 2: subtitle must be insert after all
    // case 3: subtitle must be insert somewhere in middle
    var fromIndex = this.subtitles.indexOf(subtitle);
    var toIndex   = this.subtitles.length - 1;

    for (var i = 0; i < this.subtitles.length; i++) {

      if (subtitle.startTime() > this.subtitles[i].startTime()) {
        // continue
      } else {
        toIndex = i;
        break;
      }
    };

    if (fromIndex !== toIndex) {
      subtitle.$el.insertBefore(this.subtitles[toIndex].$el);
      this.subtitles.move(fromIndex,toIndex);
    }
  },

  createSubtitleForm: function() {
    var el = "<form id='transcript'>" + 
               "<textarea id='transcript' name='transcript' rows='12' cols='10' placeholder='Paste Transcript here'></textarea>" +
               "<input class='btn' type='submit' value='Submit'>" +
             "</form>";
    this.$container.append(el);

    this.$form = this.$container.find("form#transcript");
  },

  bindEvents: function() {
    this.$container.on("click",this.onClickHandler.bind(this));

    if (typeof this.$form !== "undefined") { 
      this.$form.on("submit",this.onFormSubmit.bind(this));
    }
    
    $(document).on("trackchange",this.onTrackChange.bind(this));
    $(document).on("subtitleremove",this.onSubtitleRemove.bind(this));
    $(document).on("subtitletrackmapped",this.onSubtitleTrackMapped.bind(this));
  },

  onClickHandler: function(event) {
    var $target = $(event.target);
    var $subtitle = $target.hasClass("subtitle") ? $target : $target.closest(".subtitle");
    var subtitle = $subtitle.data("model"); 

    if (subtitle === null) { return; }

    if (subtitle.track != null) {
      this.highlightLine(subtitle);
      this.$container.trigger("subtitlelineclick",[subtitle]);
    }
  },

  // onFormSubmit: function(event) {
  //   event.preventDefault();

  //   $.ajax({
  //     url: "/songs/" + this.editor.song.id + "/subtitles",
  //     type: "POST",
  //     data: this.$form.serialize(),
  //     dataType: "json",
  //     success: function(data) {
  //       this.$form.remove();
  //       this.createSubtitles(data);
  //     }.bind(this),
  //     error: function(data) {
  //       alert(data.responseText);
  //     }
  //   });
  // },

  onTrackChange: function(event,track) {
    track.subtitle.render();
  },

  onSubtitleRemove: function(event, subtitleId) {
    delete this.subtitles[subtitleId];
  },

  onSubtitleTrackMapped: function(event, subtitle) {
    this.render(subtitle);
  },

  find: function(id) {
    return this.subtitles[id];
  },

  highlightLine: function(subtitle) {
      if (this.selectedSubtitle != null ) { 
        this.selectedSubtitle.unhighlight();
      }
      this.selectedSubtitle = subtitle;
      subtitle.highlight();
  },

  // find one that is not yet mapped
  // nextUnmappedSubtitle: function() {
  //   var target = this.findFirst(this.subtitles,function(subtitle){
  //     return subtitle.$el.hasClass("mapped") === false;
  //   });

  //   return target;
  // },

  // findFirst: function(subtitles,fn) {
  //   var key;
  //   var value = null;
  //   var conditionSatisfied;

  //   for (var i = 0; i < this.orderedLineKeys.length; i++) {
  //     key = this.orderedLineKeys[i];
  //     value = subtitles[key];
  //     conditionSatisfied = fn(value);
  //     if (conditionSatisfied) {
  //       break;
  //     }
  //   };

  //   return value;
  // }


};

// should listen to changes in track startTime and endTime to rerender
function Subtitle(attributes) {
  this.track = null;
  this.setupElement();
  this.setAttributes(attributes);
  this.isDeleted = false;
  this.bindEvents();
}

Subtitle.prototype = {

  setAttributes: function(attributes) {
    for (var prop in attributes) {
      this[prop] = attributes[prop];  
      if (prop === "text") {
        if (this.track !== null ) {
          this.track.isSaved = false;
          this.$el.trigger("trackchange",[this.track]);
        }
      }
    }
    this.render();
  },

  getAttributes: function() {
    return {
      id:   this.id,
      text: this.text
    }
  },

  // generateGuid: function() {
  //   'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  //     var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
  //     return v.toString(16);
  //   });
  // },

  setupElement: function() {

    this.$container = $("#subtitle_container");

    var el = "<div class='subtitle'>" +
      "<div class='start_time'></div>" +
      "<div class='end_time'></div>" +
      "<div class='text'></div>" +
      "<button type='button' class='close'>×</button>" +
      "</div>";
    this.$container.append(el);

    this.$el = this.$container.find(".subtitle").last();
    this.$el.data("model",this);

    this.$close = this.$el.find(".close");
    this.$close.hide();

    this.render();
  },

  bindEvents: function() {
    this.$el.on("mouseenter",this.onMouseEnter.bind(this));
    this.$el.on("mouseleave",this.onMouseLeave.bind(this));
    this.$close.on("click",this.onCloseClick.bind(this));
  },

  onCloseClick: function() {
    this.remove();
  },

  startTime: function() {
    return this.track.startTime();
  },

  endTime: function() {
    return this.track.endTime();
  },

  remove: function() {
    // remove subtitle element 
    this.$el.remove();
    // remove track if its mapped to a track
    if (this.track.isDeleted === false ) {
      this.track.remove();
    }
    // mark subtitle as isDeleted
    this.isDeleted = true;

    $(document).trigger("subtitleremove",this.id);
  },

  onMouseEnter: function() {
    this.$close.show();
  },

  onMouseLeave: function() {
    this.$close.hide();
  },

  render: function() {
    if (this.track !== null ) {
      this.$el.find(".start_time").text(this.track.startTime());
      if (!this.track.isGhost()) {
        this.$el.find(".end_time").text(this.track.endTime());
      }
    } else {
      this.$el.find(".start_time").text("");
      this.$el.find(".end_time").text("");
    }
    this.$el.find(".text").text(this.text);
  },

  setTrack: function(track) {
    this.track = track;
    this.$el.addClass("mapped");
    this.render();
    this.$el.trigger("subtitletrackmapped",[this]);
  },

  unmapTrack: function() {
    this.track = null;
    this.$el.removeClass("mapped");
    this.render();
  },

  highlight: function() {
    this.$el.addClass("selected");
  },

  unhighlight: function() {
    this.$el.removeClass("selected");
  }

};
