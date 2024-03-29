river.ui.Track = Backbone.View.extend({

  tagName: "div",
  className: "track",

  initialize: function() {
    this.$el.data("model",this.model);
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

  showInvalid: function() {
    this.$el.addClass("invalid");
  },

  showValid: function() {
    this.$el.removeClass("invalid");
  },

  unhighlight: function() {
    this.$el.removeClass("selected");
  },

});

river.ui.SummaryTrack = river.ui.Track.extend({
  initialize: function() {
    river.ui.Track.prototype.initialize.call(this);
  },
});

river.ui.ExpandedTrack = river.ui.Track.extend({
  events: function(){
    return _.extend({},river.ui.Track.prototype.events,{
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
    Backbone.on("timelinetabshown", this.onTimelineTabShown.bind(this));
  },

  render: function() {
    if (this.model.text()) {
      if (!this.$textDisplay.is(":focus")) {
        this.$textDisplay.val(this.model.text());
      }
      river.utility.resizeInput.bind(this.$textDisplay, this.MAXWIDTH).call();
    }
  },

  getContainer: function() {
    return $("#expanded.timeline #track_viewport");
  },

  onTimelineTabShown: function() {
    this.showTrackLineBreaks();
  },

  setupElement: function() {
    this.$close = $("<button type='button' class='close corner'>×</button>");
    this.$close.css("position", "absolute");
    this.$close.hide();
    this.$el.append(this.$close);

    this.$textDisplay = $("<textarea rows='1' class='track_text' placeholder='Enter Text'>");
    this.$textDisplay.attr("maxlength", river.utility.MAX_SUBTITLE_LENGTH);
    
    this.$el.append(this.$textDisplay);
  },

  bindEvents: function() {
    this.$textDisplay.on("keydown", river.utility.resizeInput);
    this.$textDisplay.on("focus", this.onTextDisplayFocus.bind(this));
    this.$textDisplay.on("input", this.showTrackLineBreaks.bind(this));
    this.$textDisplay.on("blur", this.onTextDisplayBlur.bind(this));
    this.$textDisplay.on("keyup", this.onTextDisplayKeyup.bind(this));
    this.$textDisplay.on("keydown", this.onTextDisplayKeydown.bind(this));
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

  onTrackHoverIn: function(event) {
    Backbone.trigger("trackhoverin",this.model);
  },

  onTrackHoverOut: function(event) {
    Backbone.trigger("trackhoverout",this.model);
  },

  onTextDisplayFocus: function(event) {
    this.$el.addClass("focused");
    Backbone.trigger("trackinputfocus",this.model);
  },

  onTextDisplayBlur: function(event) {
    this.$el.removeClass("focused");
    Backbone.trigger("trackinputblur",this.model);
  },

  onTextDisplayKeyup: function(event) {
    var $input = $(event.target);
    var text = $input.val();

    this.model.subtitle.set({ "text": text});
  },


  onTextDisplayKeydown: function(event) {
    Backbone.trigger("trackinputkeydown", event, this.model);
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

  showTrackLineBreaks: function() {
    river.utility.resizeTextAreaHeight(this.$textDisplay);
  },

  openEditor: function() {
    this.$textDisplay.focus();
  },

  closeEditor: function() {
    if (this.isEditorOpen()) {
      this.$textDisplay.blur();
    }
  },

  isEditorOpen: function() {
    return this.$textDisplay.is(":focus");
  },

  fadingHighlight: function() {
    this.$el.effect("highlight", {color: "moccasin"}, 1000);
  }

});
