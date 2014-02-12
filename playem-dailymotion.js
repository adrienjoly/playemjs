function DailymotionPlayer(){
	return DailymotionPlayer.super_.apply(this, arguments);
}

(function() {

	var regex = /https?:\/\/(?:www\.)?dailymotion.com(?:\/embed)?\/video\/([\w-]+)/,
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
			console.log("DM new state", newState);
			that.safeClientCall(EVENT_MAP[newState], that);
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
			console.log("DM AD START");
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
		that.safeClientCall("onApiLoaded", that);
		that.safeClientCall("onApiReady", that);
	}
	
	Player.prototype.safeCall = function(fctName, p1, p2) {
		//return (this.element || {})[fctName] && this.element[fctName](p1, p2);
		var args = Array.apply(null, arguments).slice(1), // exclude first arg (fctName)
			fct = (this.element || {})[fctName];
		fct && fct.apply(this.element, args);
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

		this.holder = document.createElement("div");
		this.holder.id = "genericholder";
		this.holder.appendChild(this.element);
		this.embedVars.playerContainer.appendChild(this.holder);

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

	Player.prototype.getEid = function(url, cb) {
		cb((url.match(regex) || []).pop(), this);
	}

	Player.prototype.play = function(id) {
		if (!this.currentId || this.currentId != id) {
			this.embedVars.videoId = id;
			this.embed(this.embedVars);
		}
	}

	Player.prototype.pause = function(vol) {
		//this.element.pauseVideo();
		this.safeCall("pauseVideo");
	};

	Player.prototype.resume = function(vol) {
		//this.element.playVideo();
		this.safeCall("playVideo");
	};
	
	/*Player.prototype.stop = function(vol) {
		//this.element.stopVideo();
		this.safeCall("clearVideo");
	};*/
	
	Player.prototype.getTrackPosition = function(callback) {
		this.trackInfo.duration = this.element.getDuration();
		callback && callback(this.element.getCurrentTime());
	};
	
	Player.prototype.setTrackPosition = function(pos) {
		//this.element.seekTo(pos);
		this.safeCall("seekTo", pos);
	};
	
	Player.prototype.setVolume = function(vol) {
		//(this.element||{}).setVolume && this.element.setVolume(vol * 100);
		this.safeCall("setVolume", vol * 100);
	};

	//return Player;
	//inherits(DailymotionPlayer, Player);
	DailymotionPlayer.prototype = Player.prototype;
	DailymotionPlayer.super_ = Player;
})();
