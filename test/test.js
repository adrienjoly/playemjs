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

	function objValues(obj){
		var values = [];
		for (var i in obj)
			values.push(obj[i]);
		return values;
	}

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
		var listeners = [];
		/*var handlers = {
		    onPlay: function(){ console.log("play"); },
		    onTrackInfo: function(t){
		        console.log(t.trackPosition +"/"+t.trackDuration);
		    },
		    onError: function(e){ console.log("error", e); },
		};*/
		function makeLogger(evt){
			return function(){
				var entry = [ Date.now(), evt ].concat(Array.prototype.slice.call(arguments));
				self.log.push(entry);
				//console.log.apply(console, entry);
				for(var i in listeners)
					listeners[i](evt, arguments);
				return entry;
			};
		}
		this.makeHandlers = function(){
			var handlers = {};
			for (i in EVENTS) {
				var evt = EVENTS[i];
				handlers[evt] = makeLogger(evt);
			}
			return handlers;
		};
		this.addListener = function(fct){
			listeners.push(fct);
			return listeners.length-1;
		};
		this.removeListener = function(idx){
			listeners.splice(idx);
		};
	});

	//====
	// playemjs init

	function init(cb){
		var playem = new Playem(eventLogger.makeHandlers());
		function makePlayerLoader(pl){
			return function(next) {
				function initPlayer(){
					playem.addPlayer(window[pl + "Player"], defaultPlayerParams); // instanciates player class
					next();
				}
				console.log("Init " + pl + " player...");
				if (window[pl+"Player"]) // check that class exists
					initPlayer();
				else
					loader.includeJS("../playem-"+pl.toLowerCase()+".js", initPlayer);
			};
		}
		forEachAsync(PLAYERS.map(makePlayerLoader), function(){
			cb(playem);
		});
	}

	//====
	// start tests when ready

	init(function(playem){
		var tests = {
			"playem initializes without error": function(cb){
				cb(!!playem);
			},
			"first video starts playing in less than 10 seconds": function(cb){
				var listenerId, timeout;
				playem.addTrackByUrl("//youtube.com/v/kvHbAmGkBtI");
				playem.play();
				function clean(){
					clearTimeout(timeout);
					eventLogger.removeListener(listenerId);
				}
				timeout = setTimeout(function(){
					clean();
					cb(false);
				}, 10000);
				listenerId = eventLogger.addListener(function(evt){
					console.log(evt);
					if (evt == "onPlay") {
						clean();
						cb(true);
					}
				});
				console.log("coucou")
			}
		};
		function wrapTest(title){
			var runTest = tests[title];
			return function(cb){
				console.log("TESTING: " + title + " ...");
				runTest(function(res){
					console.log("=> ", !!res ? "OK" : "FAIL");
					cb(res);
				});
			};
		}
		for(var title in tests)
			tests[title] = wrapTest(title);
		forEachAsync(objValues(tests), function(){
			console.log("All tests done!");
		});
	});

})();