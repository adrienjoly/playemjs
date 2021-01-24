//loader.includeJS("https://w.soundcloud.com/player/api.js");

//please set SOUNDCLOUD_CLIENT_ID before instanciation

function SoundCloudPlayer(){
  return SoundCloudPlayer.super_.apply(this, arguments);
};

(function() {
  var EVENT_MAP = {
      "onplay": "onPlaying",
      "onresume": "onPlaying",
      "onpause": "onPaused",
      "onstop": "onPaused",
      "onfinish": "onEnded"
    },
    ERROR_EVENTS = [
      "onerror",
      "ontimeout",
      "onfailure",
      "ondataerror"
    ],
    RESOLVE_URL = "https://api.soundcloud.com/resolve.json";

  function Player(eventHandlers, embedVars) {  
    this.label = 'SoundCloud';
    this.eventHandlers = eventHandlers || {};
    this.embedVars = embedVars || {};
    this.element = null;
    this.widget = null;
    this.isReady = false;
    this.trackInfo = {};
    this.soundOptions = {autoPlay:true};

    var that = this;

    this.callHandler = function(name, params) {
      try {
        eventHandlers[name] && eventHandlers[name](params);//.apply(null, params);
      }
      catch (e) {
        console.error("SC error:", e, e.stack);
      }
    };

    function init() {
      for (var i in EVENT_MAP)
        (function(i) {
          that.soundOptions[i] = function() {
            //console.log("SC event:", i /*, this*/);
            var handler = eventHandlers[EVENT_MAP[i]];
            handler && handler(that);
          }
        })(i);
      ERROR_EVENTS.map(function(evt){
        that.soundOptions[evt] = function(e) {
          console.error("SC error:", evt, e, e.stack);
          that.eventHandlers.onError && that.eventHandlers.onError(that, {code:evt.substr(2), source:"SoundCloudPlayer"});
        };
      });
      that.isReady = true;
      try {
        window.soundManager.onready(function() {
          that.callHandler("onApiReady", that);
        });
      }
      catch(e){
        console.warn("warning: soundManager was not found => playem-soundcloud will not be able to stream music");
        that.callHandler("onApiReady", that);
      }
    }

    if (window.SC)
      init();
    else {
      loader.includeJS("https://connect.soundcloud.com/sdk.js", function(){
        window.SC.initialize({client_id: window.SOUNDCLOUD_CLIENT_ID});
        init();
      });
    }
  }

  Player.prototype.safeCall = function(fctName, param) {
    try {
      //console.log("SC safecall", fctName);
      if (this.widget && this.widget[fctName])
        this.widget[fctName](param);
    }
    catch(e) {
      console.error("SC safecall error", e.stack);
    }
  }

  function unwrapUrl(url){
    return /(soundcloud\.com)\/player\/?\?.*url\=([^\&\?]+)/.test(url) ? decodeURIComponent(RegExp.lastParen) : url.replace(/^\/sc\//, "http://soundcloud.com/");
  }

  Player.prototype.getEid = function(url) {
    url = unwrapUrl(url);
    if (/(soundcloud\.com)(\/[\w-_\/]+)/.test(url)) {
      var parts = RegExp.lastParen.split("/");
      return parts.length === 3 && /*parts[1] !== "pages" &&*/ RegExp.lastParen;
    }
    else if (/snd\.sc\/([\w-_]+)/.test(url))
      return RegExp.lastMatch;
    // => returns:
    // - /tracks/<number> (ready to stream)
    // - or /<artistname>/<tracktitle>
    // - or snd.sc/<hash>
    // or null / false (if not a track)
  }

  function searchTracks(query, limit, cb){
    function waitFor(objName, cb){
      setTimeout(function(){
        if (window[objName])
          cb(window[objName]);
        else
          waitFor(objName, cb);
      }, 200);
    }

    function translateResult(r){
      r.title = r.title || r.name;
      return {
        eId: "/sc" + r.permalink_url.substr(r.permalink_url.indexOf("/", 10)) + "#" + r.uri,
        img: r.img || r.artwork_url || "/images/cover-soundcloud.jpg",
        url: r.url || r.permalink_url + "#" + r.uri,
        title: (r.title.indexOf(" - ") == -1 ? r.user.username + " - " : "") + r.title,
        playerLabel: 'Soundcloud'
      };
    }

    waitFor("SC", function(SC){
      SC.get('/tracks', {q: query, limit: limit}, function(results) {
        if ( results instanceof Array) {
          var tracks = results.map(translateResult);
          cb(tracks);
        };
      });
    });
  }

  Player.prototype.searchTracks = function(query, limit, cb){
    searchTracks(query, limit, cb); 
  }

  function fetchMetadata(url, cb){
    var splitted, params, trackId, method;
    if (!window.SOUNDCLOUD_CLIENT_ID) {
      console.error("error: SOUNDCLOUD_CLIENT_ID is not set => fetchMetadata() will not call Soundcloud's API");
      cb();
      return;
    }
    url = unwrapUrl(url);
    splitted = url.split("?");
    params = splitted.length > 1 ? splitted[1] + "&" : ""; // might include a secret_token
    trackId = /\/tracks\/(\d+)/.test(splitted[0]) ? RegExp.lastParen : null;
    method = (!!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/)) ? "loadJSONP" : "loadJSON";
    if (trackId)
      loader[method]("https://api.soundcloud.com/tracks/" + trackId + ".json?" + params
        + "client_id=" + window.SOUNDCLOUD_CLIENT_ID, cb);
    else
      loader[method](RESOLVE_URL + "?client_id=" + window.SOUNDCLOUD_CLIENT_ID
        + "&url=" + encodeURIComponent("http://" + url.replace(/^(https?\:)?\/\//, "")), cb);
  }

  Player.prototype.fetchMetadata = function(url, cb){
    var embed = {};
    if (!this.getEid(url))
      return cb();
    fetchMetadata(url, function(data) {
      if (data && data.kind == "track") {
        embed.id = "" + data.id;
        embed.eId = "/sc/" + data.permalink_url.substr(data.permalink_url.indexOf("/", 10) + 1)
          + /*"/" + data.id +*/ "#" + data.stream_url;
        embed.img = data.artwork_url || embed.img;
        embed.title = data.title;
        if (embed.title.indexOf(" - ") == -1 && (data.user || {}).username)
          embed.title = data.user.username + " - " + embed.title;
      }
      cb(embed);
    });
  }

  Player.prototype.getTrackPosition = function(callback) {
    callback(this.trackInfo.position = this.widget.position / 1000);
    if (this.widget.durationEstimate)
      this.eventHandlers.onTrackInfo && this.eventHandlers.onTrackInfo({
        duration: this.widget.duration / 1000
      });
  };
  
  Player.prototype.setTrackPosition = function(pos) {
    this.safeCall("setPosition", pos * 1000);
  };

  Player.prototype.play = function(id) {
    //console.log("sc PLAY id:", id)
    this.trackInfo = {};
    var that = this;
    function playId(id){
      //console.log("=> sc PLAY id:", id)
      that.embedVars.trackId = id;
      //console.log("soundcloud play", this.embedVars);
      window.SC.stream(id, that.soundOptions, function(sound){
        that.widget = sound;
        that.callHandler("onEmbedReady", that);
        //that.safeCall("play");
      });
    }
    if (id.indexOf("/tracks/") == 0)
      return playId(id);
    id = "http://" + (!id.indexOf("/") ? "soundcloud.com" : "") + id;
    //console.log("sc resolve url:", id);
    fetchMetadata(id, function(data){
      playId((data || {}).id);
    });
  }

  Player.prototype.resume = function() {
    this.safeCall("play");
  }

  Player.prototype.pause = function() {
    this.safeCall("pause");
  }

  Player.prototype.stop = function() {
    this.safeCall("stop");
  }

  Player.prototype.setVolume = function(vol) {
    this.safeCall("setVolume", 100 * vol);
  }

  //inherits(SoundCloudPlayer, Player);
  SoundCloudPlayer.prototype = Player.prototype;
  SoundCloudPlayer.super_ = Player;
  // this method exports Player under the name "SoundCloudPlayer", even after minification
  // so that SoundCloudPlayer.name == "SoundCloudPlayer" instead of SoundCloudPlayer.name == "Player"
})();

try{
  module.exports = SoundCloudPlayer;
}catch(e){};
