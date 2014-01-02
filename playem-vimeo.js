var USE_FLASH_VIMEO = true; // ... or "universal embed" (iframe), if false

VimeoPlayer = (function() {

	var EVENT_MAP = {
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

	function VimeoPlayer(eventHandlers, embedVars) {  
		this.label = 'Vimeo';
		this.element = null;
		this.eventHandlers = eventHandlers || {};
		this.embedVars = embedVars || {};
		this.isReady = false;
		this.trackInfo = {};
		var that = this;
		
		if (!USE_FLASH_VIMEO) {
			function onMessageReceived(e) {
				//console.log("onMessageReceived", e, e.origin, e.data);
				try {
					var data = JSON.parse(e.data);
					if (data.player_id == that.embedVars.playerId) {
						//console.log("VIMEO EVENT", data);
						if (data.event == "ready")
							for (var i in EVENT_MAP)
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
			setTimeout(function() {
				that.isReady = true;
				eventHandlers.onApiLoaded && eventHandlers.onApiLoaded(that);
				eventHandlers.onApiReady && eventHandlers.onApiReady(that);
			}, 500);
		//});
	}

	VimeoPlayer.prototype.post = USE_FLASH_VIMEO ? function(action, value) {
		if (!this.element)
			return console.log("warning: this.element not found");
		if (!this.element["api_"+action])
			return console.log("warning: action not found:", "api_"+action);
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

	VimeoPlayer.prototype.getEid = function(url, cb) {
		var matches = /https?:\/\/(?:www\.)?vimeo\.com\/(clip\:)?(\d+)/.exec(url);
		cb(matches ? matches.pop() : null, this);
	}

	VimeoPlayer.prototype.setTrackPosition = function(pos) {
		this.post("seekTo", pos);
	};
	
	VimeoPlayer.prototype.embed = function(vars) {

		//console.log("VimeoPlayer embed vars:", vars);
		this.embedVars = vars = vars || {};
		this.embedVars.playerId = this.embedVars.playerId || 'viplayer';
		this.trackInfo = {};
		/*
		this.element = document.createElement(USE_FLASH_VIMEO ? "object" : "iframe");
		*/
		//this.embedVars.playerContainer.appendChild(this.element);

		this.holder = document.createElement("div");
		this.holder.id = "genericholder";
		/*
		this.holder.appendChild(this.element);
		*/
		this.embedVars.playerContainer.appendChild(this.holder);

		if (USE_FLASH_VIMEO) {
			// inspired by http://derhess.de/vimeoTest/test.html
			var that = this;
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
				if (/*!this.isReady &&*/ this.eventHandlers.onEmbedReady)
					this.eventHandlers.onEmbedReady();
				//this.isReady = true;				
			}

			var flashvars = {
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

			var $object; // = $(this.element);
			
			// CHROME: ready called from here
			var embedAttrs = {
			//	id: this.embedVars.playerId,
				src: 'http://vimeo.com/moogaloop.swf?' + $.param(flashvars).replace(/\&/g, "&amp;"), // 'http://a.vimeocdn.com/p/flash/moogaloop/5.2.42/moogaloop.swf?v=1.0.0'
				type: 'application/x-shockwave-flash',
				classid: "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",
				allowscriptaccess: "always",
				width: this.embedVars.height || '200',
				height: this.embedVars.width || '200'
			};
			//var $embed = $("<embed>").attr(embedAttrs);
			////$embed.appendTo($object);
			
			window.vimeo_ready = function() {
				console.log("vimeo embed is ready (embed element)");
				$object.attr("id", "");
				$embed.attr("id", that.embedVars.playerId);
				that.element = document.getElementById(that.embedVars.playerId);
				setHandlers();
			}
			window.vimeo_ready_object = function() {
				console.log("vimeo embed is ready (object element)");
				// => nothing to do
				setHandlers();
			}

			//flashvars.api_ready = 'vimeo_ready_param';
			flashvars.api_ready = 'vimeo_ready_object';

			// IE9: ready called from here
			var params = {
				AllowScriptAccess: "always",
				WMode: "opaque",
				FlashVars: $.param(flashvars).replace(/\&/g, "&amp;"),
				Movie: "http://vimeo.com/moogaloop.swf?" + $.param(flashvars) //"http://a.vimeocdn.com/p/flash/moogaloop/5.2.42/moogaloop.swf?v=1.0.0&amp;time=1350388628283"
			};

			var innerHTML = "";
			for (var i in params) {
				//console.log('<param name="'+i.toLowerCase()+'" value="'+params[i]+'">')
				innerHTML += '<param name="'+i.toLowerCase()+'" value="'+params[i]+'">';
				//$object.append($('<param name="'+i.toLowerCase()+'" value="'+params[i]+'">'));
					//.append('<PARAM NAME="'+i+'" VALUE="'+params[i].replace("&", "&amp;")+'">');
			}

			var objectAttrs = {
				id: this.embedVars.playerId,
				src: 'http://vimeo.com/moogaloop.swf?' + $.param(flashvars).replace(/\&/g, "&amp;"), // 'http://a.vimeocdn.com/p/flash/moogaloop/5.2.42/moogaloop.swf?v=1.0.0'
			//	data: 'http://vimeo.com/moogaloop.swf?' + $.param(flashvars), // 'http://a.vimeocdn.com/p/flash/moogaloop/5.2.42/moogaloop.swf?v=1.0.0'
				type: 'application/x-shockwave-flash',
				classid: "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",
				allowscriptaccess: "always",
				width: this.embedVars.height || '200',
				height: this.embedVars.width || '200'
			};

			var objectHtml = "";
			for (var i in objectAttrs)
				objectHtml += i + '="' + objectAttrs[i] + '" ';

			//$embed.appendTo($object); // needed by chrome
			innerHTML += "<embed ";
			for (var i in embedAttrs)
				innerHTML += i + '="' + embedAttrs[i] + '" ';			
			innerHTML += "></embed>"
			this.holder.innerHTML = "<object "+objectHtml+">" + innerHTML + "</object>";

			this.element = document.getElementById(this.embedVars.playerId);
			$object = $(this.element);
			var $embed = $("#"+this.embedVars.playerId + " > embed");

			$object.show();
		}
		else { // "universal embed" (iframe)
			var strParams = {
				api: 1,
				js_api: 1,
				player_id: this.embedVars.playerId,
				title: 0,
				byline: 0,
				portrait: 0,
				autoplay: 1
			};
			$(this.element).attr({
				id: this.embedVars.playerId,
				width: this.embedVars.height || '200',
				height: this.embedVars.width || '200',
				frameborder: "0",
				webkitAllowFullScreen: true,
				mozallowfullscreen: true,
				allowScriptAccess: "always",
				allowFullScreen: true,
				src: 'http://player.vimeo.com/video/' + vars.videoId + "?" + $.param(strParams)
			}).show();
			if (/*!this.isReady &&*/ this.eventHandlers.onEmbedReady)
				this.eventHandlers.onEmbedReady();
			//this.isReady = true;
		}
	}

	VimeoPlayer.prototype.play = function(id) {
		if (id && (!this.currentId || this.currentId != id)) {
			this.embedVars.videoId = id;
			this.embed(this.embedVars);
		}
	}

	VimeoPlayer.prototype.resume = function() {
		this.post("play");
	}

	VimeoPlayer.prototype.pause = function() {
		this.post("pause");
	}

	VimeoPlayer.prototype.stop = function() {
		//this.post("pause");
		this.post("unload");
		//$(this.element).remove();
	}

	VimeoPlayer.prototype.setVolume = function(vol) {
		this.post("setVolume", 100 * vol);
	}

	return VimeoPlayer;
})();