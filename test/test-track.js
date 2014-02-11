new PlayemLoader().loadAllPlayers(function(playem){

	var runner = new TestRunner();
	var eventLogger = new PlayemLogger().listenTo(playem);

	playem.setPref("loop", false);
	playem.addTrackByUrl("https://www.dailymotion.com/video/x25ohb"); // contains a video ad that delays the onPlay event because of a linear ad -> new onBuffering event
	playem.play();

	runner.addTests({
		"track starts playing (or buffering) in less than 10 seconds": function(cb){
			var done = false;
			function singleCb(res){
				!done && cb(res);
				done = true;
			}
			eventLogger.once("onBuffering", singleCb, 9000);
			eventLogger.once("onPlay", singleCb, 10000);
		}
	});

	runner.run(function(res){
		playem.stop();
	});
});
