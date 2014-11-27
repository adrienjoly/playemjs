//loader.includeJS("https://w.soundcloud.com/player/api.js");

window.$ = window.$ || function(){return window.$};
$.getScript = $.getScript || function(js,cb){loader.includeJS(js,cb);};
$.getJSON = $.getJSON || function(url, cb){
  var cbName = "_cb_" + Date.now();
  url = url.replace("callback=?", "callback=" + cbName);
  window[cbName] = function(){
    cb.apply(window, arguments);
    delete window[cbName];
  };
  loader.includeJS(url);
};

function SoundCloudPlayer(){
	return SoundCloudPlayer.super_.apply(this, arguments);
};

(function() {
	var EVENT_MAP = {
			"onplay": "onPlaying",
			"onresume": "onPlaying",
			"onpause": "onPaused",
			"onstop": "onPaused",
			"onfinish": "onEnded"
		},
		ERROR_EVENTS = [
			"onerror",
			"ontimeout",
			"onfailure",
			"ondataerror"
		];

	function Player(eventHandlers, embedVars) {  
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
			SC.initialize({client_id: SOUNDCLOUD_CLIENT_ID});
			for (var i in EVENT_MAP)
				(function(i) {
					that.soundOptions[i] = function() {
						//console.log("SC event:", i /*, this*/);
						var handler = eventHandlers[EVENT_MAP[i]];
						handler && handler(that);
					}
				})(i);
			ERROR_EVENTS.map(function(evt){
				that.soundOptions[evt] = function(e) {
					console.error("SC error:", evt, e, e.stack);
					that.eventHandlers.onError && that.eventHandlers.onError(that, {code:evt.substr(2), source:"SoundCloudPlayer"});
				};
			});
			that.isReady = true;
			try {
				soundManager.onready(function() {
					that.callHandler("onApiReady", that);
				});
			}
			catch(e){
				console.warn("warning: soundManager was not found => playem-soundcloud will not be able to stream music");
				that.callHandler("onApiReady", that);
			}
		});

		this.callHandler = function(name, params) {
			try {
				eventHandlers[name] && eventHandlers[name](params);//.apply(null, params);
			}
			catch (e) {
				console.error("SC error:", e, e.stack);
			}
		}
	}

	Player.prototype.safeCall = function(fctName, param) {
		try {
			//console.log("SC safecall", fctName);
			if (this.widget && this.widget[fctName])
				this.widget[fctName](param);
		}
		catch(e) {
			console.error("SC safecall error", e.stack);
		}
	}

	Player.prototype.getEid = function(url) {
		if (/(soundcloud\.com)\/player\/\?.*url\=(.+)/.test(url))
			url = decodeURIComponent(RegExp.lastParen);
		if (/(soundcloud\.com)(\/[\w-_\/]+)/.test(url))
			return RegExp.lastParen; //url.substr(url.lastIndexOf("/")+1);
		else if (/snd\.sc\/([\w-_]+)/.test(url))
			return RegExp.lastMatch;
		// => returns:
		// - /tracks/<number> (ready to stream)
		// - or /<artistname>/<tracktitle>
		// - or snd.sc/<hash>
	}

	function fetchMetadata(url, id, cb){
		var embed = {
			id: id,
			img: urlPrefix + "/images/cover-soundcloud.jpg",
		};
		loader.loadJSON('https://api.soundcloud.com/resolve.json?url='+encodeURIComponent(url)+'&client_id='+SOUNDCLOUD_CLIENT_ID/*+'&callback=' + callbackFct*/, function(data) {
			if (data && data.kind == "track") {
				embed.id = "" + data.id;
				embed.img = data.artwork_url || embed.img;
				embed.title = data.title;
				if (embed.title.indexOf(" - ") == -1 && (data.user || {}).username)
					embed.title = data.user.username + " - " + embed.title;
			}
			cb(embed);
		});
	}

	Player.prototype.fetchMetadata = function(url, cb){
		var id = this.getEid(url);
		if (!id)
			return cb();
		fetchMetadata(url, id, cb);
	}

	Player.prototype.getTrackPosition = function(callback) {
		callback(this.trackInfo.position = this.widget.position / 1000);
		if (this.widget.durationEstimate)
			this.eventHandlers.onTrackInfo && this.eventHandlers.onTrackInfo({
				duration: this.widget.duration / 1000
			});
	};
	
	Player.prototype.setTrackPosition = function(pos) {
		this.safeCall("setPosition", pos * 1000);
	};

	Player.prototype.play = function(id) {
		console.log("sc PLAY id:", id)
		this.trackInfo = {};
		var that = this;
		function playId(id){
			console.log("=> sc PLAY id:", id)
			that.embedVars.trackId = id;
			//console.log("soundcloud play", this.embedVars);
			SC.stream(id, that.soundOptions, function(sound){
				that.widget = sound;
				that.callHandler("onEmbedReady", that);
				//that.safeCall("play");
			});
		}
		if (id.indexOf("/tracks/") == 0)
			return playId(id);
		id = "http://" + (!id.indexOf("/") ? "soundcloud.com" : "") + id;
		console.log("sc resolve url:", id);
		$.getJSON("https://api.soundcloud.com/resolve.json?client_id=" + SOUNDCLOUD_CLIENT_ID + "&url=" + encodeURIComponent(id) + "&callback=?", function(data){
			playId(data.id);
		});
	}

	Player.prototype.resume = function() {
		this.safeCall("play");
	}

	Player.prototype.pause = function() {
		this.safeCall("pause");
	}

	Player.prototype.stop = function() {
		this.safeCall("stop");
	}

	Player.prototype.setVolume = function(vol) {
		this.safeCall("setVolume", 100 * vol);
	}

	//inherits(SoundCloudPlayer, Player);
	SoundCloudPlayer.prototype = Player.prototype;
	SoundCloudPlayer.super_ = Player;
	// this method exports Player under the name "SoundCloudPlayer", even after minification
	// so that SoundCloudPlayer.name == "SoundCloudPlayer" instead of SoundCloudPlayer.name == "Player"
})();
