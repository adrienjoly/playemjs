const fs = require('fs');
const assert = require('assert');

// define globals required by players
$ = {}; 
document = {};
window = {
  $,
  document,
  SC: { initialize: () => {} }, // for soundcloud
};

// load players
const players = [
  { id: "bc", name: "Bandcamp", Player: require('./../playem-bandcamp.js') },
  { id: "fi", name: "MP3 File", Player: require('./../playem-audiofile.js') },
  { id: "sc", name: "Soundcloud", Player: require('./../playem-soundcloud.js') },
];

const URLS_FILE = './test/test-detection/urls.txt';

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
    describe(`works for ${player.name} URLs`, () => {
      console.log(player.id , tracksPerPlayer[player.id]);
      for (const url of tracksPerPlayer[player.id]) {
        it(url, () => assert((new player.Player()).getEid(url)));
      }
    });
  }
});
