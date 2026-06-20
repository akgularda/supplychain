---
phase: 3
slug: confidence-methodology-freshness
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-20
---

# Phase 3 — Validation Strategy

> Confidence math must be pure + unit-tested (bounds, monotonic decay, unknown→floor). Freshness must read
> the LIVE meta field (not hardcoded). Methodology must state real facts/limits. Suite stays green.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `node --test` (`.mjs`, `node:assert/strict`) |
| **Config file** | `package.json scripts.test` (explicit file list — register new files!) |
| **Quick/Full command** | `npm test` |
| **Estimated runtime** | ~5–15 s |

## Sampling Rate
- After each task commit: `npm test`
- Before verification: full suite green (144 + new confidence/methodology/freshness tests)

## Per-Task Verification Map

| Task | Wave | Req | Test Type | Automated Command / Assertion | Status |
|------|------|-----|-----------|-------------------------------|--------|
| served-file integrity | 0/1 | (blocker) | smoke | `data/top100-map.js` assigns window.SUPPLY_MAP_DATA with meta + nodes/links/profiles; render smoke loads | ⬜ |
| confidenceScore math | 1 | TRUST-03 | unit | bounds 0–100; observed>estimated>unknown; older source → lower score (monotonic); no source year → no decay; unknown→floor | ⬜ |
| tooltip shows score | 1 | TRUST-03 | string | viz tooltips render "Confidence: NN%" next to badge | ⬜ |
| Methodology view | 2 | TRUST-04 | string | accessible modal (role=dialog) with real source counts, weighting explanation, known limits; reachable entry point | ⬜ |
| Freshness indicator | 2 | TRUST-05 | unit/string | reads live meta.lastUpdated/generatedAt (not hardcoded); single owner for #lastUpdated | ⬜ |
| tests registered + green | 3 | TRUST-06 | regression | new files in package.json scripts.test; `npm test` green | ⬜ |

## Wave 0 Requirements
- [ ] Register new confidence/methodology/freshness `.mjs` test files in `package.json scripts.test`
- [ ] Resolve served `data/top100-map.js` shape (full meta+profiles+nodes+links) so freshness + app render are real

## Manual-Only Verifications
| Behavior | Req | Why Manual | Instructions |
|----------|-----|------------|--------------|
| Tooltip score + Methodology modal render in browser | TRUST-03/04 | Browser interaction | http-server + Playwright synthetic dataset; confirm score%, modal opens, freshness shows live date |

## Validation Sign-Off
- [ ] Score math unit-tested (bounds/monotonicity/unknown floor)
- [ ] Freshness reads live meta (no hardcoded date)
- [ ] New test files registered in package.json
- [ ] Served-file integrity confirmed (render smoke)
- [x] `nyquist_compliant: true`

**Approval:** pending
