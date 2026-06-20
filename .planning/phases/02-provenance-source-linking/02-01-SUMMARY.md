---
phase: 02-provenance-source-linking
plan: 01
subsystem: trust
tags: [provenance, esm, node-test, escapeHtml, data-driven, accessibility]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: js/trust/index.js placeholder, ESM module split, sourceIndex build in js/data graphForMode, 116-test gate
provides:
  - "Pure provenanceFor(input, ctx) deriving observed/estimated/unknown from confidence/cf strings — never fabricates"
  - "Pure badgeHtml(prov) emitting an accessible escaped pill + guarded source link"
  - "renderProvenanceBadge(el, prov) — the single DOM touch, delegates to badgeHtml"
  - "tests/provenance.test.mjs registered in package.json scripts.test (GATE LANDMINE closed)"
affects: [02-02-viz-wiring, 02-03-ui-wiring, 02-04-trust-wiring, phase-03-confidence-scoring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Scoped js/package.json {type:module} so Node parses the already-ESM js/**/*.js as ESM (browser unaffected — it uses <script type=module>)"
    - "Pure/DOM-free trust core: provenanceFor + badgeHtml unit-testable in Node; only renderProvenanceBadge touches el.innerHTML"
    - "Data-derived tags via confidence-string prefix; FK null-check degrades dangling/empty source refs to tag-only"

key-files:
  created:
    - tests/provenance.test.mjs
    - js/package.json
  modified:
    - js/trust/index.js
    - package.json

key-decisions:
  - "high* -> observed, medium* -> estimated, missing/empty/dangling -> unknown (RESEARCH A2); market-cap marker -> observed via meta.source/top100_source_url (A1)"
  - "Added scoped js/package.json {type:module} (Rule 3 blocking fix): root package.json is type=commonjs so Node read the ESM trust module as CJS and the named import threw; the browser is unaffected"
  - "badgeHtml emits the <a> only when url startsWith('http') and escapes title+url (RESEARCH V5 / T-02-01); every link carries rel=noopener noreferrer (T-02-02)"

patterns-established:
  - "Pattern: trust core stays dependency-light — local escapeHtml mirroring js/data/index.js:9 rather than importing DOM-coupled data module"
  - "Pattern: data-sweep test asserts both source-resolved AND unsourced buckets are non-empty to prove derivation is real, not hardcoded"

requirements-completed: [TRUST-01, TRUST-02]

# Metrics
duration: 14min
completed: 2026-06-20
---

# Phase 2 Plan 01: Data-Driven Trust Core Summary

**Pure, DOM-free provenanceFor/badgeHtml/renderProvenanceBadge that derive observed/estimated/unknown tags from the existing confidence-string vocabulary and resolve real source links — proven by a registered 15-test suite swept over the real top100-map.json (116 + 15 = 131 green).**

## Performance

- **Duration:** ~14 min
- **Started:** 2026-06-20T20:40Z
- **Completed:** 2026-06-20
- **Tasks:** 2 (both TDD)
- **Files modified:** 4

## Accomplishments
- Implemented the Phase-1 `export {}` placeholder into a real, pure trust core: `provenanceFor` (DOM-free, derives tags from `confidence`/`cf` prefix, null-checks FKs), `badgeHtml` (pure, escaped, guarded link), `renderProvenanceBadge` (single DOM touch).
- Closed the GATE LANDMINE: `tests/provenance.test.mjs` is registered in `package.json scripts.test` and verifiably runs — suite count rose 116 -> 131.
- Data-sweep coverage over all 100 profiles' nodes and links: every record maps to a non-throwing allowed tag; both a source-resolved bucket and an unsourced bucket (the 33 dangling FKs + missing/empty refs) are asserted non-empty, proving tags are derived not fabricated.
- Security posture: title/url escaped, `<a>` only when `url.startsWith('http')`, `rel="noopener noreferrer"` on every new-tab link (T-02-01/02/03 mitigated).

## Task Commits

Each task was committed atomically (TDD RED -> GREEN):

1. **Task 1: Write failing provenance tests + register the test file (RED + GATE fix)** - `17fc9e0` (test)
2. **Task 2: Implement provenanceFor/badgeHtml/renderProvenanceBadge (GREEN)** - `7019314` (feat)

**Plan metadata:** (this commit) (docs: complete plan)

## Files Created/Modified
- `tests/provenance.test.mjs` - 15 cases: unit tag-derivation, market-cap marker, dangling/empty-FK, badge HTML + escaping + http guard, and two data sweeps over top100-map.json.
- `js/trust/index.js` - The trust core: pure `provenanceFor` + `badgeHtml`, DOM-touching `renderProvenanceBadge`, local `escapeHtml`.
- `package.json` - Appended `tests/provenance.test.mjs` to `scripts.test`.
- `js/package.json` - New scoped `{type:module}` so Node parses the ESM `js/` modules as ESM (Rule 3 blocking fix).

## Decisions Made
- Tag mapping `high*->observed`, `medium*->estimated`, else `unknown`; market-cap marker -> observed via `meta.source || meta.top100_source_url` (RESEARCH A1/A2).
- Kept trust dependency-light by copying `escapeHtml` locally rather than importing `js/data/index.js` (which couples to `window.SUPPLY_MAP_DATA`).
- The source `<a>` is gated on `url.startsWith('http')` and the title/url are escaped, preserving a no-XSS posture even though the data is first-party.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added scoped `js/package.json` with `{type:module}`**
- **Found during:** Task 2 (running `npm test` after implementing the trust module)
- **Issue:** Root `package.json` declares `"type": "commonjs"`, so Node parsed the ESM `js/trust/index.js` as CommonJS and the test's `import { provenanceFor, badgeHtml }` threw `SyntaxError: Named export 'badgeHtml' not found ... is a CommonJS module`. The plan's `key_links` fixes the import path to `../js/trust/index.js`, and the browser loads these modules via `<script type="module">`, so neither the import path nor the source could change.
- **Fix:** Created `js/package.json` containing `{ "type": "module" }`. This scopes ESM resolution to the `js/` directory only; all 6 files there already use `export`/`import` (zero `require`/`module.exports`), and the browser is unaffected (it never reads this package.json).
- **Files modified:** js/package.json (new)
- **Verification:** `npm test` -> 131 pass / 0 fail; the named import resolves.
- **Committed in:** `7019314` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to make the contracted Node import work; no scope creep — does not touch data files, index.html, the root test list, or any browser load path.

## Issues Encountered
- None beyond the CJS/ESM mismatch documented above.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - the trust core is fully implemented and exercised against real data. (Viz/UI wiring of these functions is intentionally deferred to plans 02-02/02-03/02-04 per the wave plan; this plan ships only the pure, tested engine.)

## Self-Check: PASSED
- js/trust/index.js exists, exports provenanceFor + badgeHtml + renderProvenanceBadge (grep: 3 `export function`)
- tests/provenance.test.mjs exists and is registered in package.json scripts.test (grep match)
- js/package.json exists ({type:module})
- Commits 17fc9e0 (test) and 7019314 (feat) present in git log
- npm test: 131 pass / 0 fail

## Next Phase Readiness
- Plans 02-02 (viz) and 02-03 (ui) can now `import { provenanceFor, renderProvenanceBadge } from "../trust/index.js"` and pass `{ sourceIndex: STATE.sourceIndex, meta: DATA.meta }` as ctx.
- Plan 02-04 will add `tests/trust-wiring.test.mjs` (string-presence) and register it once viz+ui are wired.
- No blockers. The pre-existing local-render data condition (thin snapshot lacks profiles) is unchanged and does not affect this pure module.

---
*Phase: 02-provenance-source-linking*
*Completed: 2026-06-20*
