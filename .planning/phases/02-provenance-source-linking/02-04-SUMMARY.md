---
phase: 02-provenance-source-linking
plan: 04
subsystem: testing
tags: [provenance, wiring-test, string-test, gate-fix, parity-verify, phase-close]

# Dependency graph
requires:
  - phase: 02-provenance-source-linking
    provides: "js/trust/index.js — provenanceFor/badgeHtml/renderProvenanceBadge (plan 02-01)"
  - phase: 02-provenance-source-linking
    provides: "js/viz/index.js wired to trust (plan 02-02)"
  - phase: 02-provenance-source-linking
    provides: "js/ui/index.js wired to trust (plan 02-03)"
provides:
  - "tests/trust-wiring.test.mjs — registered string-presence guard asserting trust exports all three functions AND that viz+ui import from ../trust/index.js and call provenanceFor (>=1 each); fails if either consumer drops the wiring"
  - "package.json scripts.test registers tests/trust-wiring.test.mjs (second half of the T-02-09 GATE LANDMINE fix — an unregistered test silently never runs)"
  - "docs/perf/_parity-verify-0204.cjs — reusable Playwright harness that serves the site and routes a synthetic dataset to confirm badges render + source links resolve"
affects: [phase-03-confidence-scoring, phase-04-design-system]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "String-presence wiring guard: fs.readFileSync each source file + regex-assert export/import/call sites (mirrors tests/index-ui-integrity.test.mjs); no page execution"
    - "Test added LAST in the phase (wave 3) so prior waves' npm test stayed green — it can only pass once both viz (02-02) and ui (02-03) call the trust API"
    - "Parity verification via Playwright page.route to swap data/top100-map.js for a synthetic dataset (Phase-1 approach), never touching committed data on disk"

key-files:
  created:
    - tests/trust-wiring.test.mjs
    - docs/perf/_parity-verify-0204.cjs
  modified:
    - package.json

key-decisions:
  - "Wiring assertions use call-count regex (provenanceFor\\s*\\() rather than mere substring presence, so a commented-out or renamed call still fails the guard — verified by mutating viz in a sandbox copy (calls dropped to 0 -> ERR_ASSERTION) then restoring."
  - "Registered in package.json BEFORE asserting the suite is green; acceptance grep 'tests/trust-wiring.test.mjs' confirms registration (closes T-02-09 — the GATE LANDMINE where an unregistered test passes vacuously by never running)."
  - "Checkpoint auto-approved under AUTO_MODE: ran the automatable browser verification with a synthetic nodes/links/profiles dataset (committed snapshot lacks them — carried-forward Phase-1 condition) and recorded results honestly. Treated as approved."

patterns-established:
  - "Pattern: cross-module wiring is test-locked with a single registered string-presence test that guards the import + call sites of the trust core in every consumer."

requirements-completed: [TRUST-01, TRUST-02]

# Metrics
duration: ~12min
completed: 2026-06-20
---

# Phase 2 Plan 4: Trust-Wiring Test + Phase-Close Parity Verify Summary

Added and registered the `tests/trust-wiring.test.mjs` string-presence guard (closing the second half of the T-02-09 GATE LANDMINE), confirmed the full suite is green at 144 tests, and ran the auto-approved browser parity check (badges render, source links resolve to real SEC/IR URLs, zero console errors) — closing Phase 2.

## What Was Built

**Task 1 — trust-wiring test + registration** (commit `9251238`)
- `tests/trust-wiring.test.mjs`: three cases reading source files as strings via `fs.readFileSync`:
  1. `js/trust/index.js` exports `provenanceFor`, `badgeHtml`, `renderProvenanceBadge` (`/export function .../`).
  2. `js/viz/index.js` imports `from "../trust/index.js"` AND calls `provenanceFor` ≥1 time.
  3. `js/ui/index.js` imports `from "../trust/index.js"` AND calls `provenanceFor` ≥1 time.
- `package.json` scripts.test appended `tests/trust-wiring.test.mjs` after `tests/provenance.test.mjs` (and the viz/ui wiring tests from 02-02/02-03).

**Parity harness** (commit `f62de78`)
- `docs/perf/_parity-verify-0204.cjs`: serves the site (http-server, never file://), routes `data/top100-map.js` to a synthetic dataset (real SEC EDGAR / IR / companiesmarketcap URLs), and exercises the trust render path through the live page.

## Verification

| Check | Result |
|-------|--------|
| `node --check tests/trust-wiring.test.mjs` | passes |
| `grep -q "tests/trust-wiring.test.mjs" package.json` | registered |
| `npm test` | exit 0, **144 tests pass / 0 fail** (141 prior + 3 new wiring cases) |
| Real-guard check (mutate viz, drop provenanceFor calls) | test FAILS (found 0 calls → ERR_ASSERTION); restored clean |

### Browser parity (auto-approved checkpoint) — recorded honestly
- Served via `npx http-server -p 8080 .`; navigated to `http://localhost:8080/index.html` → **http 200**, `page_errors: []` (no console/page errors).
- **$cap stat bar:** live `.prov-badge` rendered in the DOM with a real `source ↗` link → `https://companiesmarketcap.com/?download=csv` (Observed).
- **Node observed:** NVDA `high (SEC 10-K)` → Observed badge + real SEC EDGAR 10-K link.
- **Node estimated:** TSM `medium` → Estimated badge + real TSMC IR link.
- **Node unknown (graceful degradation):** unsourced `low` → Unknown badge, NO link (honest, no fabricated source).
- **Relationship link observed:** `high` + `sf` → Observed + real source link; **link unknown:** `low` + empty `sf` → Unknown, no link.
- Markup reuses existing `confidence-high/medium/low` + `source-link` classes with `rel="noopener noreferrer"` and accessible aria-labels.

Note: with the committed `data/top100-map.js` snapshot (no nodes/links/profiles), figures degrade to the honest Unknown badge with no link — the documented correct behavior. The synthetic dataset (Phase-1 approach) exercises the observed/estimated/sourced paths.

## Deviations from Plan

None — plan executed exactly as written. The parity harness (`docs/perf/_parity-verify-0204.cjs`) was committed as a `chore` so the verification tooling is tracked rather than left untracked (mirrors the Phase-1 `_perf-capture.cjs` convention in the same directory); not a behavioral change.

## Authentication Gates

None.

## Threat Mitigations Applied

- **T-02-09 (Tampering — unregistered test silently not running):** mitigated. `tests/trust-wiring.test.mjs` explicitly appended to `package.json scripts.test`; acceptance grep confirms registration; suite tally rose 141 → 144 proving it runs.
- **T-02-SC (npm installs):** accepted/N/A — no packages added this phase (buildless).

## Self-Check: PASSED
- FOUND: tests/trust-wiring.test.mjs
- FOUND: docs/perf/_parity-verify-0204.cjs
- FOUND: package.json (registration string present)
- FOUND: commit 9251238 (test)
- FOUND: commit f62de78 (chore/harness)
