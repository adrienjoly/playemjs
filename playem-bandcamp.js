window.$ = window.$ || function(){return window.$};
$.getJSON = $.getJSON || function(url,cb){
  var cbName = "_cb_" + Date.now();
  url = url.replace("callback=?", "callback=" + cbName);
  window[cbName] = function(){
    //console.log(url, "ok");
    cb.apply(window, arguments);
    delete window[cbName];
  };
  //console.log(url, "...");
  loader.includeJS(url);
};

function BandcampPlayer(){
  return BandcampPlayer.super_.apply(this, arguments);
}

(function(API_KEY){

  var API_PREFIX = '//api.bandcamp.com/api',
      API_SUFFIX = '&key=' + API_KEY + '&callback=?';

  function isBandcampEid(url) {
    return url.indexOf("/bc/") == 0 && url.substr(4);
  }

  function extractArtistAndTrackFromUrl(url){
    var match = url.match(isBandcampEid(url) ? (/\/bc\/([a-zA-Z0-9_\-]+)\/([a-zA-Z0-9_\-]+)/) : /([a-zA-Z0-9_\-]+).bandcamp\.com\/track\/([a-zA-Z0-9_\-]+)/);
    return (match || []).length === 3 && match.slice(1);
  }

  function makeEidFromUrl(url){
    var match = extractArtistAndTrackFromUrl(url),
        streamUrl = url.split("#")[1];
    return match && (match[0] + "/" + match[1] + (streamUrl ? "#" + streamUrl : ""));
  }

  function isStreamUrl(url) {
    return url.indexOf("bandcamp.com/download/track") != -1;
  }

  function fetchStreamUrl(url, cb){
    url = "http://" + url.split("//").pop();
    $.getJSON(API_PREFIX + '/url/1/info?url=' + encodeURIComponent(url) + API_SUFFIX, function(data) {
      var trackId = (data || {}).track_id;
      if (!trackId) {
        //console.error("bandcamp: unexpected result from /url/1/info:", data);
        return cb(data);
      }
      $.getJSON(API_PREFIX + '/track/3/info?track_id=' + trackId + API_SUFFIX, function(data) {
        cb(null, (data || {}).streaming_url);
      });
    });
  }

  //============================================================================
  function Player(eventHandlers) {
    var self = this, loading = null;
    this.label = 'Bandcamp';
    this.eventHandlers = eventHandlers || {};
    this.currentTrack = {position: 0, duration: 0};
    this.sound = null;
    this.isReady = false;
    loading = setInterval(function(){
      if (!!window["soundManager"]) {
        clearInterval(loading);
        self.isReady = true;
        self.clientCall("onApiReady", self);
      }
    }, 200);
  }
  
  //============================================================================
  Player.prototype.clientCall = function(fctName, p) {
    var args = Array.apply(null, arguments).slice(1) // exclude first arg
    //try {
      return (this.eventHandlers[fctName] || function(){}).apply(null, args);
    //}
    //catch(e) {
    //  console.error(e.stack);
    //}
  }
  
  //============================================================================
  Player.prototype.soundCall = function(fctName, p) {
    var args = Array.apply(null, arguments).slice(1) // exclude first arg
    return ((this.sound || {})[fctName] || function(){}).apply(null, args);
  }
  
  //============================================================================
  Player.prototype.getEid = function(url) {
    return isBandcampEid(url) || makeEidFromUrl(url);
  }

  Player.prototype.fetchMetadata = function(url, cb) {
    var match = extractArtistAndTrackFromUrl(url);
    cb(!match ? null : {
      id: makeEidFromUrl(url),
      img: "//s0.bcbits.com/img/bclogo.png", // TODO: fetch actual cover art and other metadata
      title: match[0].replace(/[\-_]+/g, " ") + " - " + match[1].replace(/[\-_]+/g, " ")
    });
  };

  Player.prototype.playStreamUrl = function(url) {
    var self = this;
    if (!url)
      return self.clientCall("onError", self, {source:"BandcampPlayer", code:"no_stream"});
    url = "http://" + url.split("//").pop();
    self.sound = soundManager.createSound({
      id: '_playem_bc_' + Date.now(),
      url: url,
      autoLoad: true,
      autoPlay: true,
      whileplaying: function() {
        self.clientCall("onTrackInfo", self.currentTrack = {
          position: self.sound.position / 1000,
          duration: self.sound.duration / 1000
        });
      },
      onplay: function(a) {
        self.clientCall("onPlaying", self);
      },
      onresume: function() {
        self.clientCall("onPlaying", self);
      }, 
      onfinish: function() {
        self.clientCall("onEnded", self);
      }
    });
  }

  //============================================================================
  Player.prototype.play = function(id) {
    var self = this;
    if (isStreamUrl(id))
      this.playStreamUrl(id);
    else
      fetchStreamUrl(id, function(err, url){
        if (err || !url)
          self.clientCall("onError", self, { source: "BandcampPlayer", error: (err || {}).error_message }); // e.g. "bad api key"
        else
          this.playStreamUrl(url);
      });
  }
  
  //============================================================================
  Player.prototype.pause = function() {
    this.soundCall("pause");
  }
  
  //============================================================================
  Player.prototype.stop = function() {
    this.soundCall("stop");
    this.soundCall("destruct");
    this.sound = null;
  }
  
  //============================================================================
  Player.prototype.resume = function() {
    this.soundCall("resume");
  }
  
  //============================================================================
  // pos: seconds
  Player.prototype.setTrackPosition = function(pos) {
    this.soundCall("setPosition", Math.round(pos * 1000));
  }
  
  //============================================================================
  // vol: float between 0 and 1
  Player.prototype.setVolume = function(vol) {
    this.soundCall("setVolume", Math.round(vol * 100));
  }
  
  //============================================================================
  //return Player;
  //inherits(BandcampPlayer, Player);
  BandcampPlayer.prototype = Player.prototype;
  BandcampPlayer.super_ = Player;
})('vatnajokull');
