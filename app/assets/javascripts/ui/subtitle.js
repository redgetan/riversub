river.ui.Subtitle = Backbone.View.extend({

  tagName: "div",
  className: "clear subtitle",

  events: {
    "mouseenter": "onMouseEnter",
    "mouseleave": "onMouseLeave",
    "click": "onMouseClick",
    "click .delete_sub_line": "onCloseClick"
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
                  "<div class='text input-group'>"+ 
                    "<button class='btn btn-xs sub_enter'>Replay</button>" +
                  "</div>" +
                  "<div class='delete'>" +
                    "<a href='#' class='delete_sub_line'>x</a>" +
                  "</div>";
    this.$el.append(content);



    this.$startTime = this.$el.find(".start_time");
    this.$endTime   = this.$el.find(".end_time");

    this.$text = this.$el.find(".text");

    this.$subEnter   = this.$el.find(".sub_enter");

    this.$close = this.$el.find(".delete_sub_line");
    this.$close.hide();

    if ($("#editor").size() === 1) {
      if (repo.parent_repository_id) {
        var parentText = "<div class='parent_text'><span></span></div>";
        this.$text.before(parentText);

        this.$parentText = this.$el.find(".parent_text span");
        this.$parentText.text(this.model.get("parent_text"));

        this.$startTime.remove();
        this.$endTime.remove();
        this.$close.remove();
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

    if (!repo.parent_repository_id) {
      this.$startTime.find("input").spinner({
        min: 0, 
        spin: this.startTimeSpin.bind(this)
      });

      this.$endTime.find("input").spinner({
        min: 0, 
        spin: this.endTimeSpin.bind(this)
      });

      // reset events set by jquery ui spinner
      $.each(["mousewheel", "keydown", "keyup"], function(index, eventName){
        this.$startTime.find("input").off(eventName);
        this.$endTime.find("input").off(eventName);
      }.bind(this));


      this.$startTime.find("input").data("field","start_time");
      this.$startTime.find(".ui-spinner-button").data("field","start_time");
      this.$startTime.find(".ui-spinner-button span").data("field","start_time");

      this.$endTime.find("input").data("field","end_time");
      this.$endTime.find(".ui-spinner-button").data("field","end_time");
      this.$endTime.find(".ui-spinner-button span").data("field","end_time");
    }

    this.$startTime.find("input").on("keydown", this.onSubTextAreaKeydown.bind(this));
    this.$endTime.find("input").on("keydown", this.onSubTextAreaKeydown.bind(this));

    this.$startTime.find("input").on("keyup", this.subtitleStartTimeKeyUp.bind(this));
    this.$endTime.find("input").on("keyup", this.subtitleEndTimeKeyUp.bind(this));

    this.$startTime.find("input").on("keypress", this.disallowNonNumeric.bind(this));
    this.$endTime.find("input").on("keypress", this.disallowNonNumeric.bind(this));

    this.$startTime.find("input").on("focus", this.subtitleLineEdit.bind(this));
    this.$endTime.find("input").on("focus", this.subtitleLineEdit.bind(this));

    this.$startTime.find("input").on("blur", this.editStartTimeFinished.bind(this));
    this.$endTime.find("input").on("blur", this.editEndTimeFinished.bind(this));

  },

  startTimeSpin: function(event, ui) {
    var time = ui.value;

    // if overlaps already exist before, allow user to correct, don't prevent default
    if (!this.overlapsPrev(this.model.startTime()) && this.overlapsPrev(time)) {
      time = this.model.prev().endTime() + editor.TRACK_MARGIN;
      event.preventDefault();
    }

    if (!this.overlapsNext(this.model.startTime()) && this.overlapsNext(time)) {
      time = this.model.next().startTime() - editor.TRACK_MARGIN;
      event.preventDefault();
    }

    this.model.track.setStartTime(time);
  },

  endTimeSpin: function(event, ui) {
    var time = ui.value;

    if (!this.overlapsPrev(this.model.endTime()) && this.overlapsPrev(time)) {
      time = this.model.prev().endTime() + editor.TRACK_MARGIN;
      event.preventDefault();
    }

    if (!this.overlapsPrev(this.model.endTime()) && this.overlapsNext(time)) {
      time = this.model.next().startTime() - editor.TRACK_MARGIN;
      event.preventDefault();
    }

    this.model.track.setEndTime(time);
  },

  overlapsPrev: function(time) {
    return this.model.overlapsPrev(time);
  },

  overlapsNext: function(time) {
    return this.model.overlapsNext(time);
  },

  editableText: function() {
    this.$text.prepend(this.createInput());

    this.$text.find("input").data("field","text");

    this.$text.find("input").attr("maxlength", 90);

    this.$text.find("input").on("focus", this.subtitleLineEdit.bind(this));

    this.$text.find("input").on("blur", this.editTextFinished.bind(this));

    this.$text.find("input").on("keydown", river.utility.resizeInput);
    this.$text.find("input").on("keydown", this.onSubTextAreaKeydown.bind(this));
    this.$text.find("input").on("keyup", this.onSubtitleTextKeyUp.bind(this));
  },

  onSubTextAreaKeydown: function(event) {
    Backbone.trigger("subtitlelinekeydown", this.model);
  },

  onSubtitleTextKeyUp: function(event) {
    var text = this.$text.find("input").val();
    this.model.set({ "text": text});
  },

  isKeyAllowedInStartEnd: function(charcode) {
    // number or period or backspace
    return $.isNumeric(String.fromCharCode(charcode)) || 
      String.fromCharCode(charcode) === "." ||
      event.which === 8;
  },

  disallowNonNumeric: function(event) {
    if (!this.isKeyAllowedInStartEnd(event.which)) {
      event.preventDefault();
    }
  },

  subtitleStartTimeKeyUp: function(event) {
    if (!this.isKeyAllowedInStartEnd(event.which)) {
      event.preventDefault();
      return false;
    } 

    var time = parseFloat(this.$startTime.find("input").val());

    // if duration is invalid but no track overlap, set the end time as well
    // to something reasonable
    var isDurationDefault = Math.floor(this.model.endTime() - this.model.startTime()) === editor.DEFAULT_TRACK_DURATION;
    var newEndTime = time + editor.DEFAULT_TRACK_DURATION; 
    newEndTime = Math.floor(newEndTime * 1000) / 1000;
    var isTrackOverlap = this.model.track.overlapsTrack(time, newEndTime);

    if (isDurationDefault && !isTrackOverlap && $.isNumeric(newEndTime)) {
      this.model.track.setEndTime(newEndTime);
    }

    if ($.isNumeric(time)) {
      this.model.track.setStartTime(time);
    }
  },

  subtitleEndTimeKeyUp: function(event) {
    if (!this.isKeyAllowedInStartEnd(event.which)) {
      event.preventDefault();
      return false;
    } 

    var time = parseFloat(this.$endTime.find("input").val());
    if ($.isNumeric(time)) {
      this.model.track.setEndTime(time);
    }
  },

  showInvalid: function() {
    this.$el.addClass("invalid");
  },

  showValid: function() {
    this.$el.removeClass("invalid");
  },

  subtitleLineEdit: function() {
    if (!this.$el.hasClass("focused")) {
      this.$el.addClass("focused");
    }
    Backbone.trigger("subtitlelineedit", this.model.track);
  },

  editStartTimeFinished: function(event) { 
    this.editFinished();
  },

  editEndTimeFinished: function(event) { 
    this.editFinished();
  },

  editTextFinished: function(event) { 
    var enteredText = this.$text.find("input").val();
    this.model.set("text",enteredText);
    this.editFinished();
  },

  editFinished: function() {
    this.$el.removeClass("focused");
    Backbone.trigger("subtitlelineblur",this.model);
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
        if (!startTimeHolder.is(":focus")) {
          startTimeHolder.val(this.model.startTime());
        }

        if (!this.model.track.isGhost) {
          if (!endTimeHolder.is(":focus")) {
            endTimeHolder.val(this.model.endTime());
          }

          // if track is ghost, its start/end time changes constantly
          // during this time, we want to be able to input text into 
          // subtitle without having the render call,due to start/end time changes, 
          // outracing the time your text get set into subtitle model

          if (!textHolder.is(":focus")) {
            textHolder.val(this.model.get("text"));
          }
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
  },

  closeEditor: function(options) {
    options = options || {};

    if (["start_time","end_time","text"].indexOf(options.field) === -1) {
      options.field = "text";
    }

    var $input = this.$el.find("." + options.field).find("input");
    $input.blur();
  }

});
