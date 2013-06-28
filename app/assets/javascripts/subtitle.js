Array.prototype.move = function (old_index, new_index) {
    if (new_index >= this.length) {
        var k = new_index - this.length;
        while ((k--) + 1) {
            this.push(undefined);
        }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this; // for testing purposes
};

function SubtitleView(subtitles) {
  this.subtitles = [];

  this.setupElement(subtitles);
  this.selectedSubtitle = null;

  this.bindEvents();
}

SubtitleView.prototype = {

  setupElement: function(subtitles) {
    this.$container = $("#subtitle_list");

    var el = "<table class='table'>" + 
                "<tr>" + 
                  "<th>Start</th>" +
                  "<th>End</th>" +
                  "<th>Text</th>" +
                "</tr>" +
              "</table>";

    this.$container.append(el);

    this.$el = this.$container.find("table");


    // if (Object.keys(subtitles).length === 0) {
    //   this.createSubtitleForm();
    // }
  },

  // createSubtitles: function(subtitles) {
  //   for (var i = 0; i < subtitles.length; i++) {
  //     this.createSubtitle(subtitles[i]);
  //   };
  // },

  onSubtitleCreate: function(event,subtitle) {
    this.subtitles.push(subtitle);
    return subtitle;
  },

  render: function(subtitle) {
    // render positions of subtitles
    // subtitle are arranged by start time
    // while subtitle.startTime > start time of other people, keep looping until its less than, then thats where u insert it
    // case 1: subtitle must be insert before all
    // case 2: subtitle must be insert after all
    // case 3: subtitle must be insert somewhere in middle
    var fromIndex = this.subtitles.indexOf(subtitle);
    var toIndex   = this.subtitles.length - 1;

    for (var i = 0; i < this.subtitles.length; i++) {

      if (subtitle.startTime() > this.subtitles[i].startTime()) {
        // continue
      } else {
        toIndex = i;
        break;
      }
    };

    if (fromIndex !== toIndex) {
      subtitle.$el.insertBefore(this.subtitles[toIndex].$el);
      this.subtitles.move(fromIndex,toIndex);
    }
  },

  createSubtitleForm: function() {
    var el = "<form id='transcript'>" +
               "<textarea id='transcript' name='transcript' rows='12' cols='10' placeholder='Paste Transcript here'></textarea>" +
               "<input class='btn' type='submit' value='Submit'>" +
             "</form>";
    this.$container.append(el);

    this.$form = this.$container.find("form#transcript");
  },

  bindEvents: function() {
    this.$container.on("click",this.onClickHandler.bind(this));
    this.$container.on("dblclick",this.onDblClickHandler.bind(this));

    if (typeof this.$form !== "undefined") {
      this.$form.on("submit",this.onFormSubmit.bind(this));
    }

    $(document).on("trackchange",this.onTrackChange.bind(this));
    $(document).on("subtitlecreate",this.onSubtitleCreate.bind(this));
    $(document).on("subtitleremove",this.onSubtitleRemove.bind(this));
    $(document).on("subtitletrackmapped",this.onSubtitleTrackMapped.bind(this));
    $(document).on("subtitlehighlight",this.onSubtitleHighlight.bind(this));
    $(document).on("subtitleunhighlight",this.onSubtitleUnHighlight.bind(this));
  },

  onClickHandler: function(event) {
    var $target = $(event.target);
    var $subtitle = $target.hasClass("subtitle") ? $target : $target.closest(".subtitle");
    var subtitle = $subtitle.data("model");

    if (subtitle === null) { return; }

    this.$container.trigger("subtitlelineclick",[subtitle]);
  },

  onDblClickHandler: function(event) {
    var $target = $(event.target);
    var $subtitle = $target.hasClass("subtitle") ? $target : $target.closest(".subtitle");
    var subtitle = $subtitle.data("model");

    if (subtitle === null) { return; }

    this.$container.trigger("subtitlelinedblclick",[subtitle]);
  },

  onTrackChange: function(event,track) {
    track.subtitle.render();
  },

  onSubtitleRemove: function(event, subtitleId) {
  },

  onSubtitleHighlight: function(event, subtitle) {
    this.selectedSubtitle = subtitle;
    // if subtitle is not visible in container, scroll container to subtitle
    var container_top = this.$container.position().top + this.$container.scrollTop();
    var container_bottom = container_top + this.$container.height();

    var subtitle_pos = subtitle.$el.position().top + this.$container.scrollTop();

    // console.log("top: " + container_top + " bot: " + container_bottom + " pos: " + subtitle_pos);

    if (subtitle_pos >= container_top && subtitle_pos <= container_bottom) {
      // not ouf bounds
    } else {
      // scroll
      this.$container.animate({scrollTop: subtitle_pos - this.$container.position().top},1000);
    }
  },

  onSubtitleUnHighlight: function(event, subtitle) {
    this.selectedSubtitle = null;
  },

  onSubtitleTrackMapped: function(event, subtitle) {
    this.render(subtitle);
  },

  find: function(id) {
    return this.subtitles[id];
  },

  highlightLine: function(subtitle) {
      if (this.selectedSubtitle != null ) {
        this.selectedSubtitle.unhighlight();
      }
      subtitle.highlight();
  },

  // find one that is not yet mapped
  // nextUnmappedSubtitle: function() {
  //   var target = this.findFirst(this.subtitles,function(subtitle){
  //     return subtitle.$el.hasClass("mapped") === false;
  //   });

  //   return target;
  // },

  // findFirst: function(subtitles,fn) {
  //   var key;
  //   var value = null;
  //   var conditionSatisfied;

  //   for (var i = 0; i < this.orderedLineKeys.length; i++) {
  //     key = this.orderedLineKeys[i];
  //     value = subtitles[key];
  //     conditionSatisfied = fn(value);
  //     if (conditionSatisfied) {
  //       break;
  //     }
  //   };

  //   return value;
  // }


};

// should listen to changes in track startTime and endTime to rerender
function Subtitle(attributes) {
  if (typeof attributes === "undefined") {
    attributes = { text: "" }; // default attribute
  }
  this.track = null;
  this.setupElement();
  this.setAttributes(attributes);
  this.isDeleted = false;
  this.bindEvents();

  this.$el.trigger("subtitlecreate",[this]);
}

Subtitle.prototype = {

  setAttributes: function(attributes) {
    for (var prop in attributes) {
      this[prop] = attributes[prop];
      if (prop === "text") {
        if (this.track !== null ) {
          this.track.isSaved = false;
          this.$el.trigger("trackchange",[this.track]);
        }
      }
    }
    this.render();
  },

  getAttributes: function() {
    return {
      id:   this.id,
      text: this.text
    }
  },

  // generateGuid: function() {
  //   'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  //     var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
  //     return v.toString(16);
  //   });
  // },

  setupElement: function() {

    this.$container = $("#subtitle_container").find("table");

    var el = "<tr class='subtitle'>" + 
               "<td>" +
                 "<div class='start_time'></div>" +
               "</td>" +
               "<td>" +
                 "<div class='end_time'></div>" +
               "</td>" +
               "<td>" +
                 "<div class='text'></div>" +
                 "<div class='delete'>" +
                   "<button type='button' class='close'>×</button>" +
                 "</div>" +
               "</td>" +
              "</tr>";

    this.$container.append(el);

    this.$el = this.$container.find(".subtitle").last();
    this.$el.data("model",this);

    this.$text = this.$el.find(".text");

    this.$close = this.$el.find(".close");
    this.$close.hide();

    if ($("#editor").size() === 1) {
      this.$el.find(".text").editInPlace({
        editEvent: "none_delegated_by_parent",
        bg_over: "transparent",
        default_text: "",
        callback: function(unused, enteredText) { this.setAttributes({ "text": enteredText}); return enteredText; }.bind(this),
        delegate: {
          didOpenEditInPlace: function($dom,settings) {
            $dom.trigger("subtitlelineedit");

            $dom.find(":input").attr("maxlength",60);
            $dom.find(":input").on("keyup",function(event) {
              var $input = $(event.target);
              $input.trigger("subtitlelinekeyup",[$input.val()]);
            });
          }.bind(this),
          // shouldCloseEditInPlace: function() { return false; },
          didCloseEditInPlace: function($dom) {
            $dom.trigger("subtitlelineblur");
            // this.edit_sub_mode = false;
          }.bind(this)  
        }
      });
    }

    this.render();
  },

  bindEvents: function() {
    this.$el.on("mouseenter",this.onMouseEnter.bind(this));
    this.$el.on("mouseleave",this.onMouseLeave.bind(this));
    this.$close.on("click",this.onCloseClick.bind(this));
  },

  onCloseClick: function(event) {
    event.stopPropagation();
    this.remove();
  },

  startTime: function() {
    return this.track.startTime();
  },

  endTime: function() {
    return this.track.endTime();
  },

  remove: function() {
    // remove subtitle element
    this.$el.remove();
    // remove track if its mapped to a track
    if (this.track.isDeleted === false ) {
      this.track.remove();
    }
    // mark subtitle as isDeleted
    this.isDeleted = true;

    $(document).trigger("subtitleremove",this);
  },

  onMouseEnter: function() {
    this.$close.show();
  },

  onMouseLeave: function() {
    this.$close.hide();
  },

  render: function() {
    if (this.track !== null ) {
      this.$el.find(".start_time").text(this.track.startTime());
      if (!this.track.isGhost()) {
        this.$el.find(".end_time").text(this.track.endTime());
      }
    } else {
      this.$el.find(".start_time").text("");
      this.$el.find(".end_time").text("");
    }
    this.$el.find(".text").text(this.text);
  },

  setTrack: function(track) {
    this.track = track;
    this.$el.addClass("mapped");
    this.render();
    this.$el.trigger("subtitletrackmapped",[this]);
  },

  unmapTrack: function() {
    this.track = null;
    this.$el.removeClass("mapped");
    this.render();
  },

  highlight: function() {
    this.$el.addClass("selected");
    this.$el.trigger("subtitlehighlight",[this]);
  },

  unhighlight: function() {
    this.$el.removeClass("selected");
    this.$el.trigger("subtitleunhighlight",[this]);
  },

  openEditor: function(event) {
    this.$text.data("editor").openEditor(event);
  },

  hideEditorIfNeeded: function() {
    if (this.$text.hasClass("editInPlace-active")) {
      this.$text.data("editor").handleSaveEditor({});  
    }
  }

};
