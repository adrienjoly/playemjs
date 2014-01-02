DailymotionPlayer = (function() {

	var regex = /https?:\/\/(?:www\.)?dailymotion.com(?:\/embed)?\/video\/([\w-]+)/;

	var EVENT_MAP = {
		0: "onEnded",
		1: "onPlaying",
		2: "onPaused"
	};

	function DailymotionPlayer(eventHandlers, embedVars) {
		this.eventHandlers = eventHandlers || {};
		this.embedVars = embedVars || {};
		this.label = "Dailymotion";
		this.element = null;
		this.isReady = false;
		this.trackInfo = {};
		var that = this;

		window.onDailymotionStateChange = function(newState) {
			that.safeClientCall(EVENT_MAP[newState], that);
			/*if (newState == 1) {
				console.log("getduration", that.element.getDuration());
				that.trackInfo.duration = that.element.getDuration(); //that.safeCall("getDuration");
			}*/
		};

		window.onDailymotionError = function(error) {
			that.safeClientCall("onError", that, {source:"DailymotionPlayer", data: error});
		}

		/*window.onDailymotionVideoProgress = function(a) {
			console.log("progress", a)
		}*/

		window.onDailymotionPlayerReady = function(playerId) {
			that.element = /*that.element ||*/ document.getElementById(playerId); /* ytplayer*/
			that.element.addEventListener("onStateChange", "onDailymotionStateChange");
			that.element.addEventListener("onError", "onDailymotionError");
			//that.element.addEventListener("onVideoProgress", "onDailymotionVideoProgress");
			that.safeClientCall("onApiReady", that);
		}
		
		that.isReady = true;
		that.safeClientCall("onApiLoaded", that);
	}
	
	DailymotionPlayer.prototype.safeCall = function(fctName, p1, p2) {
		//return (this.element || {})[fctName] && this.element[fctName](p1, p2);
		var args = Array.apply(null, arguments).slice(1); // exclude first arg (fctName)
		var fct = (this.element || {})[fctName];
		fct && fct.apply(this.element, args);
	}
	
	DailymotionPlayer.prototype.safeClientCall = function(fctName, p1, p2) {
		try {
			return this.eventHandlers[fctName] && this.eventHandlers[fctName](p1, p2);
		}
		catch(e) {
			console.log("DM safeclientcall error", e, e.stack);
		}
	}

	DailymotionPlayer.prototype.embed = function (vars) {
		this.embedVars = vars = vars || {};
		this.embedVars.playerId = this.embedVars.playerId || 'dmplayer';
		this.trackInfo = {};
		this.element = document.createElement("object");
		this.element.id = this.embedVars.playerId;

		this.holder = document.createElement("div");
		this.holder.id = "genericholder";
		this.holder.appendChild(this.element);
		this.embedVars.playerContainer.appendChild(this.holder);

		var params = {
			allowScriptAccess: "always"
		};

		var atts = {
			id: this.embedVars.playerId
		};

		var swfParams = {
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

		var paramsQS = Object.keys(swfParams).map(function(k){ // query string
			return k + "=" + encodeURIComponent(swfParams[k]);
		}).join("&");

		var paramsHTML = Object.keys(params).map(function(k){
			return '<param name="' + k +'" value="' + encodeURIComponent(params[k]) + '">';
		}).join();

		var embedAttrs = {
			id: this.embedVars.playerId,
			width: this.embedVars.height || '200',
			height: this.embedVars.width || '200',
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

	DailymotionPlayer.prototype.getEid = function(url, cb) {
		cb((url.match(regex) || []).pop(), this);
	}

	DailymotionPlayer.prototype.play = function(id) {
		if (!this.currentId || this.currentId != id) {
			this.embedVars.videoId = id;
			this.embed(this.embedVars);
		}
	}

	DailymotionPlayer.prototype.pause = function(vol) {
		//this.element.pauseVideo();
		this.safeCall("pauseVideo");
	};

	DailymotionPlayer.prototype.resume = function(vol) {
		//this.element.playVideo();
		this.safeCall("playVideo");
	};
	
	/*DailymotionPlayer.prototype.stop = function(vol) {
		//this.element.stopVideo();
		this.safeCall("clearVideo");
	};*/
	
	DailymotionPlayer.prototype.getTrackPosition = function(callback) {
		var time = this.element.getCurrentTime();
		/**/this.trackInfo.duration = this.element.getDuration();
		//console.log("DM time & duration", time, this.trackInfo.duration);
		callback && callback(this.element.getCurrentTime());
	};
	
	DailymotionPlayer.prototype.setTrackPosition = function(pos) {
		//this.element.seekTo(pos);
		this.safeCall("seekTo", pos);
	};
	
	DailymotionPlayer.prototype.setVolume = function(vol) {
		//(this.element||{}).setVolume && this.element.setVolume(vol * 100);
		this.safeCall("setVolume", vol * 100);
	};

	return DailymotionPlayer;
})();