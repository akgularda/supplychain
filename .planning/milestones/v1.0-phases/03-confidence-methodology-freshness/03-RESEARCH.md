# Phase 3: Confidence, Methodology & Freshness - Research

**Researched:** 2026-06-21
**Domain:** Buildless ESM (browser), data-derived trust scoring, Node `node:test` unit/string tests
**Confidence:** HIGH (everything verified against the real codebase + real dataset; no external library introduced)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
**Confidence score (TRUST-03) — real-data-derived, no fabrication**
- Add `confidenceScore(input, ctx)` → 0–100 (integer) to `js/trust/index.js`, composed from:
  - **Source-type weight**: derived from the existing `confidence` qualifier vocabulary (e.g. "high (company disclosure)" > "medium (source-backed)") — map qualifiers to base weights. This is the real source-type signal present in the data.
  - **Age decay**: derived from source years via the existing `parseYearsFromSources` (older sources decay the score). Use the dataset `meta.lastUpdated`/`generated` as "now" reference.
  - **Unknown handling**: figures with no provenance get a low/explicit-uncertain score (never a fabricated high score). Score is shown alongside the Phase-2 observed/estimated/unknown badge in tooltips.
- The score function is PURE/DOM-free and unit-tested (weighting + decay math).

**Methodology view (TRUST-04)**
- A dedicated, accessible Methodology modal/panel (in `js/ui`) explaining: the real data sources (counts by type, the 407 sources), how the confidence weighting + age decay work, the observed/estimated/unknown semantics, and known limits (e.g. dangling source FKs, estimated relationships). Reachable from a clear entry point (e.g. a "Methodology" button near the stat bar / help). Content is honest about limitations.

**Freshness indicator (TRUST-05)**
- A visible "last verified / updated" indicator bound to the dataset `meta.lastUpdated` (and/or `generated`) — the value the weekly GitHub-Actions auto-update writes. It MUST read the live value so it stays accurate after a refresh (no hardcoded date). Place in the stat bar / header / footer.

**Tests (TRUST-06)**
- New `.mjs` tests (REGISTERED in `package.json scripts.test`) covering confidence-score math (weighting + age decay, bounds 0–100, unknown→low), the methodology view's presence/wiring, and freshness reading the live meta value (not hardcoded). Keep the full suite green.

### Claude's Discretion
- The exact base-weight numbers, decay half-life, and unknown floor (within the "must be defensible, bounded 0–100, unknown→low, no fabrication" envelope).
- Methodology copy + entry-point placement (reuse existing modal pattern).
- Freshness label wording.

### Deferred Ideas (OUT OF SCOPE)
- Design-system styling of score/methodology/freshness → Phase 4.
- Per-source confidence dashboards / analytics → Phase 6+.
- Any data-contract change or fabrication.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TRUST-03 | Confidence score (0–100%) per figure, weighted by source type + age decay, shown in tooltips | Real qualifier vocabulary enumerated (§1); age signal via per-source year parse (§1); concrete formula proposed (§1); tooltip wiring points identified (§4) |
| TRUST-04 | Methodology view: sources, weighting, known limits | Real facts to surface enumerated (§3: 407 sources, qualifier counts, 75 dangling FKs, year coverage); modal pattern + entry point identified (§3) |
| TRUST-05 | Freshness indicator tied to auto-update timestamp | Exact field confirmed = `meta.lastUpdated` (display) / `meta.generatedAt` (age math); already partly wired; binding & double-write hazard documented (§2) |
| TRUST-06 | New tests for provenance tagging + confidence-scoring math | Test plan + registration requirement (§5, Validation Architecture); mirrors existing `provenance.test.mjs` + `*-wiring.test.mjs` conventions |
</phase_requirements>

## Summary

Phase 3 adds a **pure, data-derived `confidenceScore(input, ctx)`** to `js/trust/index.js` (extending the existing `provenanceFor`/`badgeHtml` core), an **honest Methodology modal** in `js/ui/index.js`, and a **live freshness indicator** bound to the dataset's real timestamp. No new npm packages, no data-contract change, no build step. The signals it needs already exist in the real data:

- **Source-type signal:** the `confidence`/`cf` qualifier strings — verified vocabulary is **`high (...)`** (120 occurrences across nodes+links) and **`medium (...)`** (3,447 occurrences); there is **no `low`** tier and only **1 missing/`(none)`** value in the entire profile dataset. So source-type weight is a two-tier `high > medium`, plus an `unknown` floor for unsourced/dangling figures.
- **Age signal:** source publication years are parseable from `id`/`title`/`url` text. **131 of 407 sources** carry a parseable year; the dominant years are **2024 (112) and 2025 (110)**. The per-figure age must resolve the figure's source FK (`sourceId`/`sf`) → that source's year, then decay against the dataset "now".
- **Reference "now":** `meta.lastUpdated` ("Feb 22, 2026, 10:21 PM" — display string) and `meta.generatedAt` (`2026-02-22T19:21:43.758Z` — ISO, parseable). **Use `meta.generatedAt` for age math; display `meta.lastUpdated`.**

**Primary recommendation:** Implement `confidenceScore(input, ctx)` as `clamp(round(baseWeight × ageMultiplier), 0, 100)` where `baseWeight` is `90` for `high*`, `65` for `medium*`, `25` for `unknown` (no resolving source); `ageMultiplier` is an exponential half-life decay (`0.5 ^ (ageYears / HALF_LIFE)`, `HALF_LIFE = 4`) clamped to `[0.5, 1.0]`, and **`1.0` (no decay) when no year is parseable** (absence of a date is not evidence of staleness — never invent a penalty or a bonus). Unknown-provenance figures bypass decay and return the floor directly. This is a recommendation; exact constants are Claude's discretion per CONTEXT.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Confidence math (`confidenceScore`) | Pure JS module (`js/trust`) | — | Must be DOM-free + Node-unit-testable, exactly like the existing `provenanceFor`/`badgeHtml`. |
| Per-source year extraction | Data module (`js/data`) | — | `parseYearsFromSources` already lives here; add/reuse a per-source year helper next to it. |
| Tooltip score display | Viz (`js/viz`) | — | `showTooltip`/`showLinkTooltip` already own the badge render path. |
| Methodology modal + freshness wiring | UI (`js/ui`) | — | Owns all modals (`openModal`/`closeModal`/`trapFocus`) and the status indicator. |
| Freshness timestamp source | Data file `data/top100-map.js` (`window.SUPPLY_MAP_DATA.meta`) | Generator script | Live value injected at load; written by `scripts/generate-top100-data.mjs`. |

## Standard Stack

**No new packages.** This phase is pure in-repo JS extending existing modules. The "stack" is the existing buildless ESM + `node:test` setup.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:test` | Node 20 builtin | Unit + string-presence tests | Already the entire suite's runner (`node --test ...`); zero deps. [VERIFIED: package.json scripts.test] |
| `node:assert/strict` | Node 20 builtin | Assertions | Used by every existing `tests/*.mjs`. [VERIFIED: tests/provenance.test.mjs] |
| ES modules (browser, buildless) | native | `js/trust`, `js/viz`, `js/ui` | FOUND-02 constraint; `import { ... } from "../trust/index.js"`. [VERIFIED: js/viz/index.js:8] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline two-tier weight map | A config object exported from trust | Marginal; a small `const SOURCE_WEIGHTS = {...}` inside `js/trust` is enough and stays DOM-free. |
| Exponential half-life decay | Linear decay over N years | Linear is simpler to explain but hits 0 abruptly; exponential with a floor is gentler and more defensible. Either is acceptable — exponential recommended. |

**Installation:** none — no `npm install`.

## Package Legitimacy Audit

> Not applicable — this phase installs **zero** external packages. All work extends existing in-repo ESM modules and uses Node builtins (`node:test`, `node:assert`). No registry interaction, so no slopcheck/registry verification needed.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
                                  data/top100-map.js  (window.SUPPLY_MAP_DATA)
                                  ├─ meta.generatedAt (ISO)  ──┐  age "now"
                                  ├─ meta.lastUpdated (display)─┼─┐ freshness label
                                  ├─ profiles[sym].nodes[].confidence + .sourceId
                                  └─ profiles[sym].sources[]  (id/title/url/note → year)
                                            │
                  ┌─────────────────────────┼──────────────────────────────┐
                  ▼                         ▼                                ▼
         js/data/index.js          js/trust/index.js (PURE)         js/ui updateStatusIndicator
         parseYearsFromSources     provenanceFor(input,ctx) ──┐     reads meta.generatedAt → daysOld
         (+ new sourceYear helper) confidenceScore(input,ctx)─┤     writes #updateStatusDot/#lastUpdated
                  │                          │ uses tag+source │
                  │                          │ + source year   │
                  ▼                          ▼                  ▼
            graphForMode()           returns 0–100 int     Freshness indicator (live)
            builds sourceIndex            │
                  │                       │
                  ▼                       ▼
         js/viz showTooltip / showLinkTooltip ──► "Confidence: 82%" next to badgeHtml(prov)
                  │
                  ▼
         js/ui Methodology modal (openModal/trapFocus) ◄── new #bMethodology button
              renders: 407 sources, qualifier counts, weighting explanation, known limits
```

### Component Responsibilities
| File | Adds | Touches |
|------|------|---------|
| `js/trust/index.js` | `export function confidenceScore(input, ctx)` (pure) + `SOURCE_WEIGHTS` map | reuses `provenanceFor` internally to get tag+resolved source |
| `js/data/index.js` | (optional) `sourceYear(source)` helper next to `parseYearsFromSources`; export it | nothing else |
| `js/viz/index.js` | call `confidenceScore` in `showTooltip` + `showLinkTooltip`, render `Confidence: NN%` | tooltip HTML strings only |
| `js/ui/index.js` | `openMethodology()` + `wireUI` button binding; methodology content builder | reuse `openModal`/`closeModal`; freshness already in `updateStatusIndicator` |
| `index.html` | a `#methodologyModal` (role=dialog) + a `#bMethodology` entry button | mirror existing `#helpModal` structure |

### Pattern 1: Pure score function reusing the existing provenance core
**What:** `confidenceScore` calls `provenanceFor(input, ctx)` to obtain `{tag, source}`, then maps tag→base weight and applies source-year decay.
**When to use:** every figure that already shows a provenance badge (node tooltip, link tooltip).
**Example:**
```javascript
// Source: derived from js/trust/index.js (Phase 2) + the real qualifier vocabulary.
const SOURCE_WEIGHTS = { observed: 90, estimated: 65, unknown: 25 };
const HALF_LIFE_YEARS = 4;
const MIN_AGE_MULT = 0.5;

export function confidenceScore(input, ctx = {}) {
  const prov = provenanceFor(input, ctx);          // {tag, source?}
  const base = SOURCE_WEIGHTS[prov.tag] ?? SOURCE_WEIGHTS.unknown;
  if (prov.tag === "unknown" || !prov.source) {
    return SOURCE_WEIGHTS.unknown;                  // floor; never decayed up/down
  }
  const year = ctx.sourceYear;                      // number | null, resolved by caller
  let mult = 1;                                     // no year => no decay (absence != staleness)
  if (typeof year === "number" && Number.isFinite(year) && ctx.now) {
    const ageYears = Math.max(0, (ctx.now - year));
    mult = Math.max(MIN_AGE_MULT, Math.pow(0.5, ageYears / HALF_LIFE_YEARS));
  }
  return Math.max(0, Math.min(100, Math.round(base * mult)));
}
```
Caller (viz) supplies `ctx.sourceYear` (resolved from the figure's FK source) and `ctx.now` (year extracted from `DATA.meta.generatedAt`). Keeping the FK→year resolution in the caller keeps `confidenceScore` pure and trivially unit-testable.

### Anti-Patterns to Avoid
- **Fabricating a default year/penalty when none parses:** a source with no detectable year must yield `mult = 1` (no penalty AND no bonus). Inventing "assume 5 years old" would fabricate staleness. (CONTEXT: no fabrication.)
- **Adding a `low` tier the data doesn't have:** the dataset has only `high*` and `medium*` qualifiers — do not introduce a `low (...)` weight bucket; the only "low" outcome is the `unknown` floor for unsourced/dangling FKs.
- **Reading `meta.lastUpdated` (the display string) for age math:** `"Feb 22, 2026, 10:21 PM"` is locale-formatted and brittle to `new Date()`. Use `meta.generatedAt` (ISO) for math; `meta.lastUpdated` only for display.
- **Trusting spurious parsed "years":** the dataset has stray matches like `2044`/`2063` (from PPA durations / URLs). Recommend resolving a source's year as `max(parsed years for that ONE source)` and only counting it as an age signal when it is `<= now`. Future-dated values should be ignored for decay (treat as "no usable year" → `mult=1`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tag derivation from `confidence`/`cf` | A second `startsWith("high")` parser in viz/ui | `provenanceFor` (already centralizes this) | Phase 2 explicitly removed duplicated inline confidence parsing; tests (`viz-provenance-wiring`) assert `confidenceLower` is gone. |
| FK→source resolution | Ad-hoc lookups | `ctx.sourceIndex` (built by `graphForMode`) | Already passed into every tooltip; reuse it. |
| Year extraction | New regex in trust | `parseYearsFromSources` / a sibling `sourceYear` in `js/data` | Keeps the regex in one place and keeps `js/trust` DOM/data-free. |
| Modal a11y (focus trap, ESC, restore focus) | New modal logic | `openModal`/`closeModal`/`trapFocus` in `js/ui` | Help/Compare/Mobile modals already use these; ESC + Tab trapping handled in the global `keydown`. |
| Freshness day-age + status dot | New indicator | Existing `updateStatusIndicator()` | It already computes `daysOld` from `meta.generatedAt` and sets fresh/stale/outdated. Phase 3 mostly **verifies/tests** it, plus reconciles the double-write hazard (see Pitfall 2). |

**Key insight:** Almost all the wiring scaffolding already exists from Phase 2. Phase 3 is "add one pure function + one modal + tests," not "build new infrastructure."

## Runtime State Inventory

> This is a feature phase (new computed score + UI), not a rename/refactor. Included only for the freshness-binding state question.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Confidence score is **computed at render time**, never persisted. No datastore, no cache. | None — pure derivation. |
| Live service config | Freshness binds to `window.SUPPLY_MAP_DATA.meta` injected by `data/top100-map.js` at page load. | None — value read live each `render()`/init. |
| OS-registered state | None. | None. |
| Secrets/env vars | None. | None. |
| Build artifacts | **Two generators write the served `.js` with INCOMPATIBLE shapes** (see Pitfall 1). The committed `data/top100-map.js` currently has a flat `{companies}` shape with NO `meta`/`profiles`. | Planner must confirm the served file the app loads actually has `meta` + `profiles`; freshness binding depends on it. |

**Nothing found** in Stored data / OS-registered / Secrets — verified by code read (score is `Math.round(...)` returned to the tooltip string, never written).

## Common Pitfalls

### Pitfall 1: Two data generators write the served file with DIFFERENT, INCOMPATIBLE shapes
**What goes wrong:** The browser loads `./data/top100-map.js` (`index.html` script tag, verified). Two scripts can produce that file:
- `scripts/generate-top100-data.mjs` writes `{ meta:{generatedAt, lastUpdated, source, count, profileCount}, layers, countries, nodes, links, profiles }` — the **rich, correct** shape the app + tests expect.
- `.github/workflows/auto-update-data.yml` runs `scripts/update-marketcap-data.mjs`, which writes a **flat** shape: `{ last_auto_update, update_source, snapshot_date, top100_source_url, companies:[...] }` — **NO `meta`, NO `profiles`, NO `nodes`/`links`.**

The currently-committed `data/top100-map.js` is in the **flat** shape (`last_auto_update: 2026-06-15...`, `companies:[...]`), while `data/top100-map.json` is in the **rich** shape (`meta.lastUpdated: "Feb 22, 2026, 10:21 PM"`). [VERIFIED: parsed both files this session]
**Why it happens:** the weekly workflow's merge script is a separate, older codepath that never adopted the `meta`/`profiles` schema.
**How to avoid:** Phase 3's freshness indicator binds to `meta.lastUpdated`/`meta.generatedAt`. The planner MUST verify the served `.js` actually carries `meta` (regenerate via `generate-top100-data.mjs` if needed) **and** flag that the weekly workflow as written would overwrite the served file with a `meta`-less shape, silently breaking both freshness AND the whole app (`DATA.profiles` undefined). At minimum, document this; ideally add a test that asserts the served data has `meta.generatedAt` + `meta.lastUpdated` + `profiles`.
**Warning signs:** `DATA.meta` undefined at runtime; `updateStatusIndicator` shows "Unknown"; tooltips throw on `DATA.profiles`.

### Pitfall 2: `#lastUpdated` is written by TWO functions from TWO fields
**What goes wrong:** `js/viz/index.js render()` sets `#lastUpdated` from `DATA.meta.lastUpdated` (the raw display string), while `js/ui updateStatusIndicator()` sets the SAME element from `new Date(meta.generatedAt).toLocaleDateString(...)`. Last writer wins; order depends on `main.js`. [VERIFIED: viz/index.js:410-413, ui/index.js:735-737]
**Why it happens:** Phase 1 extraction left a viz-side footer write; Phase-2/earlier added the status-indicator write.
**How to avoid:** Pick ONE owner (recommend `updateStatusIndicator` in `js/ui`, since it also drives the status dot) and have the freshness indicator bind there. Remove or neutralize the viz-side `#lastUpdated` write to avoid the flicker/last-writer ambiguity. A test should assert exactly one live binding.
**Warning signs:** displayed date format changes depending on render order.

### Pitfall 3: Future-dated / spurious parsed years inflate or break decay
**What goes wrong:** `2044`/`2063` appear in the parsed-year set (PPA durations, URL fragments). If treated as the source's year, `ageYears` goes negative and `Math.pow(0.5, negative)` > 1 → score could exceed `base` (capped at 100, but still wrong semantics).
**How to avoid:** When resolving a single source's year, take `max(years <= nowYear)`; if none qualify, treat as "no usable year" (`mult = 1`). Clamp `ageYears = max(0, now - year)`.
**Warning signs:** suspiciously high confidence on old sources; scores pinned at 100.

### Pitfall 4: An unregistered test silently never runs (GATE LANDMINE)
**What goes wrong:** `npm test` runs ONLY the files explicitly listed in `package.json scripts.test`. A new `tests/confidence-score.test.mjs` that isn't added to that list passes locally with `node --test` but is invisible to the gate. [VERIFIED: package.json + the Phase-2 comment in trust-wiring.test.mjs]
**How to avoid:** Every new `.mjs` test file MUST be appended to `scripts.test`. Add a self-check (an existing-style test can assert the new file is listed).
**Warning signs:** "144 pass" never increases after adding tests.

## Code Examples

### Resolving a single source's usable year (caller side, in viz)
```javascript
// Source: derived from js/data parseYearsFromSources regex (years 1990–2099).
function sourceYear(src, nowYear) {
  const text = `${src?.id || ""} ${src?.title || ""} ${src?.url || ""}`;
  const matches = (text.match(/(19|20)\d{2}/g) || [])
    .map(Number)
    .filter((y) => y >= 1990 && y <= nowYear);   // drop future/spurious years
  return matches.length ? Math.max(...matches) : null;
}
```

### Wiring into the node tooltip (viz `showTooltip`)
```javascript
// Source: js/viz/index.js showTooltip (line ~189) — add next to the existing badge.
const prov = provenanceFor(d, { sourceIndex: STATE.sourceIndex, meta: DATA.meta });
const nowYear = new Date(DATA.meta?.generatedAt || Date.now()).getUTCFullYear();
const src = (d.sourceId ?? d.sf) ? STATE.sourceIndex[d.sourceId ?? d.sf] : null;
const score = confidenceScore(d, {
  sourceIndex: STATE.sourceIndex,
  meta: DATA.meta,
  sourceYear: src ? sourceYear(src, nowYear) : null,
  now: nowYear,
});
// ... in the `.tf` line, append:  ` · Confidence: ${score}%`
```

### Methodology modal entry + open (ui)
```javascript
// Source: mirrors js/ui openModal/toggleHelp (line ~599) + index.html #helpModal.
function openMethodology() { openModal(document.getElementById("methodologyModal"), "flex"); }
// in wireUI(): document.getElementById("bMethodology")?.addEventListener("click", openMethodology);
// ESC handling: add `else if (activeModal === methodologyModalEl) closeModal(methodologyModalEl);`
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline `confidence.includes('source')` heuristics scattered in viz/ui | Centralized `provenanceFor` in `js/trust` | Phase 2 | `confidenceScore` must extend the same core, not re-parse strings. |
| Freshness as a hardcoded date | `updateStatusIndicator` reads `meta.generatedAt` live | Pre-Phase-3 (already present) | TRUST-05 is mostly verification + double-write cleanup, not greenfield. |

**Deprecated/outdated:**
- `scripts/update-marketcap-data.mjs` flat output schema — incompatible with the live app schema; do NOT model freshness on its `last_auto_update`/`snapshot_date` fields (see Pitfall 1). The authoritative timestamp is `meta.lastUpdated`/`meta.generatedAt` produced by `generate-top100-data.mjs`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Recommended base weights (90/65/25), half-life (4 yrs), floor mult (0.5) are defensible defaults | Summary / Pattern 1 | These are explicitly Claude's discretion per CONTEXT; tunable without breaking bounds/monotonicity. Low risk. |
| A2 | The served `data/top100-map.js` that ships at launch will carry the rich `meta`+`profiles` shape (regenerated), not the committed flat shape | Pitfall 1 | HIGH — if the flat shape ships, the whole app (not just freshness) breaks. Planner must verify/regenerate. |
| A3 | CONTEXT's "33 dangling FKs" is a Phase-2-era figure; current whole-dataset dangling FK count is **75** (3,565 FKs total) | §3 known limits | Methodology copy should cite the verified current number, or state "tens of dangling references" to stay honest. |

## Open Questions

1. **Which data file ships at launch, and is the weekly workflow safe?**
   - What we know: app loads `data/top100-map.js`; the rich generator and the weekly updater write incompatible shapes; the committed `.js` is currently the flat shape.
   - What's unclear: whether deployment regenerates via `generate-top100-data.mjs`, and whether the weekly workflow is expected to run against the live file.
   - Recommendation: Planner adds a task to (a) regenerate/verify the served `.js` has `meta`+`profiles`, and (b) either fix or quarantine `update-marketcap-data.mjs` so a weekly run can't strip `meta`. Add a data-shape guard test.

2. **Single owner for `#lastUpdated`.**
   - What we know: viz and ui both write it from different fields.
   - Recommendation: make `updateStatusIndicator` the sole owner; drop the viz write.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | `npm test` (node:test) | ✓ | 20 (CI matrix; workflow pins node 20) | — |
| Browser ESM | runtime | ✓ | static GitHub Pages | — |
| External npm pkgs | none | n/a | — | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `node:test` + `node:assert/strict` (Node 20 builtin) |
| Config file | none — test list lives in `package.json` `scripts.test` |
| Quick run command | `node --test tests/confidence-score.test.mjs` |
| Full suite command | `npm test` (currently 144 pass; runs the explicit file list) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TRUST-03 | score bounded 0–100; high>medium>unknown; decay monotonic in age; unknown→floor; no year ⇒ mult=1 | unit (pure import) | `node --test tests/confidence-score.test.mjs` | ❌ Wave 0 |
| TRUST-03 | viz tooltips call `confidenceScore` and render `Confidence:` | string-presence | `node --test tests/viz-confidence-wiring.test.mjs` | ❌ Wave 0 |
| TRUST-04 | `#methodologyModal` exists in index.html; `js/ui` opens it; mentions sources/weighting/limits | string-presence | `node --test tests/methodology-wiring.test.mjs` | ❌ Wave 0 |
| TRUST-05 | freshness reads `meta.generatedAt`/`meta.lastUpdated` live (NOT a hardcoded date); single owner | string-presence | `node --test tests/freshness-wiring.test.mjs` | ❌ Wave 0 |
| TRUST-05/01 | served data shape guard: `meta.generatedAt` + `meta.lastUpdated` + `profiles` present | data-shape unit | `node --test tests/data-shape.test.mjs` (or fold into above) | ❌ Wave 0 |
| TRUST-06 | provenance regression still green | unit | `node --test tests/provenance.test.mjs` | ✅ |

**Concrete unit assertions for `confidence-score.test.mjs`:**
- `confidenceScore({confidence:"high (company disclosure)", sourceId:"S1"}, {sourceIndex:{S1:{url:"https://x"}}, sourceYear: nowYear, now: nowYear})` → between 80 and 100.
- Same input with `sourceYear = nowYear - 8` → strictly **less** than the `nowYear` case (decay monotonicity), still ≥ floor.
- `confidenceScore({cf:"medium (source-backed)", sf:"S1"}, ...)` < the `high*` case (ordering).
- `confidenceScore({}, {})` (no provenance) → equals the unknown floor (25), never higher.
- Every output `Number.isInteger` and `0 <= score <= 100` across a fuzz of ages `[-5..50]` (also proves future-year guard never exceeds 100).
- No parseable year (`sourceYear:null`) → equals the no-decay base (proves absence ≠ penalty).

### Sampling Rate
- **Per task commit:** `node --test tests/confidence-score.test.mjs`
- **Per wave merge:** `npm test`
- **Phase gate:** full `npm test` green (≥ 144 + new) before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] `tests/confidence-score.test.mjs` — covers TRUST-03 math (bounds, ordering, decay monotonicity, unknown→floor, no-year⇒no-decay)
- [ ] `tests/viz-confidence-wiring.test.mjs` — covers TRUST-03 tooltip wiring (string-presence)
- [ ] `tests/methodology-wiring.test.mjs` — covers TRUST-04 modal presence + open + honest-limits copy
- [ ] `tests/freshness-wiring.test.mjs` — covers TRUST-05 live binding + single owner + no hardcoded date
- [ ] `tests/data-shape.test.mjs` — guards `meta`+`profiles` on the served data (Pitfall 1) — may be merged into freshness test
- [ ] **Register every new file in `package.json scripts.test`** (GATE LANDMINE — see Pitfall 4)

## Security Domain

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation / Output Encoding | yes | Methodology modal renders data-derived counts and (if any) source titles — must use the existing `escapeHtml` (js/data / js/trust) for any interpolated string, exactly as `openProvenance`/`badgeHtml` already do. |
| V6 Cryptography | no | No secrets, no crypto in scope. |
| V2/V3/V4 Auth/Session/Access | no | Public static site, no auth. |

### Known Threat Patterns for buildless ESM + injected data
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Reflected XSS via source title/URL in methodology/tooltip HTML | Tampering | `escapeHtml` on every interpolated field; only emit `<a href>` when url `startsWith("http")` (existing `badgeHtml` rule). |
| Score string injection | Tampering | `confidenceScore` returns an integer; render as `${score}%` (numeric, no user string). |

## Sources

### Primary (HIGH confidence)
- `js/trust/index.js`, `js/data/index.js`, `js/viz/index.js`, `js/ui/index.js`, `js/main.js` — read in full this session.
- `data/top100-map.json` (rich) + `data/top100-map.js` (served thin) — parsed + aggregated this session (vocabulary counts, source years, FK dangling counts, meta shapes).
- `package.json`, `.github/workflows/auto-update-data.yml`, `scripts/update-marketcap-data.mjs`, `scripts/generate-top100-data.mjs`, `index.html` — read this session.
- `tests/provenance.test.mjs`, `tests/trust-wiring.test.mjs`, `tests/viz-provenance-wiring.test.mjs`, `tests/ui-provenance-wiring.test.mjs` — read for conventions.

### Secondary / Tertiary
- None — no external sources needed; all claims verified against the live codebase + dataset.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps; verified against existing test setup.
- Architecture/wiring: HIGH — exact functions/lines identified by reading the modules.
- Data signals (vocabulary, years, FKs, meta fields): HIGH — computed directly from the real files this session.
- Recommended formula constants: MEDIUM — defensible defaults, but explicitly Claude's-discretion tunables (A1).
- Freshness data-file integrity: MEDIUM — the served-file shape discrepancy (A2) is a real launch risk the planner must resolve.

**Research date:** 2026-06-21
**Valid until:** 2026-07-21 (stable in-repo domain; re-verify if the data generators or `data/top100-map.js` schema change).
