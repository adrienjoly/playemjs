// "universal embed" / iframe version of Vimeo Player

window.$ = window.$ || function(){return window.$};
$.param = $.param || function(obj){
	return Object.keys(obj).map(function(f){
		return encodeURIComponent(f) + "=" + encodeURIComponent(obj[f]);
	}).join("&");
};

function VimeoPlayer(){
	return VimeoPlayer.super_.apply(this, arguments);
}

(function() {

	var MOOGALOOP = (window.location.protocol || "") + '//vimeo.com/moogaloop.swf?',  // 'http://a.vimeocdn.com/p/flash/moogaloop/5.2.42/moogaloop.swf?v=1.0.0'
		EVENT_MAP = {
			"play": "onPlaying",
			"resume": "onPlaying",
			"pause": "onPaused",
			"finish": "onEnded",
			"progress": function(that, seconds){
				that.trackInfo.position = Number(seconds);
				that.eventHandlers.onTrackInfo && that.eventHandlers.onTrackInfo(that.trackInfo);
			},
			"getDuration": function(that, duration){
				that.trackInfo.duration = Number(duration);
			}
		}, HTML5_EVENTS = ["play", "pause", "finish", "playProgress"];

	function onMessageReceived(e) {
		if (e.origin.indexOf("vimeo.com") == -1)
			return;
		try {
			//var data = JSON.parse(e.data); // new format: "method=onLoad&params=genericplayer"
			var data = {};
			e.data.split("&").map(function(keyval){
				var s = keyval.split("=");
				data[s[0]] = s[1];
			});
			data.params = (data.params || "").split(",");
			data.player_id = data.player_id || data.params.pop();
			if (data.player_id == that.embedVars.playerId) {
				if (data.method == "onLoad") {
					HTML5_EVENTS.map(that.post.bind(that, 'addEventListener'));
					that.post("getDuration");
				}
				else
					setTimeout(function(){
						data.event = data.method.replace(/^on/, "");
						data.event = data.event.substr(0,1).toLowerCase() + data.event.substr(1);
						var eventHandler = eventHandlers[EVENT_MAP[data.event]] || EVENT_MAP[data.event];
						if (eventHandler) {
							data.params.unshift(that);
							eventHandler.apply(that, data.params);
						}
					});
			}
		} catch (e) {
			console.log("VimeoPlayer error", e, e.stack);
			that.eventHandlers.onError && that.eventHandlers.onError(that, {source:"VimeoPayer", exception: e});
		}
	}

	function Player(eventHandlers, embedVars) {  
		var that = this;
		this.label = 'Vimeo';
		this.element = null;
		this.eventHandlers = eventHandlers || {};
		this.embedVars = embedVars || {};
		this.isReady = false;
		this.trackInfo = {};
		if (window.addEventListener)
			window.addEventListener('message', onMessageReceived, false);
		else
			window.attachEvent('onmessage', onMessageReceived, false);
		//loader.includeJS("http://a.vimeocdn.com/js/froogaloop2.min.js", function() {
			that.isReady = true;
			eventHandlers.onApiReady && eventHandlers.onApiReady(that);
		//});
	}

	Player.prototype.post = function(action, value) {
		var data = {method: action};
		if (value)
			data.value = value;
		try{
			return this.element.contentWindow.postMessage(JSON.stringify(data), this.element.src.split("?")[0]);
		} catch(e){
			console.log(e);
		}
	}

	Player.prototype.getEid = function(url) {
		return /(vimeo\.com\/(clip\:|video\/)?|\/vi\/)(\d+)/.test(url) && RegExp.lastParen;
	}

	Player.prototype.setTrackPosition = function(pos) {
		this.post("seekTo", pos);
	};
	
	Player.prototype.embed = function(vars) {
		//console.log("VimeoPlayer embed vars:", vars);
		this.embedVars = vars = vars || {};
		this.embedVars.playerId = this.embedVars.playerId || 'viplayer';
		this.trackInfo = {};
		this.element = document.createElement("iframe");
		var attributes = {
			id: this.embedVars.playerId,
			width: this.embedVars.width || '200',
			height: this.embedVars.height || '200',
			frameborder: "0",
			webkitAllowFullScreen: true,
			mozallowfullscreen: true,
			allowScriptAccess: "always",
			allowFullScreen: true,
			src: '//player.vimeo.com/video/' + vars.videoId + "?" + $.param({
				api: 1,
				js_api: 1,
				player_id: this.embedVars.playerId,
				title: 0,
				byline: 0,
				portrait: 0,
				autoplay: 1
			})
		};
		for (i in attributes)
			this.element.setAttribute(i, attributes[i]);
		this.embedVars.playerContainer.appendChild(this.element);
		// TODO: wait for this.element.contentWindow.postMessage to be ready to be called
		if (this.eventHandlers.onEmbedReady)
			this.eventHandlers.onEmbedReady();
	}

	Player.prototype.play = function(id) {
		if (id && (!this.currentId || this.currentId != id)) {
			this.embedVars.videoId = id;
			this.embed(this.embedVars);
		}
	}

	Player.prototype.resume = function() {
		this.post("play");
	}

	Player.prototype.pause = function() {
		this.post("pause");
	}

	Player.prototype.stop = function() {
		this.post("unload");
		if ((this.element || {}).parentNode)
			this.element.parentNode.removeChild(this.element);
		if ((this.otherElement || {}).parentNode)
			this.otherElement.parentNode.removeChild(this.otherElement);
	}

	Player.prototype.setVolume = function(vol) {
		this.post("setVolume", 100 * vol);
	}

	//return Playem;
	//inherits(VimeoPlayer, Player);
	VimeoPlayer.prototype = Player.prototype;
	VimeoPlayer.super_ = Player;
})();
