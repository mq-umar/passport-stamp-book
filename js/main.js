/* Boot, render loop and event handling (one delegated listener per event type). */
(function () {
  "use strict";
  var app = document.getElementById("app");
  var lastOpener = null, focusMain = false, searchTimer = null;
  var live = document.getElementById("live");

  function ctx() {
    var S = Store.get(), persona = PERSONAS[S.p];
    var o = { types: S.types, refunded: S.refunded, disputed: S.disputed };
    var all = Rules.computeStamps(S.p, persona.tx, o);
    var live = all.filter(function (s) { return !S.hidden.has(s.id); });
    var liveRecap = Rules.computeRecap(S.p, persona.tx, o, live, S.title[S.p]);
    var cached = S.offline && S.cache;
    return { S: S, persona: persona, all: all, live: live, liveRecap: liveRecap,
      visible: cached ? S.cache.v : live, recap: cached ? S.cache.r : liveRecap };
  }

  /** Remember what had focus so a re-render does not drop keyboard users back to the top. */
  function focusKey() {
    var e = document.activeElement;
    if (!e || e === document.body || !app.contains(e)) return null;
    var sel = null;
    if (e.id) sel = "#" + e.id;
    else if (e.dataset.type) sel = '[data-type="' + e.dataset.type + '"]';
    else if (e.dataset.tab) sel = '[data-tab="' + e.dataset.tab + '"]';
    else if (e.dataset.filter) sel = '[data-filter="' + e.dataset.filter + '"]';
    else if (e.dataset.ob) sel = '[data-ob="' + e.dataset.ob + '"]';
    if (!sel && (e.dataset.ref || e.dataset.dis)) return { attr: e.dataset.ref ? "ref" : "dis", val: e.dataset.ref || e.dataset.dis };
    return sel ? { sel: sel, s: e.selectionStart, e: e.selectionEnd } : null;
  }

  function render() {
    var S = Store.get();
    if (Store.API && !S.token) { app.innerHTML = Views.login(); return; }
    if (!S.opened) { app.innerHTML = Views.cover(); return; }
    var c = ctx(), fk = focusKey();
    app.innerHTML = Views.app(c);
    if (S.tab === "passport" && S.onboarded) c.visible.forEach(function (s) { S.seen.add(s.id); });
    Store.save();
    if (S.notice && live) live.textContent = S.notice;
    if (S.sheet) { var d = document.getElementById("sheet-close"); if (d) d.focus({ preventScroll: true }); }
    else if (focusMain) { focusMain = false; var mn = app.querySelector("main"); if (mn) mn.focus({ preventScroll: true }); }
    else if (fk && fk.attr) {
      var hit = Array.prototype.filter.call(app.querySelectorAll("[data-" + fk.attr + "]"), function (n) { return n.dataset[fk.attr] === fk.val; })[0];
      if (hit) hit.focus({ preventScroll: true });
    } else if (fk) {
      var el = app.querySelector(fk.sel);
      if (el) { el.focus({ preventScroll: true }); try { if (fk.s != null && el.setSelectionRange) el.setSelectionRange(fk.s, fk.e); } catch (e) { /* not a text input */ } }
    }
  }

  function closeSheet() {
    var S = Store.get(); S.sheet = null; render();
    if (lastOpener) { var back = Array.prototype.filter.call(app.querySelectorAll("[data-open]"), function (n) { return n.dataset.open === lastOpener; })[0]; if (back) back.focus({ preventScroll: true }); }
  }

  function toggle(set, key) { if (set.has(key)) set.delete(key); else set.add(key); }

  function share(mode) {
    var c = ctx(), S = c.S, r = c.recap;
    if (!r) return;
    var canvas = Art.drawShareImage(r, { showNames: S.showNames, docNo: Art.docNo(S.p, r) });
    var say = function (m) { S.msg = m; Store.save(); var el = document.getElementById("msg"); if (el) el.textContent = m; };
    canvas.toBlob(function (blob) {
      if (!blob) { say("Could not create the image."); return; }
      var file = new File([blob], "trip-recap.png", { type: "image/png" });
      var done = function (how) { Store.log("recap_shared", { channel: how, merchant_names_included: S.showNames }); say("Recap image ready (" + how + ")."); };
      var download = function () {
        var u = URL.createObjectURL(blob), a = document.createElement("a");
        a.href = u; a.download = "trip-recap.png"; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(u); }, 1000); done("download");
      };
      if (mode === "share" && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: r.title }).then(function () { done("share sheet"); }).catch(function (e) {
          if (e && e.name === "AbortError") say("Share cancelled."); else download();
        });
      } else download();
    }, "image/png");
  }

  app.addEventListener("click", function (e) {
    var S = Store.get(), t = e.target.closest("button, [data-close-sheet]");
    if (!t || !app.contains(t)) return;
    var d = t.dataset;
    if (!d.report) S.notice = ""; // a notice lives until the next action
    if (t.hasAttribute("data-open-book")) { S.opened = true; Store.log("book_opened"); render(); return; }
    if (t.hasAttribute("data-close-book")) { S.opened = false; S.sheet = null; render(); return; }
    if (d.tab) { S.tab = d.tab; S.sheet = null; Store.log("tab_viewed", { tab: d.tab }); render(); window.scrollTo(0, 0); return; }
    if (d.ob !== undefined) { S.obStep = +d.ob; render(); return; }
    if (t.hasAttribute("data-ob-done")) { S.onboarded = true; Store.log("onboarding_done", S.types); render(); return; }
    if (d.filter) { S.filter = d.filter; render(); return; }
    if (d.open) { S.sheet = d.open; lastOpener = d.open; Store.log("stamp_viewed", { id: d.open }); render(); return; }
    if (t.hasAttribute("data-close-sheet")) { closeSheet(); return; }
    if (d.hide) { S.hidden.add(d.hide); S.sheet = null; focusMain = true; Store.log("stamp_hidden", { id: d.hide }); render(); return; }
    if (d.report) {
      S.hidden.add(d.report); S.reported.push(d.report); S.sheet = null; focusMain = true;
      Store.log("stamp_reported", { id: d.report }); S.notice = "Thanks. That stamp is hidden and flagged for review."; render(); return;
    }
    if (d.ref) { toggle(S.refunded, d.ref); Store.log("stamp_revoked", { reason: "refund", tx: d.ref }); render(); return; }
    if (d.dis) { toggle(S.disputed, d.dis); Store.log("stamp_revoked", { reason: "dispute", tx: d.dis }); render(); return; }
    if (t.id === "restore") { S.hidden.clear(); Store.log("stamp_restored"); render(); return; }
    if (t.id === "so") { Store.signOut(); render(); return; }
    if (t.id === "rnb") {
      var v = document.getElementById("rn").value;
      if (S.offline) { S.queue.push({ p: S.p, v: v }); Store.log("recap_edited", { queued: true }); }
      else { S.title[S.p] = v; Store.log("recap_edited", { queued: false }); }
      render(); return;
    }
    if (t.id === "share") share("share");
    if (t.id === "save") share("save");
  });

  app.addEventListener("change", function (e) {
    var S = Store.get(), t = e.target;
    if (t.dataset && t.dataset.type) { S.types[t.dataset.type] = t.checked; if (S.tab === "settings") S.onboarded = true; Store.log("stamp_type_toggled", { type: t.dataset.type, on: t.checked }); render(); return; }
    if (t.id === "names") { S.showNames = t.checked; Store.log("privacy_setting_changed", { merchant_names: t.checked }); render(); return; }
    if (t.id === "off") {
      S.offline = t.checked;
      if (S.offline) { var c = ctx(); S.cache = { v: c.live, r: c.liveRecap, at: new Date().toISOString().slice(0, 16).replace("T", " ") }; }
      else if (S.queue.length) { S.queue.forEach(function (q) { S.title[q.p] = q.v; }); Store.log("queue_synced", { n: S.queue.length }); S.queue = []; }
      render(); return;
    }
    if (t.id === "pers") {
      S.p = t.value; S.sheet = null; Store.log("persona_changed", { p: S.p });
      Store.loadTx().then(render); return;
    }
  });

  app.addEventListener("input", function (e) {
    if (e.target.id !== "q") return;
    Store.get().q = e.target.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(render, 150); // the page is re-drawn from scratch, so wait for a pause in typing
  });

  app.addEventListener("toggle", function (e) { if (e.target.id === "demo") { var S = Store.get(); S.demoOpen = e.target.open; Store.save(); } }, true);

  app.addEventListener("submit", function (e) {
    if (e.target.id !== "lf") return;
    e.preventDefault();
    fetch("/api/login", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ user: document.getElementById("lu").value, pass: document.getElementById("lp").value }) })
      .then(function (r) { if (!r.ok) throw new Error("bad"); return r.json(); })
      .then(function (j) { Store.get().token = j.token; return Store.loadPrefs(); })
      .then(function () { return Store.loadTx(); }).then(render)
      .catch(function () { var le = document.getElementById("le"); if (le) le.textContent = "Sign-in failed. Try demo / demo."; });
  });

  document.addEventListener("keydown", function (e) {
    var S = Store.get();
    if (!S.sheet) return;
    if (e.key === "Escape") { closeSheet(); return; }
    if (e.key === "Tab") { // keep focus inside the dialog
      var dlg = app.querySelector(".sheet"), f = app.querySelectorAll(".sheet button:not(:disabled)");
      if (!dlg || !f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (!dlg.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  Store.load();
  var S0 = Store.get();
  var boot = (Store.API && S0.token) ? Store.loadPrefs().then(Store.loadTx) : Promise.resolve();
  boot.catch(function () { Store.get().token = null; }).then(render);
})();
