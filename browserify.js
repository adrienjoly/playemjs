var soundManager = require('SoundManager2').soundManager;
var Playem = window.Playem = require('./playem.js');

// constants / configuration
var DEBUG = false;

var DEFAULT_PLAYERS = {
  "Youtube": require('./playem-youtube.js'),
  "SoundCloud": require('./playem-soundcloud.js'),
  "Vimeo": require('./playem-vimeo.js'),
  "Dailymotion": require('./playem-dailymotion.js'),
  "Deezer": require('./playem-deezer.js'),
  "AudioFile": require('./playem-audiofile.js'),
  "Bandcamp": require('./playem-bandcamp.js'),
  "Jamendo": require('./playem-jamendo.js'),
//"Spotify": require('./playem-spotify.js'),
};

var DEFAULT_PLAYER_PARAMS = {
  playerId: "genericplayer",
  origin: window.location.host || window.location.hostname,
  playerContainer: document.getElementById("container")
};

function initSoundManager(cb){
  if (window.soundManager && window.soundManager.isReady)
    return cb();
  window.soundManager.setup({debugMode: DEBUG, url: "/lib/soundmanager2_xdomain.swf", flashVersion: 9, onready: function() {
    window.soundManager.isReady = true;
    cb();
  }});
  window.soundManager.beginDelayedInit();
}

function loadPlayem(players, playerParams, cb){
  var players = players || DEFAULT_PLAYERS;
  var playem = new Playem();
  initSoundManager(function(){
    for (var playerId in players) {
      try{
        playem.addPlayer(players[playerId], playerParams || DEFAULT_PLAYER_PARAMS); // instanciates player class  
      }
      catch(e){
        console.error("PlayemJS error while loading", playerId, ":", e);
      }
    }
    if (cb)
      //playem.on("onReady", cb);
      cb(playem);
  });
}

module.exports.makePlayem = loadPlayem;
