function Subtitle(text) {
  this.lines = this.extractLines(text);
}

Subtitle.prototype = {

  extractLines: function(text) {
    var textLines = text.split("\n");
    var lines = [];

    for (var i = 0; i < textLines.length; i++) {
      lines.push(new SubtitleLine(textLines[i]));
    };

    return lines;

  },

  // find one that is not yet mapped
  nextUnmappedLine: function() {
    for (var i = 0; i < this.lines.length; i++) {
      if ( this.lines[i].$el.hasClass("mapped") === false ) {
        return this.lines[i];
      }
    };
  }

};

// should listen to changes in track startTime and endTime to rerender
function SubtitleLine(text) {
  this.id = this.generateGuid();
  this.text = text;
  this.track = null;
  this.setupElement();
}

SubtitleLine.prototype = {

  setupElement: function() {

    this.$container = $("#subtitle_container");
    var el = "<div id='" + this.id + "' class='subtitle_line'>" +
      "<div class='start_time'></div>" +
      "<div class='end_time'></div>" +
      "<div class='text'></div>" +
      "</div>";
    this.$el = $(el);
    this.$container.append(this.$el);
    this.render();
  },

  generateGuid: function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  },

  render: function() {
    if (this.track !== null ) {
      this.$el.find(".start_time").text(this.track.startTime());
      this.$el.find(".end_time").text(this.track.endTime());
    }
    this.$el.find(".text").text(this.text);
  },

  setTrack: function(track) {
    this.track = track;
    this.$el.addClass("mapped");
  },

  removeTrack: function() {
    this.track = null;
    this.$el.removeClass("mapped");
  },

  highlight: function() {
    this.$el.addClass("selected");
  },

  unhighlight: function() {
    this.$el.removeClass("selected");
  }

};
