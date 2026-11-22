// Builds the static demo into _site/: only the front-end files, with js/config.js switched to static mode
// (no backend, no sign-in, built-in fake data). Used by Vercel (vercel.json) and the GitHub Pages workflow.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "_site");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const f of ["index.html", "sw.js", "icon.svg", "manifest.webmanifest"]) fs.copyFileSync(path.join(root, f), path.join(out, f));
for (const d of ["css", "js"]) fs.cpSync(path.join(root, d), path.join(out, d), { recursive: true });
fs.mkdirSync(path.join(out, "docs"));
for (const f of fs.readdirSync(path.join(root, "docs")).filter((n) => n.endsWith(".png"))) fs.copyFileSync(path.join(root, "docs", f), path.join(out, "docs", f));
fs.writeFileSync(path.join(out, "js", "config.js"), "window.PASSPORT_STATIC = true;\n");
fs.writeFileSync(path.join(out, ".nojekyll"), "");
console.log("static site written to _site/ (" + fs.readdirSync(out).length + " entries)");
