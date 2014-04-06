river.ui.Player = river.ui.BasePlayer.extend({

  initialize: function(options) {
    river.ui.BasePlayer.prototype.initialize.call(this,options);
    this.hideEditing();

    this.$el = $("#player");

    this.$subtitleEditorBtn = $("#subtitle_editor_btn");
    this.$subtitleEditorBtn.tooltip({title: "Opens Editor in new tab", placement: 'bottom'});
  },

  setupElement: function() {
    river.ui.BasePlayer.prototype.setupElement.call(this);
  },

  hideEditing: function() {
    $("#subtitle_bar").css("background-color","rgba(255,0,0,0)");

    $("#subtitle_bar").css("margin-top","-100px");
    $("#subtitle_bar").css("margin-left","80px");
    $("#subtitle_bar").css("z-index","6");
    $("#subtitle_bar").css("position","absolute");
    $("#subtitle_bar").css("line-height","25px");

    $("#subtitle_display").css("background-color","black");
    $("#subtitle_display").css("opacity",0.8);
    $("#subtitle_display").css("font-size","20px");

    $(".subtitle .text").css("font-size","14px");
    $(".subtitle .text").css("width","350px");
    $("#subtitle_list").css("height","500px");
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

    $("#media_controls").css("margin-bottom","10px");

    // remove subtitle lines that are blank
    $(".subtitle").each(function(){
      if ($(this).find(".text").text().length === 0) {
        $(this).remove();  
      }
    });

    $("#media").css("height","600px");
  },

});

river.ui.MiniPlayer = river.ui.Player.extend({

  initialize: function(options) {
    river.ui.Player.prototype.initialize.call(this,options);
  },

  setVolume: function(value) {
    this.popcorn.volume(value);
  },

  hideEditing: function() {
    river.ui.Player.prototype.hideEditing.call(this);
    $("#media").css("height","300px");
    $("#media").css("width","400px");

    $("#subtitle_bar").css("margin-top","-35px");
    $("#subtitle_bar").css("margin-left","10px");
    $("#subtitle_bar").css("z-index","6");
    $("#subtitle_bar").css("position","absolute");
    $("#subtitle_bar").css("line-height","16px");

    $("#subtitle_display").css("background-color","black");
    $("#subtitle_display").css("opacity",0.8);
    $("#subtitle_display").css("font-size","12px");
    $("#subtitle_display").css("padding","3px");
  }

});
