river.ui.Subtitle = Backbone.View.extend({

  tagName: "tr",
  className: "subtitle",

  events: {
    "mouseenter": "onMouseEnter",
    "mouseleave": "onMouseLeave",
    "click .delete_sub_line": "onCloseClick",
  },

  initialize: function() {
    this.$container = $("#subtitle_list table");
    this.$el.data("model",this.model);

    this.listenTo(this.model,"change",this.render);
    this.listenTo(this.model.track,"remove",this.remove);

    this.setupElement();
  },

  setupElement: function() {

    var content = "<td>" +
                    "<div class='start_time'></div>" +
                  "</td>" +
                  "<td>" +
                    "<div class='end_time'></div>" +
                  "</td>" +
                  "<td>" +
                    "<div class='text'></div>" +
                    "<div class='delete'>" +
                      "<a href='#' class='delete_sub_line'>delete</a>" +
                    "</div>" +
                  "</td>";
    this.$el.append(content);



    this.$startTime = this.$el.find(".start_time");
    this.$endTime   = this.$el.find(".end_time");

    this.$text = this.$el.find(".text");
    this.$text.text(this.model.text);

    this.$close = this.$el.find(".delete_sub_line");
    this.$close.hide();

    if ($("#editor").size() === 1) {
      this.editableStartEndTime();
      this.editableText();
    }

    this.render();
  },

  editableStartEndTime: function() {
    this.setupEditInPlace(this.$startTime, this.editStartTimeFinished, this.didOpenStartEndTime);
    this.setupEditInPlace(this.$endTime,   this.editEndTimeFinished,   this.didOpenStartEndTime);
  },

  editableText: function() {
    this.setupEditInPlace(this.$text, this.editTextFinished, this.didOpenText);
  },

  setupEditInPlace: function($el, callback, didOpenEditInPlace) {
    $el.editInPlace({
      editEvent: "none_delegated_by_parent",
      bg_over: "transparent",
      default_text: "",
      callback: callback.bind(this),
      delegate: {
        didOpenEditInPlace:  didOpenEditInPlace.bind(this),
        didCloseEditInPlace: this.didCloseEditInPlace.bind(this)
      }
    });
  },

  didOpenStartEndTime: function($dom,settings) {
    Backbone.trigger("subtitlelineedit");

    $dom.find(":input").attr("maxlength",10);
    $dom.find(":input").css("width","50px");

    $dom.find(":input").on("keyup",function(event) {
      if (!$.isNumeric(String.fromCharCode(event.which))) {
        event.preventDefault();
      } 
    });
  },

  didOpenText: function($dom,settings) {
    Backbone.trigger("subtitlelineedit");

    $dom.find(":input").attr("maxlength",90);

    $dom.find(":input").on("keyup",function(event) {
      var $input = $(event.target);
      Backbone.trigger("subtitletextkeyup",$input.val());
    });
  },

  didCloseEditInPlace: function($dom) {
    Backbone.trigger("subtitlelineblur",this.model);
  },

  editStartTimeFinished: function(unused, enteredText) { 
    var time = parseFloat(enteredText);
    this.model.track.setStartTime(time);
    return enteredText;
  },

  editEndTimeFinished: function(unused, enteredText) { 
    var time = parseFloat(enteredText);
    this.model.track.setEndTime(time);
    return enteredText;
  },

  editTextFinished: function(unused, enteredText) { 
    this.model.set("text",enteredText);
    return enteredText;
  },


  highlight: function() {
    this.$el.addClass("selected");
  },

  unhighlight: function() {
    this.$el.removeClass("selected");
  },

  render: function() {
    if (this.model.track !== null ) {
      this.$el.find(".start_time").text(this.model.startTime());
      if (!this.model.track.isGhost) {
        this.$el.find(".end_time").text(this.model.endTime());
      }
    } else {
      this.$el.find(".start_time").text("");
      this.$el.find(".end_time").text("");
    }
    this.$el.find(".text").text(this.model.get("text"));
  },

  onMouseEnter: function() {
    this.$close.show();
  },

  onMouseLeave: function() {
    this.$close.hide();
  },

  onCloseClick: function(event) {
    event.stopPropagation();
    this.model.track.remove();
  },

  openEditor: function(event, $el) {
    // no need to open again if its already opened
    if ($el.hasClass("editInPlace-active")) return;

    $el.data("editor").openEditor(event);
  },

  hideEditorIfNeeded: function() {
    if (this.$text.hasClass("editInPlace-active")) {
      this.$text.data("editor").handleSaveEditor({});
    }
  }


});
