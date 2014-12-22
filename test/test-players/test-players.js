new PlayemLoader().loadAllPlayers().whenReady(function(playem){

	var toHide = document.getElementById("toHide");
	toHide.parentElement.removeChild(toHide);

	var tracks = [
		// YOUTUBE
		"/yt/l1TcJKFB0sY",
		// SOUNDCLOUD
		"/sc/manisnotabird/bringer-of-rain-and-seed-good",
		// VIMEO
		"/vi/46314116", // Man is not a Bird - IV - Live at le Klub, Paris
		// DAILYMOTION
		"/dm/x142x6e_jean-jean-love_music",
		// JAMENDO
		"/ja/1115147",
		// BANDCAMP
		"/bc/3260779883#http://popplers5.bandcamp.com/download/track?enc=mp3-128&fsig=0faac63a94476bbdbf041d6cd0d8513e&id=3260779883&stream=1&ts=1393595969.0", // whyd eId
		// MP3
		"http://www.tonycuffe.com/mp3/tail%20toddle.mp3",
		// DEEZER
		"/dz/73414915",
		// SPOTIFY
		"/sp/63wxaMojZaS69nYttu7Fh1",
	];

	var nextIndex = 0;

	var commonTests = {
		"automatic switch to next track": function(cb){
			eventLogger.until("onTrackChange", function(evt, args){
				var index = ((args && args[0]) || {}).index;
				cb(index === nextIndex++);
			});
		},
		"track starts playing in less than 10 seconds": function(cb){
			eventLogger.until("onPlay", cb, 10000);
		},
		"set volume to 10%": function(cb){
			playem.setVolume(0.1);
			cb(true);
		},
		"get track duration": function(cb){
			var retries = 3;
			(function waitForDuration(){
				eventLogger.until("onTrackInfo", function(evt, args){
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
			eventLogger.until("onTrackInfo", function(evt, args){
				var trackPosition = ((args && args[0]) || {}).trackPosition;
				if (trackPosition && trackPosition >= targetPos)
					cb(true);
			});
		},
		"set volume to 50%": function(cb){
			playem.setVolume(0.5);
			setTimeout(function(){
				cb(true)
			}, 1000);
		},
		"skip to end of track": function(cb){
			var targetPos = 0.997;
			// give time for onTrackChange to be listened by first test
			setTimeout(function(){
				playem.seekTo(targetPos);
			}, 100);
			cb(true);
		},
	};

	// init testing environment
	var testUI = new TestUI(tracks.length, Object.keys(commonTests).length);
	playem = testUI.wrapPlayem(playem);
	playem.setPref("loop", false);
	var eventLogger = new PlayemLogger().listenTo(playem, testUI.onPlayerEvent);
	var runner = new TestRunner({
		onNewTest: testUI.onNewTest,
		onTestResult: testUI.onNewResult,
	});

	runner.addTests({
		"playem initializes without error": function(cb){
			cb(!!playem);
		},
		"all tracks load synchronously": function(cb){
			tracks.map(function(tr){
				//console.info("loading", tr, "...")
				playem.addTrackByUrl(tr, {url: tr});
			});
			cb(playem.getQueue().length == tracks.length);
			// give time for onTrackChange to be listened by first test
			setTimeout(function(){
				playem.play();
			}, 1000);
		},
	});

	for(var i in tracks)
		runner.addTests(commonTests);

	runner.addTests({
		"video container is clean": function(cb){
			setTimeout(function(){
				cb(!document.getElementById("container").innerHTML.length);
			}, 8000);
		}
	});

	runner.run(function(res){
		res = res || {};
		console.log('END OF TESTS => ' + (!!res.ok ? "OK" : "FAIL: " + res.title));
		playem.pause();
		playem.stop();
	});
});
