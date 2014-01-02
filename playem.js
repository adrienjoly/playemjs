// configuration

var USE_SWFOBJECT = !!window.swfobject; // ... to embed youtube flash player
var PLAY_TIMEOUT = 10000;

// utility functions

if (undefined == window.console) 
	window.console = {log:function(){}};

var loader = new (function Loader() {
	var FINAL_STATES = {"loaded": true, "complete": true, 4: true};
	var pending = {}, head = document.getElementsByTagName("head")[0];
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

// Playem class

function Playem(playerFunctions) {

	var players = []; // instanciated Player classes, added by client
	playerFunctions = playerFunctions || {}; // provided handlers for players' events

	playerFunctions.onError = playerFunctions.onError || function(error) {
		alert(error);
	};

	// core functions
	
	var currentTrack = null;
	var trackList = [];
	var whenReady = null;
	var playersToLoad = 0;
	var progress = null;
	var that = this;
	var playTimeout = null;

	function doWhenReady(player, fct) {
		var done = false;
		whenReady = {
			player: player,
			fct: function () {
				if (done) return;
				done = true;
				fct();
				whenReady = null;
			}
		};
		if (player.isReady)
			whenReady.fct();
		else
			console.log("waiting for", player.label, "...");
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
			//console.log("added:", player.label, "track", id, track/*, metadata*/);
		}
		else
			console.log("warning: no id provided");
	}

	var volume = 1;

	function setVolume(vol) {
		volume = vol;
		if (currentTrack && currentTrack.player.setVolume)
			currentTrack.player.setVolume(vol);
	}

	function playTrack(track) {
		console.log("playTrack", track);
		doWhenReady(track.player, function() {
			if (currentTrack) {
				currentTrack.player.stop && currentTrack.player.stop();
				$("#genericholder iframe").attr("src", ""); // to make sure that IE really destroys the iframe embed
				$("#genericholder").html("").remove();
				if (progress)
					clearInterval(progress);
			}
			currentTrack = track;
			delete currentTrack.trackPosition; // = null;
			delete currentTrack.trackDuration; // = null;
			if (playerFunctions.onTrackChange)
				playerFunctions.onTrackChange(track);
			//console.log("playing", track);
			track.player.play(track.trackId);
			setVolume(volume);
			if (currentTrack.index == trackList.length-1 && playerFunctions.loadMore)
				playerFunctions.loadMore();
			// if the track does not start playing within 7 seconds, skip to next track
			setPlayTimeout(function() {
				console.log("TIMEOUT: track is not playing => skipping to next song");
				playerFunctions.onError && playerFunctions.onError({code:"timeout", source:"Playem"});
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
				if (playerFunctions.onReady && 0 == --playersToLoad)
					playerFunctions.onReady();
			},
			onEmbedReady: function(player) {
				//console.log("embed ready");
				setVolume(volume);
			},
			onPlaying: function(player) {
				//console.log(player.label + ".onPlaying");
				//setPlayTimeout(); // removed because soundcloud sends a "onPlaying" event, even for not authorized tracks
				setVolume(volume);
				playerFunctions.onPlay && setTimeout(function() {
					playerFunctions.onPlay();
				}, 1);
				if (/*playerFunctions.onTrackInfo &&*/ player.trackInfo && player.trackInfo.duration)
					this.onTrackInfo({
						position: player.trackInfo.position || 0,
						duration: player.trackInfo.duration
					});

				if (progress)
					clearInterval(progress);
				if (player.getTrackPosition && playerFunctions.onTrackInfo) {
					var that = eventHandlers; //this;
					progress = setInterval(function(){
						player.getTrackPosition(function(trackPos) {
							that.onTrackInfo({
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
				playerFunctions.onTrackInfo && playerFunctions.onTrackInfo(currentTrack);
			},
			onPaused: function(player) {
				//console.log(player.label + ".onPaused");
				setPlayTimeout();
				if (progress)
					clearInterval(progress);
				progress = null;
				//if (!avoidPauseEventPropagation)
				//	playerFunctions.onPause();
				//avoidPauseEventPropagation = false;
			},
			onEnded: function(player) {
				//console.log(player.label + ".onEnded");
				playerFunctions.onEnd && playerFunctions.onEnd();
				playemFunctions.next();
			},
			onError: function(player, error) {
				console.log(player.label + " error:", error);
				((error || {}).exception || {}).stack && console.log(error.exception.stack);
				setPlayTimeout();
				playerFunctions.onError && playerFunctions.onError(error);
			}
		};
		return eventHandlers;
	}

	// exported methods, mostly wrappers to Players' methods
	var exportedMethods = {
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
			var remaining = players.length;
			for (var p=0; p<players.length; ++p)
				players[p].getEid(url, function(eid, player){
					//console.log("test ", player.label, eid);
					if (eid)
						addTrackById(eid, player, metadata);
					else if (--remaining == 0) {
						$(metadata.post).addClass("disabled");
						console.log("unrecognized track:", url, metadata);
					}
				});
		},
		play: function(i) {
			playTrack(i != undefined ? trackList[i] : currentTrack || trackList[0]);
		},
		pause: function() {
			currentTrack.player.pause();
			playerFunctions.onPause();
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
	return exportedMethods;
}
