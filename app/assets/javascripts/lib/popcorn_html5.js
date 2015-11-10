(function( Popcorn, window, document ) {

  var

  CURRENT_TIME_MONITOR_MS = 16,
  EMPTY_STRING = "",
  ABS = Math.abs;

  function HTML5Element( id ) {

    var self = this,
      element = typeof id === "string" ? document.querySelector( id ) : id,
      impl = {
        currentTime: 0,
      },
      currentTimeInterval,
      timeUpdateInterval,
      lastPlayerTime;

    // Namespace all events we'll produce
    self._eventNamespace = Popcorn.guid( "HTML5Element::" );

    self._util.type = "HTML5";

    var html5VideoEvents = [
      "progress",
      "suspend",
      "abort",
      "error",
      "emptied",
      "stalled",
      "loadedmetadata",
      "loadeddata",
      "canplay",
      "canplaythrough",
      "playing",
      "waiting",
      "seekin",
      "seeked",
      "ended",
      "durationchange",
      "timeupdate",
      "play",
      "pause",
      "ratechange",
      "resize",
      "volumechange"
    ];

    for (var i = 0; i < html5VideoEvents.length; i++) {
      var eventName = html5VideoEvents[i];

      element.addEventListener(eventName, function(originalEventName){ 
        self.dispatchEvent(originalEventName) 

        if (originalEventName === "loadedmetadata") {
          currentTimeInterval = setInterval( monitorCurrentTime,
                                             CURRENT_TIME_MONITOR_MS );
        } else if (originalEventName === "play") {
          clearInterval(timeUpdateInterval);
          timeUpdateInterval = setInterval( onTimeUpdate,
                                            self._util.TIMEUPDATE_MS );
        } else if (originalEventName === "pause") {
          clearInterval( timeUpdateInterval );
        }

      }.bind(this, eventName));
    };

    

    function monitorCurrentTime() {
      var playerTime = element.currentTime;
      var isPlaying = !element.paused;

      if ( !element.seeking ) {

        // var oldCurrentTime = impl.currentTime;

        // making player emit time at 60fps - http://stackoverflow.com/a/24514978/803865
        var playerTimeHasNotChanged = lastPlayerTime == playerTime;
        if (isPlaying && playerTimeHasNotChanged) {
          impl.currentTime += CURRENT_TIME_MONITOR_MS/1000;
        } else {
          impl.currentTime = playerTime;
        }

        // if (ABS( oldCurrentTime - playerTime ) > 0) {
        //   onTimeUpdate();
        // }
      }

      lastPlayerTime = playerTime;
    }

    function onTimeUpdate() {
      self.dispatchEvent( "timeupdate" );
    }

    self.play = function() {
      element.play();
    };

    self.pause = function() {
      element.pause();
    };

    Object.defineProperties( self, {

      src: {
        get: function() {
          return element.src;
        },
        set: function( aSrc ) {
          element.src = aSrc;
        }
      },

      autoplay: {
        get: function() {
          return element.autoplay;
        },
        set: function( aValue ) {
          element.autoplay = aValue;
        }
      },

      loop: {
        get: function() {
          return impl.loop;
        },
        set: function( aValue ) {
          impl.loop = self._util.isAttributeSet( aValue );
        }
      },

      width: {
        get: function() {
          return element.offsetWidth;
        }
      },

      height: {
        get: function() {
          return element.offsetHeight;
        }
      },

      currentTime: {
        get: function() {
          return impl.currentTime;
        },
        set: function( aValue ) {
          element.currentTime = aValue;
          impl.currentTime = aValue;
        }
      },

      duration: {
        get: function() {
          return element.duration;
        }
      },

      ended: {
        get: function() {
          return element.ended;
        }
      },

      paused: {
        get: function() {
          return element.paused;
        }
      },

      seeking: {
        get: function() {
          return element.seeking;
        }
      },

      readyState: {
        get: function() {
          return element.readyState;
        }
      },

      networkState: {
        get: function() {
          return element.networkState;
        }
      },

      playerObject: {
        get: function () {
          return element;
        }
      },

      volume: {
        get: function() {
          return element.volume;
        },
        set: function( aValue ) {
          element.volume = aValue;
        }
      },

      muted: {
        get: function() {
          return element.muted;
        },
        set: function( aValue ) {
          element.muted = aValue;
        }
      },

      error: {
        get: function() {
          return element.error;
        }
      },

      buffered: {
        get: function () {
          return element.buffered;
        }
      }
    });
  }

  HTML5Element.prototype = new Popcorn._MediaElementProto();
  HTML5Element.prototype.constructor = HTML5Element;

  Popcorn.HTML5Element = function( id ) {
    return new HTML5Element( id );
  };

  Popcorn.player( "html5" );

  Popcorn.html5 = function( container, url, options ) {

    var media = Popcorn.HTML5Element( container ),
        popcorn = Popcorn( media, options );


    return popcorn;
  };

}( Popcorn, window, document ));

