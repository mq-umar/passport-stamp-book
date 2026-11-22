/* Service worker: keeps the app shell (pages, styles, scripts, icon) so the book opens offline after the first visit.
 * It never touches /api, so sign-in and card data are never stored by it. */
"use strict";
var CACHE = "passport-shell-v1";
var SHELL = ["./", "index.html", "css/tokens.css", "css/book.css", "css/stamps.css", "js/data.js", "js/rules.js",
  "js/stamps-art.js", "js/store.js", "js/views.js", "js/main.js", "icon.svg", "manifest.webmanifest"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// Shell files: answer from cache, refresh the cache in the background. Everything else, including /api, goes to the network untouched.
self.addEventListener("fetch", function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.indexOf("/api/") === 0) return;
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(req, { ignoreSearch: true }).then(function (hit) {
      var fresh = fetch(req).then(function (res) { if (res && res.ok) c.put(req, res.clone()); return res; }).catch(function () { return hit; });
      return hit || fresh;
    });
  }));
});
