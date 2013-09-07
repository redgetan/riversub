var TrackView = Backbone.View.extend({

  tagName: "div",
  className: "track",

  events: {
    "mousedown": "onMouseDown"
  },

  initialize: function() {
    this.$el.data("model",this.model);

    this.listenTo(this.model, "change", this.render);
  },

  addGhost: function() {
    this.$el.addClass("ghost");
  },

  removeGhost: function() {
    this.$el.removeClass("ghost");
  },

  highlight: function() {
    this.$el.addClass("selected");
  },

  unhighlight: function() {
    this.$el.removeClass("selected");
  },

  onMouseDown: function() {
    Backbone.trigger("trackseek",this.model.startTime());
  },

  render: function() {
    // clean way of doing it?
    this.subtitle.view.render();
  }

});

var SummaryTrackView = TrackView.extend({
  initialize: function() {
    TrackView.prototype.initialize.call(this);
    this.$container = $("#summary.timeline");
    this.setupElement();
  },
  setupElement: function() {
    this.$container.append(this.$el);
  }
});

var ExpandedTrackView = TrackView.extend({
  events: function(){
    return _.extend({},TrackView.prototype.events,{
      "dblclick": "onMouseDblClick",
      "mouseenter": "onMouseEnter",
      "mouseleave": "onMouseLeave",
      "mousedown .close": "onCloseMouseDown"
    });
  },

  initialize: function() {
    TrackView.prototype.initialize.call(this);
    this.$container = $("#expanded.timeline #track_viewport");
    this.setupElement();
  },

  setupElement: function() {
    this.$container.append(this.$el);
    this.$close = $("<button type='button' class='close corner'>×</button>");
    this.$close.hide();

    this.$el.append(this.$close);

    this.$el.resizable({
      handles: 'e, w',
      resize: this.onResizableResize.bind(this)
    });

    this.$el.draggable({
      cursor: "move",
      axis: "x",
      containment: "parent",
      drag: this.onDraggableDrag.bind(this)
    });
  },

  onResizableResize: function(event, ui) {
    Backbone.trigger("trackresize",this.model,ui);
  },

  onDraggableDrag: function(event, ui) {
    Backbone.trigger("trackdrag",this.model,ui);
  },

  onMouseDblClick: function(event) {
    Backbone.trigger("subtitleeditmode",this.model);
  },

  onMouseEnter: function(event) {
    this.$close.show();
  },

  onMouseLeave: function(event) {
    this.$close.hide();
  },

  onCloseMouseDown: function(event) {
    event.stopPropagation();
    this.model.remove();
  },

  fadingHighlight: function() {
    this.$el.effect("highlight", {color: "moccasin"}, 1000);
  }

});
