---
phase: 11-multi-hop-scenario-cascade
verified: 2026-06-22T00:00:00Z
status: passed
score: 4/4 must-haves verified
overrides_applied: 0
---

# Phase 11: Multi-Hop Scenario Cascade Verification Report

**Phase Goal:** Investors see a disruption propagate beyond direct dependents through the real supply-chain graph to second-order downstream effects, with the impact set, market-cap exposed, and per-hop breakdown derived live and honestly badged Derived

**Verified:** 2026-06-22
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Running a disruption impacts a SUPERSET of the v1.0 single-hop result; traversal terminates on the real graph with no infinite loop even on cyclic graphs | VERIFIED | `runScenario` BFS with `hopOf` Map cycle guard + `maxHops` bound; synthetic 2-cycle test passes at maxHops:5; Taiwan maxHops:1 = 7 firms (v1.0 byte-identical); maxHops:2/3 = 8 firms (superset). 9/9 cascade tests pass. |
| 2 | Scenario panel shows hop breakdown (direct vs indirect); impacted count and total market-cap reflect full multi-hop result derived live (no hardcoded literals) | VERIFIED | `#scenarioHopBreakdown` element in index.html; `renderScenario` derives headline from `impactedCompanies.length` + `maxHopReached` + `totalMarketCapExposed`; byHop[1] for direct count. No `11.36`, `13.28`, or `"7 companies impacted"` literals in ui/index.js. |
| 3 | Cascade output renders honest `Derived` provenance badge (never Observed); Methodology explains the bounded multi-hop model, its termination bound, assumptions, keeping "direct dependents" | VERIFIED | `provenanceFor({ derived: true, n }, ...)` wired into `scenarioProv` in `renderScenario`. Methodology bullet "Bounded multi-hop cascade" contains "direct dependents", "cycle-safe", "visited set", "bounded to at most N hops (N=3)". "single-hop only" note is absent. |
| 4 | New unit tests assert cascade correctness (cycle termination, hop-count accuracy, multi-hop impact is superset of single-hop, real fixtures); full suite stays green | VERIFIED | `tests/scenario-cascade.test.mjs` registered in `package.json` scripts.test. 9 cascade assertions: backward-compat, explicit maxHops:1, maxHops:2 and :3 Taiwan (8 firms), superset, 6-bridge derivation, synthetic 2-cycle termination, maxHops bound, memo key distinctness. Full suite: **313 pass / 0 fail**. |

**Score:** 4/4 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `js/analytics/index.js` | `runScenario` multi-hop BFS + `buildSelfLabels` + `byHop`/`maxHopReached`/`hop` on output | VERIFIED | Lines 298–408: `maxHops` param with default 1; `hopOf` Map cycle guard; `byHop` breakdown; per-entry `hop`; memo key includes `|h${maxHops}`. `buildSelfLabels` exact normalized matching, 6 bridges. |
| `tests/scenario-cascade.test.mjs` | 9 cascade correctness assertions | VERIFIED | All 9 tests pass in isolation and as part of the full suite. |
| `package.json` | `scenario-cascade.test.mjs` registered in scripts.test | VERIFIED | `tests/scenario-cascade.test.mjs` present in the `scripts.test` command. |
| `js/ui/index.js` | `maxHops:3` at both call sites; `renderScenario` derives headline + hop split live; `#scenarioHopBreakdown` wired; Derived badge | VERIFIED | Lines 780–810: `runTaiwanScenario` passes `maxHops:3`; `runChokepointScenario` passes `maxHops:3`; `renderScenario` reads `result.byHop[1].length`, `result.maxHopReached`, `result.impactedCompanies.length`, `result.totalMarketCapExposed`; `badgeHtml(provenanceFor({ derived: true, n }, ...))` to `scenarioProv`. `resetScenario` clears `#scenarioHopBreakdown`. |
| `index.html` | `#scenarioHopBreakdown` element; multi-hop methodology copy; "direct dependents" retained; subtitle updated | VERIFIED | Line 334: `id="scenarioHopBreakdown"`. Line 332: subtitle "multi-hop downstream cascade (bounded, cycle-safe)". Lines 160–164: methodology bullet "Bounded multi-hop cascade" with "direct dependents", "cycle-safe", visited set description, N=3 bound. "single-hop only" removed. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `js/ui/index.js` `runTaiwanScenario` | `js/analytics/index.js` `runScenario` | `maxHops: 3` in disruption arg | WIRED | Line 782: `{ ...SCENARIO_PRESETS.TAIWAN_SEMI.disruption, maxHops: 3 }` |
| `js/ui/index.js` `runChokepointScenario` | `js/analytics/index.js` `runScenario` | `maxHops: 3` in disruption arg | WIRED | Line 795: `{ disableSupplier: label, maxHops: 3 }` |
| `renderScenario` result | `#scenarioHopBreakdown` DOM element | `scenarioHopBreakdownEl.textContent` | WIRED | Lines 742–748: reads `byHop[1].length`, calculates indirect, writes direct/indirect text |
| `renderScenario` result | `#scenarioProv` DOM element | `badgeHtml(provenanceFor({derived:true,...}))` | WIRED | Lines 764–769: Derived badge rendered from live result |
| `runScenario` BFS | cycle guard | `hopOf` Map (visited set) | WIRED | Line 343: `if (hopOf.has(sym)) continue;` — cycle/dup guard |
| `buildSelfLabels` | fanIn keys | exact `normalizeEntityLabel` matching | WIRED | Lines 143–153: name, symbol, parenthetical acronym each checked against `fanIn.has()` |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `renderScenario` headline | `result.impactedCompanies.length`, `result.maxHopReached`, `result.totalMarketCapExposed` | `runScenario` → `_runScenarioCompute` → `data/top100-map.json` | Yes — derived from real frozen dataset via BFS over `fanIn` | FLOWING |
| `#scenarioHopBreakdown` | `result.byHop[1].length`, `result.impactedCompanies.length` | Same `runScenario` result | Yes | FLOWING |
| Derived badge | `n` (sum of lostSuppliers per impacted company) | Same `runScenario` result | Yes | FLOWING |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Default maxHops=1 reproduces v1.0 (7 firms / $11,360,589,871,184) | `node --test tests/scenario-cascade.test.mjs` | Test 1 PASS | PASS |
| maxHops:2 Taiwan = 8 firms, byHop {1:7,2:1}, TSM at hop 2 | Same suite | Tests 3-4 PASS | PASS |
| Superset: maxHops:3 symbols ⊇ maxHops:1 symbols | Same suite | Test 5 PASS | PASS |
| 6 real bridges only (TSM,TCEHY,ASML,AZN,AMAT,LIN) | Same suite | Test 6 PASS | PASS |
| Cycle terminates on synthetic 2-cycle at maxHops:5 | Same suite | Test 7 PASS | PASS |
| Full suite | `npm test` | **313 pass / 0 fail** | PASS |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CASC-01 | 11-01-PLAN.md | `runScenario` bounded cycle-safe multi-hop BFS over real graph | SATISFIED | `_runScenarioCompute` implements BFS with `hopOf` cycle guard, `maxHops` bound, `buildSelfLabels` 6-bridge map (no fabrication) |
| CASC-02 | 11-02-PLAN.md | Cascade distinguishes hop levels; scenario panel shows hop breakdown; impacted set + market-cap derived live | SATISFIED | `#scenarioHopBreakdown` in HTML; `renderScenario` reads `byHop[1]` + derives headline live; no hardcoded numbers |
| CASC-03 | 11-02-PLAN.md | `derived` provenance badge kept; Methodology explains bounded multi-hop model | SATISFIED | `provenanceFor({ derived: true, n })` in scenario path; methodology bullet updated to "Bounded multi-hop cascade" with "direct dependents" retained |
| CASC-04 | 11-01-PLAN.md | New unit tests assert cascade correctness; full suite stays green | SATISFIED | 9 cascade tests pass; full suite 313/0 |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | — | — | No TBD/FIXME/XXX/placeholder/stub patterns found in modified files |

No debt markers, no hardcoded result literals in the UI path, no stub returns in the analytics engine.

---

## Human Verification Required

None. All must-haves are mechanically verifiable and confirmed by the test suite. The Playwright smoke (`docs/perf/_scenario-smoke-1102.cjs`) covers the visual/browser path but requires a running server — the unit and wiring tests are sufficient to confirm all four CASC requirements.

---

## Gaps Summary

No gaps. All 4 roadmap success criteria are met by the implementation evidence.

---

_Verified: 2026-06-22_
_Verifier: Claude (gsd-verifier)_
