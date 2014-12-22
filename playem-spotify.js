// SpotifyPlayer
// only plays 30-seconds previews (for now)

function SpotifyPlayer(){
	return SpotifyPlayer.super_.apply(this, arguments);
}

(function() {

	var EVENT_MAP = {
		"onplay": "onPlaying",
		"onresume": "onPlaying",
		"onpause": "onPaused",
		"onstop": "onPaused",
		"onfinish": "onEnded"
	};

	function Player(eventHandlers, embedVars) {  
		var that = this;
		this.label = 'Spotify track';
		this.eventHandlers = eventHandlers || {};
		this.embedVars = embedVars || {};
		this.widget = null;
		this.isReady = false;
		this.trackInfo = {};
		this.soundOptions = {
			id: null,
			url: null,
			autoLoad: true,
			autoPlay: true,
			ontimeout: function(e) {
				//console.log("SpotifyPlayer timeout event:", e);
				eventHandlers.onError && eventHandlers.onError(that, {code:"timeout", source:"SpotifyPlayer"});
			}
		};
		Object.keys(EVENT_MAP).map(function(i) {
			that.soundOptions[i] = function() {
				//console.log("event:", i, this);
				var handler = eventHandlers[EVENT_MAP[i]];
				handler && handler(that);
			}
		});
		window.soundManager.onready(function(){
			that.isReady = true;
			eventHandlers.onApiReady && eventHandlers.onApiReady(that);
		});
	}

	Player.prototype.getEid = function(url) {
		return /spotify.com\/track\/(\w+)/.test(url) ? RegExp.$1 : null;
	}
	
	Player.prototype.getTrackInfo = function(callback) {
		var that = this, i = setInterval(function() {
			if (that.widget && that.widget.duration) {
				clearInterval(i);
				callback(that.trackInfo = {
					duration: that.widget.duration / 1000,
					position: that.widget.position / 1000
				});
			}
		}, 500);
	}

	Player.prototype.getTrackPosition = function(callback) {
		var that = this;
		this.getTrackInfo(function(){
			callback(that.trackInfo.position);
			that.eventHandlers.onTrackInfo && that.eventHandlers.onTrackInfo(that.trackInfo);
		});
	};
	
	Player.prototype.setTrackPosition = function(pos) {
		this.widget && this.widget.setPosition(Math.floor(Math.min(this.widget.duration, pos * 1000) - 2000));
	};

	Player.prototype.embed = function(vars) {
		var that = this;
		if (!vars || !vars.trackId)
			return;
		this.embedVars = vars = vars || {};
		this.soundOptions.id = vars.playerId = vars.playerId || 'mp3Player' + (new Date()).getTime();
		//console.log("trackid", vars.trackId)
		loader.loadJSON("https://api.spotify.com/v1/tracks/" + vars.trackId, function(data){
			that.soundOptions.url = data.preview_url;
			that.trackInfo = {};
			if (that.widget) {
				that.pause();
				that.widget = null;
				delete that.widget;
			}
			that.widget = soundManager.createSound(that.soundOptions);
			that.eventHandlers.onEmbedReady && that.eventHandlers.onEmbedReady(that);
			that.eventHandlers.onTrackInfo && that.getTrackInfo(that.eventHandlers.onTrackInfo);
			that.play();
		});
	}

	Player.prototype.play = function(id) {
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
			console.error("spotify error:", e, e.stack);
		}
	}

	Player.prototype.stop = function() {
		this.widget && this.widget.stop();
	}

	Player.prototype.setVolume = function(vol) {
		if (this.widget && this.widget.setVolume && this.soundOptions)
			soundManager.setVolume(this.soundOptions.id, 100 * vol);
	}

	SpotifyPlayer.prototype = Player.prototype;
	SpotifyPlayer.super_ = Player;
})();
