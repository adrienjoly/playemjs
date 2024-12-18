/** @typedef { `snd.sc/{string}` | `tracks/${number}` | `{string}/{string}` | `{string}/{string}#{string}` } SoundcloudId */ 
// Examples SoundcloudId values: 
// - /tracks/<number> (ready to stream)
// - or /<artistname>/<tracktitle>
// - or snd.sc/<hash>

function SoundCloudPlayer(){
  return SoundCloudPlayer.super_.apply(this, arguments);
};

(function() {
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

  /**
   * @param {string} url 
   * @returns {SoundcloudId | undefined}
   */
  Player.prototype.getEid = function(url) {
    // see test/test-detection/urls.txt for examples of urls to support
    url = unwrapUrl(url);
    if (/(soundcloud\.com)\/([\w-_\/]+)/.test(url)) {
      var parts = RegExp.lastParen.split("/");
      return parts.length === 2 && /*parts[0] !== "pages" &&*/ RegExp.lastParen;
    }
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

  /**
   * Best effort generation of metadata, based on URL.
   */
  Player.prototype.fetchMetadata = function(url, cb){
    const id = this.getEid(url);
    const parts = (id ?? '').split('/');
    return cb(parts.length === 2 && parts[0] !== 'tracks' ? {
      id,
      eId: "/sc/" + id,
      img: undefined,
      url: "https://soundcloud.com/" + id,
      title: parts[0].replace(/[\-_]+/g, " ") + " - " + parts[1].replace(/[\-_]+/g, " "),
      playerLabel: 'Soundcloud'
    } : undefined);
  }

  Player.prototype.getTrackPosition = async function(callback) {
    const ms = this.widget ? await new Promise(resolve => this.widget.getPosition(resolve)) : null;
    if (ms) {
      this.trackInfo.position = ms / 1000;
      callback(this.trackInfo.position);
    }
  };
  
  Player.prototype.setTrackPosition = function(pos) {
    this.safeCall("seekTo", pos * 1000);
  };

  /**
   * @param {SoundcloudId} id 
   */
  Player.prototype.play = function(id) {
    console.log("sc PLAY id:", id);
    this.trackInfo = {};

    let url;
    if (id.startsWith('snd.sc')) {
      console.error('cannot play soundcloud id:', id); // this kind of URL requires to follow a redirect, which can't be done in JS because of CORS
      return;
    } else if (id.startsWith("tracks/")){
      url = "https://api.soundcloud.com/" + id;
    } else {
      url = "https://soundcloud.com/" + id;
    }
    
    console.log("=> sc PLAY url:", url);
    this.embedVars.playerContainer.innerHTML = '';
    this.element = document.createElement("iframe");
    this.element.id = this.embedVars.playerId; // e.g. "soundcloud-widget"
    this.element.setAttribute("width", "100%");
    this.element.setAttribute("height", "100%");
    this.element.setAttribute("scrolling", "no");
    this.element.setAttribute("frameborder", "no");
    this.element.setAttribute("allow", "autoplay");
    console.log("=> sc PLAY url:", url);
    this.element.setAttribute("src", `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false`);
    this.embedVars.playerContainer.appendChild(this.element);

    this.embedVars.trackId = id;
    const SC = window.SC;
    this.widget = SC.Widget(this.element);
  
    this.widget.bind(SC.Widget.Events.ERROR, (err) => {
      const error = 'error displayed in embed';
      console.error("SC error: ", error);
      this.callHandler("onError", { error, source:"SoundCloudPlayer" })
    });
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

  Player.prototype.resume = function() {
    this.safeCall("play");
  }

  Player.prototype.pause = function() {
    this.safeCall("pause");
  }

  Player.prototype.stop = function() {
    this.embedVars.playerContainer.innerHTML = '';
    this.element = null;
    this.widget = null;
    this.trackInfo = {};
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
