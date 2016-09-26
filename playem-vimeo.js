// "universal embed" / iframe version of Vimeo Player

function VimeoPlayer(){
	return VimeoPlayer.super_.apply(this, arguments);
}

(function() {

	var EVENT_MAP = {
			"playProgress": function(that, data){
				that.trackInfo.position = Number(data.seconds);
				that.trackInfo.duration = Number(data.duration);
				that.eventHandlers.onPlaying && that.eventHandlers.onPlaying(that);
				that.eventHandlers.onTrackInfo && that.eventHandlers.onTrackInfo(that.trackInfo);
			},
			"pause": "onPaused",
			"finish": "onEnded",
		};

	// utility function
	function param(obj){
		return Object.keys(obj).map(function(f){
			return encodeURIComponent(f) + "=" + encodeURIComponent(obj[f]);
		}).join("&");
	}

	function onMessageReceived(e) {
		if (e.origin.indexOf("vimeo.com") == -1)
			return;
		try {
			var that = this, data = {};
			if (e.data.charAt(0) === '{') {
				data = JSON.parse(e.data);
			} else {
				e.data.split("&").map(function(keyval){
					var s = keyval.split("=");
					data[s[0]] = s[1];
				});
			}
			data.params = (data.params || "").split(",");
			data.player_id = data.player_id || data.params.pop();
			if (data.player_id == this.embedVars.playerId) {
				if (data.method == "onLoad") {
					Object.keys(EVENT_MAP).map(this.post.bind(this, 'addEventListener'));
				}
				else
					setTimeout(function(){
						var eventHandler = that.eventHandlers[EVENT_MAP[data.event]] || EVENT_MAP[data.event];
						if (typeof eventHandler == "function")
							eventHandler.apply(that, [that].concat(data.data));
						else
							console.warn("vimeo missing handler for event", data.method);
					});
			}
		} catch (e) {
			console.log("VimeoPlayer error", e, e.stack);
			this.eventHandlers.onError && this.eventHandlers.onError(this, {source:"VimeoPlayer", exception: e});
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
			window.addEventListener('message', onMessageReceived.bind(this), false);
		else
			window.attachEvent('onmessage', onMessageReceived.bind(this), false);
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

	function fetchMetadata(id, cb){
		loader.loadJSON("https://vimeo.com/api/v2/video/" + id + ".json", function(data) {
			cb(!data || !data.map ? null : {
				id: id,
				title: data[0].title,
				img: data[0].thumbnail_medium,
			});
		});
	}

	Player.prototype.fetchMetadata = function(url, cb){
		var id = this.getEid(url);
		if (!id)
			return cb();
		fetchMetadata(id, cb);
	}

	Player.prototype.setTrackPosition = function(pos) {
		this.pause(); // hack to prevent freeze on firefox 31.0
		this.post("seekTo", pos);
		this.resume(); // hack to prevent freeze on firefox 31.0
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
			src: 'https://player.vimeo.com/video/' + vars.videoId + "?" + param({
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
		this.embedVars.playerContainer.innerHTML = '';
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
		if (this.element)
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

try{
	module.exports = VimeoPlayer;
}catch(e){};
