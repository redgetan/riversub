river.ui.TemplateEditor = river.ui.Editor.extend({
  initialize: function (options) {
    river.ui.Editor.prototype.initialize.call(this,options);

    $(".header #original").show();
    $(".header #end").hide();
    $("#add_sub_container").hide();
    this.$forwardBtn.hide();
    this.$backwardBtn.hide();
    $(".publish_preview_btn_group").appendTo(".template_publish_preview_container");
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