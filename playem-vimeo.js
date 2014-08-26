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

	var USE_FLASH_VIMEO = false, // ... or "universal embed" (iframe), if false
		MOOGALOOP = (window.location.protocol || "") + '//vimeo.com/moogaloop.swf?',  // 'http://a.vimeocdn.com/p/flash/moogaloop/5.2.42/moogaloop.swf?v=1.0.0'
		EVENT_MAP = {
			"play": "onPlaying",
			"resume": "onPlaying",
			"pause": "onPaused",
			"finish": "onEnded",
			"progress": function(that, seconds) { // Flash event
				that.trackInfo = {
					duration: Number(that.element.api_getDuration()),
					position: Number(seconds)
				};
				that.eventHandlers.onTrackInfo && that.eventHandlers.onTrackInfo(that.trackInfo);
			}
		}, HTML5_EVENTS = ["play", "pause", "finish", "playProgress"];

		if (!USE_FLASH_VIMEO){
			EVENT_MAP.getDuration = function(that, duration){
				that.trackInfo.duration = Number(duration);
			};
			EVENT_MAP.progress = function(that, seconds){
				//console.log("progress", arguments, "=>", that.post("getDuration"));
				that.trackInfo.position = Number(seconds);
				that.eventHandlers.onTrackInfo && that.eventHandlers.onTrackInfo(that.trackInfo);
			};
		}

	function Player(eventHandlers, embedVars) {  
		var that = this;
		this.label = 'Vimeo';
		this.element = null;
		this.eventHandlers = eventHandlers || {};
		this.embedVars = embedVars || {};
		this.isReady = false;
		this.trackInfo = {};
		
		if (!USE_FLASH_VIMEO) {
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
			if (window.addEventListener)
				window.addEventListener('message', onMessageReceived, false);
			else
				window.attachEvent('onmessage', onMessageReceived, false);
		}
		
		//loader.includeJS("http://a.vimeocdn.com/js/froogaloop2.min.js", function() {
			that.isReady = true;
			eventHandlers.onApiReady && eventHandlers.onApiReady(that);
		//});
	}

	Player.prototype.post = USE_FLASH_VIMEO ? function(action, value) {
		try {
		    var args = Array.apply(null, arguments).slice(1) // exclude first arg
		    return this.element["api_"+action].apply(this.element, args);
		} catch (e) {
			console.log("VIMEO error: unable to call", action);
			//that.eventHandlers.onError && that.eventHandlers.onError(that, {source:"VimeoPayer", exception:e});
		}
	} : function(action, value) { // HTML 5 VERSION
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

		if (USE_FLASH_VIMEO) {
			// inspired by http://derhess.de/vimeoTest/test.html
			var i, embedAttrs, params, innerHTML, objectAttrs, objectHtml, //$embed, $object, // = $(this.element);
				that = this,
				flashvars = {
					server: (window.location.protocol || "") + '//vimeo.com',
					player_server: (window.location.protocol || "") + '//player.vimeo.com',
					api_ready: 'vimeo_ready',
					player_id: this.embedVars.playerId,
					clip_id: vars.videoId,
					title: 0,
					byline: 0,
					portrait: 0,
					fullscreen: 0,
					autoplay: 1,
					js_api: 1
				};

			window.vimeoHandlers = {};

			function setHandlers () {
				Object.keys(EVENT_MAP).map(function(evt){
					var evtName = 'on' + evt[0].toUpperCase() + evt.substr(1);
					vimeoHandlers[evt] = (that.eventHandlers[EVENT_MAP[evt]] || EVENT_MAP[evt]).bind(that, that);
					that.element.api_addEventListener(evtName, "vimeoHandlers." + evt);
				});
				if (that.eventHandlers.onEmbedReady)
					that.eventHandlers.onEmbedReady();
			}

			// CHROME: ready called from here
			embedAttrs = {
			//	id: this.embedVars.playerId,
				src: MOOGALOOP + $.param(flashvars).replace(/\&/g, "&amp;"),
				type: 'application/x-shockwave-flash',
				classid: "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",
				allowscriptaccess: "always",
				width: this.embedVars.width || '200',
				height: this.embedVars.height || '200'
			};
			
			window.vimeo_ready = function() {
				//console.log("vimeo embed is ready (embed element)");
				that.otherElement = that.element;
				that.otherElement.setAttribute("id", that.embedVars.playerId + "_");
				that.element = that.otherElement.parentNode.getElementsByTagName("embed")[0];
				that.element.setAttribute("id", that.embedVars.playerId);
				setHandlers();
			}
			window.vimeo_ready_object = function() {
				//console.log("vimeo embed is ready (object element)");
				setHandlers();
			}

			flashvars.api_ready = 'vimeo_ready_object';

			// IE9: ready called from here
			params = {
				AllowScriptAccess: "always",
				WMode: "opaque",
				FlashVars: $.param(flashvars).replace(/\&/g, "&amp;"),
				Movie: MOOGALOOP + $.param(flashvars)
			};

			innerHTML = "";
			for (i in params)
				innerHTML += '<param name="'+i.toLowerCase()+'" value="'+params[i]+'">';

			objectAttrs = {
				id: this.embedVars.playerId,
				src: MOOGALOOP + $.param(flashvars).replace(/\&/g, "&amp;"),
			//	data: MOOGALOOP + $.param(flashvars),
				type: 'application/x-shockwave-flash',
				classid: "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",
				allowscriptaccess: "always",
				width: this.embedVars.width || '200',
				height: this.embedVars.height || '200'
			};

			objectHtml = "";
			for (i in objectAttrs)
				objectHtml += i + '="' + objectAttrs[i] + '" ';

			// needed by chrome
			innerHTML += "<embed ";
			for (i in embedAttrs)
				innerHTML += i + '="' + embedAttrs[i] + '" ';			
			innerHTML += "></embed>";
			this.embedVars.playerContainer.innerHTML += "<object "+objectHtml+">" + innerHTML + "</object>";

			this.element = document.getElementById(this.embedVars.playerId);
		}
		else { // "universal embed" (iframe)
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
