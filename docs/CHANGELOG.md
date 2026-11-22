# Changelog

One line per improvement pass, newest first.

- Pass 16: scoped security review fixes. Sign-out now revokes the session on the server (`DELETE /api/session`) so a copied token dies immediately; commit history rewritten to a GitHub no-reply email; security review document updated with the outcome of each finding. +1 server test, +1 browser test.

- Pass 15: security hardening and deploy readiness. Strict CSP (header + meta), framing and permissions headers on every response, static mode (`js/config.js`) for hosts with no backend, `scripts/build-static.mjs` shared by Vercel (`vercel.json`, with the same headers) and the GitHub Pages workflow, screenshot script and refreshed screenshots, README security and transparency sections. +1 server test, +2 browser tests.

- Pass 14: Codex final review fixes. The service worker only ever deletes its own `passport-shell-*` caches; the notification section says plainly that this prototype sends nothing; preview boxes are real labelled groups so screen readers announce them.

- Pass 13: property-style tests. 300 seeded random purchase sets check that stamps only come from posted, non-refunded, non-disputed purchases of at least $5, that cuisine and domestic rules and the daily cap always hold, and that stamp ids are unique. Roadmap gains a prioritised next-plan section.

- Pass 12: calmer stamp grid. The "Hide" link under every stamp is gone; hiding lives in each stamp's detail sheet (where it already was), with the grid test updated to prove it. Restore stays on the page when anything is hidden.

- Pass 11: ESLint (flat config, recommended rules, browser/service-worker/node globals) added and wired into `npm run test:all` and CI; fixed the three real findings (unused variable and import, undeclared test global). Lint is clean.

- Pass 10: installable and offline. Web manifest, icon, service worker (caches only the static shell, never `/api`), Open Graph and theme-colour meta tags; the book opens offline after one visit (sign-in screen, since data needs the backend). +1 server test, +1 browser test.

- Pass 9: notification preferences and digest preview (PRD US15). Settings gets two switches (trip recap ready, weekly digest), both off until chosen, with previews of the exact message (no amounts or restaurant names). Fixed focus being lost after toggling. +1 browser test.

- Pass 8: hide a place from a recap (PRD US7). Each place on the Trips tab has Hide/Show; hidden places leave the recap, meal count, share preview and share image, stay listed (struck through) so they can come back, persist across reloads and appear in the data export. +1 unit, +1 browser test; layout fix for 320 px.

- Pass 7: users no longer see developer internals. The event log is gone from the UI (it stays in the data export); "Demo controls" became "Prototype tools", shown only at the bottom of Settings (collapsed, with a plain-language note), or on every tab with `?demo=1` for reviewers and tests. +1 browser test.

- Pass 6: privacy centre. Settings gets "Export my data" (JSON: choices, hidden stamps, refunds, recap names; no amounts or merchants; works offline) and "Delete my data" (in-page two-step confirm, clears device and mock server via new `DELETE /api/prefs`, returns to setup). Codex review found and we fixed: delete being undone by a later sync (sync now skips unchanged prefs), failed deletes reported as success (`api()` now rejects non-OK), and out-of-order writes (prefs writes are serialised and delete waits for them). +1 server test, +3 browser tests.

- Pass 5: stabilise. The share-image browser test waited a fixed 2.5 s per step and flaked under load; it now waits on the observable result (stable over repeated runs). +1 browser test for FR8 (turning a stamp type off hides it everywhere, on restores it). No product change. US12 (additional cardholders) still needs a data-model change and is queued.

- Pass 4: collection goals. Five goals (3 and 5 states, 5 cities, 5 cuisines, first country) shown on the Passport tab with progress bars; finished goals get a seal. Derived from visible stamps, so hiding or refunding can un-complete one. +1 unit, +1 browser test. Also committed the refund-safe trip naming fix.

- Pass 3: real trip detection. Purchases are grouped into trips (gap over 2 days starts a new one); each trip has its own recap, route and name; an "All trips" list switches between them; new persona Jordan has three trips; server accepts per-trip recap names. +5 unit/API tests, +2 browser tests.
- Pass 2: GitHub Actions workflow (unit on Node 20 and 22, browser tests on Chrome); layout audit split into `npm run test:layout` and non-blocking in CI because Linux font metrics differ. Written by Codex, reviewed and corrected (BOM removed).
- Pass 1: `.gitattributes` forces LF line endings and marks images binary; no more CRLF warnings.
- Pass 0: added the roadmap and this changelog.
