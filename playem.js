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

function Playem() {

	function Playem() {

		EventEmitter.call(this);

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


		function doWhenReady(player, fct) {
			var interval = null;
			function poll(){
				if (player.isReady && interval) {
					clearInterval(interval);
					fct();
				}
				else
					console.log("waiting for", player.label, "...");
			}
			if (player.isReady)
				setTimeout(fct);
			else
				interval = setInterval(poll, 1000);
		}

		function addTrackById(id, player, metadata) {
			if (id) {
				var track = {
					index: trackList.length,
					trackId: id,
					//img: img,
					player: player,
					playerName: player.label.replace(/ /g, "_"),
					metadata: metadata || {}
				};
				trackList.push(track);
				return track;
				//console.log("added:", player.label, "track", id, track/*, metadata*/);
			}
			else
				console.log("warning: no id provided");
		}

		function setVolume(vol) {
			volume = vol;
			if (currentTrack && currentTrack.player.setVolume)
				currentTrack.player.setVolume(vol);
		}

		function playTrack(track) {
			//console.log("playTrack", track);
			doWhenReady(track.player, function() {
				if (currentTrack) {
					currentTrack.player.stop && currentTrack.player.stop();
					// TODO: delete elements in players instead
					$("#genericholder iframe").attr("src", ""); // to make sure that IE really destroys the iframe embed
					$("#genericholder").html("").remove();
					if (progress)
						clearInterval(progress);
				}
				currentTrack = track;
				delete currentTrack.trackPosition; // = null;
				delete currentTrack.trackDuration; // = null;
				that.emit("onTrackChange", track);
				console.log("playTrack #" + track.index + " (" + track.playerName+ ")", track);
				track.player.play(track.trackId);
				setVolume(volume);
				if (currentTrack.index == trackList.length-1)
					that.emit("loadMore");
				// if the track does not start playing within 7 seconds, skip to next track
				setPlayTimeout(function() {
					console.log("TIMEOUT: track did not start playing"); // => skipping to next song
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
				onPlaying: function(player) {
					//console.log(player.label + ".onPlaying");
					//setPlayTimeout(); // removed because soundcloud sends a "onPlaying" event, even for not authorized tracks
					setVolume(volume);
					setTimeout(function() {
						that.emit("onPlay");
					}, 1);
					if (player.trackInfo && player.trackInfo.duration)
						this.onTrackInfo({
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
					that.emit("onEnd");
					playemFunctions.next();
				},
				onError: function(player, error) {
					console.log(player.label + " error:", error);
					((error || {}).exception || {}).stack && console.log(error.exception.stack);
					setPlayTimeout();
					that.emit("onError", error);
				}
			};
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
			addTrackByUrl: function(url, metadata, cb) {
				var p, remaining = players.length;
				for (p=0; p<players.length; ++p)
					players[p].getEid(url, function(eid, player){
						//console.log("test ", player.label, eid);
						if (eid) {
							var track = addTrackById(eid, player, metadata);
							//console.log("added track", track);
							cb && cb(track);
						}
						else if (--remaining == 0) {
							metadata && $(metadata.post).addClass("disabled");
							cb ? cb({error:"unrecognized track:" + url}) : console.log("unrecognized track:", url, metadata);
						}
					});
			},
			play: function(i) {
				playTrack(i != undefined ? trackList[i] : currentTrack || trackList[0]);
			},
			pause: function() {
				currentTrack.player.pause();
				that.emit("onPause");
			},
			stop: function() {
				currentTrack.player.stop();
				//that.emit("onStop");
			},
			resume: function() {
				currentTrack.player.resume();
			},
			next: function() {
				playTrack(trackList[(currentTrack.index + 1) % trackList.length]);
			},
			prev: function() {
				playTrack(trackList[(trackList.length + currentTrack.index - 1) % trackList.length]);
			},
			seekTo: function(pos) {
				if (currentTrack && currentTrack.trackDuration)
					currentTrack.player.setTrackPosition(pos * currentTrack.trackDuration);
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

