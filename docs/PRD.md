# PRD: Dining Stamps, Domestic Stamps and Trip Recap for Amex Passport

**Author:** mq-umar (independent candidate) · **Status:** Concept / portfolio draft · **Date:** November 22, 2026

> **Disclaimer.** Independent portfolio concept by an outside candidate, not affiliated with American Express. Public information only; no inside knowledge, internal data or metrics. Any number not cited is marked **ASSUMPTION** with reasoning and a validation method. No logos or brand assets.

---

## 1. Summary and one-sentence pitch

**Pitch:** Make Amex Passport worth opening every month, not once a year, by turning memorable meals and domestic trips into stamps and wrapping each trip into a shareable recap.

Passport today rewards one behavior: transacting internationally. Card Members who rarely travel abroad see it sit idle for months. This concept adds: (1) **dining stamps** for memorable meals (new cuisine, new city); (2) **domestic stamps** for U.S. cities and states visited; (3) **Trip Recap**, an auto-generated, editable, privacy-safe summary of each trip that can be shared. The aim is higher adoption, monthly engagement and retention among infrequent international travelers, without adding privacy, fraud or compliance risk.

---

## 2. Current state of Amex Passport (with sources)

- **Launch.** Amex announced the Travel App (inspiration, planning, booking) and Passport on Sept 15, 2025; iOS launched Sept 18, 2025, Android to follow ([Amex Newsroom](https://www.americanexpress.com/en-us/newsroom/articles/travel-and-dining/american-express-launches-all-in-one-travel-app-and-digital-tool.html); [Business Wire](https://www.businesswire.com/news/home/20250915003810/en/American-Express-Launches-All-in-One-Travel-App-and-Digital-Tools-to-Simplify-and-Enhance-the-Premium-Travel-Journey); [Travel Noire](https://travelnoire.com/amex-travel-app-new-american-express)).
- **Earning.** Eligible U.S. Consumer Card Members enroll, then earn a stamp per country or region where they transact internationally; launch coverage cited a two-year retroactive window ([TheStreet](https://www.thestreet.com/crypto/markets/american-express-taps-blockchain-in-new-all-in-one-travel-app)). Later reports from [CoinTrust](https://www.cointrust.com/market-news/american-express-expands-blockchain-based-digital-travel-stamps) and [Fast Company](https://www.fastcompany.com/91591981/american-express-best-workplaces-for-innovators-2026) say this expanded to trips back to 2019 (I found no Amex primary source, so treat as reported).
- **Access and actions.** At launch it sat in the main Amex app (Account → Settings → Try New Features). Card Members can view stamps, add trip highlights, share by text or social media, and save to the camera roll.
- **Technology.** Each stamp is an ERC-721 token on Base (an Ethereum L2): no monetary value, not transferable, no fees to the member; Amex avoids the term "NFT" ([Motley Fool](https://www.fool.com/investing/2025/09/18/american-express-built-a-blockchain-passport/); [Benzinga](https://www.benzinga.com/personal-finance/management/25/09/47821065/american-express-introduces-nft-travel-stamps-for-customers)). Reportedly stamps hold only location, short description and date, no personal information ([Bits of Blocks](https://www.bitsofblocks.io/post/a-trip-worth-minting-amex-launches-digital-stamps)).
- **Stated demand (Amex survey).** 73% want more digital ways to commemorate trips; 56% miss receiving a passport stamp (Amex Newsroom).
- **Public criticism and limits.** International-only, so domestic travel and dining earn nothing; called "bare-bones" and easy to miss (Motley Fool); visit data on a public chain is inspectable and corporate cards are excluded ([BitcoinNewsInvest](https://bitcoinnewsinvest.com/american-express-turns-travel-memories-into-nft-passport-stamps/)); some see NFTs as dated ([Bitget](https://www.bitget.com/news/detail/12560604977452)). Adoption figures are unofficial (one outlet: ~20,000 stamps soon after launch). I found no user reviews or forum threads.

**Gaps addressed:** no reason to return between international trips; dining unused; sharing is per stamp, not per trip story; public-chain privacy needs care for any new stamp type.

---

## 3. Customer problem and evidence

**Problem.** Card Members who travel mostly within the U.S., or abroad rarely, get little value from Passport. Their memorable moments (a weekend in Nashville, a first Ethiopian meal) go uncaptured, so Passport becomes a one-time novelty.

| Underserved segment | Why | Evidence / reasoning |
|---|---|---|
| Domestic-heavy travelers | Domestic trips earn nothing | International-only rule (Section 2) |
| Frequent diners | Dining spend never touches Passport | Dining is a core card category, unused here |
| Infrequent international travelers | Months of silence between stamps | **ASSUMPTION:** most members travel abroad less than once a year, since a minority of Americans do so annually. Validate with an internal trip-frequency distribution |

The evidence is directional: Amex's survey shows commemoration demand, but nothing public measures Passport engagement.

**Research I would run**
1. **Funnel/cohort analysis (internal data request):** enrollment, MAU, gap between sessions by trip frequency. Confirms the drop-off is real.
2. **8–10 interviews** across the personas on how people remember trips and meals and what they share.
3. **Survey (ASSUMPTION n≈400; ±5 pp at 95%):** interest in dining/domestic stamps, comfort with spend-derived stamps, preferred share formats.
4. **Social listening and competitive teardown:** r/amex, r/churning, app-store reviews; Google Maps Timeline, Swarm, Beli, Spotify/Strava recaps for formats and privacy defaults.
5. **Two-week diary study (6–8 people)** of "moments worth remembering."

---

## 4. Target users and 3 personas (with jobs-to-be-done)

**Target:** enrolled or eligible U.S. Consumer Card Members with at most one international trip in 12 months but regular dining and/or domestic travel spend.

| Persona | Profile | Job-to-be-done |
|---|---|---|
| **Maya, Weekend Explorer** | 31, Chicago; 4–6 domestic weekend trips a year, abroad every 2–3 years | *When I get back from a weekend trip, I want a beautiful summary of where I went and ate, so I can relive and share it without assembling it myself.* |
| **Daniel, Urban Foodie** | 42, NYC; dines out 2–3×/week, rarely travels | *When I try a new cuisine or standout restaurant, I want it remembered automatically, so I can track my food adventures and recommend places.* |
| **Priya, Aspirational Traveler** | 36, Dallas; one big international trip a year, opened Passport once | *Between big trips, I want to see my travel story grow, so I stay excited about the next one.* |

---

## 5. Goals, non-goals and success metrics

**Goals:** (1) a monthly reason to open Passport for underserved members; (2) trips, domestic or international, become easy-to-share stories; (3) higher retention between international trips.

**Non-goals (MVP):** no tradable or monetized collectibles; no new points or credits tied to stamps; no device GPS (stamps come only from posted card transactions); no merchant data on-chain; no corporate cards.

All baselines and targets are **ASSUMPTIONS** to be replaced with internal baselines in discovery.

| Metric | Type | Definition and measurement | Baseline | Target | Reasoning / validation |
|---|---|---|---|---|---|
| Enrollment rate (target segment) | Adoption | Enrolled ÷ eligible; `passport_enroll` | 8% | 12% at 6 mo | New earning paths give a reason to enroll; check against internal funnel |
| Passport MAU / enrolled | Engagement | % opening Passport ≥1× per month; `passport_opened` | 10% | 20% | Recurring stamps create a recurring trigger; pilot data |
| Recap share rate | Engagement | Recaps shared ÷ generated; `recap_shared` | 3% (per-stamp) | 8% | Trip stories share better than single items; Exp. H2 |
| 90-day return rate | Retention | % of enrollees with a session in days 61–90 | 15% | 25% | Core inter-trip signal; Exp. H1 |
| Unenroll / hide rate | Guardrail | % unenrolling or disabling new types in 30 days | 2% | ≤3% | Spike signals creepiness |
| Privacy complaints | Guardrail | Care contacts tagged privacy/Passport per 10k enrolled | unknown | No significant rise vs. control | Required by Compliance |
| Spend neutrality | Guardrail | Dining spend share, treatment vs. control | n/a | Monitored, not optimized | Responsible-design commitment |

---

## 6. User journeys (current vs. proposed)

*Scenario: Maya's 3-day Nashville trip with 4 restaurant meals.*

| Step | Current | Proposed |
|---|---|---|
| 1. Before | No Passport touchpoint for domestic travel | One-time card explains new stamp types, with opt-in toggles |
| 2. Spending | Nothing happens | Posted transactions beyond 75 miles (ASSUMPTION) from home earn a Nashville city stamp, a Tennessee state stamp and a "Southern" cuisine stamp |
| 3. Trip ends | n/a | After 48 hours with no further away-from-home spend, a Trip Recap is generated |
| 4. Review | n/a | Maya renames it, hides one restaurant, adds a photo |
| 5. Share | Single international stamps only | Shares recap as an image: no amounts, merchant names off by default |
| 6. After | Passport forgotten until next international trip | Progress ("6 states, 14 cuisines") gives a reason to return |

---

## 7. Scope: MVP vs. later phases (a prioritized backlog)

| # | Item | Phase | Priority | Notes |
|---|---|---|---|---|
| 1 | Domestic city and state stamps from posted transactions | MVP | Must | Widest reach |
| 2 | Dining stamps (new cuisine, new-city dining) | MVP | Must | Needs merchant cuisine metadata |
| 3 | Auto Trip Recap (domestic and international) | MVP | Must | Core shareable artifact |
| 4 | Recap editing (rename, hide, one photo) | MVP | Must | Control builds trust |
| 5 | Privacy controls: per-type toggle, per-stamp hide, share redaction | MVP | Must | Gate for Legal/Compliance |
| 6 | Refund/dispute handling | MVP | Must | See Section 9 |
| 7 | Notification preferences and digest | MVP | Should | Opt-in, capped |
| 8 | Retroactive domestic/dining stamps (12 months) | Phase 2 | Should | Strong "aha" at enrollment |
| 9 | Reservation-linked dining stamps (e.g., Resy) | Phase 2 | Could | Partner integration and consent |

---

## 8. User stories with acceptance criteria

| # | Story | Acceptance criteria (Given / When / Then) |
|---|---|---|
| US1 | As an eligible Card Member, I want to opt in to dining and domestic stamps separately, so that I control what Passport tracks. | **Given** I'm enrolled, **when** I first open Passport after release, **then** I see separate toggles (off until chosen) and my choice is editable in Settings. |
| US2 | As a domestic traveler, I want a city stamp when I spend in a new city far from home, so that domestic trips count. | **Given** I opted in, **when** a posted transaction is beyond the distance threshold in a city I have no stamp for, **then** a city stamp appears within 24 hours, dated to the transaction. |
| US3 | As a traveler, I want a state stamp for each new state, so that I can track my progress. | **Given** no stamp for State X, **when** my first qualifying transaction there posts, **then** I earn the State X stamp and my counter updates. |
| US4 | As a foodie, I want a stamp for a new cuisine, so that my food adventures are remembered. | **Given** I opted in to dining stamps, **when** a dining transaction posts for a cuisine I lack, **then** I earn a cuisine stamp; **and** if cuisine data is missing, no cuisine stamp is issued. |
| US5 | As a Card Member, I want trips grouped automatically, so that I don't organize anything. | **Given** two or more qualifying away-from-home transactions, **when** 48 hours pass with no further away spend, **then** one trip is created with dates and places. |
| US6 | As a traveler, I want a recap after each trip, so that I can relive it. | **Given** a trip has closed, **when** the recap generates, **then** I see dates, places, stamps and dining count, plus one notification if opted in. |
| US7 | As a traveler, I want to edit my recap, so that it reflects my memory. | **Given** I'm viewing a recap, **when** I rename it, hide an item or add a photo, **then** the change saves and stays private unless I share. |
| US8 | As a privacy-conscious member, I want shares to omit spend details by default, so that I don't overshare. | **Given** I tap Share, **when** the image is built, **then** it shows no amounts or card details, merchant names are off by default, and a preview shows exactly what will be shared. |
| US9 | As a member, I want to hide any new-type stamp, so that sensitive places stay private. | **Given** a dining or domestic stamp, **when** I choose Hide, **then** it disappears from Passport, recaps and shares, and I can restore it from Settings. |
| US10 | As a member who got a refund, I want stamps from refunded purchases handled correctly, so that Passport stays accurate. | **Given** a stamp's only qualifying transaction is fully refunded, **when** the refund posts, **then** the stamp is removed within 24 hours and logged; stamps backed by other transactions remain. |
| US11 | As a member disputing a charge, I want no stamp celebrating it, so that the experience isn't tone-deaf. | **Given** a transaction is disputed or fraud-flagged, **when** it would earn a stamp, **then** none is issued; an existing stamp is hidden until resolution. |
| US12 | As a Basic Card Member, I want additional-card activity kept out of my Passport, so that nobody's activity leaks. | **Given** an additional Card Member transacts in a new city, **when** it posts, **then** the stamp goes only to that holder's Passport if enrolled and never appears in mine. |

*Offline viewing, screen-reader support and notification caps are covered as requirements in Section 9 and tested in UAT (Section 14).*

---

## 9. Functional requirements and edge cases

**Requirements**
- **FR1** Stamps issue only from **posted** transactions, never pending.
- **FR2** Domestic eligibility uses merchant location vs. billing-address area with a 75-mile threshold (ASSUMPTION; backtest against historical trips). No device location. Card-not-present transactions are excluded.
- **FR3** Dining eligibility uses merchant category plus a cuisine taxonomy; missing or low-confidence cuisine yields a "new city dining" stamp at most, never a guessed cuisine.
- **FR4** A trip closes after 48 hours (ASSUMPTION) without further away-from-home spend.
- **FR5** Recaps are generated within 24 hours of trip close, stored server-side, private by default.
- **FR6** Share images exclude amounts, card numbers, card art and identifiers; merchant names are opt-in per item.
- **FR7** New stamp types are **off-chain** in the MVP; merchant names never go on-chain. On-chain city/state stamps are an open decision (Section 15).
- **FR8** Per-type toggles and per-stamp hide; disabling a type stops issuance and hides existing stamps of that type.
- **FR9** Abuse limits: max 10 new stamps/day and $5 minimum transaction (both ASSUMPTIONS) to deter card testing; sensitive merchant categories excluded via a dining-only allow-list.
- **FR10** Accessibility: WCAG 2.2 AA, descriptive labels per stamp, reduced-motion support; push cap of 1 per day.

| Edge case | Expected behavior |
|---|---|
| Offline | Cached Passport and recaps readable (last 30 days); edits queue encrypted and sync on reconnect (last-write-wins, user notified); shares carry a "may be out of date" note |
| Declined or failed charge | No stamp (posted-only) |
| Full refund or reversal | Remove stamp if no other qualifying transaction supports it; recompute recap; for any on-chain stamp, hide in UI and burn if the contract supports it (open question) |
| Dispute or fraud flag | Hold issuance; hide an existing stamp until resolution; remove permanently if fraud confirmed |
| Additional/authorized-user cards | Stamp attributed to the transacting member's own Passport only |
| Account closure / unenroll | Off-chain data deleted per retention policy; disclosure notes any on-chain token persists without PII |

---

## 10. Experiment plan

Baselines, MDEs and traffic are **ASSUMPTIONS**. Sample sizes use n per arm ≈ (z₁₋α/2 + z₁₋β)² · 2p(1−p) / δ², with α = 0.05 and power = 0.80.

**H1: Dining and domestic stamps raise inter-trip retention.**
- *Design:* Randomize new target-segment enrollees; control = today's Passport, treatment = new stamps plus Recap.
- *Primary:* 90-day return rate. *Secondary:* Passport MAU. *Guardrails:* unenroll rate, privacy contacts.
- *Sample:* baseline 15%, MDE +2.5 pp → (2.80)² · 2 · 0.15 · 0.85 / 0.025² ≈ **3,200 per arm**; at ~1,000 enrollees/week (ASSUMPTION) about 7 weeks.
- *Duration:* 7 weeks enrollment plus 90-day observation; 30-day interim read on MAU.
- *Decision:* Ship if ≥ +2.5 pp, p < 0.05 and no guardrail breached. Iterate if positive but not significant. Stop if unenroll rises > 1 pp.

**H2: A recap notification raises sharing.**
- *Design:* Within treatment, A = recap findable in Passport, B = recap plus one trip-close notification.
- *Primary:* recap share rate. *Secondary:* view rate, notification opt-out.
- *Sample:* baseline 5%, MDE +1.5 pp → (2.80)² · 2 · 0.05 · 0.95 / 0.015² ≈ **3,300 trips per arm**.
- *Duration:* until sample reached, at least 4 weeks.
- *Decision:* Ship notification if share rate rises significantly and opt-out stays under 2% (ASSUMPTION).

**H3: Privacy-first share defaults don't reduce sharing (non-inferiority).**
- *Design:* A = merchant names shown by default, B = hidden by default (proposed).
- *Primary:* share completion rate; non-inferiority margin −1 pp.
- *Sample:* one-sided α = 0.05, share rate 8% → (1.645 + 0.84)² · 2 · 0.08 · 0.92 / 0.01² ≈ **9,100 attempts per arm**; about 6–8 weeks.
- *Decision:* If B is non-inferior, keep privacy-first. If inferior, test better copy, not names-on, because privacy wins ties.

---

## 11. Analytics and instrumentation

| Event | Trigger | Key properties |
|---|---|---|
| `passport_opened` | Passport viewed | entry_point, is_offline |
| `passport_enroll` / `passport_unenroll` | Enrollment change | source, stamp_types_enabled[] |
| `stamp_earned` | Stamp issued | stamp_id, stamp_type, is_retroactive, cuisine_category, location_level, on_chain |
| `stamp_viewed` / `stamp_hidden` | User action | stamp_id, stamp_type |
| `stamp_revoked` | System removal | stamp_id, reason_code (refund/dispute/fraud/misattribution) |
| `trip_grouped` | Trip closes | trip_id, trip_type, duration_days, stamp_count |
| `recap_generated` / `recap_viewed` / `recap_edited` | Recap lifecycle | recap_id, edit_type, entry_point |
| `recap_shared` | Share completed | recap_id, channel, merchant_names_included, photo_included |
| `privacy_setting_changed` | Setting change | setting, old_value, new_value |

**Principles:** no amounts, merchant names or precise locations in analytics payloads (categories and IDs only, e.g., location_level); pseudonymous internal IDs; dashboards live before pilot; event QA is part of UAT.

---

## 12. Risks and mitigations

| Risk | Area | Mitigation |
|---|---|---|
| Spend-derived stamps feel like surveillance | Privacy | Per-type opt-in, clear explainer, per-stamp hide, sensitive-category exclusion, no GPS |
| Dining/domestic data exposed on a public chain | Privacy / Web3 | Off-chain in MVP; never put merchant names on-chain; privacy review before any on-chain extension |
| New use of transaction data without proper notice | Data use / Legal | Legal and Privacy review of notices and consent against applicable law (e.g., GLBA, state privacy laws such as CCPA); purpose limitation; retention policy |
| Gamification seen as encouraging spend | Compliance / Brand | No "spend to unlock" copy or spend goals; Compliance copy review; spend-neutrality guardrail |
| Card testing to farm stamps | Fraud | Posted-only issuance, minimum amount, velocity caps, dispute/fraud exclusion, Fraud team review |
| Immutability conflicts with refunds | Web3 | Off-chain MVP; for on-chain stamps, issuer burn function or UI-level hiding |
| NFT skepticism and "crypto" perception | Brand / Web3 | Keep "stamp" language, no wallets or trading, "no monetary value" disclosure; Legal review so stamps are never framed as investments |
| Accessibility gaps in an illustration-heavy feature | Accessibility | WCAG 2.2 AA, alt text, reduced motion, dynamic type, pre-GA audit |

---

## 13. Dependencies and cross-team needs

| Team | Need | When |
|---|---|---|
| Design / UX Research | Stamp illustration system, recap templates, privacy UX, Section 3 research | Before build |
| Mobile and Backend Engineering | Passport UI, offline cache, eligibility engine, trip grouping, recap service, revocation pipeline | Build (long lead) |
| Blockchain / Digital Labs | On-chain decision; burn/revoke capability if needed | Discovery |
| Data / Analytics | Baselines, backtests, event spec, dashboards, experiment analysis | Discovery to post-launch |
| Legal and Compliance/Privacy | Consent and notice language, collectible framing, privacy impact assessment, copy review | Before pilot |
| Fraud / Security | Abuse limits, dispute-signal integration, security review | Before pilot |
| Dining partners (e.g., Resy) | Reservation-linked stamps and consent | Phase 2 |

---

## 14. Rollout plan and launch readiness checklist

All phases sit behind a feature flag with a kill switch.

| Phase | Audience | Duration (ASSUMPTION) | Exit criteria |
|---|---|---|---|
| 0. Dogfood | Employees with eligible cards | 2–3 weeks | No open P0/P1; stamp accuracy ≥95% on manual audit |
| 1. Pilot (1%) | Randomized target segment (starts H1) | 4 weeks | Guardrails within thresholds; crash-free ≥99.8% |
| 2. Ramp (10% → 50%) | Expanded segment | 4–6 weeks | H1/H2 interim reads positive or neutral; no Compliance issues |
| 3. GA | All eligible enrollees | n/a | H1 decision rule met; checklist complete |

**UAT approach.** Scripted scenarios from every Section 9 edge-case row and every Section 8 story. Test profiles: domestic traveler, international traveler, frequent diner, additional-card household, disputing user, refund user. Offline and assistive-technology passes included. Sign-off from Product, Design, Engineering, Compliance and Accessibility.

**Defect tracking.** Every defect is logged in the team tracker (e.g., Jira) with severity, repro steps and a linked story or edge case. **P0** (data exposure, wrong-person attribution, crash): fix before any ramp, kill switch if live. **P1** (wrong stamp issued/revoked, broken share): fix before next ramp. **P2** (UX defect with workaround): fix before GA. **P3** (cosmetic): backlog. Daily triage during pilot; burn-down reviewed at each gate.

**Post-launch monitoring.** Dashboards for funnel, issuance and revocations by reason, recap shares and guardrails. Alert thresholds (ASSUMPTIONS): revocation rate > 2%/day, unenroll rate > 2× control, any additional-card attribution error, crash-free < 99.7%. Daily review for 2 weeks, then weekly, plus 30/60/90-day business reviews.

**Launch readiness checklist**
- [ ] Privacy impact assessment approved
- [ ] Legal sign-off on terms, consent and collectible framing
- [ ] Compliance copy review complete
- [ ] Fraud controls verified in production
- [ ] Accessibility audit passed (WCAG 2.2 AA)
- [ ] Customer Care FAQs and contact tags live
- [ ] No open P0/P1 defects
- [ ] Experiment sample-ratio check passed

---

## 15. Open questions and next steps

**Open questions**
1. Should domestic city/state stamps be minted on-chain (city-level metadata only) for consistency, or stay off-chain?
2. Does the existing contract support issuer burn or revocation?
3. How accurate are merchant cuisine and location data today?
4. Which distance threshold and trip-close window best match real trips?
5. Does current privacy-notice language cover this use of transaction data?
6. Should additional Card Members be independently eligible in the MVP?

**Next steps:** (1) weeks 1–2: baseline data pull, interviews, social listening; (2) weeks 2–3: backtest eligibility rules, build the clickable prototype, hold a privacy/legal pre-read; (3) week 4: lock MVP scope and the on-chain decision; (4) week 5+: build and prepare H1/H2 for pilot.

---

## How I would prototype this with AI

**A 5-step plan with Claude Code**
1. **Scaffold** a mobile-sized React + Vite app with Passport, Trips and Settings tabs in a neutral, non-Amex style; deploy a preview link.
2. **Mock data and rules:** generate fake transaction JSON for the three personas; implement the stamp rules (posted-only, distance threshold, cuisine firsts, trip grouping, refund/dispute) as small unit-tested functions so thresholds can be tuned live.
3. **Core screens:** stamp grid with progress counters, stamp detail, auto Trip Recap and a share preview showing exactly what leaves the app.
4. **Trust and edge states:** per-type opt-in, per-stamp hide, merchant-name toggle, refund/dispute and offline states, screen-reader labels, automated accessibility check.
5. **Test-ready build:** persona switcher and an event log mirroring Section 11; publish for remote unmoderated sessions.

**What I would test:** whether users understand why they earned each stamp; privacy comfort with opt-in spend-derived stamps and which defaults feel right; recap share intent and which elements drive it; whether progress counters create a reason to return; and reactions when a refund removes a stamp.
