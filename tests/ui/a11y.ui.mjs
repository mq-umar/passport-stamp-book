// WCAG 2.0/2.1 A and AA audit (axe-core) of every screen, in light and night modes, at phone and desktop widths.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { launch, newPage, tab, openDemo, axeViolations, FILE_URL } from "./helpers.mjs";

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

for (const dark of [false, true]) {
  for (const width of [390, 1280]) {
    test(`axe: every screen (${dark ? "night" : "light"}, ${width}px)`, async () => {
      const page = await newPage(browser, { dark, width, height: width > 600 ? 900 : 844 });
      await page.goto(FILE_URL);
      const report = {};
      report.cover = await axeViolations(page);
      await page.click("#open");
      report.onboarding1 = await axeViolations(page);
      await page.click('[data-ob="1"]'); report.onboarding2 = await axeViolations(page);
      await page.click('[data-ob="2"]'); report.onboarding3 = await axeViolations(page);
      await page.click("[data-type=domestic]"); await page.click("[data-type=dining]"); await page.click("[data-ob-done]");
      report.passport = await axeViolations(page);
      await page.click("[data-open]"); report.sheet = await axeViolations(page);
      await page.keyboard.press("Escape");
      await tab(page, "trips"); await openDemo(page); report.trips = await axeViolations(page);
      await tab(page, "settings"); report.settings = await axeViolations(page);
      const failing = Object.fromEntries(Object.entries(report).filter(([, v]) => v.length));
      assert.deepEqual(failing, {});
      await page.closeCtx();
    });
  }
}
