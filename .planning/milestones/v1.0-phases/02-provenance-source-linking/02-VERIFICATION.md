---
phase: 02-provenance-source-linking
verified: 2026-06-21T00:00:00Z
status: human_needed
score: 4/4 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open the site in a browser, hover over any network node; confirm an Observed/Estimated/Unknown badge appears in the tooltip alongside a source link."
    expected: "Tooltip shows a coloured provenance pill (confidence-high/medium/low class) and, for sourced nodes, a 'View Source' link that opens the real filing/report in a new tab."
    why_human: "DOM rendering and tooltip display require a real browser; Node test gate covers code paths only."
  - test: "Open a company profile (e.g. AAPL), click 'Sources' drawer button; verify each source entry shows a title and a working link (not a raw 'undefined' or empty label)."
    expected: "Every source row reads its real title from src.title (not src.t) and the href is a reachable http(s) URL."
    why_human: "The src.t->title bug fix is verified by static grep in tests, but the rendered drawer output requires visual/click confirmation."
  - test: "Open the compare modal with at least 2 companies; confirm 'Verified Entities' column shows a non-zero integer derived from provenanceFor (not a stale heuristic count)."
    expected: "The integer matches the count of nodes where tag='observed' AND a resolving source URL exists."
    why_human: "Compare grid is DOM-rendered; correct value depends on runtime source index resolution."
  - test: "In global view, confirm the $cap stat bar shows a provenance badge (Observed, linked to companiesmarketcap.com); confirm the four derived counts (#sN/#sL/#sC/#sY) are deliberately unbadged."
    expected: "Only the $cap figure carries a badge. No badge appears next to node/link/country/layer counts."
    why_human: "Animated counter + badge injection is runtime-only DOM behaviour."
---

# Phase 2: Provenance & Source Linking Verification Report

**Phase Goal:** No investor sees a major number without knowing whether it is observed or estimated and where it came from — the credibility foundation laid before any other trust feature.
**Verified:** 2026-06-21T00:00:00Z
**Status:** human_needed (all automated checks PASS; 4 browser checks queued)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every displayed major figure shows a provenance badge tagging it `observed` or `estimated` | VERIFIED | `provenanceFor` called in viz node tooltip, link tooltip, $cap stat bar, and company-card anchor; `badgeHtml` emits `.confidence-high/.confidence-medium/.confidence-low` span with ARIA label. Trust-wiring tests confirm ≥2 call sites in both viz and ui. |
| 2 | Each figure exposes a reachable inline source link on hover/click that resolves to a real source | VERIFIED | `badgeHtml` emits `<a href="..." target="_blank" rel="noopener noreferrer">` only when `url.startsWith('http')` — RESEARCH V5 control enforced in code. 100/100 profiles have at least one `sources[]` entry with real URLs. The provenance drawer reads `src.title` (src.t bug fixed). |
| 3 | No figure is fabricated or unsourced — provenance driven by existing real `data/` JSON contract, unchanged | VERIFIED | `provenanceFor` is PURE and derives `observed`/`estimated`/`unknown` from `confidence`/`cf` string prefixes and `sourceId`/`sf` FK lookups against `sourceIndex`. Never fabricates a tag. Data sweep test (`provenance.test.mjs`) asserts both buckets (sourced + unsourced/dangling) are non-empty, proving derivation is real. `data/top100-map.js` `<script src>` tag is unchanged in `index.html`. |
| 4 | The 103-test suite stays green with provenance rendering in place | VERIFIED | `npm test` (9 files, expanded suite): **144 pass / 0 fail / 0 skip / 0 todo** — confirmed by live run. New test files registered in `package.json scripts.test`. |

**Score:** 4/4 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `js/trust/index.js` | Pure trust core: `provenanceFor`, `badgeHtml`, `renderProvenanceBadge` | VERIFIED | 87 lines; all three functions exported; `provenanceFor` derives from `confidence`/`cf` prefixes + FK lookup; never throws on dangling FK or empty sf. |
| `js/viz/index.js` | Imports trust API; badges in node tooltip, link tooltip, $cap stat bar, verified-node class | VERIFIED | Line 8: `import { provenanceFor, renderProvenanceBadge, badgeHtml } from "../trust/index.js"`. 3 `provenanceFor(` calls confirmed. `.classed('verified-node', ...)` uses trust result, not inline heuristic. |
| `js/ui/index.js` | Imports trust API; badges in company-card anchor and compare-grid Verified Entities | VERIFIED | Line 15: `import { provenanceFor, renderProvenanceBadge, badgeHtml } from "../trust/index.js"`. `renderCardAnchorBadge` and `showCompare` both call `provenanceFor`. Old `.includes('source')` heuristic replaced. |
| `tests/provenance.test.mjs` | Unit tests: tag derivation + data sweep + `badgeHtml` shape | VERIFIED | 14 tests; all pass. Data sweep covers every profile node + link. |
| `tests/viz-provenance-wiring.test.mjs` | Asserts viz wiring (imports, call count, old code gone, $cap marker, verified-node class) | VERIFIED | 5 tests; all pass. |
| `tests/ui-provenance-wiring.test.mjs` | Asserts ui wiring + src.t->title bug fix | VERIFIED | 5 tests; all pass. `openProvenance` reads `src.title`; `parseYearsFromSources` reads `source.title`. |
| `tests/trust-wiring.test.mjs` | Cross-module export + import guard; registered last in package.json | VERIFIED | 3 tests; all pass. File is listed in `package.json scripts.test`. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `js/viz/index.js` | `js/trust/index.js` | `import { provenanceFor, badgeHtml, renderProvenanceBadge }` at line 8 | WIRED | 3 call sites in viz: `showTooltip`, `showLinkTooltip`, `updateStats`/`classed` |
| `js/ui/index.js` | `js/trust/index.js` | `import { provenanceFor, renderProvenanceBadge, badgeHtml }` at line 15 | WIRED | 2+ call sites: `renderCardAnchorBadge`, `showCompare` |
| `provenanceFor` | `data/top100-map.json` | `ctx.sourceIndex` built from `profile.sources[]` at call sites | WIRED | Source FK index built inline at every call site; real data flows to badge |
| `$cap stat bar` | `DATA.meta.source` | `provenanceFor({ marketcap: true }, { meta: DATA.meta })` | WIRED | `meta.source` = `https://companiesmarketcap.com/?download=csv` (confirmed) |
| `openProvenance drawer` | `profile.sources[].title` | `src.title` (was `src.t`) | WIRED | Bug fixed; `src.title` present at `js/ui/index.js:130` |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `js/trust/index.js: provenanceFor` | `raw` (confidence string), `fk` (sourceId/sf), `src` (resolved source object) | `node.confidence`, `node.sourceId`, `sourceIndex[fk]` — from `data/top100-map.json` profiles | Yes — data sweep test asserts `resolvedToSource > 0` AND `unsourced > 0` | FLOWING |
| `js/viz/index.js: showTooltip` | `prov` (badge + source) | `provenanceFor(d, { sourceIndex: STATE.sourceIndex, meta: DATA.meta })` — STATE populated from `graphForMode()` | Yes — sourceIndex wired from real graph data | FLOWING |
| `js/viz/index.js: updateStats ($cap)` | `capProv` | `provenanceFor({ marketcap: true }, { meta: DATA.meta })` — `DATA.meta.source` is real URL | Yes | FLOWING |
| `js/ui/index.js: renderCardAnchorBadge` | `prov` for anchor node | `provenanceFor(anchor, { sourceIndex, meta: DATA.meta })` — sourceIndex built from `profile.sources` | Yes — 100/100 profiles have sources | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `provenanceFor` derives `observed` from `high*` confidence | `node --test tests/provenance.test.mjs` (test 1) | PASS | PASS |
| Data sweep: every node maps to allowed tag, both sourced + unsourced buckets non-empty | `node --test tests/provenance.test.mjs` (test 10) | PASS | PASS |
| `badgeHtml` emits HTTPS source link with `rel="noopener"` | `node --test tests/provenance.test.mjs` (test 13) | PASS | PASS |
| viz imports trust API with ≥2 `provenanceFor` calls | `node --test tests/viz-provenance-wiring.test.mjs` | PASS | PASS |
| ui src.t→title bug fixed | `node --test tests/ui-provenance-wiring.test.mjs` (test 4+5) | PASS | PASS |
| Full suite green (144 tests) | `npm test` | 144 pass / 0 fail | PASS |

---

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| TRUST-01 | Every displayed major figure shows a provenance badge (`observed`/`estimated`) | SATISFIED | `provenanceFor` + `badgeHtml` wired into all 3 viz render paths and 2 ui render paths; tests confirm call sites and badge HTML shape. |
| TRUST-02 | Each figure exposes a reachable inline source link (SEC filing, annual report) on hover or click | SATISFIED | `badgeHtml` emits `<a>` only for `http*` URLs (RESEARCH V5); drawer reads real `src.title`; 100/100 profiles carry source arrays; unsourced figures degrade to explicit `unknown` (no fabrication). |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | — | — | — |

Zero `TBD`, `FIXME`, or `XXX` markers found in `js/trust/index.js`, `js/viz/index.js`, `js/ui/index.js`, or any of the four new test files.

---

### Human Verification Required

#### 1. Node/Link Tooltip Provenance Badge (Browser)

**Test:** Open the site in a browser, hover over any network node on the global view.
**Expected:** Tooltip shows a coloured provenance pill (Observed / Estimated / Unknown with appropriate CSS class) and, for sourced nodes, a "View Source" link that opens the real filing/report in a new tab.
**Why human:** DOM rendering and tooltip display require a real browser; the Node test gate covers only static code paths.

#### 2. Source Drawer Title Rendering (Browser)

**Test:** Open a company profile (e.g. AAPL), click the "Sources" button; inspect each source row in the provenance drawer.
**Expected:** Every row shows a real title string (e.g. "Apple 10-K 2023") and a clickable HTTPS link — no `undefined`, no empty label, confirming the `src.t → src.title` bug is fixed end-to-end.
**Why human:** Static grep confirms the code path uses `src.title`; rendered output needs visual confirmation.

#### 3. Compare Grid Verified Entities Count (Browser)

**Test:** Add 2 companies to compare (use the + button on the company card), open the compare modal.
**Expected:** "Verified Entities" column shows a non-zero integer that matches the count of nodes with `tag='observed'` AND a resolving source URL — not the old stale `.includes('source')` heuristic count.
**Why human:** Compare grid is DOM-rendered; correct value depends on runtime source index resolution.

#### 4. $Cap Badge and Unbadged Counts (Browser)

**Test:** In global view, look at the stat bar showing $, #companies, #links, #countries, #layers.
**Expected:** Only the `$`-prefixed market-cap figure shows a provenance badge (Observed, linked to companiesmarketcap.com). The four derived count figures (#sN, #sL, #sC, #sY) are deliberately unbadged (RESEARCH Q1 decision).
**Why human:** Animated counter + badge injection is runtime-only DOM behaviour not testable in Node.

---

### Gaps Summary

No gaps. All four Phase 2 Success Criteria are verified by code evidence and a passing 144-test suite. The four human-verification items above are browser-only checks of rendering behaviour already confirmed correct by static analysis; they do not indicate missing implementation.

---

_Verified: 2026-06-21T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
