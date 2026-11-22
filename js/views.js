/* Rendering. Each view returns an HTML string; every dynamic value goes through esc(). */
var Views = (function () {
  "use strict";
  var R = Rules, esc = Art.esc;
  var TITLES = { passport: "Passport", trips: "Trips", settings: "Settings" };
  var NAV_ICON = {
    passport: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" aria-hidden="true"><rect x="5" y="3" width="14" height="18"/><circle cx="12" cy="10" r="3"/><path d="M9 16h6"/></svg>',
    trips: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" aria-hidden="true"><path d="M3 8h18v10H3z"/><path d="M3 12h18"/><path d="M9 8V5h6v3"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>'
  };

  function login() {
    return '<div class="login"><div class="eyebrow">Concept prototype</div><h1>Sign in</h1>' +
      '<p class="mute">Fake data only. Not affiliated with any card issuer.</p>' +
      '<form id="lf"><label for="lu">Username</label><input id="lu" autocomplete="username"><label for="lp">Password</label>' +
      '<input id="lp" type="password" autocomplete="current-password"><button class="p">Sign in</button>' +
      '<div role="alert" class="err" id="le"></div><small>Demo login: demo / demo</small></form></div>';
  }

  function cover() {
    return Art.DEFS + '<div class="cover">' + Art.CREST + '<h1>PASSPORT</h1><div class="sub">Stamp book</div>' +
      '<button id="open" data-open-book>Open passport</button>' +
      '<div class="fine">Concept prototype &middot; fake data &middot; not affiliated with any card issuer</div></div>';
  }

  function header(c) {
    var S = c.S, P = c.persona, v = c.visible;
    var states = new Set(v.filter(function (s) { return s.k === "state"; }).map(function (s) { return s.label; })).size;
    var cuis = new Set(v.filter(function (s) { return s.k === "dining"; }).map(function (s) { return s.label; })).size;
    var h = '<header class="top"><div class="bar"><div class="eyebrow">Passport &middot; No. ' + esc(P.docNo) + '</div>' +
      '<button class="link" data-close-book>Close book</button></div><h1>' + TITLES[S.tab] + '</h1>' +
      '<div class="holder">Holder <b>' + esc(P.holder) + '</b> &middot; ' + esc(P.role) + ' &middot; Issued 2026</div>';
    if (S.tab === "passport") {
      h += '<div class="mrz"><span>Stamps<b>' + v.length + '</b></span><span>' + (states === 1 ? "State" : "States") + '<b>' + states +
        '</b></span><span>' + (cuis === 1 ? "Cuisine" : "Cuisines") + '<b>' + cuis + '</b></span></div>';
    }
    return h + '</header>';
  }

  function typeSwitches(c, idSuffix) {
    var S = c.S, off = S.offline ? "disabled" : "";
    return '<div class="setting"><div><b>Dining stamps</b><small id="d1' + idSuffix + '">New cuisines and new-city meals</small></div>' +
      '<input type="checkbox" aria-describedby="d1' + idSuffix + '" aria-label="Dining stamps" ' + off + ' data-type="dining" ' + (S.types.dining ? "checked" : "") + '></div>' +
      '<div class="setting"><div><b>Domestic stamps</b><small id="d2' + idSuffix + '">Trips over ' + R.MIN_MILES + ' miles from ' + esc(R.HOME.name) + '</small></div>' +
      '<input type="checkbox" aria-describedby="d2' + idSuffix + '" aria-label="Domestic stamps" ' + off + ' data-type="domestic" ' + (S.types.domestic ? "checked" : "") + '></div>';
  }

  function onboarding(c) {
    var S = c.S, step = S.obStep, h = '<div class="ob panel"><div class="steps" aria-hidden="true">' +
      [0, 1, 2].map(function (i) { return '<i class="' + (i <= step ? "on" : "") + '"></i>'; }).join("") + '</div>';
    if (step === 0) {
      h += '<div class="eyebrow">Step 1 of 3</div><h2>A stamp book for the trips you actually take.</h2>' +
        '<p>Passport marks your card activity with stamps: a new city, a new state, a new cuisine. Not only the far-away trips.</p>' +
        '<div class="ghost" aria-hidden="true">Your first stamp goes here</div><button class="p" data-ob="1">Continue</button>';
    } else if (step === 1) {
      h += '<div class="eyebrow">Step 2 of 3</div><h2>Your privacy, in writing.</h2><ul>' +
        '<li>Stamps come only from posted card transactions.</li><li>No location tracking, ever.</li>' +
        '<li>Shared recaps never show amounts or card details. Restaurant names stay off unless you add them.</li></ul>' +
        '<div class="row"><button data-ob="0">Back</button><button class="p" data-ob="2">Continue</button></div>';
    } else {
      h += '<div class="eyebrow">Step 3 of 3</div><h2>Choose what to collect.</h2>' + typeSwitches(c, "ob") +
        '<div class="row" style="margin-top:16px"><button data-ob="1">Back</button><button class="p" data-ob-done>Start collecting</button></div>';
    }
    return h + '</div>';
  }

  function stampItem(s, i, c) {
    var S = c.S, j = Art.jitter(s.id), fresh = !S.seen.has(s.id);
    var name = R.displayName(s), label = R.KIND_LABEL[s.k] + " stamp, " + name + ", " + R.fd(s.sub);
    return '<li class="stamp k-' + s.k + (fresh ? " fresh" : "") + '" style="--r:' + j.r.toFixed(1) + 'deg;--dx:' + j.dx + 'px;--dy:' + j.dy + 'px">' +
      '<button class="hit" data-open="' + esc(s.id) + '" aria-label="Open ' + esc(label) + '">' + Art.stampSVG(s, "g" + i) + '<b class="vh">' + esc(s.label) + '</b></button>' +
      '<button class="hide" ' + (S.offline ? "disabled" : "") + ' data-hide="' + esc(s.id) + '" aria-label="Hide ' + esc(name) + ' stamp">Hide</button></li>';
  }

  function indexPages(c) {
    var v = c.visible;
    var states = {}, cuis = {};
    v.forEach(function (s) { if (s.k === "state") states[s.label] = 1; if (s.k === "dining") cuis[s.label] = 1; });
    var nS = R.STATES.filter(function (s) { return states[s[0]]; }).length, nC = R.CUISINES.filter(function (x) { return cuis[x]; }).length;
    return '<section class="index" aria-label="Collection index"><h2 class="sec">Index</h2>' +
      '<p class="count">States collected: ' + nS + ' of 50</p><ul class="idx">' + R.STATES.map(function (s) {
        var got = states[s[0]];
        return '<li class="' + (got ? "got" : "") + '" title="' + esc(s[1]) + '">' + s[0] + '<span class="vh">' + (got ? " collected" : " not yet") + '</span></li>';
      }).join("") + '</ul><p class="count" style="margin-top:14px">Cuisines collected: ' + nC + ' of ' + R.CUISINES.length + '</p><ul class="idx cui">' +
      R.CUISINES.map(function (x) { var got = cuis[x]; return '<li class="' + (got ? "got" : "") + '">' + esc(x) + '<span class="vh">' + (got ? " collected" : " not yet") + '</span></li>'; }).join("") + '</ul></section>';
  }

  function passport(c) {
    var S = c.S;
    if (!S.onboarded) return onboarding(c);
    var all = c.visible, q = S.q.trim().toLowerCase();
    var list = all.filter(function (s) {
      return (S.filter === "all" || s.k === S.filter) && (!q || (s.label + " " + R.displayName(s)).toLowerCase().indexOf(q) >= 0);
    });
    var h = '<div class="tools"><label class="field" for="q">Search stamps</label><input id="q" type="search" value="' + esc(S.q) + '" placeholder="Nashville, Tennessee, Southern" autocomplete="off">' +
      '<div class="tabs" role="group" aria-label="Filter by kind">' + [["all", "All"], ["city", "Cities"], ["state", "States"], ["dining", "Dining"], ["intl", "Abroad"]].map(function (f) {
        return '<button data-filter="' + f[0] + '" aria-pressed="' + (S.filter === f[0]) + '">' + f[1] + '</button>';
      }).join("") + '</div></div>';
    if (list.length) h += '<ul class="grid">' + list.map(function (s, i) { return stampItem(s, i, c); }).join("") + '</ul>';
    else if (all.length) h += '<div class="panel empty"><b>No matches</b>Try a different search or filter.</div>';
    else h += '<div class="panel empty"><b>No stamps yet</b>Turn on dining or domestic stamps in Settings to start collecting.<br><br><button class="p" data-tab="settings">Open settings</button></div>';
    var hc = c.all.filter(function (x) { return S.hidden.has(x.id); }).length;
    if (hc) h += '<p><button id="restore" ' + (S.offline ? "disabled" : "") + '>Restore ' + hc + ' hidden</button></p>';
    return h + indexPages(c);
  }

  function pass(c, r) {
    var S = c.S;
    return '<section class="pass" aria-label="Trip recap"><div class="pass-main"><div class="lbl">Boarding pass &middot; Trip recap</div>' +
      '<div class="route"><span class="code">' + esc(r.from) + '</span>' + Art.PLANE + '<span class="code">' + esc(r.to) + '</span></div>' +
      '<div class="places">' + esc(R.HOME.name) + ' to ' + esc(r.destCity) + '</div><h2>' + esc(r.title) + '</h2>' +
      '<dl class="fields"><div><dt>Dates</dt><dd>' + esc(r.dates) + '</dd></div><div><dt>Stamps</dt><dd><b>' + r.stamps.length + '</b></dd></div>' +
      '<div><dt>Meals</dt><dd><b>' + r.dining + '</b></dd></div></dl></div><div class="tear"></div>' +
      '<div class="pass-stub">' + Art.barcodeSVG(r.title + r.dates) + '<div class="no"><small>Doc no.</small>' + esc(Art.docNo(S.p, r)) + '</div></div></section>';
  }

  function trips(c) {
    var S = c.S, r = c.recap, h = "";
    if (!r) return '<div class="panel empty"><b>No trips yet</b>A trip appears when you spend far from home.</div>';
    var queued = S.queue.filter(function (q) { return q.p === S.p; }).pop();
    h += pass(c, r);
    h += '<div class="panel"><label class="field" for="rn">Recap name</label><div class="row"><input id="rn" value="' + esc(queued ? queued.v : r.title) + '"><button id="rnb">Save name</button></div>' +
      (S.queue.length ? '<div class="note" style="margin:10px 0 0">' + S.queue.length + ' edit(s) queued, will sync when you reconnect.</div>' : "") +
      '<h2 class="sec" style="margin-top:20px">Stamps on this trip</h2><ul class="names">' +
      (r.stamps.map(function (s) { return '<li>' + esc(R.displayName(s)) + '</li>'; }).join("") || '<li class="mute">none</li>') + '</ul>' +
      '<h2 class="sec">Share preview</h2><div class="preview"><b>' + esc(r.title) + '</b><br>' + esc(r.from) + ' to ' + esc(r.to) + ' &middot; ' + esc(r.dates) + '<br>' + r.dining + ' places' +
      (S.showNames ? ": " + esc(r.tx.filter(function (t) { return t.cat === "dining"; }).map(function (t) { return t.m; }).join(", ")) : "") +
      '<br><small>No amounts or card details are ever shared.</small></div>' +
      '<label class="check"><input type="checkbox" id="names" ' + (S.showNames ? "checked" : "") + '><span>Include restaurant names <small>(off by default)</small></span></label>' +
      '<div class="row" style="margin-top:12px"><button class="p" id="share">Share recap</button><button id="save">Save image</button></div>' +
      '<div role="status" aria-live="polite" id="msg" class="mute" style="margin-top:10px">' + esc(S.msg) + '</div></div>';
    h += '<h2 class="sec">Places</h2>' + R.groupByDay(r.tx).map(function (d) {
      return '<div class="day"><h3>' + esc(R.fdow(d.d)) + '</h3>' + d.items.map(function (t) {
        return '<div class="place"><b>' + esc(t.m) + '</b><span>' + esc(t.city) + (t.cuisine ? " &middot; " + esc(t.cuisine) : "") + '</span></div>';
      }).join("") + '</div>';
    }).join("");
    return h;
  }

  function settings(c) {
    var S = c.S;
    return '<div class="panel">' + typeSwitches(c, "st") +
      '<small>Country stamps for international spend are always on. Stamps are built only from posted card transactions; no device location is used.</small></div>' +
      '<div class="panel"><b>How stamps work</b><p class="mute" style="margin:6px 0 0">A stamp needs a posted purchase of at least $' + R.MIN_AMT +
      '. Refunded or disputed purchases never earn one. Nothing here uses your location.</p></div>';
  }

  function demo(c) {
    var S = c.S, off = S.offline ? "disabled" : "";
    var h = '<details class="demo" id="demo" ' + (S.demoOpen ? "open" : "") + '><summary>Demo controls</summary><div class="body">' +
      (Store.API ? '<div class="note" style="margin:0 0 8px">Live feed from mock backend ' + (S.live ? "connected" : "unavailable") + ' &middot; <button class="link" id="so">Sign out</button></div>' : "") +
      '<label class="line">Persona <select id="pers" ' + off + '>' + Object.keys(PERSONAS).map(function (k) {
        return '<option value="' + k + '" ' + (k === S.p ? "selected" : "") + '>' + esc(PERSONAS[k].name) + '</option>';
      }).join("") + '</select></label>' +
      '<label class="line">Simulate offline <input type="checkbox" id="off" ' + (S.offline ? "checked" : "") + '></label>' +
      '<h2 class="sec">Simulate card activity</h2>';
    h += c.persona.tx.map(function (t) {
      var K = R.txKey(S.p, t), bad = S.refunded.has(K) || S.disputed.has(K) || t.status !== "posted";
      var tag = S.refunded.has(K) ? '<span class="st bad">Refunded</span>' : S.disputed.has(K) ? '<span class="st bad">Disputed</span>' :
        t.status !== "posted" ? '<span class="st">Pending</span>' : '<span class="st ok">Posted</span>';
      return '<div class="tx ' + (bad ? "bad" : "") + '"><div><div class="m">' + esc(t.m) + '</div><div class="meta">' + tag + ' &middot; ' + esc(R.fd(t.d)) +
        (t.amt < R.MIN_AMT ? " &middot; below $" + R.MIN_AMT + " minimum" : "") + '</div></div><div class="amt">$' + Number(t.amt) + '</div>' +
        (t.status === "posted" ? '<div class="acts"><button ' + off + ' data-ref="' + esc(K) + '">' + (S.refunded.has(K) ? "Undo" : "Refund") + '</button><button ' + off +
          ' data-dis="' + esc(K) + '">' + (S.disputed.has(K) ? "Resolve" : "Dispute") + '</button></div>' : "") + '</div>';
    }).join("");
    return h + '<h2 class="sec">Event log</h2><div class="log" tabindex="0" role="region" aria-label="Event log">' +
      (S.events.slice(-12).map(function (e) { return esc(JSON.stringify(e)); }).join("<br>") || "none yet") + '</div></div></details>';
  }

  function sheet(c) {
    var S = c.S;
    if (!S.sheet) return "";
    var s = c.visible.filter(function (x) { return x.id === S.sheet; })[0];
    if (!s) return "";
    var trail = R.stampTrail(S.p, c.persona.tx, { refunded: S.refunded, disputed: S.disputed }, s);
    var name = R.displayName(s);
    return '<div class="scrim" data-close-sheet></div><div class="sheet k-' + s.k + '" role="dialog" aria-modal="true" aria-labelledby="sh-t">' +
      '<div class="stamp k-' + s.k + '">' + Art.stampSVG(s, "sheet").replace('class="art"', 'class="art big"') + '</div>' +
      '<h2 id="sh-t">' + esc(name) + '</h2><div class="when">' + esc(R.KIND_VERB[s.k]) + ' &middot; ' + esc(R.fd(s.sub)) + '</div>' +
      '<h2 class="sec">Earned by</h2><ul class="trail">' + trail.map(function (t) {
        return '<li><div><b>' + esc(t.m) + '</b><br><small>' + esc(t.city) + ' &middot; ' + esc(R.fd(t.d)) + ' &middot; posted</small></div><span>$' + Number(t.amt) + '</span></li>';
      }).join("") + '</ul><p><small>Amounts appear only on this screen. They are never shown in shared recaps.</small></p>' +
      '<div class="row"><button class="p" data-close-sheet id="sheet-close">Done</button><button ' + (S.offline ? "disabled" : "") + ' data-hide="' + esc(s.id) + '">Hide stamp</button>' +
      '<button ' + (S.offline ? "disabled" : "") + ' data-report="' + esc(s.id) + '">Report wrong stamp</button></div></div>';
  }

  function nav(c) {
    var S = c.S, fresh = S.tab === "passport" ? 0 : c.visible.filter(function (s) { return !S.seen.has(s.id); }).length;
    return '<nav aria-label="Main">' + ["passport", "trips", "settings"].map(function (t) {
      return '<button data-tab="' + t + '" aria-current="' + (S.tab === t) + '">' + NAV_ICON[t] + '<span>' + t + '</span>' +
        (t === "passport" && fresh ? '<span class="badge">' + fresh + '<span class="vh"> new stamps</span></span>' : "") + '</button>';
    }).join("") + '</nav>';
  }

  function app(c) {
    var S = c.S, body = S.tab === "passport" ? passport(c) : S.tab === "trips" ? trips(c) : settings(c);
    var inert = S.sheet ? ' inert' : '';
    return Art.DEFS + header(c).replace('<header class="top">', '<header class="top"' + inert + '>') + '<main tabindex="-1"' + inert + '>' + (S.notice ? '<div class="note">' + esc(S.notice) + '</div>' : "") + (S.offline ? '<div class="note">Offline: showing data cached ' + esc(S.cache ? S.cache.at : "") +
      ' (UTC). Stamp changes are paused; recap name edits queue and sync when you reconnect.</div>' : "") + body + demo(c) +
      '<p class="foot">Concept prototype &middot; fake data &middot; not affiliated with any card issuer</p></main>' + nav(c).replace('<nav aria-label="Main">', '<nav aria-label="Main"' + inert + '>') + sheet(c);
  }

  return { login: login, cover: cover, app: app };
})();
