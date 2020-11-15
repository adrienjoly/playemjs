const fs = require('fs');
const assert = require('assert');

// define globals required by players
$ = {}; 
document = {};
window = { $, document };

// load players
const BandcampPlayer = require('./../playem-bandcamp.js');

describe('Id extraction', function() {
  it('works for Bandcamp URLs', function() {

    const lines = fs.readFileSync('./test/test-detection/urls.txt', 'utf8').split('\n');

    const bandcampPlayer = new BandcampPlayer();

    for (const line of lines) {
      const url = line.length && line[0] != "#" && line.split(/\s/)[0];
      if (url && url.startsWith('/bc/')) {
        const eId = bandcampPlayer.getEid(url);
        // console.log(url, eId);
        assert(eId);
      }
    }
  });
});
