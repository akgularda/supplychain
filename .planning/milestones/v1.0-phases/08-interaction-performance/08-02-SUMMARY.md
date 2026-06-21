---
phase: 08-interaction-performance
plan: 02
subsystem: testing
tags: [node-test, source-guard, d3, force-simulation, invariant, perf-01]

# Dependency graph
requires:
  - phase: 08-interaction-performance (plan 01)
    provides: tests/no-restart-invariant.test.mjs registered in package.json scripts.test
provides:
  - Source-level guard locking the "simple change never restarts the simulation" invariant
  - Allow-list assertion proving bReset's legitimate alpha(0.22).restart() reheat remains
  - Proof that highlightBy / resetHighlight (viz) are opacity-only
affects: [interaction-performance, viz, ui, future-handler-additions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Brace-matched body-slice source guard: bodyOf(src, signature) + BANNED regex set over sliced handler bodies"
    - "Scoped allow-list: assert the legitimate reheat remains while banning restart in simple-change bodies"

key-files:
  created:
    - tests/no-restart-invariant.test.mjs
  modified: []

key-decisions:
  - "Guard scoped to sliced simple-change handler bodies (named fns, inline onclicks, keydown l/f/b cases) — never a blanket file grep"
  - "bReset's alpha(0.22).restart() and render()/updateGraph() explicitly allow-listed; an assertion proves the reheat is still present"
  - "No source edits: research confirmed every simple-change path is already opacity-only, so the plan only locks the invariant"

patterns-established:
  - "Pattern: source-level invariant guard via readFileSync + brace-matched slice + doesNotMatch over a BANNED regex array"

requirements-completed: [PERF-01]

# Metrics
duration: 2min
completed: 2026-06-21
---

# Phase 8 Plan 02: No-Restart Invariant Guard Summary

**Source-level guard test locking the "simple filter/style/highlight change never restarts the D3 force simulation or re-renders the graph" invariant, with bReset's legitimate reheat explicitly allow-listed.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-06-21T13:24:52Z
- **Completed:** 2026-06-21T13:26:15Z
- **Tasks:** 1
- **Files modified:** 1 (created)

## Accomplishments
- Authored `tests/no-restart-invariant.test.mjs` (12 assertions, all green) that slices the body of each simple-change handler and proves none contain `d3.forceSimulation(`, `.alpha(`, `.restart(`, `updateGraph(`, or `render(`.
- Guarded handlers: `applyFilters`, `resetFilters`, `highlightChokepoints` (js/ui); `highlightBy`, `resetHighlight` (js/viz); inline `bLabels`/`bBottlenecks` onclicks; `bFlow` (bare `toggleParticles()`); keydown `l`/`f`/`b` cases.
- Allow-list proof: asserts `js/ui/index.js` still matches `/alpha\(0\.22\)\.restart\(\)/` so bReset's intentional reheat cannot be silently deleted and the invariant boundary is documented.
- Proved the guard bites: temporarily injecting `STATE.simulation.alpha(1).restart()` into `applyFilters` failed the test (`AssertionError ... must not match /\.alpha\s*\(/`); source restored byte-identical afterward.
- Full suite green at **275/275** (up from 263 with the 12 new guard tests).

## Task Commits

1. **Task 1: Author no-restart-invariant guard** - `aa9b850` (test)

**Plan metadata:** committed separately with SUMMARY + STATE + ROADMAP.

## Files Created/Modified
- `tests/no-restart-invariant.test.mjs` - Source-level guard: brace-matched body slice of each simple-change handler + BANNED regex assertions + bReset allow-list proof.

## Decisions Made
- None beyond the plan — executed exactly as written. Body-slicing approach and BANNED set taken directly from the RESEARCH skeleton and plan task action.

## Deviations from Plan

None - plan executed exactly as written. No source edits to `js/ui/index.js` or `js/viz/index.js` were required (research confirmed all simple-change paths are already opacity-only).

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The no-restart invariant is now locked behind a guard that meaningfully fails if any guarded simple-change handler gains a restart/re-render call.
- If future plans add new simple-change handlers to `wireUI`, they should be added to this guard's handler set (research A3, accepted risk T-08-04).

## Self-Check: PASSED

- `tests/no-restart-invariant.test.mjs` exists
- Commit `aa9b850` exists in git log
- `08-02-SUMMARY.md` exists

---
*Phase: 08-interaction-performance*
*Completed: 2026-06-21*
