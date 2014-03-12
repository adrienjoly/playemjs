window.$ = window.$ || function(){return window.$};
$.show = $.show || function(){return $};
$.param = $.param || function(obj){
	return Object.keys(obj).map(function(f){
		return encodeURIComponent(f) + "=" + encodeURIComponent(obj[f]);
	}).join("&");
};

function VimeoPlayer(){
	return VimeoPlayer.super_.apply(this, arguments);
}

(function() {

	var USE_FLASH_VIMEO = true, // ... or "universal embed" (iframe), if false
		EVENT_MAP = {
			"play": "onPlaying",
			"resume": "onPlaying",
			"pause": "onPaused",
			"finish": "onEnded",
			"playProgress": function(that, e) { // Html5 event
				that.trackInfo = {
					duration: Number(e.data.duration),
					position: Number(e.data.seconds)
				};
				that.eventHandlers.onTrackInfo && that.eventHandlers.onTrackInfo(that.trackInfo);
			},
			"progress": function(that, seconds) { // Flash event
				that.trackInfo = {
					duration: Number(that.element.api_getDuration()),
					position: Number(seconds)
				};
				that.eventHandlers.onTrackInfo && that.eventHandlers.onTrackInfo(that.trackInfo);
			}
		};

	function Player(eventHandlers, embedVars) {  
		this.label = 'Vimeo';
		this.element = null;
		this.eventHandlers = eventHandlers || {};
		this.embedVars = embedVars || {};
		this.isReady = false;
		this.trackInfo = {};
		var i, that = this;
		
		if (!USE_FLASH_VIMEO) {
			function onMessageReceived(e) {
				//console.log("onMessageReceived", e, e.origin, e.data);
				try {
					var data = JSON.parse(e.data);
					if (data.player_id == that.embedVars.playerId) {
						//console.log("VIMEO EVENT", data);
						if (data.event == "ready")
							for (i in EVENT_MAP)
								that.post('addEventListener', i);
						else
							(eventHandlers[EVENT_MAP[data.event]] || EVENT_MAP[data.event])(that, data);
					}
				} catch (e) {
					//console.log("VimeoPlayer error", e, e.stack);
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
		if (!this.element)
			return console.warn("VIMEO: this.element not found");
		if (!this.element["api_"+action])
			return console.warn("VIMEO: action not found:", "api_"+action);
		try {
			if (value != undefined)
				this.element["api_"+action](value);
			else
				this.element["api_"+action]();
		} catch (e) {
			//console.log("vimeo api error", e, e.stack);
			that.eventHandlers.onError && that.eventHandlers.onError(that, {source:"VimeoPayer", exception:e});
		}
	} : function(action, value) { // HTML 5 VERSION
		var data = {method: action};
		if (value)
			data.value = value;
		this.element.contentWindow.postMessage(JSON.stringify(data), this.element.src.split("?")[0]);
	}

	Player.prototype.getEid = function(url, cb) {
		var matches = /(?:https?:\/\/(?:www\.)?)?vimeo\.com\/(clip\:)?(\d+)/.exec(url);
		cb(matches ? matches.pop() : null, this);
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
					server: 'vimeo.com',
					player_server: 'player.vimeo.com',
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
				for (var evt in EVENT_MAP)
					(function(evt){
						vimeoHandlers[evt] = function(data) {
							//console.log("vimeo event", evt, '=> on'+evt[0].toUpperCase()+evt.substr(1));
							(that.eventHandlers[EVENT_MAP[evt]] || EVENT_MAP[evt])(that, data);
						};
						that.element.api_addEventListener('on'+evt[0].toUpperCase()+evt.substr(1), "vimeoHandlers." + evt);
					})(evt);
				if (this.eventHandlers.onEmbedReady)
					this.eventHandlers.onEmbedReady();
			}

			// CHROME: ready called from here
			embedAttrs = {
			//	id: this.embedVars.playerId,
				src: 'http://vimeo.com/moogaloop.swf?' + $.param(flashvars).replace(/\&/g, "&amp;"), // 'http://a.vimeocdn.com/p/flash/moogaloop/5.2.42/moogaloop.swf?v=1.0.0'
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
				that.element = that.otherElement.getElementsByTagName("embed")[0];
				that.element.setAttribute("id", that.embedVars.playerId);
				setHandlers();
			}
			window.vimeo_ready_object = function() {
				//console.log("vimeo embed is ready (object element)");
				setHandlers();
			}

			//flashvars.api_ready = 'vimeo_ready_param';
			flashvars.api_ready = 'vimeo_ready_object';

			// IE9: ready called from here
			params = {
				AllowScriptAccess: "always",
				WMode: "opaque",
				FlashVars: $.param(flashvars).replace(/\&/g, "&amp;"),
				Movie: "http://vimeo.com/moogaloop.swf?" + $.param(flashvars) //"http://a.vimeocdn.com/p/flash/moogaloop/5.2.42/moogaloop.swf?v=1.0.0&amp;time=1350388628283"
			};

			innerHTML = "";
			for (i in params)
				innerHTML += '<param name="'+i.toLowerCase()+'" value="'+params[i]+'">';

			objectAttrs = {
				id: this.embedVars.playerId,
				src: 'http://vimeo.com/moogaloop.swf?' + $.param(flashvars).replace(/\&/g, "&amp;"), // 'http://a.vimeocdn.com/p/flash/moogaloop/5.2.42/moogaloop.swf?v=1.0.0'
			//	data: 'http://vimeo.com/moogaloop.swf?' + $.param(flashvars), // 'http://a.vimeocdn.com/p/flash/moogaloop/5.2.42/moogaloop.swf?v=1.0.0'
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
			$(this.element).attr({
				id: this.embedVars.playerId,
				width: this.embedVars.width || '200',
				height: this.embedVars.height || '200',
				frameborder: "0",
				webkitAllowFullScreen: true,
				mozallowfullscreen: true,
				allowScriptAccess: "always",
				allowFullScreen: true,
				src: 'http://player.vimeo.com/video/' + vars.videoId + "?" + $.param({
					api: 1,
					js_api: 1,
					player_id: this.embedVars.playerId,
					title: 0,
					byline: 0,
					portrait: 0,
					autoplay: 1
				})
			}).show();
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
