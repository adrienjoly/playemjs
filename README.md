[![Analytics](https://ga-beacon.appspot.com/UA-1858235-12/playemjs/github)](https://github.com/igrigorik/ga-beacon)

PlayemJS
========

PlayemJS is a javascript component that manages a music/video track queue and plays a sequence of songs by embedding several players in a HTML DIV including Youtube, Soundcloud and Vimeo.

PlayemJS powers the music curation service [Whyd.com](http://whyd.com). That's the best demonstration of its capabilities.

Usage with npm & browserify
------------------------------------------

    npm install playemjs

Then use it that way in your front-end code:

    <html>
    <body>
      <div id="container"></div>
      <script src="your-browserify-bundle.js"></script>
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
    </body>
    </html>


Install using Bower
-------------------

    bower install playemjs
    make install
    make compile
    make tests

... or download the javascript files (playem.js and player files you need) into your public directory of your web project.

Usage example
-------------

The following lines of HTML and Javascript create a container and play two videos in it, sequentially.

    <div id="container"></div>
    <script>
    new PlayemLoader().loadAllPlayers().whenReady(function(playem){
      playem.addTrackByUrl("https://www.youtube.com/watch?v=fuhHU_BZXSk");
      playem.addTrackByUrl("https://www.dailymotion.com/video/x25ohb");
      playem.play();
    });
    </script>
    
You can run tests from that page: [PlayemJS Video Player Tests](http://rawgit.com/adrienjoly/playemjs/master/test/index.html)

If they don't work from there, you can clone the project, and run them locally.

Any help in documenting/fixing/developing this project is welcome! :-)
