# Changelog

One line per improvement pass, newest first.

- Pass 5: stabilise. The share-image browser test waited a fixed 2.5 s per step and flaked under load; it now waits on the observable result (stable over repeated runs). +1 browser test for FR8 (turning a stamp type off hides it everywhere, on restores it). No product change. US12 (additional cardholders) still needs a data-model change and is queued.

- Pass 4: collection goals. Five goals (3 and 5 states, 5 cities, 5 cuisines, first country) shown on the Passport tab with progress bars; finished goals get a seal. Derived from visible stamps, so hiding or refunding can un-complete one. +1 unit, +1 browser test. Also committed the refund-safe trip naming fix.

- Pass 3: real trip detection. Purchases are grouped into trips (gap over 2 days starts a new one); each trip has its own recap, route and name; an "All trips" list switches between them; new persona Jordan has three trips; server accepts per-trip recap names. +5 unit/API tests, +2 browser tests.
- Pass 2: GitHub Actions workflow (unit on Node 20 and 22, browser tests on Chrome); layout audit split into `npm run test:layout` and non-blocking in CI because Linux font metrics differ. Written by Codex, reviewed and corrected (BOM removed).
- Pass 1: `.gitattributes` forces LF line endings and marks images binary; no more CRLF warnings.
- Pass 0: added the roadmap and this changelog.
