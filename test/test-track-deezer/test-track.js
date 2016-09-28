new PlayemLoader().loadAllPlayers().whenReady(function(playem){

	var toHide = document.getElementById("toHide");
	toHide.parentElement.removeChild(toHide);

	var TRACK = "/dz/73414915";

	// init testing environment
	var testUI = new TestUI(1, 1);
	playem = testUI.wrapPlayem(playem);
	playem.setPref("loop", false);
	var eventLogger = new PlayemLogger().listenTo(playem, testUI.onPlayerEvent);

	playem.addTrackByUrl(TRACK);
	playem.play();
	/*
	// this is necessary to show the deezer login URL, in order to play the track in full
	window.showMessage = function(msg) {
		document.body.innerHTML = document.body.innerHTML
			+ "<pre><code>[showMessage] " + msg + "</code></pre>";
	};
	// ... BUT altering innerHTML breaks the Deezer player!
	// cf http://stackoverflow.com/a/39724214/592254
	*/
	window.showMessage('deezer app id: ' + DEEZER_APP_ID);
	window.showMessage('deezer channel url: ' + DEEZER_CHANNEL_URL);

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
		},
		"skip to end of track": function(cb){
			var targetPos = 0.997;
			// give time for onTrackChange to be listened by first test
			setTimeout(function(){
				playem.seekTo(targetPos);
			}, 100);
			cb(true);
		},
		"reaching the end of track": function(cb){
			eventLogger.until("onEnd", function(){
				cb(true);
			});
		},
		"track does not repeat": function(cb){
			eventLogger.until("onPlay", function(res){
				cb(!res);
			}, 5000);
		},
	});

	runner.run(function(res){
		//playem.stop();
	});
});
