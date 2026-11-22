/* State, persistence (localStorage) and optional sync with the mock backend. */
var Store = (function () {
  "use strict";
  var KEY = "passport-proto-v2";
  var API = location.protocol.indexOf("http") === 0;

  var DEFAULTS = function () {
    return {
      token: null, live: false, cache: null, msg: "", p: "maya", tab: "passport",
      opened: false, onboarded: false, obStep: 0,
      hidden: new Set(), refunded: new Set(), disputed: new Set(), seen: new Set(),
      types: { dining: false, domestic: false }, showNames: false, offline: false,
      events: [], title: {}, queue: [], notice: "", demoOpen: false, filter: "all", tripSel: "", q: "", reported: []
    };
  };
  var S = DEFAULTS();
  var STATIC_TX = {}; // the built-in transactions, restored on sign-out so live data never lingers
  Object.keys(PERSONAS).forEach(function (k) { STATIC_TX[k] = PERSONAS[k].tx; });
  var SETS = ["hidden", "refunded", "disputed", "seen"];
  var TRANSIENT = ["sheet", "msg", "notice", "q"]; // never persisted
  S.sheet = null;

  /** Accept a stored value only if it has the same type as the default (localStorage can be edited or corrupted). */
  function sameShape(key, def, v) {
    if (key === "token") return typeof v === "string";
    if (SETS.indexOf(key) >= 0) return false; // handled separately below
    if (Array.isArray(def)) return Array.isArray(v);
    if (def && typeof def === "object") return !!v && typeof v === "object" && !Array.isArray(v);
    if (def === null) return v === null || typeof v === "object";
    return typeof v === typeof def;
  }

  function load() {
    try {
      var j = JSON.parse(localStorage.getItem(KEY) || "null");
      if (j && typeof j === "object") {
        var d = DEFAULTS();
        Object.keys(d).forEach(function (k) { if (j[k] !== undefined && sameShape(k, d[k], j[k])) d[k] = j[k]; });
        SETS.forEach(function (k) { d[k] = new Set(Array.isArray(j[k]) ? j[k] : []); });
        d.sheet = null;
        S = d;
      }
    } catch (e) { /* corrupt storage: start fresh */ }
    if (S.cache && (!Array.isArray(S.cache.v) || typeof S.cache.at !== "string")) S.cache = null;
    S.queue = S.queue.filter(function (q) { return q && typeof q.p === "string" && typeof q.v === "string"; });
    if (!PERSONAS[S.p]) S.p = "maya";
    if (["passport", "trips", "settings"].indexOf(S.tab) < 0) S.tab = "passport";
    if (["all", "city", "state", "dining", "intl"].indexOf(S.filter) < 0) S.filter = "all";
    if (!S.types || typeof S.types.dining !== "boolean" || typeof S.types.domestic !== "boolean") S.types = { dining: false, domestic: false };
    return S;
  }

  function serialisable() {
    var o = {};
    Object.keys(S).forEach(function (k) { if (TRANSIENT.indexOf(k) < 0) o[k] = SETS.indexOf(k) >= 0 ? Array.from(S[k]) : S[k]; });
    return o;
  }

  var syncTimer;
  function sync() {
    if (!API || !S.token || S.offline) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(function () {
      if (!S.token) return;
      api("/api/prefs", { method: "PUT", body: JSON.stringify({
        types: S.types, hidden: Array.from(S.hidden), refunded: Array.from(S.refunded),
        disputed: Array.from(S.disputed), title: S.title
      }) }).catch(function () {});
    }, 200);
  }

  function save() {
    sync();
    try { localStorage.setItem(KEY, JSON.stringify(serialisable())); } catch (e) { /* quota or private mode */ }
  }

  function log(e, p) {
    var entry = { e: e }; if (p) Object.keys(p).forEach(function (k) { entry[k] = p[k]; });
    S.events.push(entry); S.events = S.events.slice(-50);
  }

  function api(path, opt) {
    opt = opt || {};
    var headers = { "content-type": "application/json" };
    if (S.token) headers.authorization = "Bearer " + S.token;
    return fetch(path, { method: opt.method || "GET", body: opt.body, headers: headers }).then(function (r) {
      if (r.status === 401) { S.token = null; var e = new Error("unauthorized"); e.code = 401; throw e; }
      return r.json();
    });
  }

  function validTxRow(t) {
    return t && typeof t.d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t.d) && typeof t.m === "string" && typeof t.amt === "number" &&
      typeof t.miles === "number" && typeof t.status === "string" && typeof t.city === "string" && typeof t.st === "string";
  }

  function loadTx() {
    if (!API || !S.token) return Promise.resolve();
    var persona = S.p, token = S.token; // the answer may arrive after the user has switched persona or signed out
    return api("/api/transactions?persona=" + encodeURIComponent(persona)).then(function (j) {
      if (S.p !== persona || S.token !== token) return;
      if (!Array.isArray(j.tx) || !j.tx.every(validTxRow)) throw new Error("bad feed");
      PERSONAS[persona].tx = j.tx; S.live = true;
    }).catch(function () { S.live = false; });
  }

  function loadPrefs() {
    if (!API || !S.token) return Promise.resolve();
    return api("/api/prefs").then(function (j) {
      if (j && j.types && Array.isArray(j.hidden) && Array.isArray(j.refunded) && Array.isArray(j.disputed)) {
        S.types = j.types; S.hidden = new Set(j.hidden); S.refunded = new Set(j.refunded);
        S.disputed = new Set(j.disputed); S.title = j.title || {};
        if (S.types.dining || S.types.domestic) S.onboarded = true;
      }
    }).catch(function () {});
  }

  function signOut() {
    clearTimeout(syncTimer);
    Object.keys(STATIC_TX).forEach(function (k) { PERSONAS[k].tx = STATIC_TX[k]; });
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    var d = DEFAULTS(); d.opened = S.opened; S = d; S.sheet = null;
  }

  return {
    API: API, get: function () { return S; }, load: load, save: save, log: log, api: api,
    loadTx: loadTx, loadPrefs: loadPrefs, signOut: signOut
  };
})();
