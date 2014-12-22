// WARNING:
// The following global constants must be set before instantiation:
//             DEEZER_APP_ID and DEEZER_CHANNEL_URL

window.showMessage = window.showMessage || function(msg) {
  console.warn("[showMessage]", msg);
};

window.$ = window.$ || function(){return window.$};
$.getScript = $.getScript || function(js,cb){loader.includeJS(js,cb);};
$.append = $.append || function(html){document.write(html);};

function DeezerPlayer(){
  return DeezerPlayer.super_.apply(this, arguments);
}

(function(){

  // CONSTANTS
  var SDK_URL = 'https://cdns-files.deezer.com/js/min/dz.js',
      SDK_LOADED = false,
      IS_LOGGED = false,
      URL_REG = /(deezer\.com\/track|\/dz)\/(\d+)/,
      EVENT_MAP = {
        player_play: 'onPlaying',
        player_paused: 'onPaused',
        track_end: 'onEnded'
      };

  //============================================================================
  function Player(eventHandlers) {
    
    var self = this;
    
    this.label = 'Deezer';
    this.eventHandlers = eventHandlers || {};    
    this.currentTrack = {position: 0, duration: 0};
        
    loadSDK(function() {
      init(function() { 
        //console.log('DeezerPlayer ready');
        //DZ.getLoginStatus = function(cb) {cb && cb({userID: null})}
        DZ.getLoginStatus(function(response) {
          DZ.player.setRepeat(0);
          IS_LOGGED = response.userID;
          self.isReady = true;
          hookHandlers(self);
        });
      });
    });
    
  }
  
  //============================================================================
  Player.prototype.isLogged = function() {
    return IS_LOGGED;
  }
  
  //============================================================================
  Player.prototype.getEid = function(url) {
    return URL_REG.test(url) && RegExp.lastParen;
  }

  function fetchMetadata(id, cb){
    var callbackFct = "dzCallback_" + id.replace(/[-\/]/g, "__");
    window[callbackFct] = function(data){
      delete window[callbackFct];
      cb(!data || !data.album ? null : {
        id: id,
        title: data.artist.name + ' - ' + data.title,
        img: data.album.cover,
      });
    }
    loader.includeJS("//api.deezer.com/track/" + id + "?output=jsonp&callback=" + callbackFct);
  }

  Player.prototype.fetchMetadata = function(url, cb){
    var id = this.getEid(url);
    if (!id)
      return cb();
    fetchMetadata(id, cb);
  }

  //============================================================================
  Player.prototype.play = function(id) {
    var self = this;
    if (IS_LOGGED) {
      DZ.player.playTracks([id], 0);
    } else {
      DZ.api('/track/' + id, function(data) {
        showMessage(
          'This is a 30 secs preview. ' + 
          '<a href="javascript:DeezerPlayer.login()">' +
          'Connect to Deezer</a> to listen to the full track.'
        );
        self.sound = createSound(self, data.preview)
      });
    }    
  }
  
  //============================================================================
  Player.prototype.pause = function() {
    if (this.sound) {
      this.sound.pause();
    } else {
      DZ.player.pause();
    }
  }
  
  //============================================================================
  Player.prototype.stop = function() {
    if (!this.isReady)
      return;
    if (this.sound) {
      this.sound.stop();
      this.sound.destruct();
      this.sound = null;
    } else {
      DZ.player.pause();
    }    
  }
  
  //============================================================================
  Player.prototype.resume = function() {
    if (this.sound) {
      this.sound.resume();
    } else {
      DZ.player.play();
    }
  }
  
  //============================================================================
  // pos: seconds
  Player.prototype.setTrackPosition = function(pos) {
    if (this.sound)
      this.sound.setPosition(Math.round(pos * 1000));
    else
      DZ.player.seek(Math.round(100 * pos / this.currentTrack.duration));
  }
  
  //============================================================================
  // vol: float between 0 and 1
  Player.prototype.setVolume = function(vol) {
    if (this.sound)
      this.sound.setVolume(Math.round(vol * 100));
    else
      DZ.player.setVolume(Math.round(vol * 100));
  }
    
  //============================================================================  
  function loadSDK(cb) {
    if (!SDK_LOADED) {
      //$('body').append('<div id="dz-root"></div>');
      var dz = document.createElement('div'); dz.id = 'dz-root';
      document.getElementsByTagName("body")[0].appendChild(dz);
      $.getScript(SDK_URL, function() {
        console.log("DZ.override_https()", window.location.protocol === "https:");
        if (window.location.protocol === "https:")
          DZ.override_https();
        SDK_LOADED = true;
        cb();
      });
    } else {
      cb();
    }
  }

  //============================================================================
  function init(onload) {
    DZ.init({
      appId: DEEZER_APP_ID,
      channelUrl: DEEZER_CHANNEL_URL,
      player: {
        onload: onload
      }
    });
  }
  
  //============================================================================
  function hookHandlers(self) {
    DZ.Event.subscribe('player_position', function(eventObject){
      var onTrackInfoHandler = self.eventHandlers.onTrackInfo, 
          onEndedHandler = self.eventHandlers.onEnded,
          position = eventObject[0],
          duration = eventObject[1];
      if (onTrackInfoHandler) {
        self.currentTrack = {position: position, duration: duration};
        onTrackInfoHandler(self.currentTrack);
      }
      if ((duration - position <= 1.5) && onEndedHandler)
        onEndedHandler(self);
    });
    function createHandler(e) {
      return function() {
        var handler = self.eventHandlers[EVENT_MAP[e]];
        handler && handler(self);
      };
    }
    for (var e in EVENT_MAP)
      DZ.Event.suscribe(e, createHandler(e));
    self.eventHandlers.onApiReady && self.eventHandlers.onApiReady(self);
  }
  
  //============================================================================
  function createSound(self, url) {
    return soundManager.createSound({
      id: 'deezerSound' + Date.now(),
      url: url,
      autoLoad: true,
      autoPlay: true,
      whileplaying: function() {
        if (self.sound)
          self.currentTrack = {
            position: self.sound.position / 1000,
            duration: self.sound.duration / 1000
          };
        if (self.eventHandlers.onTrackInfo)
          self.eventHandlers.onTrackInfo(self.currentTrack);
      },
      onplay: function() {
        if (self.eventHandlers.onPlaying)
          self.eventHandlers.onPlaying(self);
      },
      onresume: function() {
        if (self.eventHandlers.onPlaying)
          self.eventHandlers.onPlaying(self);
      }, 
      onfinish: function() {
        if (self.eventHandlers.onEnded)
          self.eventHandlers.onEnded(self);
      }
    });    
  }
  
  //============================================================================  
  DeezerPlayer.login = function() {
    DZ.login(function(response) {
      if (response.userID) {
        IS_LOGGED = true;
        showMessage('Login successful. Your Deezer tracks will be full length from now on!');
      } else {
        showMessage('Deezer login unsuccesful.', true);
      }
    }, {perms: 'email'});
  }
  
  //============================================================================
  //return Player;
  //inherits(DeezerPlayer, Player);
  DeezerPlayer.prototype = Player.prototype;
  DeezerPlayer.super_ = Player;
})();
