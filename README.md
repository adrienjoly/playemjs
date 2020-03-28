[![Analytics](https://ga-beacon.appspot.com/UA-1858235-12/playemjs/github)](https://github.com/igrigorik/ga-beacon)

PlayemJS
========

PlayemJS is a front-end JavaScript component that manages a audio/video track queue and plays those tracks sequentially.

It can currently play tracks from the following streaming platforms:
- Youtube
- Soundcloud
- Deezer
- Bandcamp
- Vimeo
- Dailymotion
- Jamendo
- ... and MP3 files hosted online

Depending on the platform of each track, PlayemJS dynamically embeds the media in a HTML element, or through the Soundmanager2 audio player.

PlayemJS powers the music curation service [Openwhyd.org](http://openwhyd.org) (formerly whyd.com). That's the best demonstration of its capabilities.

Examples
-----

### 1. Play just a Vimeo video

```html
<div id="playem_video"></div>
<script src="playem.js"></script>
<script src="playem-vimeo.js"></script>
<script>
  const handlers = {};
  const config = {
      playerContainer: document.getElementById("playem_video"),
  };

  new VimeoPlayer(handlers, config)
    .play("98417189");
</script>
```

▶️ [Watch it work live on Codepen](http://codepen.io/adrienjoly/pen/QjLRXa?editors=101)

### 2. Play Vimeo and Youtube videos

Using a playlist, multiple players and Event logging.

```html
<div id="playem_video"></div>
<script src="playem.js"></script>
<script src="playem-vimeo.js"></script>
<script src="playem-youtube.js"></script>
<script>
  YOUTUBE_API_KEY = "XxXxXxXxXxXxXxXxXxXxXxXxXxXxXx"; 

  const config = {
      playerContainer: document.getElementById("playem_video"),
  };

  // init playem and players
  var playem = new Playem();
  playem.addPlayer(VimeoPlayer, config);
  playem.addPlayer(YoutubePlayer, config);

  // play video tracks
  playem.addTrackByUrl("vimeo.com/50872925");
  playem.addTrackByUrl("youtube.com/watch?v=2m5K5jxME18");
  playem.play();
</script>
```

▶️ [Watch it work live on Codepen](https://codepen.io/adrienjoly/pen/EXXEXq?editors=1011)

### 3. Play Video and Audio streams

Relies on soundmanager2.

```html
<div id="playem_video"></div>
<script src="playem.js"></script>
<script src="playem-vimeo.js"></script>
<script src="playem-audiofile.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/soundmanager2/2.97a.20150601/script/soundmanager2-jsmin.js"></script>
<script>
  const config = {
      playerContainer: document.getElementById("playem_video"),
  };

  // init playem and players
  var playem = new Playem();
  playem.addPlayer(AudioFilePlayer, config);
  playem.addPlayer(VimeoPlayer, config);

  // init logging for player events
  playem.on("onTrackChange", (data) => console.log("play track " + data.trackId));
  playem.on("onError", (data) => console.error("error:", data));

  // create a playlist
  playem.addTrackByUrl("https://archive.org/download/JeremyJereskyDrumLoop/drumLoop.mp3");
  playem.addTrackByUrl("vimeo.com/50872925");

  // wait for soundmanager to be ready before playing tracks
  soundManager.setup({ onready: () => playem.play() });
  soundManager.beginDelayedInit();
</script>
```

▶️ [Watch it work live on Codepen](https://codepen.io/adrienjoly/pen/bRRMdQ?editors=1011)


Usage with npm
--------------

    npm install playemjs

Then use it that way in your front-end code:

```html
<div id="container"></div>
<script src="dist/playem-min.js"></script>
<script>
  // your app's API KEYS here
  window.SOUNDCLOUD_CLIENT_ID = "11f9999111b5555c22227777c3333fed"; // your api key
  window.DEEZER_APP_ID = 123456789;
  window.DEEZER_CHANNEL_URL = "http://mysite.com/deezer-channel.html";
  window.JAMENDO_CLIENT_ID = "f9ff9f0f";

  var playerParams = {
    playerId: "genericplayer",
    origin: window.location.host || window.location.hostname,
    playerContainer: document.getElementById("container")
  };

  window.makePlayem(null, playerParams, function onLoaded(playem){
    playem.on("onTrackChange", function(track){
      console.log("streaming track " + track.trackId + " from " + track.playerName);
    });
    playem.addTrackByUrl("https://www.youtube.com/watch?v=fuhHU_BZXSk");
    playem.addTrackByUrl("https://www.dailymotion.com/video/x25ohb");
    playem.play();
  });
</script>
```

React component
---------------

(Work in progress) Check out [react-music-player](https://github.com/adrienjoly/react-music-player).

Tests and further development
-----------------------------
    
You can run tests from that page:

- [PlayemJS Youtube Video Test](https://cdn.rawgit.com/adrienjoly/playemjs/master/test/sample.html)
- [PlayemJS Video Players Test](https://cdn.rawgit.com/adrienjoly/playemjs/master/test/test-players/index.html)
- [PlayemJS URL Detection Test](https://cdn.rawgit.com/adrienjoly/playemjs/master/test/test-detection/index.html)


If they don't work from there, you can clone the project, and run them locally.

Any help in documenting/fixing/developing this project is welcome! :-)
