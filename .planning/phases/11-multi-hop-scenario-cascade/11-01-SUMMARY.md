---
phase: 11-multi-hop-scenario-cascade
plan: 01
subsystem: analytics
tags: [graph-traversal, bfs, cascade, scenario, memoization, node-test]

# Dependency graph
requires:
  - phase: 07-scenario-engine
    provides: single-hop runScenario, buildSupplierFanIn, companyConcentration excludeSuppliers, SCENARIO_PRESETS, memo layer
provides:
  - "runScenario maxHops param (default 1, v1.0 byte-identical) with bounded cycle-safe multi-hop BFS"
  - "exported buildSelfLabels(profiles, fanIn): memoized 6-bridge Map<symbol,label[]> (TSM,TCEHY,ASML,AZN,AMAT,LIN)"
  - "per-entry hop + byHop breakdown + maxHopReached on the scenario result"
  - "memo key keyed on maxHops (|h${maxHops} suffix) so depths are distinct cache entries"
  - "registered tests/scenario-cascade.test.mjs (cascade correctness unit suite)"
affects: [11-02 scenario UI hop breakdown, future cascade UI/methodology copy]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Bounded cycle-safe BFS with a visited (hopOf) Map as the cycle guard + maxHops bound (independent guarantees)"
    - "Derived bridge map (selfLabels) via exact normalizeEntityLabel matching of company name/symbol/paren-acronym against fanIn keys — no alias map, no fabrication"
    - "Memo key extended with a value-affecting axis (|h${maxHops}) to keep distinct-depth results from colliding"

key-files:
  created:
    - tests/scenario-cascade.test.mjs
  modified:
    - js/analytics/index.js
    - package.json

key-decisions:
  - "Engine default maxHops=1 (NOT 3): default/maxHops:1 reproduces the v1.0 Taiwan anchor byte-identically; UI opts into deeper hops explicitly (11-RESEARCH A1)"
  - "hop>=2 lostSuppliers = the wave (bridge) labels that reached the firm, not the original disabled set (e.g. TSM lost 'applied materials') (11-RESEARCH A2)"
  - "Re-disable guard: the next BFS wave excludes any label already in the disabled set to prevent double-counting"
  - "selfLabels test builds from the JSON-loaded profiles, not the thin DATA.profiles (which carries the graph only, not full per-company profiles, under node:test)"

patterns-established:
  - "Visited-set termination: hopOf Map guarantees each symbol is visited once even on a cyclic graph; proven by a synthetic 2-cycle fixture"
  - "Backward-compatible output superset: existing impactedCompanies fields preserved + additive hop/byHop/maxHopReached"

requirements-completed: [CASC-01, CASC-04]

# Metrics
duration: 4min
completed: 2026-06-22
---

# Phase 11 Plan 01: Multi-Hop Scenario Cascade Engine Summary

**Bounded, cycle-safe multi-hop BFS in runScenario over the real frozen graph, enabled by exactly 6 derived company-as-supplier bridge edges, with maxHops defaulting to 1 so every v1.0 fixture/memo test stays byte-identical.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-06-22T03:17:17Z
- **Completed:** 2026-06-22T03:21:23Z
- **Tasks:** 3 (Task 0 RED test authoring, Task 1 TDD engine, Task 2 regression gate)
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments
- `runScenario` extended to a bounded (`maxHops`, default 1) cycle-safe (visited `hopOf` set) multi-hop BFS over the real graph; default/maxHops:1 reproduces v1.0 exactly (Taiwan = 7 firms / $11,360,589,871,184 / maxHopReached 1).
- New exported `buildSelfLabels(profiles, fanIn)` derives exactly the 6 real bridge edges (TSM, TCEHY, ASML, AZN, AMAT, LIN) by exact normalized matching against fanIn keys — no fabricated/alias edges. Memoized like `buildSupplierFanIn`.
- Output gained `hop` per impacted entry, a `byHop` breakdown, and `maxHopReached`. Taiwan at maxHops>=2 = 8 firms / $13.28T, byHop {1:7, 2:1}, TSM added at hop 2 via AMAT (TSMC→AMAT→TSM).
- Memo key appends `|h${maxHops}` so a maxHops:1 and maxHops:3 call are distinct cache entries while two default calls still collide (memo test stays green).
- Authored and registered `tests/scenario-cascade.test.mjs` (9 assertions across backward-compat, superset, 6-bridge, synthetic-cycle termination, maxHops bound, memo). Full suite: 301 → 310 passing / 0 fail.

## Task Commits

1. **Task 0: Register cascade test + author failing suite (RED)** - `acb9ca1` (test)
2. **Task 1: maxHops BFS + buildSelfLabels + hop/byHop/maxHopReached + memo key (GREEN)** - `9dbb80a` (feat)
3. **Task 2: Full-suite regression gate** - no file changes (verification-only; `npm test` = 310 pass / 0 fail)

**Plan metadata:** (this commit)

## Files Created/Modified
- `js/analytics/index.js` - Added `buildSelfLabels` + selfLabels memo bucket; extended `runScenario` with maxHops + `|h${maxHops}` memo key; rewrote `_runScenarioCompute` as a bounded cycle-safe BFS emitting hop/byHop/maxHopReached; updated the single-hop doc comment to the multi-hop model.
- `tests/scenario-cascade.test.mjs` - New cascade correctness unit suite (CASC-01/CASC-04).
- `package.json` - Registered `tests/scenario-cascade.test.mjs` in `scripts.test`.

## Decisions Made
- **Default maxHops=1 (not 3):** keeps the two v1.0 call sites (scenario.test.mjs, analytics-memo.test.mjs:60) byte-identical; multi-hop is opt-in. (11-RESEARCH A1)
- **hop>=2 lostSuppliers = wave labels:** a hop-2 firm reports the bridge label that reached it, not the original disabled set. (11-RESEARCH A2)
- **Re-disable guard** on the next BFS wave; **exact bridge matching only** (no alias map) to avoid fabricating edges.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] selfLabels test built from empty DATA.profiles**
- **Found during:** Task 1 (GREEN gate)
- **Issue:** The cascade test's 6-bridge assertion called `buildSelfLabels(DATA.profiles, ...)`, but under `node:test` the thin `js/data` `DATA.profiles` is empty (it carries the graph, not full per-company profiles — those load from `data/top100-map.json`). The assertion saw 0 bridge owners instead of 6.
- **Fix:** Build the bridge map from the JSON-loaded `profiles` (already imported in the test), matching how `runScenario` receives `ctx.profiles`. Removed the now-unused `DATA` import.
- **Files modified:** tests/scenario-cascade.test.mjs
- **Verification:** `buildSelfLabels` test asserts exactly {AMAT, ASML, AZN, LIN, TCEHY, TSM}; passes.
- **Committed in:** `9dbb80a` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug in test authoring)
**Impact on plan:** Test-fixture correction only; no engine scope change. The engine matched the plan exactly.

## Issues Encountered
- None beyond the test-fixture correction above. The v1.0 `after`-concentration path stays identical: hop-1 firms now exclude only the reaching disabled labels rather than the whole disabled set, but a disabled label that is not a firm's supplier never changed its concentration, so the result is unchanged.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Engine layer is ready for Plan 11-02 (scenario UI hop breakdown): `runScenario` now returns `byHop`, `maxHopReached`, and per-entry `hop`; UI call sites can pass `maxHops:3`.
- No blockers. Full suite green at 310 pass / 0 fail.

## Self-Check: PASSED

- FOUND: tests/scenario-cascade.test.mjs
- FOUND: js/analytics/index.js
- FOUND: .planning/phases/11-multi-hop-scenario-cascade/11-01-SUMMARY.md
- FOUND commit: acb9ca1 (test)
- FOUND commit: 9dbb80a (feat)

---
*Phase: 11-multi-hop-scenario-cascade*
*Completed: 2026-06-22*
