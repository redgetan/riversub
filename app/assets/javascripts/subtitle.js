function Subtitle(text) {
  this.lines = this.extractLines(text);
  this.currentUnmappedIndex = 0;
}

Subtitle.prototype = {

  extractLines: function(text) {
    var lines = text.split("\n");
    var subtitleLines = [];

    for (var i = 0; i < lines.length; i++) {
      subtitleLines.push(new SubtitleLine(lines[i]));
    };

    return subtitleLines;

  },

  nextUnmappedLine: function() {
    var subtitleLine = this.lines[this.currentUnmappedIndex];
    this.currentUnmappedIndex++;
    return subtitleLine;
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

    this.$container = $("#subtitle");
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
  },

  highlight: function() {
    //remove any existing highlights on neighboring elements
    var $selected = this.$container.find(".subtitle_line.selected");
    if ($selected.length !== 0) {
      $selected.first().removeClass("selected");
    }
    this.$el.addClass("selected");
  }

};
