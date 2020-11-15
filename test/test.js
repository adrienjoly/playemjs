const fs = require('fs');
const assert = require('assert');

// define globals required by players
$ = {}; 
document = {
  getElementById: () => ({}), // for deezer
  createElement: () => ({}), // for deezer
};
loader = {
  includeJS: (src, cb) => cb(), // for deezer
};
soundManager = {
  onready: (cb) => cb(), // for spotify
};
window = {
  $,
  document,
  loader, // for deezer
  soundManager, // for spotify
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
  tracksPerPlayer = populateTracksPerPlayer(URLS_FILE);
  for (const player of players) {
    it(`works for ${player.name}`, () => {
      it(player.name, () => assert((new player.Player())));
    });
  }
});

describe('Id extraction', function() {
  for (const player of players) {
    if (player.name === "Soundcloud") continue; // TODO: re-activate
    if (player.name === "Spotify") continue; // TODO: re-activate
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
