---
phase: 06-concentration-risk-analytics
verified: 2026-06-21T00:00:00Z
status: passed
score: 7/7
overrides_applied: 0
re_verification: false
---

# Phase 6: Concentration & Risk Analytics — Verification Report

**Phase Goal:** Investors instantly grasp where supply-chain risk concentrates — quantified concentration and the critical single points of failure in the network, on real data.
**Verified:** 2026-06-21
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A supply-chain concentration score is computed and displayed per company/sector using real data only | VERIFIED | `js/analytics/index.js` exports `companyConcentration` (bounded [0,100], composite HHI+sharedFrac) and `sectorConcentration` (reuse% + effectiveSuppliers). Wired in `js/ui/index.js` `renderCardInsights` — displayed in `#cardConcentration` as "Supplier concentration NN/100 (HHI-based)". Real anchors confirmed: GILD=36, NVDA=12, Healthcare reuse=12%, Finance reuse=9% — all test-locked. |
| 2 | Risk and bottleneck analytics highlight critical single points of failure in the network | VERIFIED | `supplierCriticality` ranks by fan-in (not editorial `d.bn`). `#chokepointsPanel` / `#chokepointsList` rendered via `renderChokepoints()`. `#bChokepoints` calls `highlightChokepoints()` which calls `highlightBy()` with a normalized-label predicate. `#bChokepointsReset` calls `resetHighlight()`. Top chokepoint "credit and risk data inputs" fan-in=4 test-locked. |
| 3 | Each displayed analytic carries provenance consistent with the Phase 2-3 trust layer (no unsourced derived numbers) | VERIFIED | `provenanceFor({derived:true, n})` branch-0 added to `js/trust/index.js` before marketcap check; returns tag "derived", never "observed". `badgeHtml` maps derived→"Derived" (confidence-medium). Badge rendered in profile card via `badgeHtml(provenanceFor({derived:true, n:c.n}, {methodologyUrl:"#methodology"}))`. Test-enforced: `doesNotMatch(/Observed/)`. |
| 4 | DEPTH-01: companyConcentration is bounded [0,100] and monotonic | VERIFIED | `Math.max(0, Math.min(100, Math.round(...)))` clamp confirmed in source. Tests verify monotonicity in k (fewer suppliers => not-lower score) and in sharedFrac (more shared => not-lower score). All 100 profiles return integer scores in [0,100]. |
| 5 | DEPTH-02: supplierCriticality keyed on real fan-in, no editorial bn flag | VERIFIED | Source check in `criticality-wiring.test.mjs` confirms `/\.bn\b/.test(body)` is false. Fan-in histogram exactly `{1:439, 2:13, 3:5, 4:1}` test-locked against real dataset. |
| 6 | Equal-weight HHI assumption explicitly stated (no fabrication) | VERIFIED | Module comment in `js/analytics/index.js` lines 6-17 states assumption verbatim: "the dataset has NO per-supplier volume/share field — every `supplier-input` link weight `l.v` is the constant 2". Methodology modal in `index.html` restates this with "equal-weight" language and "1/k" formula. |
| 7 | npm test green at 242/242 with concentration + criticality test files registered | VERIFIED | `npm test` run produced: 242 pass, 0 fail, 0 cancelled, 0 skipped. Both `tests/concentration.test.mjs` and `tests/criticality-wiring.test.mjs` are listed in `package.json` scripts.test (entries 19 and 20 in the enumerated list). |

**Score:** 7/7 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `js/analytics/index.js` | Pure DOM-free companyConcentration / sectorConcentration / supplierCriticality + buildSupplierFanIn | VERIFIED | 134 lines, all four functions exported, no DOM/window references, imports from `../data/index.js` only |
| `tests/concentration.test.mjs` | DEPTH-01 bounds, monotonicity, real anchors, sector grouping | VERIFIED | 10 tests, all pass. Covers integer bounds, null return, GILD=36/NVDA=12 anchors, monotonicity in k and sharedFrac, sector layer grouping, tunable weights |
| `tests/criticality-wiring.test.mjs` | DEPTH-02 ranking, fan-in parity, histogram, no-d.bn assertion, derived provenance, UI/HTML string-wiring | VERIFIED | 17 tests (7 criticality + 6 derived-provenance + 4 UI/HTML wiring), all pass |
| `js/trust/index.js` | derived branch in provenanceFor (branch-0), badgeHtml "Derived" mapping | VERIFIED | Lines 27-34: `if (input && input.derived === true)` returns `{tag:"derived", note:...}`. Lines 103-105: `tag === "derived" ? "Derived"` and `"confidence-medium"`. |
| `js/ui/index.js` | Imports companyConcentration + supplierCriticality; renderCardInsights; renderChokepoints; highlightChokepoints; wireUI wires buttons | VERIFIED | Line 16: `import { companyConcentration, supplierCriticality } from "../analytics/index.js"`. Lines 466-476: concentration badge rendered. Lines 636-659: renderChokepoints + highlightChokepoints. Lines 871-872: wireUI wires #bChokepoints and #bChokepointsReset. |
| `index.html` | #cardConcentration, #chokepointsPanel, #chokepointsList, #bChokepoints, #bChokepointsReset, Methodology formulas | VERIFIED | All five IDs confirmed present. Methodology modal contains concentration formula (0.6/0.4 weights, equal-weight, 1/k), fan-in explanation, "derived" annotation. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `js/ui/index.js` | `js/analytics/index.js` | `import { companyConcentration, supplierCriticality }` | WIRED | Line 16 of ui/index.js |
| `js/ui/index.js` | `js/trust/index.js` | `import { provenanceFor, badgeHtml }` | WIRED | Line 15 of ui/index.js |
| `renderCardInsights` | `#cardConcentration` DOM host | `cardConcentration.innerHTML = ...` | WIRED | Lines 466-476 of ui/index.js |
| `renderChokepoints` | `#chokepointsList` DOM host | `chokepointsListEl.innerHTML = ...` | WIRED | Lines 636-650 of ui/index.js |
| `wireUI` | `#bChokepoints` button | `addEventListener("click", highlightChokepoints)` | WIRED | Line 871 of ui/index.js |
| `wireUI` | `#bChokepointsReset` button | `addEventListener("click", resetHighlight)` | WIRED | Line 872 of ui/index.js |
| `provenanceFor({derived:true})` | `badgeHtml` | Called in renderCardInsights to produce badge HTML | WIRED | Line 471 of ui/index.js |
| `supplierCriticality` | `highlightBy` (viz) | `highlightChokepoints()` calls `highlightBy(predicate)` | WIRED | Lines 654-659 of ui/index.js |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `renderCardInsights` (concentration badge) | `c = companyConcentration(symbol, {profiles: DATA.profiles})` | `DATA.profiles` from frozen dataset; companyConcentration reads real supplier nodes and fan-in map | Yes — fan-in computed from real graph; GILD=36, NVDA=12 test-locked | FLOWING |
| `renderChokepoints` (chokepoints list) | `rows = getChokepoints()` → `supplierCriticality({profiles: DATA.profiles, limit:8})` | `DATA.profiles` from frozen dataset; fan-in is real graph traversal | Yes — histogram `{1:439,2:13,3:5,4:1}` test-locked | FLOWING |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| npm test 242/242 green | `npm test` | 242 pass, 0 fail, 0 cancelled, 0 skipped, duration 1377ms | PASS |
| companyConcentration GILD=36 | Listed in concentration.test.mjs anchor test | `assert.equal(gild.score, 36)` passes | PASS |
| companyConcentration NVDA=12 | Listed in concentration.test.mjs anchor test | `assert.equal(nvda.score, 12)` passes | PASS |
| Top chokepoint fan-in=4 | Listed in criticality-wiring.test.mjs | `assert.equal(ranked[0].fanIn, 4)` passes | PASS |
| derived badge never emits "Observed" | Listed in criticality-wiring.test.mjs | `doesNotMatch(html, /Observed/)` passes | PASS |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DEPTH-01 | 06-01, 06-02, 06-03 | Supply-chain concentration score computed and displayed per company/sector on real data | SATISFIED | companyConcentration bounded [0,100], GILD=36, NVDA=12 anchors; sectorConcentration reuse%; displayed in #cardConcentration with Derived badge |
| DEPTH-02 | 06-01, 06-02, 06-03 | Risk and bottleneck analytics highlight critical single points of failure | SATISFIED | supplierCriticality fan-in ranking (top=4); #chokepointsPanel + #bChokepoints highlight wired; bn flag never referenced |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | No TBD/FIXME/XXX markers in phase files | — | — |

Scan covered: `js/analytics/index.js`, `js/trust/index.js`, `js/ui/index.js` (Phase 6 modified files). Zero debt markers found. No stub patterns — all functions produce real computed values from the frozen dataset.

---

## Human Verification Required

None. All Phase 6 success criteria are verifiable programmatically:
- Analytics math is pure and unit-tested against real-data anchors
- Trust provenance tagging is test-enforced (`doesNotMatch(/Observed/)`)
- UI/HTML wiring is verified by string-pattern tests in criticality-wiring.test.mjs
- Full test suite runs in-process via `npm test`

The Playwright integration smoke (06-03-SUMMARY.md) is noted as having been run by the orchestrator but is not re-run here — visual rendering of the Derived badge in a real browser and the chokepoints panel appearance remain human-verifiable items for the 06-03 gate closure record, not a gap in Phase 6 analytics correctness.

---

## Gaps Summary

None. All 7 must-have truths are VERIFIED with direct codebase evidence.

---

_Verified: 2026-06-21T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
