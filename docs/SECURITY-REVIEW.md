# Security review notes

Date: 2026-11-22. Scope: this repository (vanilla JS front end, zero-dependency Node mock API, service worker, CI workflows). This is a self-review by the author and their AI coding assistant, **not an independent audit**.

## What was checked, and how

| Area | Check | Result |
|---|---|---|
| Secrets and personal data | Searched tracked files and all git history for keys, tokens, passwords, personal paths and emails | None found. The only personal detail is the commit author name and email, which git publishes with every commit (see "Open items") |
| Dependencies | `npm audit` | 0 vulnerabilities. No runtime dependencies; dev dependencies are ESLint, Puppeteer (core) and axe-core |
| HTML injection (XSS) | Browser tests poison the recap name and every transaction text field (merchant, city, cuisine) with HTML and script payloads, then visit the passport grid, stamp sheet, trips list and share preview | Payloads render as literal text on every screen; no element, handler or script is created |
| Content-Security-Policy | Browser test injects an inline script and an inline `onerror` handler into the live page | Neither runs. Policy: scripts `self` only, no `eval`, no remote origins, `object-src 'none'`, `base-uri 'none'`, framing denied (header) |
| Response headers | Server test checks `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, CSP on pages, assets, API responses and 404s | Present on every response type |
| Static file serving | Server tests for path traversal, nested paths, wrong methods and an allowlist of served files | Rejected as expected |
| Request limits and sessions | Server tests for oversized bodies (413), wrong content type (415), invalid JSON and shapes, session isolation | Behaves as expected. 100 KB body cap, 500 sessions, 12 hour expiry, constant-time credential comparison |
| Service worker | Browser test lists the cache after use | No `/api` response is ever cached; the worker only deletes its own `passport-shell-*` caches |
| Data export and delete | Browser and API tests | Export has no amounts or merchant names; delete also clears the server copy and cannot be undone by a late sync |

Run `npm run test:all` to repeat every check above.

## AI review

OpenAI Codex was used as a second reviewer during development (privacy centre, notifications, service worker, grid changes); its confirmed findings were fixed and are listed in `docs/CHANGELOG.md`.

Two security-focused runs were attempted before publishing. The first (whole repository) returned no report before its time limit. The second, scoped to `server.js`, `sw.js`, `index.html` and `js/store.js`, completed and reported **no path traversal, header injection, `/api` caching or exploitable localStorage issue**, plus three Low findings:

| Finding | Outcome |
|---|---|
| Fixed `demo` / `demo` login lets anyone who can reach the server get a token | Not changed. Documented below; the server listens on localhost unless `HOST` is set |
| Sign-out only cleared the browser token; a copied token stayed valid for up to 12 hours | **Fixed.** New `DELETE /api/session` revokes the session; sign-out calls it. Covered by a server test and a browser test |
| The meta-tag CSP cannot enforce `frame-ancestors`, so a static host without headers allows framing | Vercel is covered (`vercel.json` sends the header and `X-Frame-Options`). **GitHub Pages cannot set headers, so the Pages demo can be embedded in another page.** Acceptable for a fake-data demo with no sign-in; use Vercel for the public link |

This is still one AI reviewer reading the code, not a human audit.

## Known weaknesses (deliberately not fixed, because this is a mock)

- One public demo login (`demo` / `demo`), no sign-in rate limiting, no HTTPS in the Node server. Never expose it to the internet or load real data.
- The sign-in token sits in `localStorage` (readable by any script that runs on the page; the CSP is the mitigation). A real product would use an HttpOnly, Secure, SameSite cookie.
- The CSP allows inline styles; scripts are strictly self-only.
- GitHub Actions are pinned to major versions, not commit hashes.
- No real-device or real screen-reader testing has been done.

## Open items for the owner

- Commit author emails were rewritten to `mq-umar@users.noreply.github.com` before publishing, so no personal address is in the history. If GitHub does not link those commits to your account, check **Settings → Emails** for your exact no-reply address (it may include a numeric ID) and set it with `git config user.email`.
