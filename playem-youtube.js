window.$ = window.$ || function(){return window.$};
$.show = $.show || function(){return $};
$.attr = $.attr || function(){return $};
$.getScript = $.getScript || function(js,cb){loader.includeJS(js,cb);};

function YoutubePlayer(){
	return YoutubePlayer.super_.apply(this, arguments);
}

(function() {
	//includeJS("https://www.youtube.com/player_api");
	var EVENT_MAP = {
			/*YT.PlayerState.ENDED*/ 0: "onEnded",
			/*YT.PlayerState.PLAYING*/ 1: "onPlaying",
			/*YT.PlayerState.PAUSED*/ 2: "onPaused"
		};

    var SDK_URL = 'https://apis.google.com/js/client.js?onload=initYT',
        SDK_LOADED = false;

    var apiReady = false,
        part = 'id,snippet',
        callback;

    window.initYT = function() {
        gapi.client.setApiKey(YOUTUBE_API_KEY);
        gapi.client.load('youtube', 'v3', function() {
          apiReady = true;
          if (callback)
            callback();
        });
    };
 	
 	if (typeof YOUTUBE_API_KEY !== 'undefined') {
 		loadSDK();	
 	};

	function Player(eventHandlers, embedVars) {
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
			eventHandlers.onError && eventHandlers.onError(that, {source:"YoutubePlayer", code: error});
		}

		window.onYouTubePlayerReady = window.onYouTubePlayerAPIReady = function(playerId) {
			that.element = /*that.element ||*/ document.getElementById(playerId); /* ytplayer*/
			that.element.addEventListener("onStateChange", "onYoutubeStateChange");
			that.element.addEventListener("onError", "onYoutubeError");
		}

		that.isReady = true;
		if (that.eventHandlers.onApiReady)
			that.eventHandlers.onApiReady(that);
	}

	Player.prototype.safeCall = function(fctName, param) {
		try {
			var args = Array.apply(null, arguments).slice(1), // exclude first arg (fctName)
				fct = (this.element || {})[fctName];
			//console.log(fctName, args, this.element)
			fct && fct.apply(this.element, args);
		}
		catch(e) {
			console.error("YT safecall error", e, e.stack);
		}
	}

	Player.prototype.safeClientCall = function(fctName, param) {
		try {
			if (this.eventHandlers[fctName])
				this.eventHandlers[fctName](param);
		}
		catch(e) {
			console.error("YT safeclientcall error", e.stack);
		}
	}

	Player.prototype.embed = function (vars) {
		//console.log("youtube embed:", vars);
		this.embedVars = vars = vars || {};
		this.embedVars.playerId = this.embedVars.playerId || 'ytplayer';
		this.trackInfo = {};
		this.element = document.createElement("object");
		this.element.id = this.embedVars.playerId;
		this.embedVars.playerContainer.appendChild(this.element);

		var paramsQS, paramsHTML, embedAttrs, params = {
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

		paramsQS = Object.keys(params).map(function(k){ // query string
			return k + "=" + encodeURIComponent(params[k]);
		}).join("&");

		paramsHTML = Object.keys(params).map(function(k){
			return '<param name="' + k +'" value="' + encodeURIComponent(params[k]) + '">';
		}).join();

		embedAttrs = {
			id: this.embedVars.playerId,
			width: this.embedVars.width || '200',
			height: this.embedVars.height || '200',
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

	Player.prototype.getEid = function(url) {
		if (
			/(youtube\.com\/(v\/|embed\/|(?:.*)?[\?\&]v=)|youtu\.be\/)([a-zA-Z0-9_\-]+)/.test(url)
			|| /^\/yt\/([a-zA-Z0-9_\-]+)/.test(url)
			|| /youtube\.com\/attribution_link\?.*v\%3D([^ \%]+)/.test(url)
			|| /youtube.googleapis.com\/v\/([a-zA-Z0-9_\-]+)/.test(url)
		)
			return RegExp.lastParen;
	}


    function searchTracks(query, limit, cb){

		function waitFor(cb){
            setTimeout(function(){
                if (apiReady){
                    cb();
                }else{
                    waitFor(cb);
                }
            }, 200);
        }
        
        function translateResult(r){
        	var id = r.id.videoId;
        	var track = {
        		id : id,
                eId: "/yt/" + id,
                img: r.snippet.thumbnails["default"].url,
                url: "https://www.youtube.com/watch?v=" + r.id.videoId,
                title: r.snippet.title,
                playerLabel: 'Youtube'
            }
            return track;
        }

        if (!cb) return;
		waitFor(function(){
			gapi.client.youtube.search.list({
				part: 'snippet', 
				q: query,
				type : "video",
				maxResults : limit,
			}).execute(function(res){
				results = res.items.map(translateResult);
				cb(results);
			});  
		});
    }

    Player.prototype.searchTracks = function(query, limit, cb){
        searchTracks(query, limit, cb); 
    }


	function fetchMetadata(id, cb){
        searchTracks(id, 1, function(tracks) {
            cb(tracks[0]);
        });
	}


	Player.prototype.fetchMetadata = function(url, cb){
		var id = this.getEid(url);
		if (!id)
			return cb();
		else
			fetchMetadata(id, cb);
	}

	function cleanId(id){
		return /([a-zA-Z0-9_\-]+)/.test(id) && RegExp.lastParen;
	}

	Player.prototype.play = function(id) {
		id = cleanId(id);
		//console.log("PLAY -> YoutubePlayer", this.currentId, id);
		if (!this.currentId || this.currentId != id) {
			this.embedVars.videoId = id;
			this.embed(this.embedVars);
		}
	}

	Player.prototype.pause = function() {
		//console.log("PAUSE -> YoutubePlayer"/*, this.element, this.element && this.element.pauseVideo*/);
		if (this.element && this.element.pauseVideo)
			this.element.pauseVideo();
	}

	Player.prototype.resume = function() {
		//console.log("RESUME -> YoutubePlayer", this.element, this.element && this.element.playVideo);
		if (this.element && this.element.playVideo)
			this.element.playVideo();
	}
	
	Player.prototype.stop = function() {
		if (this.element && this.element.stopVideo)
			this.element.stopVideo();
		if (USE_SWFOBJECT)
			swfobject.removeSWF(this.embedVars.playerId);
	}
	
	Player.prototype.getTrackPosition = function(callback) {
		if (callback && this.element && this.element.getCurrentTime)
			callback(this.element.getCurrentTime());
	};
	
	Player.prototype.setTrackPosition = function(pos) {
		this.safeCall("seekTo", pos, true);
	};
	
	Player.prototype.setVolume = function(vol) {
		if (this.element && this.element.setVolume)
			this.element.setVolume(vol * 100);
	};

    //============================================================================  
    function loadSDK() {
        if (!SDK_LOADED) {
          $.getScript(SDK_URL, function() {
            SDK_LOADED = true;
          });
        } 
    }

	//return Player;
	//inherits(YoutubePlayer, Player);
	YoutubePlayer.prototype = Player.prototype;
	YoutubePlayer.super_ = Player;
})();
