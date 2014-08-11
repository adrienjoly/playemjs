// configuration

var USE_SWFOBJECT = true, //!!window.swfobject; // ... to embed youtube flash player
	PLAY_TIMEOUT = 10000;

window.$ = window.$ || function(){return window.$};
$.html = $.html || function(){return $};
$.remove = $.remove || function(){return $};

// utility functions

if (undefined == window.console) 
	window.console = {log:function(){}};

loader = new (function Loader() {
	var FINAL_STATES = {"loaded": true, "complete": true, 4: true},
		head = document.getElementsByTagName("head")[0],
		pending = {};
	return {
		includeJS: function(src, cb){
			if (pending[src]) return;
			pending[src] = true;
			var inc = document.createElement("script");
			inc.onload = inc.onreadystatechange = function() {
				if (pending[src] && (!inc.readyState || FINAL_STATES[inc.readyState])) {
					cb && cb();
					delete pending[src];
				}
			};
			inc.src = src;
			head.appendChild(inc);
		}
	};
});

// EventEmitter

function EventEmitter() {
	this._eventListeners = {};
}

EventEmitter.prototype.on = function(eventName, handler){
	this._eventListeners[eventName] = (this._eventListeners[eventName] || []).concat(handler);
}

EventEmitter.prototype.emit = function(eventName){
	var i, args = Array.prototype.slice.call(arguments, 1), // remove eventName from arguments, and make it an array
		listeners = this._eventListeners[eventName];
	for (i in listeners)
		listeners[i].apply(null, args);
}

/**
 * Inherit the prototype methods from one constructor into another. (from Node.js)
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
function inherits(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

/**
 * Plays a sequence of streamed audio/video tracks by embedding the corresponding players
 *
 * Events:
 * - "onError", {code,source}
 * - "onReady"
 * - "onPlay"
 * - "onPause"
 * - "onEnd"
 * - "onTrackInfo", track{}
 * - "onTrackChange", track{}
 * - "loadMore"
 */

function Playem(playemPrefs) {

	function Playem(playemPrefs) {

		EventEmitter.call(this);

		playemPrefs = playemPrefs || {};
		playemPrefs.loop = playemPrefs.hasOwnProperty("loop") ? playemPrefs.loop : true;

		var players = [], // instanciated Player classes, added by client
			i,
			exportedMethods,
			currentTrack = null,
			trackList = [],
			whenReady = null,
			playersToLoad = 0,
			progress = null,
			that = this,
			playTimeout = null,
			volume = 1;

		this.setPref = function(key, val){
			playemPrefs[key] = val;
		}

		function doWhenReady(player, fct) {
			var interval = null;
			function poll(){
				if (player.isReady && interval) {
					clearInterval(interval);
					fct();
				}
				else
					console.warn("PLAYEM waiting for", player.label, "...");
			}
			if (player.isReady)
				setTimeout(fct);
			else
				interval = setInterval(poll, 1000);
		}

		function addTrack(metadata, url) {
			var track = {
				index: trackList.length,
				metadata: metadata || {}
			};
			if (url)
				track.url = url;
			trackList.push(track);
			return track;
		}

		function addTrackById(id, player, metadata) {
			if (id) {
				var track = addTrack(metadata);
				track.trackId = id;
				track.player = player;
				track.playerName = player.label.replace(/ /g, "_");
				return track;
				//console.log("added:", player.label, "track", id, track/*, metadata*/);
			}
			else
				throw new Error("no id provided");
		}

		function setVolume(vol) {
			volume = vol;
			callPlayerFct("setVolume", vol);
		}

		function stopTrack() {
			if (currentTrack) {
				callPlayerFct("stop");
				if (progress)
					clearInterval(progress);
			}
		}

		function playTrack(track) {
			//console.log("playTrack", track);
			stopTrack();
			currentTrack = track;
			delete currentTrack.trackPosition; // = null;
			delete currentTrack.trackDuration; // = null;
			that.emit("onTrackChange", track);
			if (!track.player)
				return that.emit("onError", {code:"unrecognized_track", source:"Playem", track:track});
			doWhenReady(track.player, function() {
				//console.log("playTrack #" + track.index + " (" + track.playerName+ ")", track);
				callPlayerFct("play", track.trackId);
				setVolume(volume);
				if (currentTrack.index == trackList.length-1)
					that.emit("loadMore");
				// if the track does not start playing within 7 seconds, skip to next track
				setPlayTimeout(function() {
					console.warn("PLAYEM TIMEOUT"); // => skipping to next song
					that.emit("onError", {code:"timeout", source:"Playem"});
					//exportedMethods.next();
				});
			});
		}

		function setPlayTimeout(handler) {
			if (playTimeout)
				clearTimeout(playTimeout);
			playTimeout = !handler ? null : setTimeout(handler, PLAY_TIMEOUT);
		}

		function callPlayerFct(fctName, param){
			try {
				return currentTrack.player[fctName](param);
			}
			catch(e) {
				console.warn("Player call error", fctName, e, e.stack);
			}
		}

		// functions that are called by players => to propagate to client
		function createEventHandlers (playemFunctions) {
			var eventHandlers = {
				onApiReady: function(player){
					//console.log(player.label + " api ready");
					if (whenReady && player == whenReady.player)
						whenReady.fct();
					if (0 == --playersToLoad)
						that.emit("onReady");
				},
				onEmbedReady: function(player) {
					//console.log("embed ready");
					setVolume(volume);
				},
				onBuffering: function(player) {
					setTimeout(function() {
						setPlayTimeout();
						that.emit("onBuffering");
					});
				},
				onPlaying: function(player) {
					//console.log(player.label + ".onPlaying");
					//setPlayTimeout(); // removed because soundcloud sends a "onPlaying" event, even for not authorized tracks
					setVolume(volume);
					setTimeout(function() {
						that.emit("onPlay");
					}, 1);
					if (player.trackInfo && player.trackInfo.duration)
						eventHandlers.onTrackInfo({
							position: player.trackInfo.position || 0,
							duration: player.trackInfo.duration
						});

					if (progress)
						clearInterval(progress);

					if (player.getTrackPosition) {
						//var that = eventHandlers; //this;
						progress = setInterval(function(){
							player.getTrackPosition(function(trackPos) {
								eventHandlers.onTrackInfo({
									position: trackPos,
									duration: player.trackInfo.duration || currentTrack.trackDuration
								});
							});
						}, 1000);
					}
				},
				onTrackInfo: function(trackInfo) {
					//console.log("ontrackinfo", trackInfo, currentTrack);
					if (currentTrack && trackInfo) {
						if (trackInfo.duration) {
							currentTrack.trackDuration = trackInfo.duration;
							setPlayTimeout();
						}
						if (trackInfo.position)
							currentTrack.trackPosition = trackInfo.position;          
					}
					that.emit("onTrackInfo", currentTrack);
				},
				onPaused: function(player) {
					//console.log(player.label + ".onPaused");
					setPlayTimeout();
					if (progress)
						clearInterval(progress);
					progress = null;
					//if (!avoidPauseEventPropagation)
					//	that.emit("onPause");
					//avoidPauseEventPropagation = false;
				},
				onEnded: function(player) {
					//console.log(player.label + ".onEnded");
					stopTrack();
					that.emit("onEnd");
					playemFunctions.next();
				},
				onError: function(player, error) {
					console.error(player.label + " error:", ((error || {}).exception || error || {}).stack || error);
					setPlayTimeout();
					that.emit("onError", error);
				}
			};
			// handlers will only be triggered is their associated player is currently active
			["onEmbedReady", "onBuffering", "onPlaying", "onPaused", "onEnded", "onError"].map(function (evt){
				var fct = eventHandlers[evt];
				eventHandlers[evt] = function(player, x){
					if (player == currentTrack.player)
						return fct(player, x);
					else
						console.warn("ignore event:", evt, "from", player, "instead of:", currentTrack.player);
				};
			});
			return eventHandlers;
		}

		// exported methods, mostly wrappers to Players' methods
		exportedMethods = {
			addPlayer: function (playerClass, vars) {
				playersToLoad++;
				players.push(new playerClass(createEventHandlers(this), vars));
			},
			getQueue: function() {
				return trackList;
			},
			clearQueue: function() {
				trackList = [];
			},
			addTrackByUrl: function(url, metadata) {
				var p, player, eid;
				for (p=0; p<players.length; ++p) {
					player = players[p];
					//console.log("test ", player.label, eid);
					eid = player.getEid(url);
					if (eid)
						return addTrackById(eid, player, metadata);
				}
				return addTrack(metadata, url);
			},
			play: function(i) {
				playTrack(i != undefined ? trackList[i] : currentTrack || trackList[0]);
			},
			pause: function() {
				callPlayerFct("pause");
				that.emit("onPause");
			},
			stop: stopTrack,
			resume: function() {
				callPlayerFct("resume");
			},
			next: function() {
				if (playemPrefs.loop || currentTrack.index + 1 < trackList.length)
					playTrack(trackList[(currentTrack.index + 1) % trackList.length]);
			},
			prev: function() {
				playTrack(trackList[(trackList.length + currentTrack.index - 1) % trackList.length]);
			},
			seekTo: function(pos) {
				if ((currentTrack || {}).trackDuration)
					callPlayerFct("setTrackPosition", pos * currentTrack.trackDuration);
			},
			setVolume: setVolume
		};
		//return exportedMethods;
		for (i in exportedMethods)
			this[i] = exportedMethods[i];
	}

	inherits(Playem, EventEmitter);

	return new Playem();
};

