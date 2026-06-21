---
phase: 6
slug: concentration-risk-analytics
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-21
---

# Phase 6 — Validation Strategy

> Analytics are PURE + unit-tested (bounds, monotonicity). All numbers derive from real graph data with stated
> assumptions (equal-weight HHI since l.v is constant). Derived numbers carry an honest `derived` provenance tag.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `node --test` (`.mjs`) |
| **Config file** | `package.json scripts.test` (register new files!) |
| **Command** | `npm test` |
| **Runtime** | ~5–15 s |

## Sampling Rate
- After each task commit: `npm test`
- Playwright smoke (concentration shown in profile, chokepoints panel/highlight, derived badge) before verification
- Before verification: full suite green (214 + analytics tests)

## Per-Task Verification Map

| Task | Wave | Req | Test Type | Assertion | Status |
|------|------|-----|-----------|-----------|--------|
| concentration(company) pure | 1 | DEPTH-01 | unit | C=round(100·(0.6·(1/k)+0.4·sharedFrac)); bounded 0–100; monotonic in k and sharedFrac; real example GILD≈36 / NVDA≈12 | ⬜ |
| sector concentration | 1 | DEPTH-01 | unit | per-layer reuse% + effective-supplier count (1/HHI); uses layers[node.y]; real Healthcare≈12% | ⬜ |
| criticality ranking pure | 1 | DEPTH-02 | unit | rank suppliers by fan-in (supplierToSymbols); more dependents → higher; top chokepoint fan-in=4 | ⬜ |
| derived provenance tag | 2 | DEPTH-02 | unit | provenanceFor({derived:true,n}) → {tag:'derived', note, source:Methodology}; badgeHtml "Derived"; never 'observed' | ⬜ |
| display wiring | 2 | DEPTH-01/02 | string | profile shows concentration + derived badge; chokepoints panel + highlightBy; methodology copy updated | ⬜ |
| suite + smoke | 3 | DEPTH-01/02 | regression | `npm test` green; Playwright: concentration in profile, chokepoints highlight, derived badges | ⬜ |

## Wave 0 Requirements
- [ ] Register tests/concentration.test.mjs + tests/criticality-wiring.test.mjs in package.json scripts.test

## Manual-Only Verifications
| Behavior | Req | Why Manual | Instructions |
|----------|-----|------------|--------------|
| Analytics read clearly + chokepoints visible | DEPTH-01/02 | Visual | http-server + Playwright; open a profile, see concentration + derived badge; open chokepoints, highlight in graph |

## Validation Sign-Off
- [ ] Concentration + criticality pure, bounded, monotonic (tested with real examples)
- [ ] Derived provenance tag (honest, never observed)
- [ ] New test files registered; suite green
- [x] `nyquist_compliant: true`

**Approval:** pending
