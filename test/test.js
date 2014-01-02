var PLAYERS = [
	"AudioFile",
	"Youtube",
	"Dailymotion",
	"Deezer",
	"Vimeo",
	"SoundCloud",
];

var EVENTS = [
	"onError",
	"onReady",
	"onPlay",
	"onPaused",
	"onTrackInfo",
	"onTrackChange",
	"onEnd",
	"loadMore",
];

var eventLogger = new (function EventLogger(){
	var self = this;
	this.log = []; // [[timestamp, tag, fct name, args...]]
	/*var handlers = {
	    onPlay: function(){ console.log("play"); },
	    onTrackInfo: function(t){
	        console.log(t.trackPosition +"/"+t.trackDuration);
	    },
	    onError: function(e){ console.log("error", e); },
	};*/
	this.makeHandlers = function(tag){
		function makeLogger(evt){
			return function(){
				var entry = [ Date.now(), tag, evt ].concat(Array.prototype.slice.call(arguments));
				self.log.push(entry);
				console.log.apply(console, entry)
				return entry;
			};
		}
		var handlers = {};
		for (i in EVENTS) {
			var evt = EVENTS[i];
			handlers[evt] = makeLogger(evt);
		}
		return handlers;
	};
});

function forEachAsync(fcts, cb) {
	fcts = fcts || [];
	(function next(){
		var fct = fcts.shift();
		if (!fct)
			cb();
		else
			fct(next);
	})();
}

function makePlayerLoader(pl){
	return function(next) {
		if (window[pl+"Player"]) // check that class exists
			next();
		else {
			console.log("Loading " + pl + " player...");
			loader.includeJS("../playem-"+pl.toLowerCase()+".js", next);
		}
	};
}

forEachAsync(PLAYERS.map(makePlayerLoader), function(){
	console.log("=> finished loading players!");
	var playem = new Playem(eventLogger.makeHandlers("playem"));

	var defaultDefaultParams = {
	    playerId: "genericplayer",
	    origin: window.location.host || window.location.hostname,
	    playerContainer: document.getElementById("container")
	};

	//playem.addPlayer(AudioFilePlayer);
	playem.addPlayer(YoutubePlayer, defaultDefaultParams);
	//playem.addPlayer(DailymotionPlayer, defaultDefaultParams);
	//playem.addPlayer(DeezerPlayer, defaultDefaultParams);
	//playem.addPlayer(VimeoPlayer, defaultDefaultParams);
	//playem.addPlayer(SoundCloudPlayer, defaultDefaultParams);

	playem.addTrackByUrl("//youtube.com/v/kvHbAmGkBtI");

	playem.play();
});