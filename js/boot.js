/* Registers the offline service worker (only over http/https, never from file://). */
(function () {
  "use strict";
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) navigator.serviceWorker.register("sw.js").catch(function () { /* offline support is optional */ });
})();
