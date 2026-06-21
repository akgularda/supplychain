# Phase 4: Design System & Smooth Motion - Research

**Researched:** 2026-06-21
**Domain:** CSS design tokens (buildless, vanilla CSS custom properties) + D3.js v7 force-simulation motion lifecycle
**Confidence:** HIGH

## Summary

This phase is **systematization + polish, not a redesign**. Two deliverables sit on a codebase
that is already well-structured: (1) consolidate ~7 ad-hoc CSS custom properties + dozens of
hardcoded color/size/spacing/shadow/transition literals into a coherent `:root` token set, then
refactor base/layout/components/theme to consume tokens with **zero intended visual change**; and
(2) stop the D3 force simulation being torn down and rebuilt on every `render()` — build it **once**,
re-bind nodes/links on view change, and use a gentle `alphaTarget` reheat that preserves node
positions (mental map).

Two findings materially de-risk the work. **First**, no test reads any `.css` file — the entire
178-test suite is string/structure matching against `index.html` and `js/**` source. Restyle is
safe as long as class names and IDs in markup and the trust-badge HTML stay byte-identical.
**Second**, the only `render()` call sites that cause full simulation teardown are **mode switches**
(`openProfile`, `openGlobal`, `loadView`) — `applyFilters` already routes through `highlightBy()`
(opacity transitions, no rebuild) and highlight/reset are already smooth. So the "jank" surface is
narrow and well-bounded: three mode-switch entry points.

A subtle but load-bearing detail for trust: `.prov-badge` has **no CSS rule anywhere**. Provenance
badges render with classes `prov-badge confidence-badge confidence-{high|medium|low}` and inherit
ALL their visual semantics from `.confidence-high/medium/low` in `components.css`. Those three rules
are the trust color contract and must keep their green / amber / neutral hues exactly.

**Primary recommendation:** Define a full token set in `:root` inside `base.css` (loaded first, so
tokens cascade everywhere), keep the existing 7 vars (`--bg --text --dim --acc --blue --green
--purple`) as aliases pointing at the new tokens, migrate literals file-by-file to tokens, and
refactor `render()` to split into a one-time `buildSimulation()` + an idempotent `updateGraph()`
that calls `simulation.nodes(...)`, `force("link").links(...)`, then `alphaTarget(0.3).restart()`
→ `alphaTarget(0)` instead of `d3.forceSimulation(...)` from scratch.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Design tokens (`:root` vars) | Browser / Client (CSS) | — | Pure presentation; CSS custom properties resolve in the browser |
| Token consumption (restyle) | Browser / Client (CSS) | — | base/layout/components/theme `.css` only |
| Force-simulation lifecycle | Browser / Client (JS) | — | `d3.forceSimulation` runs client-side in `js/viz/index.js` |
| View-change motion (mode switch) | Browser / Client (JS) | — | `render()` / new `updateGraph()` in viz; triggered by ui controls |
| Reduced-motion honoring | Browser / Client (CSS + JS) | — | `@media (prefers-reduced-motion)` in CSS; `matchMedia` guard in JS for D3 transitions |
| Token-presence + no-restart tests | Build/Test tooling (Node) | — | `node --test`, string/structure assertions, no browser |

**Why this matters:** Every capability in Phase 4 is client-side presentation/motion. There is no
API/data/storage tier involvement — the data contract is frozen and the served data already paints
(Phase 3 fix). This keeps the blast radius small: nothing here can break the trust pipeline's data
correctness, only its *styling*, which is protected by the badge-class contract below.

## Standard Stack

This phase adds **no new dependencies**. It is vanilla CSS custom properties + the already-loaded D3 v7.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| CSS Custom Properties (`:root` vars) | native | Design tokens (color/type/space/radii/elevation/motion) | Buildless, zero-dep, cascade-native; the only token mechanism compatible with the frozen static GitHub-Pages deploy [CITED: developer.mozilla.org/en-US/docs/Web/CSS/--*] |
| D3.js | 7.8.5 (already loaded via CDN) | Force simulation + transitions | Already the viz engine; `d3-force` + `d3-transition` provide build-once/update + eased motion [VERIFIED: index.html L8 loads d3 7.8.5] |
| `prefers-reduced-motion` media query | native | Accessibility motion gating | W3C MQ Level 5; standard a11y control [CITED: developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion] |
| `node:test` + `node:assert` | Node built-in | Token/motion tests | Already the repo test convention (all 14 registered files use it) [VERIFIED: package.json scripts.test] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `window.matchMedia('(prefers-reduced-motion: reduce)')` | native | JS-side reduced-motion guard for D3 transition durations | When setting `.transition().duration(...)` for view changes — read once, shorten/skip |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw `:root` custom properties | Sass/PostCSS variables, a design-token build (Style Dictionary) | Requires a build step — **violates the frozen buildless static-deploy constraint**. Rejected. |
| `simulation.nodes()` re-bind | Recreate `d3.forceSimulation` each render (current) | Recreate is what causes the jank and loses positions. Rejected — that IS the bug. |
| `alphaTarget(0.3).restart()` gentle reheat | `alpha(1).restart()` | `alpha(1)` is a full from-scratch reheat → nodes fly across the screen. Use the gentle nudge. |

**Installation:** None. `npm install` unchanged. (Verified: package.json has only `playwright` +
`http-server`; no new packages needed — confirmed against the buildless constraint.)

## Package Legitimacy Audit

> No external packages are installed in this phase. Section included for completeness.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| (none) | — | — | — | — | — | No installs this phase |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

D3 7.8.5 is loaded via CDN `<script>` (not npm) and is pre-existing — not introduced by this phase.

## Architecture Patterns

### System Architecture Diagram

```
                        USER INTERACTION (ui controls)
                                   │
        ┌──────────────────────────┼───────────────────────────────┐
        │                          │                                │
   mode switch                 filter apply                    hover / click
 (openProfile /              (applyFilters)                  (node/link events)
  openGlobal /                    │                                │
  loadView)                       ▼                                ▼
        │                   highlightBy(fn)                  highlightNode /
        │              ── opacity transitions ──             showTooltip
        │                   NO rebuild  ✓ already smooth      NO rebuild ✓
        ▼
   render()  ◄── TODAY: clearGraph() (L173) stops+removes everything,
        │          then d3.forceSimulation(...) NEW each call (L589)  ✗ JANK
        │
        ▼  ── PROPOSED SPLIT ──
   ┌─────────────────────────────────────────────────────────────┐
   │ buildSimulation()  (ONCE, at module init / first render)      │
   │   STATE.simulation = d3.forceSimulation()...on("tick", ...)   │
   └─────────────────────────────────────────────────────────────┘
        │
        ▼
   ┌─────────────────────────────────────────────────────────────┐
   │ updateGraph()  (EVERY view change)                            │
   │   1. compute new graphForMode() nodes/links                   │
   │   2. CARRY OVER x/y/vx/vy from prior nodes by id (mental map) │
   │   3. data-join: linkSel/nodeSel .data(...).join(enter,upd,exit)│
   │      with motion-token transitions on enter/exit              │
   │   4. simulation.nodes(newNodes)                               │
   │      simulation.force("link").links(newLinks)                 │
   │   5. simulation.alphaTarget(0.3).restart(); then →0  (gentle) │
   └─────────────────────────────────────────────────────────────┘
        │
        ▼
   on("tick") updates link x1/y1/x2/y2 + node transform   (unchanged)
```

### Token Layering (CSS cascade)

```
base.css      → :root { ...ALL tokens... }  + legacy aliases (--bg etc.)   [loads 1st]
layout.css    → consumes tokens                                            [loads 2nd]
components.css→ consumes tokens (incl. trust .confidence-* — colors stay)  [loads 3rd]
theme.css     → media queries + transitions; consumes motion tokens       [loads 4th]
```

Because `:root` is in **base.css (first)**, tokens are defined before any consumer rule — the
cascade resolves correctly with no reordering of the four `<link>` tags in index.html.

### Pattern 1: Token definition with legacy aliases (zero-risk migration)
**What:** Define new tokens AND keep the 7 existing var names as aliases so any rule still
referencing `var(--acc)` keeps working unchanged.
**When to use:** Migrating the `:root` block in base.css.
**Example:**
```css
/* Source: pattern derived from MDN CSS custom properties [CITED: developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties] */
:root{
  /* color — surfaces (preserve current dark aesthetic) */
  --color-bg:#0a0a0a; --color-surface:#0f0f0f; --color-surface-raised:#1a1a1a;
  --color-border:#222; --color-border-subtle:rgba(255,255,255,0.08);
  /* color — text */
  --color-text:#d4d4d4; --color-text-muted:#888; --color-text-dim:#505050;
  /* color — brand/accent */
  --color-accent:#e8453c; --color-blue:#4488cc; --color-purple:#9c27b0;
  /* color — SEMANTIC TRUST (must match .confidence-* hues) */
  --color-observed:#66bb6a;  /* green  → confidence-high   */
  --color-estimated:#ffb300; /* amber  → confidence-medium */
  --color-unknown:#9e9e9e;   /* neutral→ confidence-low    */
  --color-success:#4caf50;
  /* type scale */
  --fs-xs:8px; --fs-sm:9px; --fs-base:10px; --fs-md:11px; --fs-lg:14px; --fs-xl:18px; --fs-2xl:20px;
  --fw-light:300; --fw-regular:400; --fw-medium:500; --fw-semibold:600; --fw-bold:700;
  --lh-tight:1.05; --lh-base:1.2; --lh-relaxed:1.5;
  --font-mono:'JetBrains Mono',monospace; --font-display:'Bricolage Grotesque',sans-serif; --font-ui:'Inter',sans-serif;
  /* spacing */
  --space-1:2px; --space-2:4px; --space-3:6px; --space-4:8px; --space-5:10px; --space-6:12px; --space-7:16px; --space-8:24px;
  /* radii */
  --radius-xs:2px; --radius-sm:3px; --radius-md:4px; --radius-lg:6px; --radius-xl:8px; --radius-2xl:12px;
  /* elevation */
  --shadow-sm:0 2px 8px rgba(0,0,0,0.3);
  --shadow-md:0 4px 20px rgba(0,0,0,0.4);
  --shadow-lg:0 8px 32px rgba(0,0,0,0.4),0 2px 8px rgba(0,0,0,0.3);
  /* motion */
  --dur-fast:150ms; --dur-base:200ms; --dur-slow:400ms;
  --ease-standard:cubic-bezier(0.4,0,0.2,1);
  --ease-emphasized:cubic-bezier(0.2,0,0,1);
  /* legacy aliases — keep existing rules working untouched */
  --bg:var(--color-bg); --text:var(--color-text); --dim:var(--color-text-dim);
  --acc:var(--color-accent); --blue:var(--color-blue); --green:var(--color-success); --purple:var(--color-purple);
}
```

### Pattern 2: Build-once / update-on-change simulation
**What:** Separate the one-time simulation construction from the per-view-change data update.
**When to use:** The core STORY-03 fix — replaces today's `clearGraph()` + `d3.forceSimulation()` per render.
**Example:**
```javascript
// Source: pattern per d3-force docs + Observable "Modifying a Force-Directed Graph"
//   [CITED: d3js.org/d3-force/simulation] [CITED: observablehq.com/@d3/modifying-a-force-directed-graph]

// --- ONCE ---
function buildSimulation() {
  if (STATE.simulation) return STATE.simulation;
  STATE.simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(d => d.id).distance(d => d.v >= 3 ? 70 : 110).strength(d => (d.v||1)*0.11))
    .force("charge", d3.forceManyBody())
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .force("collision", d3.forceCollide().radius(d => (d.z||10)+8))
    .alphaDecay(0.016)
    .on("tick", ticked);           // ticked() reads current STATE selections
  return STATE.simulation;
}

// --- EVERY VIEW CHANGE ---
function updateGraph(graph) {
  const sim = buildSimulation();

  // 1. PRESERVE MENTAL MAP: carry x/y/vx/vy from prior nodes by id.
  const prev = new Map(STATE.nodes.map(n => [n.id, n]));
  graph.nodes.forEach(n => {
    const p = prev.get(n.id);
    if (p) { n.x = p.x; n.y = p.y; n.vx = p.vx; n.vy = p.vy; }
    // new nodes get computed seed positions (existing band/profile layout code)
  });
  STATE.nodes = graph.nodes; STATE.links = graph.links;

  // 2. re-tune mode-dependent forces (was inline in the old forceSimulation call)
  sim.force("charge").strength(STATE.mode === "global" ? -180 : -220);
  sim.force("x").x(d => STATE.mode === "global" ? W/2 : d.targetX).strength(STATE.mode === "global" ? 0.03 : 0.25);
  sim.force("y").y(d => d.targetY).strength(STATE.mode === "global" ? 0.4 : 0.14);

  // 3. data-join with enter/update/exit + motion-token transitions
  const dur = prefersReducedMotion() ? 0 : 350;  // ≈ --dur between base & slow; emphasized ease
  linkSel = g.select(".links").selectAll("line").data(graph.links, linkKey)
    .join(
      enter => enter.append("line").attr("stroke-opacity",0).call(e=>e.transition().duration(dur).attr("stroke-opacity",1)),
      update => update,
      exit => exit.call(e=>e.transition().duration(dur).attr("stroke-opacity",0).remove())
    );
  nodeSel = g.select(".nodes").selectAll("g.node").data(graph.nodes, d=>d.id)
    .join(
      enter => enter.append("g").attr("class","node").attr("opacity",0).call(buildNodeChildren).call(e=>e.transition().duration(dur).attr("opacity",1)),
      update => update,
      exit => exit.call(e=>e.transition().duration(dur).attr("opacity",0).remove())
    );

  // 4. RE-BIND data to the SAME simulation (re-initializes forces; keeps positions)
  sim.nodes(graph.nodes);
  sim.force("link").links(graph.links);

  // 5. GENTLE reheat — NOT alpha(1). Settles softly, mental map preserved.
  sim.alphaTarget(0.3).restart();
  STATE.settleTimer = setTimeout(() => sim.alphaTarget(0), 600);
}

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
```

**Key API facts (HIGH confidence):**
- `simulation.nodes(newNodes)` re-binds nodes and **re-initializes every bound force** with the new
  node set — you do NOT recreate the simulation [CITED: d3js.org/d3-force/simulation].
- `simulation.force("link").links(newLinks)` re-binds the link force in place.
- Nodes that already carry `x/y/vx/vy` keep them; only nodes **without** positions get the default
  phyllotaxis seed — so carrying positions over by id preserves the mental map.
- `alphaTarget(t).restart()` warms the simulation toward target alpha `t` (gentle); `alpha(1)` is a
  full from-scratch reheat (jarring). Use `alphaTarget(0.3)` then drop to `0`.

### Anti-Patterns to Avoid
- **`clearGraph()` + `d3.forceSimulation(...)` per render:** the current jank source — destroys all
  positions and re-runs from random seeds. Replace with build-once + update.
- **`alpha(1).restart()` on view change:** flings nodes across the canvas. Use `alphaTarget` nudge.
- **Hardcoding new color/size literals during restyle:** every literal you touch should become a
  `var(--token)`. Introducing fresh literals defeats the systematization.
- **Renaming any `.confidence-*` / `.source-link` / `#id` hook:** breaks trust styling and/or the
  string-match test contract. Tokens are *additive* — restyle through them, never rename hooks.
- **Reordering the four CSS `<link>` tags:** `:root` lives in base.css (first); reordering can break
  the cascade for legacy aliases.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Smooth view-change motion | Manual rAF tweening of node x/y | `simulation.alphaTarget().restart()` + `d3.transition()` | D3 force already integrates velocity + collision; hand-tweening fights it |
| Enter/exit element churn | Manual add/remove loops over data diffs | `selection.data(key).join(enter,update,exit)` | D3 join is the canonical, bug-tested diff |
| Eased timing | Custom easing math in CSS/JS | motion tokens (`--ease-standard/emphasized`, `--dur-*`) + `d3.easeCubic*` | One source of truth; reduced-motion gate flips them off |
| Reduced-motion detection | Custom toggle/heuristic | `@media (prefers-reduced-motion)` + `matchMedia` | OS-level user setting; standard and respected by AT |
| Design-token pipeline | Style Dictionary / Sass build | Native `:root` custom properties | Buildless constraint — no build step allowed |

**Key insight:** The codebase already does the *right* thing for filters (highlight, no rebuild).
The single wrong thing is recreating the simulation on mode switch. Fix that one lifecycle seam;
don't introduce a parallel animation system.

## Runtime State Inventory

> This is a restyle + refactor phase, so the inventory applies. Nothing here persists outside the
> browser session, but documenting each category explicitly:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None** — verified by inspecting `js/state.js`. localStorage keys are `searchHistory` and `savedViews` only; neither stores CSS class names, color tokens, or simulation identity. Token rename has no stored-data impact. | none |
| Live service config | **None** — verified: buildless static site, no external service holds CSS/JS identifiers. | none |
| OS-registered state | **None** — verified: no scheduled tasks/daemons reference styles or viz internals. | none |
| Secrets/env vars | **None** — verified: no `.env`, no secret keys reference design tokens or simulation. | none |
| Build artifacts | **None** — verified: buildless deploy, no compiled CSS/JS, no `dist/`. Browser cache of `styles/*.css` is the only "artifact"; a normal deploy reload handles it. | none (cache-bust on deploy is automatic via static hosting) |

**The key question — after every file is updated, what runtime systems still have old values?**
Answer: only the browser HTTP cache of the four CSS files, resolved by a normal page reload. There
is no persisted token name, color literal, or simulation handle anywhere outside live memory.

## Common Pitfalls

### Pitfall 1: Breaking the trust color contract via `.confidence-*`
**What goes wrong:** Restyle changes `.confidence-high/medium/low` colors → provenance badges show
wrong semantic color (observed should read green, estimated amber, unknown neutral).
**Why it happens:** `.prov-badge` has **no CSS rule of its own** — badges (`prov-badge
confidence-badge confidence-{high|medium|low}`, emitted by `js/trust/index.js` `badgeHtml`) inherit
all color from `.confidence-*` in `components.css` L52-54. It's easy to "tidy" those into a generic
token and lose the hue mapping.
**How to avoid:** Map the three confidence classes to the **semantic** trust tokens
(`--color-observed/estimated/unknown`), NOT generic accent tokens. Keep `background`/`color`/`border`
structure identical; only swap literals for the matching semantic token.
**Warning signs:** `tests/provenance.test.mjs` / `viz-provenance-wiring.test.mjs` still pass (they
check JS wiring, not color) — so the only catch is the smoke screenshot. Add a token-mapping check.

### Pitfall 2: A view change still triggering `clearGraph()`
**What goes wrong:** Leaving any `render()` path that calls `clearGraph()` (which `simulation.stop()`
+ `g.selectAll("*").remove()`) means that path still tears down — partial fix, inconsistent motion.
**Why it happens:** Three call sites (`openProfile` L230, `openGlobal` L256, `loadView` L688) all
call the same `render()`. If you split `render()` into build+update but a branch still hits
`clearGraph()`, you reintroduce jank on that branch.
**How to avoid:** Route ALL three mode-switch call sites through the new `updateGraph()`. Reserve a
true teardown only for genuine destruction (none needed within a session).
**Warning signs:** Motion test (below) catches it — simulation identity must stay stable across a
mode switch.

### Pitfall 3: New nodes "flying in" because positions weren't carried
**What goes wrong:** On mode switch, nodes that exist in both views jump to random seeds → mental
map lost (the exact thing STORY-03 forbids).
**Why it happens:** `simulation.nodes(newNodes)` only preserves positions for node objects that
*already carry* x/y. The current code rebuilds fresh node objects from `graphForMode()` each render
with random seed x/y (L460-491).
**How to avoid:** Before binding, copy `x/y/vx/vy` from the previous `STATE.nodes` into the new
node objects by `id` (Pattern 2 step 1). New-only nodes keep their computed band/profile seed.
**Warning signs:** Visible "explosion" on profile↔global switch in the smoke run.

### Pitfall 4: `tick` handler referencing stale selections
**What goes wrong:** A build-once `on("tick")` closure captured the *first* `nodeSel/linkSel`; after
`updateGraph()` reassigns them, the tick updates the wrong (old) selection.
**Why it happens:** `nodeSel/linkSel` are module-level `let`s reassigned in update.
**How to avoid:** Have `ticked()` read the current module-level `nodeSel/linkSel` (it already does
this style today) — do NOT close over a local copy. Keep the same boundary-clamp logic from L597-605.
**Warning signs:** Nodes render but don't move, or links detach from nodes after a switch.

### Pitfall 5: Reduced-motion not honored on the D3 path
**What goes wrong:** CSS `@media (prefers-reduced-motion)` covers DOM transitions but NOT D3
`.transition().duration()` calls or the alpha reheat → motion-sensitive users still get full sim
animation.
**Why it happens:** D3 transitions are JS-driven; the media query doesn't reach them.
**How to avoid:** Gate D3 transition durations behind `matchMedia('(prefers-reduced-motion:
reduce)')` — duration 0 (snap to final) and optionally `simulation.alpha(0)`/lower reheat, plus a
CSS block zeroing the `.node`/`.link`/card transitions.
**Warning signs:** Hard to catch in Node tests — verify the `matchMedia` guard exists (string match)
and the CSS `@media` block exists.

## Code Examples

### Reduced-motion CSS block (add to theme.css, loads last)
```css
/* Source: MDN prefers-reduced-motion [CITED: developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion] */
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{
    animation-duration:0.01ms!important;
    animation-iteration-count:1!important;
    transition-duration:0.01ms!important;
  }
  .node,.link,#companyCard,#tt,.modal{transition:none!important;animation:none!important}
}
```

### Token-consuming refactor (example: #bar buttons in layout.css)
```css
/* BEFORE (literals) */
#bar button,#bar select{background:transparent;border:1px solid #222;color:var(--dim);font-family:'JetBrains Mono',monospace;font-size:8px;padding:4px 9px;...;transition:all .12s}
/* AFTER (tokens; legacy --dim still resolves) */
#bar button,#bar select{background:transparent;border:1px solid var(--color-border);color:var(--color-text-dim);font-family:var(--font-mono);font-size:var(--fs-xs);padding:var(--space-2) var(--space-4);...;transition:all var(--dur-fast) var(--ease-standard)}
```

### Trust color mapping (components.css — preserve semantics)
```css
/* Map confidence classes to SEMANTIC trust tokens (same hues as today) */
.confidence-high{background:rgba(76,175,80,0.2);color:var(--color-observed);border:1px solid rgba(76,175,80,0.4)}   /* green  */
.confidence-medium{background:rgba(255,193,7,0.2);color:var(--color-estimated);border:1px solid rgba(255,193,7,0.4)} /* amber  */
.confidence-low{background:rgba(158,158,158,0.2);color:var(--color-unknown);border:1px solid rgba(158,158,158,0.4)}  /* neutral*/
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Recreate `forceSimulation` per render | Build once, `nodes()`/`links()` re-bind + `alphaTarget` reheat | D3 v4+ (the join + reheat pattern) | Smooth incremental updates, position preservation [CITED: observablehq.com/@d3/modifying-a-force-directed-graph] |
| Ad-hoc CSS vars (~7) + literals | Full `:root` token system | Industry standard since CSS custom properties shipped (2017) | Consistent type rhythm, single source of truth |
| `selection.enter()/exit()` manual merge | `selection.join(enter,update,exit)` | D3 5.8+ (2019) | Cleaner enter/update/exit with built-in remove |

**Deprecated/outdated:**
- Manual `.enter().append()` + separate `.exit().remove()` — superseded by `.join()` in D3 7.
  (Current code uses `.join("line")`/`.join("g")` already, but only the no-arg form — Pattern 2
  upgrades to the enter/update/exit functional form to attach motion.)

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Carrying `vx/vy` (not just x/y) across rebinds improves settle smoothness | Pattern 2 | Low — if velocities cause drift, carry x/y only; positions alone preserve mental map |
| A2 | `alphaTarget(0.3)` then `→0` after ~600ms is the right reheat strength/duration for this graph | Pattern 2 | Low — tunable; too low = no settle, too high = drift. Verify in smoke and adjust. |
| A3 | Exact token *values* (e.g. `--fs-xs:8px`) faithfully reproduce current literals | Standard Stack / Pattern 1 | Medium — must be cross-checked against each literal during migration; a mistyped value = visual regression. Catalog below is authoritative. |
| A4 | No test reads `.css` files | User Constraints / Testing | Low — verified by grep across `tests/` (no `readFileSync` of any `.css`); but re-verify before relying on it. |

## Open Questions

1. **Should `updateGraph` always reheat, or skip the reheat when positions are fully carried (e.g.
   re-entering the same view)?**
   - What we know: a full reheat on an unchanged view wastes motion; carried positions are already settled.
   - What's unclear: whether any mode-switch path re-enters an identical node set.
   - Recommendation: reheat with a low `alphaTarget` (0.3) always for v1; PERF-01 (Phase 8) can add
     the "skip reheat for no-op" optimization. Keep this phase's scope to motion *polish*.

2. **Particle layer + bn-ring across updates** — currently rebuilt in `clearGraph`/`render`.
   - What we know: `toggleParticles` and `.bn-ring` append into `g`.
   - What's unclear: whether they need re-attach logic in `updateGraph`.
   - Recommendation: keep a stable `g.append("g")` particle layer created once in build; re-derive
     bn-rings in the node enter selection. Verify particles still animate after a switch in smoke.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js (`node --test`) | Token + motion tests | ✓ (repo runs the 178-suite today) | — | — |
| D3.js | Simulation refactor | ✓ (CDN, index.html L8) | 7.8.5 | — |
| Browser w/ CSS custom properties | Tokens | ✓ (universal in evergreen browsers) | — | — |
| `prefers-reduced-motion` MQ | A11y | ✓ (universal) | MQ L5 | none needed |

**Missing dependencies with no fallback:** none
**Missing dependencies with fallback:** none

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node built-in `node:test` + `node:assert/strict` |
| Config file | none — tests are explicitly listed in `package.json` `scripts.test` |
| Quick run command | `npm test` (runs the registered 14-file / 178-test suite) |
| Full suite command | `npm test` |

**Critical gate fact:** `node --test` only runs files **named on the `scripts.test` command line**.
An unregistered new test file silently never runs (this exact "GATE LANDMINE" is documented in
`tests/trust-wiring.test.mjs`). New Phase-4 test files MUST be appended to `package.json`
`scripts.test`.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STORY-01 | Core tokens exist in `:root` (color/type/space/radii/elevation/motion) | structure (regex on `styles/base.css`) | `node --test tests/design-tokens.test.mjs` | ❌ Wave 0 |
| STORY-01 | Token-consuming refactor reduced hardcoded literals (no bare `#hex`/`px` proliferation in migrated rules) AND trust `.confidence-*` keep green/amber/neutral semantics | structure (regex on CSS files) | `node --test tests/design-tokens.test.mjs` | ❌ Wave 0 |
| STORY-01 | Trust hooks `.confidence-*`/`.source-link`/`.prov-badge` class names + `#methodologyModal`/container IDs unchanged in markup & badge HTML | structure (regex on `index.html` + `js/trust/index.js`) | `node --test tests/design-tokens.test.mjs` | ❌ Wave 0 (or fold into above) |
| STORY-03 | `render()` no longer recreates the simulation per call — build-once `buildSimulation` exists; `d3.forceSimulation` appears once; `simulation.nodes(`/`force("link").links(` re-bind present | structure (regex on `js/viz/index.js`) | `node --test tests/viz-motion.test.mjs` | ❌ Wave 0 |
| STORY-03 | No full `alpha(1)` restart on view change; gentle `alphaTarget(` reheat present | structure (regex on `js/viz/index.js`) | `node --test tests/viz-motion.test.mjs` | ❌ Wave 0 |
| STORY-03 | Node positions carried across rebind (`prev.get`/`p.x`/`n.x = p.x` style mental-map copy present) | structure (regex on `js/viz/index.js`) | `node --test tests/viz-motion.test.mjs` | ❌ Wave 0 |
| STORY-03 | `prefers-reduced-motion` honored: CSS `@media` block (theme.css) AND JS `matchMedia('(prefers-reduced-motion` guard (viz) | structure (regex on `styles/theme.css` + `js/viz/index.js`) | `node --test tests/viz-motion.test.mjs` | ❌ Wave 0 |
| (regression) | All 178 existing tests stay green (no class/ID/badge-HTML drift) | string/structure | `npm test` | ✅ existing |

**Why string/structure tests, not DOM:** the repo gate runs in **Node without a browser** (no
jsdom, no Playwright in `scripts.test`). Every existing test is `readFileSync` + regex. New tests
follow that exact convention — assert on source-file *content*, not runtime behavior. Visual/runtime
behavior is verified by the human smoke run (the served data now paints, per Phase 3).

### Recommended new test assertions (concrete)
- **`tests/design-tokens.test.mjs`**
  - `base.css` `:root` contains each token family: `/--color-bg\b/`, `/--fs-base\b/`, `/--space-4\b/`,
    `/--radius-md\b/`, `/--shadow-md\b/`, `/--dur-base\b/`, `/--ease-standard\b/`.
  - Semantic trust tokens present: `/--color-observed/`, `/--color-estimated/`, `/--color-unknown/`.
  - `.confidence-high/medium/low` still present in `components.css` and still carry their green/amber/
    neutral rgba (`/rgba\(76,175,80/`, `/rgba\(255,193,7/`, `/rgba\(158,158,158/`).
  - Trust hooks unchanged in markup: `index.html` still has `id="methodologyModal"`,
    `id="provenanceDrawer"`, `id="companyCard"`; `js/trust/index.js` `badgeHtml` still emits
    `prov-badge confidence-badge`.
  - Migration evidence: layout/components/theme each reference `var(--` at least N times (proves
    consumption) — e.g. `assert.ok((css.match(/var\(--/g)||[]).length > 20)`.
- **`tests/viz-motion.test.mjs`** (read `js/viz/index.js` + `styles/theme.css` as text)
  - Exactly one `d3.forceSimulation(` occurrence (build-once): `(VIZ.match(/d3\.forceSimulation\(/g)||[]).length === 1`.
  - Re-bind present: `/simulation\.nodes\(/` (or `STATE.simulation.nodes(`) and `/force\(["']link["']\)\.links\(/`.
  - Gentle reheat present, no full restart: `/alphaTarget\(/` AND `assert.doesNotMatch(VIZ, /\balpha\(1\)/)`.
  - Mental-map carry: a position-copy pattern, e.g. `/n\.x\s*=\s*p\.x/` or `/prev\.get\(/`.
  - Reduced-motion guards: `/matchMedia\(['"]\(prefers-reduced-motion/` in viz AND
    `/prefers-reduced-motion/` in `theme.css`.
  - Preserve trust wiring (defensive): `/provenanceFor\(/`, `/confidenceScore\(/`,
    `/Confidence:\s*\$\{\s*score\s*\}\s*%/` still present (so the motion refactor doesn't drop them).

### Sampling Rate
- **Per task commit:** `npm test` (whole suite is fast; no separate quick subset exists)
- **Per wave merge:** `npm test`
- **Phase gate:** full suite green (178 + new) + human smoke (mode switch is smooth, badges correct
  color, reduced-motion honored) before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/design-tokens.test.mjs` — covers STORY-01 (token presence, trust-hook preservation, migration evidence)
- [ ] `tests/viz-motion.test.mjs` — covers STORY-03 (build-once, re-bind, gentle reheat, position carry, reduced-motion)
- [ ] **Register both files in `package.json` `scripts.test`** — without this they silently never run (GATE LANDMINE)

## Security Domain

> `security_enforcement` config not located in this repo's `.planning/config.json` scope; this phase
> is presentation/motion only (no auth, no input handling, no crypto, no data mutation). Included for
> completeness.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Public site, no auth (per REQUIREMENTS Out of Scope) |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | No protected resources |
| V5 Input Validation | no (this phase) | Tooltips already escape via existing `escapeHtml` in trust core; this phase adds no new user-input sink |
| V6 Cryptography | no | None |

### Known Threat Patterns for {vanilla CSS/JS static site}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via tooltip innerHTML | Tampering/Info-disclosure | Pre-existing `escapeHtml` in `js/trust/index.js`; do NOT introduce new unescaped innerHTML during motion refactor |
| Token/CSS injection | Tampering | N/A — tokens are static authored CSS, no runtime user input flows into `:root` |

**Phase-4-specific note:** The motion refactor touches tooltip code paths (`showTooltip`/
`showLinkTooltip` set `tt.innerHTML`). Preserve the existing escaping; do not regress it while
refactoring. (These functions are unchanged by the simulation split, but they live in the same file.)

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Design tokens (STORY-01):** single source of truth in `styles/theme.css` `:root`* with a coherent
  token set — Color (bg/surface/surface-raised; text primary/secondary/muted; border; accent/brand;
  SEMANTIC trust colors matching existing provenance: observed=green, estimated=amber, unknown=neutral),
  Typography (modular scale `--fs-xs..--fs-2xl`, weights, line-heights), Spacing (`--space-1..--space-8`),
  Radii, Elevation/shadow, Motion (`--dur-fast/base/slow`, `--ease-standard/emphasized`).
  *(Research note: `:root` currently lives in `base.css`, which loads FIRST — recommend defining tokens
  there so the cascade resolves for all consumers including theme.css. This honors the intent "single
  source of truth in CSS" while respecting actual load order. Flag for planner.)*
- Refactor base/layout/components/theme CSS to CONSUME tokens. **Keep all existing class names and IDs
  the tests assert** (`.confidence-*`/`.prov-badge`/`.source-link`, modal IDs, container IDs) — tokens
  are additive; restyle via tokens, do NOT rename hooks.
- Trust affordances (badges, source links, confidence, freshness, methodology) remain visible + correct.
- **Smooth D3 motion (STORY-03):** stop recreating `d3.forceSimulation` on every render (stops L174,
  creates L589). Build the simulation ONCE; on view change update nodes/links + enter/update/exit
  transitions (duration/easing from motion tokens) + gentle `alphaTarget` nudge (NOT from-scratch
  restart). Preserve node positions across view changes (mental-map preservation).
- Respect `prefers-reduced-motion` (disable/shorten transitions).
- **Tests:** keep full suite green (178). Add a token-presence/usage check + a motion test asserting
  the simulation is not recreated on a view change (simulation identity stable / no full `alpha(1)`
  restart on filter). String/structure tests for new markup. **Register new test files in
  `package.json` `scripts.test`.**

### Claude's Discretion
- Exact token values (as long as they preserve the current dark aesthetic) and which refinements are
  safe improvements (type rhythm, subtle depth, refined accent, smooth motion).
- Motion timing within ~200–400ms with emphasized easing for view changes.
- Keep the dark, dense "Bloomberg-terminal-for-supply-chains" feel. No light theme this phase.

### Deferred Ideas (OUT OF SCOPE)
- First-30s guided hero + narrative flow → Phase 5.
- Memoized filter internals / no-restart-for-simple-filters perf → Phase 8 (Phase 4 = motion polish).
- Mobile/responsive excellence → Phase 9.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STORY-01 | A consistent design system (typography scale, color, depth, motion tokens) applied site-wide | Standard Stack (native `:root` tokens), Pattern 1 (token + legacy alias), Token catalog (Appendix), Pitfall 1 (trust color contract), Validation (design-tokens test) |
| STORY-03 | D3 transitions smooth with no jarring full-simulation restart on view changes | Pattern 2 (build-once/update), API facts (`nodes()`/`links()`/`alphaTarget`), Pitfalls 2-5, Validation (viz-motion test) |

## Appendix: Hardcoded-Value Catalog → Proposed Tokens

Extracted from the four CSS files. Grouped; rightmost column = proposed token. **Trust-semantic
rows are flagged — these keep their exact hue.**

### Colors (surfaces / text / lines)
| Literal(s) found | Where | Proposed token |
|---|---|---|
| `#0a0a0a` | base `--bg`, top gradient | `--color-bg` |
| `#0f0f0f`, `#111` | logo wells, inputs, modals, cards | `--color-surface` |
| `#1a1a1a`,`#1e1e1e`,`#212121`,`#222`,`#252525`,`#2a2a2a` | borders, raised, separators | `--color-surface-raised` / `--color-border` / `--color-border-strong` (3 steps) |
| `#d4d4d4` | base `--text` | `--color-text` |
| `#fff`,`#ddd`,`#e4e4e4` | headings, emphasis | `--color-text-bright` |
| `#888`,`#8a8a8a`,`#9a9a9a`,`#aaa` | secondary text | `--color-text-muted` |
| `#666`,`#777`,`#505050`,`#555`,`#444`,`#333` | dim/labels | `--color-text-dim` (+ `--color-text-faint`) |
| `rgba(255,255,255,0.03..0.12)` | subtle fills/borders | `--overlay-{1..4}` (white alpha scale) |
| `rgba(0,0,0,0.3..0.5)` | shadows (see elevation) | folded into `--shadow-*` |

### Colors (brand / accent / status — preserve)
| Literal | Where | Proposed token |
|---|---|---|
| `#e8453c` | base `--acc` | `--color-accent` |
| `#4488cc` / `#86b7ff` / `#77a8ff` | base `--blue`, source links | `--color-blue` / `--color-link` |
| `#9c27b0` | base `--purple` (fitch) | `--color-purple` |
| `#4caf50`,`#45a049`,`#66bb6a` | success/live/observed | `--color-success` / **`--color-observed`** |
| `#ff9800`,`#ffb300`,`#ffd899` | stale/medium/estimated | `--color-warning` / **`--color-estimated`** |
| `#f44336`,`#ff8f8f`,`#ff8c84` | outdated/high-risk | `--color-danger` |
| `#9e9e9e` | low confidence | **`--color-unknown`** |
| `rgba(76,175,80,.2/.4)` | **`.confidence-high`** | keep — map via `--color-observed` |
| `rgba(255,193,7,.2/.4)` | **`.confidence-medium`** | keep — map via `--color-estimated` |
| `rgba(158,158,158,.2/.4)` | **`.confidence-low`** | keep — map via `--color-unknown` |

### Type scale (font-size literals found)
`6px,7px,8px,9px,10px,11px,12px,13px,14px,15px,16px,18px,20px,24px` →
`--fs-2xs:6px --fs-xs:8px --fs-sm:9px --fs-base:10px --fs-md:11px --fs-lg:13px --fs-xl:16px --fs-2xl:20px`
(7px/12px/14px/15px/18px/24px map to nearest steps or get a `--fs-*` as needed; preserve current sizes).
Weights: `300/400/500/600/700` → `--fw-light..--fw-bold`. Line-heights: `1/1.05/1.2/1.4/1.45/1.5/1.6`
→ `--lh-tight/base/relaxed`.

### Spacing (padding/gap/margin literals)
`2px,3px,4px,5px,6px,8px,10px,12px,14px,16px,24px` →
`--space-1:2 --space-2:4 --space-3:6 --space-4:8 --space-5:10 --space-6:12 --space-7:16 --space-8:24`
(3px/5px/14px map to nearest or add half-steps).

### Radii
`0,2px,3px,4px,6px,8px,12px` → `--radius-xs:2 --radius-sm:3 --radius-md:4 --radius-lg:6 --radius-xl:8 --radius-2xl:12`.

### Elevation (box-shadow combos found)
- `0 2px 8px rgba(0,0,0,0.3)` → `--shadow-sm`
- `0 4px 12px/20px rgba(0,0,0,0.3/0.4)` → `--shadow-md`
- `0 8px 32px rgba(0,0,0,0.4..0.5)[, 0 2px 8px rgba(0,0,0,0.3..0.4)]` → `--shadow-lg`
- `0 -4px 20px rgba(0,0,0,0.4)` (mobile sheet) → `--shadow-up`

### Motion (transition/animation literals found)
- durations: `0.05s,0.12s,0.15s,0.2s,0.4s` → `--dur-fastest:50ms --dur-fast:150ms --dur-base:200ms --dur-slow:400ms`
- easings: `ease`, `cubic-bezier(0.4,0,0.2,1)` → `--ease-standard:cubic-bezier(0.4,0,0.2,1)`; add `--ease-emphasized:cubic-bezier(0.2,0,0,1)` for view changes (CONTEXT).

## Sources

### Primary (HIGH confidence)
- `js/viz/index.js`, `js/state.js`, `js/ui/index.js`, `js/trust/index.js` (grep) — actual simulation
  lifecycle, render call sites, badge HTML, filter→highlight path (verified in session)
- `styles/{base,layout,components,theme}.css` (read in full) — literal catalog, trust color contract
- `tests/*.test.mjs` + `package.json` (read) — string/structure convention, no CSS reads, gate registration
- d3js.org/d3-force/simulation — `nodes()`/`force().links()`/`alpha()`/`alphaTarget()`/`restart()` semantics [CITED]
- observablehq.com/@d3/modifying-a-force-directed-graph — canonical enter/update/exit + reheat pattern [CITED]
- MDN: CSS custom properties; `@media (prefers-reduced-motion)` [CITED]

### Secondary (MEDIUM confidence)
- WebSearch (d3 update-without-recreate) — corroborated the `simulation.nodes()` re-init + join + restart workflow

### Tertiary (LOW confidence)
- (none relied upon)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — native CSS + already-loaded D3; no new deps to verify on registries
- Architecture (token layering + build-once sim): HIGH — verified against actual source + D3 docs
- Pitfalls: HIGH — derived directly from the codebase (trust badge has no own CSS; 3 render sites)
- Token values: MEDIUM — catalog is faithful to current literals but each value needs cross-check during migration (A3)

**Research date:** 2026-06-21
**Valid until:** 2026-07-21 (stable domain — vanilla CSS + D3 v7; D3 v7 API is mature)
