---
phase: 07-scenario-stress-tests
plan: 01
subsystem: analytics
tags: [scenario, runScenario, taiwan-semi, excludeSuppliers, hhi, depth-03, tdd]
requires:
  - js/analytics/index.js (buildSupplierFanIn, companyConcentration)
  - js/data/index.js (DATA, normalizeEntityLabel)
  - data/top100-map.json (frozen fixtures)
provides:
  - "runScenario(disruption, ctx) — pure single-hop downstream impact engine"
  - "SCENARIO_PRESETS.TAIWAN_SEMI — 5 real normalized TSMC label variants"
  - "companyConcentration excludeSuppliers opt (additive)"
affects:
  - js/analytics/index.js
  - tests/scenario.test.mjs
  - package.json
tech-stack:
  added: []
  patterns:
    - "node:test ESM unit tests pinned to real frozen fixtures"
    - "additive opts param (undefined => byte-identical legacy output)"
    - "HHI (1/k) as the monotonic concentration-delta metric"
key-files:
  created:
    - tests/scenario.test.mjs
    - .planning/phases/07-scenario-stress-tests/07-01-SUMMARY.md
  modified:
    - js/analytics/index.js
    - package.json
decisions:
  - "concentrationBefore/After report HHI (1/k), NOT the composite score (composite is non-monotonic under removal — 07-RESEARCH Pitfall 1)"
  - "excludeSuppliers is a single additive filter line on companyConcentration; undefined leaves uniq unchanged so all 242 prior tests stay green"
  - "TAIWAN_SEMI bundles the 5 real normalized TSMC label variants (TSMC is fragmented across distinct labels); a single 'tsmc' hits only KLAC"
  - "severity = share of suppliers lost (>=0.5 high, >=0.25 medium, else low); Taiwan preset is 'low' (1 of 5)"
  - "market cap exposed = combined cap of impacted firms (exposure, not loss); marketcap read from top-level DATA.nodes, never profiles"
metrics:
  duration: "~8 min"
  tasks: 3
  files: 3
  completed: "2026-06-21"
---

# Phase 7 Plan 01: Pure Scenario Engine (runScenario + TAIWAN_SEMI) Summary

Ships the DOM-free `runScenario(disruption, ctx)` scenario engine + `TAIWAN_SEMI` preset and the additive `excludeSuppliers` opt on `companyConcentration`, TDD-pinned to the real frozen fixtures (exactly 7 impacted firms, $11,360,589,871,184 exposed, HHI 0.20→0.25), with the full suite green at 251 tests.

## What Was Built

- **`excludeSuppliers` opt on `companyConcentration`** (js/analytics/index.js): one destructure + one filter line. Coerces a `Set`/`string[]`/`undefined` to a Set (or null) and filters excluded labels out of `uniq` BEFORE k/HHI/sharedFrac. Purely additive — `undefined` leaves output byte-identical (242 prior tests stay green).
- **`runScenario(disruption, ctx)`** (js/analytics/index.js): pure, single-hop engine. Normalizes the disabled set from `disableSuppliers` + `disableSupplier` via `normalizeEntityLabel`; builds `mcap[symbol]` from top-level `ctx.nodes`; computes candidate symbols as the union of fan-in sets for disabled labels; for each candidate computes before/after `companyConcentration` (after via `excludeSuppliers`); keeps firms losing ≥1 supplier; emits `{symbol, company, marketcap, lostSuppliers, suppliersBefore, suppliersAfter, concentrationBefore:before.hhi, concentrationAfter:after.hhi, severity}`; sums `totalMarketCapExposed`; reports `supplierCount` (disabled labels present in fan-in) and `disabled`. Sorted by marketcap desc then symbol asc. Module comment states single-hop-only / HHI-is-monotonic / exposure-not-loss.
- **`SCENARIO_PRESETS.TAIWAN_SEMI`**: bundles the 5 real normalized TSMC label variants (`taiwan semiconductor manufacturing company (tsmc)`, `tsmc foundry capacity`, `tsmc (hbm4 and cowos collaboration)`, `tsmc n2 process technology`, `tsmc`).
- **`tests/scenario.test.mjs`** (9 assertions): pinned to real fixtures — 7 impacted firms {NVDA,AAPL,AVGO,000660.KS,AMD,AMAT,KLAC}, `totalMarketCapExposed === 11360589871184` (derived live from fixture nodes, then asserted equal to the literal — proves it is not baked into the engine), supplierCount 5, every firm k 5→4 / HHI 0.20→0.25 with after≥before, `{}` and `{disableSuppliers:[]}` no-op safe, single `'tsmc'` → KLAC only, `excludeSuppliers:undefined` deep-equals legacy output, `excludeSuppliers` lowers AAPL k by 1.
- **package.json**: registered `tests/scenario.test.mjs` in `scripts.test`.

## TDD Gate Compliance

- RED gate: `test(07-01)` commit `925ee1b` — spec written, ran, failed (engine exports absent).
- GREEN gate: `feat(07-01)` commit `c9d85ce` — engine implemented, 9/9 pass.
- REFACTOR: none needed (implementation clean on first pass).

## Verification

- `node --test tests/scenario.test.mjs` → 9/9 pass.
- `npm test` → 251 pass / 0 fail (242 prior + 9 new); exit 0. `excludeSuppliers` proven additive — no prior concentration/criticality assertion regressed.
- Fixture pre-derivation (live from `data/top100-map.json`): impacted = [000660.KS, AAPL, AMAT, AMD, AVGO, KLAC, NVDA] (7); sum = 11360589871184 (exact match); single `tsmc` fan-in = [KLAC]; every firm k 5→4.
- DOM-free: no `window`/`document` token in js/analytics code (only the pre-existing module comment mentions "no window").

## Deviations from Plan

None — plan executed exactly as written. (Task 2 introduced no new file changes; package.json was already committed in Task 0 per the TDD Wave-0 registration.)

## Commits

- `925ee1b` test(07-01): add failing pure-engine scenario spec pinned to real fixtures
- `c9d85ce` feat(07-01): add runScenario + TAIWAN_SEMI preset + excludeSuppliers opt

## Known Stubs

None.

## Next Steps

Plan 02 (07-02) renders this engine: scenario UI panel, Taiwan preset / chokepoint select, graph highlight via `highlightBy`, derived provenance badge, and methodology copy. Plan 02 authors and registers `tests/scenario-wiring.test.mjs` (deliberately NOT registered here — would make the suite RED on a missing file).

## Self-Check: PASSED

- FOUND: tests/scenario.test.mjs, js/analytics/index.js, 07-01-SUMMARY.md
- FOUND commits: 925ee1b (RED), c9d85ce (GREEN)
- grep confirms `export function runScenario` + `export const SCENARIO_PRESETS` in js/analytics/index.js
