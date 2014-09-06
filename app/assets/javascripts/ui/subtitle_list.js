river.ui.SubtitleList = Backbone.View.extend({

  tagName: "div",
  className: "table",

  events: {
    "click": "onClickHandler",
    "dblclick": "onDblClickHandler"
  },

  initialize: function() {
    // this.$el.data("model",this.model);
    this.$container = $("#subtitle_list");
    this.setupElement();

    this.listenTo(this.collection,"add",this.onModelAdd);
    this.listenTo(this.collection,"change",this.onModelChange);
    Backbone.on("trackstart",this.onTrackStart.bind(this));
  },

  setupElement: function() {
    this.$container.append(this.$el);

    var header =     "<div class='header clear'>" +
                       "<div>Start</div>" +
                       "<div>End</div>" +
                       "<div id='original'>Original</div>" +
                       "<div id='header_text'>Text</div>" +
                     "</div>";


    this.$el.append(header);
  },

  onModelAdd: function(subtitle) {
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
    var index = this.collection.indexOf(subtitle);

    var $subtitle = subtitle.view.$el;
    // find which subtitle is currently at that position
    var $subtitleAtTargetIndex = this.$el.find(".subtitle").eq(index);

    if ($subtitleAtTargetIndex.length === 0) {
      // there is no view in that index yet, so just append it
      this.$el.append(subtitle.view.$el);
    } else if ($subtitleAtTargetIndex[0] !== $subtitle[0]) {
      $subtitle.insertBefore($subtitleAtTargetIndex);
    } else {

    }
  },

});
