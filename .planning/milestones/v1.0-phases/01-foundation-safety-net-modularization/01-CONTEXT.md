# Phase 1: Foundation (Safety-Net Modularization) - Context

**Gathered:** 2026-06-20
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — decisions derived from approved spec `docs/superpowers/specs/2026-06-20-monarch-best-in-world-design.md`

<domain>
## Phase Boundary

Transform the monolithic 2478-line `index.html` (inline CSS + 5 style/script blocks) into a
maintainable, modular, buildless static foundation with **zero user-visible change**. This is the
safety net every later phase builds on. In scope: extracting CSS into `styles/` files and JS into ES
modules under `js/`, reducing `index.html` to a semantic shell, and capturing a performance/Lighthouse
baseline. Out of scope: any new feature, any visual change, any data-contract change, any framework or
build tool.
</domain>

<decisions>
## Implementation Decisions

### Module structure (Claude's discretion, per spec §4)
- `styles/` split by concern: `base.css`, `layout.css`, `components.css`, `theme.css`.
- `js/` ES modules by responsibility: `data/` (load + normalize `window.SUPPLY_MAP_DATA`, macro maps,
  ratings), `viz/` (D3 force simulation, rendering, motion), `ui/` (toolbar, filters, compare, modals,
  onboarding), `trust/` (placeholder module for later phases), `state.js` (the `STATE` object + URL
  serialization).
- `index.html` becomes a semantic shell: head/meta, containers, and `<link>`/`<script type="module">`
  references only.

### Loading approach
- Use native ES modules (`<script type="module">`) and plain `<link rel="stylesheet">` — no bundler,
  so GitHub Pages keeps serving files directly. Preserve global `window.SUPPLY_MAP_DATA` data injection
  exactly as-is so the auto-update pipeline and tests are unaffected.

### Safety guarantees (hard constraints)
- All 103 existing tests must pass unchanged after extraction.
- Rendered output must be equivalent (no visual regression) — verify by diffing rendered DOM/behavior.
- The `data/` JSON contract, the GitHub Actions auto-update workflow, and the GitHub-Pages static
  deploy must keep working.

### Baseline capture
- Record a performance + Lighthouse baseline (key metrics) into a tracked file under the repo (e.g.
  `docs/perf/baseline-2026-06-20.md`) before/after extraction to prove no regression.
</decisions>

<code_context>
## Existing Code Insights

- `index.html`: 2478 lines, 5 `<style>`/`<script>` blocks, inline everything.
- State lives in a global `STATE` object; data in `window.SUPPLY_MAP_DATA`; filters via `highlightBy()`;
  source verification via `d.confidence`.
- Tests are Node `.mjs` files in `tests/` (UI integrity, data schema, ingestion, accessibility) — these
  define the regression contract for this phase.
- Detailed file/symbol mapping to be gathered during plan-phase research.
</code_context>

<specifics>
## Specific Ideas

- Extraction must be behavior-preserving and incremental (extract → run tests → confirm green) so any
  regression is caught immediately.
- Keep the `trust/` module as a thin placeholder this phase; it is populated in Phases 2–3.
</specifics>

<deferred>
## Deferred Ideas

- All trust/provenance UI → Phase 2–3.
- Any visual/design-system change → Phase 4.
</deferred>
