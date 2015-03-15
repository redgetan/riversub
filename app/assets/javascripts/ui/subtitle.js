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
    this.MAXLENGTH = 120;
    this.MAXWIDTH  = repo.parent_repository_id ? 300 : 650 ;

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
                  "</div>" +
                  // "<button class='btn btn-xs sub_enter'><i class='glyphicon glyphicon-refresh'></i></button>" +
                  "<div class='delete'>" +
                    "<a href='#' class='delete_sub_line'>x</a>" +
                  "</div>";
    this.$el.append(content);



    this.$startTime = this.$el.find(".start_time");
    this.$endTime   = this.$el.find(".end_time");

    this.$text = this.$el.find(".text");

    this.$close = this.$el.find(".delete_sub_line");
    this.$close.hide();

    this.$subEnter = this.$el.find(".sub_enter");
    this.$subEnter.tooltip({title: "Replay"});

    if ($("#editor").size() === 1) {
      this.editableStartEndTime();
      this.editableText();
    } else {
      this.readOnlyStartEndTime();
      this.readOnlyText();
    }

    if (repo.parent_repository_id) {
      this.showParentText();
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

  showParentText: function() {
    var parentText = "<div class='parent_text'><span></span></div>";
    this.$text.before(parentText);

    this.$parentText = this.$el.find(".parent_text");
    this.$parentText.find("span").text(this.model.get("parent_text"));

    if ($(".show_original_btn").is(":visible")) {
      this.$parentText.hide();
    }
  },

  createInput: function() {
    return $("<input class='sub_text_area' placeholder='Enter Text'>");
  },

  createTextArea: function() {
    return $("<textarea class='sub_text_area' placeholder='Enter Text'></textarea>");
  },

  editableStartEndTime: function() {
    this.$startTime.append(this.createInput());
    this.$endTime.append(this.createInput());

    this.$startTimeInput = this.$startTime.find("input");
    this.$endTimeInput = this.$endTime.find("input");

    this.addSpinnerToStartEndTime();

    this.$startTimeInput.on("keydown", this.onSubTextAreaKeydown.bind(this));
    this.$endTimeInput.on("keydown", this.onSubTextAreaKeydown.bind(this));

    this.$startTimeInput.on("keyup", this.subtitleStartTimeKeyUp.bind(this));
    this.$endTimeInput.on("keyup", this.subtitleEndTimeKeyUp.bind(this));

    this.$startTimeInput.on("keypress", this.disallowNonNumeric.bind(this));
    this.$endTimeInput.on("keypress", this.disallowNonNumeric.bind(this));

    this.$startTimeInput.on("focus", this.subtitleLineEdit.bind(this));
    this.$endTimeInput.on("focus", this.subtitleLineEdit.bind(this));

    this.$startTimeInput.on("blur", this.editStartTimeFinished.bind(this));
    this.$endTimeInput.on("blur", this.editEndTimeFinished.bind(this));
  },

  addSpinnerToStartEndTime: function() {
    this.$startTimeInput.spinner({
      min: 0, 
      spin: this.startTimeSpin.bind(this)
    });

    this.$endTimeInput.spinner({
      min: 0, 
      spin: this.endTimeSpin.bind(this)
    });

    // reset events set by jquery ui spinner
    $.each(["mousewheel", "keydown", "keyup"], function(index, eventName){
      this.$startTimeInput.off(eventName);
      this.$endTimeInput.off(eventName);
    }.bind(this));


    this.$startTimeInput.data("field","start_time");
    this.$startTime.find(".ui-spinner-button").data("field","start_time");
    this.$startTime.find(".ui-spinner-button span").data("field","start_time");

    this.$endTimeInput.data("field","end_time");
    this.$endTime.find(".ui-spinner-button").data("field","end_time");
    this.$endTime.find(".ui-spinner-button span").data("field","end_time");
  },

  startTimeSpin: function(event, ui) {
    var time = ui.value;

    // if overlaps already exist before, allow user to correct, don't prevent default
    if (!this.overlapsPrev(this.model.startTime()) && this.overlapsPrev(time)) {
      time = this.model.prev().endTime() + editor.TRACK_MARGIN;
      event.preventDefault();
      this.showInvalidFading(this.model.prev(), ".end_time");
    }

    if (!this.overlapsNext(this.model.startTime()) && this.overlapsNext(time)) {
      time = this.model.next().startTime() - editor.TRACK_MARGIN;
      event.preventDefault();
      this.showInvalidFading(this.model.next(), ".start_time");
    }

    this.model.track.setStartTime(time);
  },

  endTimeSpin: function(event, ui) {
    var time = ui.value;

    if (!this.overlapsPrev(this.model.endTime()) && this.overlapsPrev(time)) {
      time = this.model.prev().endTime() + editor.TRACK_MARGIN;
      event.preventDefault();
      this.showInvalidFading(this.model.prev(), ".end_time");
    }

    if (!this.overlapsNext(this.model.endTime()) && this.overlapsNext(time)) {
      time = this.model.next().startTime() - editor.TRACK_MARGIN;
      event.preventDefault();
      this.showInvalidFading(this.model.next(), ".start_time");
    }

    this.model.track.setEndTime(time);
  },

  showInvalidFading: function(subtitle, selector) {
    subtitle.view.showInvalid(selector);
    setTimeout(function() {
      subtitle.view.showValid(selector);
    }.bind(this), 300);
  },

  overlapsPrev: function(time) {
    return this.model.overlapsPrev(time);
  },

  overlapsNext: function(time) {
    return this.model.overlapsNext(time);
  },

  editableText: function() {
    this.$text.prepend(this.createTextArea());

    this.$textInput = this.$text.find(".sub_text_area");

    this.$textInput.data("field","text");

    this.$textInput.attr("maxlength", this.MAXLENGTH);

    this.$textInput.on("focus", this.subtitleLineEdit.bind(this));

    this.$textInput.on("blur", this.editTextFinished.bind(this));

    this.$textInput.on("keydown", river.utility.resizeInput.bind(this.$textInput,this.MAXWIDTH));
    this.$textInput.on("keydown", this.onSubTextAreaKeydown.bind(this));
    this.$textInput.on("keyup", this.onSubtitleTextKeyUp.bind(this));
  },

  onSubTextAreaKeydown: function(event) {
    // avoids enter key from creating linebreaks in textarea
    if (event.which === 13) event.preventDefault();
    Backbone.trigger("subtitlelinekeydown", this.model);
  },

  onSubtitleTextKeyUp: function(event) {
    var text = this.$textInput.val();
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

    var time = parseFloat(this.$startTimeInput.val());

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

    var time = parseFloat(this.$endTimeInput.val());
    if ($.isNumeric(time)) {
      this.model.track.setEndTime(time);
    }
  },

  showInvalid: function(selector) {
    if (typeof selector !== "undefined") {
      this.$el.find(selector).addClass("invalid");
    } else {
      this.$el.addClass("invalid");
    }
  },

  showValid: function(selector) {
    if (typeof selector !== "undefined") {
      this.$el.find(selector).removeClass("invalid");
    } else {
      this.$el.removeClass("invalid");
    }
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
    var enteredText = this.$textInput.val();
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
      var startTimeHolder = this.$startTimeInput;
      var endTimeHolder   = this.$endTimeInput
      var textHolder      = this.$textInput;
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
        river.utility.resizeInput.bind(textHolder,this.MAXWIDTH).call();
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
    this.$textInput.focus();
  },

  closeEditor: function(options) {
    this.$textInput.blur();
  }

});
