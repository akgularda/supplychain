---
phase: 7
slug: scenario-stress-tests
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-21
---

# Phase 7 — Validation Strategy

> Scenario engine is PURE + unit-tested against REAL computed fixtures. "Concentration worsens" is asserted on
> HHI (1/k, monotonic) not the composite. Scenario outputs carry the honest `derived` provenance tag.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `node --test` (`.mjs`) |
| **Config file** | `package.json scripts.test` (register new files!) |
| **Command** | `npm test` |
| **Runtime** | ~5–15 s |

## Sampling Rate
- After each task commit: `npm test`
- Playwright smoke (run Taiwan preset → impact panel + highlight) before verification
- Before verification: full suite green (242 + scenario tests)

## Per-Task Verification Map

| Task | Wave | Req | Test Type | Assertion | Status |
|------|------|-----|-----------|-----------|--------|
| companyConcentration excludeSuppliers opt | 1 | DEPTH-03 | unit | additive; undefined → unchanged output (242 stay green); excluding a supplier lowers k | ⬜ |
| runScenario pure engine | 1 | DEPTH-03 | unit | Taiwan preset impacts EXACTLY {NVDA,AAPL,AVGO,000660.KS,AMD,AMAT,KLAC} (7); totalMarketCapExposed ≈ $11.36T (real sum); each k 5→4, HHI 0.200→0.250; concentrationAfter(HHI) ≥ before for impacted; no-op disruption safe | ⬜ |
| TSMC label bundle | 1 | DEPTH-03 | unit | preset bundles the 5 real normalized TSMC variants (not a single 'tsmc') | ⬜ |
| derived provenance on outputs | 2 | DEPTH-04 | unit | scenario output rendered with derived badge ("Derived", never observed) + methodology link | ⬜ |
| scenario UI wiring | 2 | DEPTH-03/04 | string | scenario panel + Taiwan preset button + impact panel + highlightBy of impacted; methodology copy updated | ⬜ |
| suite + smoke | 3 | DEPTH-03/04 | regression | `npm test` green; Playwright: run preset → "7 companies, $11.4T exposed" + graph highlight | ⬜ |

## Wave 0 Requirements
- [ ] Register tests/scenario.test.mjs (+ scenario-wiring.test.mjs) in package.json scripts.test

## Manual-Only Verifications
| Behavior | Req | Why Manual | Instructions |
|----------|-----|------------|--------------|
| Stress-test reads clearly; impact obvious | DEPTH-03 | Visual | http-server + Playwright; run Taiwan preset; see impacted companies + $cap + highlight; Derived badge |

## Validation Sign-Off
- [ ] runScenario pure, real fixtures (7 / $11.36T), HHI-based worsening
- [ ] excludeSuppliers additive (242 unchanged)
- [ ] Derived provenance on scenario outputs
- [ ] New test files registered; suite green
- [x] `nyquist_compliant: true`

**Approval:** pending
