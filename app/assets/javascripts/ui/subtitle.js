river.ui.Subtitle = Backbone.View.extend({

  tagName: "div",
  className: "clear subtitle",

  events: {
    "mouseenter": "onMouseEnter",
    "mouseleave": "onMouseLeave",
    "click": "onMouseClick",
    "click .delete_sub_line": "onCloseClick",
  },

  initialize: function() {
    this.$container = $("#subtitle_list table");
    this.$el.data("model",this.model);

    this.listenTo(this.model,"change",this.render);
    this.listenTo(this.model.track,"change",this.render);
    this.listenTo(this.model.track,"remove",this.remove);

    this.setupElement();
  },

  setupElement: function() {

    var content = "<div class='start_time'></div>" +
                  "<div class='end_time'></div>" +
                  "<div class='text'></div>" +
                  "<div class='delete'>" +
                    "<a href='#' class='delete_sub_line'>x</a>" +
                  "</div>";
    this.$el.append(content);



    this.$startTime = this.$el.find(".start_time");
    this.$endTime   = this.$el.find(".end_time");

    this.$text = this.$el.find(".text");

    this.$close = this.$el.find(".delete_sub_line");
    this.$close.hide();

    if ($("#editor").size() === 1) {
      if (repo.parent_repository_id) {
        var parentText = "<div class='parent_text'><span></span></div>";
        this.$text.before(parentText);

        this.$parentText = this.$el.find(".parent_text span");
        this.$parentText.text(this.model.get("parent_text"));
      }
      this.editableStartEndTime();
      this.editableText();
    } else {
      this.readOnlyStartEndTime();
      this.readOnlyText();
    }

    this.render();
  },

  readOnlyStartEndTime: function() {
    this.$startTime.append("<span></span>");
    this.$endTime.append("<span></span>");
  },

  readOnlyText: function() {
    this.$text.append("<span></span>");
  },

  createInput: function() {
    return $("<input class='sub_text_area' placeholder='Enter Text'>");
  },

  editableStartEndTime: function() {
    this.$startTime.append(this.createInput());
    this.$endTime.append(this.createInput());

    this.$startTime.find("input").on("keydown", this.onSubTextAreaKeydown.bind(this));
    this.$endTime.find("input").on("keydown", this.onSubTextAreaKeydown.bind(this));

    this.$startTime.find("input").on("keyup", this.subtitleStartEndTimeKeyUp.bind(this));
    this.$endTime.find("input").on("keyup", this.subtitleStartEndTimeKeyUp.bind(this));

    this.$startTime.find("input").on("focus", this.subtitleLineEdit.bind(this));
    this.$endTime.find("input").on("focus", this.subtitleLineEdit.bind(this));

    this.$startTime.find("input").on("blur", this.editStartTimeFinished.bind(this));
    this.$endTime.find("input").on("blur", this.editEndTimeFinished.bind(this));
  },

  editableText: function() {
    this.$text.append(this.createInput());

    this.$text.find("input").attr("maxlength", 90);

    this.$text.find("input").on("focus", this.subtitleLineEdit.bind(this));

    this.$text.find("input").on("blur", this.editTextFinished.bind(this));

    this.$text.find("input").on("keydown", river.utility.resizeInput);
    this.$text.find("input").on("keyup", this.onSubtitleTextKeyUp.bind(this));
  },

  onSubTextAreaKeydown: function(event) {
    if (event.which == 13 ) { // ENTER
      event.preventDefault();
      $(event.target).blur();
    } 
  },

  onSubtitleTextKeyUp: function(event) {
    var text = this.$text.find("input").val();
    this.model.set({ "text": text});
  },

  subtitleStartEndTimeKeyUp: function(event) {
    if (!$.isNumeric(String.fromCharCode(event.which))) {
      event.preventDefault();
    } 
  },

  subtitleLineEdit: function() {
    Backbone.trigger("subtitlelineedit");
  },

  editStartTimeFinished: function(event) { 
    var enteredText = this.$startTime.find("input").val();
    var time = parseFloat(enteredText);
    this.model.track.setStartTime(time);
    this.editFinished();
  },

  editEndTimeFinished: function(event) { 
    var enteredText = this.$endTime.find("input").val();
    var time = parseFloat(enteredText);
    this.model.track.setEndTime(time);
    this.editFinished();
  },

  editTextFinished: function(event) { 
    var enteredText = this.$text.find("input").val();
    this.model.set("text",enteredText);
    this.editFinished();
  },

  editFinished: function() {
    this.unhighlight();
    Backbone.trigger("subtitlelineblur",this.model);
  },

  onMouseClick: function(event) {
    if ($("#editor").size() === 1) {
      if (!this.$el.hasClass("selected")) {
        this.highlight();
      }
    }
  },

  highlight: function() {
    this.$el.addClass("selected");
  },

  unhighlight: function() {
    this.$el.removeClass("selected");
  },

  render: function() {
    if ($("#editor").size() === 1) {
      var startTimeHolder = this.$el.find(".start_time input");
      var endTimeHolder   = this.$el.find(".end_time input");
      var textHolder      = this.$el.find(".text input");
    } else {
      var startTimeHolder = this.$el.find(".start_time span");
      var endTimeHolder   = this.$el.find(".end_time span");
      var textHolder      = this.$el.find(".text span");
    }

    if (this.model.track !== null ) {
      if ($("#editor").size() === 1) {
        startTimeHolder.val(this.model.startTime());

        if (!this.model.track.isGhost) {
          endTimeHolder.val(this.model.endTime());

          // if track is ghost, its start/end time changes constantly
          // during this time, we want to be able to input text into 
          // subtitle without having the render call,due to start/end time changes, 
          // outracing the time your text get set into subtitle model
          textHolder.val(this.model.get("text"));
        }
        river.utility.resizeInput.bind(textHolder).call();
      } else {
        startTimeHolder.text(this.model.startTime());

        if (!this.model.track.isGhost) {
          endTimeHolder.text(this.model.endTime());
          textHolder.text(this.model.get("text"));
        }
      }
    }

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

  openEditor: function(options) {
    options = options || {};

    if (["start_time","end_time","text"].indexOf(options.field) === -1) {
      options.field = "text";
    }

    var $input = this.$el.find("." + options.field).find("input");
    $input.focus();  
  }

});
