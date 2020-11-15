const fs = require('fs');
const assert = require('assert');
const fetch = require('node-fetch');

// define globals required by players
$ = {}; 
document = {
  getElementById: () => ({}), // for deezer
  createElement: () => ({}), // for deezer
};
loader = {
  includeJS: (src, cb) => cb && cb(), // for deezer
};
soundManager = {
  onready: (cb) => cb(), // for spotify
};
window = {
  $,
  document,
  loader, // for deezer
  soundManager, // for spotify
  attachEvent: () => {}, // for vimeo
  SC: { initialize: () => {} }, // for soundcloud
};

// load players
const players = [
  { id: "fi", name: "Audio file", Player: require('./../playem-audiofile.js') },
  { id: "bc", name: "Bandcamp", Player: require('./../playem-bandcamp.js') },
  { id: "dm", name: "Dailymotion", Player: require('./../playem-dailymotion.js') },
  { id: "dz", name: "Deezer", Player: require('./../playem-deezer.js') },
  { id: "ja", name: "Jamendo", Player: require('./../playem-jamendo.js') },
  { id: "sc", name: "Soundcloud", Player: require('./../playem-soundcloud.js') },
  { id: "sp", name: "Spotify", Player: require('./../playem-spotify.js') },
  { id: "vi", name: "Vimeo", Player: require('./../playem-vimeo.js') },
];

const URLS_FILE = './test/test-detection/urls.txt';

const eventHandlers = {
  onApiReady: () => {}, // for spotify
};

// populate tracksPerPlayer by parsing a list of urls from a file
function populateTracksPerPlayer(file) {
  const RE_PLAYER_ID = /\/([a-z]{2})\//;
  const tracksPerPlayer = {}; // { playerId -> url[] }
  let currentPlayerId = null;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (line.startsWith("# ")) {
      const hasPlayerId = line.match(RE_PLAYER_ID);
      currentPlayerId = hasPlayerId ? hasPlayerId.pop() : null;
    } else if (line.length && currentPlayerId) {
      const url = line.split(/\s/)[0];
      tracksPerPlayer[currentPlayerId] = [
        ...(tracksPerPlayer[currentPlayerId] || []),
        url,
      ];
    }
  }
  return tracksPerPlayer;
}

describe('Player instanciation', function() {
  for (const player of players) {
    it(`works for ${player.name}`, () => {
      it(player.name, () => assert((new player.Player())));
    });
  }
});

describe('Id extraction', function() {
  const tracksPerPlayer = populateTracksPerPlayer(URLS_FILE);
  delete tracksPerPlayer.sc; // TODO: fix tests for soundcloud => remove this line
  delete tracksPerPlayer.sp; // TODO: fix tests for spotify => remove this line
  for (const player of players) {
    describe(`works for ${player.name} URLs`, () => {
      if (!tracksPerPlayer[player.id]) {
        it.skip('(no URLs => skipping)', () => {});
        return;
      }
      for (const url of tracksPerPlayer[player.id]) {
        it(url, () => assert((new player.Player(eventHandlers)).getEid(url)));
      }
    });
  }
});

describe('Bandcamp track streaming', function() {

  const bandcampEntry = players.find(({ id }) => id === "bc");

  // setup environment
  $.getJSON = (url, callback) =>
    fetch(`https:${url.replace('&callback=?', '')}`)
      .then(res => res.text())
      .then(callback); // if the metadata is missing, BandcampPlayer will pass the error body to eventHandlers.onError()
  
  it(`works for track eId with stream URL`, (done) => {
    // set expectations
    const streamUrl = 'http://popplers5.bandcamp.com/download/track?enc=mp3-128&fsig=a5514873943b57d8d7b4567ee2f6295a&id=3049024530&stream=1&ts=1399281392.0';
    eventHandlers.onError = (_player, result) => {
      done(result.error && new Error(result.error));
    };
    soundManager.createSound = ({ url }) => {
      const itWorks = url === streamUrl;
      done(!itWorks);
    };
    // run the test
    const url = `https://mambobertier.bandcamp.com/track/tokyo-tripot-2#${streamUrl}`;
    const player = (new bandcampEntry.Player(eventHandlers));
    const eId = player.getEid(url);
    player.play(eId); // will call $.getJSON() to fetch track metadata from Bandcamp's API
  });

  it.skip(`works for track eId without stream URL`, (done) => { // TODO: fix the test => remove the skip
    // set expectation
    eventHandlers.onError = (_player, result) => {
      done(result.error && new Error(result.error)); // => {"error_message":"bad key","error":true}
    };
    // run the test
    const url = '/bc/seanschafianski/oppressed-people';
    const player = (new bandcampEntry.Player(eventHandlers));
    const eId = player.getEid(url);
    player.play(eId); // will call $.getJSON() to fetch track metadata from Bandcamp's API
  });
});
