/**
 * tests for playemjs
 * @author adrienjoly
 **/
(function(){

	//====
	// constants and parameters

	var LOG_PLAYER_EVENTS = false;

	var PLAYERS = [
		"Youtube",
		"SoundCloud",
		"Vimeo",
		"Dailymotion",
		"Deezer",
	//	"AudioFile",
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
				if (LOG_PLAYER_EVENTS)
					console.log.apply(console, entry);
				for(var i in listeners)
					listeners[i](evt, arguments);
				return entry;
			};
		}
		/*
		this.makeHandlers = function(){
			var handlers = {};
			for (i in EVENTS) {
				var evt = EVENTS[i];
				handlers[evt] = makeLogger(evt);
			}
			return handlers;
		};
		*/
		this.listenTo = function(playem){
			var handlers = {};
			for (i in EVENTS) {
				var evt = EVENTS[i];
				playem.on(evt, makeLogger(evt));
			}
			playem.on("onError", function(e){
				console.warn("catched error", e);
			});
		}
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
		this.once = function(evtName, cb, timeoutDelay, timeoutCb){
			var listenerId, timeout, that = this;
			function clean(){
				clearTimeout(timeout);
				that.removeListener(listenerId);
			}
			timeout = setTimeout(function(){
				clean();
				(timeoutCb || cb)();
			}, timeoutDelay);
			listenerId = this.addListener(function(evt, data){
				if (evt == evtName) {
					clean();
					cb(data);
				}
			});
		};
	});

	//====
	// playemjs init

	function init(cb){
		var playem = new Playem(/*eventLogger.makeHandlers()*/);
		eventLogger.listenTo(playem);
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

	function wrapTests(tests){
		var testArray = [];
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
			testArray.push(wrapTest(title));
		return testArray;
	}

	init(function(playem){

		var tracks = [
			"http://www.dailymotion.com/video/x142x6e_jean-jean-love_music",
			//"//vimeo.com/46314116", // Man is not a Bird - IV - Live at le Klub, Paris
			"//youtube.com/watch?v=iL3IYGgqaNU", // man is not a bird @ batofar
			"https://soundcloud.com/manisnotabird/bringer-of-rain-and-seed-good#https://api.soundcloud.com/tracks/71480483",
			//"//soundcloud.com/manisnotabird/sounds-of-spring", // /!\ you need to append the stream URL using ContentEmbed class first
			//"//youtube.com/v/kvHbAmGkBtI", // "RUSH in Rio" concert, WMG => not authorized on whyd
			//"https://youtube.com/watch?v=jmRI3Ew4BvA", // Yeah Yeah Yeahs - Sacrilege
			//"//soundcloud.com/manisnotabird/sounds-of-spring", // /!\ you need to append the stream URL using ContentEmbed class first
			//"http://soundcloud.com/manisnotabird/sounds-of-spring#http://api.soundcloud.com/tracks/90559805",
			"http://www.deezer.com/track/73414915",
			//"//youtube.com/watch?v=xxx", // should not work
		];

		var nextIndex = 0;

		var commonTests = wrapTests({
			"automatic switch to next track": function(cb){
				eventLogger.once("onTrackChange", function(args){
					var index = ((args && args[0]) || {}).index;
					cb(index === nextIndex++);
				}, 5000);
			},
			"track starts playing in less than 10 seconds": function(cb){
				eventLogger.once("onPlay", cb, 10000);
			},
			"set volume to 10%": function(cb){
				playem.setVolume(0.1);
				cb(true);
			},
			"get track duration": function(cb){
				var retries = 3;
				(function waitForDuration(){
					eventLogger.once("onTrackInfo", function(args){
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
				eventLogger.once("onTrackInfo", function(args){
					var trackPosition = ((args && args[0]) || {}).trackPosition;
					cb(trackPosition && trackPosition >= targetPos);
				}, 1000);
			},
			"set volume to 50%": function(cb){
				playem.setVolume(0.5);
				setTimeout(function(){
					cb(true)
				}, 1000);
			},
			"skip to end of track": function(cb){
				var targetPos = 0.999;
				cb(true);
				playem.seekTo(targetPos);
			},
		});

		var tests = wrapTests({
			"playem initializes without error": function(cb){
				cb(!!playem);
			},
			"all tracks load within 1 second": function(cb){
				for (var i in tracks)
					playem.addTrackByUrl(tracks[i]);
				setTimeout(function(){
					cb(playem.getQueue().length == tracks.length);
					playem.play();
				}, 1000);
			},
		});

		for(var i in tracks)
			tests = tests.concat(commonTests);

		tests.push(function(cb){
			playem.stop();
			cb(true);
		});

		forEachAsync(tests, function(){
			console.log("%cAll tests done!", "color:green");
		});
	});

})();