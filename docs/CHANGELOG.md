# Changelog

One line per improvement pass, newest first.

- Pass 3: real trip detection. Purchases are grouped into trips (gap over 2 days starts a new one); each trip has its own recap, route and name; an "All trips" list switches between them; new persona Jordan has three trips; server accepts per-trip recap names. +5 unit/API tests, +2 browser tests.
- Pass 2: GitHub Actions workflow (unit on Node 20 and 22, browser tests on Chrome); layout audit split into `npm run test:layout` and non-blocking in CI because Linux font metrics differ. Written by Codex, reviewed and corrected (BOM removed).
- Pass 1: `.gitattributes` forces LF line endings and marks images binary; no more CRLF warnings.
- Pass 0: added the roadmap and this changelog.
