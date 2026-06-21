---
phase: 06-concentration-risk-analytics
plan: 01
subsystem: analytics
tags: [concentration, herfindahl, hhi, fan-in, criticality, pure-functions, node-test, esm]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: js/data/index.js (DATA, normalizeEntityLabel, supplierToSymbols overlap index)
provides:
  - js/analytics/index.js — pure DOM-free companyConcentration / sectorConcentration / supplierCriticality + buildSupplierFanIn
  - Real-data anchors locked by tests (GILD=36, NVDA=12, Healthcare reuse 12%, top chokepoint fan-in 4)
  - Two registered test suites (concentration.test.mjs, criticality-wiring.test.mjs)
affects: [06-02 display/wiring, trust derived-provenance branch, ui chokepoints panel, viz highlight]

# Tech tracking
tech-stack:
  added: []  # zero new packages — Node built-ins + existing modules only
  patterns:
    - Pure analytics module mirroring js/trust (no window/DOM, importable under node:test)
    - Opts-injected data (profiles/nodes/layers) so tests never depend on window
    - Composite concentration with stated equal-weight HHI assumption

key-files:
  created:
    - js/analytics/index.js
    - tests/concentration.test.mjs
    - tests/criticality-wiring.test.mjs
  modified:
    - package.json

key-decisions:
  - "Equal-weight HHI=1/k assumption stated explicitly because the dataset has no per-supplier volume field (all l.v=2)"
  - "Company score is a composite 0.6*(1/k)+0.4*sharedFrac to escape the degenerate pure-HHI tie; weights and sharedFrac threshold are opts params"
  - "Sector concentration reported as reuse% (slots-distinct)/slots + effective suppliers (1/HHI), NOT raw HHI*100 (uninterpretable 1-7)"
  - "sector = layers[node.y], NOT profile.category (category is near-unique per company)"
  - "supplierCriticality keyed purely on real fan-in; the editorial d.bn flag is never referenced (asserted at source level)"

patterns-established:
  - "Analytics math lives in js/analytics as pure ESM, unit-tested against real-data anchors"
  - "Test files read data/top100-map.json via node:fs and inject profiles/nodes/layers explicitly"

requirements-completed: [DEPTH-01, DEPTH-02]

# Metrics
duration: ~20min
completed: 2026-06-21
---

# Phase 6 Plan 01: Concentration & Criticality Analytics Engine Summary

**Pure DOM-free js/analytics engine — composite company concentration (0.6·HHI + 0.4·sharedFrac), sector reuse%/effective-suppliers grouped by layer, and fan-in supplier-criticality ranking — all derived from the frozen real dataset and locked to real anchors (GILD=36, NVDA=12, Healthcare reuse 12%, top chokepoint fan-in 4).**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-06-21
- **Tasks:** 3 (Task 0 + 2 TDD tasks)
- **Files modified:** 4 (1 modified, 3 created)

## Accomplishments
- `companyConcentration(symbol, opts)` — integer score clamped [0,100], composite `round(100·(wHHI·(1/k) + wShared·sharedFrac))`, equal-weight HHI assumption documented in module comment.
- `sectorConcentration(sector, opts)` — groups by `layers[node.y]`, returns reuse% + effective-supplier count (1/HHI). Healthcare reuse 12%, Finance 9% verified against real data.
- `supplierCriticality(opts)` — fan-in ranking, top = "credit and risk data inputs" (4); independent of editorial `d.bn`.
- `buildSupplierFanIn(profiles)` — `Map<label, Set<symbol>>` mirroring the existing overlap-index supplier extraction.
- Both new test files registered in `package.json` scripts.test (18→20). Full suite green: 231 tests pass / 0 fail.

## Task Commits

1. **Task 0: Register test files (Wave 0 gate)** - `d398b1b` (chore)
2. **Task 1 RED: failing concentration/sector tests** - `f92398a` (test)
3. **Task 1 GREEN: implement analytics module** - `6c8e0a2` (feat)
4. **Task 2: supplierCriticality fan-in ranking tests** - `8a7aef8` (test)

_TDD note: Task 2's implementation (`supplierCriticality`) shipped inside the shared `js/analytics/index.js` during Task 1's GREEN (the plan defines a single module providing all three functions), so Task 2 added only its dedicated test suite._

## Files Created/Modified
- `js/analytics/index.js` - Pure concentration & criticality engine (buildSupplierFanIn, companyConcentration, sectorConcentration, supplierCriticality).
- `tests/concentration.test.mjs` - DEPTH-01 bounds, monotonicity (k and sharedFrac), real anchors, sector grouping.
- `tests/criticality-wiring.test.mjs` - DEPTH-02 ranking, fan-in parity, histogram match, no-d.bn assertion.
- `package.json` - scripts.test enumerates both new files (type:commonjs unchanged).

## Decisions Made
- Composite over pure HHI (escapes the degenerate 1/k tie; the only honest way to differentiate equal-weight portfolios).
- Sector reuse% defined as redundant-slot fraction `(slots − distinct) / slots`, which reproduces the RESEARCH table exactly (Healthcare 12, Finance 9, Energy 6, Semis 3, Cloud 3, Hardware 0, Consumer 0).
- Deterministic tie-break in criticality sort (`localeCompare`) for stable ordering across runs.

## Deviations from Plan
None - plan executed exactly as written. Sector reuse% formula was confirmed against the RESEARCH anchor table before implementation (research-defined `(slots−distinct)/slots`).

## TDD Gate Compliance
- Task 1: RED (`f92398a` test) → GREEN (`6c8e0a2` feat) gate sequence present and ordered.
- Task 2: `supplierCriticality` was authored within the Task 1 shared-module GREEN (single `js/analytics/index.js` is the plan's stated artifact for all three functions). Its dedicated test suite (`8a7aef8`) passed on first run; tests genuinely exercise real-data anchors (top fan-in 4, exact histogram {1:439,2:13,3:5,4:1}, count parity with the fan-in map). No standalone RED commit exists for Task 2 because the implementation could not be separated from Task 1's module without an artificial split.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Pure analytics engine ready to be imported by Plan 02 (js/ui profile panel, chokepoints panel, js/viz highlight, js/trust derived-provenance branch).
- Anchors are test-locked, so any drift in the frozen dataset or the math will be caught.

## Self-Check: PASSED

---
*Phase: 06-concentration-risk-analytics*
*Completed: 2026-06-21*
