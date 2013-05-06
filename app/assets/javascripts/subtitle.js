function SubtitleView(subtitles,editor) {
  this.editor = editor;
  this.orderedLineKeys = [];
  this.subtitles = {};

  this.setupElement(subtitles);
  this.selectedSubtitle = null;

  this.bindEvents();
}

SubtitleView.prototype = {

  setupElement: function(subtitles) {
    this.$container = $("#subtitle_container");

    this.createSubtitles(subtitles);

    if (Object.keys(subtitles).length === 0) {
      this.createSubtitleForm();
    }
  },

  createSubtitles: function(subtitles) {
    var result = {};
    var subtitle;

    for (var i = 0; i < subtitles.length; i++) {
      subtitle = new Subtitle(subtitles[i]);
      result[subtitle.attributes.id] = subtitle;
      this.orderedLineKeys.push(subtitle.attributes.id);
    };
    
    this.subtitles = result;
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
  },

  onClickHandler: function(event) {
    var $target = $(event.target);
    var $subtitle = $target.hasClass("subtitle") ? $target : $target.closest(".subtitle");
    var subtitle= this.subtitles[$subtitle.attr("id")];

    if (typeof subtitle === "undefined") { return; }

    if (subtitle.track != null) {
      this.highlightLine(subtitle);
      this.$container.trigger("subtitlelineclick",[subtitle]);
    }
  },

  onFormSubmit: function(event) {
    event.preventDefault();

    $.ajax({
      url: "/songs/" + this.editor.song.id + "/subtitles",
      type: "POST",
      data: this.$form.serialize(),
      dataType: "json",
      success: function(data) {
        this.$form.remove();
        this.createSubtitles(data);
      }.bind(this),
      error: function(data) {
        alert(data.responseText);
      }
    });
  },

  onTrackChange: function(event,track) {
    track.subtitle.render();
  },

  onSubtitleRemove: function(event, subtitleId) {
    delete this.subtitles[subtitleId];
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
  nextUnmappedSubtitle: function() {
    var target = this.findFirst(this.subtitles,function(subtitle){
      return subtitle.$el.hasClass("mapped") === false;
    });

    return target;
  },

  findFirst: function(subtitles,fn) {
    var key;
    var value = null;
    var conditionSatisfied;

    for (var i = 0; i < this.orderedLineKeys.length; i++) {
      key = this.orderedLineKeys[i];
      value = subtitles[key];
      conditionSatisfied = fn(value);
      if (conditionSatisfied) {
        break;
      }
    };

    return value;
  }

};

// should listen to changes in track startTime and endTime to rerender
function Subtitle(attributes) {
  this.attributes = attributes;
  this.track = null;
  this.setupElement();
  this.isDeleted = false;
  this.bindEvents();
}

Subtitle.prototype = {

  setupElement: function() {

    this.$container = $("#subtitle_container");

    var el = "<div id='" + this.attributes.id + "' class='subtitle'>" +
      "<div class='start_time'></div>" +
      // "<div class='end_time'></div>" +
      "<div class='text'></div>" +
      "<button type='button' class='close'>×</button>" +
      "</div>";
    this.$el = $(el);
    this.$container.append(this.$el);

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

  remove: function() {
    // remove subtitle element 
    this.$el.remove();
    // remove track if its mapped to a track
    if (this.track !== null ) {
      this.track.remove();
    }
    // mark subtitle as isDeleted
    this.isDeleted = true;

    $(document).trigger("subtitleremove",this.attributes.id);
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
      // this.$el.find(".end_time").text(this.track.endTime());
    } else {
      this.$el.find(".start_time").text("");
      // this.$el.find(".end_time").text("");
    }
    this.$el.find(".text").text(this.attributes.text);
  },

  setTrack: function(track) {
    this.track = track;
    this.$el.addClass("mapped");
    this.render();
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
