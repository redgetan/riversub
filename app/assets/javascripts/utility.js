$.extend(river.utility,{
  MAX_SUBTITLE_LENGTH: 240,
  escapeHtml: function(string) {
    var entityMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': '&quot;',
      "'": '&#39;',
      "/": '&#x2F;'
    };
    
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  },

  textWidth: function(text) {
    // http://stackoverflow.com/a/5047712

      // if text contains multiple lines, only get the longest line 
      text = text.split("\n").sort(function (a, b) { return b.length - a.length; })[0];

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
  },

  enableHashTab: function() {
    // http://stackoverflow.com/questions/12131273/twitter-bootstrap-tabs-url-doesnt-change
    var hash = window.location.hash;

    if (hash) {
      $('ul.nav a[href="' + hash + '"]').tab('show');
    }

    $('.nav-tabs a').click(function (e) {
      $(this).tab('show');
      var scrollmem = $('body').scrollTop();
      window.location.hash = this.hash;
      $('html,body').scrollTop(scrollmem);
    });
  },

  enableMarkdownHelper: function() {
    $(".markdown_help_toggler").on("click", function(event){
      event.preventDefault();
      
      if ($(".markdown_help").is(":visible")) {
        $(".markdown_help").hide();  
        $(".markdown_help_toggler").text("formatting help");
      } else {
        $(".markdown_help").show();  
        $(".markdown_help_toggler").text("hide help");
      }
    });
  },
  isMobile: function() {
    if( navigator.userAgent.match(/Android/i)
     || navigator.userAgent.match(/webOS/i)
     || navigator.userAgent.match(/iPhone/i)
     || navigator.userAgent.match(/iPad/i)
     || navigator.userAgent.match(/iPod/i)
     || navigator.userAgent.match(/BlackBerry/i)
     || navigator.userAgent.match(/Windows Phone/i)
    ){
      return true;
    }
    else {
      return false;
    }
  },
  resizeTextAreaHeight: function($el) {
    var padding = 1;
    $el.css({'height':'auto','overflow-y':'hidden'})
        .height($el[0].scrollHeight - padding);
  },

  nonUIBlockingBatchProcess: function(array, callback, batch) {
    batch = batch || 10;

    var index = 0;

    function processBatch() {
      if (index >= array.length) return;

      var i = 0;

      while (i < batch && index < array.length) {
          callback(array[index]);
          index = index + 1;
          i = i + 1;
      }

      setTimeout(processBatch, 0);
    }    

    processBatch();    
  },

  isTextAreaFirstRow: function($el) {
    if (!$el.is("textarea")) return false;

    var currRow = $el.val().substr(0, $el[0].selectionStart).split("\n").length;

    return currRow === 1; 
  },

  isTextAreaLastRow: function($el) {
    if (!$el.is("textarea")) return false;

    var numRows = $el.val().split("\n").length;
    var currRow = $el.val().substr(0, $el[0].selectionStart).split("\n").length;
    
    return currRow === numRows; 
  }

});

