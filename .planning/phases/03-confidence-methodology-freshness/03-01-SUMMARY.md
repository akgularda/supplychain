---
phase: 03-confidence-methodology-freshness
plan: 01
subsystem: data-integrity
tags: [data-shape, served-file, weekly-updater, test-scaffolding, blocking]
requires: []
provides:
  - "Rich-shape served data/top100-map.js (window.SUPPLY_MAP_DATA = {meta, layers, countries, nodes, links, profiles})"
  - "Quarantined weekly updater that can no longer overwrite the served .js"
  - "Registered Phase-3 test slots in package.json scripts.test"
  - "tests/data-shape.test.mjs served-file regression guard"
affects:
  - data/top100-map.js
  - scripts/update-marketcap-data.mjs
  - package.json
  - tests/data-shape.test.mjs
tech-stack:
  added: []
  patterns:
    - "Served .js derived deterministically from the frozen data/top100-map.json (JSON is the data contract; .js mirrors generate-top100-data.mjs emit format)"
    - "Weekly market-cap refresh writes ONLY data/top100-map-updated.json; the rich served .js is owned exclusively by generate-top100-data.mjs"
    - "Wave-0 test registration: all Phase-3 test filenames registered up front so later parallel plans never touch package.json"
key-files:
  created:
    - tests/data-shape.test.mjs
    - tests/confidence-score.test.mjs
    - tests/viz-confidence-wiring.test.mjs
    - tests/methodology-wiring.test.mjs
    - tests/freshness-wiring.test.mjs
  modified:
    - data/top100-map.js
    - scripts/update-marketcap-data.mjs
    - package.json
decisions:
  - "Used the fallback derivation path (not the network generator) to rebuild data/top100-map.js, because running scripts/generate-top100-data.mjs fetched fresh CSV and rewrote the frozen data/top100-map.json (186→182 links), violating the data-contract non-negotiable. Reverted that and derived the served .js byte-faithfully from the committed JSON instead."
  - "Quarantined the updater by deleting its top100-map.js write entirely (rather than teaching it the rich shape), because tests/auto-update-script.test.mjs reads only data/top100-map-updated.json — the smallest, safest change that keeps that test green and closes the regression."
metrics:
  duration: ~25m
  completed: 2026-06-20
---

# Phase 3 Plan 01: Served-File Integrity & Wave-0 Test Scaffolding Summary

Restored the browser-served `data/top100-map.js` to the rich `window.SUPPLY_MAP_DATA = {meta, layers, countries, nodes, links, profiles}` shape (derived byte-faithfully from the frozen `data/top100-map.json`), quarantined the weekly updater so it can never strip meta/profiles again, registered all Phase-3 test files in `package.json` up front, and added a data-shape regression guard — unblocking the entire phase. The live app now paints with real data.

## What Was Built

- **Task 1 (`1ad7f9b`):** Rebuilt `data/top100-map.js` to assign `window.SUPPLY_MAP_DATA` the full rich object (meta + layers + countries + 100 nodes + 186 links + 100 profiles), mirroring `generate-top100-data.mjs`'s emit format. The frozen `data/top100-map.json` is byte-unchanged.
- **Task 2 (`34d7f73`):** Quarantined `scripts/update-marketcap-data.mjs` — `writeDataFiles` now writes ONLY `data/top100-map-updated.json` and no longer touches the served `.js`, with a top-of-function QUARANTINE GUARD comment referencing RESEARCH Pitfall 1. Registered all five Phase-3 test files (`confidence-score`, `viz-confidence-wiring`, `methodology-wiring`, `freshness-wiring`, `data-shape`) in `package.json` scripts.test.
- **Task 3 (`e83e413`):** Authored `tests/data-shape.test.mjs` (3 tests: rich-key presence, flat-shape regression guard, evaluated meta/nodes/links/profiles asserts) plus four trivially-passing placeholder stubs so the registered suite stays green until plans 02/03 fill them in.

## Verification

- `npm test`: **151 pass, 0 fail** (144 prior + 3 data-shape + 4 placeholders).
- Rich-shape gate: served `.js` contains meta/profiles/nodes/links, no `last_auto_update`, no top-level `companies`. JSON byte-unchanged (`git diff --quiet` passes).
- Quarantine gate: no `writeFileSync(... top100-map.js ...)` remains in the updater; `tests/auto-update-script.test.mjs` still 8/8 green.
- RED proof for the data-shape guard: against the prior flat shape its `match`/`doesNotMatch` asserts throw (verified by swapping the committed flat blob in and reasoning the assertions).
- **Render smoke (http-server + Playwright):** app loads `window.SUPPLY_MAP_DATA` with all 6 rich keys, 100 nodes / 186 links / 100 profiles, `meta.lastUpdated = "Feb 22, 2026, 10:21 PM"`, and the SVG painted **119 circles + 732 total SVG elements with ZERO page/console errors**. The long-standing no-paint issue is resolved.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Network generator corrupted the frozen JSON; switched to the fallback derivation path**
- **Found during:** Task 1
- **Issue:** The plan's preferred path (`node scripts/generate-top100-data.mjs`) succeeded with network access but fetched fresh CSV and rewrote `data/top100-map.json` (186→182 links) and `data/top100-marketcap.csv`, violating non-negotiable #1 (the committed JSON is the frozen data contract and must stay byte-unchanged).
- **Fix:** `git checkout --` reverted the generator's writes to `top100-map.json`/`.js`/`.csv`, then derived the served `.js` deterministically from the committed JSON (`window.SUPPLY_MAP_DATA = ${JSON.stringify(payload, null, 2)};\n`). No fabricated data — pure reshape of the real committed JSON. This is the plan's documented fallback, escalated to primary because the generator is non-deterministic against the frozen contract.
- **Files modified:** data/top100-map.js
- **Commit:** 1ad7f9b

## Self-Check: PASSED

- FOUND: data/top100-map.js (rich shape, 6 keys verified)
- FOUND: scripts/update-marketcap-data.mjs (quarantine guard present, no top100-map.js write)
- FOUND: package.json (all 5 Phase-3 test files registered)
- FOUND: tests/data-shape.test.mjs + 4 placeholder stubs
- FOUND commits: 1ad7f9b, 34d7f73, e83e413
