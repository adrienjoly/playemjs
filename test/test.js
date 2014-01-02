/**
 * tests for playemjs
 * @author adrienjoly
 **/
(function(){

	//====
	// constants and parameters

	var PLAYERS = [
	//	"AudioFile",
		"Youtube",
	//	"Dailymotion",
	//	"Deezer",
	//	"Vimeo",
	//	"SoundCloud",
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

	var defaultPlayerParams = {
		playerId: "genericplayer",
		origin: window.location.host || window.location.hostname,
		playerContainer: document.getElementById("container")
	};

	//====
	// utility functions

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

	//====
	// event logging

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

	//====
	// playemjs init

	function init(cb){
		var playem = new Playem(eventLogger.makeHandlers("playem"));
		function makePlayerLoader(pl){
			return function(next) {
				if (window[pl+"Player"]) // check that class exists
					next();
				else {
					console.log("Loading " + pl + " player...");
					loader.includeJS("../playem-"+pl.toLowerCase()+".js", function(){
						playem.addPlayer(window[pl + "Player"], defaultPlayerParams); // instanciates player class
						next();
					});
				}
			};
		}
		forEachAsync(PLAYERS.map(makePlayerLoader), function(){
			cb(playem);
		});
	}

	//====
	// start tests when ready

	init(function(playem){
		playem.addTrackByUrl("//youtube.com/v/kvHbAmGkBtI");
		playem.play();
	});

})();