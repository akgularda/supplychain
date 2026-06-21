---
phase: 07-scenario-stress-tests
plan: 03
subsystem: testing
tags: [scenario, taiwan-semi, playwright, render-smoke, integration-gate, depth-03, depth-04]

# Dependency graph
requires:
  - phase: 07-scenario-stress-tests (Plan 01)
    provides: "runScenario(disruption, ctx) + SCENARIO_PRESETS.TAIWAN_SEMI (7 firms / $11.36T)"
  - phase: 07-scenario-stress-tests (Plan 02)
    provides: "#scenarioPanel UI slice — #bScenarioTaiwan, live headline, Derived badge, highlightImpacted, #bScenarioReset"
provides:
  - "docs/perf/_scenario-smoke-0703.cjs — Playwright integration smoke driving the Taiwan preset over http-server"
  - "Phase-7 regression gate: full suite green (257) + real-render proof of the scenario stress-test"
affects: [phase-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reuses the Phase-3/6 render-smoke harness verbatim (free port, real repo root, http:// not file://, console-error capture)"
    - "Asserts the live-derived headline at runtime (/7 companies/ + /11.36/ + /exposed/) — proves the engine output, not a baked literal"
    - "highlightBy fingerprint: exactly 7 circle.mc at fill-opacity ~1, the rest at ~0.03"

key-files:
  created:
    - docs/perf/_scenario-smoke-0703.cjs
    - .planning/phases/07-scenario-stress-tests/07-03-SUMMARY.md
  modified: []

key-decisions:
  - "Smoke asserts impactRows === 7 and litCount === 7 (exact), not >= 1 — the Taiwan preset impact set is fully pinned to the frozen fixtures, so an exact count catches both over- and under-highlight regressions"
  - "Reset assertion checks the graph restoration too (zero nodes at the 0.03 highlight floor), not only the cleared panel — proves resetScenario's resetHighlight call actually fires"
  - "No source edits in this plan — it is a pure verification gate; the only new artifact is the smoke harness"

requirements-completed: [DEPTH-03, DEPTH-04]

# Metrics
duration: ~6 min
completed: 2026-06-21
---

# Phase 7 Plan 03: Scenario Stress-Test Integration Gate Summary

**Closes Phase 7 (DEPTH-03 + DEPTH-04): the full suite is green at 257 and a new Playwright smoke (docs/perf/_scenario-smoke-0703.cjs) boots the REAL site over http-server, runs the Taiwan preset, and confirms at runtime the live-derived "7 companies impacted · $11.36T market cap exposed" headline + 7 impact rows + a "Derived" (never "Observed") badge + exactly-7 graph highlight + working reset, with ZERO console errors.**

## Performance

- **Duration:** ~6 min
- **Completed:** 2026-06-21
- **Tasks:** 2 auto + 1 checkpoint (human-verify, auto-approved under AUTO_MODE)
- **Files created:** 1 (docs/perf/_scenario-smoke-0703.cjs); 0 source files modified

## Accomplishments

- **Task 0 — Full-suite green gate:** `npm test` = **257 pass / 0 fail**, exit 0 (242 prior + 9 scenario unit from Plan 01 + 6 scenario-wiring from Plan 02). Both new test files (`tests/scenario.test.mjs`, `tests/scenario-wiring.test.mjs`) confirmed present in the run command. No prior test regressed — the additive contract from Plans 01/02 held. No source edits.
- **Task 1 — Playwright scenario integration smoke:** Created `docs/perf/_scenario-smoke-0703.cjs` mirroring the Phase-6 `_render-smoke-0603.cjs` harness (free port, real repo root, `http://` not `file://`, console/pageerror capture). It boots http-server, waits for the global map to paint, clicks `#bScenarioTaiwan`, then asserts seven things at runtime. **Result: PASS** (d3 CDN reachable this run — real paint, synthetic fallback NOT needed).

### Smoke result (recorded honestly, over real frozen data)

| Assertion | Outcome |
|-----------|---------|
| zero console/page errors | PASS (0 errors) |
| real data paints | PASS (100 nodes / 100 profiles / 100 circle.mc) |
| Taiwan headline live-derived | PASS — `"7 companies impacted · $11.36T market cap exposed"` (matched /7 companies/ + /11.36/ + /exposed/) |
| 7 impact rows | PASS (`#scenarioImpactList` → exactly 7 `.cItem`) |
| Derived badge, not Observed | PASS (`#scenarioProv` `.prov-badge` text = "Derived"; "Observed" absent) |
| graph highlight of impacted firms | PASS (7 `circle.mc` at fill-opacity ~1, 93 dimmed to ~0.03) |
| reset clears + restores | PASS (summary/list/prov cleared, 0 nodes at the dimmed highlight floor) |

Captured headline: `7 companies impacted · $11.36T market cap exposed`.

## Checkpoint: human-verify (gate="blocking")

⚡ Auto-approved under AUTO_MODE. This is a visual/functional verification gate, NOT a `gate="blocking-human"` package-legitimacy gate, so it is eligible for auto-approval. The automatable portion was performed over real data via the smoke above (live page boot, real Taiwan-preset interaction, runtime assertions — not a hardcoded fixture). Every checkpoint claim was verified at runtime: the "7 companies impacted · $11.36T market cap exposed" headline, the 7-row impact list, the Derived badge (Observed absent), the 7-node graph highlight, and a working reset, all with zero console errors. Response treated as "approved"; phase completed.

## Threat Mitigations Verified

- **T-07-06 (Information disclosure — runtime headline drift / mis-tag):** mitigated — smoke asserts `/7 companies/` + `/11.36/` derived live + a "Derived" badge present with "Observed" absent.
- **T-07-07 (DoS — console errors / broken render):** mitigated — smoke captures console/page errors and fails on any (0 captured); reuses the proven Phase-3/6 boot harness.
- **T-07-SC (Tampering — installs):** accept — no package installs this phase (playwright + http-server already present).

## Deviations from Plan

None — plan executed exactly as written. Task 0 produced no committable artifact (verification-only, no source edits), so Task 1's smoke file is the single per-task commit, plus the final docs commit.

## Known Stubs

None.

## Threat Flags

None — no new security-relevant surface introduced (the only new file is a test harness).

## Commits

- `747b41e` test(07-03): add Playwright scenario integration smoke (Taiwan preset over http-server)
- (final docs commit recorded below)

## Verification

- `npm test` → 257 pass / 0 fail, exit 0 (both scenario test files in the run command).
- `node docs/perf/_scenario-smoke-0703.cjs` → PASS — 7 companies / $11.36T / Derived badge / 7-node highlight / reset / 0 console errors over http-server.
- human-verify checkpoint auto-approved under AUTO_MODE.

## Next Phase Readiness

Phase 07 complete (3/3 plans). DEPTH-03 + DEPTH-04 satisfied and proven end-to-end: a real user can run the Taiwan semiconductor disruption (or any top-8 chokepoint) and see honest, live-derived downstream impact + graph highlight + Derived provenance. The full suite is green at 257 and there is now a runtime regression gate for the scenario slice. Ready for Phase 08.

## Self-Check: PASSED

- FOUND: docs/perf/_scenario-smoke-0703.cjs
- FOUND: .planning/phases/07-scenario-stress-tests/07-03-SUMMARY.md
- FOUND commit: 747b41e (smoke harness)

---
*Phase: 07-scenario-stress-tests*
*Completed: 2026-06-21*
