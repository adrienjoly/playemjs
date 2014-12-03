/**
 * tests for playemjs
 * @author adrienjoly
 **/

 var PlayemWrapper = new (function(){
	window.SOUNDCLOUD_CLIENT_ID = "9d5bbaf9df494a4c23475d9fde1f69b4";
	window.DEEZER_APP_ID = 125765;
	window.DEEZER_CHANNEL_URL = window.location.href.substr(0, window.location.href.indexOf("/", 10)) + "/lib/deezer-channel.html";
	window.JAMENDO_CLIENT_ID = "c9cb2a0a";	
	var PLAY_TIMEOUT = 6000,
		timeout,
		opts = { playerContainer: document.getElementById("videocontainer") },
		players = [ // defined in /js/playem-all.js (loaded in index.html)
			new YoutubePlayer({}, opts),
			new SoundCloudPlayer({}),
			new VimeoPlayer({}, opts),
			new DailymotionPlayer({}, opts),
			new JamendoPlayer({}),
			new BandcampPlayer({}),
			new AudioFilePlayer({}),
		];
	function reset(){
		clearTimeout(timeout);
		for (var i in players) {
			var player = players[i];
			delete player.eventHandlers.onError;
			delete player.eventHandlers.onPlaying;
		}
	}
	function getPlayer(url){
		for (var i in players) {
			var player = players[i];
			var eId = player.getEid(url);
			if (eId)
				return player;
		}
	}
	this.detect = function(url, cb){
		var player = getPlayer(url);
		cb(player && player.getEid(url));
	};
	this.fetch = function(url, cb){
		var player = getPlayer(url);
		if (!player || !player.fetchMetadata)
			return cb();
		player.fetchMetadata(url, function(track){
			cb((track || {}).id);
		});
	};
	this.play = function(url, cb){
		reset();
		var player = getPlayer(url);
		var id = player && player.getEid(url);
		if (!id)
			return cb();
		var streamUrlPos = url.indexOf("#") + 1;
		if (streamUrlPos)
			id += "#" + url.substr(streamUrlPos);
		player.eventHandlers.onPlaying = function(player){
			reset();
			player.setTrackPosition(20);
			setTimeout(function(){
				player.stop();
				cb(true);
			}, 1000);
		}
		player.eventHandlers.onError = function(player){
			reset();
			console.log(player ? "error" : "timeout");
			setTimeout(cb);
		}
		window.soundManager.onready(function(){
			timeout = setTimeout(player.eventHandlers.onError, PLAY_TIMEOUT);
			player.play(id);
		});
	};
})();

function readFileLines(fileUrl, cb){
	$.get(fileUrl, function(txt){
		cb(txt.split("\n"));
	});
}

function detectStream(url, detectors, handler){
	(function next(i){
		var detector = detectors[i];
		if (!detector)
			return handler(); // no more detectors to check for this url
		handler(i, 2); // loading (2)
		detector.fct(url, function(result){
			handler(i, 0 + !!result); // error (0) or ok (1)
			next(i + 1);
		});
	})(0);
}

function detectStreams(urls, detectors, handler){
	(function nextUrl(i){
		if (i == urls.length)
			return handler();
		var url = urls[i].length && urls[i][0] != "#" && urls[i].split(/\s/)[0];
		if (!url)
			nextUrl(i + 1);
		else {
			console.info("url:", url);
			//handler(i, detectorIndex, 1); // loading
			detectStream(url, detectors, function(detectorIndex, state){
				//handler(i, detectorIndex, 0); // clear
				if (arguments.length)
					handler(i, detectorIndex, state);
				else
					nextUrl(i + 1);
			});
		}
	})(0);
}

function HtmlTable(id, rows, columns){
	var table = document.getElementById(id);
	table.innerHTML = Array.apply(null, Array(rows)).map(function(){
		return "<tr>" + Array.apply(null, Array(columns)).map(function(){
			return "<td></td>";
		}).join("") + "</tr>";
	}).join("");
	this.getCell = function(row, col){
		return table.getElementsByTagName("td")[arguments.length == 2 ? row * columns + col : row];
	}
}

(function(){
	var detectors = [
		{ name: "getEid()",
		  fct: PlayemWrapper.detect
		},
		{ name: "fetchMetadata()",
		  fct: PlayemWrapper.fetch
		},
		{ name: "play()",
		  fct: PlayemWrapper.play
		},
	];
	readFileLines("urls.txt", function parseFileLines(lines){
		var urls = 0;
		for(var i in lines)
			urls += (lines[i].length && lines[i][0] != "#");
		console.log("read", urls, "stream URLs from urls.txt");
		// table and headers
		var table = new HtmlTable("results", lines.length + 1, detectors.length + 1);
		[{name:"URL"}].concat(detectors).map(function(col, i){
			table.getCell(0, i).innerHTML = "<p style='background:lightgray;'>" + col.name;
		});
		lines.map(function(url, i){
			table.getCell(i + 1, 0).innerHTML = (url.charAt(0) == "#" ? "<b>" : "") + url;
		});
		// main process
		var SYMBOLS = ["&times;", "&check;", '<img src="loader.gif">'];
		detectStreams(lines, detectors, function(r, c, result){
			if (arguments.length)
				table.getCell(r + 1, c + 1).innerHTML = SYMBOLS[result];
			else
				console.log("done.");
		});
	});
})();
