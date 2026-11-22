"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const Rules = require("../../js/rules");

function makeTx(overrides = {}) {
  return {
    id: 1,
    d: "2026-10-09",
    m: "Cafe",
    city: "Nashville",
    st: "TN",
    cat: "transport",
    cuisine: null,
    amt: 10,
    status: "posted",
    miles: 100,
    ...overrides,
  };
}

function makeOptions(overrides = {}) {
  return {
    types: { dining: false, domestic: false, ...overrides.types },
    refunded: overrides.refunded || new Set(),
    disputed: overrides.disputed || new Set(),
  };
}

test("only posted transactions at or above the minimum amount can earn stamps", () => {
  const transactions = [
    makeTx({ id: 1, amt: Rules.MIN_AMT, cat: "dining", cuisine: "Southern" }),
    makeTx({ id: 2, amt: Rules.MIN_AMT - 0.01, city: "Boston", st: "MA", cuisine: "French" }),
    makeTx({ id: 3, status: "pending", city: "Seattle", st: "WA", cuisine: "Japanese" }),
  ];
  const opts = makeOptions({ types: { dining: true, domestic: true } });

  assert.deepEqual(Rules.validTx("maya", transactions, opts), [transactions[0]]);
  assert.deepEqual(
    Rules.computeStamps("maya", transactions, opts).map(stamp => stamp.label).sort(),
    ["Nashville", "Southern", "TN"].sort(),
  );
});

test("domestic city and state stamps require the domestic toggle and more than MIN_MILES", () => {
  const trip = makeTx({ miles: Rules.MIN_MILES + 1 });
  const atLimit = makeTx({ id: 2, miles: Rules.MIN_MILES, city: "Boston", st: "MA" });
  const home = makeTx({ id: 3, miles: 2, city: "Chicago", st: "IL" });

  assert.deepEqual(Rules.computeStamps("maya", [trip], makeOptions()), []);
  assert.deepEqual(Rules.computeStamps("maya", [atLimit, home], makeOptions({
    types: { domestic: true },
  })), []);
  assert.deepEqual(
    Rules.computeStamps("maya", [trip], makeOptions({ types: { domestic: true } }))
      .map(stamp => [stamp.k, stamp.label]),
    [["city", "Nashville"], ["state", "TN"]],
  );
});

test("dining stamps require dining enabled, a dining transaction, and a non-null cuisine", () => {
  const eligible = makeTx({ cat: "dining", cuisine: "Southern" });
  const noCuisine = makeTx({ id: 2, cat: "dining", cuisine: null });
  const notDining = makeTx({ id: 3, cat: "retail", cuisine: "French" });

  assert.deepEqual(Rules.computeStamps("maya", [eligible], makeOptions()), []);
  assert.deepEqual(Rules.computeStamps("maya", [noCuisine], makeOptions({
    types: { dining: true },
  })), []);
  assert.deepEqual(Rules.computeStamps("maya", [notDining], makeOptions({
    types: { dining: true },
  })), []);
  assert.deepEqual(
    Rules.computeStamps("maya", [eligible, { ...eligible, id: 4 }], makeOptions({
      types: { dining: true },
    })).map(stamp => stamp.label),
    ["Southern"],
  );
});

test("refunded and disputed transactions never earn stamps", () => {
  const transactions = [
    makeTx({ id: 1, city: "Boston", st: "MA", cat: "dining", cuisine: "French" }),
    makeTx({ id: 2, city: "Seattle", st: "WA", cat: "dining", cuisine: "Japanese" }),
    makeTx({ id: 3, city: "Nashville", st: "TN", cat: "dining", cuisine: "Southern" }),
  ];
  const opts = makeOptions({
    types: { dining: true, domestic: true },
    refunded: new Set([Rules.txKey("maya", transactions[0])]),
    disputed: new Set([Rules.txKey("maya", transactions[1])]),
  });

  assert.deepEqual(Rules.validTx("maya", transactions, opts), [transactions[2]]);
  assert.deepEqual(
    Rules.computeStamps("maya", transactions, opts).map(stamp => stamp.label).sort(),
    ["Nashville", "Southern", "TN"].sort(),
  );
});

test("refunding one of two transactions with the same cuisine keeps the stamp from the other", () => {
  const transactions = [
    makeTx({ id: 1, cat: "dining", cuisine: "Thai" }),
    makeTx({ id: 2, cat: "dining", cuisine: "Thai" }),
  ];
  const opts = makeOptions({
    types: { dining: true },
    refunded: new Set(["maya:1"]),
  });
  const stamps = Rules.computeStamps("maya", transactions, opts);

  assert.deepEqual(stamps.map(stamp => [stamp.id, stamp.tx]), [["maya|dining|Thai", 2]]);
  assert.deepEqual(Rules.stampTrail("maya", transactions, opts, stamps[0]), [transactions[1]]);
});

test("international transactions earn a country stamp without domestic enabled and can earn dining", () => {
  const paris = makeTx({
    id: 7,
    city: "Paris",
    st: "FR",
    cat: "dining",
    cuisine: "French",
    intl: true,
  });
  const stamps = Rules.computeStamps("priya", [paris], makeOptions({ types: { dining: true } }));

  assert.deepEqual(stamps.map(stamp => [stamp.id, stamp.k, stamp.label]), [
    ["priya|intl|FR (country)", "intl", "FR (country)"],
    ["priya|dining|French", "dining", "French"],
  ]);
  assert.deepEqual(Rules.stampTrail("priya", [paris], makeOptions(), stamps[0]), [paris]);
});

test("stampTrail includes an international dining transaction", () => {
  const paris = makeTx({ city: "Paris", st: "FR", cat: "dining", cuisine: "French", intl: true });
  const opts = makeOptions({ types: { dining: true } });
  const diningStamp = Rules.computeStamps("priya", [paris], opts).find(stamp => stamp.k === "dining");

  assert.deepEqual(Rules.stampTrail("priya", [paris], opts, diningStamp), [paris]);
});

test("stamp ids are stable regardless of order; city ids include the state so same-named cities cannot collide", () => {
  const transactions = [
    makeTx({ id: 1, city: "Nashville", st: "TN", cat: "dining", cuisine: "Southern" }),
    makeTx({ id: 2, city: "New York", st: "NY", cat: "dining", cuisine: "Japanese" }),
    makeTx({ id: 3, city: "Paris", st: "FR", intl: true, cat: "retail" }),
  ];
  const opts = makeOptions({ types: { dining: true, domestic: true } });
  const forward = Rules.computeStamps("maya", transactions, opts).map(stamp => stamp.id).sort();
  const reversed = Rules.computeStamps("maya", [...transactions].reverse(), opts).map(stamp => stamp.id).sort();

  assert.deepEqual(forward, reversed);
  assert.deepEqual(forward, [
    "maya|city|Nashville,TN",
    "maya|city|New York,NY",
    "maya|dining|Japanese",
    "maya|dining|Southern",
    "maya|intl|FR (country)",
    "maya|state|NY",
    "maya|state|TN",
  ].sort());
});

test("new stamps are capped per transaction date", () => {
  const sameDay = Array.from({ length: 6 }, (_, index) => makeTx({
    id: index + 1,
    city: `City${index + 1}`,
    st: `S${index + 1}`,
  }));
  const nextDay = makeTx({ id: 7, d: "2026-10-10", city: "Other City", st: "OT" });
  const stamps = Rules.computeStamps("maya", [...sameDay, nextDay], makeOptions({
    types: { domestic: true },
  }));
  const byDate = stamps.reduce((counts, stamp) => {
    counts[stamp.sub] = (counts[stamp.sub] || 0) + 1;
    return counts;
  }, {});

  assert.equal(byDate["2026-10-09"], Rules.MAX_NEW_STAMPS_PER_DAY);
  assert.equal(byDate["2026-10-10"], 2);
});

test("stampTrail returns only valid transactions qualifying for city, state, dining, and country stamps", () => {
  const transactions = [
    makeTx({ id: 1, city: "Nashville", st: "TN", miles: 76, cat: "dining", cuisine: "Southern" }),
    makeTx({ id: 2, city: "Nashville", st: "TN", miles: 75, cat: "dining", cuisine: "Southern" }),
    makeTx({ id: 3, city: "Memphis", st: "TN", miles: 90, cat: "dining", cuisine: "Southern" }),
    makeTx({ id: 4, city: "Paris", st: "FR", intl: true, cat: "retail", miles: 400 }),
    makeTx({ id: 5, city: "Nashville", st: "TN", status: "pending", cat: "dining", cuisine: "Southern" }),
    makeTx({ id: 6, city: "Nashville", st: "TN", cat: "dining", cuisine: "Southern" }),
  ];
  const opts = makeOptions({
    types: { domestic: true, dining: true },
    refunded: new Set(["maya:6"]),
  });
  const stamps = Rules.computeStamps("maya", transactions, opts);
  const city = stamps.find(stamp => stamp.k === "city" && stamp.label === "Nashville");
  const state = stamps.find(stamp => stamp.k === "state" && stamp.label === "TN");
  const dining = stamps.find(stamp => stamp.k === "dining" && stamp.label === "Southern");
  const country = stamps.find(stamp => stamp.k === "intl");

  assert.deepEqual(Rules.stampTrail("maya", transactions, opts, city), [transactions[0]]);
  assert.deepEqual(Rules.stampTrail("maya", transactions, opts, state), [transactions[0], transactions[2]]);
  assert.deepEqual(Rules.stampTrail("maya", transactions, opts, dining), [transactions[0], transactions[1], transactions[2]]);
  assert.deepEqual(Rules.stampTrail("maya", transactions, opts, country), [transactions[3]]);
});

test("persona-qualified refund and dispute keys do not affect another persona with the same transaction id", () => {
  const mayaTx = makeTx({ id: 1, cat: "dining", cuisine: "Southern" });
  const danielTx = { ...mayaTx };
  const opts = makeOptions({
    types: { dining: true, domestic: true },
    disputed: new Set([Rules.txKey("maya", mayaTx)]),
  });

  assert.equal(Rules.txKey("maya", mayaTx), "maya:1");
  assert.equal(Rules.txKey("daniel", danielTx), "daniel:1");
  assert.deepEqual(Rules.computeStamps("maya", [mayaTx], opts), []);
  assert.deepEqual(
    Rules.computeStamps("daniel", [danielTx], opts).map(stamp => stamp.label).sort(),
    ["Nashville", "Southern", "TN"].sort(),
  );
});

test("computeRecap uses only valid trip transactions and keeps only their stamps", () => {
  const transactions = [
    makeTx({ id: 1, d: "2026-10-09", city: "Nashville", cat: "dining", cuisine: "Southern" }),
    makeTx({ id: 2, d: "2026-10-10", city: "Nashville", cat: "dining", cuisine: "Barbecue" }),
    makeTx({ id: 3, d: "2026-10-10", city: "Chicago", st: "IL", miles: 2, cat: "dining", cuisine: "American" }),
    makeTx({ id: 4, d: "2026-10-10", status: "pending", cat: "dining", cuisine: "Thai" }),
    makeTx({ id: 5, d: "2026-10-10", amt: 4.99, cat: "dining", cuisine: "Mexican" }),
    makeTx({ id: 6, d: "2026-10-10", cat: "dining", cuisine: "Greek" }),
    makeTx({ id: 7, d: "2026-10-10", cat: "dining", cuisine: "Indian" }),
  ];
  const opts = makeOptions({
    types: { dining: true, domestic: true },
    refunded: new Set(["maya:6"]),
    disputed: new Set(["maya:7"]),
  });
  const includedStamp = { id: "maya|city|Nashville,TN", k: "city", label: "Nashville", st: "TN", sub: "2026-10-09", tx: 1 };
  const excludedStamps = [
    { id: "maya|dining|Mexican", k: "dining", label: "Mexican", sub: "2026-10-10", tx: 5 },
    { id: "maya|dining|Greek", k: "dining", label: "Greek", sub: "2026-10-10", tx: 6 },
  ];
  const recap = Rules.computeRecap("maya", transactions, opts, [includedStamp, ...excludedStamps], "Autumn weekend");

  assert.equal(recap.title, "Autumn weekend");
  assert.equal(recap.from, Rules.HOME.code);
  assert.equal(recap.to, "BNA");
  assert.equal(recap.destCity, "Nashville");
  assert.equal(recap.dining, 2);
  assert.deepEqual(recap.tx, [transactions[0], transactions[1]]);
  assert.deepEqual(recap.stamps, [includedStamp]);
});

test("computeRecap maps known airports and uses a three-letter fallback", () => {
  const recapTo = city => Rules.computeRecap("maya", [makeTx({ city, miles: 100 })], makeOptions(), [] ).to;

  assert.equal(recapTo("Nashville"), "BNA");
  assert.equal(recapTo("New York"), "JFK");
  assert.equal(recapTo("Paris"), "CDG");
  assert.equal(recapTo("Springfield"), "SPR");
});

test("computeRecap returns null when there is no valid trip", () => {
  assert.equal(Rules.computeRecap("maya", [], makeOptions(), []), null);
  assert.equal(Rules.computeRecap("maya", [makeTx({ miles: 2 })], makeOptions(), []), null);
  assert.equal(Rules.computeRecap("maya", [makeTx({ miles: 100, status: "pending" })], makeOptions(), []), null);
  assert.equal(Rules.computeRecap("maya", [makeTx({ miles: 100, amt: 4 })], makeOptions(), []), null);
  assert.equal(Rules.computeRecap("maya", [makeTx({ miles: 100 })], makeOptions({
    refunded: new Set(["maya:1"]),
  }), []), null);
});

test("date helpers format a same day, same-month range, and cross-month range", () => {
  assert.equal(Rules.fd("2026-10-09"), "Oct 9");
  assert.equal(Rules.fr("2026-10-09", "2026-10-09"), "Oct 9, 2026");
  assert.equal(Rules.fr("2026-10-09", "2026-10-10"), "Oct 9–10, 2026");
  assert.equal(Rules.fr("2026-10-30", "2026-11-02"), "Oct 30 – Nov 2, 2026");
});

test("weekday formatting uses a known UTC weekday without changing process.env.TZ", () => {
  const tzBefore = process.env.TZ;

  assert.equal(Rules.fdow("2026-10-09"), "Fri · Oct 9");
  assert.equal(process.env.TZ, tzBefore);
});

test("monograms and display names cover state, country, and multi-word labels", () => {
  assert.equal(Rules.monoOf({ k: "state", label: "TN" }), "TN");
  assert.equal(Rules.monoOf({ k: "city", label: "Nashville" }), "Na");
  assert.equal(Rules.monoOf({ k: "city", label: "Middle Eastern" }), "ME");
  assert.equal(Rules.monoOf({ k: "intl", label: "FR (country)" }), "Fr");
  assert.equal(Rules.displayName({ label: "TN" }), "Tennessee");
  assert.equal(Rules.displayName({ label: "FR" }), "France");
  assert.equal(Rules.displayName({ label: "Paris (country)" }), "Paris");
});

test("displayName maps an international country code to its name", () => {
  assert.equal(Rules.displayName({ label: "FR (country)" }), "France");
});

test("hash is deterministic and matches the FNV-1a result", () => {
  assert.equal(Rules.hash("hello"), 1335831723);
  assert.equal(Rules.hash("passport"), Rules.hash("passport"));
  assert.notEqual(Rules.hash("passport"), Rules.hash("passport!"));
});

test("groupByDay sorts dates and preserves item order within each day", () => {
  const late = makeTx({ id: 1, d: "2026-10-11" });
  const earlyFirst = makeTx({ id: 2, d: "2026-10-09" });
  const middle = makeTx({ id: 3, d: "2026-10-10" });
  const earlySecond = makeTx({ id: 4, d: "2026-10-09" });

  assert.deepEqual(Rules.groupByDay([late, earlyFirst, middle, earlySecond]), [
    { d: "2026-10-09", items: [earlyFirst, earlySecond] },
    { d: "2026-10-10", items: [middle] },
    { d: "2026-10-11", items: [late] },
  ]);
});

test("two cities with the same name in different states get different stamps", () => {
  const transactions = [
    makeTx({ id: 1, city: "Springfield", st: "IL", miles: 200 }),
    makeTx({ id: 2, city: "Springfield", st: "MO", miles: 600 }),
  ];
  const stamps = Rules.computeStamps("maya", transactions, makeOptions({ types: { domestic: true } })).filter(s => s.k === "city");
  assert.equal(stamps.length, 2);
  assert.notEqual(stamps[0].id, stamps[1].id);
  assert.deepEqual(Rules.stampTrail("maya", transactions, makeOptions(), stamps[0]).map(t => t.st), ["IL"]);
});
