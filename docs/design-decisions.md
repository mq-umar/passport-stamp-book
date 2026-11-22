# Design decisions

## The idea: the app is the object

Stamp-collecting is physical: ink, paper, a cover, a crooked impression. Most digital loyalty and "badge" screens flatten that into rounded cards and pills. This prototype goes the other way. The app *is* a passport book, so every screen is built from things a passport or a boarding pass actually has.

| Screen | Metaphor | What it does |
|---|---|---|
| Cover | Cloth-bound cover | Oxblood cover, gold line crest, stitched border. "Close book" returns to it. |
| Passport | Visa pages | Ruled page, stamps pressed at slight angles with ink-bleed edges and postmarks, a collection index at the back. |
| Trips | Boarding pass | Route (CHI to BNA), perforated tear line, barcode, document number. The shared image is the same ticket. |
| Stamp sheet | Page detail | The stamp enlarged with the purchases that earned it. |

## Rules I set for myself

1. **No gradients, glass, glow or soft shadows.** Flat fills, hairlines and one hard offset shadow on desktop. The ruled lines are an SVG pattern, not a gradient.
2. **No emoji, no icon-in-a-rounded-square, no pill chips.** Navigation icons are single-weight line SVGs; filters are underlined mono text.
3. **Type does the work.** Serif display (system Palatino/Georgia stack) for names and numerals, monospace for labels, dates and document numbers, system sans for body copy. No web fonts, so it loads instantly and works offline.
4. **One accent colour.** Oxblood (the cover) for actions and switches. The four stamp inks (ink blue, forest, oxblood, ochre) identify stamp kinds and appear nowhere else.
5. **Shape carries meaning, not only colour.** Cities are round, states are boxed, dining is hexagonal, countries are double-ringed. A colour-blind user can still tell them apart.
6. **Deterministic imperfection.** The "hand-pressed" angle, offset and postmark position come from a hash of the stamp id. They look random but never change between renders or devices, so screenshots and tests are stable.
7. **Night mode is a second paper, not an inversion.** Warm near-black page, cream ink, the same stamp hues lifted for contrast.

## Accessibility

- WCAG 2.0/2.1 A and AA audited with axe-core on every screen in light and night, at phone and desktop widths. The audit runs in CI-style tests (`tests/ui/a11y.ui.mjs`).
- Stamps are real buttons with descriptive names ("Dining stamp, Southern, Oct 9"); the artwork is `aria-hidden`.
- The stamp dialog is modal: the page behind it is `inert`, Tab is trapped, Escape closes, focus returns to the stamp that opened it.
- Focus is preserved across re-renders and moved to the main region after a stamp is hidden.
- `prefers-reduced-motion` removes the press animation. `prefers-color-scheme` switches the paper.
- A layout audit (`tests/ui/layout.ui.mjs`) fails the build if any text overflows, is clipped or pokes out of its container at phone, tablet or desktop widths.
- Tap targets are 44px or larger except small text links, which have 36px hit areas.

## Product rules (from the PRD)

| PRD | Rule in `js/rules.js` |
|---|---|
| FR1 | Only **posted** transactions earn stamps. |
| FR2 | Domestic city/state stamps need a trip more than 75 miles from home. |
| FR3 | Never guess a cuisine: no cuisine data means no cuisine stamp. |
| FR9 | $5 minimum and a per-day cap, to deter card testing. |
| US10 / US11 | Refunded or disputed purchases never earn a stamp. |
| Privacy | Shared images never show amounts or card details; restaurant names are opt-in. Amounts appear only on the stamp sheet. |

## Trade-offs

- **No framework, no build step.** The whole thing runs by opening `index.html`. The cost is a hand-written render loop; the benefit is that a reviewer can read the entire app in an afternoon and it deploys to any static host.
- **Classic scripts, not ES modules,** so it still works from `file://`. Pure logic lives in `js/rules.js`, which is also loaded by Node for unit tests.
- **The whole page re-renders on each change.** At this size it is fast, and it keeps state handling simple; search is debounced because it redraws every stamp.
- **Demo controls live in the product UI** (persona, offline, refund/dispute) because the prototype has no real card feed. They are collapsed at the bottom of every screen.
