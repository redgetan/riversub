river.ui.SubtitleList = Backbone.View.extend({

  tagName: "div",
  className: "table",

  events: {
    "click": "onClickHandler",
    "dblclick": "onDblClickHandler"
  },

  initialize: function() {
    // this.$el.data("model",this.model);
    this.$container = $("#subtitle_list");
    this.$parentContainer = $("#subtitle_container");
    this.setupElement();

    this.listenTo(this.collection,"add",this.onModelAdd);
    this.listenTo(this.collection,"change",this.onModelChange);
    Backbone.on("trackstart",this.onTrackStart.bind(this));
    this.$showOriginalBtn.on("click", this.onShowOriginalBtnClick.bind(this));
    this.$hideOriginalBtn.on("click", this.onHideOriginalBtnClick.bind(this));
  },

  setupElement: function() {
    var header =     "<div class='header clear'>" +
                       "<div id='start'>Start</div>" +
                       "<div id='end'>End</div>" +
                       "<div id='original'>Original</div>" +
                       "<div id='header_text'>Text</div>" +
                     "</div>";


    this.$container.before(header);
    this.$container.append(this.$el);

    if (repo.parent_repository_id) {
      this.$parentContainer.find("#header_text").append("<a href='#' class='show_original_btn'>(Show Original)</a>");  
      this.$parentContainer.find("#original").append("<a href='#' class='hide_original_btn'>(Hide)</a>");  
    }

    this.$showOriginalBtn = this.$parentContainer.find(".show_original_btn");
    this.$showOriginalBtn.hide();
    this.$hideOriginalBtn = this.$parentContainer.find(".hide_original_btn");
  },

  onShowOriginalBtnClick: function() {
    this.$showOriginalBtn.hide();
    this.$parentContainer.find("#original").show();
    this.$el.find(".parent_text").show();
  },

  onHideOriginalBtnClick: function() {
    this.$showOriginalBtn.show();
    this.$parentContainer.find("#original").hide();
    this.$el.find(".parent_text").hide();
  },

  onModelAdd: function(subtitle) {
    if (!subtitle.isOriginal) {
      this.renderPosition(subtitle);
    }
  },

  onModelChange: function(subtitle) {
    if (!subtitle.isOriginal) {
      this.renderPosition(subtitle);
    }
  },

  onClickHandler: function(event) {
    var $target = $(event.target);
    var $subtitle = $target.hasClass("subtitle") ? $target : $target.closest(".subtitle");
    var subtitle = $subtitle.data("model");

    if (subtitle === null) { return; }

    if ($target.closest("button").hasClass("sub_enter")) {
      Backbone.trigger("subtitleenter", subtitle);
    } else if ($target.hasClass("sub_text_area")) {
      Backbone.trigger("subtitlelineinputclick",subtitle, $target);
    } else if ($target.closest("span").hasClass("correct_sub_btn")) {
      var $li = $target.closest(".subtitle");
      var subtitleToken = $li.data("shortid");

      var isSameForm = $(".fix_sub_form_container").data("shortid") === subtitleToken;
      if ($(".fix_sub_form_container").length > 0 && isSameForm) return;

      // clear form if any exists
      $(".fix_sub_form_container").remove();
      var subtitleText  = $li.find(".text_holder").text();
      $li.append(this.createCorrectSubForm(subtitleToken, subtitleText));
    } else if ($target.hasClass("fix_sub_form_cancel_btn")) {
      $(".fix_sub_form_container").remove();
    } else if ($target.hasClass("fix_sub_form_submit_btn")) {
      this.submitCorrectionRequest();
    } else {
      Backbone.trigger("subtitlelineclick",subtitle, $target);
    }
  },

  onDblClickHandler: function(event) {
    var $target = $(event.target);
    var $subtitle = $target.hasClass("subtitle") ? $target : $target.closest(".subtitle");
    var subtitle = $subtitle.data("model");

    if (subtitle === null) { return; }

    Backbone.trigger("subtitlelinedblclick",subtitle);
  },

  onTrackStart: function(track) {
    var subtitle = track.subtitle;
    this.ensureCorrectWindowPosition(subtitle);
  },

  createCorrectSubForm: function(token, text) {
    var form =  "<div class='fix_sub_form_container' data-shortid='"+ token + "'>" +
                  "<form accept-charset='UTF-8' action='/subtitles/" + token + "/fix' >" + 
                    "<textarea class='fix_sub_input'>" + 
                      text + 
                    "</textarea>" + 
                    "<div class='requester'><span class='fix_sub_requester_name'></span></div>" + 
                    "<a class='fix_sub_form_submit_btn btn btn-primary'>Send Correction Request</a>" + 
                    "<a class='fix_sub_form_cancel_btn btn'>Cancel</a>" + 
                  "</form>" + 
                "</div>";
    var $form = $(form);

    return $form;
  },

  submitCorrectionRequest: function() {
    var $form = $(".fix_sub_form_container form");
    var text = $form.find(".fix_sub_input").val();

    $.ajax({
      url: $form.attr("action"),
      type: "POST",
      data: { text: text},
      dataType: "json",
      success: function(data,status) {
        $(".fix_sub_form_container").remove();
        var notice = "<div id='flash_error' class='flash alert alert-block'>Correction Request sent to " + 
                     repo.owner + " for approval </div>";

        $("#flash_container").html(notice);

        setTimeout(function(){
          $("#flash_container").text(""); 
        },3000);
      },
      error: function(data) {
        var notice = "<div id='flash_error' class='flash alert alert-block'>Failed to submit correction</div>";
        $("#flash_container").html(notice);

        setTimeout(function(){
          $("#flash_container").text(""); 
        },3000);
      }.bind(this)
    });

  },

  ensureCorrectWindowPosition: function(subtitle) {
    if (!subtitle.options.view_enabled || subtitle.isOriginal) return;

    var $container = this.$container;
    var $el = subtitle.view.$el;

    if (this.isOutOfBounds($container,$el)) {
      this.scrollContainerToElement($container,$el);
    }
  },

  isOutOfBounds: function($container,$el) {
    var container_top = $container.position().top + $container.scrollTop();
    var container_bottom = container_top + $container.height();

    var el_pos = $el.position().top + $container.scrollTop();

    if (el_pos >= container_top && el_pos <= container_bottom) {
      return false;
    } else {
      return true;
    }
  },

  scrollContainerToElement: function($container,$el) {
    var el_pos = $el.position().top + $container.scrollTop();
    this.$container.animate({scrollTop: el_pos - $container.position().top},300);
  },

  renderPosition: function(subtitle) {
    var index = this.collection.indexOf(subtitle);

    var $subtitle = subtitle.view.$el;
    // find which subtitle is currently at that position
    var $subtitleAtTargetIndex = this.$el.find(".subtitle").eq(index);

    if ($subtitleAtTargetIndex.length === 0) {
      // there is no view in that index yet, so just append it
      this.$el.append(subtitle.view.$el);
    } else if ($subtitleAtTargetIndex[0] !== $subtitle[0]) {
      $subtitle.insertBefore($subtitleAtTargetIndex);
    } else {

    }
  },

});
