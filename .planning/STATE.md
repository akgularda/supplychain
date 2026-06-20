---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: completed
last_updated: "2026-06-20T20:15:06.779Z"
progress:
  total_phases: 10
  completed_phases: 1
  total_plans: 3
  completed_plans: 3
  percent: 10
---

# Project State: Monarch Castle Technologies — Market Intelligence

## Project Reference

**Core Value:** Investors trust every number and instantly grasp supply-chain structure, concentration, and risk — credibility first, then beauty, then unique depth.

**Current Focus:** Phase 01 — Foundation (Safety-Net Modularization)

**Mode:** mvp | **Granularity:** fine

## Current Position

Phase: 01 (Foundation (Safety-Net Modularization)) — COMPLETE
Plan: 3 of 3 complete
**Phase:** 1 — Foundation (Safety-Net Modularization)
**Plan:** 01-03 complete (deploy fix + post-extraction non-regression) — Phase 1 done (3/3)
**Status:** Phase 01 complete — next: Phase 02 (Provenance & Source Linking)
**Progress:** [██████████] 100%

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

**Last action:** Completed 01-03-PLAN.md — added guarded `cp -R styles _site/` + `cp -R js _site/` to deploy-pages.yml (be1ff9d, FOUND-05), appended post-extraction Lighthouse/perf comparison to docs/perf/baseline-2026-06-20.md showing no regression (63a53d4, FOUND-04), and auto-approved the render-parity checkpoint after proving (http-server + Playwright) all 4 CSS + 6 JS load 200 and all 7 window.* handlers wire. npm test = 116/0 unchanged. **Phase 1 complete (3/3 plans).**

**Next step:** Begin Phase 02 (Provenance & Source Linking — TRUST-01, TRUST-02).

---
*State initialized: 2026-06-20*
