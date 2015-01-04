river.ui.TemplateEditor = river.ui.Editor.extend({
  initialize: function (options) {
    river.ui.Editor.prototype.initialize.call(this,options);
    this.hideEditorControls();
  },

  hideEditorControls: function() {
    $(".header #original").show();
    $(".header #end").hide();
    this.$timelineBtn.hide();
    this.$subtitleBtn.hide();
    this.$addSubInput.hide();
    this.$addSubBtn.hide();
    this.$forwardBtn.hide();
    this.$backwardBtn.hide();
    $(".publish_preview_btn_group").appendTo(".template_publish_preview_container");
  },

  onPublishBtnClick: function(event) {
    if (repo.title && repo.title.length > 0) {
      river.ui.Editor.prototype.onPublishBtnClick.call(this,event);
    } else {
      event.preventDefault();
      alert("Please Enter a Title");
    }
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
