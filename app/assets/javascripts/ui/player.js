river.ui.Player = river.ui.BasePlayer.extend({

  initialize: function(options) {
    river.ui.BasePlayer.prototype.initialize.call(this,options);
  },

  setupElement: function() {
    river.ui.BasePlayer.prototype.setupElement.call(this);
    this.hideEditing();

    this.$el = $("#player");

    this.$subtitleEditorBtn = $("#subtitle_editor_btn");
    this.$subtitleEditorBtn.tooltip({title: "Opens Editor in new tab", placement: 'bottom'});
  },

  hideEditing: function() {
    $("#subtitle_bar").css("background","none");
    $("#subtitle_bar").css("margin-top","-70px");
    $("#subtitle_bar").css("z-index","6");
    $("#subtitle_bar").css("position","absolute");

    $("#subtitle_display").css("background-color","black");
    $("#subtitle_display").css("opacity",0.8);

    $("#subtitle_list").css("height","315px");
    $("#subtitle_list").find("th").first().remove(); // remove start heading
    $("#subtitle_list").find("th").first().remove(); // remove end   heading
    $("#subtitle_list").find(".start_time").closest("td").each(function(){
      $(this).remove();
    });
    $("#subtitle_list").find(".end_time").closest("td").each(function(){
      $(this).remove();
    });
    $("#subtitle_list").find(".delete").each(function(){
      $(this).remove();
    });

    $("#media").css("height","315px");
  },

});
