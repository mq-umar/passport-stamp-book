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
  base = `http://127.0.0.1:${server.address().port}/`;
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
