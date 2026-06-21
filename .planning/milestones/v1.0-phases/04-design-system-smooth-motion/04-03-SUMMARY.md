---
phase: 04-design-system-smooth-motion
plan: 03
subsystem: viz
tags: [d3, force-simulation, motion, mental-map, prefers-reduced-motion, build-once, story-03, buildless]

# Dependency graph
requires:
  - phase: 04-design-system-smooth-motion
    plan: 01
    provides: "Wave 0 viz-motion RED gate (build-once / re-bind / gentle reheat / position carry / matchMedia assertions)"
  - phase: 04-design-system-smooth-motion
    plan: 02
    provides: "theme.css @media (prefers-reduced-motion) block (CSS half of the reduced-motion gate)"
provides:
  - "js/viz/index.js buildSimulation() — the force simulation built EXACTLY ONCE (idempotent), single d3.forceSimulation call site"
  - "js/viz/index.js updateGraph(graph) — per-view-change re-bind: position carry by id, in-place force re-tune, data-join enter/update/exit transitions, simulation.nodes()/force(link).links() re-bind, gentle alphaTarget(0.3)->0 reheat"
  - "matchMedia('(prefers-reduced-motion: reduce)') guard gating D3 transition durations (JS half of STORY-03 accessibility)"
  - "render() delegates node/link binding + simulation to updateGraph and no longer tears down on a view change (clearGraph reserved for genuine teardown only)"
  - "All 4 remaining viz-motion REDs closed — full suite 191/191 green; STORY-03 complete"
affects: [smooth-motion, accessibility, story-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Build-once / update-on-change D3 force simulation: construct forces with no node arg once, re-tune mode-dependent forces in place, re-bind nodes()/links() on view change instead of recreating"
    - "Mental-map position carry: prev = new Map(STATE.nodes by id); copy x/y/vx/vy onto new node objects so settled nodes don't fly from random seeds"
    - "Stable z-ordered layers (bands/links/particles/nodes) created once via ensureLayers(); bands redrawn per view, link/node/particle groups persist for the data-join + particle timer"
    - "Reduced-motion-gated D3 transitions: prefersReducedMotion() => duration 0 + skip the visible reheat"

key-files:
  created:
    - .planning/phases/04-design-system-smooth-motion/04-03-SUMMARY.md
  modified:
    - js/viz/index.js

key-decisions:
  - "Coherent single-file refactor committed as one feat (76a9bf7): the build-once split and the updateGraph routing are interdependent edits to the same render() block; splitting into two partial-state commits would have left an inconsistent bridge state."
  - "ticked() extracted as a named module-level handler reading the CURRENT module-level nodeSel/linkSel (Pitfall 4 — never a stale closure) and keeping the exact boundary clamp (topPad 78 / bottomPad 20 / m=(z||10)+12)."
  - "clearGraph() kept defined+exported for API compatibility but no longer CALLED on a view change (Pitfall 2) — grep-verified zero call sites."
  - "Reduced-motion branch in updateGraph skips the visible alphaTarget(0.3) reheat (snaps via alpha(0.05) then stop) and zeroes enter/exit + zoom transition durations, so motion-sensitive users get an instant layout (Pitfall 5)."

patterns-established:
  - "Build-once buildSimulation() + idempotent updateGraph(graph) replacing per-render forceSimulation teardown"
  - "Position carry by id for mental-map preservation across mode switches"

requirements-completed: [STORY-03]

# Metrics
duration: ~15min
completed: 2026-06-21
---

# Phase 4 Plan 03: Build-Once Simulation + Smooth View-Change Motion Summary

**js/viz/index.js render() is split into a one-time buildSimulation() and an idempotent updateGraph(graph): view changes now carry node positions across the rebind (mental map), re-tune the mode-dependent forces in place, data-join links/nodes with reduced-motion-gated enter/exit transitions, re-bind simulation.nodes()/force("link").links(), and gently reheat with alphaTarget(0.3)->0 — never alpha(1), never a new d3.forceSimulation. A matchMedia('(prefers-reduced-motion: reduce)') guard zeroes the D3 motion. This closes the 4 remaining viz-motion REDs and completes STORY-03; full suite 191/191.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-06-21
- **Tasks:** 2 (committed as one coherent feat — see Decisions)
- **Files modified:** 1 (js/viz/index.js)

## Accomplishments
- Added `buildSimulation()` — constructs the `d3.forceSimulation` EXACTLY ONCE with an idempotent guard (`if (STATE.simulation) return STATE.simulation`), forces created with no node argument, alphaDecay 0.016, and a shared named `ticked()` handler. Grep-verified: exactly one `d3.forceSimulation(` occurrence in the file; zero `alpha(1)`.
- Added `updateGraph(graph)` implementing 04-RESEARCH Pattern 2: (1) `prev = new Map(STATE.nodes by id)` then copy `x/y/vx/vy` onto matching new nodes for the mental map; (2) re-tune `charge`/`x`/`y` force strengths in place with the original mode-dependent values (global -180/0.03/0.4, profile -220/0.25/0.14); (3) data-join `linkLayer`/`nodeLayer` selections with `enter/update/exit` transitions whose duration is 0 under reduced motion else 350ms `d3.easeCubic`; (4) `simulation.nodes(STATE.nodes)` + `simulation.force("link").links(STATE.links)` re-bind; (5) `alphaTarget(0.3).restart()` then `setTimeout(() => sim.alphaTarget(0), 600)`.
- Extracted `ticked()`, `buildNodeChildren()`, `wireNodeHandlers()`, `wireLinkHandlers()`, and `ensureLayers()` helpers so the enter selection rebuilds the identical bn-ring + `.mc` circle (with `verified-node` class) + label/sub/country texts and the same drag + mouse/click handlers as the original render.
- Refactored `render()` to compute `graphForMode()`, update all chrome (title/subtitle/hint/control values/cards/stats/legend/sidebars/country buttons) + redraw the per-view layer bands, then delegate node/link binding + simulation to `updateGraph(graph)` — **no `clearGraph()` on a view change**. `render()` remains exported with an unchanged signature so `js/ui` openProfile/openGlobal/loadView and `js/main.js` first paint are untouched.
- Added module-level `prefersReducedMotion()` using `window.matchMedia('(prefers-reduced-motion: reduce)')`, gating both the D3 enter/exit transition durations and the zoom transition, and skipping the visible reheat under reduced motion.
- Preserved trust wiring untouched: `provenanceFor(`, `confidenceScore(`, the `Confidence: ${score}%` literal, and the `escapeHtml`-based `showTooltip`/`showLinkTooltip` innerHTML paths (no new unescaped innerHTML — T-04-06 mitigated).

## Task Commits

1. **Task 1 + Task 2: split render into buildSimulation + updateGraph (STORY-03)** - `76a9bf7` (feat)

(The two plan tasks are interdependent edits to the same `render()` block; committed as one coherent feat to avoid an inconsistent bridge state — see Decisions.)

## Files Created/Modified
- `js/viz/index.js` - Added `buildSimulation()`, `updateGraph(graph)`, `ticked()`, `buildNodeChildren()`, `wireNodeHandlers()`, `wireLinkHandlers()`, `ensureLayers()`, `prefersReducedMotion()`; refactored `render()` to delegate to `updateGraph` (no view-change teardown); stable band/link/particle/node layers created once. `clearGraph()` retained (defined + exported) but no longer called on a view change.

## Decisions Made
- The build-once split (Task 1) and the updateGraph routing (Task 2) are interdependent edits to the same `render()` body; a two-commit split would have committed an inconsistent intermediate (e.g. a `buildSimulation` plus a still-inline second `forceSimulation`). Committed as one coherent feat that satisfies both tasks' acceptance criteria simultaneously.
- `ticked()` reads the current module-level `nodeSel`/`linkSel` (reassigned each `updateGraph`) so the build-once tick handler never holds a stale selection (Pitfall 4).
- `clearGraph()` is preserved for genuine teardown but grep-verified to have zero call sites — no view-change path tears down the graph (Pitfall 2).
- Test regex contract honored exactly: used `simulation.nodes(` (not `sim.nodes(`), kept `matchMedia('(prefers-reduced-motion` adjacent (no optional-chaining `?.` between `matchMedia` and `(`), and reworded comments so no `alpha(1)` literal appears anywhere in the file.

## Deviations from Plan

None - plan executed as written. (Minor: Task 1 and Task 2 committed together rather than as two separate commits, because the edits are interdependent within one render() block — documented above. No behavior, file, or acceptance-criteria deviation.)

## Threat Mitigations Applied
- **T-04-06 (Tampering/Info-disclosure, tooltip innerHTML):** `showTooltip`/`showLinkTooltip` and their `escapeHtml`-based innerHTML paths left untouched; no new unescaped innerHTML introduced.
- **T-04-07 (DoS UX, leftover clearGraph/forceSimulation on a view change):** exactly one `d3.forceSimulation(` (build-once), no `alpha(1)`, `clearGraph()` no longer called on a view change — all grep-verified; viz-motion test asserts the contract.
- **T-04-08 (DoS a11y, D3 transitions ignoring reduced motion):** `matchMedia('(prefers-reduced-motion: reduce)')` guard zeroes D3 transition durations and skips the visible reheat.

## Test Results

- Baseline before plan: `npm test` = 191 tests / 187 pass / 4 fail (the intended Wave 0 viz-motion REDs).
- After plan: `npm test` = **191 tests / 191 pass / 0 fail.**
  - All 4 remaining viz-motion REDs now GREEN: build/update split exists; nodes/links re-bound (`simulation.nodes(` + `force("link").links(`); gentle reheat (`alphaTarget(` present, no `alpha(1)`); reduced-motion honored (viz `matchMedia` + theme.css `@media`).
  - The previously-green viz-motion assertions (build-once single `forceSimulation`, mental-map carry `prev.get(`, trust wiring) stay green.
  - All 178 pre-existing tests remain green; no class/ID/badge-HTML drift.

## Render / Motion Smoke (http-server + Playwright, chromium)
- Global view paints **100 nodes**, simulation running, **zero console/page errors**.
- Clicking a node performs a real mode switch (global → profile): **100 → 17 nodes**.
- **Exactly one `g.nodes` layer survives the switch** (`nodesLayerCount: 1`) — proves the simulation/layers are built once and re-bound, not torn down and recreated (the core STORY-03 evidence).
- Reduced-motion run (`emulateMedia reducedMotion: reduce`): `matchMedia` correctly detected, mode switch still works (100 → 17), transitions snap instantly, zero errors.
- Smoke harness scripts were temporary and removed after the run; no artifacts left in the tree.

## Next Phase Readiness
- STORY-03 is complete: build-once simulation, smooth mental-map-preserving view changes, and reduced-motion honoring (CSS + JS) are all in place. Combined with Plans 01–02, the full Phase 4 design-system + smooth-motion contract is implemented.
- No blockers. No new dependencies. Buildless deploy unchanged.

## Known Stubs
None — no hardcoded empty data, placeholder text, or unwired components introduced.

## Self-Check: PASSED

- FOUND: js/viz/index.js (buildSimulation + updateGraph present; 1 d3.forceSimulation; 0 alpha(1))
- FOUND: commit 76a9bf7 (feat 04-03 viz refactor)
- VERIFIED: npm test 191/191 green
- VERIFIED: Playwright smoke — single nodes layer across mode switch, zero errors

---
*Phase: 04-design-system-smooth-motion*
*Completed: 2026-06-21*
