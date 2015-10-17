//= require jquery
//= require jquery_ujs
//= require jquery.ui.resizable
//= require jquery.ui.draggable
//= require jquery.ui.spinner
//= require jquery.ui.effect-highlight

//= require namespace.js
//= require utility.js

//= require lib/popcorn-complete.js
//= require lib/popcorn_nicovideo.js
//= require lib/jquery-migrate-1.2.1.js
//= require lib/jquery.fullscreen.js
//= require lib/underscore.js
//= require lib/backbone.js
//= require lib/backbone.localStorage.js
//= require lib/mousetrap.js
//= require lib/mousetrap-global-bind.js

//= require ui/base_player.js

//= require ui/base_player.js
//= require ui/player.js
//= require ui/track.js
//= require ui/subtitle.js
//= require ui/timeline.js

//= require models/repository.js
//= require models/track.js
//= require models/subtitle.js

$(document).ready(function(){
  repo = $("#river_player").data("repo") ;
  $("#river_player").removeAttr("data-repo");
  player = new river.ui.Player({repo: repo, view_enabled: false});
});

