window.$ = window.$ || function(){return window.$};
$.show = $.show || function(){return $};
$.attr = $.attr || function(){return $};

YoutubePlayer = (function() {
	//includeJS("https://www.youtube.com/player_api", eventHandlers.onApiLoaded);
	var EVENT_MAP = {
		/*YT.PlayerState.ENDED*/ 0: "onEnded",
		/*YT.PlayerState.PLAYING*/ 1: "onPlaying",
		/*YT.PlayerState.PAUSED*/ 2: "onPaused"
	};

	function YoutubePlayer(eventHandlers, embedVars) {
		this.eventHandlers = eventHandlers || {};
		this.embedVars = embedVars || {};
		this.label = "Youtube";
		this.isReady = false;
		this.trackInfo = {};
		var that = this;

		window.onYoutubeStateChange = function(newState) {
			//console.log("YT state:", newState);
			if (newState == 1)
				that.trackInfo.duration = that.element.getDuration();
			var eventName = EVENT_MAP[newState];
			if (eventName && that.eventHandlers[eventName])
				that.eventHandlers[eventName](that);
		};

		window.onYoutubeError = function(error) {
			//console.log(that.embedVars.playerId + " error:", error);
			eventHandlers.onError && eventHandlers.onError(that, {source:"YoutubePlayer", data: error});
		}

		window.onYouTubePlayerReady = window.onYouTubePlayerAPIReady = function(playerId) {
			that.element = /*that.element ||*/ document.getElementById(playerId); /* ytplayer*/
			that.element.addEventListener("onStateChange", "onYoutubeStateChange");
			that.element.addEventListener("onError", "onYoutubeError");
		}

		that.isReady = true;
		if (that.eventHandlers.onApiLoaded)
			that.eventHandlers.onApiLoaded(that);
		if (that.eventHandlers.onApiReady)
			setTimeout(function() {that.eventHandlers.onApiReady(that);}, 500);
	}

	YoutubePlayer.prototype.safeCall = function(fctName, param) {
		try {
			this.element[fctName](param);
		}
		catch(e) {
			console.log("YT safecall error", e, e.stack);
		}
	}

	YoutubePlayer.prototype.safeClientCall = function(fctName, param) {
		try {
			if (this.eventHandlers[fctName])
				this.eventHandlers[fctName](param);
		}
		catch(e) {
			console.log("YT safeclientcall error", e, e.stack);
		}
	}

	YoutubePlayer.prototype.embed = function (vars) {
		//console.log("youtube embed:", vars);
		this.embedVars = vars = vars || {};
		this.embedVars.playerId = this.embedVars.playerId || 'ytplayer';
		this.trackInfo = {};
		this.element = document.createElement("object");
		this.element.id = this.embedVars.playerId;

		//this.embedVars.playerContainer.appendChild(this.element);
		this.holder = document.createElement("div");
		this.holder.id = "genericholder";
		this.holder.appendChild(this.element);
		this.embedVars.playerContainer.appendChild(this.holder);

		var params = {
			autoplay: 1,
			version: 3, 
			enablejsapi: 1,
			playerapiid: this.embedVars.playerId,
			controls: 0,
			modestbranding: 1,
			showinfo: 0,
			wmode: "opaque",
			iv_load_policy: 3, // remove annotations
			//allowFullScreen: "true",
			allowscriptaccess: "always",
			origin: this.embedVars.origin
		};

		var paramsQS = Object.keys(params).map(function(k){ // query string
			return k + "=" + encodeURIComponent(params[k]);
		}).join("&");

		var paramsHTML = Object.keys(params).map(function(k){
			return '<param name="' + k +'" value="' + encodeURIComponent(params[k]) + '">';
		}).join();

		var embedAttrs = {
			id: this.embedVars.playerId,
			width: this.embedVars.height || '200',
			height: this.embedVars.width || '200',
			type: "application/x-shockwave-flash",
			data: window.location.protocol+'//www.youtube.com/v/'+this.embedVars.videoId+'?'+paramsQS,
			innerHTML: paramsHTML
		};
		if (USE_SWFOBJECT) {
        	//swfobject.addDomLoadEvent(function(){console.log("swfobject is ready")});
			swfobject.embedSWF(embedAttrs.data, this.embedVars.playerId, embedAttrs.width, embedAttrs.height, "9.0.0", "/js/swfobject_expressInstall.swf", null, params);
		}
		else {
			$(this.element).attr(embedAttrs);
		}
		$(this.element).show();
		this.safeClientCall("onEmbedReady");
		//this.isReady = true;
	}

	YoutubePlayer.prototype.getEid = function(url, cb) {
		var regex = // /https?\:\/\/(?:www\.)?youtu(?:\.)?be(?:\.com)?\/(?:(?:.*)?[\?\&]v=|v\/|embed\/|\/)?([a-zA-Z0-9_\-]+)/; //^https?\:\/\/(?:www\.)?youtube\.com\/[a-z]+\/([a-zA-Z0-9\-_]+)/
			/(youtube\.com\/(v\/|embed\/|(?:.*)?[\?\&]v=)|youtu\.be\/)([a-zA-Z0-9_\-]+)/;
		//var matches = regex.exec(url);
		var matches = url.match(regex);
		cb(matches ? matches.pop() : null, this);
	}

	YoutubePlayer.prototype.play = function(id) {
		//console.log("PLAY -> YoutubePlayer", this.currentId, id);
		if (!this.currentId || this.currentId != id) {
			this.embedVars.videoId = id;
			this.embed(this.embedVars);
		}
	}

	YoutubePlayer.prototype.pause = function() {
		//console.log("PAUSE -> YoutubePlayer"/*, this.element, this.element && this.element.pauseVideo*/);
		if (this.element && this.element.pauseVideo)
			this.element.pauseVideo();
	}

	YoutubePlayer.prototype.resume = function() {
		//console.log("RESUME -> YoutubePlayer", this.element, this.element && this.element.playVideo);
		if (this.element && this.element.playVideo)
			this.element.playVideo();
	}
	
	YoutubePlayer.prototype.stop = function() {
		if (this.element && this.element.stopVideo)
			this.element.stopVideo();
		//$(this.element).remove();//.hide();
	}
	
	YoutubePlayer.prototype.getTrackPosition = function(callback) {
		if (callback && this.element && this.element.getCurrentTime)
			callback(this.element.getCurrentTime());
	};
	
	YoutubePlayer.prototype.setTrackPosition = function(pos) {
		if (this.element && this.element.seekTo)
			this.element.seekTo(pos, true);
	};
	
	YoutubePlayer.prototype.setVolume = function(vol) {
		if (this.element && this.element.setVolume)
			this.element.setVolume(vol * 100);
	};

	return YoutubePlayer;
})();
