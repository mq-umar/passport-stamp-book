/* Passport stamp rules. Pure functions, no DOM, so they run in the browser and in `node --test`.
 * They implement the PRD requirements:
 *   FR1  stamps come only from POSTED transactions
 *   FR2  domestic stamps need a trip more than MIN_MILES from home
 *   FR3  never guess a cuisine: no cuisine data means no cuisine stamp
 *   FR9  minimum amount and a per-day cap to deter card testing
 *   US10/US11  refunded or disputed transactions never earn a stamp
 */
var Rules = (function () {
  "use strict";

  var MIN_AMT = 5;
  var MIN_MILES = 75;
  var MAX_NEW_STAMPS_PER_DAY = 10;
  var HOME = { name: "Chicago, IL", code: "CHI" };

  var KIND_LABEL = { city: "City", state: "State", dining: "Dining", intl: "Country" };
  var KIND_VERB = { city: "Visited", state: "Entered", dining: "Dined", intl: "Arrived" };

  var STATES = [["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
    ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["FL", "Florida"], ["GA", "Georgia"],
    ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"],
    ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"],
    ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"],
    ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"],
    ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"],
    ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
    ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"],
    ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"]];
  var STATE_NAMES = {};
  STATES.forEach(function (s) { STATE_NAMES[s[0]] = s[1]; });
  STATE_NAMES.FR = "France";

  var CUISINES = ["American", "Barbecue", "Chinese", "Ethiopian", "French", "Greek", "Indian", "Italian",
    "Japanese", "Korean", "Mexican", "Middle Eastern", "Pizza", "Seafood", "Southern", "Spanish", "Steakhouse",
    "Thai", "Vegetarian", "Vietnamese"];

  var AIRPORT = { Nashville: "BNA", "New York": "JFK", Paris: "CDG", Chicago: "ORD" };

  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  /** "2026-10-09" -> "Oct 9" */
  function fd(d) { var p = d.split("-"); return MON[+p[1] - 1] + " " + (+p[2]); }
  /** "2026-10-09" -> "Fri · Oct 9" (UTC so it never shifts with the viewer's timezone) */
  function fdow(d) {
    var p = d.split("-");
    var day = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).getUTCDay();
    return DOW[day] + " · " + fd(d);
  }
  /** Date range such as "Oct 9–10, 2026" or "Oct 30 – Nov 2, 2026". */
  function fr(a, b) {
    var y = a.slice(0, 4);
    if (a === b) return fd(a) + ", " + y;
    if (a.slice(0, 7) === b.slice(0, 7)) return fd(a) + "–" + (+b.slice(8)) + ", " + y;
    return fd(a) + " – " + fd(b) + ", " + y;
  }

  /** Short monogram for a stamp, e.g. "TN", "Na", "NY". */
  function monoOf(s) {
    if (s.k === "state") return s.label;
    var w = s.label.replace(/ \(country\)/, "").split(/\s+/);
    if (w.length > 1) return w.map(function (x) { return x[0]; }).join("").slice(0, 3).toUpperCase();
    return w[0][0].toUpperCase() + (w[0][1] || "").toLowerCase();
  }
  function displayName(s) {
    var l = s.label.replace(/ \(country\)/, "");
    return STATE_NAMES[l] || l;
  }

  /** Small stable string hash (FNV-1a) used for deterministic "hand-pressed" angles and barcodes. */
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function txKey(persona, t) { return persona + ":" + t.id; }

  function validTx(persona, tx, o) {
    return tx.filter(function (t) {
      var k = txKey(persona, t);
      return t.status === "posted" && !o.refunded.has(k) && !o.disputed.has(k) && t.amt >= MIN_AMT; // FR1, FR9
    });
  }

  /**
   * Stamps earned by a persona.
   * @param {string} persona persona key
   * @param {object[]} tx transactions
   * @param {{types:{dining:boolean,domestic:boolean}, refunded:Set, disputed:Set}} o
   */
  function computeStamps(persona, tx, o) {
    var out = [], seen = Object.create(null), perDay = Object.create(null);
    validTx(persona, tx, o).forEach(function (t) {
      function add(k, label, idKey) {
        perDay[t.d] = (perDay[t.d] || 0) + 1;
        if (perDay[t.d] > MAX_NEW_STAMPS_PER_DAY) return;
        out.push({ id: persona + "|" + k + "|" + (idKey || label), k: k, label: label, st: t.st, sub: t.d, tx: t.id });
      }
      if (t.intl && !seen["c" + t.st]) { seen["c" + t.st] = 1; add("intl", t.st + " (country)"); }
      if (!t.intl && o.types.domestic && t.miles > MIN_MILES) { // FR2
        if (!seen["city" + t.city + t.st]) { seen["city" + t.city + t.st] = 1; add("city", t.city, t.city + "," + t.st); }
        if (!seen["st" + t.st]) { seen["st" + t.st] = 1; add("state", t.st); }
      }
      if (o.types.dining && t.cat === "dining" && t.cuisine && !seen["cu" + t.cuisine]) { // FR3
        seen["cu" + t.cuisine] = 1; add("dining", t.cuisine);
      }
    });
    return out;
  }

  /** Transactions that justify a stamp, for the "earned by" trail. */
  function stampTrail(persona, tx, o, stamp) {
    return validTx(persona, tx, o).filter(function (t) {
      if (stamp.k === "intl") return !!t.intl && stamp.label === t.st + " (country)";
      if (stamp.k === "dining") return t.cat === "dining" && t.cuisine === stamp.label; // dining stamps can be earned abroad too
      if (t.intl) return false;
      if (stamp.k === "city") return t.miles > MIN_MILES && t.city === stamp.label && t.st === stamp.st;
      return t.miles > MIN_MILES && t.st === stamp.label; // state
    });
  }

  /**
   * The current trip: all valid transactions more than MIN_MILES from home, in date order. The prototype treats them as one trip.
   * Returns null when there is no trip. `stamps` must already exclude hidden stamps.
   */
  function computeRecap(persona, tx, o, stamps, title) {
    var trip = validTx(persona, tx, o).filter(function (t) { return t.miles > MIN_MILES; })
      .sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
    if (!trip.length) return null;
    var ids = {};
    trip.forEach(function (t) { ids[t.id] = 1; });
    var dest = trip[0].city;
    return {
      title: title || "Trip to " + dest,
      dates: fr(trip[0].d, trip[trip.length - 1].d),
      from: HOME.code,
      to: AIRPORT[dest] || dest.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase(),
      destCity: dest,
      dining: trip.filter(function (t) { return t.cat === "dining"; }).length,
      stamps: stamps.filter(function (s) { return ids[s.tx]; }),
      tx: trip
    };
  }

  /** Places timeline: trip transactions grouped by day. */
  function groupByDay(tx) {
    var days = [], map = {};
    tx.forEach(function (t) {
      if (!map[t.d]) { map[t.d] = { d: t.d, items: [] }; days.push(map[t.d]); }
      map[t.d].items.push(t);
    });
    return days.sort(function (a, b) { return a.d < b.d ? -1 : 1; });
  }

  return {
    MIN_AMT: MIN_AMT, MIN_MILES: MIN_MILES, MAX_NEW_STAMPS_PER_DAY: MAX_NEW_STAMPS_PER_DAY, HOME: HOME,
    KIND_LABEL: KIND_LABEL, KIND_VERB: KIND_VERB, STATES: STATES, STATE_NAMES: STATE_NAMES, CUISINES: CUISINES,
    fd: fd, fdow: fdow, fr: fr, monoOf: monoOf, displayName: displayName, hash: hash, txKey: txKey,
    validTx: validTx, computeStamps: computeStamps, stampTrail: stampTrail, computeRecap: computeRecap,
    groupByDay: groupByDay
  };
})();
if (typeof module !== "undefined" && module.exports) module.exports = Rules;
