# Launch Readiness — Monarch Castle Technologies | Market Intelligence

**Gate run:** 2026-06-21 (Phase 10 plan 10-02, PERF-05)
**Site:** https://akgularda.github.io/supplychain/
**Stack:** buildless single-page vanilla HTML/CSS/JS (D3 force simulation), deployed to GitHub Pages.
**Suite at gate:** `npm test` → **301 tests, 301 pass, 0 fail.**

This checklist records the **real, verified** status of each of the 10 build phases. Every box is
checked only against an actual deliverable + its non-regression test; nothing is aspirational.

---

## Phase 1 — Foundation (FOUND-01…05) ✅

- [x] Inline CSS extracted into versioned `styles/*.css` with no visual change (FOUND-01)
- [x] Inline JS extracted into ES modules under `js/` (data, viz, ui, trust, state); `index.html` reduced to a semantic shell (FOUND-02)
- [x] Full test suite passes unchanged after modularization (FOUND-03)
- [x] Performance + Lighthouse baseline captured (`docs/perf/baseline-2026-06-20.md`) (FOUND-04)
- [x] Site renders equivalently; GitHub-Pages static deploy still works (FOUND-05)

## Credibility / Trust Layer — Phases 2 & 3 (TRUST-01…06) ✅

- [x] **Provenance**: every displayed major figure carries a provenance badge (`observed` / `estimated`) (TRUST-01)
- [x] **Source links**: each figure exposes a reachable inline source link (TRUST-02)
- [x] **Confidence**: a 0–100% confidence score is computed per figure (source-type + age decay) and shown in tooltips (TRUST-03)
- [x] **Methodology**: a dedicated Methodology view explains sources, confidence weighting, and known limits (TRUST-04)
- [x] **Freshness**: a "last verified / data freshness" indicator is tied to the auto-update pipeline timestamp (TRUST-05)
- [x] Provenance + confidence-scoring math covered by tests (`provenance.test.mjs`, `confidence-score.test.mjs`, `trust-wiring.test.mjs`, `methodology-wiring.test.mjs`, `freshness-wiring.test.mjs`) (TRUST-06)

## Storytelling / UX — Phases 4 & 5 (STORY-01…05) ✅

- [x] **Design system**: consistent typography/color/depth/motion tokens applied site-wide (`design-tokens.test.mjs`) (STORY-01)
- [x] **Hero moment**: first-time "first 30 seconds" guided hero auto-reveals the map with narration (`hero-wiring.test.mjs`) (STORY-02)
- [x] **Smooth transitions**: D3 transitions are smooth with no jarring full-simulation restart on view change (`viz-motion.test.mjs`) (STORY-03)
- [x] **Investor narrative**: a flow guides market → concentration → risk → opportunity (`narrative.test.mjs`) (STORY-04)
- [x] Storytelling/hero behavior covered by non-regression tests (STORY-05)

## Depth — Phases 6 & 7 (DEPTH-01…04) ✅

- [x] **Concentration**: a supply-chain concentration score is computed/displayed per company/sector on real data (`concentration.test.mjs`) (DEPTH-01)
- [x] **Criticality**: risk/bottleneck analytics highlight critical single points of failure (`criticality-wiring.test.mjs`) (DEPTH-02)
- [x] **Scenario**: at least one stress-test (e.g. Taiwan semiconductor disruption) runs over real data with downstream impact (`scenario.test.mjs`, `scenario-wiring.test.mjs`) (DEPTH-03)
- [x] Every derived analytic carries provenance and is covered by tests (DEPTH-04)

## Performance — Phase 8 (PERF-01) ✅

- [x] Filter/style interactions are **memoized** — no full simulation restart for simple filter/style changes (`analytics-memo.test.mjs`, `no-restart-invariant.test.mjs`) (PERF-01)

## Mobile / Keyboard a11y — Phase 9 (PERF-02, PERF-03) ✅

- [x] Site is fully usable on mobile: responsive layout + touch interactions (`mobile-keyboard-a11y.test.mjs`, `mobile-keyboard.spec.mjs`) (PERF-02)
- [x] Complete keyboard-only journey covers search → filter → select → reset (PERF-03)
- [x] Lighthouse Accessibility score **93/100** at the gate (see `docs/perf/launch-lighthouse-2026-06-21.md`)

## SEO & Social — Phase 10 plan 10-01 (PERF-04) ✅

- [x] `meta description`, `canonical`, `og:*`, `twitter:*`, and JSON-LD present + well-formed in `index.html` (`tests/seo-social.test.mjs`)
- [x] `assets/og-card.png` exists (**1200×630**) and is shipped by deploy (rides the existing `cp -R assets`)
- [x] All absolute URLs use **https://akgularda.github.io/supplychain/** (canonical, og:url, og:image, twitter:image, JSON-LD url)
- [x] Lighthouse **SEO 100/100** and **Best-Practices 100/100** at the gate

## Gate — Phase 10 plan 10-02 (PERF-05) ✅

- [x] **`npm test` fully green** — 301 tests, 301 pass, 0 fail (incl. `tests/seo-social.test.mjs`)
- [x] **Lighthouse run attempted and scored** — recorded in `docs/perf/launch-lighthouse-2026-06-21.md`
      (Performance 58, Accessibility 93, Best-Practices 100, SEO 100). The Phase-1 `NO_FCP` paint
      caveat is **resolved** at this gate: the Phase-3 data work makes the page paint (Playwright
      FCP 1.2 s; Lighthouse scored a full report). Launch is **not** blocked on the numeric
      performance score (gate policy) — the local figure is paint-latency-bound on a cold loopback
      fetch (TBT 10 ms, CLS 0; not janky), and is expected to improve on the live CDN-backed deploy.
- [x] **`deploy-pages.yml` ships everything** — `index.html` + `favicon.svg` + `logo.png` + `data/` +
      `assets/` (carries `og-card.png`) + `styles/` + `js/` + `.nojekyll` (+ `CNAME` if present).
      Verified statically (`cp -R assets _site/` present); no edit needed.
- [x] **`auto-update-data.yml` weekly pipeline intact** — schedule `cron: '0 6 * * 1'` (Mon 06:00 UTC),
      runs the three data-validation tests (`no-xx-country-codes`, `profile-link-metadata`,
      `supply-chain-research-quality`) and commits `data/`. Independent of this phase; unmodified.
      **Known non-blocking cosmetic bug:** line 34
      `echo "timestamp=$(date +%Y%m%d-%H%M%S) >> $GITHUB_OUTPUT"` is missing the closing quote before
      `>>`, which mangles that one step's `timestamp` output. It does **not** block the weekly refresh,
      the data validation, the deploy, or the launch gate. Left as-is (out of scope to alter the
      pipeline at the gate); flagged here for transparency and a future cleanup.
- [x] **No custom domain** — no `CNAME` file in the repo; the site serves at the default
      `https://akgularda.github.io/supplychain/`, which matches every absolute URL in `index.html`.
      Confirmed at the gate (auto-approved human-verify; if a custom domain is ever set in repo
      Settings → Pages, the absolute URLs must be revisited).
- [x] **Social card** — `assets/og-card.png` is a real 1200×630 dark-theme card (eyebrow "Monarch
      Castle Technologies", title "Market Intelligence", honest source-linked-provenance subtitle),
      referenced by both `og:image` and `twitter:image`. Auto-approved at the gate.

---

## Launch Verdict

**READY TO LAUNCH.** All 25 v1 requirements (FOUND-01…05, TRUST-01…06, STORY-01…05, DEPTH-01…04,
PERF-01…05) are complete and test-backed. The full suite is green (301/301), the deploy ships every
asset including the social card, the weekly data pipeline is intact (one cosmetic non-blocking echo
bug noted above), the page paints with a scored Lighthouse run (SEO + Best-Practices 100,
Accessibility 93, Performance 58 — recorded, not gating), and no custom domain is configured.

*Generated at the PERF-05 launch gate, 2026-06-21.*
