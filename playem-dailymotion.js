function DailymotionPlayer(){
	return DailymotionPlayer.super_.apply(this, arguments);
}

(function() {

	var regex = /(dailymotion.com(?:\/embed)?\/video\/|\/dm\/)([\w-]+)/,
		ignoreEnded = 0;
		EVENT_MAP = {
			0: "onEnded",
			1: "onPlaying",
			2: "onPaused"
		};

	function Player(eventHandlers, embedVars) {
		this.eventHandlers = eventHandlers || {};
		this.embedVars = embedVars || {};
		this.label = "Dailymotion";
		this.element = null;
		this.isReady = false;
		this.trackInfo = {};
		var that = this;

		window.onDailymotionStateChange = function(newState) {
			if (newState > 0 || !ignoreEnded)
				that.safeClientCall(EVENT_MAP[newState], that);
			else
				--ignoreEnded;
			/*if (newState == 1) {
				console.log("getduration", that.element.getDuration());
				that.trackInfo.duration = that.element.getDuration(); //that.safeCall("getDuration");
			}*/
		};

		window.onDailymotionError = function(error) {
			console.log("DM error", error)
			that.safeClientCall("onError", that, {source:"DailymotionPlayer", data: error});
		}

		window.onDailymotionAdStart = function(){
			that.safeClientCall("onBuffering", that);
		}

		/*window.onDailymotionVideoProgress = function(a) {
			console.log("progress", a)
		}*/

		window.onDailymotionPlayerReady = function(playerId) {
			that.element = /*that.element ||*/ document.getElementById(playerId); /* ytplayer*/
			that.element.addEventListener("onStateChange", "onDailymotionStateChange");
			that.element.addEventListener("onError", "onDailymotionError");
			that.element.addEventListener("onLinearAdStart", "onDailymotionAdStart");
			//that.element.addEventListener("onLinearAdComplete", "onDailymotionAdComplete");
			//that.element.addEventListener("onVideoProgress", "onDailymotionVideoProgress");
		}
		
		that.isReady = true;
		that.safeClientCall("onApiReady", that);
	}
	
	Player.prototype.safeCall = function(fctName, p1, p2) {
		//return (this.element || {})[fctName] && this.element[fctName](p1, p2);
		var args = Array.apply(null, arguments).slice(1), // exclude first arg (fctName)
			fct = (this.element || {})[fctName];
		return fct && fct.apply(this.element, args);
	}
	
	Player.prototype.safeClientCall = function(fctName, p1, p2) {
		try {
			return this.eventHandlers[fctName] && this.eventHandlers[fctName](p1, p2);
		}
		catch(e) {
			console.error("DM safeclientcall error", e.stack);
		}
	}

	Player.prototype.embed = function (vars) {
		this.embedVars = vars = vars || {};
		this.embedVars.playerId = this.embedVars.playerId || 'dmplayer';
		this.trackInfo = {};
		this.element = document.createElement("object");
		this.element.id = this.embedVars.playerId;
		this.embedVars.playerContainer.appendChild(this.element);

		var paramsQS,
			paramsHTML,
			embedAttrs, 
			params = {
				allowScriptAccess: "always"
			},
			atts = {
				id: this.embedVars.playerId
			},
			swfParams = {
				//api: "postMessage",
				info: 0,
				logo: 0,
				related: 0,
				autoplay: 1,
				enableApi: 1,
				showinfo: 0,
				hideInfos: 1,
				chromeless: 1,
				withLoading: 0,
				playerapiid: this.embedVars.playerId
			};

		paramsQS = Object.keys(swfParams).map(function(k){ // query string
			return k + "=" + encodeURIComponent(swfParams[k]);
		}).join("&");

		paramsHTML = Object.keys(params).map(function(k){
			return '<param name="' + k +'" value="' + encodeURIComponent(params[k]) + '">';
		}).join();

		embedAttrs = {
			id: this.embedVars.playerId,
			width: this.embedVars.width || '200',
			height: this.embedVars.height || '200',
			type: "application/x-shockwave-flash",
			data: window.location.protocol+'//www.dailymotion.com/swf/'+this.embedVars.videoId+'?'+paramsQS,
			innerHTML: paramsHTML
		};
		if (USE_SWFOBJECT) {
			swfobject.embedSWF(embedAttrs.data, this.embedVars.playerId, embedAttrs.width, embedAttrs.height, "9.0.0", "/js/swfobject_expressInstall.swf", null, params, atts);
		}
		else {
			$(this.element).attr(embedAttrs);
		}
		$(this.element).show();
		this.safeClientCall("onEmbedReady");
	}

	Player.prototype.getEid = function(url) {
		return regex.test(url) && RegExp.lastParen;
	}

	function fetchMetadata(id, cb){
		// specifying a HTTP/HTTPS protocol in the url provided as a parameter is mandatory
		var url = encodeURIComponent("http://www.dailymotion.com/embed/video/" + id),
			callbackFct = "dmCallback_" + id.replace(/[-\/]/g, "__");
		window[callbackFct] = function(data) {
			cb(!data || !data.title ? null : {
				id: id,
				title: data.title,
				img: data.thumbnail_url,
			});
		};
		loader.includeJS("//www.dailymotion.com/services/oembed?format=json&url=" + url + "&callback=" + callbackFct);
	}

	Player.prototype.fetchMetadata = function(url, cb){
		var id = this.getEid(url);
		if (!id)
			return cb();
		fetchMetadata(id, cb);
	}

	Player.prototype.play = function(id) {
		if (!this.currentId || this.currentId != id) {
			this.embedVars.videoId = id;
			this.embed(this.embedVars);
		}
	}

	Player.prototype.pause = function(vol) {
		this.safeCall("pauseVideo");
	};

	Player.prototype.resume = function(vol) {
		this.safeCall("playVideo");
	};
	
	Player.prototype.stop = function(vol) {
		++ignoreEnded;
		//this.element.stopVideo();
		this.safeCall("clearVideo");
		if ((this.element || {}).parentNode)
			this.element.parentNode.removeChild(this.element);
	};
	
	Player.prototype.getTrackPosition = function(callback) {
		this.trackInfo.duration = this.safeCall("getDuration");
		callback && callback(this.safeCall("getCurrentTime"));
	};
	
	Player.prototype.setTrackPosition = function(pos) {
		this.safeCall("seekTo", pos);
	};
	
	Player.prototype.setVolume = function(vol) {
		this.safeCall("setVolume", vol * 100);
	};

	//return Player;
	//inherits(DailymotionPlayer, Player);
	DailymotionPlayer.prototype = Player.prototype;
	DailymotionPlayer.super_ = Player;
})();
