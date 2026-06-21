---
phase: 9
slug: mobile-keyboard-accessibility
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-21
---

# Phase 9 — Validation Strategy

> Fix the verified gaps: unstyled chokepoints/scenario panels (overlap the fixed header), the 4 new controls
> missing from the mobile sheet, and the hero overlay not trapping focus. Node string asserts + a Playwright
> viewport/keyboard smoke. Suite stays green.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `node --test` (`.mjs`) + Playwright viewport/keyboard smoke |
| **Config file** | `package.json scripts.test` (explicit 24-file list — register new files!) |
| **Command** | `npm test` |
| **Runtime** | ~10–25 s (incl. Playwright) |

## Sampling Rate
- After each task commit: `npm test`
- Playwright 390×844 mobile + keyboard-only journey before verification
- Before verification: full suite green (275 + new a11y tests)

## Per-Task Verification Map

| Task | Wave | Req | Test Type | Assertion | Status |
|------|------|-----|-----------|-----------|--------|
| CSS position + responsive for #chokepointsPanel + #scenarioPanel + filterPanel/hero/modals | 1 | PERF-02 | string/visual | panels have position:fixed + @media(max-width:768px) rules; no header overlap; token spacing | ⬜ |
| mobile sheet gains the 4 new controls (Methodology/Tour/Chokepoints/Scenario) + wireMobile | 1 | PERF-02 | string/smoke | 4 buttons in #mobileSheet .mGrid wired via wireMobile; reachable at 390px | ⬜ |
| hero overlay focus-trap integration | 2 | PERF-03 | unit/smoke | hero routed through openModal/closeModal/trapFocus + central ESC; focus moves in on open, traps, restores on close | ⬜ |
| keyboard-only journey + new-control a11y | 2 | PERF-03 | unit/smoke | search→filter→select→reset all keyboard-operable; new controls focusable + accessible names; visible :focus; ARIA preserved (macro-site-accessibility green/extended) | ⬜ |
| suite + Playwright smoke | 3 | PERF-02/03 | regression | `npm test` green; 390×844 tap node→profile; keyboard `/`→type→Enter→Escape journey + focus-trap | ⬜ |

## Wave 0 Requirements
- [ ] Register tests/mobile-keyboard-a11y.test.mjs + tests/mobile-keyboard.spec.mjs in package.json scripts.test
- [ ] Confirm Playwright chromium binary available (or document Node-static fallback gate)

## Manual-Only Verifications
| Behavior | Req | Why Manual | Instructions |
|----------|-----|------------|--------------|
| Real phone usability + full keyboard nav | PERF-02/03 | Device/perceptual | open on a phone viewport; reach all panels via sheet; complete keyboard journey with no mouse |

## Validation Sign-Off
- [ ] New panels styled/positioned + responsive (no overlap)
- [ ] 4 new controls reachable on mobile
- [ ] Hero traps focus; keyboard journey complete; new controls operable
- [ ] ARIA preserved/improved; new test files registered; suite green
- [x] `nyquist_compliant: true`

**Approval:** pending
