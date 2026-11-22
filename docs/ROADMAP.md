# Roadmap

Living backlog, worked in small verified passes (one commit per pass). Tracks rotate in this order: **Ship**, **Features**, **Craft**, **Engineering**. `[x]` done, `[ ]` open, `[!]` blocked (reason given).

Rules for every pass: tests stay green and never decrease in number; visual changes are checked in screenshots at 390 and 1280 px, light and night; no gradients, glass or emoji; fake data only; nothing is published or pushed without the owner's explicit OK.

## Needs the owner (code cannot close these)
- [ ] Try the prototype on a real phone and with VoiceOver or TalkBack.
- [ ] Confirm the LICENSE holder name.
- [ ] Decide whether `docs/PRD.md` should keep the original product name.
- [ ] Decide when to publish (GitHub repo, live demo).

## Track 1: Ship-readiness
- [x] 1. `.gitattributes` and normalised line endings
- [x] 2. GitHub Actions CI (unit, API, browser; layout audit informational). Badges to be added once a repo exists
- [x] 3. Open Graph / social image and meta tags
- [x] 4. PWA: manifest, icons from the crest, service worker, offline-after-first-visit test
- [ ] 5. README demo GIF from a scripted golden-path capture
- [ ] 6. `docs/case-study.md`
- [ ] 7. Deployment pack (documented, not executed)

## Track 2: New product features
- [x] 1. Real trip detection (gap of more than 2 days starts a new trip) and an "All trips" list; fourth demo persona with three trips
- [x] 2. Collection goals with a commemorative seal (five goals, derived from visible stamps)
- [x] 3. Privacy centre: export and delete my data
- [x] 4. Notification preferences and digest preview (PRD US15)
- [ ] 5. Per-stamp share image
- [ ] 6. Year in review
- [ ] 7. Analytics view from the PRD event spec
- [ ] 8. Retroactive backfill demo (PRD Phase 2)

## Track 3: Visual craft
- [ ] 1. Cover opening / page-turn transition (reduced-motion safe)
- [ ] 2. Paper grain from SVG noise, separate night variant
- [ ] 3. Stamp variety (ink density, smudged and double-struck variants, gold commemorative)
- [ ] 4. Print stylesheet
- [ ] 5. Microcopy and empty-state pass
- [ ] 6. Optional haptics behind a setting

## Track 4: Engineering quality
- [x] 1. ESLint, wired into CI (Prettier deliberately skipped: it would rewrite every file for no user benefit)
- [ ] 2. JSDoc types and `tsc --checkJs`
- [ ] 3. Visual-regression screenshots with pixel-diff test
- [ ] 4. Partial re-rendering for search and a render-time budget
- [ ] 5. Performance and size budget, Lighthouse in CI
- [ ] 6. Split `views.js` per screen; extract a `counts()` helper
- [x] 7. Property-style tests for `rules.js` invariants (300 random purchase sets: FR1, FR2, FR3, FR9, US10, US11)

## Next plan (UI/UX and features found in review)
Ordered by value to a real user. None of these needs a decision from the owner.
1. **Stamp detail share image.** Needs a dedicated canvas drawer (the stamp SVG relies on page CSS and a shared ink filter, so it cannot be rasterised on its own). Draw the stamp shape and text directly, like `drawShareImage` does for recaps.
2. **First-run payoff.** After onboarding, open on the newest stamp with a one-line "Next goal" hint instead of the bare grid. Goals currently sit below the fold.
3. **Compact goals strip** at the top of the Passport tab (next goal and progress), with the full list below.
4. **Empty states and microcopy pass** (Track 3 item 5): friendlier copy for no stamps, no trips, offline, deleted data.
5. **Year in review** and **analytics view** (Track 2 items 6 and 7), built on the same derived-data pattern as goals.
6. **Retroactive backfill demo** (PRD Phase 2): a one-time "we found 12 months of stamps" moment after opting in.
7. **Additional cardholders (PRD US12):** needs a `holder` field on transactions and a rule that keeps another holder's activity out of this Passport, with a property test.
8. **"New city dining" stamp** when a meal has no cuisine data (PRD FR3 allows it, nothing issues it today).
9. **Craft:** page-turn cover transition, paper grain, stamp variety, print stylesheet.
10. **Engineering:** split `views.js` per screen, JSDoc + `tsc --checkJs`, visual-regression screenshots, Lighthouse budget in CI.

## Pass log
See [CHANGELOG.md](CHANGELOG.md).
