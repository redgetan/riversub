river.ui.TemplateEditor = river.ui.Editor.extend({
  initialize: function (options) {
    river.ui.Editor.prototype.initialize.call(this,options);
    this.hideEditorControls();
    this.enableTitleChange();
    this.postBindEvents();
  },

  hideEditorControls: function() {
    $(".header #original").show();
    $(".header #end").hide();
    $("#add_sub_container").hide();
    this.$forwardBtn.hide();
    this.$backwardBtn.hide();
    $(".publish_preview_btn_group").appendTo(".template_publish_preview_container");
  },

  enableTitleChange: function() {
    $(".repo_label_container").find("#repo_label").hide();

    var title_input = "<div class='' title='click to edit'>" +
                        "<input type='text' class='repo_title_input' style='width: 200px; text-align: center;' placeholder='Enter Title'>" +
                      "</div>";

    $(".repo_label_container").append(title_input);

    this.$titleInputContainer = $(".repo_label_container").find(".repo_title_input_container");
    this.$titleInput = $(".repo_label_container").find(".repo_title_input");
    this.$titleInputHandle = $(".repo_label_container").find(".title_input_handle");

    if (repo.title) {
      this.$titleInput.val(repo.title);
    }
  },

  postBindEvents: function() {
    this.$titleInput.on("keyup", this.onTitleInputKeyup.bind(this));
    this.$titleInput.on("blur", this.onTitleInputBlur.bind(this));
    this.$titleInputContainer.on("mouseenter", this.onTitleInputMouseEnter.bind(this));
    this.$titleInputContainer.on("mouseleave", this.onTitleInputMouseLeave.bind(this));
    this.$titleInputHandle.on("click", this.onTitleInputHandleClick.bind(this));
    this.$previewBtn.on("click", this.onPreviewBtnClick.bind(this));
  },

  onPreviewBtnClick: function(event) {
    if (repo.title && repo.title.length > 0) {
    } else {
      event.preventDefault();
      alert("Please Enter a Title");
    }
  },

  onPublishBtnClick: function(event) {
    if (repo.title && repo.title.length > 0) {
      river.ui.Editor.prototype.onPublishBtnClick.call(this,event);
    } else {
      event.preventDefault();
      alert("Please Enter a Title");
    }
  },

  onTitleInputKeyup: function(event) {
    // enter key
    if (event.which == 13 ) {
      this.$titleInput.blur();
    }
  },

  onTitleInputHandleClick: function(event) {
    this.$titleInput.focus();
  },

  onTitleInputBlur: function() {
    var repoTitle = this.$titleInput.val();

    this.saveNotify();

    $.ajax({
      url: this.repo.update_title_url,
      type: "POST",
      dataType: "json",
      data: { repo_title: repoTitle },
      success: function(data) {
        repo.title = repoTitle;
        this.clearStatusBar();
      }.bind(this),
      error: function(data) {
        this.clearStatusBar();
        alert("Unable to save Title. We would look into this shortly.");
        throw data.responseText;
      }.bind(this)
    });

  },

  onTitleInputMouseEnter: function() {
  },

  onTitleInputMouseLeave: function() {
  },

  setupElement: function() {
    river.ui.Editor.prototype.setupElement.call(this);
    this.$el.addClass("template");
  },

  goToNextTrack: function() {
    var nextTrack = this.focusedTrack.next();
    this.replayTrackAndEdit(nextTrack);
  },

  onEditorReady: function(event) {
    river.ui.Editor.prototype.onEditorReady.call(this, event);

    if (this.currentTrack) {
      this.replayTrackAndEdit(this.currentTrack);
    }
  },


})
