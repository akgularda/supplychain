---
phase: 08-interaction-performance
plan: 03
subsystem: testing
tags: [performance, benchmark, memoization, perf-hooks, analytics, perf-01]

# Dependency graph
requires:
  - phase: 08-01-analytics-memoization
    provides: per-session memo layer + __resetAnalyticsCache()/__memoStats() test seams over buildSupplierFanIn/companyConcentration/supplierCriticality/runScenario
provides:
  - docs/perf/_interaction-bench.cjs — Node cold-vs-warm micro-benchmark of the memoized analytics (perf_hooks.performance.now, median-of-5)
  - docs/perf/interaction-2026-06-21.md — recorded honest cold-vs-warm interaction-latency delta + local-no-paint caveat (PERF-01 SC2 evidence)
affects: [08-04, PERF-01, interaction performance]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ESM analytics imported into a CommonJS bench via dynamic import(pathToFileURL(...)) — no build step, no package added"
    - "Cold path = __resetAnalyticsCache() before EVERY call (reconstructs the pre-memo eager-rebuild cost); warm path = reset once then memoized — same workload, two cache regimes"
    - "Self-verifying perf record: the bench re-prints live anchors (GILD=36/NVDA=12/Taiwan=7) so recorded numbers are provably from a real run (threat T-08-05)"

key-files:
  created:
    - docs/perf/_interaction-bench.cjs
    - docs/perf/interaction-2026-06-21.md
  modified: []

key-decisions:
  - "Node micro-bench of the pure analytics is the AUTHORITATIVE SC2 measurement — the page does not paint locally (NO_FCP from the stale committed data snapshot, per baseline-2026-06-20.md), so in-browser interaction latency is unmeasurable on this machine (08-RESEARCH Pitfall 4 / OQ2)"
  - "Cold path resets the cache before every single call so the shared supplier fan-in rebuilds each time — faithfully models the pre-memoization eager default-arg cost"
  - "median-of-5 with a warmup pass to damp JIT/GC noise; report absolute ms as-is even though warm is tiny — the load-bearing facts are warm < cold and fanInBuilds_warm === 1"
  - "Bench kept OUT of package.json scripts.test — it is tooling, not a unit test"

patterns-established:
  - "Pattern: cold-vs-warm cache micro-benchmark driven by the __resetAnalyticsCache seam to quantify a memoization win without DOM/paint"
  - "Pattern: perf record cites the documented NO_FCP local condition as the caveat and re-prints live anchors as self-verification"

requirements-completed: [PERF-01]

# Metrics
duration: 7min
completed: 2026-06-21
---

# Phase 8 Plan 03: Interaction-Latency Record (PERF-01 SC2) Summary

**A Node cold-vs-warm micro-benchmark of the memoized analytics proving the interaction workload (100 profile opens + 50 criticality + 50 scenario calls) drops from ≈166 ms cold to ≈2.8 ms warm (≈60× faster, fan-in built once / 199 hits), recorded under docs/perf/ as the authoritative PERF-01 SC2 evidence with the documented local-no-paint caveat.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-06-21T13:25Z
- **Completed:** 2026-06-21T13:32Z
- **Tasks:** 2
- **Files modified:** 2 (2 created)

## Accomplishments
- Authored `docs/perf/_interaction-bench.cjs`: dynamically imports the ESM analytics into CommonJS, loads the real `data/top100-map.json`, and times a representative interaction workload (100 `companyConcentration` opens + 50 `supplierCriticality` + 50 `runScenario` Taiwan calls) COLD (`__resetAnalyticsCache()` before each call → fan-in rebuilt every time) vs WARM (reset once → memoized), median-of-5 with a warmup pass.
- Live measured result: **coldMs ≈ 166, warmMs ≈ 2.8, speedup ≈ 60×, warm fan-in builds = 1 (199 hits)**; anchors re-printed from the same warm cache as **GILD=36, NVDA=12, Taiwan=7** — proving the cache returns correct values, not just faster ones.
- Recorded the result in `docs/perf/interaction-2026-06-21.md` (112 lines): method, results table, SC2 conclusion, and the honest local-no-paint caveat citing `baseline-2026-06-20.md`'s NO_FCP condition and 08-RESEARCH (Pitfall 4 / OQ2).
- Kept the bench out of `package.json scripts.test` (tooling, not a unit test); full suite stays **275/275 green**.

## Task Commits

Each task was committed atomically:

1. **Task 1: Write docs/perf/_interaction-bench.cjs (cold-vs-warm micro-benchmark)** - `27118a6` (feat)
2. **Task 2: Record latency result in docs/perf/interaction-2026-06-21.md** - `6c3f769` (docs)

**Plan metadata:** (final docs commit — SUMMARY + STATE + ROADMAP)

## Files Created/Modified
- `docs/perf/_interaction-bench.cjs` - Node cold-vs-warm micro-benchmark of the memoized analytics; `perf_hooks.performance.now()`, median-of-5, re-prints live anchors. NOT registered in scripts.test.
- `docs/perf/interaction-2026-06-21.md` - The PERF-01 SC2 latency record: method, real numbers (≈166 ms → ≈2.8 ms, ≈60×), SC2 conclusion, and the local-no-paint caveat.

## Decisions Made
- The Node micro-bench is the authoritative SC2 measurement because the page cannot paint locally (NO_FCP from the stale committed snapshot, per baseline-2026-06-20.md); in-page Playwright capture remains a best-effort supplement that would need synthetic-data injection to paint.
- Cold path resets before every call to model the pre-memo eager fan-in rebuild; absolute warm ms reported as-is (tiny, expected — no DOM/paint cost in Node), with warm < cold and `fanInBuilds_warm === 1` as the load-bearing facts.

## Deviations from Plan

None - plan executed exactly as written. The bench ran first try, anchors matched (GILD=36/NVDA=12/Taiwan=7), both task verify commands passed, and no source files were touched (data frozen, no value changes).

## Issues Encountered
- Git emitted LF→CRLF warnings on both created files (Windows working copy) — cosmetic line-ending normalization, no content impact.

## Known Stubs
None. The recorded numbers come from a live `node docs/perf/_interaction-bench.cjs` run (no placeholder/fabricated figures); the bench self-verifies via the live anchors (threat T-08-05 mitigated).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PERF-01 SC2 interaction-latency improvement is recorded with honest numbers and the documented caveat. Plan 08-04 (final phase plan) can proceed.
- 275/275 tests green; no source changed; data frozen. No blockers.

## Self-Check: PASSED

Created files present (docs/perf/_interaction-bench.cjs, docs/perf/interaction-2026-06-21.md); task commits present (27118a6, 6c3f769); bench re-prints live anchors and is absent from scripts.test; full suite 275/275.

---
*Phase: 08-interaction-performance*
*Completed: 2026-06-21*
