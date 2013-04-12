function Scrubber (popcorn) {
  this.popcorn = popcorn;
  this.setupElement();
  this.moveInterval = setInterval(this.render.bind(this),10);
}

Scrubber.prototype = {

  setupElement: function() {
    this.$container_summary = $("#timeline #summary");
    this.$el_summary = $("<div class='scrubber summary'>");
    this.$container_summary.append(this.$el_summary);

    this.$container_expanded = $("#timeline #expanded");
    this.$el_expanded = $("<div class='scrubber expanded'>");
    this.$container_expanded.append(this.$el_expanded);
  },

  render: function() {
    this.renderInContainer(this.$container_summary,this.$el_summary);
    this.renderInContainer(this.$container_expanded,this.$el_expanded);
  },

  // needs container,element

  renderInContainer: function($container,$el) {
    var duration;
    if ($container.attr("id") === "summary") {
      duration = this.popcorn.media.duration;
    } else {
      duration = 30;
    }

    $el.css("left",  this.toPixel($container.width(),duration,this.popcorn.currentTime()));
  },

  toPixel: function(containerWidth,containerDuration,time) {
    var pixelWidth = containerWidth / containerDuration ;
    return pixelWidth * time;
  }

};
// red line
// width 2px
// height same as timeline

// moves along with current time
// listen to popcorn timeupdate to update itself
