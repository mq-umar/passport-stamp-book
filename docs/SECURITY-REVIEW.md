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

OpenAI Codex was used as a second reviewer during development (privacy centre, notifications, service worker, grid changes). Its confirmed findings were fixed and are listed in `docs/CHANGELOG.md`. A final whole-repository **security-focused Codex run was started but did not return a report** before the time limit, so no claim of an independent AI security review is made here.

## Known weaknesses (deliberately not fixed, because this is a mock)

- One public demo login (`demo` / `demo`), no sign-in rate limiting, no HTTPS in the Node server. Never expose it to the internet or load real data.
- The sign-in token sits in `localStorage` (readable by any script that runs on the page; the CSP is the mitigation). A real product would use an HttpOnly, Secure, SameSite cookie.
- The CSP allows inline styles; scripts are strictly self-only.
- GitHub Actions are pinned to major versions, not commit hashes.
- No real-device or real screen-reader testing has been done.

## Open items for the owner

- Every commit carries the author email set in git. Publishing the history publishes that address. Use a GitHub `noreply` address for future commits, and decide whether to rewrite history first.
