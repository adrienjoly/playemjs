var soundManager = require('SoundManager2').soundManager;
var swfobject = window.swfobject = require('swfobject');
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
  soundManager.setup({debugMode: DEBUG, url: "/lib/soundmanager2_xdomain.swf", flashVersion: 9, onready: function() {
    soundManager.isReady = true;
    window.soundManager = soundManager;
    cb();
  }});
  soundManager.beginDelayedInit();
}

function loadPlayem(players, playerParams, cb){
  console.log("browserify is loading and initializing playemjs...")
  var players = players || DEFAULT_PLAYERS;
  var playem = new Playem();
  initSoundManager(function(){
    for (var playerId in players) {
      console.log("- loading player:", playerId);
      playem.addPlayer(players[playerId], playerParams || DEFAULT_PLAYER_PARAMS); // instanciates player class
    }
    if (cb)
      //playem.on("onReady", cb);
      cb(playem);
  });
}

window.makePlayem = loadPlayem;

console.log("Browserify has loaded window.makePlayem()");
