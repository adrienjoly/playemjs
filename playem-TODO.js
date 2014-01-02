// EventEmitter

function EventEmitter() {
	this._eventListeners = {};
}

EventEmitter.prototype.on = function(eventName, handler){
	this._eventListeners[eventName] = (this._eventListeners[eventName] || []).concat(handler);
}

EventEmitter.prototype.emit = function(eventName){
	var args = Array.prototype.slice.call(arguments, 1); // remove eventName from arguments, and make it an array
	var listeners = this._eventListeners[eventName];
	for (var i in listeners)
		listeners[i].apply(null, args);
}

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
