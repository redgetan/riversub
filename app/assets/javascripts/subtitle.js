function Subtitle(text) {
  this.orderedLineKeys = [];
  this.lines = this.extractLines(text);
  this.selectedLine = null;

  this.$container = $("#subtitle_container");
  this.bindEvents();
}

Subtitle.prototype = {

  extractLines: function(text) {
    var lines = {};
    var subtitleLine;

    var textLines = text.split("\n");
    for (var i = 0; i < textLines.length; i++) {
      subtitleLine = new SubtitleLine(textLines[i]);
      lines[subtitleLine.id] = subtitleLine;
      this.orderedLineKeys.push(subtitleLine.id);
    };

    return lines;

  },

  bindEvents: function() {
    this.$container.on("click",this.onClickHandler.bind(this));
  },

  onClickHandler: function(event) {
    var $target = $(event.target);
    var $line = $target.hasClass("subtitle_line") ? $target : $target.closest(".subtitle_line");
    var subtitleLine = this.lines[$line.attr("id")];

    if (subtitleLine.track != null) {
      this.highlightLine(subtitleLine);
      this.$container.trigger("subtitlelineclick",[subtitleLine]);
    }
  },

  highlightLine: function(subtitleLine) {
      if (this.selectedLine != null ) { 
        this.selectedLine.unhighlight();
      }
      this.selectedLine = subtitleLine;
      subtitleLine.highlight();
  },

  // find one that is not yet mapped
  nextUnmappedLine: function() {
    var target = this.findFirst(this.lines,function(line){
      return line.$el.hasClass("mapped") === false;
    });

    return target;
  },

  findFirst: function(lines,fn) {
    var key;
    var value = null;
    var conditionSatisfied;

    for (var i = 0; i < this.orderedLineKeys.length; i++) {
      key = this.orderedLineKeys[i];
      value = lines[key];
      conditionSatisfied = fn(value);
      if (conditionSatisfied) {
        break;
      }
    };

    return value;
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
      // "<div class='end_time'></div>" +
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
      // this.$el.find(".end_time").text(this.track.endTime());
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
