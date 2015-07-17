$.extend(river.utility,{
  textWidth: function(text) {
    // http://stackoverflow.com/a/5047712
      var padding = 25;
      var f = '14px arial',
          o = $('<div>' + text + '</div>')
                .css({'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden', 'font': f})
                .appendTo($('body')),
          w = o.width() + padding;

      o.remove();

      return w;
  },

  resizeInput: function(maxWidth, adjustHeight) {
    var text = $(this).val();
    var textWidth = river.utility.textWidth(text);
    var minWidth  = 100;
    var baseHeight  = 20;

    var width = Math.max(minWidth, textWidth);

    adjustHeight = typeof(adjustHeight) === "undefined" ?  true : adjustHeight;

    if ((typeof maxWidth !== "undefined") && (textWidth > maxWidth)) {
      if (adjustHeight) {
        var heightMultiplier = Math.ceil(textWidth / maxWidth);
        $(this).height(baseHeight * heightMultiplier);
      }
      $(this).width(maxWidth);
    } else {
      $(this).width(width);
    }

  },

  printStack: function() {
    var e = new Error('dummy');
    var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
        .replace(/^\s+at\s+/gm, '')
        .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
        .split('\n');
    console.log(stack);
  },

  normalizeTime: function(time) {
    return Math.floor(time * 1000) / 1000;
  }
});

