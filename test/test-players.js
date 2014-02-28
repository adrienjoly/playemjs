new PlayemLoader().loadAllPlayers(function(playem){

	playem.setPref("loop", false);

	var runner = new TestRunner();
	var eventLogger = new PlayemLogger().listenTo(playem);
	playem.on("onTrackChange", function(t){
		console.log("-> track", t.index, t.playerName, t.trackId);
	})

	var tracks = [
		"http://manisnotabird.bandcamp.com/track/the-sound-of-spring",
		"http://www.tonycuffe.com/mp3/tail%20toddle.mp3",
		//"https://archive.org/download/testmp3testfile/mpthreetest.mp3", // does not pass test... too short?
		//];  /*
		"//vimeo.com/46314116", // Man is not a Bird - IV - Live at le Klub, Paris
		"http://www.dailymotion.com/video/x142x6e_jean-jean-love_music",
		"//youtube.com/watch?v=iL3IYGgqaNU", // man is not a bird @ batofar
		"https://soundcloud.com/manisnotabird/bringer-of-rain-and-seed-good#https://api.soundcloud.com/tracks/71480483",
		//"//soundcloud.com/manisnotabird/sounds-of-spring", // /!\ you need to append the stream URL using ContentEmbed class first
		//"//youtube.com/v/kvHbAmGkBtI", // "RUSH in Rio" concert, WMG => not authorized on whyd
		//"https://youtube.com/watch?v=jmRI3Ew4BvA", // Yeah Yeah Yeahs - Sacrilege
		//"//soundcloud.com/manisnotabird/sounds-of-spring", // /!\ you need to append the stream URL using ContentEmbed class first
		//"http://soundcloud.com/manisnotabird/sounds-of-spring#http://api.soundcloud.com/tracks/90559805",
		"http://www.deezer.com/track/73414915",
		//"//youtube.com/watch?v=xxx", // should not work
		//*/
	];

	var nextIndex = 0;

	var commonTests = {
		"automatic switch to next track": function(cb){
			eventLogger.once("onTrackChange", function(args){
				var index = ((args && args[0]) || {}).index;
				cb(index === nextIndex++);
			}, 5000);
		},
		"track starts playing in less than 10 seconds": function(cb){
			eventLogger.once("onPlay", cb, 10000);
		},
		"set volume to 10%": function(cb){
			playem.setVolume(0.1);
			cb(true);
		},
		"get track duration": function(cb){
			var retries = 3;
			(function waitForDuration(){
				eventLogger.once("onTrackInfo", function(args){
					var trackDuration = ((args && args[0]) || {}).trackDuration;
					if(!trackDuration && --retries)
						waitForDuration();
					else
						cb(!!trackDuration);
				}, 1000);
			})()
		},
		"skip to middle of track": function(cb){
			var targetPos = 0.5;
			playem.seekTo(targetPos);
			eventLogger.once("onTrackInfo", function(args){
				var trackPosition = ((args && args[0]) || {}).trackPosition;
				cb(trackPosition && trackPosition >= targetPos);
			}, 1000);
		},
		"set volume to 50%": function(cb){
			playem.setVolume(0.5);
			setTimeout(function(){
				cb(true)
			}, 1000);
		},
		"skip to end of track": function(cb){
			var targetPos = 0.998;
			cb(true);
			playem.seekTo(targetPos);
		},
	};

	runner.addTests({
		"playem initializes without error": function(cb){
			cb(!!playem);
		},
		"all tracks load within 5 second": function(cb){
			var i = 0;
			(function next(){
				var tr = tracks[i++];
				if (tr) {
					console.info("loading", tr, "...")
					playem.addTrackByUrl(tr, null, next);
				}
			})();
			setTimeout(function(){
				cb(playem.getQueue().length == tracks.length);
				playem.play();
			}, 5000);
		},
	});

	for(var i in tracks)
		runner.addTests(commonTests);

	runner.run(function(res){
		playem.stop();
	});
});
