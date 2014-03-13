/**
 * tests for playemjs
 * @author adrienjoly
 **/

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

function PlayemLoader() {

	var DEFAULT_PLAYERS = [
		"Youtube",
		"SoundCloud",
		"Vimeo",
		"Dailymotion",
		"Deezer",
		"AudioFile",
		"Bandcamp",
	];

	var DEFAULT_PLAYER_PARAMS = {
		playerId: "genericplayer",
		origin: window.location.host || window.location.hostname,
		playerContainer: document.getElementById("container")
	};

	function load(players, playerParams, cb){
		var playem = new Playem();
		function makePlayerLoader(pl){
			return function(next) {
				function initPlayer(){
					playem.addPlayer(window[pl + "Player"], playerParams); // instanciates player class
					next();
				}
				console.log("Init " + pl + " player...");
				if (window[pl+"Player"]) // check that class exists
					initPlayer();
				else
					loader.includeJS("../playem-"+pl.toLowerCase()+".js?_t="+Date.now(), initPlayer);
			};
		}
		forEachAsync(players.map(makePlayerLoader), function(){
			cb(playem);
		});
	}

	this.loadAllPlayers = function(cb){
		load(DEFAULT_PLAYERS, DEFAULT_PLAYER_PARAMS, cb);
		return this;
	}
}

function PlayemLogger() {

	var LOG_PLAYER_EVENTS = false;

	var EVENTS = [
		"onError",
		"onReady",
		"onBuffering",
		"onPlay",
		"onPaused",
		"onTrackInfo",
		"onTrackChange",
		"onEnd",
		"loadMore",
	];

	var self = this;
	this.log = []; // [[timestamp, tag, fct name, args...]]
	var listeners = [];
	var lastTypedEvent = {};

	function makeLogger(evt){
		return function(){
			var entry = [ Date.now(), evt ].concat(Array.prototype.slice.call(arguments));
			self.log.push(entry);
			lastTypedEvent[evt] = entry;
			if (LOG_PLAYER_EVENTS)
				console.log.apply(console, /*entry*/[ Date.now(), evt ]);
			for(var i in listeners)
				listeners[i](evt, arguments);
			return entry;
		};
	}
	this.listenTo = function(playem){
		var handlers = {};
		for (i in EVENTS) {
			var evt = EVENTS[i];
			playem.on(evt, makeLogger(evt));
		}
		playem.on("onError", function(e){
			console.warn("catched error", e);
		});
		return this;
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
	this.until = function(evtNameList, cb, timeoutDelay, timeoutCb){
		var listenerId, timeout, that = this, evtNames = {}, i;
		if (typeof evtNameList == "string")
			evtNameList = [evtNameList];
		for(i in evtNameList)
			evtNames[evtNameList[i]] = true;
		function clean(){
			clearTimeout(timeout);
			that.removeListener(listenerId);
		}
		timeout = setTimeout(function(){
			clean();
			(timeoutCb || cb)();
		}, timeoutDelay);
		listenerId = this.addListener(function(evt, data){
			if (evtNames[evt])
				if (!cb(evt, data))
					clean();
		});
	};
}

function TestRunner() {

	var tests = [];
	var finalCallback = null;

	function wrapTest(testFct, title){
		return function(nextTestFct){
			console.log("%c[TEST] " + title + " ...", "color:#888");
			testFct(function(res){
				console.log('%c[TEST]=> ' + (!!res ? "OK" : "FAIL: " + title), "color:" + (!!res ? "green" : "red"));
				if (!!res)
					setTimeout(nextTestFct);
				else
					finalCallback({ok: false, title: title});
			});
		};
	}

	this.addTests = function(testMap){
		for(var title in testMap)
			tests.push(wrapTest(testMap[title], title));
		return this;
	}

	this.run = function(cb){
		finalCallback = cb;
		forEachAsync(tests, function(){
			console.log("%cAll tests done!", "color:green");
			finalCallback({ok: true});
		});
		return this;
	}
}
