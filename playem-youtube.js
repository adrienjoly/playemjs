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
        SDK_LOADED = false,
        PLAYER_API_SCRIPT = 'https://www.youtube.com/iframe_api',
		DEFAULT_PARAMS = {
						    width: '200',
						    height: '200',
						    playerVars: {
						      autoplay: 1,
						      version: 3, 
						      enablejsapi: 1,
						      controls: 0,
						      modestbranding: 1,
						      showinfo: 0,
						      wmode: "opaque",
						      iv_load_policy: 3,
						      allowscriptaccess: "always"
						    }
						  };

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
		this.player = {};
		var that = this;
		window.onYoutubeStateChange = function(newState) {
			if (newState.data == YT.PlayerState.PLAYING){
				that.trackInfo.duration = that.player.getDuration();
			}
			//console.log("------> YT newState:", newState, newState.data);

			var eventName = EVENT_MAP[newState.data];
			if (eventName && that.eventHandlers[eventName])
				that.eventHandlers[eventName](that);
		};

		window.onYoutubeError = function(error) {
			//console.log(that.embedVars.playerId + " error:", error);
			eventHandlers.onError && eventHandlers.onError(that, {source:"YoutubePlayer", code: error});
		}

		window.onYouTubeIframeAPIReady = function() {
			that.player = new YT.Player(that.embedVars.playerId || 'ytplayer', DEFAULT_PARAMS);
		 	that.player.addEventListener("onStateChange", "onYoutubeStateChange");
			that.player.addEventListener("onError", "onYoutubeError");
		    that.element = that.player.getIframe();
			that.player.addEventListener('onReady', function(event) {
				that.safeClientCall("onEmbedReady");
				that.player.loadVideoById(that.embedVars.videoId);				
			});
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
		this.embedVars = vars = vars || {};
		this.embedVars.playerId = this.embedVars.playerId || 'ytplayer';
		this.trackInfo = {};
		this.element = document.createElement("div");
		this.element.id = this.embedVars.playerId;
		this.embedVars.playerContainer.appendChild(this.element);
		$(this.element).show();
		var script = document.createElement('script');
	    script.src = PLAYER_API_SCRIPT;
	    document.body.appendChild(script);
	}

	Player.prototype.getEid = function(url) {
		if (
			/(youtube\.com\/(v\/|embed\/|(?:.*)?[\?\&]v=)|youtu\.be\/)([a-zA-Z0-9_\-]+)/.test(url)
			|| /\/yt\/([a-zA-Z0-9_\-]+)/.test(url)
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
		if (this.player && this.player.pauseVideo)
			this.player.pauseVideo();
	}

	Player.prototype.resume = function() {
		//console.log("RESUME -> YoutubePlayer", this.element, this.element && this.element.playVideo);
		if (this.player && this.player.playVideo)
			this.player.playVideo();
	}
	
	Player.prototype.stop = function() {
		if (this.player && this.player.stopVideo)
			this.player.stopVideo();
	}
	
	Player.prototype.getTrackPosition = function(callback) {
		if (callback && this.player && this.player.getCurrentTime)
			callback(this.player.getCurrentTime());
	};
	
	Player.prototype.setTrackPosition = function(pos) {
		this.safeCall("seekTo", pos, true);
	};
	
	Player.prototype.setVolume = function(vol) {
		if (this.player && this.player.setVolume)
			this.player.setVolume(vol * 100);
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
