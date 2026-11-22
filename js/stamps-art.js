/* SVG and canvas artwork. Everything is drawn in code: no images, no gradients. */
var Art = (function () {
  "use strict";
  var R = Rules;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }

  /** Shared SVG defs: the ink-bleed filter that roughens every stamp edge. */
  var DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
    '<filter id="inkbleed" x="-6%" y="-6%" width="112%" height="112%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G"/></filter></defs></svg>';

  /** Deterministic "hand-pressed" offsets so a stamp always lands the same way. */
  function jitter(id) {
    var h = R.hash(id);
    return { r: ((h % 17) - 8) * 1.1, dx: ((h >> 5) % 9) - 4, dy: ((h >> 9) % 7) - 3 };
  }

  /** Cancellation postmark, placed where it does not cover the lettering for each stamp shape. */
  var PM_AT = { city: [108, 106], intl: [108, 106], state: [112, 52], dining: [114, 66] };
  function postmark(kind, id) {
    var h = R.hash(id + "pm"), p = PM_AT[kind], x = p[0] + ((h % 9) - 4), y = p[1] + (((h >> 4) % 9) - 4), rot = -30 + (h >> 8) % 50;
    return '<g class="pm" stroke-width="1.1" transform="rotate(' + rot + ' ' + x + ' ' + y + ')"><circle cx="' + x + '" cy="' + y + '" r="17"/><circle cx="' + x + '" cy="' + y + '" r="13"/>' +
      '<path d="M' + (x - 22) + ' ' + (y - 5) + 'q5-4 11 0t11 0t11 0t11 0M' + (x - 22) + ' ' + (y + 5) + 'q5-4 11 0t11 0t11 0t11 0"/></g>';
  }

  function arcTop(id, r) { return '<path id="' + id + '" fill="none" d="M' + (70 - r) + ',70 A' + r + ',' + r + ' 0 0 1 ' + (70 + r) + ',70"/>'; }
  function arcBot(id, r) { return '<path id="' + id + '" fill="none" d="M' + (70 - r) + ',70 A' + r + ',' + r + ' 0 0 0 ' + (70 + r) + ',70"/>'; }

  /** Stamp artwork. Shape depends on the kind: round city, boxed state, hexagonal dining, double-ring country. */
  function stampSVG(s, uid) {
    var raw = R.displayName(s), mono = esc(R.monoOf(s)), name = esc(raw), date = esc(R.fd(s.sub).toUpperCase());
    var verb = R.KIND_VERB[s.k].toUpperCase(), body = "";
    var fs = Math.min(13, 100 / (raw.length * .62)).toFixed(1), arcName = esc(raw.toUpperCase().slice(0, 14));
    if (s.k === "city") {
      body = arcTop("t" + uid, 41) + arcBot("b" + uid, 50) +
        '<circle class="ring" cx="70" cy="70" r="60" stroke-width="3"/><circle class="ring" cx="70" cy="70" r="55" stroke-width="1"/><circle class="ring" cx="70" cy="70" r="34" stroke-width="1.2"/>' +
        '<text class="arc" text-anchor="middle"><textPath href="#t' + uid + '" startOffset="50%">' + arcName + '</textPath></text>' +
        '<text class="arc" text-anchor="middle"><textPath href="#b' + uid + '" startOffset="50%">' + date + '</textPath></text>' +
        '<text class="mono" x="70" y="80" text-anchor="middle" font-size="30">' + mono + '</text>';
    } else if (s.k === "state") {
      body = '<polygon class="ring" stroke-width="3" points="16,8 124,8 132,16 132,124 124,132 16,132 8,124 8,16"/><rect class="ring" stroke-width="1" x="17" y="17" width="106" height="106"/>' +
        '<text class="kt" x="70" y="38" text-anchor="middle">' + verb + '</text>' +
        '<text class="mono" x="70" y="88" text-anchor="middle" font-size="46">' + mono + '</text>' +
        '<text class="nm" x="70" y="106" text-anchor="middle" font-size="' + fs + '">' + name + '</text>' +
        '<text class="dt" x="70" y="120" text-anchor="middle">' + date + '</text>';
    } else if (s.k === "dining") {
      body = '<polygon class="ring" stroke-width="3" points="70,6 126,38 126,102 70,134 14,102 14,38"/><polygon class="ring" stroke-width="1" points="70,15 118,43 118,97 70,125 22,97 22,43"/>' +
        '<text class="kt" x="70" y="44" text-anchor="middle">' + verb + '</text>' +
        '<text class="mono" x="70" y="84" text-anchor="middle" font-size="36">' + mono + '</text>' +
        '<text class="nm" x="70" y="102" text-anchor="middle" font-size="' + fs + '">' + name + '</text>' +
        '<text class="dt" x="70" y="116" text-anchor="middle">' + date + '</text>';
    } else {
      body = arcTop("t" + uid, 41) + arcBot("b" + uid, 50) +
        '<circle class="ring" cx="70" cy="70" r="62" stroke-width="3"/><circle class="ring" cx="70" cy="70" r="57" stroke-width="1"/><circle class="ring" cx="70" cy="70" r="34" stroke-width="1" stroke-dasharray="3 3"/>' +
        '<polygon class="fill" points="70,45 72.4,52 79.5,52 73.8,56.3 76,63.2 70,59 64,63.2 66.2,56.3 60.5,52 67.6,52"/>' +
        '<text class="arc" text-anchor="middle"><textPath href="#t' + uid + '" startOffset="50%">ARRIVAL</textPath></text>' +
        '<text class="arc" text-anchor="middle"><textPath href="#b' + uid + '" startOffset="50%">' + arcName + '</textPath></text>' +
        '<text class="mono" x="70" y="92" text-anchor="middle" font-size="26">' + mono + '</text>';
    }
    return '<svg class="art" viewBox="0 0 140 140" aria-hidden="true" focusable="false"><g class="ink" filter="url(#inkbleed)">' + body + postmark(s.k, s.id) + '</g></svg>';
  }

  /** Passport cover crest: compass rose inside rings, in flat gold line work. */
  var CREST = '<svg class="crest" viewBox="0 0 140 140" aria-hidden="true" focusable="false" fill="none" stroke="currentColor">' +
    '<circle cx="70" cy="70" r="64" stroke-width="2"/><circle cx="70" cy="70" r="58" stroke-width="1" stroke-dasharray="2 4"/>' +
    '<circle cx="70" cy="70" r="30" stroke-width="1.5"/>' +
    '<path d="M70 14 L78 62 L126 70 L78 78 L70 126 L62 78 L14 70 L62 62 Z" stroke-width="1.5" fill="currentColor" fill-opacity=".18"/>' +
    '<path d="M32 32 L58 58 M108 32 L82 58 M32 108 L58 82 M108 108 L82 82" stroke-width="1"/></svg>';

  /** Deterministic barcode from a string. Returns an SVG string. */
  function barcodeSVG(seed) {
    var h = R.hash(seed), x = 0, bars = "";
    while (x < 196) {
      h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
      var w = 1 + (h % 4), gap = 1 + ((h >> 4) % 3);
      bars += '<rect x="' + x + '" y="0" width="' + w + '" height="46"/>';
      x += w + gap;
    }
    return '<svg viewBox="0 0 200 46" preserveAspectRatio="none" aria-hidden="true" focusable="false" fill="currentColor">' + bars + '</svg>';
  }

  var PLANE = '<svg viewBox="0 0 120 28" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" preserveAspectRatio="none">' +
    '<path d="M2 14 H96" stroke-dasharray="4 4"/><path d="M96 14 L84 6 M96 14 L84 22 M96 14 H112 M112 14 L104 8 M112 14 L104 20" stroke-linecap="square"/></svg>';

  /** Document number such as "0417-BNA". */
  function docNo(personaKey, recap) { return (PERSONAS[personaKey] && PERSONAS[personaKey].docNo || "0000") + "-" + (recap ? recap.to : "---"); }

  /* ------------------------------------------------------------------ share image (canvas) */
  var INK = { city: "#1d2b4f", state: "#2f5d3a", dining: "#7a2323", intl: "#8a5a12" };

  function notch(x, cx, cy) { x.beginPath(); x.arc(cx, cy, 22, 0, Math.PI * 2); x.fill(); x.stroke(); }

  function miniStamp(x, s, cx, cy, size, rot) {
    x.save(); x.translate(cx, cy); x.rotate(rot * Math.PI / 180);
    x.strokeStyle = INK[s.k]; x.fillStyle = INK[s.k]; x.lineWidth = 4; x.textAlign = "center";
    var r = size / 2;
    x.beginPath();
    if (s.k === "city" || s.k === "intl") { x.arc(0, 0, r, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.arc(0, 0, r - 9, 0, Math.PI * 2); x.lineWidth = 1.5; x.stroke(); }
    else if (s.k === "state") { x.rect(-r, -r, size, size); x.stroke(); x.lineWidth = 1.5; x.strokeRect(-r + 9, -r + 9, size - 18, size - 18); }
    else { for (var i = 0; i < 6; i++) { var a = Math.PI / 3 * i - Math.PI / 2; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.stroke(); }
    x.font = "700 " + Math.round(size * .34) + "px Georgia, serif"; x.fillText(R.monoOf(s), 0, size * .12);
    x.font = "600 18px ui-monospace, Consolas, monospace"; x.fillText(R.KIND_VERB[s.k].toUpperCase(), 0, -size * .22);
    x.restore();
  }

  /**
   * Draw the shareable boarding-pass image. Never includes amounts or card details;
   * merchant names are included only when opts.showNames is true.
   */
  function drawShareImage(r, opts) {
    var c = document.createElement("canvas"); c.width = 1080; c.height = 1350;
    var x = c.getContext("2d"), serif = "Georgia, 'Times New Roman', serif", mono = "ui-monospace, Consolas, monospace";
    x.fillStyle = "#f3ecdc"; x.fillRect(0, 0, 1080, 1350);
    // ticket
    var X = 60, Y = 90, W = 960, H = 640;
    x.fillStyle = "#fbf6ea"; x.strokeStyle = "#2a2118"; x.lineWidth = 4; x.fillRect(X, Y, W, H); x.strokeRect(X, Y, W, H);
    x.fillStyle = "#6b5d48"; x.font = "600 24px " + mono; x.fillText("BOARDING PASS  /  TRIP RECAP", X + 44, Y + 70);
    x.fillStyle = "#2a2118"; x.font = "700 150px " + serif; x.fillText(r.from, X + 44, Y + 235);
    x.textAlign = "right"; x.fillText(r.to, X + W - 44, Y + 235); x.textAlign = "left";
    x.strokeStyle = "#2a2118"; x.lineWidth = 4; x.setLineDash([14, 12]); x.beginPath(); x.moveTo(X + 360, Y + 192); x.lineTo(X + W - 360, Y + 192); x.stroke(); x.setLineDash([]);
    x.beginPath(); x.moveTo(X + W - 360, Y + 192); x.lineTo(X + W - 390, Y + 172); x.moveTo(X + W - 360, Y + 192); x.lineTo(X + W - 390, Y + 212); x.stroke();
    x.fillStyle = "#6b5d48"; x.font = "26px " + mono; x.fillText(R.HOME.name.toUpperCase() + "  TO  " + r.destCity.toUpperCase(), X + 44, Y + 285);
    x.fillStyle = "#2a2118"; x.font = "600 62px " + serif; x.fillText(r.title, X + 44, Y + 375, W - 88);
    var fields = [["DATES", r.dates], ["STAMPS", String(r.stamps.length)], ["MEALS", String(r.dining)]];
    fields.forEach(function (f, i) {
      var fx = X + 44 + i * 300;
      x.fillStyle = "#6b5d48"; x.font = "600 20px " + mono; x.fillText(f[0], fx, Y + 440);
      x.fillStyle = "#2a2118"; x.font = "700 40px " + serif; x.fillText(f[1], fx, Y + 490, 280);
    });
    if (opts.showNames) {
      var names = r.tx.filter(function (t) { return t.cat === "dining"; }).map(function (t) { return t.m; }).join("  /  ");
      x.fillStyle = "#6b5d48"; x.font = "24px " + mono; x.fillText(names, X + 44, Y + 535, W - 88);
    }
    // tear line + notches
    var ty = Y + 565; x.strokeStyle = "#2a2118"; x.lineWidth = 3; x.setLineDash([12, 10]); x.beginPath(); x.moveTo(X + 20, ty); x.lineTo(X + W - 20, ty); x.stroke(); x.setLineDash([]);
    x.fillStyle = "#f3ecdc"; x.lineWidth = 4; notch(x, X, ty); notch(x, X + W, ty);
    x.fillStyle = "#f3ecdc"; x.fillRect(X - 30, ty - 24, 29, 48); x.fillRect(X + W + 1, ty - 24, 29, 48);
    // barcode
    var h = R.hash(r.title + r.dates); x.fillStyle = "#2a2118"; var bx = X + 44;
    while (bx < X + 560) { h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; var w = 3 + (h % 6), gap = 3 + ((h >> 4) % 5); x.fillRect(bx, ty + 14, w, 44); bx += w + gap; }
    x.fillStyle = "#6b5d48"; x.font = "600 22px " + mono; x.textAlign = "right"; x.fillText("No. " + (opts.docNo || "0000-" + r.to), X + W - 44, ty + 44); x.textAlign = "left";
    // stamps pressed below
    var list = r.stamps.slice(0, 6);
    list.forEach(function (s, i) {
      var j = jitter(s.id), col = i % 3, row = Math.floor(i / 3);
      miniStamp(x, s, 220 + col * 320, 900 + row * 230, 190, j.r * 1.2);
    });
    if (!list.length) { x.fillStyle = "#6b5d48"; x.font = "28px " + serif; x.fillText("No stamps on this trip yet.", 70, 930); }
    x.fillStyle = "#6b5d48"; x.font = "22px " + mono; x.fillText("CONCEPT PROTOTYPE  /  NO AMOUNTS OR CARD DETAILS SHOWN", 70, 1300);
    return c;
  }

  return { DEFS: DEFS, CREST: CREST, PLANE: PLANE, esc: esc, jitter: jitter, stampSVG: stampSVG, barcodeSVG: barcodeSVG, docNo: docNo, drawShareImage: drawShareImage };
})();
