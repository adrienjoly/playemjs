/**
 * tests for playemjs
 * @author adrienjoly
 **/
(function(){

	//====
	// constants and parameters

	var PLAYERS = [
		"Youtube",
		"SoundCloud",
		"Vimeo",
		"Dailymotion",
	//	"AudioFile",
	//	"Deezer",
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
		var lastTypedEvent = {};
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
				lastTypedEvent[evt] = entry;
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
		this.getLastTypedEvent = function(evt){
			return lastTypedEvent[evt];
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
					loader.includeJS("../playem-"+pl.toLowerCase()+".js?_t="+Date.now(), initPlayer);
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
				//playem.addTrackByUrl("//youtube.com/v/kvHbAmGkBtI"); // "RUSH in Rio" concert, WMG => not authorized on whyd
				//playem.addTrackByUrl("https://youtube.com/watch?v=jmRI3Ew4BvA"); // Yeah Yeah Yeahs - Sacrilege
				//playem.addTrackByUrl("//youtube.com/watch?v=iL3IYGgqaNU"); // man is not a bird @ batofar
				//playem.addTrackByUrl("//soundcloud.com/manisnotabird/sounds-of-spring"); // /!\ you need to append the stream URL using ContentEmbed class first
				//playem.addTrackByUrl("http://soundcloud.com/manisnotabird/sounds-of-spring#http://api.soundcloud.com/tracks/90559805");
				playem.addTrackByUrl("https://soundcloud.com/manisnotabird/bringer-of-rain-and-seed-good#https://api.soundcloud.com/tracks/71480483");
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
					//console.log(evt);
					if (evt == "onPlay") {
						clean();
						cb(true);
					}
				});
			},
			"set volume to 0%": function(cb){
				playem.setVolume(0.0);
				cb(true);
			},
			"get track duration": function(cb){
				setTimeout(function(){
					var trackDuration = eventLogger.getLastTypedEvent("onTrackInfo");
					trackDuration = ((trackDuration && trackDuration.pop()) || {}).trackDuration;
					//console.log("track duration", trackDuration);
					cb(!!trackDuration);
				}, 1000);
			},
			"skip to middle of track": function(cb){
				var targetPos = 0.5;
				playem.seekTo(targetPos);
				setTimeout(function(){
					var trackPosition = eventLogger.getLastTypedEvent("onTrackInfo");
					trackPosition = ((trackPosition && trackPosition.pop()) || {}).trackPosition;
					//console.log("track position", trackPosition);
					cb(trackPosition && trackPosition >= targetPos);
				}, 1000);
			},
			"set volume to 50%": function(cb){
				var targetPos = 0.5;
				playem.seekTo(targetPos);
				setTimeout(function(){
					playem.setVolume(0.5);
					setTimeout(function(){
						cb(true)
					}, 1000);
				}, 1000);
			},
			"skip to end of track": function(cb){
				var targetPos = 0.999;
				playem.seekTo(targetPos);
				setTimeout(function(){
					var trackPosition = eventLogger.getLastTypedEvent("onTrackInfo");
					trackPosition = ((trackPosition && trackPosition.pop()) || {}).trackPosition;
					//console.log("track position", trackPosition);
					cb(trackPosition && trackPosition >= targetPos);
				}, 2000);
			}
		};
		function wrapTest(title){
			var runTest = tests[title];
			return function(cb){
				console.log("%c[TEST] " + title + " ...", "color:#888");
				runTest(function(res){
					console.log('%c[TEST]=> ' + (!!res ? "OK" : "FAIL"), "color:" + (!!res ? "green" : "red"));
					if (!!res)
						cb();
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