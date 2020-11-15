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
  { id: "sc", name: "Soundcloud", Player: require('./../playem-soundcloud.js') },
];

const URLS_FILE = './test/test-detection/urls.txt';

const lines = fs.readFileSync(URLS_FILE, 'utf8').split('\n');

describe('Player instanciation', function() {
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
      for (const line of lines) {
        const url = line.length && line[0] != "#" && line.split(/\s/)[0];
        if (url && url.startsWith(`/${player.id}/`) || new RegExp(player.name, 'i').test(url)) {
          it(url, () => assert((new player.Player()).getEid(url)));
        }
      }
    });
  }
});
