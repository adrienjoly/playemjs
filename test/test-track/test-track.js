new PlayemLoader().loadAllPlayers().whenReady(function(playem){

	var toHide = document.getElementById("toHide");
	toHide.parentElement.removeChild(toHide);

	var runner = new TestRunner();
	var eventLogger = new PlayemLogger().listenTo(playem);

	playem.setPref("loop", false);
	playem.addTrackByUrl("https://www.dailymotion.com/video/x25ohb"); // contains a video ad that delays the onPlay event because of a linear ad -> new onBuffering event
	//playem.addTrackByUrl("http://manisnotabird.bandcamp.com/track/the-sound-of-spring");
	playem.play();

	runner.addTests({
		"track starts playing (or buffering) in less than 10 seconds": function(cb){
			var done = false;
			function singleCb(res){
				!done && cb(res);
				done = true;
			}
			eventLogger.until("onBuffering", singleCb, 9000);
			eventLogger.until("onPlay", singleCb, 10000);
		}
	});

	runner.run(function(res){
		//playem.stop();
	});
});
