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



    this.$text = this.$el.find(".text");
    this.$text.text(this.model.text);

    this.$close = this.$el.find(".delete_sub_line");
    this.$close.hide();

    if ($("#editor").size() === 1) {
      this.$el.find(".text").editInPlace({
        editEvent: "none_delegated_by_parent",
        bg_over: "transparent",
        default_text: "",
        callback: function(unused, enteredText) {
          this.model.set("text",enteredText);
          return enteredText;
        }.bind(this),
        delegate: {
          didOpenEditInPlace: function($dom,settings) {
            Backbone.trigger("subtitlelineedit");

            $dom.find(":input").attr("maxlength",90);
            $dom.find(":input").on("keyup",function(event) {
              var $input = $(event.target);
              Backbone.trigger("subtitlelinekeyup",$input.val());
            });
          }.bind(this),
          // shouldCloseEditInPlace: function() { return false; },
          didCloseEditInPlace: function($dom) {
            Backbone.trigger("subtitlelineblur",this.model);
            // this.edit_sub_mode = false;
          }.bind(this)
        }
      });
    }

    this.render();
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

  openEditor: function(event) {
    // no need to open again if its already opened
    if (this.$text.hasClass("editInPlace-active")) return;

    this.$text.data("editor").openEditor(event);
  },

  hideEditorIfNeeded: function() {
    if (this.$text.hasClass("editInPlace-active")) {
      this.$text.data("editor").handleSaveEditor({});
    }
  }


});
