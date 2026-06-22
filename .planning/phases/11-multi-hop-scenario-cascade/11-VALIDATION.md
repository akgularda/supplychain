---
phase: 11
slug: multi-hop-scenario-cascade
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-22
---

# Phase 11 — Validation Strategy

> Multi-hop is a real superset over 6 honest bridge edges. Engine default maxHops=1 (v1.0 backward-compat);
> UI opts into maxHops:3. No fabricated edges. Suite stays green at 301 + new cascade tests.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `node --test` (`.mjs`) |
| **Config file** | `package.json scripts.test` (register new file!) |
| **Command** | `npm test` |
| **Runtime** | ~5–15 s |

## Sampling Rate
- After each task commit: `npm test`
- Playwright scenario smoke (Taiwan → 8 firms/$13.28T + hop breakdown) before verification
- Before verification: full suite green (301 + cascade tests)

## Per-Task Verification Map

| Task | Wave | Req | Test Type | Assertion | Status |
|------|------|-----|-----------|-----------|--------|
| runScenario maxHops + BFS + selfLabels bridges | 1 | CASC-01 | unit | default maxHops=1 reproduces v1.0 EXACTLY (7 firms / 11360589871184); maxHops>=2 Taiwan = 8 firms / $13.28T, byHop {1:7,2:1}; cycle-safe on synthetic cyclic fixture (terminates); maxHops bound respected | ⬜ |
| hop labeling + byHop/maxHopReached | 1 | CASC-01/02 | unit | each impacted has `hop`; byHop groups correctly; multiHop ⊇ singleHop on real data | ⬜ |
| scenario UI hop breakdown | 2 | CASC-02/03 | string/smoke | panel shows direct-vs-indirect split + "N across H hops · $X.XT"; runTaiwan/runChokepoint pass maxHops:3; derived badge kept; headline derived live (no hardcoded 8/$13.28T) | ⬜ |
| methodology multi-hop copy | 2 | CASC-03 | string | Methodology explains multi-hop model + bound + assumptions; KEEPS literal "direct dependents" so methodology-wiring test stays green | ⬜ |
| register + suite | 1/3 | CASC-04 | regression | tests/scenario-cascade.test.mjs in package.json scripts.test; `npm test` green (301 + new) | ⬜ |

## Wave 0 Requirements
- [ ] Register tests/scenario-cascade.test.mjs in package.json scripts.test

## Manual-Only Verifications
| Behavior | Req | Why Manual | Instructions |
|----------|-----|------------|--------------|
| Cascade reads clearly; hop breakdown obvious | CASC-02 | Visual | http-server + Playwright; run Taiwan; see 8 firms/$13.28T + direct/indirect split |

## Validation Sign-Off
- [ ] Engine default maxHops=1 backward-compat (v1.0 fixtures unchanged)
- [ ] Multi-hop superset real (8/$13.28T via real bridges); cycle-safe; bounded
- [ ] UI hop breakdown + derived badge + live headline; methodology keeps "direct dependents"
- [ ] New test file registered; suite green
- [x] `nyquist_compliant: true`

**Approval:** pending
