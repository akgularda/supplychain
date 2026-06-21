---
phase: 05-hero-moment-investor-narrative
plan: 02
subsystem: ui-narrative
tags: [story-02, story-05, narrative, hero-controller, autoplay, reduced-motion, pure-module, tdd]
requires:
  - "buildNarrative(data): 4-step ordered narrative engine (Plan 01)"
provides:
  - "createHeroController({steps,controls,storage,reducedMotion,timers,render}): pure DOM-free autoplay/stepper state machine — { play, pause, next, prev, skip, getIndex }"
  - "tests/narrative.test.mjs: +11 GREEN controller assertions (autoplay/pause/next/prev/skip/reduced-motion/replay)"
affects:
  - js/main.js (Plan 03 injects real deps: controls from js/ui exports, storage=safeReadFlag/safeWriteFlag, reducedMotion=matchMedia, timers=window.setTimeout, render -> #heroOverlay)
  - index.html (Plan 03 adds #heroOverlay markup the render callback paints)
tech-stack:
  added: []
  patterns:
    - "Injected-deps controller factory (RESEARCH Pattern 2) — all side-effects (timers/storage/reducedMotion/controls/render) passed in, so the autoplay state machine unit-tests in Node with fakes, zero DOM/window"
    - "Chained scheduleNext() re-arm gated on !reducedMotion() — single timerId, cleared by pause/stop/skip (bounded autoplay, mitigates T-05-04)"
    - "Teardown discipline — stop()/skip() write heroSeen + resetHighlight + render(null) so the map is never left dimmed (RESEARCH Pitfall 4)"
key-files:
  created: []
  modified:
    - js/ui/narrative.js
    - tests/narrative.test.mjs
decisions:
  - "STEP_MS = 5500 (~5.5s/step) — 4 steps ~= 22s + reveal stays within the ~30s STORY-02 target (Claude's discretion per CONTEXT)"
  - "skip is an alias of stop — both perform identical teardown (heroSeen + resetHighlight + render(null)); end-of-autoplay and next()-past-last route through the same stop()"
  - "play() always restarts at index 0 and ignores stored heroSeen — replay is always allowed (RESEARCH mechanic 4)"
  - "reducedMotion gate lives only in scheduleNext() (returns before setTimeout) — show()/apply()/render still run so captions display; manual next() unaffected (RESEARCH mechanic 5)"
metrics:
  duration_min: 4
  tasks: 2
  files: 2
  completed: 2026-06-21
---

# Phase 05 Plan 02: Hero Controller State Machine Summary

`createHeroController({steps,controls,storage,reducedMotion,timers,render})` is the pure, DOM-free autoplay/stepper engine powering both the first-visit hero and the manual tour: it autoplays ~5.5s/step via injected timers, supports pause/next/prev/skip/replay, writes `heroSeen` + resets the highlight + clears the overlay on teardown, and suppresses the auto-advance timer entirely under reduced motion (manual Next only) — proven green with fake timers/storage/render, no browser.

## What Was Built

**Task 1 — controller behavior tests (TDD RED, commit a10a78a):**
- Extended `tests/narrative.test.mjs` (import now `buildNarrative, createHeroController`) with deterministic fakes: `fakeTimers()` (records callbacks, `fireTimer()` invokes the last live one, `clearTimeout` marks cleared, `scheduledCount`), `fakeStorage()` (in-memory map + `writes` log), `fakeRender()` (records `(step,index,total)` tuples), settable `reducedMotion`, and the Plan-01 `spyControls`.
- 11 assertions: play shows step 0 + schedules one timer; firing advances 0->1 and re-schedules; full-autoplay reaches the last step then stops + writes `heroSeen=1` + renders null; pause clears the timer; next advances + pauses auto; prev decrements + respects the lower bound; next past last triggers stop teardown (heroSeen + resetHighlight + render(null)); skip teardown writes `['heroSeen','1']` + resetHighlight once + render(null); reduced-motion schedules ZERO timers but still renders step 0; reduced-motion still allows manual next; replay runs even when stored `heroSeen==='1'`.
- `node --check tests/narrative.test.mjs` passes; suite RED (createHeroController not yet exported).

**Task 2 — createHeroController implementation (TDD GREEN, commit 5aec676):**
- Appended `export function createHeroController(...)` to `js/ui/narrative.js`, keeping the module DOM-free (no top-level `document`/`window`/`d3`, no `js/ui/index.js` import). Local `index`/`playing`/`timerId` state, `STEP_MS = 5500`.
- `show()` runs `steps[index].apply(controls)` then `render(step,index,total)`. `scheduleNext()` returns early when `reducedMotion()` is truthy, else `timers.setTimeout` advances + re-arms or `stop()`s at the last step. `pause()` clears the single `timerId`. `next()`/`prev()` pause then move within bounds (last `next()` -> `stop()`). `stop()`/`skip()` pause, `storage.write('heroSeen','1')`, optional `controls.resetHighlight()`, `render(null,...)`. Returns `{ play, pause, next, prev, skip, getIndex }`.

## TDD Gate Compliance

- RED: `test(05-02)` commit a10a78a — controller assertions failed (factory absent / not exported).
- GREEN: `feat(05-02)` commit 5aec676 — narrative suite passes 18/18.
- REFACTOR: none needed.

## Test Results

`npm test` = 214 tests / 210 pass / 4 fail.
- +11 new controller assertions GREEN (narrative suite now 18/18).
- 191 prior tests unchanged (no regression).
- The controller-presence + reduced-motion hero-wiring assertion (1 of the prior 5 Wave-0 REDs) flipped GREEN — `createHeroController` + `matchMedia('(prefers-reduced-motion'` now satisfied at the module level.
- 4 remaining failures are ALL in `tests/hero-wiring.test.mjs` — the INTENDED Wave-0 RED contract for Plan 03 (the `#heroOverlay`/`#heroTitle`/... markup in index.html and the `heroSeen`/`safeReadFlag`/`safeWriteFlag`/`#bTour` wiring in `js/main.js`). Zero narrative/controller failures.
- `node --test tests/narrative.test.mjs` = 18/18 fully green.

## Deviations from Plan

None — plan executed exactly as written. The implementation follows RESEARCH Pattern 2; `stop()` calls `render(null, index, list.length)` (the plan/research show `render(null)` — the extra positional args are harmless and keep the render signature consistent for Plan 03's overlay callback).

## Threat Surface

- T-05-04 (runaway autoplay timer, mitigate): satisfied — a single `timerId` is re-armed by `scheduleNext()` and cleared by `pause()`/`stop()`/`skip()`; autoplay is bounded by `steps.length` then `stop()`. Reduced motion schedules nothing.
- T-05-03 (heroSeen tamper, accept): unchanged — the flag only gates autoplay; no trust decision rides on it.
- No new threat surface: the module produces no HTML and touches no DOM; caption->DOM (T-05-01, textContent) remains Plan 03's render step.

## Known Stubs

None. The 4 remaining `hero-wiring.test.mjs` failures are a forward test contract (markup + main.js wiring), not stubs — closed by Plan 03.

## Self-Check: PASSED

`js/ui/narrative.js` contains `export function createHeroController`; both task commits (a10a78a test, 5aec676 feat) are in git history; `node --test tests/narrative.test.mjs` reports 18/18 pass.
