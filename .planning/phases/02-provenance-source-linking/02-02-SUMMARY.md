---
phase: 02-provenance-source-linking
plan: 02
subsystem: viz
tags: [provenance, viz, tooltips, stat-bar, verified-node, data-driven, consolidation]

# Dependency graph
requires:
  - phase: 02-provenance-source-linking
    provides: "js/trust/index.js — provenanceFor/badgeHtml/renderProvenanceBadge (plan 02-01)"
provides:
  - "Node tooltip (showTooltip) badge + source link derived via provenanceFor — old inline confidenceLower derivation removed"
  - "Relationship tooltip (showLinkTooltip) badge + source link derived from d.cf/d.sf via provenanceFor"
  - "$cap stat-bar figure (#sM) carries an Observed provenance badge sourced from DATA.meta (companiesmarketcap.com)"
  - "verified-node circle class driven by provenanceFor (observed AND resolving source), not the ad-hoc .includes('source') string check"
affects: [02-04-trust-wiring, phase-03-confidence-scoring, phase-04-design-system]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "viz consumes the trust core: provenanceFor(d, {sourceIndex: STATE.sourceIndex, meta: DATA.meta}) at every major-figure render path; markup via badgeHtml/renderProvenanceBadge"
    - "Source link emitted only when prov.source exists — dangling/empty FK (33 nodes, global links) degrade to tag-only, no fabricated URL, no crash"
    - "Derived count aggregates (#sN/#sL/#sC/#sY) stay intentionally UNBADGED; only money/dataset figures ($cap) get a badge (RESEARCH Q1)"

key-files:
  created:
    - tests/viz-provenance-wiring.test.mjs
  modified:
    - js/viz/index.js
    - package.json

key-decisions:
  - "$cap badge injected at runtime into #sM.parentElement as a created <span class='cap-prov'> (idempotent: reused if present) — no index.html edit, honoring RESEARCH Pitfall 5"
  - "verified-node = (prov.tag === 'observed' && prov.source) — a node is 'verified' only when high-confidence AND its source FK resolves, replacing the looser .includes('source') heuristic"
  - "Both tooltips' bottom 'View Source' anchor now reads prov.source.url (rel='noopener noreferrer'), removing the inline STATE.sourceIndex[d.sourceId].url dangling-FK crash risk (T-02-05)"

patterns-established:
  - "Pattern: viz never re-derives confidence inline — it delegates to provenanceFor and renders with badgeHtml/renderProvenanceBadge (single trust surface)"

requirements-completed: [TRUST-01, TRUST-02]

# Metrics
duration: 15min
completed: 2026-06-20
---

# Phase 2 Plan 02: Viz Provenance Wiring Summary

**Wired the Wave-1 trust core into all three viz major-figure render paths — node tooltip, relationship tooltip, and the $cap stat bar — and routed the verified-node circle class through provenanceFor, deleting the duplicated inline confidence logic; counts stay unbadged, money is Observed-badged, dangling FKs no longer risk a crash (136 tests green).**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-06-20T20:48Z
- **Completed:** 2026-06-20
- **Tasks:** 2 (both TDD)
- **Files modified:** 3 (1 created)

## Accomplishments
- `showTooltip` and `showLinkTooltip` now derive `prov = provenanceFor(d, { sourceIndex: STATE.sourceIndex, meta: DATA.meta })`, render the badge via `badgeHtml(prov)`, and emit the bottom "View Source" link only when `prov.source` exists. The old `confidenceRaw`/`confidenceLower`/`confidenceLevel`/inline `STATE.sourceIndex[fk].url` blocks are gone.
- `updateStats` appends an Observed provenance badge (`.cap-prov`) next to the `$cap` figure (`#sM.parentElement`), sourced from `DATA.meta` (companiesmarketcap.com). The four count figures (`#sN/#sL/#sC/#sY`) are intentionally left **unbadged** per RESEARCH Q1 (derived aggregates, no per-source).
- The node circle `verified-node` class is now `prov.tag === 'observed' && Boolean(prov.source)` instead of `d.confidence.includes('source')` — trust-derived, not an ad-hoc string check.
- Added `tests/viz-provenance-wiring.test.mjs` (5 string-presence cases) and registered it in `package.json scripts.test`; suite rose 131 → 136, 0 fail.

## Task Commits

Each task committed atomically (TDD RED in Task 1, GREEN per task):

1. **Task 1: Route node + link tooltips through provenanceFor/badgeHtml** — `260581e` (feat)
2. **Task 2: Badge the $cap stat bar + centralize the verified-node class** — `dbb55c0` (feat)

**Plan metadata:** (this commit) (docs: complete plan)

## Files Created/Modified
- `js/viz/index.js` — import the trust API; both tooltips + stat bar + verified-node class now call `provenanceFor`; inline confidence derivation removed; source links gated on `prov.source`.
- `tests/viz-provenance-wiring.test.mjs` — asserts the import, ≥2 tooltip `provenanceFor(` calls, removal of `confidenceLower`, the `marketcap: true` stat marker, and absence of the standalone `.includes('source')` verified check.
- `package.json` — appended `tests/viz-provenance-wiring.test.mjs` to `scripts.test`.

## Decisions Made
- $cap badge is created/located in JS and appended to `#sM`'s parent span (idempotent) — no `index.html` change, preserving the inline-bootstrap regress test (RESEARCH Pitfall 5).
- `verified-node` requires both an observed tag and a resolving source, a stricter and honest definition vs. the prior substring heuristic.
- Source-link interpolation in tooltips now comes from `prov.source.url` (already escaped/`http`-gated upstream in trust) with `rel="noopener noreferrer"`, eliminating the dangling-FK `.url` access (T-02-05 mitigated).

## Deviations from Plan

### Auto-fixed Issues
None.

**Total deviations:** 0
**Impact on plan:** Plan executed exactly as written. Did not touch `data/` files, `<script src>` tags, or `index.html` structure.

## Issues Encountered
- None. To keep each task's `npm test` green, the new wiring test was authored in Task 1 (RED proven via a failing standalone run) but registered in `package.json` in Task 2 (the commit that makes all 5 cases pass) — so Task 1's gate stayed at 131 green and Task 2's at 136 green.

## User Setup Required
None — no external service configuration required.

## Known Stubs
None. Badges render from real data at runtime. Under the thin committed `data/top100-map.js` snapshot (no `profiles`/`meta`), `provenanceFor` degrades to `unknown` (no badge link, no verified class) — the intended graceful degradation per RESEARCH Pitfall 1/A3, not a stub.

## Self-Check: PASSED
- `js/viz/index.js` imports `{ provenanceFor, renderProvenanceBadge, badgeHtml } from "../trust/index.js"` (grep L8)
- `provenanceFor(` appears 4× (node tooltip L189, link tooltip L258, stat bar L86, verified-node L499)
- `marketcap: true` present (L86); counts #sN/#sL/#sC/#sY remain unbadged (only #sM gets `.cap-prov`)
- `confidenceLower` and standalone `confidence.includes("source")` removed from viz
- `node --check js/viz/index.js` passes
- Commits `260581e` (Task 1) and `dbb55c0` (Task 2) present in git log
- `npm test` = 136 pass / 0 fail (131 + 5 new viz-wiring)

## Next Phase Readiness
- Plan 02-03 (ui wiring) and 02-04 (trust-wiring string-presence test) are unblocked; viz is fully instrumented and will satisfy 02-04's viz assertions.
- No blockers. The pre-existing thin-snapshot local-render condition is unchanged and does not affect this pure-consumption wiring.

---
*Phase: 02-provenance-source-linking*
*Completed: 2026-06-20*
