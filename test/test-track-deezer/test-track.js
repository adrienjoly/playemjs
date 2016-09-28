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

	// this is necessary to show the deezer login URL, in order to play the track in full
	var div = document.getElementById('eventLog');
	window.showMessage = function(msg) {
		div.innerHTML = div.innerHTML + "[showMessage] " + msg + "<br/>";
	};

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
		"skip to end of track": function(cb){
			var targetPos = 0.98; // <10 seconds before end of track
			// give time for onTrackChange to be listened by first test
			setTimeout(function(){
				playem.seekTo(targetPos);
			}, 100);
			eventLogger.until("onEnd", function(){
				cb(true);
			});
		},
		"does not keep playing": function(cb){
			eventLogger.until("onTrackInfo", function(res){
				cb(!res);
			}, 5000);
		},
	});

	runner.run(function(res){
		//playem.stop();
	});
});
