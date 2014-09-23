river.ui.Track = Backbone.View.extend({

  tagName: "div",
  className: "track",

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
      "dblclick": "onMouseClick",
      "mouseenter": "onMouseEnter",
      "mouseleave": "onMouseLeave",
      "mousedown .close": "onCloseMouseDown"
    });
  },

  initialize: function() {
    river.ui.Track.prototype.initialize.call(this);
    this.setupElement();
    this.bindEvents();
    this.render();

    this.listenTo(this.model,"change",this.render);
    this.listenTo(this.model.subtitle,"change",this.render);
  },

  render: function() {
    if (this.model.text()) {
      this.$textDisplay.val(this.model.text());
      river.utility.resizeInput.bind(this.$textDisplay).call();
    }
  },

  getContainer: function() {
    return $("#expanded.timeline #track_viewport");
  },

  setupElement: function() {
    this.$close = $("<button type='button' class='close corner'>×</button>");
    this.$close.css("position", "absolute");
    this.$close.hide();
    this.$el.append(this.$close);

    this.$textDisplay = $("<input class='track_text' placeholder='Enter Text'>");
    this.$textDisplay.attr("maxlength", 90);
    
    this.$el.append(this.$textDisplay);
  },

  bindEvents: function() {
    this.$textDisplay.on("keydown", river.utility.resizeInput);
    this.$textDisplay.on("focus", this.onTextDisplayFocus.bind(this));
    this.$textDisplay.on("blur", this.onTextDisplayBlur.bind(this));
    this.$textDisplay.on("keyup", this.onTextDisplayKeyup.bind(this));
    this.$el.hover(
      this.onTrackHoverIn.bind(this), 
      this.onTrackHoverOut.bind(this)
    );

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

  onTrackHoverIn: function() {
    Backbone.trigger("trackhoverin",this.model);
  },

  onTrackHoverOut: function() {
    Backbone.trigger("trackhoverout",this.model);
  },

  onTextDisplayFocus: function() {
    this.$el.addClass("focused");
    Backbone.trigger("trackinputfocus",this.model);
  },

  onTextDisplayBlur: function() {
    this.$el.removeClass("focused");
    Backbone.trigger("trackinputblur",this.model);
  },

  onTextDisplayKeyup: function() {
    var $input = $(event.target);
    var text = $input.val();

    this.model.subtitle.set({ "text": text});

    Backbone.trigger("trackinputkeyup",event, text, this.model);
  },

  onResizableResize: function(event, ui) {
    Backbone.trigger("trackresize",event,this.model,ui);''
  },

  onResizableStop: function(event, ui) {
    this.model.save();
  },

  onDraggableDrag: function(event, ui) {
    Backbone.trigger("trackdrag",event,this.model,ui);
  },

  onDraggableStop: function(event, ui) {
    this.model.save();
  },

  onMouseClick: function(event) {
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

  openEditor: function() {
    this.$textDisplay.focus();
  },

  isEditorOpen: function() {
    return this.$textDisplay.is(":focus");
  },

  fadingHighlight: function() {
    this.$el.effect("highlight", {color: "moccasin"}, 1000);
  }

});
