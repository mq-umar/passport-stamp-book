// Layout audit: at every width and on every screen, nothing may overflow the page, poke out of its container,
// or be clipped. Catches "the text does not fit" problems that a screenshot review can miss.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { launch, newPage, tab, openDemo, FILE_URL } from "./helpers.mjs";

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

/** Returns a list of human-readable layout problems for the current screen. */
function audit(page) {
  return page.evaluate(() => {
    const problems = [];
    const vw = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > vw + 1) problems.push(`page scrolls sideways: ${document.documentElement.scrollWidth} > ${vw}`);
    const label = (el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).join(".") : ""} "${(el.textContent || "").trim().slice(0, 40)}"`;
    const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && !el.closest("svg, .vh, [inert][hidden]"); };
    for (const el of document.querySelectorAll("#app *")) {
      if (!visible(el) || el.closest("svg")) continue;
      const r = el.getBoundingClientRect(), s = getComputedStyle(el);
      // 1. nothing may leave the viewport horizontally
      if (r.right > vw + 1 || r.left < -1) { problems.push(`outside viewport: ${label(el)} [${Math.round(r.left)}..${Math.round(r.right)} of ${vw}]`); continue; }
      // 2. text must not be clipped by its own box
      const clips = ["hidden", "clip"].includes(s.overflowX);
      if (clips && el.scrollWidth > el.clientWidth + 1 && !el.closest(".cover")) problems.push(`clipped text: ${label(el)} (${el.scrollWidth} > ${el.clientWidth})`);
      // 3. a child must not stick out past its parent's box (ignoring absolutely positioned decoration and scroll containers)
      const p = el.parentElement;
      if (p && p.id !== "app" && s.position !== "absolute" && s.position !== "fixed" && !["auto", "scroll"].includes(getComputedStyle(p).overflowX)) {
        const pr = p.getBoundingClientRect();
        if (r.right > pr.right + 1.5 || r.left < pr.left - 1.5) problems.push(`sticks out of parent: ${label(el)} in ${label(p)}`);
      }
    }
    // 4. the cover's footnote must sit inside the gold frame
    const fine = document.querySelector(".cover .fine");
    if (fine) {
      const f = fine.getBoundingClientRect(), c = document.querySelector(".cover").getBoundingClientRect();
      if (f.left < c.left + 30 || f.right > c.right - 30) problems.push(`cover footnote touches the frame: ${Math.round(f.left - c.left)}px / ${Math.round(c.right - f.right)}px margins`);
    }
    return problems;
  });
}

const WIDTHS = [320, 360, 390, 430, 768, 1280];

for (const dark of [false, true]) {
  for (const width of WIDTHS) {
    test(`text fits on every screen (${dark ? "night" : "light"}, ${width}px)`, async () => {
      const page = await newPage(browser, { width, height: width > 600 ? 900 : 760, dark });
      await page.goto(FILE_URL);
      const found = {};
      const check = async (name) => { const p = await audit(page); if (p.length) found[name] = p; };
      await check("cover");
      await page.click("#open");
      await check("onboarding1");
      await page.click('[data-ob="1"]'); await check("onboarding2");
      await page.click('[data-ob="2"]'); await check("onboarding3");
      await page.click("[data-type=domestic]"); await page.click("[data-type=dining]"); await page.click("[data-ob-done]");
      await check("passport");
      await page.click('[data-filter="dining"]'); await check("passport-filtered");
      await page.click('[data-filter="all"]');
      await page.click("[data-open]"); await check("stamp-sheet");
      await page.keyboard.press("Escape");
      await tab(page, "trips"); await openDemo(page); await check("trips+demo");
      await page.select("#pers", "priya"); await check("trips-priya-empty-or-intl");
      await page.select("#pers", "daniel"); await tab(page, "passport"); await check("passport-daniel");
      await tab(page, "settings"); await check("settings");
      await page.click("#off"); await check("settings-offline");
      assert.deepEqual(found, {});
      await page.closeCtx();
    });
  }
}
