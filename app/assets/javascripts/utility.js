$.extend(river.utility,{
  resizeInput: function() {
    // I'm assuming that 1 letter will expand the input by 10 pixels
    var oneLetterWidth = 6.3;

    // I'm also assuming that input will resize when at least five characters
    // are typed
    var minCharacters = 10;
    var len = $(this).val().length;
    if (len > minCharacters) {
        // increase width
        $(this).width(100 + (len - minCharacters) * oneLetterWidth);
    } else {
        // restore minimal width;
        $(this).width(100);
    }
  },

  printStack: function() {
    var e = new Error('dummy');
    var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
        .replace(/^\s+at\s+/gm, '')
        .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
        .split('\n');
    console.log(stack);
  }
});

