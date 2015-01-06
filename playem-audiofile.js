function AudioFilePlayer(){
	return AudioFilePlayer.super_.apply(this, arguments);
}

(function() {

	/*
	loader.includeJS("/js/soundmanager2.js", function() { //-nodebug-jsmin
		console.log("loaded mp3 player");
		soundManager.setup({
			url: '/swf/', //sound manager swf directory
			flashVersion: 9,
			onready: function() {
				console.log("mp3 player is ready");
				//that.isReady = true;
				soundManager.isReady = true;
				//eventHandlers.onApiReady && eventHandlers.onApiReady(that);
			}
		});
	});
	*/

	var EVENT_MAP = {
		"onplay": "onPlaying",
		"onresume": "onPlaying",
		"onpause": "onPaused",
		"onstop": "onPaused",
		"onfinish": "onEnded"
	};

	function Player(eventHandlers, embedVars) {  
		this.label = 'Audio file';
		this.eventHandlers = eventHandlers || {};
		this.embedVars = embedVars || {};
		this.element = null;
		this.widget = null;
		this.isReady = false;
		this.trackInfo = {};
		var i, loading, that = this;

		this.soundOptions = {
			id: null,
			url: null,
			autoLoad: true,
			autoPlay: true,
			ontimeout: function(e) {
				//console.log("AudioFilePlayer timeout event:", e);
				that.eventHandlers.onError && that.eventHandlers.onError(that, {code:"timeout", source:"AudioFilePlayer"});
			}
		};

		for (i in EVENT_MAP)
			(function(i) {
				that.soundOptions[i] = function() {
					//console.log("event:", i, this);
					var handler = eventHandlers[EVENT_MAP[i]];
					handler && handler(that);
				}
			})(i);

		loading = setInterval(function(){
			try {
				if (window["soundManager"]) {
					clearInterval(loading);
					that.isReady = true;
					eventHandlers.onApiReady && eventHandlers.onApiReady(that);
				}
			}
			catch (e) {
				that.eventHandlers.onError && that.eventHandlers.onError(that, {source:"AudioFilePlayer", exception:e});
			};
		}, 200);
	}

	Player.prototype.getEid = function(url) {
		url = (url || "").split("#").pop();
		if (!url)
			return null;
		var ext = url.split("?")[0].split(".").pop().toLowerCase();
		return (ext == "mp3" || ext == "ogg") ? url.replace(/^\/fi\//, "") : null;
	}
	
	Player.prototype.fetchMetadata = function(url, cb){
		url = this.getEid(url);
		if (!url)
			return cb();
		cb({
			id: url.replace(/^\/fi\//, ""),
			title: url.split("/").pop().split("?")[0]
		});
		// TODO : also use getTrackInfo()
	}

	Player.prototype.getTrackInfo = function(callback) {
		var that = this, i = setInterval(function() {
			//console.log("info", that.widget.duration)
			if (that.widget && that.widget.duration) {
				clearInterval(i);
				callback(that.trackInfo = {
					duration: that.widget.duration / 1000, // that.widget.durationEstimate / 1000
					position: that.widget.position / 1000
				});
				//that.eventHandlers.onTrackInfo && that.eventHandlers.onTrackInfo(that.widget);
			}
		}, 500);
	}

	Player.prototype.getTrackPosition = function(callback) {
		var that = this;
		//console.log("position", that.widget.position)
		this.getTrackInfo(function(){
			callback(that.trackInfo.position);
			that.eventHandlers.onTrackInfo && that.eventHandlers.onTrackInfo(that.trackInfo);
		});
	};
	
	Player.prototype.setTrackPosition = function(pos) {
		this.widget && this.widget.setPosition(Math.floor(Math.min(this.widget.duration, pos * 1000) - 2000));
	};
	
	Player.prototype.embed = function(vars) {
		if (!vars || !vars.trackId)
			return;
		//console.log("AudioFilePlayer embed vars:", vars);
		this.embedVars = vars = vars || {};
		this.soundOptions.id = vars.playerId = vars.playerId || 'mp3Player' + (new Date()).getTime();
		this.soundOptions.url = vars.trackId.replace(/^\/fi\//, ""); // remove eId prefix /fi/ if necessary
		this.trackInfo = {};
		if (this.widget) {
			this.pause();
			this.widget = null;
			delete this.widget;
		}
		//console.log("-> soundManager parameters", this.soundOptions);
		this.widget = soundManager.createSound(this.soundOptions);
		//console.log("-> soundManager instance", !!this.widget);
		this.eventHandlers.onEmbedReady && this.eventHandlers.onEmbedReady(this);
		this.eventHandlers.onTrackInfo && this.getTrackInfo(this.eventHandlers.onTrackInfo);
		this.play();
	}

	Player.prototype.play = function(id) {
		//console.log("mp3 play", id)
		this.isReady && this.embed({trackId:id});
	}

	Player.prototype.resume = function() {
		this.isReady && this.widget && this.widget.resume();
	}

	Player.prototype.pause = function() {
		try {
			this.isReady && this.widget && this.widget.pause();
		}
		catch(e) {
			console.error(e.stack);
		}
	}

	Player.prototype.stop = function() {
		this.widget && this.widget.stop();
	}

	Player.prototype.setVolume = function(vol) {
		if (this.widget && this.widget.setVolume && this.soundOptions)
			/*this.widget*/soundManager.setVolume(this.soundOptions.id, 100 * vol);
	}

	//return Player;
	//inherits(AudioFilePlayer, Player);
	AudioFilePlayer.prototype = Player.prototype;
	AudioFilePlayer.super_ = Player;
})();
