new PlayemLoader().loadAllPlayers().whenReady(function(playem){

	var toHide = document.getElementById("toHide");
	toHide.parentElement.removeChild(toHide);

	var TRACK =
		"https://api.soundcloud.com/tracks/53867958"
	    //"/sc/adrienjoly/wolfentrap-3d"
		// "/yt/o4LBGitcvi8"; // youtube video
		// "/vi/35982411"; // very short vimeo video
		// "https://www.dailymotion.com/video/x25ohb"; // contains a video ad that delays the onPlay event because of a linear ad -> new onBuffering event
		// "http://manisnotabird.bandcamp.com/track/the-sound-of-spring";

	// init testing environment
	var testUI = new TestUI(1, 1);
	playem = testUI.wrapPlayem(playem);
	playem.setPref("loop", false);
	var eventLogger = new PlayemLogger().listenTo(playem, testUI.onPlayerEvent);

	playem.addTrackByUrl(TRACK);
	playem.play();

	var runner = new TestRunner();
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
