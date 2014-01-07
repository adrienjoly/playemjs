//loader.includeJS("https://w.soundcloud.com/player/api.js");

window.$ = window.$ || function(){return window.$};
$.getScript = $.getScript || function(js,cb){loader.includeJS(js,cb);};

SoundCloudPlayer = (function() {
	var EVENT_MAP = {
		"onplay": "onPlaying",
		"onresume": "onPlaying",
		"onpause": "onPaused",
		"onstop": "onPaused",
		"onfinish": "onEnded"
	};

	var ERROR_EVENTS = [
		"onerror",
		"ontimeout",
		"onfailure",
		"ondataerror"
	];

	function SoundCloudPlayer(eventHandlers, embedVars) {  
		this.label = 'SoundCloud';
		this.eventHandlers = eventHandlers || {};
		this.embedVars = embedVars || {};
		this.element = null;
		this.widget = null;
		this.isReady = false;
		this.trackInfo = {};
		this.soundOptions = {autoPlay:true};

		var that = this;
		$.getScript("https://connect.soundcloud.com/sdk.js", function() {
			SC.initialize({client_id: "9d5bbaf9df494a4c23475d9fde1f69b4"});
			for (var i in EVENT_MAP)
				(function(i) {
					that.soundOptions[i] = function() {
						console.log("SC event:", i /*, this*/);
						var handler = eventHandlers[EVENT_MAP[i]];
						handler && handler(that);
					}
				})(i);
			ERROR_EVENTS.map(function(evt){
				that.soundOptions[evt] = function(e) {
					console.log("SC error:", evt, e);
					that.eventHandlers.onError && that.eventHandlers.onError(that, {code:evt.substr(2), source:"SoundCloudPlayer"});
				};
			});
			that.isReady = true;
			that.callHandler("onApiLoaded", that); // eventHandlers.onApiLoaded && eventHandlers.onApiLoaded(that);
			that.callHandler("onApiReady", that); // eventHandlers.onApiReady && eventHandlers.onApiReady(that);
		});

		this.callHandler = function(name, params) {
			try {
				eventHandlers[name] && eventHandlers[name](params);//.apply(null, params);
			}
			catch (e) {
				console.log(e, e.stack);
			}
		}
	}

	SoundCloudPlayer.prototype.safeCall = function(fctName, param) {
		try {
			//console.log("SC safecall", fctName);
			if (this.widget && this.widget[fctName])
				this.widget[fctName](param);
		}
		catch(e) {
			console.log("SC safecall error", e, e.stack);
		}
	}

	SoundCloudPlayer.prototype.getEid = function(url, cb) {
		var matches = /https?:\/\/(?:www\.)?soundcloud\.com\/([\w-_\/]+)/.exec(url);
		cb(matches ? url.substr(url.lastIndexOf("/")+1) : null, this);
	}

	SoundCloudPlayer.prototype.getTrackInfo = function(callback) {
		var that = this;
		var i = setInterval(function() {
			//console.log("SC info", that.widget.duration)
			if (that.widget && that.widget.duration) {
				clearInterval(i);
				callback(that.widget);
			}
		}, 500);
	}

	SoundCloudPlayer.prototype.getTrackPosition = function(callback) {
		callback(this.trackInfo.position = this.widget.position / 1000);
		if (this.widget.durationEstimate)
			this.eventHandlers.onTrackInfo && this.eventHandlers.onTrackInfo({
				duration: this.widget.duration / 1000
			});
	};
	
	SoundCloudPlayer.prototype.setTrackPosition = function(pos) {
		this.safeCall("setPosition", pos * 1000);
	};

	SoundCloudPlayer.prototype.play = function(id) {
		this.trackInfo = {};
		this.embedVars.trackId = id;
		//console.log("soundcloud play", this.embedVars);
		var that = this;

		SC.stream("/tracks/"+id, this.soundOptions, function(sound){
			that.widget = sound;
			that.callHandler("onEmbedReady", that);
			//that.safeCall("play");
		});
	}

	SoundCloudPlayer.prototype.resume = function() {
		this.safeCall("play");
	}

	SoundCloudPlayer.prototype.pause = function() {
		this.safeCall("pause");
	}

	SoundCloudPlayer.prototype.stop = function() {
		this.safeCall("stop");
	}

	SoundCloudPlayer.prototype.setVolume = function(vol) {
		this.safeCall("setVolume", 100 * vol);
	}

	return SoundCloudPlayer;
})();
