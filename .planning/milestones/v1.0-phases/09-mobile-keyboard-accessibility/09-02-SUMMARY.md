---
phase: 09-mobile-keyboard-accessibility
plan: 02
subsystem: ui-keyboard-a11y
tags: [a11y, keyboard, focus-trap, modal, perf-03]
requires:
  - "js/ui/index.js modal machinery (openModal/closeModal/trapFocus/activeModal + central keydown ESC switch)"
  - "js/ui/narrative.js createHeroController (skip persists heroSeen + resetHighlight)"
  - "#heroOverlay markup (role=dialog aria-modal=true) + #heroSkip/#heroPrev/#heroPause/#heroNext"
  - "09-01 mobile-sheet controls (mMethodology/mTour/mChokepoints/mScenario) + a11y test file"
provides:
  - "registerHeroOverlay/openHeroOverlay/closeHeroOverlay helpers in js/ui/index.js"
  - "hero overlay routed through activeModal/trapFocus + the central ESC switch (single ESC binding)"
  - "focus-in on open (#heroSkip), Tab trap, focus-restore on close for the hero overlay"
  - "extended keyboard/ARIA assertions in tests/mobile-keyboard-a11y.test.mjs"
affects: [js/main.js, js/ui/index.js, tests/hero-wiring.test.mjs, tests/mobile-keyboard-a11y.test.mjs]
tech-stack:
  added: []
  patterns:
    - "register-overlay-with-shared-modal-machinery (no hand-rolled trap loop)"
    - "open-transition-only focus-in (focus moves in once, not on every step)"
    - "single central ESC binding (fold scoped handler into the switch)"
key-files:
  created: []
  modified:
    - js/ui/index.js
    - js/main.js
    - tests/hero-wiring.test.mjs
    - tests/mobile-keyboard-a11y.test.mjs
decisions:
  - "Hero overlay reuses the existing activeModal/trapFocus machinery via 3 minimal exported helpers rather than duplicating a trap loop (Don't Hand-Roll)"
  - "Focus moves in ONLY on the hidden->visible transition so manual Next/Prev keep focus inside the overlay and never re-grab it mid-tour"
  - "ESC for the hero is bound exactly once in the central switch; main.js's scoped ESC->skip handler removed (no double-binding)"
  - "Visibility/content stay owned by heroRender (o.hidden + textContent); the helpers only manage focus + activeModal so autoplay timing + reducedMotion are untouched"
metrics:
  duration: "~6 min"
  completed: 2026-06-21
---

# Phase 9 Plan 02: Hero Overlay Focus Trap + Keyboard Journey (PERF-03) Summary

PERF-03 fix: the `#heroOverlay` declared `role=dialog aria-modal=true` but was toggled via `hidden` only, so it never trapped focus and Tab leaked to background controls (`#bReset`, the toolbar). It now routes through the existing `openModal/closeModal/trapFocus` + `activeModal` machinery via three minimal exported helpers — focus moves to `#heroSkip` on open, Tab/Shift+Tab stay inside the overlay, and focus restores to the trigger on close/skip — with Escape handled by the central keydown switch exactly once (the scoped ESC->skip handler in `js/main.js` was removed). The keyboard-only journey search('/')→filter→select→reset(Escape) was confirmed wired and the Node a11y test gained keyboard/ARIA/focus-ring assertions.

## What Was Built

| Task | Description | Commit |
|------|-------------|--------|
| A | Route `#heroOverlay` through modal trap + single central ESC switch; remove scoped main.js ESC handler; extend hero-wiring asserts | 9db8c6b |
| B | Assert keyboard journey + hero-trap wiring + accessible names + focus ring on all new controls | de9fda5 |

## Key Implementation Details

- **js/ui/index.js** — added `heroOverlayEl`/`heroEscapeCallback` module state plus three helpers:
  - `registerHeroOverlay(el, onEscape)` — main.js hands in the overlay element + skip callback.
  - `openHeroOverlay()` — stores `focusBeforeModal = document.activeElement`, sets `activeModal = heroOverlayEl`, and moves focus to `#heroSkip` (escape-without-mouse is one key away, RESEARCH Pattern 3 / OQ2). Reuses `getFocusableElements` as fallback. Never restarts the simulation (PERF-01).
  - `closeHeroOverlay()` — clears `activeModal` (only if it is the hero) and restores `focusBeforeModal`.
  - The central ESC switch gained one branch: `else if (activeModal === heroOverlayEl && heroEscapeCallback) heroEscapeCallback();`. The existing Tab branch (`trapFocus(e, activeModal)`) already traps any `activeModal`, so no Tab-handling change was needed.
- **js/main.js** — imports the three helpers; `registerHeroOverlay(heroOverlayEl, () => heroController.skip())`. `heroRender` now calls `openHeroOverlay()` on the `hidden -> visible` transition only (`wasHidden` guard) and `closeHeroOverlay()` on `render(null)`. The separate scoped `keydown` ESC->skip handler was deleted (single binding).
- **Autoplay/skip/replay preserved** — visibility + caption content remain owned by `heroRender` (`o.hidden`, `textContent`); the controller's `STEP_MS`/`reducedMotion`/`scheduleNext` timing is untouched. `skip()` still writes `heroSeen` + `resetHighlight` via the controller. All 13 narrative + 7 hero-wiring + no-restart tests stay green.
- **tests/hero-wiring.test.mjs** — added 5 PERF-03 assertions (helpers exported, main.js routes through them, `activeModal === heroOverlayEl` in the ESC switch, `#heroSkip` initial focus, scoped handler removed, no restart in the open path).
- **tests/mobile-keyboard-a11y.test.mjs** — added 4 assertions: hero-trap wiring present; the search('/')→filter→select→reset(Escape) shortcuts stay wired in `js/ui/index.js`; every new control (`bMethodology/bTour/bChokepoints/bScenarioTaiwan/bScenarioReset/scenarioChokepointSelect/heroSkip`) + the 4 mobile-sheet buttons are focusable with accessible names; `button:focus-visible` `--acc` ring preserved with no blanket `outline:none`.

## Deviations from Plan

None — plan executed as written. Tasks A and B were implemented exactly per the `<action>` blocks (reuse the modal machinery, fold the ESC binding, extend the a11y test). No bugs, missing functionality, or blocking issues required auto-fixes.

## Notes

- **macro-site-accessibility.test.mjs**: This test is NOT in `package.json` `scripts.test` (it is an orphaned macro-site test), and the `macro-site/` fixture directory does not exist in this checkout, so the file errors with ENOENT when run standalone. This is a pre-existing condition independent of this plan — neither the test nor the `macro-site/` directory was modified. The authoritative `npm test` gate (which excludes it, per the plan's interface note) is fully green. No orphaned macro-site file was added to `scripts.test`.

## Verification

- `node --test tests/no-restart-invariant.test.mjs tests/hero-wiring.test.mjs tests/narrative.test.mjs` → 40 pass / 0 fail (PERF-01 + hero/narrative green)
- `node --test tests/mobile-keyboard-a11y.test.mjs` → 11 pass / 0 fail
- `npm test` → **291 pass / 1 skip / 0 fail** (292 total; up from 282 pass — 9 new assertions added)

## Self-Check: PASSED
