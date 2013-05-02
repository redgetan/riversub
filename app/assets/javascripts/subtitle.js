function SubtitleView(subtitles,editor) {
  this.editor = editor;
  this.orderedLineKeys = [];

  this.setupElement(subtitles);
  this.selectedSubtitle = null;

  this.bindEvents();
}

SubtitleView.prototype = {

  setupElement: function(subtitles) {
    this.$container = $("#subtitle_container");

    this.subtitles = this.createSubtitles(subtitles);

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

    return result;

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
}

Subtitle.prototype = {

  setupElement: function() {

    this.$container = $("#subtitle_container");

    var el = "<div id='" + this.attributes.id + "' class='subtitle'>" +
      "<div class='start_time'></div>" +
      // "<div class='end_time'></div>" +
      "<div class='text'></div>" +
      "</div>";
    this.$el = $(el);
    this.$container.append(this.$el);
    this.render();
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

  removeTrack: function() {
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
