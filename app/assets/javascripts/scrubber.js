function Scrubber () {
	this.setupElement();
}

Scrubber.prototype.setupElement = function() {
  this.$container = $("#timeline");
  this.$el = $("<div id='scrubber'>");
  this.$container.append(this.$el);
  // this.render();
  // position based on timeupdate
};
// red line
// width 2px
// height same as timeline

// moves along with current time
// listen to popcorn timeupdate to update itself
