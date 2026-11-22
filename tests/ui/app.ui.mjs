// End-to-end behaviour of the front end, opened from file:// with built-in data.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { launch, newPage, start, tab, stampLabels, openDemo, sleep, FILE_URL } from "./helpers.mjs";

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

async function session(opts, startOpts) {
  const page = await newPage(browser, opts);
  await start(page, FILE_URL, startOpts);
  return page;
}
const noErrors = (page) => assert.deepEqual(page.errors, []);

test("cover opens, onboarding walks three steps and stamps appear", async () => {
  const page = await newPage(browser);
  await page.goto(FILE_URL);
  assert.ok(await page.$eval(".cover h1", (e) => e.textContent.includes("PASSPORT")));
  await page.click("#open");
  assert.match(await page.$eval("main", (e) => e.textContent), /Step 1 of 3/);
  await page.click('[data-ob="1"]');
  assert.match(await page.$eval("main", (e) => e.textContent), /No location tracking/);
  await page.click('[data-ob="2"]');
  await page.click("[data-type=domestic]");
  assert.ok(await page.$("[data-ob-done]"), "onboarding must survive toggling a switch");
  await page.click("[data-type=dining]");
  await page.click("[data-ob-done]");
  const labels = await stampLabels(page);
  for (const l of ["Nashville", "TN", "Southern", "Barbecue", "American"]) assert.ok(labels.includes(l), l);
  noErrors(page); await page.closeCtx();
});

test("stamp rules: nothing before opt-in, pending/under-$5/null-cuisine never earn", async () => {
  const page = await newPage(browser);
  await start(page, FILE_URL, { dining: false, domestic: false });
  assert.equal((await stampLabels(page)).length, 0);
  await openDemo(page);
  await page.select("#pers", "daniel");
  await tab(page, "settings"); await page.click("[data-type=dining]"); await tab(page, "passport");
  const labels = await stampLabels(page);
  assert.deepEqual(labels.sort(), ["Ethiopian", "Japanese"]);
  noErrors(page); await page.closeCtx();
});

test("hide and restore; hidden stamps stay hidden when the list shifts", async () => {
  const page = await session();
  const before = (await stampLabels(page)).length;
  await page.$$eval("ul.grid .stamp", (els) => els.find((e) => e.textContent.includes("Barbecue")).querySelector("[data-hide]").click());
  assert.ok(!(await stampLabels(page)).includes("Barbecue"));
  await openDemo(page);
  await page.click('[data-ref="maya:1"]'); // shifts the list underneath
  assert.ok(!(await stampLabels(page)).includes("Barbecue"));
  await page.click('[data-ref="maya:1"]');
  await page.click("#restore");
  assert.equal((await stampLabels(page)).length, before);
  noErrors(page); await page.closeCtx();
});

test("stamp detail sheet: trail, focus management, Escape, report", async () => {
  const page = await session();
  await page.click('[data-open$="|dining|Southern"]');
  assert.ok(await page.$(".sheet[role=dialog]"));
  const trail = await page.$eval(".trail", (e) => e.textContent);
  assert.match(trail, /Hot Chicken Co/); assert.match(trail, /Biscuit Cafe/); assert.match(trail, /\$34/);
  assert.equal(await page.evaluate(() => document.activeElement.id), "sheet-close");
  await page.keyboard.press("Escape");
  assert.equal(await page.$(".sheet"), null);
  assert.ok(await page.evaluate(() => document.activeElement.dataset.open?.endsWith("Southern")), "focus returns to the stamp");
  await page.click('[data-open$="|dining|Southern"]');
  await page.click("[data-report]");
  assert.ok(!(await stampLabels(page)).includes("Southern"));
  assert.match(await page.$eval("#app", (e) => e.textContent), /Thanks\. That stamp is hidden/);
  noErrors(page); await page.closeCtx();
});

test("search and filter, collection index counts", async () => {
  const page = await session();
  await page.click('[data-filter="dining"]');
  assert.deepEqual((await stampLabels(page)).sort(), ["American", "Barbecue", "Southern"]);
  await page.click('[data-filter="all"]');
  await page.type("#q", "tenn");
  await sleep(400); // search is debounced
  assert.deepEqual(await stampLabels(page), ["TN"]);
  assert.equal(await page.evaluate(() => document.activeElement.id), "q", "typing must not lose focus");
  await page.$eval("#q", (e) => { e.value = ""; e.dispatchEvent(new Event("input", { bubbles: true })); });
  await sleep(400);
  const idx = await page.$eval(".index", (e) => e.textContent);
  assert.match(idx, /States collected: 1 of 50/); assert.match(idx, /Cuisines collected: 3 of 20/);
  noErrors(page); await page.closeCtx();
});

test("trip recap is a boarding pass and privacy defaults hold", async () => {
  const page = await session();
  await tab(page, "trips");
  const pass = await page.$eval(".pass", (e) => e.textContent);
  assert.match(pass, /CHI/); assert.match(pass, /BNA/); assert.match(pass, /Trip to Nashville/); assert.match(pass, /Oct 9.10, 2026/);
  assert.ok(!(await page.$eval(".preview", (e) => e.textContent)).includes("Hot Chicken"));
  await page.click("#names");
  assert.ok((await page.$eval(".preview", (e) => e.textContent)).includes("Hot Chicken"));
  const places = await page.$eval(".day", (e) => e.textContent);
  assert.match(places, /Fri · Oct 9/);
  noErrors(page); await page.closeCtx();
});

test("refund and dispute only affect their own persona; recap ignores sub-$5", async () => {
  const page = await session();
  await openDemo(page);
  await page.click('[data-dis="maya:1"]');
  await page.select("#pers", "daniel");
  await tab(page, "passport");
  assert.ok((await stampLabels(page)).includes("Japanese"), "Maya's dispute must not touch Daniel");
  await tab(page, "trips");
  assert.match(await page.$eval(".pass", (e) => e.textContent), /Meals\s*3/); // Ramen + Injera + Unknown Cafe; the $3 Taqueria is under the minimum
  noErrors(page); await page.closeCtx();
});

test("rename is escaped (no HTML injection) and survives reload", async () => {
  const page = await session();
  await tab(page, "trips");
  await page.$eval("#rn", (e) => (e.value = "<img src=x onerror=window.__x=1>"));
  await page.click("#rnb");
  assert.ok(!(await page.evaluate(() => window.__x)));
  assert.equal(await page.$(".pass img"), null);
  await page.reload();
  assert.ok((await page.$eval(".pass", (e) => e.textContent)).includes("<img src=x"));
  noErrors(page); await page.closeCtx();
});

test("offline: cached snapshot, paused changes, queued rename, survives reload", async () => {
  const page = await session();
  await tab(page, "trips");
  await openDemo(page);
  await page.click("#off");
  assert.ok(await page.$eval("#pers", (e) => e.disabled));
  assert.ok(await page.$eval("[data-ref]", (e) => e.disabled));
  await page.$eval("#rn", (e) => (e.value = "Girls weekend"));
  await page.click("#rnb");
  assert.match(await page.$eval("#app", (e) => e.textContent), /queued/);
  await page.reload();
  assert.ok(await page.$eval("#off", (e) => e.checked), "offline flag persists");
  await openDemo(page);
  await page.click("#off");
  assert.equal(await page.$eval(".pass h2", (e) => e.textContent), "Girls weekend");
  noErrors(page); await page.closeCtx();
});

test("save image creates a real PNG; share sheet and its failure paths", async () => {
  const page = await session();
  await tab(page, "trips");
  await page.evaluate(() => { window.__b = null; const o = URL.createObjectURL; URL.createObjectURL = (b) => { window.__b = b; return o.call(URL, b); }; });
  await page.click("#save"); await page.waitForFunction(() => window.__b, { timeout: 10000 });
  const info = await page.evaluate(async () => window.__b && { type: window.__b.type, size: window.__b.size, magic: Array.from(new Uint8Array(await window.__b.slice(1, 4).arrayBuffer())) });
  assert.equal(info.type, "image/png"); assert.ok(info.size > 5000); assert.equal(String.fromCharCode(...info.magic), "PNG");
  // share sheet called with the file
  await page.evaluate(() => { window.__s = null; navigator.canShare = () => true; navigator.share = async (d) => { window.__s = { n: d.files[0].name, t: d.files[0].type, title: d.title }; }; });
  await page.click("#share"); await page.waitForFunction(() => window.__s, { timeout: 10000 });
  assert.deepEqual(await page.evaluate(() => window.__s), { n: "trip-recap.png", t: "image/png", title: "Trip to Nashville" });
  // user cancels: no download, friendly message
  await page.evaluate(() => { navigator.share = async () => { throw new DOMException("c", "AbortError"); }; window.__d = 0; HTMLAnchorElement.prototype.click = function () { if (this.download) window.__d++; }; });
  await page.click("#share"); await page.waitForFunction(() => /cancelled/.test(document.getElementById("msg").textContent), { timeout: 10000 });
  assert.equal(await page.evaluate(() => window.__d), 0);
  assert.match(await page.$eval("#msg", (e) => e.textContent), /cancelled/);
  // any other failure falls back to download
  await page.evaluate(() => { navigator.share = async () => { throw new Error("boom"); }; });
  await page.click("#share"); await page.waitForFunction(() => window.__d === 1, { timeout: 10000 });
  assert.equal(await page.evaluate(() => window.__d), 1);
  noErrors(page); await page.closeCtx();
});

test("keyboard focus is kept after re-render", async () => {
  const page = await newPage(browser);
  await start(page, FILE_URL, { dining: false, domestic: false });
  await tab(page, "settings");
  await page.click("[data-type=dining]");
  assert.equal(await page.evaluate(() => document.activeElement.dataset.type), "dining");
  noErrors(page); await page.closeCtx();
});

test("fresh stamps animate; reduced motion turns the animation off", async () => {
  const page = await newPage(browser);
  await start(page, FILE_URL);
  assert.ok(await page.$(".stamp.fresh"), "first view marks new stamps");
  await page.closeCtx();
  const calm = await newPage(browser, { reduceMotion: true });
  await start(calm, FILE_URL);
  const name = await calm.$eval(".stamp.fresh .art", (e) => getComputedStyle(e).animationName);
  assert.equal(name, "none");
  await calm.closeCtx();
});

test("corrupt saved state recovers; cover can be closed and reopened", async () => {
  const page = await session();
  await page.evaluate(() => localStorage.setItem("passport-proto-v2", JSON.stringify({ p: "zzz", tab: "nope", filter: "x", opened: true, hidden: 5 })));
  await page.reload();
  assert.match(await page.$eval("#app", (e) => e.textContent), /Passport/);
  await page.click("[data-close-book]");
  assert.ok(await page.$(".cover"));
  await page.click("#open");
  assert.ok(await page.$("header.top"));
  noErrors(page); await page.closeCtx();
});

test("wrongly typed saved state (null title, string queue, bad cache) does not blank the page", async () => {
  const page = await session();
  await page.evaluate(() => localStorage.setItem("passport-proto-v2", JSON.stringify({ opened: true, onboarded: true, title: null, queue: "x", events: 3, cache: {}, q: 7, types: { dining: "yes" } })));
  await page.reload();
  assert.match(await page.$eval("#app", (e) => e.textContent), /Passport/);
  noErrors(page); await page.closeCtx();
});

test("the stamp dialog is modal: background is inert and Tab cannot leave it", async () => {
  const page = await session();
  await page.click("[data-open]");
  assert.ok(await page.$eval("main", (e) => e.inert));
  assert.ok(await page.$eval("nav", (e) => e.inert));
  await page.evaluate(() => document.activeElement.blur());
  await page.keyboard.press("Tab");
  assert.ok(await page.evaluate(() => !!document.activeElement.closest(".sheet")), "focus is pulled back into the dialog");
  await page.keyboard.press("Escape");
  assert.ok(!(await page.$eval("main", (e) => e.inert)));
  noErrors(page); await page.closeCtx();
});

test("hiding a stamp moves focus somewhere sensible instead of dropping it", async () => {
  const page = await session();
  await page.click("[data-hide]");
  assert.equal(await page.evaluate(() => document.activeElement.tagName), "MAIN");
  noErrors(page); await page.closeCtx();
});

test("several trips: latest by default, past trips can be opened, and each keeps its own name", async () => {
  const page = await session();
  await openDemo(page);
  await page.select("#pers", "jordan");
  await tab(page, "trips");
  assert.match(await page.$eval(".pass", (e) => e.textContent), /Trip to Seattle/);
  assert.match(await page.$eval(".pass", (e) => e.textContent), /SEA/);
  const rows = await page.$$eval(".trip-row", (els) => els.map((e) => e.textContent));
  assert.equal(rows.length, 3);
  assert.match(rows[0], /Seattle/); assert.match(rows[2], /Denver/);
  assert.equal(await page.$eval(".trip-row[aria-current=true]", (e) => e.textContent.includes("Seattle")), true);

  await page.click('[data-trip="2026-08-14"]');
  assert.match(await page.$eval(".pass", (e) => e.textContent), /Trip to Denver/);
  assert.match(await page.$eval(".pass", (e) => e.textContent), /DEN/);
  assert.match(await page.$eval(".pass", (e) => e.textContent), /Aug 14.16, 2026/);
  assert.match(await page.$eval(".day", (e) => e.textContent), /Fri · Aug 14/);
  await page.$eval("#rn", (e) => (e.value = "Rockies road trip"));
  await page.click("#rnb");
  await page.click('[data-trip="2026-10-23"]');
  assert.match(await page.$eval(".pass", (e) => e.textContent), /Trip to Seattle/, "renaming Denver must not rename Seattle");
  assert.match(await page.$eval(".tripbook", (e) => e.textContent), /Rockies road trip/);

  await page.reload();
  assert.match(await page.$eval(".tripbook", (e) => e.textContent), /Rockies road trip/, "per-trip names persist");
  noErrors(page); await page.closeCtx();
});

test("a single-trip persona has no trip list", async () => {
  const page = await session();
  await tab(page, "trips");
  assert.equal(await page.$(".tripbook"), null);
  noErrors(page); await page.closeCtx();
});

test("picking a trip keeps keyboard focus on that row", async () => {
  const page = await session();
  await openDemo(page);
  await page.select("#pers", "jordan");
  await tab(page, "trips");
  await page.click('[data-trip="2026-09-18"]');
  assert.equal(await page.evaluate(() => document.activeElement.dataset.trip), "2026-09-18");
  noErrors(page); await page.closeCtx();
});

test("a selected trip that disappears falls back to the latest with an explanation; names follow a moved start date", async () => {
  const page = await session();
  await openDemo(page);
  await page.select("#pers", "jordan");
  await tab(page, "trips");
  await page.click('[data-trip="2026-08-14"]');
  await page.$eval("#rn", (e) => (e.value = "Rockies road trip"));
  await page.click("#rnb");
  // refund the Aug 14 purchase: the trip now starts on Aug 15, but keeps its name
  await openDemo(page);
  await page.click('[data-ref="jordan:1"]');
  assert.match(await page.$eval(".tripbook", (e) => e.textContent), /Rockies road trip/);
  // refund every Denver purchase: the trip vanishes and the latest is shown with a note
  await page.click('[data-ref="jordan:2"]');
  await page.click('[data-ref="jordan:3"]');
  assert.match(await page.$eval(".pass", (e) => e.textContent), /Trip to Seattle/);
  assert.match(await page.$eval("main", (e) => e.textContent), /That trip changed/);
  noErrors(page); await page.closeCtx();
});

test("offline: trip switching is paused with a note, and a queued per-trip rename syncs to that trip", async () => {
  const page = await session();
  await openDemo(page);
  await page.select("#pers", "jordan");
  await tab(page, "trips");
  await page.click('[data-trip="2026-09-18"]');
  await openDemo(page);
  await page.click("#off");
  assert.match(await page.$eval("main", (e) => e.textContent), /Switching trips is paused while offline/);
  assert.ok(await page.$eval("[data-trip]", (e) => e.disabled));
  await page.$eval("#rn", (e) => (e.value = "Austin weekend"));
  await page.click("#rnb");
  await page.click("#off");
  assert.match(await page.$eval(".tripbook", (e) => e.textContent), /Austin weekend/);
  await page.click('[data-trip="2026-10-23"]');
  assert.match(await page.$eval(".pass", (e) => e.textContent), /Trip to Seattle/, "the rename landed on Austin only");
  noErrors(page); await page.closeCtx();
});

test("a name saved by the previous version (keyed by persona) still shows on the latest trip", async () => {
  const page = await session();
  await page.evaluate(() => { const j = JSON.parse(localStorage.getItem("passport-proto-v2")); j.title = { maya: "Legacy weekend" }; localStorage.setItem("passport-proto-v2", JSON.stringify(j)); });
  await page.reload();
  await tab(page, "trips");
  assert.match(await page.$eval(".pass", (e) => e.textContent), /Legacy weekend/);
  noErrors(page); await page.closeCtx();
});

test("goals: progress follows visible stamps and hiding stamps un-completes a goal", async () => {
  const page = await session();
  await openDemo(page); await page.select("#pers", "jordan");
  const goals = () => page.$$eval(".goal", (els) => Object.fromEntries(els.map((e) => [e.querySelector("b").textContent, { done: e.classList.contains("done"), n: e.querySelector(".g-n").textContent }])));
  const before = await goals();
  assert.equal(Object.keys(before).length, 5);
  assert.match(await page.$eval(".goals .count", (e) => e.textContent), /\d of 5 completed/);
  assert.equal(await page.$eval(".goal .bar-track", (e) => e.getAttribute("role")), "progressbar");
  assert.equal(before["Weekend roamer"].done, true, "Jordan has 3 states: " + JSON.stringify(before));
  assert.equal(before["Well fed"].done, true);
  assert.ok(await page.$(".goal.done .seal"), "a finished goal shows its seal");
  while (await page.$(".stamp.k-state .hide")) await page.click(".stamp.k-state .hide");
  const after = await goals();
  assert.equal(after["Weekend roamer"].done, false);
  assert.match(after["Weekend roamer"].n, /^0 \/ 3$/);
  noErrors(page); await page.closeCtx();
});

test("FR8: turning a stamp type off hides its stamps everywhere, turning it on brings them back", async () => {
  const page = await session();
  const kinds = async () => page.$$eval(".stamp", (els) => [...new Set(els.map((e) => e.className.match(/k-(\w+)/)[1]))].sort());
  assert.deepEqual(await kinds(), ["city", "dining", "state"]);
  await tab(page, "settings"); await page.click("[data-type=dining]"); await tab(page, "passport");
  assert.deepEqual(await kinds(), ["city", "state"]);
  assert.match(await page.$eval(".mrz", (e) => e.textContent), /Cuisines0/);
  await tab(page, "settings"); await page.click("[data-type=domestic]"); await tab(page, "passport");
  assert.deepEqual(await kinds(), []);
  await tab(page, "settings"); await page.click("[data-type=dining]"); await page.click("[data-type=domestic]"); await tab(page, "passport");
  assert.deepEqual(await kinds(), ["city", "dining", "state"]);
  noErrors(page); await page.closeCtx();
});

test("privacy centre: export contains no amounts or merchants; delete asks twice and resets to setup", async () => {
  const page = await session();
  await page.evaluate(() => { window.__x = null; const o = URL.createObjectURL; URL.createObjectURL = (b) => { window.__x = b; return o.call(URL, b); }; HTMLAnchorElement.prototype.click = function () {}; });
  await tab(page, "settings");
  await page.click("#export");
  const text = await page.evaluate(() => window.__x.text());
  const data = JSON.parse(text);
  assert.deepEqual(data.stampTypes, { dining: true, domestic: true });
  assert.ok(!/amt|amount|\$\d/.test(text), "export must not contain amounts");
  assert.ok(!/Pancake|Hattie|Cafe/i.test(JSON.stringify(Object.keys(data))));
  assert.match(await page.$eval("#pmsg", (e) => e.textContent), /downloaded/);
  // delete: first click only asks
  await page.click("#del");
  assert.ok(await page.$("#del-yes"));
  assert.equal(await page.evaluate(() => document.activeElement.id), "del-no");
  await page.click("#del-no");
  assert.equal(await page.$("#del-yes"), null);
  assert.equal(await page.evaluate(() => document.activeElement.id), "del");
  await page.click("#del"); await page.click("#del-yes");
  await page.waitForFunction(() => /was deleted/.test(document.querySelector(".note")?.textContent || ""), { timeout: 10000 });
  await tab(page, "passport");
  assert.match(await page.$eval("main", (e) => e.textContent), /Step 1 of 3/, "back to onboarding");
  noErrors(page); await page.closeCtx();
});
