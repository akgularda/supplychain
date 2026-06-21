---
phase: 02-provenance-source-linking
plan: 03
subsystem: ui
tags: [provenance, ui, company-card, compare-grid, source-drawer, data-driven, bugfix]

# Dependency graph
requires:
  - phase: 02-provenance-source-linking
    provides: "js/trust/index.js — provenanceFor/renderProvenanceBadge/badgeHtml (plan 02-01)"
provides:
  - "Company-card anchor figure carries a data-derived provenance badge (observed/estimated/unknown) from the company node's confidence/sourceId via provenanceFor"
  - "Compare-grid 'Verified Entities' count derived through provenanceFor (observed AND resolving source), replacing the inline .includes('source') heuristic"
  - "Source drawer (openProvenance) reads source.title — the src.t bug is fixed, drawer lists real human titles + reachable links"
  - "parseYearsFromSources reads source.title so the card timeline matches real title years (latent src.t bug fixed)"
affects: [02-04-trust-wiring, phase-03-confidence-scoring, phase-04-design-system]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ui consumes the trust core: provenanceFor(node, {sourceIndex, meta: DATA.meta}) at the card anchor + compare-grid render paths; sourceIndex built inline from profile.sources (mirrors data/index.js)"
    - "Anchor badge created in JS (#cardNameProv span appended to cardName.parentElement) and rendered via renderProvenanceBadge — no index.html edit (RESEARCH Pitfall 5)"
    - "Verified count = (prov.tag === 'observed' && prov.source) — same honest definition as the viz verified-node class (02-02), single trust surface"

key-files:
  created:
    - tests/ui-provenance-wiring.test.mjs
  modified:
    - js/ui/index.js
    - js/data/index.js
    - package.json

key-decisions:
  - "src.t->title fix: all 407 sources have title+url, ZERO have a `t` key (RESEARCH Pitfall 2); openProvenance + parseYearsFromSources now read the real field. No existing test pinned the buggy behavior — suite stayed green (Open-Question 2 resolved)."
  - "Company anchor = profile.nodes.find(n => n.kind === 'company'); a missing profile/anchor degrades to the Unknown badge (no fabrication, no crash — Pitfall 1)."
  - "applyFilters() left untouched: its .includes('source') string parsing was marked OPTIONAL centralization in the plan and is out of Task 2 scope (card/compare/drawer)."

patterns-established:
  - "Pattern: ui never re-derives confidence inline for major figures — it delegates to provenanceFor and renders with renderProvenanceBadge"

requirements-completed: [TRUST-01, TRUST-02]

# Metrics
duration: ~10min
completed: 2026-06-21
---

# Phase 2 Plan 03: UI Provenance Wiring Summary

**Wired the Wave-1 trust core into the two ui-owned major-figure render paths — the company-card anchor badge and the compare-grid "Verified Entities" count — and fixed the latent src.t->title source-key bug in both openProvenance (drawer) and parseYearsFromSources (timeline) so sources resolve to real human titles and reachable links (141 tests green).**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-06-21
- **Completed:** 2026-06-21
- **Tasks:** 2 (Task 2 TDD)
- **Files modified:** 3 (1 created)

## Accomplishments
- **src.t->title bug fixed** in both `openProvenance` (js/ui) and `parseYearsFromSources` (js/data). RESEARCH verified all 407 sources carry `title`+`url` and 0 carry `t`, so the drawer was showing only IDs and the timeline missed title years; both now read `source.title`. `npm test` stayed green, confirming no test pinned the buggy fallback (Open-Question 2 resolved).
- **Company-card anchor badge:** `updateCompanyCard` now calls `renderCardAnchorBadge(profile)`, which builds an inline `sourceIndex`, locates the `kind === 'company'` anchor node, derives `provenanceFor(anchor, { sourceIndex, meta: DATA.meta })`, and renders the badge into a runtime-created `#cardNameProv` span beside the card name (no index.html edit). An unsourced/dangling anchor degrades to the honest Unknown badge.
- **Compare-grid "Verified Entities":** replaced `p.nodes.filter(n => n.confidence && n.confidence.includes('source'))` with a count over `provenanceFor` per node (verified = `tag === 'observed' && Boolean(prov.source)`) — the same trust-derived definition as the viz verified-node class.
- **Source drawer integrity preserved:** `openProvenance` keeps its `escapeHtml`+`rel="noopener noreferrer"` markup; only the title field key changed (T-02-06/07 mitigations intact).
- Added `tests/ui-provenance-wiring.test.mjs` (5 string-presence cases) and registered it in `package.json scripts.test`; suite rose 136 -> 141, 0 fail.

## Task Commits

1. **Task 1: Fix src.t->title in openProvenance + parseYearsFromSources** — `c4cbfce` (fix)
2. **Task 2: Wire provenanceFor into company card + compare grid (TDD)** — `51b70e8` (feat)

**Plan metadata:** (this commit) (docs: complete plan)

## Files Created/Modified
- `js/ui/index.js` — import the trust API; `renderCardAnchorBadge` (anchor badge); `showCompare` verified count via `provenanceFor`; `openProvenance` reads `src.title`.
- `js/data/index.js` — `parseYearsFromSources` reads `source.title` (one-key fix).
- `tests/ui-provenance-wiring.test.mjs` — asserts the trust import, >=2 `provenanceFor(` calls, the verified-count goes through `provenanceFor` (old inline filter gone), and the src.title fix in both ui + data.
- `package.json` — appended `tests/ui-provenance-wiring.test.mjs` to `scripts.test`.

## Decisions Made
- `provenanceFor` appears 4x in ui (anchor badge declaration + call, compare-grid filter, plus an explanatory comment); the anchor badge and compare grid are the two real render paths.
- The anchor badge span is created/located idempotently (reused if present) and appended to `cardName.parentElement`, preserving the buildless no-index.html-edit constraint (RESEARCH Pitfall 5).
- `applyFilters()`'s remaining `.includes('source')` string parsing (L509/513/514) is intentionally **not** centralized — the plan marked it optional and it is outside Task 2's card/compare/drawer scope.

## Deviations from Plan

### Auto-fixed Issues
None.

**Total deviations:** 0
**Impact on plan:** Plan executed exactly as written. Did not touch `data/` JSON files, `<script src>` data tags, `index.html`, or any CSS (reused existing `.confidence-*`/`.source-link` classes from the trust core).

## Issues Encountered
- The Task-2 RED test initially used a broad `doesNotMatch(/confidence\.includes\('source'\)/)` that also caught the in-scope-excluded `applyFilters()` lines. Narrowed the assertion to the specific old verified-count filter expression and to requiring the new `provenanceFor`-based count — RED still proven failing before the implementation, GREEN after. No source behavior changed as a result.

## User Setup Required
None — no external service configuration required.

## Known Stubs
None. Badges and drawer titles render from real data at runtime. Under the thin committed `data/top100-map.js` snapshot (no `profiles`/`meta`), `provenanceFor` degrades to `unknown` and the anchor badge shows the honest Unknown state — the intended graceful degradation per RESEARCH Pitfall 1, not a stub.

## Self-Check: PASSED
- `js/ui/index.js` imports `{ provenanceFor, renderProvenanceBadge, badgeHtml } from "../trust/index.js"` (grep: 1 import line)
- `provenanceFor(` appears 4x in ui (card anchor + compare grid render paths)
- `openProvenance` reads `src.title`; `parseYearsFromSources` reads `source.title`; no bare `src.t `/`source.t ` reads remain (grep: 0)
- `showCompare` verified count goes through `provenanceFor`, not the inline `.includes('source')` filter
- `node --check js/ui/index.js` and `node --check js/data/index.js` pass
- Commits `c4cbfce` (Task 1) and `51b70e8` (Task 2) present in git log
- `npm test` = 141 pass / 0 fail (136 + 5 new ui-wiring)

## Next Phase Readiness
- Plan 02-04 (trust-wiring string-presence test) is unblocked; both viz (02-02) and ui (02-03) are now instrumented and will satisfy 02-04's wiring assertions across both modules.
- No blockers. The pre-existing thin-snapshot local-render condition is unchanged and does not affect this pure-consumption wiring.

---
*Phase: 02-provenance-source-linking*
*Completed: 2026-06-21*
