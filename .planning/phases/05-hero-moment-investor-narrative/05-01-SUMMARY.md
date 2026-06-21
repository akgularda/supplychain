---
phase: 05-hero-moment-investor-narrative
plan: 01
subsystem: ui-narrative
tags: [story-04, story-05, narrative, pure-module, wave-0, tdd]
requires:
  - data/top100-map.json (frozen data contract: nodes[].{symbol,company,marketcap,rank,bn,y}, meta.{count,source}, layers map)
provides:
  - "buildNarrative(data): pure DOM-free 4-step ordered narrative engine [market, concentration, risk, opportunity]"
  - "tests/narrative.test.mjs: GREEN step-list contract (order/apply-targets/non-fabricated captions)"
  - "tests/hero-wiring.test.mjs: INTENDED-RED overlay+controller+main wiring contract (closed by Plans 02/03)"
affects:
  - js/main.js (Plan 03 will import buildNarrative + build the controls object)
  - index.html (Plan 03 will add the #heroOverlay markup the wiring test pins)
tech-stack:
  added: []
  patterns:
    - "Pure injected-controls seam — apply(controls) calls openGlobal/highlightBy/openProfile; zero DOM/d3/window so it unit-tests in Node"
    - "Data-derived captions — every figure recomputed at runtime from the passed data; proven non-fabricated via two-fixture diff"
    - "Wave 0 intended-RED test gate registered up front (mirrors 04-01)"
key-files:
  created:
    - js/ui/narrative.js
    - tests/narrative.test.mjs
    - tests/hero-wiring.test.mjs
  modified:
    - package.json
decisions:
  - "topSymbol = highest-marketcap node that is ALSO bn (fallback: highest-marketcap overall) — makes opportunity the payoff of risk; never hardcoded, robust to weekly refresh"
  - "Captions stay honest: combined cap framed observed-from-source; bn/layer framed as derived aggregates (no new sourced claim) per STORY-04"
  - "buildNarrative imports neither a DOM global nor js/ui/index.js (RESEARCH Pitfall 5) — keeps the module Node-importable"
metrics:
  duration_min: 3
  tasks: 2
  files: 4
  completed: 2026-06-21
---

# Phase 05 Plan 01: Narrative Engine + Wave 0 Test Gate Summary

Pure, DOM-free `buildNarrative(data)` returns the ordered 4-step investor narrative (market -> concentration -> risk -> opportunity), each step `{ id, title, caption, apply(controls) }`, with every caption number computed at runtime from real data; both Phase-5 test files are registered in `scripts.test`.

## What Was Built

**Task 0 — Wave 0 test gate (commit b84150e):**
- Appended `tests/narrative.test.mjs tests/hero-wiring.test.mjs` to the single `node --test` string in `package.json scripts.test` (16 prior files preserved, now 18).
- `tests/narrative.test.mjs` (GREEN this plan): asserts 4 ordered ids; non-empty string title/caption + function apply per step; apply-target spies (market->openGlobal, concentration->highlightBy, risk->highlightBy, opportunity->openProfile); the opportunity symbol equals the highest-marketcap-and-bn fixture node; predicate correctness for risk (`d.bn`) and concentration (dominant `d.y`); and the non-fabricated contract via a two-fixture diff (market + risk captions differ; market caption contains the fixture-derived combined cap and meta.count).
- `tests/hero-wiring.test.mjs` (INTENDED RED): string-presence assertions for the `#heroOverlay` dialog + `#heroTitle/#heroCaption/#heroProgress/#heroNext/#heroPrev/#heroPause/#heroSkip/#bTour` IDs, `createHeroController` + reduced-motion guard in the module, and `heroSeen`/`safeReadFlag`/`safeWriteFlag`/`#bTour` wiring in `js/main.js`. A top-of-file comment documents the intended-RED status (closed by Plans 02/03).

**Task 1 — pure buildNarrative (TDD, commit 9ca7136):**
- `js/ui/narrative.js` exports `buildNarrative(data)`. Derives at runtime: combined market cap (Σ marketcap / 1e12), bn count, dominant layer index + name + count, and the top-cap bottleneck symbol (with overall-top fallback). Returns the 4 step objects whose `apply` functions call only the injected controls.
- DOM-free: no `import`, no `document`/`window` code references, no `js/ui/index.js` import. Verified importable in plain Node.

## TDD Gate Compliance

- RED: `test(05-01)` commit b84150e — narrative suite failed (module absent).
- GREEN: `feat(05-01)` commit 9ca7136 — narrative suite passes (7/7).
- REFACTOR: none needed.

## Test Results

`npm test` = 203 tests / 198 pass / 5 fail.
- +7 new narrative assertions GREEN.
- 191 prior tests unchanged (no regression).
- 5 failing = the INTENDED Wave 0 RED hero-wiring assertions (overlay markup + controller factory + reduced-motion guard + main heroSeen wiring), satisfied by Plans 02 and 03. Pattern matches STATE 04-01.
- `node --test tests/narrative.test.mjs` = 7/7 fully green.

## Deviations from Plan

**1. [Rule 1 - Bug] opportunity top-symbol must prefer bn nodes**
- **Found during:** Task 1.
- **Issue:** The RESEARCH reference snippet computed `topByCap` as the single global highest-marketcap node, but Task 1 `<behavior>` and the non-negotiables require the highest-marketcap node that is ALSO `bn` (with fallback). A pure global-max would pick a non-bottleneck symbol when the top company is not flagged, breaking the "bottleneck you can invest in" payoff.
- **Fix:** Sort by marketcap desc, then `.find(n => n.bn) || byCapDesc[0]`. A dedicated test (`opportunity prefers the highest-marketcap bottleneck, falling back...`) pins both branches.
- **Files modified:** js/ui/narrative.js, tests/narrative.test.mjs.
- **Commit:** 9ca7136 (impl) / b84150e (test).

## Threat Surface

No new threat surface. T-05-01 (caption text -> DOM) is deferred to Plan 03's render step (must use textContent); buildNarrative produces plain strings, no HTML. T-05-02: zero packages installed; package.json dependencies unchanged.

## Known Stubs

None. The intended-RED hero-wiring assertions are a forward test contract, not stubs — they pin behavior Plans 02/03 implement.

## Self-Check: PASSED

All created files exist on disk (js/ui/narrative.js, tests/narrative.test.mjs, tests/hero-wiring.test.mjs, 05-01-SUMMARY.md) and both task commits (b84150e, 9ca7136) are in git history.
