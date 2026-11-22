// Regenerates the README screenshots in docs/. Usage: node scripts/screenshots.mjs  (set CHROME_PATH if needed)
import { launch, newPage, start, tab, PLAIN_URL, ROOT } from "../tests/ui/helpers.mjs";
import path from "node:path";

const out = (name) => path.join(ROOT, "docs", name);
const browser = await launch();
async function fresh(opts) { const p = await newPage(browser, opts); await start(p, PLAIN_URL); return p; }
const settle = () => new Promise((r) => setTimeout(r, 700)); // let the stamp animation finish

let p = await newPage(browser); await p.goto(PLAIN_URL); await p.screenshot({ path: out("01-cover.png") }); await p.closeCtx();
p = await fresh(); await settle(); await p.screenshot({ path: out("02-passport.png") });
await p.click(".stamp .hit"); await settle(); await p.screenshot({ path: out("03-stamp-sheet.png") }); await p.closeCtx();
p = await fresh(); await tab(p, "trips"); await settle(); await p.screenshot({ path: out("04-trip-recap.png") }); await p.closeCtx();
p = await fresh({ dark: true }); await settle(); await p.screenshot({ path: out("05-night-mode.png") }); await p.closeCtx();
p = await fresh({ width: 1280, height: 800 }); await settle(); await p.screenshot({ path: out("06-desktop.png") }); await p.closeCtx();
await browser.close();
console.log("screenshots written to docs/");
