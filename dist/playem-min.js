/* playemjs 1.0.0, commit: f0fc497fb2bdca23fd3a6095e320d1529efaea6d */ 
var DEFAULT_PLAY_TIMEOUT=10000;window.$=window.$||function(){return window.$};if(undefined==window.console){window.console={log:function(){}}}function Loader(){var d={loaded:true,complete:true,4:true};var b=document.getElementsByTagName("head")[0];var c={};var a=0;return{loadJSON:function(h,f){var g=new window.XMLHttpRequest();g.onload=function(){var j=g.responseText;try{j=JSON.parse(j)}catch(k){}f(j)};g.open("GET",h,true);g.send()},includeJS:function(k,f){var j,g;if(c[k]){if(f){g=setInterval(function(){if(c[k]){return console.log("still loading",k,"...")}clearInterval(g);f()},50)}return}c[k]=true;j=document.createElement("script");j.onload=function(){if(!c[k]){return}delete c[k];f&&setTimeout(f,1);delete j.onload};j.onerror=function(l){l.preventDefault();j.onload(l)};j.onreadystatechange=function(){if(!j.readyState||d[j.readyState]){j.onload()}};try{j.src=k;b.appendChild(j)}catch(h){console.error("Error while including",k,h);f(h)}},loadJSONP:function(g,f){var h="__loadjsonp__"+(a++);window[h]=function(){f.apply(window,arguments);delete window[h]};this.includeJS(g+(g.indexOf("?")==-1?"?":"&")+"callback="+h,function(){setTimeout(window[h],10)})}}}window.loader=new Loader();function EventEmitter(){this._eventListeners={}}EventEmitter.prototype.on=function(a,b){this._eventListeners[a]=(this._eventListeners[a]||[]).concat(b)};EventEmitter.prototype.emit=function(a){var c;var b=Array.prototype.slice.call(arguments,1);var d=this._eventListeners[a];for(c in d){d[c].apply(null,b)}};function inherits(b,a){b.super_=a;b.prototype=Object.create(a.prototype,{constructor:{value:b,enumerable:false,writable:true,configurable:true}})}function Playem(b){function a(u){EventEmitter.call(this);u=u||{};u.loop=u.hasOwnProperty("loop")?u.loop:true;u.playTimeoutMs=u.playTimeoutMs||DEFAULT_PLAY_TIMEOUT;var d=[];var y;var z;var n=null;var f=[];var o=null;var s=0;var k=null;var l=this;var g=null;var x=1;this.setPref=function(A,B){u[A]=B};function h(C,B){var A=null;function D(){if(C.isReady&&A){clearInterval(A);B()}else{console.warn("PLAYEM waiting for",C.label,"...")}}if(C.isReady){setTimeout(B)}else{A=setInterval(D,1000)}}function v(C,B){var A={index:f.length,metadata:C||{}};if(B){A.url=B}f.push(A);return A}function t(D,C,B){if(D){var A=v(B);A.trackId=D;A.player=C;A.playerName=C.label.replace(/ /g,"_");return A}else{throw new Error("no id provided")}}function c(E,C){var D=0;var B;var A;for(B=0;B<d.length;B++){A=d[B];if(typeof A.searchTracks==="function"){D++;A.searchTracks(E,5,function(G){for(var F in G){C(G[F])}if(--D===0){C()}})}}}function q(A){x=A;r("setVolume",A)}function w(){if(k){clearInterval(k)}for(var A in d){if(d[A].stop){d[A].stop()}else{d[A].pause()}}try{window.soundManager.stopAll()}catch(B){console.error("playem tried to stop all soundManager sounds =>",B)}}function j(A){w();n=A;delete n.trackPosition;delete n.trackDuration;l.emit("onTrackChange",A);if(!A.player){return l.emit("onError",{code:"unrecognized_track",source:"Playem",track:A})}h(A.player,function(){r("play",A.trackId);q(x);if(n.index==f.length-1){l.emit("loadMore")}p(function(){console.warn("PLAYEM TIMEOUT");l.emit("onError",{code:"timeout",source:"Playem"})})})}function p(A){if(g){clearTimeout(g)}g=!A?null:setTimeout(A,u.playTimeoutMs)}function r(A,C){try{return n.player[A](C)}catch(B){console.warn("Player call error",A,B,B.stack)}}function m(B){var A={onApiReady:function(C){if(o&&C==o.player){o.fct()}if(--s==0){l.emit("onReady")}},onEmbedReady:function(C){q(x)},onBuffering:function(C){setTimeout(function(){p();l.emit("onBuffering")})},onPlaying:function(C){q(x);setTimeout(function(){l.emit("onPlay")},1);if(C.trackInfo&&C.trackInfo.duration){A.onTrackInfo({position:C.trackInfo.position||0,duration:C.trackInfo.duration})}if(k){clearInterval(k)}if(C.getTrackPosition){k=setInterval(function(){C.getTrackPosition(function(D){A.onTrackInfo({position:D,duration:C.trackInfo.duration||n.trackDuration})})},1000)}},onTrackInfo:function(C){if(n&&C){if(C.duration){n.trackDuration=C.duration;p()}if(C.position){n.trackPosition=C.position}}l.emit("onTrackInfo",n)},onPaused:function(C){p();if(k){clearInterval(k)}k=null},onEnded:function(C){w();l.emit("onEnd");B.next()},onError:function(D,C){console.error(D.label+" error:",((C||{}).exception||C||{}).stack||C);p();l.emit("onError",C)}};["onEmbedReady","onBuffering","onPlaying","onPaused","onEnded","onError"].map(function(C){var D=A[C];A[C]=function(F,E){if(n&&F==n.player){return D(F,E)}}});return A}z={addPlayer:function(A,C){s++;var B=new A(m(this,C),C);d.push(B);return B},getPlayers:function(){return d},getQueue:function(){return f},clearQueue:function(){f=[]},addTrackByUrl:function(B,D){var E,C,A;for(E=0;E<d.length;++E){C=d[E];A=C.getEid(B);if(A){return t(A,C,D)}}return v(D,B)},play:function(A){j(A!=undefined?f[A]:n||f[0])},pause:function(){r("pause");l.emit("onPause")},stop:w,resume:function(){r("resume")},next:function(){if(u.loop||n.index+1<f.length){j(f[(n.index+1)%f.length])}},prev:function(){j(f[(f.length+n.index-1)%f.length])},seekTo:function(A){if((n||{}).trackDuration){r("setTrackPosition",A*n.trackDuration)}},setVolume:q,searchTracks:c};for(y in z){this[y]=z[y]}}inherits(a,EventEmitter);return new a()}try{module.exports=Playem}catch(e){}function AudioFilePlayer(){return AudioFilePlayer.super_.apply(this,arguments)}(function(){var b={onplay:"onPlaying",onresume:"onPlaying",onpause:"onPaused",onstop:"onPaused",onfinish:"onEnded"};function a(g,c){this.label="Audio file";this.eventHandlers=g||{};this.embedVars=c||{};this.element=null;this.widget=null;this.isReady=false;this.trackInfo={};var d,h,f=this;this.soundOptions={id:null,url:null,autoLoad:true,autoPlay:true,ontimeout:function(j){f.eventHandlers.onError&&f.eventHandlers.onError(f,{code:"timeout",source:"AudioFilePlayer"})}};for(d in b){(function(j){f.soundOptions[j]=function(){var k=g[b[j]];k&&k(f)}})(d)}h=setInterval(function(){try{if(window.soundManager){clearInterval(h);f.isReady=true;g.onApiReady&&g.onApiReady(f)}}catch(j){f.eventHandlers.onError&&f.eventHandlers.onError(f,{source:"AudioFilePlayer",exception:j})}},200)}a.prototype.getEid=function(c){c=(c||"").split("#").pop();if(!c){return null}var d=c.split("?")[0].split(".").pop().toLowerCase();return(d=="mp3"||d=="ogg")?c.replace(/^\/fi\//,""):null};a.prototype.fetchMetadata=function(d,c){d=this.getEid(d);if(!d){return c()}c({id:d.replace(/^\/fi\//,""),title:d.split("/").pop().split("?")[0]})};a.prototype.getTrackInfo=function(f){var d=this,c=setInterval(function(){if(d.widget&&d.widget.duration){clearInterval(c);f(d.trackInfo={duration:d.widget.duration/1000,position:d.widget.position/1000})}},500)};a.prototype.getTrackPosition=function(d){var c=this;this.getTrackInfo(function(){d(c.trackInfo.position);c.eventHandlers.onTrackInfo&&c.eventHandlers.onTrackInfo(c.trackInfo)})};a.prototype.setTrackPosition=function(c){this.widget&&this.widget.setPosition(Math.floor(Math.min(this.widget.duration,c*1000)-2000))};a.prototype.embed=function(c){if(!c||!c.trackId){return}this.embedVars=c=c||{};this.soundOptions.id=c.playerId=c.playerId||"mp3Player"+(new Date()).getTime();this.soundOptions.url=c.trackId.replace(/^\/fi\//,"");this.trackInfo={};if(this.widget){this.pause();this.widget=null;delete this.widget}this.widget=soundManager.createSound(this.soundOptions);this.eventHandlers.onEmbedReady&&this.eventHandlers.onEmbedReady(this);this.eventHandlers.onTrackInfo&&this.getTrackInfo(this.eventHandlers.onTrackInfo);this.play()};a.prototype.play=function(c){this.isReady&&this.embed({trackId:c})};a.prototype.resume=function(){this.isReady&&this.widget&&this.widget.resume()};a.prototype.pause=function(){try{this.isReady&&this.widget&&this.widget.pause()}catch(c){console.error(c.stack)}};a.prototype.stop=function(){this.widget&&this.widget.stop()};a.prototype.setVolume=function(c){if(this.widget&&this.widget.setVolume&&this.soundOptions){soundManager.setVolume(this.soundOptions.id,100*c)}};AudioFilePlayer.prototype=a.prototype;AudioFilePlayer.super_=a})();try{module.exports=AudioFilePlayer}catch(e){}window.$=window.$||function(){return window.$};$.getJSON=$.getJSON||function(b,a){var c="_cb_"+Date.now();b=b.replace("callback=?","callback="+c);window[c]=function(){a.apply(window,arguments);delete window[c]};loader.includeJS(b)};function BandcampPlayer(){return BandcampPlayer.super_.apply(this,arguments)}(function(k){var b="//api.bandcamp.com/api",f="&key="+k+"&callback=?";function c(l){return l.indexOf("/bc/")==0&&l.substr(4)}function g(m){var l=m.match(c(m)?(/\/bc\/([a-zA-Z0-9_\-]+)\/([a-zA-Z0-9_\-]+)/):/([a-zA-Z0-9_\-]+).bandcamp\.com\/track\/([a-zA-Z0-9_\-]+)/);return(l||[]).length===3&&l.slice(1)}function d(n){var m=g(n),l=n.split("#")[1];return m&&(m[0]+"/"+m[1]+(l?"#"+l:""))}function j(l){return l.indexOf("bandcamp.com/download/track")!=-1}function h(m,l){m="http://"+m.split("//").pop();$.getJSON(b+"/url/1/info?url="+encodeURIComponent(m)+f,function(n){var o=(n||{}).track_id;if(!o){return l(n)}$.getJSON(b+"/track/3/info?track_id="+o+f,function(p){l(null,(p||{}).streaming_url)})})}function a(m){var l=this,n=null;this.label="Bandcamp";this.eventHandlers=m||{};this.currentTrack={position:0,duration:0};this.sound=null;this.isReady=false;n=setInterval(function(){if(!!window.soundManager){clearInterval(n);l.isReady=true;l.clientCall("onApiReady",l)}},200)}a.prototype.clientCall=function(m,n){var l=Array.apply(null,arguments).slice(1);return(this.eventHandlers[m]||function(){}).apply(null,l)};a.prototype.soundCall=function(m,n){var l=Array.apply(null,arguments).slice(1);return((this.sound||{})[m]||function(){}).apply(null,l)};a.prototype.getEid=function(l){return c(l)||d(l)};a.prototype.fetchMetadata=function(n,l){var m=g(n);l(!m?null:{id:d(n),img:"//s0.bcbits.com/img/bclogo.png",title:m[0].replace(/[\-_]+/g," ")+" - "+m[1].replace(/[\-_]+/g," ")})};a.prototype.playStreamUrl=function(m){var l=this;if(!m){return l.clientCall("onError",l,{source:"BandcampPlayer",code:"no_stream"})}m="http://"+m.split("//").pop();l.sound=soundManager.createSound({id:"_playem_bc_"+Date.now(),url:m,autoLoad:true,autoPlay:true,whileplaying:function(){l.clientCall("onTrackInfo",l.currentTrack={position:l.sound.position/1000,duration:l.sound.duration/1000})},onplay:function(n){l.clientCall("onPlaying",l)},onresume:function(){l.clientCall("onPlaying",l)},onfinish:function(){l.clientCall("onEnded",l)}})};a.prototype.play=function(m){var l=this;if(j(m)){this.playStreamUrl(m)}else{h(m,function(o,n){if(o||!n){l.clientCall("onError",l,{source:"BandcampPlayer",error:(o||{}).error_message})}else{this.playStreamUrl(n)}})}};a.prototype.pause=function(){this.soundCall("pause")};a.prototype.stop=function(){this.soundCall("stop");this.soundCall("destruct");this.sound=null};a.prototype.resume=function(){this.soundCall("resume")};a.prototype.setTrackPosition=function(l){this.soundCall("setPosition",Math.round(l*1000))};a.prototype.setVolume=function(l){this.soundCall("setVolume",Math.round(l*100))};BandcampPlayer.prototype=a.prototype;BandcampPlayer.super_=a})("vatnajokull");try{module.exports=BandcampPlayer}catch(e){}function DailymotionPlayer(){return DailymotionPlayer.super_.apply(this,arguments)}(function(){var c=/(dailymotion.com(?:\/embed)?\/video\/|\/dm\/)([\w-]+)/,b=0;EVENT_MAP={0:"onEnded",1:"onPlaying",2:"onPaused"};function a(h,f){this.eventHandlers=h||{};this.embedVars=f||{};this.label="Dailymotion";this.element=null;this.isReady=false;this.trackInfo={};var g=this;window.onDailymotionStateChange=function(j){if(j>0||!b){g.safeClientCall(EVENT_MAP[j],g)}else{--b}};window.onDailymotionError=function(j){console.log("DM error",j);g.safeClientCall("onError",g,{source:"DailymotionPlayer",data:j})};window.onDailymotionAdStart=function(){g.safeClientCall("onBuffering",g)};window.onDailymotionPlayerReady=function(j){g.element=document.getElementById(j);g.element.addEventListener("onStateChange","onDailymotionStateChange");g.element.addEventListener("onError","onDailymotionError");g.element.addEventListener("onLinearAdStart","onDailymotionAdStart")};g.isReady=true;g.safeClientCall("onApiReady",g)}a.prototype.safeCall=function(h,k,j){var g=Array.apply(null,arguments).slice(1),f=(this.element||{})[h];return f&&f.apply(this.element,g)};a.prototype.safeClientCall=function(f,j,h){try{return this.eventHandlers[f]&&this.eventHandlers[f](j,h)}catch(g){console.error("DM safeclientcall error",g.stack)}};a.prototype.embed=function(k){this.embedVars=k=k||{};this.embedVars.playerId=this.embedVars.playerId||"dmplayer";this.trackInfo={};this.element=document.createElement("object");this.element.id=this.embedVars.playerId;this.embedVars.playerContainer.appendChild(this.element);var h,g,f,l={allowScriptAccess:"always"},m={id:this.embedVars.playerId},j={info:0,logo:0,related:0,autoplay:1,enableApi:1,showinfo:0,hideInfos:1,chromeless:1,withLoading:0,playerapiid:this.embedVars.playerId};h=Object.keys(j).map(function(n){return n+"="+encodeURIComponent(j[n])}).join("&");g=Object.keys(l).map(function(n){return'<param name="'+n+'" value="'+encodeURIComponent(l[n])+'">'}).join();f={id:this.embedVars.playerId,width:this.embedVars.width||"200",height:this.embedVars.height||"200",type:"application/x-shockwave-flash",data:window.location.protocol+"//www.dailymotion.com/swf/"+this.embedVars.videoId+"?"+h,innerHTML:g};$(this.element).attr(f);$(this.element).show();this.safeClientCall("onEmbedReady")};a.prototype.getEid=function(f){return c.test(f)&&RegExp.lastParen};function d(j,f){var g=encodeURIComponent("http://www.dailymotion.com/embed/video/"+j),h="dmCallback_"+j.replace(/[-\/]/g,"__");window[h]=function(k){f(!k||!k.title?null:{id:j,title:k.title,img:k.thumbnail_url})};loader.includeJS("//www.dailymotion.com/services/oembed?format=json&url="+g+"&callback="+h)}a.prototype.fetchMetadata=function(g,f){var h=this.getEid(g);if(!h){return f()}d(h,f)};a.prototype.play=function(f){if(!this.currentId||this.currentId!=f){this.embedVars.videoId=f;this.embed(this.embedVars)}};a.prototype.pause=function(f){this.safeCall("pauseVideo")};a.prototype.resume=function(f){this.safeCall("playVideo")};a.prototype.stop=function(f){++b;this.safeCall("clearVideo");if((this.element||{}).parentNode){this.element.parentNode.removeChild(this.element)}};a.prototype.getTrackPosition=function(f){this.trackInfo.duration=this.safeCall("getDuration");f&&f(this.safeCall("getCurrentTime"))};a.prototype.setTrackPosition=function(f){this.safeCall("seekTo",f)};a.prototype.setVolume=function(f){this.safeCall("setVolume",f*100)};DailymotionPlayer.prototype=a.prototype;DailymotionPlayer.super_=a})();try{module.exports=DailymotionPlayer}catch(e){}window.showMessage=window.showMessage||function(a){console.warn("[showMessage]",a)};window.$=window.$||function(){return window.$};$.getScript=$.getScript||function(b,a){loader.includeJS(b,a)};$.append=$.append||function(a){document.write(a)};function DeezerPlayer(){return DeezerPlayer.super_.apply(this,arguments)}(function(){var b="https://cdns-files.deezer.com/js/min/dz.js",g=false,h=/(deezer\.com\/track|\/dz)\/(\d+)/,c={player_play:"onPlaying",player_paused:"onPaused",track_end:"onEnded"};function a(m){var l=this;this.label="Deezer";this.eventHandlers=m||{};this.currentTrack={position:0,duration:0};d(function(){l.isReady=true;try{m.onApiReady(l)}catch(n){}})}a.prototype.isLogged=function(){return g};a.prototype.getEid=function(l){return h.test(l)&&RegExp.lastParen};function f(n,l){var m="dzCallback_"+n.replace(/[-\/]/g,"__");window[m]=function(o){delete window[m];l(!o||!o.album?null:{id:n,title:o.artist.name+" - "+o.title,img:o.album.cover})};loader.includeJS("//api.deezer.com/track/"+n+"?output=jsonp&callback="+m)}a.prototype.fetchMetadata=function(m,l){var n=this.getEid(m);if(!n){return l()}f(n,l)};a.prototype.play=function(m){var l=this;this.init(function(){if(g){DZ.player.playTracks([m],0)}else{DZ.api("/track/"+m,function(n){showMessage('This is a 30 secs preview. <a href="javascript:DeezerPlayer.login()">Connect to Deezer</a> to listen to the full track.');l.sound=j(l,n.preview)})}})};a.prototype.pause=function(){if(this.sound){this.sound.pause()}else{DZ.player.pause()}};a.prototype.stop=function(){console.log("DEEZER STOP");if(!this.isReady){return}if(this.sound){this.sound.stop();this.sound.destruct();this.sound=null}else{document.getElementById("dz-root").innerHTML=""}};a.prototype.resume=function(){if(this.sound){this.sound.resume()}else{DZ.player.play()}};a.prototype.setTrackPosition=function(l){if(this.sound){this.sound.setPosition(Math.round(l*1000))}else{DZ.player.seek(Math.round(100*l/this.currentTrack.duration))}};a.prototype.setVolume=function(l){if(this.sound){this.sound.setVolume(Math.round(l*100))}else{DZ.player.setVolume(Math.round(l*100))}};function d(m){var l;if(window.DZ){return m()}if(!document.getElementById("dz-root")){l=document.createElement("div");l.id="dz-root";document.getElementsByTagName("body")[0].appendChild(l)}loader.includeJS(b,m)}a.prototype.init=function(m){var l=this;DZ.init({appId:DEEZER_APP_ID,channelUrl:DEEZER_CHANNEL_URL,player:{onload:function(){if(window.location.protocol==="https:"){DZ.override_https()}DZ.getLoginStatus(function(n){g=n.userID;k(l);m.call(null,arguments)})}}})};function k(l){DZ.Event.subscribe("player_position",function(p){var s=l.eventHandlers.onTrackInfo,q=l.eventHandlers.onEnded,o=p[0],r=p[1];if(s){l.currentTrack={position:o,duration:r};s(l.currentTrack)}if((r-o<=1.5)&&q){q(l)}});function m(o){return function(){var p=l.eventHandlers[c[o]];p&&p(l)}}for(var n in c){DZ.Event.suscribe(n,m(n))}}function j(l,m){return soundManager.createSound({id:"deezerSound"+Date.now(),url:m,autoLoad:true,autoPlay:true,whileplaying:function(){if(l.sound){l.currentTrack={position:l.sound.position/1000,duration:l.sound.duration/1000}}if(l.eventHandlers.onTrackInfo){l.eventHandlers.onTrackInfo(l.currentTrack)}},onplay:function(){if(l.eventHandlers.onPlaying){l.eventHandlers.onPlaying(l)}},onresume:function(){if(l.eventHandlers.onPlaying){l.eventHandlers.onPlaying(l)}},onfinish:function(){if(l.eventHandlers.onEnded){l.eventHandlers.onEnded(l)}}})}DeezerPlayer.login=function(){DZ.login(function(l){if(l.userID){g=true;showMessage("Login successful. Your Deezer tracks will be full length from now on!")}else{showMessage("Deezer login unsuccesful.",true)}},{perms:"email"})};DeezerPlayer.prototype=a.prototype;DeezerPlayer.super_=a})();try{module.exports=DeezerPlayer}catch(e){}function JamendoPlayer(){return JamendoPlayer.super_.apply(this,arguments)}(function(){var c={onplay:"onPlaying",onresume:"onPlaying",onpause:"onPaused",onstop:"onPaused",onfinish:"onEnded"};function a(h,d){this.label="Jamendo track";this.eventHandlers=h||{};this.embedVars=d||{};this.element=null;this.widget=null;this.isReady=false;this.trackInfo={};var f,j,g=this;this.soundOptions={id:null,url:null,autoLoad:true,autoPlay:true,ontimeout:function(k){g.eventHandlers.onError&&g.eventHandlers.onError(g,{code:"timeout",source:"JamendoPlayer"})}};for(f in c){(function(k){g.soundOptions[k]=function(){var l=h[c[k]];l&&l(g)}})(f)}j=setInterval(function(){try{if(window.soundManager){clearInterval(j);g.isReady=true;h.onApiReady&&h.onApiReady(g)}}catch(k){g.eventHandlers.onError&&g.eventHandlers.onError(g,{source:"JamendoFilePlayer",exception:k})}},200)}a.prototype.getEid=function(d){return/jamendo.com\/.*track\/(\d+)/.test(d)||/\/ja\/(\d+)/.test(d)?RegExp.$1:null};function b(f,h,d){var g="jaCallback_"+h.replace(/[-\/]/g,"__");window[g]=function(j){delete window[g];d(!j||!j.results||!j.results.length?null:{id:j.results[0].id,img:j.results[0].album_image,title:j.results[0].artist_name+" - "+j.results[0].name})};loader.includeJS("//api.jamendo.com/v3.0/tracks?client_id="+JAMENDO_CLIENT_ID+"&id="+h+"&callback="+g)}a.prototype.fetchMetadata=function(f,d){var g=this.getEid(f);if(!g){return d()}b(f,g,d)};a.prototype.getTrackInfo=function(g){var f=this,d=setInterval(function(){if(f.widget&&f.widget.duration){clearInterval(d);g(f.trackInfo={duration:f.widget.duration/1000,position:f.widget.position/1000})}},500)};a.prototype.getTrackPosition=function(f){var d=this;this.getTrackInfo(function(){f(d.trackInfo.position);d.eventHandlers.onTrackInfo&&d.eventHandlers.onTrackInfo(d.trackInfo)})};a.prototype.setTrackPosition=function(d){this.widget&&this.widget.setPosition(Math.floor(Math.min(this.widget.duration,d*1000)-2000))};a.prototype.embed=function(d){if(!d||!d.trackId){return}this.embedVars=d=d||{};this.soundOptions.id=d.playerId=d.playerId||"mp3Player"+(new Date()).getTime();this.soundOptions.url="//api.jamendo.com/v3.0/tracks/file?client_id="+JAMENDO_CLIENT_ID+"&action=stream&audioformat=mp32&id="+d.trackId;this.trackInfo={};if(this.widget){this.pause();this.widget=null;delete this.widget}this.widget=soundManager.createSound(this.soundOptions);this.eventHandlers.onEmbedReady&&this.eventHandlers.onEmbedReady(this);this.eventHandlers.onTrackInfo&&this.getTrackInfo(this.eventHandlers.onTrackInfo);this.play()};a.prototype.play=function(d){this.isReady&&this.embed({trackId:d})};a.prototype.resume=function(){this.isReady&&this.widget&&this.widget.resume()};a.prototype.pause=function(){try{this.isReady&&this.widget&&this.widget.pause()}catch(d){console.error("jamendo error:",d,d.stack)}};a.prototype.stop=function(){this.widget&&this.widget.stop()};a.prototype.setVolume=function(d){if(this.widget&&this.widget.setVolume&&this.soundOptions){soundManager.setVolume(this.soundOptions.id,100*d)}};JamendoPlayer.prototype=a.prototype;JamendoPlayer.super_=a})();try{module.exports=JamendoPlayer}catch(e){}function SoundCloudPlayer(){return SoundCloudPlayer.super_.apply(this,arguments)}(function(){var h={onplay:"onPlaying",onresume:"onPlaying",onpause:"onPaused",onstop:"onPaused",onfinish:"onEnded"},f=["onerror","ontimeout","onfailure","ondataerror"],c="https://api.soundcloud.com/resolve.json";function b(l,j){this.label="SoundCloud";this.eventHandlers=l||{};this.embedVars=j||{};this.element=null;this.widget=null;this.isReady=false;this.trackInfo={};this.soundOptions={autoPlay:true};var k=this;this.callHandler=function(n,p){try{l[n]&&l[n](p)}catch(o){console.error("SC error:",o,o.stack)}};function m(){for(var n in h){(function(p){k.soundOptions[p]=function(){var q=l[h[p]];q&&q(k)}})(n)}f.map(function(p){k.soundOptions[p]=function(q){console.error("SC error:",p,q,q.stack);k.eventHandlers.onError&&k.eventHandlers.onError(k,{code:p.substr(2),source:"SoundCloudPlayer"})}});k.isReady=true;try{window.soundManager.onready(function(){k.callHandler("onApiReady",k)})}catch(o){console.warn("warning: soundManager was not found => playem-soundcloud will not be able to stream music");k.callHandler("onApiReady",k)}}if(window.SC){m()}else{loader.includeJS("https://connect.soundcloud.com/sdk.js",function(){window.SC.initialize({client_id:window.SOUNDCLOUD_CLIENT_ID});m()})}}b.prototype.safeCall=function(j,l){try{if(this.widget&&this.widget[j]){this.widget[j](l)}}catch(k){console.error("SC safecall error",k.stack)}};function d(j){return/(soundcloud\.com)\/player\/?\?.*url\=([^\&\?]+)/.test(j)?decodeURIComponent(RegExp.lastParen):j.replace(/^\/sc\//,"http://soundcloud.com/")}b.prototype.getEid=function(j){j=d(j);if(/(soundcloud\.com)(\/[\w-_\/]+)/.test(j)){var k=RegExp.lastParen.split("/");return k.length===3&&RegExp.lastParen}else{if(/snd\.sc\/([\w-_]+)/.test(j)){return RegExp.lastMatch}}};function a(m,k,j){function n(p,o){setTimeout(function(){if(window[p]){o(window[p])}else{n(p,o)}},200)}function l(o){o.title=o.title||o.name;return{eId:"/sc"+o.permalink_url.substr(o.permalink_url.indexOf("/",10))+"#"+o.uri,img:o.img||o.artwork_url||"/images/cover-soundcloud.jpg",url:o.url||o.permalink_url+"#"+o.uri,title:(o.title.indexOf(" - ")==-1?o.user.username+" - ":"")+o.title,playerLabel:"Soundcloud"}}n("SC",function(o){o.get("/tracks",{q:m,limit:k},function(q){if(q instanceof Array){var p=q.map(l);j(p)}})})}b.prototype.searchTracks=function(l,k,j){a(l,k,j)};function g(k,j){var o,m,l,n;k=d(k);o=k.split("?");m=o.length>1?o[1]+"&":"";l=/\/tracks\/(\d+)/.test(o[0])?RegExp.lastParen:null;n=(!!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/))?"loadJSONP":"loadJSON";if(l){loader[n]("https://api.soundcloud.com/tracks/"+l+".json?"+m+"client_id="+SOUNDCLOUD_CLIENT_ID,j)}else{loader[n](c+"?client_id="+SOUNDCLOUD_CLIENT_ID+"&url="+encodeURIComponent("http://"+k.replace(/^(https?\:)?\/\//,"")),j)}}b.prototype.fetchMetadata=function(k,j){var l={};if(!this.getEid(k)){return j()}g(k,function(m){if(m&&m.kind=="track"){l.id=""+m.id;l.eId="/sc/"+m.permalink_url.substr(m.permalink_url.indexOf("/",10)+1)+"#"+m.stream_url;l.img=m.artwork_url||l.img;l.title=m.title;if(l.title.indexOf(" - ")==-1&&(m.user||{}).username){l.title=m.user.username+" - "+l.title}}j(l)})};b.prototype.getTrackPosition=function(j){j(this.trackInfo.position=this.widget.position/1000);if(this.widget.durationEstimate){this.eventHandlers.onTrackInfo&&this.eventHandlers.onTrackInfo({duration:this.widget.duration/1000})}};b.prototype.setTrackPosition=function(j){this.safeCall("setPosition",j*1000)};b.prototype.play=function(l){this.trackInfo={};var k=this;function j(m){k.embedVars.trackId=m;window.SC.stream(m,k.soundOptions,function(n){k.widget=n;k.callHandler("onEmbedReady",k)})}if(l.indexOf("/tracks/")==0){return j(l)}l="http://"+(!l.indexOf("/")?"soundcloud.com":"")+l;g(l,function(m){j((m||{}).id)})};b.prototype.resume=function(){this.safeCall("play")};b.prototype.pause=function(){this.safeCall("pause")};b.prototype.stop=function(){this.safeCall("stop")};b.prototype.setVolume=function(j){this.safeCall("setVolume",100*j)};SoundCloudPlayer.prototype=b.prototype;SoundCloudPlayer.super_=b})();try{module.exports=SoundCloudPlayer}catch(e){}function SpotifyPlayer(){return SpotifyPlayer.super_.apply(this,arguments)}(function(){var b={onplay:"onPlaying",onresume:"onPlaying",onpause:"onPaused",onstop:"onPaused",onfinish:"onEnded"};function a(f,c){var d=this;this.label="Spotify track";this.eventHandlers=f||{};this.embedVars=c||{};this.widget=null;this.isReady=false;this.trackInfo={};this.soundOptions={id:null,url:null,autoLoad:true,autoPlay:true,ontimeout:function(g){f.onError&&f.onError(d,{code:"timeout",source:"SpotifyPlayer"})}};Object.keys(b).map(function(g){d.soundOptions[g]=function(){var h=f[b[g]];h&&h(d)}});window.soundManager.onready(function(){d.isReady=true;f.onApiReady&&f.onApiReady(d)})}a.prototype.getEid=function(c){return/spotify.com\/track\/(\w+)/.test(c)?RegExp.$1:null};a.prototype.getTrackInfo=function(f){var d=this,c=setInterval(function(){if(d.widget&&d.widget.duration){clearInterval(c);f(d.trackInfo={duration:d.widget.duration/1000,position:d.widget.position/1000})}},500)};a.prototype.getTrackPosition=function(d){var c=this;this.getTrackInfo(function(){d(c.trackInfo.position);c.eventHandlers.onTrackInfo&&c.eventHandlers.onTrackInfo(c.trackInfo)})};a.prototype.setTrackPosition=function(c){this.widget&&this.widget.setPosition(Math.floor(Math.min(this.widget.duration,c*1000)-2000))};a.prototype.embed=function(d){var c=this;if(!d||!d.trackId){return}this.embedVars=d=d||{};this.soundOptions.id=d.playerId=d.playerId||"mp3Player"+(new Date()).getTime();loader.loadJSON("https://api.spotify.com/v1/tracks/"+d.trackId,function(f){c.soundOptions.url=f.preview_url;c.trackInfo={};if(c.widget){c.pause();c.widget=null;delete c.widget}c.widget=soundManager.createSound(c.soundOptions);c.eventHandlers.onEmbedReady&&c.eventHandlers.onEmbedReady(c);c.eventHandlers.onTrackInfo&&c.getTrackInfo(c.eventHandlers.onTrackInfo);c.play()})};a.prototype.play=function(c){this.isReady&&this.embed({trackId:c})};a.prototype.resume=function(){this.isReady&&this.widget&&this.widget.resume()};a.prototype.pause=function(){try{this.isReady&&this.widget&&this.widget.pause()}catch(c){console.error("spotify error:",c,c.stack)}};a.prototype.stop=function(){this.widget&&this.widget.stop()};a.prototype.setVolume=function(c){if(this.widget&&this.widget.setVolume&&this.soundOptions){soundManager.setVolume(this.soundOptions.id,100*c)}};SpotifyPlayer.prototype=a.prototype;SpotifyPlayer.super_=a})();try{module.exports=SpotifyPlayer}catch(e){}function VimeoPlayer(){return VimeoPlayer.super_.apply(this,arguments)}(function(){var f={playProgress:function(g,h){g.trackInfo.position=Number(h.seconds);g.trackInfo.duration=Number(h.duration);g.eventHandlers.onPlaying&&g.eventHandlers.onPlaying(g);g.eventHandlers.onTrackInfo&&g.eventHandlers.onTrackInfo(g.trackInfo)},pause:"onPaused",finish:"onEnded"};function d(g){return Object.keys(g).map(function(h){return encodeURIComponent(h)+"="+encodeURIComponent(g[h])}).join("&")}function b(j){if(j.origin.indexOf("vimeo.com")==-1){return}try{var g=this,h={};if(j.data.charAt(0)==="{"){h=JSON.parse(j.data)}else{j.data.split("&").map(function(k){var l=k.split("=");h[l[0]]=l[1]})}h.params=(h.params||"").split(",");h.player_id=h.player_id||h.params.pop();if(h.player_id==this.embedVars.playerId){if(h.method=="onLoad"){Object.keys(f).map(this.post.bind(this,"addEventListener"))}else{setTimeout(function(){var k=g.eventHandlers[f[h.event]]||f[h.event];if(typeof k=="function"){k.apply(g,[g].concat(h.data))}else{console.warn("vimeo missing handler for event",h.method)}})}}}catch(j){console.log("VimeoPlayer error",j,j.stack);this.eventHandlers.onError&&this.eventHandlers.onError(this,{source:"VimeoPlayer",exception:j})}}function a(j,g){var h=this;this.label="Vimeo";this.element=null;this.eventHandlers=j||{};this.embedVars=g||{};this.isReady=false;this.trackInfo={};if(window.addEventListener){window.addEventListener("message",b.bind(this),false)}else{window.attachEvent("onmessage",b.bind(this),false)}h.isReady=true;j.onApiReady&&j.onApiReady(h)}a.prototype.post=function(j,h){var g={method:j};if(h){g.value=h}try{return this.element.contentWindow.postMessage(JSON.stringify(g),this.element.src.split("?")[0])}catch(k){console.log(k)}};a.prototype.getEid=function(g){return/(vimeo\.com\/(clip\:|video\/)?|\/vi\/)(\d+)/.test(g)&&RegExp.lastParen};function c(h,g){loader.loadJSON("https://vimeo.com/api/v2/video/"+h+".json",function(j){g(!j||!j.map?null:{id:h,title:j[0].title,img:j[0].thumbnail_medium})})}a.prototype.fetchMetadata=function(h,g){var j=this.getEid(h);if(!j){return g()}c(j,g)};a.prototype.setTrackPosition=function(g){this.pause();this.post("seekTo",g);this.resume()};a.prototype.embed=function(h){this.embedVars=h=h||{};this.embedVars.playerId=this.embedVars.playerId||"viplayer";this.trackInfo={};this.element=document.createElement("iframe");var g={id:this.embedVars.playerId,width:this.embedVars.width||"200",height:this.embedVars.height||"200",frameborder:"0",webkitAllowFullScreen:true,mozallowfullscreen:true,allowScriptAccess:"always",allowFullScreen:true,allow:"autoplay; encrypted-media",src:"https://player.vimeo.com/video/"+h.videoId+"?"+d({api:1,js_api:1,player_id:this.embedVars.playerId,title:0,byline:0,portrait:0,autoplay:1})};for(i in g){this.element.setAttribute(i,g[i])}this.embedVars.playerContainer.innerHTML="";this.embedVars.playerContainer.appendChild(this.element);if(this.eventHandlers.onEmbedReady){this.eventHandlers.onEmbedReady()}};a.prototype.play=function(g){if(g&&(!this.currentId||this.currentId!=g)){this.embedVars.videoId=g;this.embed(this.embedVars)}};a.prototype.resume=function(){this.post("play")};a.prototype.pause=function(){this.post("pause")};a.prototype.stop=function(){if(this.element){this.post("unload")}if((this.element||{}).parentNode){this.element.parentNode.removeChild(this.element)}if((this.otherElement||{}).parentNode){this.otherElement.parentNode.removeChild(this.otherElement)}};a.prototype.setVolume=function(g){this.post("setVolume",100*g)};VimeoPlayer.prototype=a.prototype;VimeoPlayer.super_=a})();try{module.exports=VimeoPlayer}catch(e){}window.$=window.$||function(){return window.$};$.show=$.show||function(){return $};$.attr=$.attr||function(){return $};$.getScript=$.getScript||function(b,a){loader.includeJS(b,a)};function YoutubePlayer(){return YoutubePlayer.super_.apply(this,arguments)}(function(){var g={0:"onEnded",1:"onPlaying",2:"onPaused"},f="https://apis.google.com/js/client.js?onload=initYT",l=false,m="https://www.youtube.com/iframe_api",k=false,h="https://www.youtube.com/watch?v=",d=false,a={width:"200",height:"200",playerVars:{autoplay:1,version:3,enablejsapi:1,controls:0,modestbranding:1,showinfo:0,wmode:"opaque",iv_load_policy:3,allowscriptaccess:"always"}};function o(p){setTimeout(function(){if(f&&d&&k){p()}else{o(p)}},200)}window.onYouTubeIframeAPIReady=function(){k=true};window.initYT=function(){gapi.client.setApiKey(YOUTUBE_API_KEY);gapi.client.load("youtube","v3",function(){d=true;$.getScript(m,function(){})})};if(!l){$.getScript(f,function(){l=true})}else{if(!d){window.initYT()}}function c(r,p){this.eventHandlers=r||{};this.embedVars=p||{};this.label="Youtube";this.isReady=false;this.trackInfo={};this.player={};var q=this;window.onYoutubeStateChange=function(t){if(t.data==YT.PlayerState.PLAYING){q.trackInfo.duration=q.player.getDuration()}var s=g[t.data];if(s&&q.eventHandlers[s]){q.eventHandlers[s](q)}};window.onYoutubeError=function(s){r.onError&&r.onError(q,{source:"YoutubePlayer",code:s})};o(function(){q.isReady=true;if(q.eventHandlers.onApiReady){q.eventHandlers.onApiReady(q)}})}c.prototype.safeCall=function(r,t){try{var q=Array.apply(null,arguments).slice(1),p=(this.element||{})[r];p&&p.apply(this.element,q)}catch(s){console.error("YT safecall error",s,s.stack)}};c.prototype.safeClientCall=function(p,r){try{if(this.eventHandlers[p]){this.eventHandlers[p](r)}}catch(q){console.error("YT safeclientcall error",q.stack)}};c.prototype.embed=function(q){this.embedVars=q=q||{};this.embedVars.playerId=this.embedVars.playerId||"ytplayer";this.trackInfo={};this.embedVars.playerContainer.innerHTML="";this.element=document.createElement("div");this.element.id=this.embedVars.playerId;this.embedVars.playerContainer.appendChild(this.element);$(this.element).show();var p=this;p.player=new YT.Player(p.embedVars.playerId||"ytplayer",a);p.player.addEventListener("onStateChange","onYoutubeStateChange");p.player.addEventListener("onError","onYoutubeError");p.element=p.player.getIframe();p.player.addEventListener("onReady",function(r){p.safeClientCall("onEmbedReady");p.player.loadVideoById(p.embedVars.videoId)})};c.prototype.getEid=function(p){if(/(youtube\.com\/(v\/|embed\/|(?:.*)?[\?\&]v=)|youtu\.be\/)([a-zA-Z0-9_\-]+)/.test(p)||/^\/yt\/([a-zA-Z0-9_\-]+)/.test(p)||/youtube\.com\/attribution_link\?.*v\%3D([^ \%]+)/.test(p)||/youtube.googleapis.com\/v\/([a-zA-Z0-9_\-]+)/.test(p)){return RegExp.lastParen}};function b(s,q,p){function r(t){var u=(typeof(t.id)!=="string")?t.id.videoId:t.id;return{id:u,eId:"/yt/"+u,img:t.snippet.thumbnails["default"].url,url:h+u,title:t.snippet.title,playerLabel:"Youtube"}}if(!p){return}o(function(){if(q!==1){gapi.client.youtube.search.list({part:"snippet",q:h+s,type:"video",maxResults:q}).execute(function(t){if(t.error){throw t.error}results=t.items.map(r);p(results)})}else{gapi.client.youtube.videos.list({id:s,part:"snippet,contentDetails,statistics"}).execute(function(t){if(t.error){throw t.error}results=t.items.map(r);p(results)})}})}c.prototype.searchTracks=function(r,q,p){b(r,q,p)};function j(q,p){b(q,1,function(r){p(r[0])})}c.prototype.fetchMetadata=function(q,p){var r=this.getEid(q);if(!r){return p()}else{j(r,p)}};function n(p){return/([a-zA-Z0-9_\-]+)/.test(p)&&RegExp.lastParen}c.prototype.play=function(p){p=n(p);if(!this.currentId||this.currentId!=p){this.embedVars.videoId=p;this.embed(this.embedVars)}};c.prototype.pause=function(){if(this.player&&this.player.pauseVideo){this.player.pauseVideo()}};c.prototype.resume=function(){if(this.player&&this.player.playVideo){this.player.playVideo()}};c.prototype.stop=function(){try{this.player.stopVideo()}catch(p){}};c.prototype.getTrackPosition=function(p){if(p&&this.player&&this.player.getCurrentTime){p(this.player.getCurrentTime())}};c.prototype.setTrackPosition=function(p){if(this.player&&this.player.seekTo){this.player.seekTo(p)}};c.prototype.setVolume=function(p){if(this.player&&this.player.setVolume){this.player.setVolume(p*100)}};YoutubePlayer.prototype=c.prototype;YoutubePlayer.super_=c})();try{module.exports=YoutubePlayer}catch(e){};