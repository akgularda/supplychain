---
phase: 4
slug: design-system-smooth-motion
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-21
---

# Phase 4 — Validation Strategy

> Restyle is safe because NO test reads CSS — but markup class names/IDs and `badgeHtml` output MUST stay
> byte-identical. Motion: a view change must NOT recreate the simulation or alpha(1)-restart.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `node --test` (`.mjs`) |
| **Config file** | `package.json scripts.test` (register new files!) |
| **Command** | `npm test` |
| **Runtime** | ~5–15 s |

## Sampling Rate
- After each task commit: `npm test`
- Render/motion smoke (http-server + Playwright) before verification
- Before verification: full suite green (178 + new token/motion tests)

## Per-Task Verification Map

| Task | Wave | Req | Test Type | Assertion | Status |
|------|------|-----|-----------|-----------|--------|
| token set in base.css :root | 1 | STORY-01 | string/unit | key tokens (--color-*, --fs-*, --space-*, --radius-*, --shadow-*, --dur-*, --ease-*) present; 7 legacy vars kept as aliases | ⬜ |
| migrate CSS to tokens | 1 | STORY-01 | string/visual | base/layout/components/theme consume var(); `.confidence-high/medium/low` hues preserved EXACTLY; no markup class/ID renamed | ⬜ |
| build-once simulation | 2 | STORY-03 | unit/structure | render() split into buildSimulation()+updateGraph(); view change re-binds data + alphaTarget(0.3) (NOT alpha(1)/new forceSimulation); node x/y carried over | ⬜ |
| reduced-motion | 2 | STORY-03 | string | @media prefers-reduced-motion in CSS + matchMedia guard in viz | ⬜ |
| trust affordances intact | 2 | STORY-01/03 | regression | provenance/methodology/freshness tests still pass under new design | ⬜ |
| suite + smoke green | 3 | STORY-01/03 | regression | `npm test` green; Playwright smoke: paints, smooth mode-switch, badges visible | ⬜ |

## Wave 0 Requirements
- [ ] Register tests/design-tokens.test.mjs + tests/viz-motion.test.mjs in package.json scripts.test

## Manual-Only Verifications
| Behavior | Req | Why Manual | Instructions |
|----------|-----|------------|--------------|
| Visual coherence + smooth mode-switch motion | STORY-01/03 | Aesthetics + animation are visual | http-server + Playwright; switch global↔profile, observe no layout jump / no flash |

## Validation Sign-Off
- [ ] Tokens present + CSS migrated; trust hues preserved
- [ ] View change does not recreate simulation / alpha(1)-restart (tested)
- [ ] reduced-motion honored
- [ ] New test files registered
- [x] `nyquist_compliant: true`

**Approval:** pending
