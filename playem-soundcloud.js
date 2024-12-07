//loader.includeJS("https://w.soundcloud.com/player/api.js");


function SoundCloudPlayer(){
  return SoundCloudPlayer.super_.apply(this, arguments);
};

(function() {
  const ERROR_EVENTS = [
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
    this.soundOptions = {};

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
      ERROR_EVENTS.map(function(evt){
        that.soundOptions[evt] = function(e) {
          console.error("SC error:", evt, e, e.stack);
          that.eventHandlers.onError && that.eventHandlers.onError(that, {code:evt.substr(2), source:"SoundCloudPlayer"});
        };
      });
      that.isReady = true;
      that.callHandler("onApiReady", that);
    }

    if (window.SC)
      init();
    else {
      loader.includeJS("https://w.soundcloud.com/player/api.js", function(){
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
    url = unwrapUrl(url);
    splitted = url.split("?");
    params = splitted.length > 1 ? splitted[1] + "&" : ""; // might include a secret_token
    trackId = /\/tracks\/(\d+)/.test(splitted[0]) ? RegExp.lastParen : null;
    method = (!!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/)) ? "loadJSONP" : "loadJSON";
    if (trackId)
      loader[method]("https://api.soundcloud.com/tracks/" + trackId + ".json?" + params, cb);
    else
      loader[method](RESOLVE_URL + "?url=" + encodeURIComponent("http://" + url.replace(/^(https?\:)?\/\//, "")), cb);
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
    this.widget.getPosition((ms) => {
      callback(this.trackInfo.position);
    });
  };
  
  Player.prototype.setTrackPosition = function(pos) {
    this.safeCall("setPosition", pos * 1000); // TODO
  };

  Player.prototype.play = function(id) {
    //console.log("sc PLAY id:", id)
    this.trackInfo = {};
    const playId = (id) => {
      console.log("=> sc PLAY id:", id);

      this.embedVars.playerContainer.innerHTML = '';
      this.element = document.createElement("iframe");
      this.element.id = this.embedVars.playerId; // e.g. "soundcloud-widget"
      this.element.setAttribute("width", "100%");
      this.element.setAttribute("height", "100%");
      this.element.setAttribute("scrolling", "no");
      this.element.setAttribute("frameborder", "no");
      this.element.setAttribute("allow", "autoplay");
      const url = "https://api.soundcloud.com" + id.split('soundcloud.com').pop(); // e.g. "https://api.soundcloud.com/tracks/123456789"
      console.log("=> sc PLAY url:", url);
      this.element.setAttribute("src", `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false`);
      this.embedVars.playerContainer.appendChild(this.element);

      this.embedVars.trackId = id;
      this.widget = SC.Widget(this.element);

      this.widget.bind(SC.Widget.Events.PLAY, () => this.callHandler("onPlaying", this));
      this.widget.bind(SC.Widget.Events.PAUSE, () => this.callHandler("onPaused", this));
      this.widget.bind(SC.Widget.Events.FINISH, () => this.callHandler("onEnded", this));
      this.widget.bind(SC.Widget.Events.PLAY_PROGRESS, ({ currentPosition }) => {
        this.trackInfo.position = currentPosition / 1000;
        this.eventHandlers.onTrackInfo && this.eventHandlers.onTrackInfo(this.trackInfo);
      });
      this.widget.bind(SC.Widget.Events.READY, () => {
        console.log("READY");
        this.widget.getDuration((ms) => {
          this.trackInfo.duration = ms / 1000;
        });
        this.widget.play();
        this.callHandler("onEmbedReady", this);
      });
    }
    if (id.indexOf("/tracks/") == 0)
      return playId(id);
    id = "http://" + (!id.indexOf("/") ? "soundcloud.com" : "") + id;
    playId(id);
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
