---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
last_updated: "2026-06-20T20:55:34.249Z"
progress:
  total_phases: 10
  completed_phases: 1
  total_plans: 7
  completed_plans: 5
  percent: 10
---

# Project State: Monarch Castle Technologies — Market Intelligence

## Project Reference

**Core Value:** Investors trust every number and instantly grasp supply-chain structure, concentration, and risk — credibility first, then beauty, then unique depth.

**Current Focus:** Phase 02 — Provenance & Source Linking

**Mode:** mvp | **Granularity:** fine

## Current Position

**Phase:** 02 — Provenance & Source Linking — EXECUTING
**Plan:** 02-02 complete (viz provenance wiring) — 2 of 4 done; next is 02-03
**Status:** Executing Phase 02
**Progress:** [███████░░░] 71%

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases complete | 1/10 |
| v1 requirements mapped | 25/25 |
| Test suite baseline | 103 passing |
| Pre-extraction regression anchor (01-01) | npm test = 116 pass / 0 fail |
| Plan 01-01 | 2 tasks, 4 files, ~12 min |
| Plan 01-02 | 3 tasks, 11 files, ~125 min |
| Post-extraction regression (01-02) | npm test = 116 pass / 0 fail (unchanged) |
| Plan 01-03 | 2 tasks + 1 checkpoint, 2 files, ~18 min |
| Post-extraction regression (01-03) | npm test = 116 pass / 0 fail (unchanged) |
| Perf: index.html doc transfer | 104 KB → 12 KB (−88%); no regression (FOUND-04 closed) |
| Plan 02-01 | 2 TDD tasks, 4 files, ~14 min |
| Trust-core regression (02-01) | npm test = 131 pass / 0 fail (116 + 15 new provenance) |
| Plan 02-02 | 2 TDD tasks, 3 files, ~15 min |
| Viz-wiring regression (02-02) | npm test = 136 pass / 0 fail (131 + 5 new viz-wiring) |

## Accumulated Context

### Key Decisions

- Trust before visual wow — investors bounce on unsourced numbers (spec risk register).
- Hybrid approach: thin, safe modularization (Phase 1) before any phased value work.
- Real-data-only — every major figure tagged observed/estimated with a reachable source.
- Keep buildless static GitHub-Pages deploy + weekly auto-update Actions pipeline.
- No login — public investor audience.
- Authoritative gate is `npm test` (116 pass / 0 fail), NOT `node --test tests/` (resolved research OQ1).
- 01-01: Lighthouse CLI hits NO_FCP in-sandbox; Playwright Navigation/Paint Timing is the recorded perf baseline (plan-sanctioned fallback).
- 01-01: http-server serves .js as application/javascript (valid module MIME); no --mimetypes override needed (A1 resolved).
- 01-02: CSS split as contiguous document-order slices (base->layout->components->theme) — concat is byte-identical to the original <style>, so cascade is provably unchanged.
- 01-02: each reassigned `let` kept module-local to its owner (ESM imports are read-only); cross-module mutable reads (labelSel/subSel) use ESM live bindings. main.js concentrates all order-sensitive top-level execution + the window.* shim.
- 01-02: openCompanyProfile explicitly added to window (it was the one inline-handler NOT on window in the monolith).
- 01-02: verified ES-module wiring at runtime with a Playwright smoke test (synthetic dataset) because the npm gate is string + node --check only and cannot prove runtime wiring.
- 01-03: deploy-pages.yml now copies styles/ AND js/ into _site/ (guarded `cp -R`) — FOUND-05 deploy landmine closed; live Pages site will serve the extracted CSS/JS on next push to master.
- 01-03: FOUND-04 closed — post-extraction Playwright timing (Lighthouse still NO_FCP in-sandbox, same condition as 01-01) shows no regression; index.html doc transfer −88% (104KB→12KB), total transfer +0.8% (externalized CSS/JS), timing deltas within local-serve noise.
- 01-03: render parity proven over http-server (Playwright + synthetic valid dataset) — all 4 CSS + 6 JS modules load 200, all 7 window.* handlers wired; the committed snapshot still cannot paint locally (pre-existing data condition, identical pre/post extraction).
- 01-03: honest caveat — with the incomplete committed snapshot, post-extraction the eager `buildSharedSupplierOverlapIndex()` in js/data throws before main.js's friendly guard (raw error vs friendly fatal); only with broken data, no effect with valid production data; candidate cleanup for a later plan (01-03 must not modify source).
- 02-01: trust tag mapping is DERIVED — high*->observed, medium*->estimated, missing/empty/dangling-FK->unknown; market-cap marker->observed via meta.source||top100_source_url (RESEARCH A1/A2). No literal observed/estimated token exists in the data.
- 02-01: provenanceFor + badgeHtml are PURE/DOM-free (Node-unit-testable); only renderProvenanceBadge touches el.innerHTML. Trust keeps a local escapeHtml copy rather than importing the window-coupled js/data module.
- 02-01: badgeHtml gates the source <a> on url.startsWith('http') and escapes title+url; rel="noopener noreferrer" on every link (T-02-01/02/03 mitigated, no-XSS posture on first-party data).
- 02-01: added scoped `js/package.json {type:module}` (Rule 3 blocking fix) — root package.json is type=commonjs so Node read the ESM trust module as CJS and the contracted named import threw; browser is unaffected (loads via <script type=module>).
- 02-01: GATE LANDMINE closed — tests/provenance.test.mjs registered in package.json scripts.test; suite rose 116->131 (15 new), 0 fail. Data sweep over all 100 profiles asserts both source-resolved and unsourced buckets non-empty (proves derivation, not hardcoding).
- 02-02: viz consumes the trust core — showTooltip/showLinkTooltip/updateStats/verified-node all call provenanceFor(d, {sourceIndex: STATE.sourceIndex, meta: DATA.meta}); the duplicated inline confidenceLower derivation is deleted. Both tooltips' "View Source" link now reads prov.source.url (no inline dangling-FK .url access).
- 02-02: $cap (#sM) is Observed-badged from DATA.meta (companiesmarketcap.com) via a runtime-created .cap-prov span (no index.html edit); count aggregates #sN/#sL/#sC/#sY stay UNBADGED (RESEARCH Q1). verified-node class = (prov.tag==='observed' && prov.source), replacing the .includes('source') heuristic. npm test = 136 pass / 0 fail (131 + 5 new viz-wiring).

### Standing Constraints

- 103-test suite must stay green throughout; new behavior gets new tests.
- `data/` JSON contract and auto-update pipeline must keep working.
- No framework/build tool — preserve buildless static deploy.

### Todos

- (none yet)

### Blockers

- (none) — note: local render still does not paint because the committed `data/top100-map.js` snapshot lacks `nodes`/`links`/`profiles` (bootstrap guard throws) and the sandbox blocks the Google Fonts CDN. Pre-existing data condition; affects local visual-render verification only. True visual check requires a valid production snapshot or the live deploy.
- FOUND-05 — RESOLVED in 01-03: `.github/workflows/deploy-pages.yml` now copies `styles/` and `js/` into `_site/` (guarded `cp -R`). The deploy will serve the modular CSS/JS on next push to `master`.

## Session Continuity

**Last action:** Completed 02-02-PLAN.md — wired the trust core into js/viz/index.js across all three major-figure render paths: node tooltip (showTooltip, 260581e), link tooltip (showLinkTooltip, 260581e), $cap stat bar + verified-node class (updateStats / circle .classed, dbb55c0). Replaced the duplicated inline confidenceLower derivation with provenanceFor; "View Source" links now gated on prov.source (no dangling-FK crash). $cap Observed-badged from DATA.meta; counts unbadged; verified-node trust-derived. Added + registered tests/viz-provenance-wiring.test.mjs. npm test = 136 pass / 0 fail. **Phase 02 plan 2 of 4 complete.**

**Next step:** Plan 02-03 — wire provenanceFor/renderProvenanceBadge into js/ui (company card, card insights, compare grid, provenance drawer).

---
*State initialized: 2026-06-20*
