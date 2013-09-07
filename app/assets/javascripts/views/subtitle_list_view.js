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

var SubtitleListView = Backbone.View.extend({

  tagName: "table",
  className: "table",

  events: {
    "click": "onClickHandler",
    "dblclick": "onDblClickHandler"
  },

  initialize: function() {
    // this.$el.data("model",this.model);
    this.$container = $("#subtitle_list");
    this.setupElement();

    this.listenTo(this.collection,"change",this.onModelChange);
    Backbone.on("subtitletrackmapped",this.onSubtitleTrackMapped.bind(this));
    Backbone.on("trackstart",this.onTrackStart.bind(this));
  },

  setupElement: function() {
    this.$container.append(this.$el);

    var header =     "<tr>" +
                       "<th>Start</th>" +
                       "<th>End</th>" +
                       "<th>Text</th>" +
                     "</tr>";


    this.$el.append(header);
  },

  onSubtitleTrackMapped: function(subtitle) {
    this.renderPosition(subtitle);
  },

  onModelChange: function(subtitle) {
    this.renderPosition(subtitle);
  },

  onClickHandler: function(event) {
    var $target = $(event.target);
    var $subtitle = $target.hasClass("subtitle") ? $target : $target.closest(".subtitle");
    var subtitle = $subtitle.data("model");

    if (subtitle === null) { return; }

    Backbone.trigger("subtitlelineclick",subtitle);
  },

  onDblClickHandler: function(event) {
    var $target = $(event.target);
    var $subtitle = $target.hasClass("subtitle") ? $target : $target.closest(".subtitle");
    var subtitle = $subtitle.data("model");

    if (subtitle === null) { return; }

    Backbone.trigger("subtitlelinedblclick",subtitle);
    subtitle.openEditor(event);
  },

  onTrackStart: function(track) {
    if (this.selectedSubtitle) this.selectedSubtitle.unhighlight();

    var subtitle = track.subtitle;  
    this.selectedSubtitle = subtitle;

    subtitle.highlight();
    this.ensureCorrectWindowPosition(subtitle);
  },

  ensureCorrectWindowPosition: function(subtitle) {
    var $container = this.$container;
    var $el = subtitle.view.$el;

    if (this.isOutOfBounds($container,$el)) {
      this.scrollContainerToElement($container,$el);  
    }
  },

  isOutOfBounds: function($container,$el) {
    var container_top = $container.position().top + $container.scrollTop();
    var container_bottom = container_top + $container.height();

    var el_pos = $el.position().top + $container.scrollTop();

    if (el_pos >= container_top && el_pos <= container_bottom) {
      return false;
    } else {
      return true;
    }
  },

  scrollContainerToElement: function($container,$el) {
    var el_pos = $el.position().top + $container.scrollTop();
    this.$container.animate({scrollTop: el_pos - $container.position().top},300);
  },

  renderPosition: function(subtitle) {
    // render positions of subtitles
    // subtitle are arranged by start time
    // while subtitle.startTime > start time of other people, keep looping until its less than, then thats where u insert it
    // case 1: subtitle must be insert before all
    // case 2: subtitle must be insert after all
    // case 3: subtitle must be insert somewhere in middle
    var fromIndex = this.collection.indexOf(subtitle);
    var toIndex   = this.collection.length - 1;

    for (var i = 0; i < this.collection.length; i++) {

      if (subtitle.startTime() > this.collection.at(i).startTime()) {
        // continue
      } else {
        toIndex = i;
        break;
      }
    };

    if (fromIndex !== toIndex) {
      subtitle.view.$el.insertBefore(this.collection.at(toIndex).view.$el);
      this.collection.move(fromIndex,toIndex);
    }
  },

});
