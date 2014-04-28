river.ui.Track = Backbone.View.extend({

  tagName: "div",
  className: "track",

  events: {
    "mousedown": "onMouseDown"
  },

  initialize: function() {
    this.$el.data("model",this.model);

    this.attachViewToContainer();
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

  attachViewToContainer: function() {
    this.getContainer().append(this.$el);
  },

  getContainer: function() {
    throw new Error("TrackView#getContainer not implemented");
  }

});

river.ui.SummaryTrack = river.ui.Track.extend({
  initialize: function() {
    river.ui.Track.prototype.initialize.call(this);
  },

  getContainer: function() {
    return $("#summary.timeline");
  }
});

river.ui.ExpandedTrack = river.ui.Track.extend({
  events: function(){
    return _.extend({},river.ui.Track.prototype.events,{
      "dblclick": "onMouseDblClick",
      "mouseenter": "onMouseEnter",
      "mouseleave": "onMouseLeave",
      "mousedown .close": "onCloseMouseDown"
    });
  },

  initialize: function() {
    river.ui.Track.prototype.initialize.call(this);
    this.setupElement();
  },

  getContainer: function() {
    return $("#expanded.timeline #track_viewport");
  },

  setupElement: function() {
    this.$close = $("<button type='button' class='close corner'>×</button>");
    this.$close.hide();

    this.$el.append(this.$close);

    this.$el.resizable({
      handles: 'e, w',
      resize: this.onResizableResize.bind(this),
      stop: this.onResizableStop.bind(this)
    });

    // http://jsfiddle.net/MrAdE/11/
    // http://eruciform.com/static//jquidragcollide/jquery-ui-draggable-collision.js
    this.$el.draggable({
      cursor: "move",
      axis: "x",
      containment: "parent",
      drag: this.onDraggableDrag.bind(this),
      stop: this.onDraggableStop.bind(this)
    });
  },

  onResizableResize: function(event, ui) {
    Backbone.trigger("trackresize",this.model,ui);
  },

  onResizableStop: function(event, ui) {
    this.model.save();
  },

  onDraggableDrag: function(event, ui) {
    Backbone.trigger("trackdrag",this.model,ui);
  },

  onDraggableStop: function(event, ui) {
    this.model.save();
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
