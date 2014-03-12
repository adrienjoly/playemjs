function inheritEventEmitter(object) {
	var eventEmitter = new EventEmitter();
	for (var i in eventEmitter)
		object[i] = eventEmitter[i];
}

// TODO: use util.inherits() from node.js instead?
// usage: http://nodejs.org/docs/latest/api/util.html#util_util_inherits_constructor_superconstructor
// source: https://github.com/joyent/node/blob/6ecb0cd65d2f818a35adb80d23261555b63528ca/tools/blog/node_modules/glob/node_modules/inherits/inherits.js#L3

if (USE_SWFOBJECT && !window.swfobject)
	loader.includeJS("//ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js");
	// TODO: must be loaded before playem-youtube.js


// message handling

var messageHandlers = {};

function onMessageReceived(e) {
	//console.log("onMessageReceived", e.origin, e.data, e);
	for (var origin in messageHandlers)
		if (e.origin.indexOf(origin) != -1) {//(e.origin.match(regex))
			var data = e.data;
			try {data = JSON.parse(e.data);} catch (e) {console.log(e.stack);}
			messageHandlers[origin](data, e);
		}
}
if (window.addEventListener)
	window.addEventListener('message', onMessageReceived, false);
else
	window.attachEvent('onmessage', onMessageReceived, false);

// destruction of a player

				/*
				var iframe, holder = document.getElementById("genericholder");
				if (holder) {
					// make sure that IE really destroys the iframe embed
					iframe = holder.getElementsByTagName("iframe")[0];
					if (iframe)
						iframe.setAttribute("src", "");
					// make sure the holder is clean
					holder.innerHTML = "";
					holder.parentNode.removeChild(holder);
				}
				*/
				var iframe, player = ((currentTrack || {}).player || {}).element; // hmm, this is dirty...
				console.log("PLAYER", (currentTrack || {}).player)
				// destroy the player and its contents
				try {
					// make sure that IE really destroys the iframe embed
					if (iframe = player.parentNode.getElementsByTagName("iframe")[0])
						iframe.setAttribute("src", "");
				} catch(e) {
					console.error('1', e.stack)
				};
				try {
					["iframe", "object", "embed"].map(function(tagName){
						var i, elts = player.parentNode.getElementsByTagName(tagName);
						for (i=elts.length-1; i>=0; --i)
							player.parentNode.removeChild(elts[i]);
					});
				} catch(e) {
					console.error('2', e.stack)
				};
				try {
					player.innerHTML = "";
					player.parentNode.removeChild(player);
				} catch(e) {
					console.error('3', e.stack)
				};