// Shared helpers for the browser (Puppeteer) tests.
// Setup: npm i -D puppeteer-core axe-core   (set CHROME_PATH if Chrome/Edge is not in a default location)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const FILE_URL = "file:///" + path.join(ROOT, "index.html").replace(/\\/g, "/");

const CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
].filter(Boolean);

export function launch() {
  const executablePath = CANDIDATES.find((p) => fs.existsSync(p));
  if (!executablePath) throw new Error("No Chrome/Edge found. Set CHROME_PATH.");
  return puppeteer.launch({ executablePath, headless: "new", args: ["--no-sandbox"] });
}

/** A fresh, isolated page (own storage) with errors collected. Clicks scroll the target to the middle first so the sticky nav never covers it. */
export async function newPage(browser, { width = 390, height = 844, dark = false, reduceMotion = false } = {}) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && page.errors.push(m.text()));
  await page.setViewport({ width, height });
  await page.emulateMediaFeatures([
    { name: "prefers-color-scheme", value: dark ? "dark" : "light" },
    { name: "prefers-reduced-motion", value: reduceMotion ? "reduce" : "no-preference" },
  ]);
  const rawClick = page.click.bind(page);
  page.click = async (sel) => {
    await page.$eval(sel, (e) => e.scrollIntoView({ block: "center" }));
    return rawClick(sel);
  };
  page.closeCtx = () => ctx.close();
  return page;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Labels of the stamps currently on the page (visually hidden <b> inside each stamp button). */
export const stampLabels = (page) => page.$$eval("ul.grid .stamp .vh", (els) => els.map((e) => e.textContent));

export async function openDemo(page) {
  await page.evaluate(() => { const d = document.getElementById("demo"); if (d) d.open = true; });
}

/** Open the cover and click through onboarding, choosing the given stamp types. */
export async function start(page, url, { dining = true, domestic = true } = {}) {
  await page.goto(url);
  await page.click("#open");
  await page.click('[data-ob="1"]');
  await page.click('[data-ob="2"]');
  if (domestic) await page.click("[data-type=domestic]");
  if (dining) await page.click("[data-type=dining]");
  await page.click("[data-ob-done]");
}

export const tab = (page, name) => page.click(`[data-tab=${name}]`);

/** Run axe-core (WCAG 2.0/2.1 A and AA) and return a readable list of violations. */
export async function axeViolations(page) {
  const src = fs.readFileSync(path.join(ROOT, "node_modules", "axe-core", "axe.min.js"), "utf8");
  await page.evaluate(src);
  return page.evaluate(async () => {
    const r = await axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa"] });
    return r.violations.flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.html.slice(0, 80)}`));
  });
}
