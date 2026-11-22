// Front end against the real mock backend: login, live feed, server-side preferences.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { launch, newPage, tab, stampLabels, openDemo, sleep, ROOT } from "./helpers.mjs";

const require = createRequire(import.meta.url);
const { createServer } = require(ROOT + "/server.js");

let browser, server, base;
before(async () => {
  browser = await launch();
  server = createServer();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}/?demo=1`;
});
after(async () => { await browser.close(); await new Promise((r) => server.close(r)); });

async function login(page, pass = "demo") {
  await page.goto(base);
  await page.type("#lu", "demo"); await page.type("#lp", pass);
  await page.click("#lf button"); await sleep(600);
}

test("login gate, bad password, then the cover, onboarding and live feed", async () => {
  const page = await newPage(browser);
  await page.goto(base);
  assert.match(await page.$eval("#app", (e) => e.textContent), /Sign in/);
  assert.equal((await page.evaluate(async () => (await fetch("/api/transactions?persona=maya")).status)), 401);
  await login(page, "wrong");
  assert.match(await page.$eval("#le", (e) => e.textContent), /failed/);
  await page.$eval("#lp", (e) => (e.value = ""));
  await page.type("#lp", "demo"); await page.click("#lf button"); await sleep(600);
  await page.click("#open");
  await page.click('[data-ob="1"]'); await page.click('[data-ob="2"]');
  await page.click("[data-type=domestic]"); await page.click("[data-type=dining]"); await page.click("[data-ob-done]");
  assert.ok((await stampLabels(page)).includes("Nashville"));
  await openDemo(page);
  assert.match(await page.$eval("#demo", (e) => e.textContent), /connected/);
  // the deliberate 401s above are logged by the browser as network errors; anything else is a real failure
  assert.deepEqual(page.errors.filter((e) => !/status of 40[01]/.test(e)), []);
  await page.closeCtx();
});

test("preferences live on the server and follow the session to a new browser", async () => {
  const page = await newPage(browser);
  await page.goto(base);
  await page.type("#lu", "demo"); await page.type("#lp", "demo"); await page.click("#lf button"); await sleep(600);
  await page.click("#open"); await page.click('[data-ob="1"]'); await page.click('[data-ob="2"]');
  await page.click("[data-type=domestic]"); await page.click("[data-ob-done]"); await sleep(500);
  const token = await page.evaluate(() => JSON.parse(localStorage.getItem("passport-proto-v2")).token);
  const prefs = await page.evaluate(async (t) => (await fetch("/api/prefs", { headers: { authorization: "Bearer " + t } })).json(), token);
  assert.equal(prefs.types.domestic, true); assert.equal(prefs.types.dining, false);
  const other = await newPage(browser);
  await other.goto(base);
  await other.evaluate((t) => localStorage.setItem("passport-proto-v2", JSON.stringify({ token: t, opened: true, onboarded: true })), token);
  await other.reload(); await sleep(800);
  assert.ok((await stampLabels(other)).includes("Nashville"));
  await openDemo(other);
  await other.click("#so");
  assert.match(await other.$eval("#app", (e) => e.textContent), /Sign in/);
  await page.closeCtx(); await other.closeCtx();
});

test("persona switch loads that persona's feed from the API", async () => {
  const page = await newPage(browser);
  await login(page);
  await page.click("#open"); await page.click('[data-ob="1"]'); await page.click('[data-ob="2"]');
  await page.click("[data-type=dining]"); await page.click("[data-ob-done]");
  await openDemo(page);
  await page.select("#pers", "daniel"); await sleep(600);
  assert.ok((await stampLabels(page)).includes("Ethiopian"));
  await page.closeCtx();
});

test("deleting my data empties the server copy and it stays empty after the next render", async () => {
  const page = await newPage(browser);
  await login(page);
  await page.click("#open");
  await page.click('[data-ob="1"]'); await page.click('[data-ob="2"]');
  await page.click("[data-type=domestic]"); await page.click("[data-ob-done]");
  await sleep(600);
  const token = await page.evaluate(() => JSON.parse(localStorage.getItem("passport-proto-v2")).token);
  const get = () => page.evaluate(async (t) => (await fetch("/api/prefs", { headers: { authorization: "Bearer " + t } })).json(), token);
  assert.equal((await get()).types.domestic, true);
  await tab(page, "settings");
  await page.click("#del"); await page.click("#del-yes");
  await page.waitForFunction(() => /was deleted/.test(document.querySelector(".note")?.textContent || ""), { timeout: 10000 });
  await sleep(800); // longer than the 200 ms sync delay: a re-created PUT would have landed by now
  assert.deepEqual(await get(), {});
  assert.match(await page.$eval(".note", (e) => e.textContent), /deleted\. Passport is back/);
  await page.closeCtx();
});

test("a change made just before deleting cannot bring the server copy back", async () => {
  const page = await newPage(browser);
  await login(page);
  await page.click("#open");
  await page.click('[data-ob="1"]'); await page.click('[data-ob="2"]'); await page.click("[data-ob-done]");
  await tab(page, "settings");
  const token = await page.evaluate(() => JSON.parse(localStorage.getItem("passport-proto-v2")).token);
  await page.click("[data-type=dining]"); await page.click("#del"); await page.click("#del-yes");
  await page.waitForFunction(() => /was deleted/.test(document.querySelector(".note")?.textContent || ""), { timeout: 10000 });
  await sleep(800);
  assert.deepEqual(await page.evaluate(async (t) => (await fetch("/api/prefs", { headers: { authorization: "Bearer " + t } })).json(), token), {});
  await page.closeCtx();
});

test("after one visit the app shell opens offline, and nothing from /api is cached", async () => {
  const page = await newPage(browser);
  await page.goto(base);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload(); // now controlled by the worker
  await page.waitForFunction(() => navigator.serviceWorker.controller, { timeout: 10000 });
  await page.setOfflineMode(true);
  await page.reload();
  assert.match(await page.$eval("#app", (e) => e.textContent), /Sign in/, "shell loads with no network");
  await page.setOfflineMode(false);
  const cached = await page.evaluate(async () => { const keys = await caches.keys(); const out = []; for (const k of keys) for (const r of await (await caches.open(k)).keys()) out.push(new URL(r.url).pathname); return out; });
  assert.ok(cached.length > 5 && cached.every((p) => !p.startsWith("/api/")), cached.join(","));
  await page.closeCtx();
});

test("static mode (no backend, as on GitHub Pages) skips sign-in and uses the built-in data", async () => {
  const page = await newPage(browser);
  await page.evaluateOnNewDocument(() => { window.__static = true; });
  // config.js sets the flag to false; the static host replaces that file. Emulate it by intercepting the request.
  await page.setRequestInterception(true);
  page.on("request", (r) => (r.url().endsWith("/js/config.js") ? r.respond({ status: 200, contentType: "text/javascript", body: "window.PASSPORT_STATIC = true;" }) : r.continue()));
  await page.goto(base);
  assert.doesNotMatch(await page.$eval("#app", (e) => e.textContent), /Sign in/);
  assert.ok(await page.$("#open"), "the cover shows straight away");
  assert.equal(await page.evaluate(async () => (await fetch("/api/prefs")).status), 401, "backend still refuses anonymous calls");
  await page.closeCtx();
});

test("content security policy blocks an injected inline script and inline event handler", async () => {
  const page = await newPage(browser);
  await page.goto(base);
  await page.evaluate(() => {
    window.__pwned = 0;
    const s = document.createElement("script"); s.textContent = "window.__pwned++"; document.head.appendChild(s);
    const d = document.createElement("div"); d.innerHTML = '<img src="x" onerror="window.__pwned++">'; document.body.appendChild(d);
  });
  await sleep(400);
  assert.equal(await page.evaluate(() => window.__pwned), 0, "neither the script nor the handler may run");
  await page.closeCtx();
});
