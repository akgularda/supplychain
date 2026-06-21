# Phase 2: Provenance & Source Linking - Research

**Researched:** 2026-06-20
**Domain:** Buildless ES-module front-end (D3 + vanilla DOM); data-driven provenance/source-link UI layer
**Confidence:** HIGH (all data shapes verified by parsing the real files this session; render paths verified by reading the actual modules)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Data-driven, real sources only (hard constraint):** Provenance comes ONLY from existing data fields (`confidence`, `provenance`, source refs). Do NOT invent sources or tags. If a figure lacks provenance data, show an explicit "unsourced/unknown" state rather than a fabricated `observed`/`estimated` label.
- **Where badges appear:** Tag the "major figures" — node/company stats (market cap, the top stat bar `$xT cap`, node confidence), tooltip figures, and profile-panel figures. Use a small, consistent badge component (dot/pill + label) next to each figure.
- **Module placement:** Implement in `js/trust/index.js` (Phase 1 placeholder): export `provenanceFor(datum/field)` → `{ tag: 'observed'|'estimated'|'unknown', source?: {label, url} }`, plus `renderProvenanceBadge(el, prov)`. `js/viz` and `js/ui` import these to attach badges to tooltips, the stat bar, and the profile panel.
- **Source link behavior:** Each badge with a source exposes a reachable link (opens the SEC filing / annual report / source URL in a new tab) on hover (tooltip) or click (profile). Links must resolve to a real source value from the data.
- **Tests:** Keep all existing tests green (116). Add new `.mjs` tests asserting: every major-figure render path attaches a provenance tag; the tag value is derived from data (never hardcoded); a sourced figure produces a reachable link; an unsourced figure shows the explicit unknown state (no fabricated label).

### Claude's Discretion
- Internal structure of `js/trust/index.js`; exact mapping function from confidence string → tag; badge markup specifics (subject to the accessibility/CSS constraints below).
- Badge visual styling kept minimal (full design system is Phase 4). Reuse the existing `confidence-high/medium/low` and `source-link` CSS already in `styles/components.css`.

### Deferred Ideas (OUT OF SCOPE)
- Confidence 0–100% scoring + age decay → Phase 3 (TRUST-03).
- Methodology view + freshness indicator → Phase 3 (TRUST-04/05).
- Visual/design-system polish of the badges → Phase 4 (STORY-01).
- Any data-contract change; any fabricated data (Out of Scope, requirements file).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TRUST-01 | Every displayed major figure shows a provenance badge tagging it `observed` or `estimated` | `provenanceFor()` derives the tag from the `confidence`/`cf` string prefix (`high*`→observed, `medium*`→estimated) and `meta.source` for market-cap figures; falls back to `unknown` when no field exists. Render paths enumerated in "Major Figure Render Paths". |
| TRUST-02 | Each figure exposes a reachable inline source link (SEC filing, annual report) on hover or click | Profile nodes/links carry `sourceId`/`sf` FK into `profile.sources[].url`; all 407 sources have non-empty real URLs (sec.gov, vendor IR sites). Market-cap figures link to `meta.source` (companiesmarketcap.com CSV). `provenanceFor()` returns `source:{label,url}` resolved from these. |
</phase_requirements>

## Summary

The repo is a buildless ES-module D3 app. Phase 1 left `js/trust/index.js` as an empty `export {}` stub and split rendering across `js/viz/index.js` (graph, tooltips, stat bar) and `js/ui/index.js` (company card / profile panel, compare grid, provenance drawer). **Provenance data already exists in the rich data file** — the task is to centralize the scattered, partially-correct confidence logic into a single data-driven `trust` module and attach a consistent badge + reachable link to every major figure, with an explicit `unknown` state where data is absent.

**Two data files exist and they are NOT the same shape — this is the single most important pitfall.** The browser loads `data/top100-map.js` (`window.SUPPLY_MAP_DATA`, ~127 KB) which in the committed snapshot contains ONLY `companies[]` + `change_log[]` and **no `nodes`/`links`/`profiles`** (the "data-snapshot lacks nodes/links" carry-forward from Phase 1 — verified again here: `live.nodes === undefined`). The rich graph used by tests lives in `data/top100-map.json` (~1.5 MB) with `meta/layers/countries/nodes(100)/links(186)/profiles(100)`. The Node test suite reads the rich JSON; the production page reads the thin JS. Phase 2 code must read provenance from whatever `window.SUPPLY_MAP_DATA` provides at runtime and degrade gracefully (every figure → `unknown`) when `profiles`/`confidence` are absent, while the new `.mjs` tests assert against the rich JSON (matching the existing test convention).

Provenance is encoded as **strings, not booleans/enums.** Profile nodes carry `confidence` like `"high (company disclosure)"` / `"medium (source-backed)"` and a `sourceId` FK; profile links carry `cf` (same string vocabulary) + `sf` FK + `n` note. Sources are `{id, title, url, note}`. There is **no literal `observed`/`estimated`** token in the data — the badge tag must be *derived*: `high*` → `observed`, `medium*` → `estimated`, missing/empty → `unknown`. Global nodes have NO `confidence`/`sourceId` (only `marketcap`/`rank`/`symbol`); their figures (the `$xT cap` stat bar, per-node market cap) are dataset-level *observed* data sourced from `meta.source`.

**Primary recommendation:** Implement `js/trust/index.js` with a pure `provenanceFor(input, ctx)` that maps the existing `confidence`/`cf` string vocabulary to `{tag, source?}` (resolving `sourceId`/`sf` against the profile's `sources` index), plus `renderProvenanceBadge(el, prov)` that emits an accessible pill reusing the existing `.confidence-*` / `.source-link` CSS. Refactor `viz` (`showTooltip`, `showLinkTooltip`, `updateStats`/stat bar) and `ui` (`updateCompanyCard`, `renderCardInsights`, `showCompare`, `openProvenance`) to call it instead of their current inline, duplicated, partly-buggy confidence logic. Add data-shape `.mjs` tests + a string-presence test that the new module exports the API and is imported by viz/ui.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Confidence→tag derivation (`observed`/`estimated`/`unknown`) | `js/trust` (pure logic) | — | Single source of truth; no DOM, fully unit-testable |
| Source FK resolution (`sourceId`/`sf` → `{label,url}`) | `js/trust` | `js/data` (already builds `sourceIndex` in `graphForMode`) | Trust consumes the index data already assembles |
| Badge DOM rendering | `js/trust` (`renderProvenanceBadge`) | `js/viz`, `js/ui` (call sites) | Keep markup consistent in one helper; callers supply the target element |
| Attaching badges to tooltips/nodes | `js/viz` | `js/trust` | viz owns `#tt` and node render |
| Attaching badges to profile panel / stat bar / compare grid | `js/ui` (panel/compare) + `js/viz` (stat bar) | `js/trust` | ui owns the card/compare DOM; viz owns `updateStats` |
| Source link open-in-new-tab | `js/trust` markup (`<a target="_blank" rel="noopener">`) | call sites | Reachable link is a property of the badge, not the caller |

## Real Provenance Data Shape (verified by parsing the files)

> All figures below were produced by parsing `data/top100-map.json` and `data/top100-map.js` this session, not from training data. `[VERIFIED: parsed data/top100-map.json this session]`.

### Two data files (CRITICAL)
| File | Loaded by | Top-level keys | Has provenance? |
|------|-----------|----------------|------------------|
| `data/top100-map.js` (127 KB) | **the browser** (`<script src>` → `window.SUPPLY_MAP_DATA`) | `last_auto_update, update_source, snapshot_date, top100_source_url, update_policy, companies, change_log` | **NO `nodes/links/profiles`** in committed snapshot. `companies[].profile` is plain string lists (upstream/services/channels/demand) with NO confidence/source. `update_source: "companiesmarketcap.com"`, `top100_source_url: "https://companiesmarketcap.com/?download=csv"`. |
| `data/top100-map.json` (1.5 MB) | **the test suite** (`fs.readFileSync`) | `meta, layers, countries, nodes(100), links(186), profiles(100)` | **YES** — full provenance, detailed below. `meta.source: "https://companiesmarketcap.com/?download=csv"`. |

### Profile node provenance (`profiles[SYM].nodes[]`)
- Keys: `id, l, tier, kind, c, d, s, z, sourceId, confidence`
- `confidence` is a **string with an embedded qualifier**. Distribution across 1,684 profile nodes:
  - `"high (company disclosure)"` ×99, `"high (company-specific)"` ×2, `"high (filing disclosure)"` ×2, `"high (named partner disclosure)"` ×1, `"high (SEC filing)"` ×1, `"high (company announcement)"` ×2, `"high (business model)"` ×1
  - `"medium (source-backed)"` ×1,574, `"medium (filing, no carrier names)"` ×1
  - **1 node with no `confidence`**, **2 nodes with no `sourceId`** → must hit the `unknown` path.
- `sourceId` present on 1,682 / 1,684 nodes; **1,649 resolve to a source in the same profile, 33 are DANGLING** (FK points to an id not in `profile.sources`) → must hit the `unknown`/`unsourced` path even though a `sourceId` string exists.
- `kind` ∈ {company×100, supplier×484, service×398, channel×403, demand×298, risk×1}.

### Profile link provenance (`profiles[SYM].links[]`)
- Keys: `s, t, v, k, cf, sf, n`
- `cf` uses the **same string vocabulary** as node `confidence` (1,871 `medium (source-backed)`, plus the `high (...)` variants). `sf` is the source FK; present on 1,883 / 1,884 links (1 empty).
- `n` is a human note ("Source-backed supplier dependency for NVDA.").

### Sources (`profiles[SYM].sources[]`)
- Shape: **`{ id, title, url, note }`** — verified across all 407 sources: 407 have `title`, 407 have `url`, **ZERO have a `t` key**.
- **All 407 URLs are non-empty and reachable-looking.** Top hosts: `www.sec.gov` (48), `data.sec.gov` (10), `www.swift.com` (7), `news.skhynix.com` (6), `www.asml.com` (6), `www.roche.com` (6), `www.novartis.com` (6), `investors.micron.com` (5). These are real SEC filings + vendor investor-relations pages.
- 0 / 100 profiles have zero sources (every profile has ≥1 source).

### Global nodes / links (`nodes[]`, `links[]` in the rich JSON)
- Global node keys: `id, l, y, c, d, s, bn, z, rank, marketcap, symbol, company, country`. **No `confidence`, no `sourceId`.** (verified: `nodes.some(n=>n.confidence) === false`).
- Global links: `s, t, v, k, cf, sf, n` — `cf` is `"medium (structural)"` on all 186 and **`sf` is EMPTY (`""`)** → estimated + unsourced.
- The `$xT cap` stat bar sums `n.marketcap` over global nodes (`updateStats`, `viz/index.js:71`); total = 55,770,917,690,549 ≈ `$55.8T`. Per-figure source for all market-cap figures is **dataset-level**: `meta.source` / `top100_source_url` = companiesmarketcap.com CSV → tag `observed` (market data), link = that URL.

### What `provenanceFor()` can return WITHOUT fabricating
| Input | tag | source |
|-------|-----|--------|
| profile node/link with `confidence`/`cf` starting `high` AND `sourceId`/`sf` resolving in `sources` | `observed` | `{label: source.title, url: source.url}` |
| profile node/link with `medium*` AND resolving FK | `estimated` | `{label: source.title, url: source.url}` |
| FK missing, empty, or DANGLING (33 nodes, global links) | tag from string if present else `unknown`; **no source** | omitted |
| no `confidence`/`cf` at all (global nodes, 1 profile node) | `unknown` | omitted |
| market-cap figures (stat bar, node `marketcap`) | `observed` | `{label: "companiesmarketcap.com", url: meta.source ?? top100_source_url}` |

## Standard Stack

This phase adds **NO packages** (buildless constraint; `package.json` has only `playwright` dep + `http-server` devDep). All work is in-repo ES modules + Node's built-in test runner.

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Native ES modules | — | `js/trust/index.js` exports, imported by viz/ui | Phase-1 established pattern; no bundler |
| `node:test` + `node:assert/strict` | Node v24.11.0 | new `.mjs` tests | Exactly what all existing tests use |
| Existing CSS classes | — | `.confidence-high/medium/low`, `#tt .source-link` (`styles/components.css:49-54`) | Reuse — visual polish is Phase 4 |

**Installation:** None. `npm install` already satisfied.

## Package Legitimacy Audit

No external packages are installed in this phase (hard buildless constraint). slopcheck/registry verification **N/A** — nothing to audit.

## Major Figure Render Paths (exact functions / lines to instrument)

> Every place a number/figure is shown to the user. File-and-line specific.

### `js/viz/index.js`
| Render path | Location | Figure(s) | Provenance input |
|-------------|----------|-----------|------------------|
| `updateStats()` | L68-80 (sets `sN/sL/sC/sY/sM`) | stat bar: `$xT cap` (`sM`, L79), node/link/country/layer counts | `$cap` → `meta.source` (observed). Counts are derived aggregates → `unknown` or omit (counts have no per-source). |
| `showTooltip(d, ev)` | L170-237 | node confidence badge (already builds `confidence-*` badge L181/197), value (`marketcap`), "View Source" link (L228-232) | `d.confidence` (string), `d.sourceId` → `STATE.sourceIndex[d.sourceId].url` |
| `showLinkTooltip(d, ev)` | L246-296 | relationship confidence badge (L257/262), "View Source" (L287-291) | `d.cf`, `d.sf` → `STATE.sourceIndex[d.sf].url` |
| node circle class | L497 `.classed("verified-node", d.confidence && d.confidence.includes("source"))` | visual verified marker | same string check (centralize) |

### `js/ui/index.js`
| Render path | Location | Figure(s) | Provenance input |
|-------------|----------|-----------|------------------|
| `updateCompanyCard()` | L258-325; supplier/service/channel counts L293-295 | profile-panel counts; company name; market cap (via card) | profile node counts → aggregate; company anchor node has `confidence`/`sourceId` |
| `renderCardInsights()` | L405-458; `Source-backed ratio` L430; timeline L448-457 | risk %, source-backed ratio, dated-source timeline | `computeProfileRisk` uses `n.confidence.includes("source")`; timeline from `parseYearsFromSources` |
| `showCompare()` | L535-562; `Verified Entities` L547/555 | compare-grid per-company stats incl. "Verified Entities" count | `p.nodes.filter(n=>n.confidence && n.confidence.includes('source'))` |
| `openProvenance()` | L123-135 | the existing source drawer — lists `profile.sources` | reads `src.t` (BUG: key is `title`) and `src.url` |
| `applyFilters()` | L474-496 | confidence/verified filter logic (string-match) | duplicates the confidence-string parsing — centralize via trust |

## Trust Module API Design

```js
// js/trust/index.js  (replaces `export {}`)
// PURE: no DOM access in provenanceFor — unit-testable in Node.

/**
 * Derive provenance from an existing data record. NEVER fabricates.
 * @param {object} input  a node ({confidence, sourceId}) or link ({cf, sf}) or
 *                        {marketcap:true} marker for market-cap figures.
 * @param {object} ctx    { sourceIndex?: {[id]: {title,url,...}}, meta?: {source} }
 * @returns {{tag:'observed'|'estimated'|'unknown', source?:{label:string,url:string}}}
 */
export function provenanceFor(input, ctx = {}) {
  // 1. market-cap figures -> dataset-level observed
  if (input && input.marketcap === true) {
    const url = ctx.meta?.source || ctx.meta?.top100_source_url;
    return url ? { tag: 'observed', source: { label: 'companiesmarketcap.com', url } }
               : { tag: 'unknown' };
  }
  // 2. confidence string (node.confidence or link.cf)
  const raw = String(input?.confidence ?? input?.cf ?? '').toLowerCase();
  let tag = 'unknown';
  if (raw.startsWith('high')) tag = 'observed';
  else if (raw.startsWith('medium')) tag = 'estimated';
  // (note: 'medium (structural)' global links -> estimated, correct)
  // 3. resolve source FK (node.sourceId or link.sf) against the profile index
  const fk = input?.sourceId ?? input?.sf;
  const src = fk && ctx.sourceIndex ? ctx.sourceIndex[fk] : null; // dangling FK -> null
  if (src && src.url) return { tag, source: { label: src.title || src.id || 'Source', url: src.url } };
  return { tag }; // unsourced: tag may still be observed/estimated, but NO source link
}

/**
 * Render an accessible badge (pill + optional source link) into `el`.
 * Reuses existing .confidence-* and .source-link CSS (Phase 4 will restyle).
 */
export function renderProvenanceBadge(el, prov) {
  if (!el) return;
  const label = prov.tag === 'observed' ? 'Observed'
              : prov.tag === 'estimated' ? 'Estimated' : 'Unknown';
  const cls = prov.tag === 'observed' ? 'confidence-high'
            : prov.tag === 'estimated' ? 'confidence-medium' : 'confidence-low';
  const title = prov.tag === 'unknown'
    ? 'No source recorded for this figure'
    : `${label} — ${prov.source ? prov.source.label : 'no source link'}`;
  const link = prov.source
    ? `<a href="${prov.source.url}" target="_blank" rel="noopener noreferrer" class="source-link">source ↗</a>`
    : '';
  el.innerHTML =
    `<span class="prov-badge confidence-badge ${cls}" role="img" `
    + `aria-label="Provenance: ${label}${prov.source ? ', source available' : ', no source'}" `
    + `title="${title}">${label}</span>${link}`;
}
```

**Import pattern (matches Phase-1 style):**
```js
// in js/viz/index.js and js/ui/index.js
import { provenanceFor, renderProvenanceBadge } from "../trust/index.js";
```
- `js/data/index.js graphForMode()` already builds `sourceIndex: Object.fromEntries((p.sources||[]).map(s=>[s.id,s]))` (L153) and stores it on `STATE.sourceIndex` (viz `render` L395). Pass `{sourceIndex: STATE.sourceIndex, meta: DATA.meta}` as `ctx`.

## Source Link Reachability

- Sourced profile figures: FK (`sourceId`/`sf`) → `STATE.sourceIndex[fk]` → `.url` (real SEC/IR URL, all 407 non-empty). Open in new tab via `<a target="_blank" rel="noopener noreferrer">` (already the convention in `showTooltip` L230 and `openProvenance` L131).
- Market-cap figures: link to `DATA.meta.source` (rich) / `window.SUPPLY_MAP_DATA.top100_source_url` (live) = companiesmarketcap CSV.
- **Unsourced / dangling-FK / unknown:** render the badge with NO `<a>` and an explicit `Unknown`/`title="No source recorded"` state. Never synthesize a URL. This is the locked hard constraint.

## Accessibility (minimal, design system is Phase 4)
- Badge is a `<span role="img" aria-label="Provenance: Observed, source available">` so the tag is announced even though color encodes it. `title` provides hover text. The source `<a>` is keyboard-focusable and has `rel="noopener noreferrer"`.
- Pattern matches the existing `aria-label` convention used on every control in `index.html` (e.g. L120-129) and asserted by `macro-site-accessibility.test.mjs`.
- Do NOT introduce new colors/tokens — reuse `.confidence-high/medium/low`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Confidence string → level | A new ad-hoc parser in each render fn | `provenanceFor()` once | viz/ui currently duplicate this 4× with subtly different rules (`.includes('high'||'company')` vs `.startsWith`); centralizing fixes drift |
| Source-FK resolution | Re-deriving an index per call | `STATE.sourceIndex` (data already builds it) + null-check for dangling | 33 dangling FKs will throw on `.url` if unchecked |
| New-tab link | Custom window.open handler | `<a target="_blank" rel="noopener noreferrer">` | already the repo convention; safer |
| Badge markup | Bespoke per call site | `renderProvenanceBadge()` | consistency + single test surface |

**Key insight:** Phase 2 is largely a *consolidation + correctness* task, not net-new behavior. The inline confidence/source code already exists in `showTooltip`/`showLinkTooltip`/`openProvenance`; the value is making it (a) data-derived and uniform, (b) extended to the stat bar + profile counts + compare grid, and (c) correct on the `unknown`/dangling/`title`-vs-`t` edges.

## Runtime State Inventory

Not a rename/refactor/migration phase in the data sense (data contract is frozen, no stored-state renames). **None — verified:** no databases, no OS-registered state, no secrets, no env vars are touched. The only "stored" concern is `localStorage` (`savedViews`, `searchHistory`, `onboardingSeen`) which provenance does not modify. Build artifacts: none (buildless).

## Common Pitfalls

### Pitfall 1: Coding against the wrong data file
**What goes wrong:** Writing `provenanceFor` assuming `window.SUPPLY_MAP_DATA.profiles`/`nodes` exist; works in tests (which read the rich JSON) but every figure shows blank/throws in the browser (live JS has only `companies`).
**Why:** `data/top100-map.js` (loaded) ≠ `data/top100-map.json` (tested). Verified this session: `live.nodes === undefined`. Phase-1 carry-forward.
**How to avoid:** `provenanceFor` must treat missing `confidence`/`sourceId`/`meta` as `unknown` (graceful degradation), never assume presence. Tests read `top100-map.json`; do not assert the live JS has profiles.
**Warning signs:** `Cannot read properties of undefined (reading 'url')`.

### Pitfall 2: The `t` vs `title` source-key bug (latent, in scope to not propagate)
**What goes wrong:** `ui/index.js openProvenance` (L130) and `data/index.js parseYearsFromSources` (L69) read `source.t` / `src.t`, but the real key is `title` (0/407 sources have `t`). The drawer currently falls back to `src.id`, and the timeline misses title-year matches.
**How to avoid:** `provenanceFor` and `renderProvenanceBadge` must read `source.title` (with `id` fallback). Optionally fix `openProvenance` to use `src.title` while wiring it through trust — but verify it doesn't change a test assertion first.
**Warning signs:** drawer shows source IDs instead of human titles.

### Pitfall 3: Dangling source FKs (33 nodes) and empty `sf`
**What goes wrong:** `STATE.sourceIndex[d.sourceId].url` throws when the FK doesn't resolve (33 profile nodes) or `sf===""` (global links, 1 profile link).
**How to avoid:** Null-check `const src = idx[fk]; if (src && src.url) …` → else `unknown`/no link. (The existing `showTooltip` L228 already guards with `STATE.sourceIndex[d.sourceId]` truthiness — preserve that.)

### Pitfall 4: No literal `observed`/`estimated` in data
**What goes wrong:** Searching for a `provenance` or `observed` field finds nothing and a dev hardcodes the badge.
**How to avoid:** The CONTEXT claims `observed`/`estimated` "already present" — that is the *confidence string prefix* (`high*`/`medium*`), NOT a separate field. Derive, document the mapping, and tag the mapping `observed`=`high*`, `estimated`=`medium*`.

### Pitfall 5: Breaking the inline-bootstrap regex test
**What goes wrong:** `index-ui-integrity.test.mjs` matches `/<script>([\s\S]*?)<\/script>\s*<\/body>/i` and `node --check`s the inline block. Editing `index.html`'s tail script can break it.
**How to avoid:** Phase 2 should need NO `index.html` change (badges are injected by JS at runtime into existing containers `#tt`, the `#bar` stat spans, the card). If a CSS class is added, put it in `styles/components.css`, not inline.

## Code Examples (verified patterns from the repo)

### Existing confidence-badge markup to reuse (viz/index.js:181,197)
```js
// Source: js/viz/index.js showTooltip
const confidenceClass = `confidence-${confidenceLevel}`; // confidence-high|medium|low
`<span class="confidence-badge ${confidenceClass}">${confidenceLabel} Confidence</span>`
```

### Existing source-index build (data/index.js:153) — reuse as ctx
```js
// Source: js/data/index.js graphForMode (profile branch)
sourceIndex: Object.fromEntries((p.sources || []).map((s) => [s.id, s])),
```

### Existing reachable-link pattern (viz/index.js:230)
```js
// Source: js/viz/index.js showTooltip
`<a href="${STATE.sourceIndex[d.sourceId].url}" target="_blank" rel="noopener" class="source-link">View Source →</a>`
```

## State of the Art

| Old (in repo now) | Current (Phase 2 target) | Impact |
|-------------------|--------------------------|--------|
| Confidence logic duplicated/inconsistent across 4 functions | Single `provenanceFor()` | Removes drift; one test surface |
| Tooltip shows "High/Medium Confidence", no explicit unknown | `observed`/`estimated`/`unknown` badge on every major figure | Satisfies TRUST-01 incl. the explicit unsourced state |
| Stat bar / profile counts / compare grid have NO provenance | Badged | Closes the gap CONTEXT requires |
| `openProvenance` reads non-existent `src.t` | reads `title` | Drawer shows real source titles |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Market-cap figures should tag `observed` (market data is directly reported, not estimated) | provenanceFor / TRUST-01 | LOW — could be argued `estimated`; mapping is a 1-line change. Surface to planner/discuss for confirmation. |
| A2 | `high*` → `observed`, `medium*` → `estimated`, missing → `unknown` is the intended mapping (no explicit field exists) | provenanceFor | MEDIUM — this is the core semantic decision; verify with user. Data has no `low*` values, so a 2-bucket+unknown scheme covers all observed strings. |
| A3 | The browser at runtime may still load the thin `top100-map.js` (no profiles); badges degrade to `unknown` there | Pitfall 1 | LOW — verified the snapshot shape; the real production deploy may swap in a richer JS. Graceful-degradation design is safe either way. |

## Open Questions

1. **Should counts (nodes/links/countries/layers in the stat bar) get a badge, or only money figures?**
   - Known: these are derived aggregates with no per-source field.
   - Recommendation: tag them `unknown`/omit (they are computed, not sourced). Only `$cap` + per-node `marketcap` get `observed`. Confirm scope of "major figure" with planner.
2. **Fix the `t`→`title` bug in `openProvenance`/`parseYearsFromSources` here, or leave for Phase 3?**
   - Recommendation: fix `openProvenance` (it's a provenance display path, directly in scope) but re-run the 116 first to confirm no test pins the buggy behavior. Leave `parseYearsFromSources` (timeline) to Phase 3 unless trivially co-located.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | test runner + `provenanceFor` unit tests | ✓ | v24.11.0 | — |
| `node:test`/`node:assert` | new `.mjs` tests | ✓ (built-in) | — | — |
| jsdom / DOM | DOM-level badge tests | ✗ | — | **String-presence tests** (the existing convention — `index-ui-integrity` reads HTML/JS as strings; no DOM tests exist) |
| Playwright | runtime smoke (optional, Phase-1 used it) | ✓ (dep) | — | string tests suffice for the gate |

**No blocking gaps.** DOM rendering of badges is verified by (a) unit-testing the pure `provenanceFor` + `renderProvenanceBadge` HTML output as a string, and (b) string-asserting that viz/ui import and call the trust API. A full DOM render check would need Playwright (optional, not in the `npm test` gate).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `node:test` + `node:assert/strict` (Node v24.11.0), `.mjs` files |
| Config file | none — `package.json` `scripts.test` lists 5 explicit files |
| Quick run command | `npm test` |
| Full suite command | `npm test` (runs all 5 listed files; currently 116 pass / 0 fail) |

**IMPORTANT:** `npm test` only runs the **5 explicitly-listed files** (`index-ui-integrity`, `no-xx-country-codes`, `profile-link-metadata`, `supply-chain-research-quality`, `auto-update-script`). A new test file is NOT picked up unless it is **added to the `scripts.test` list in `package.json`** (or the script is changed to `node --test tests/`). The planner MUST include "register the new test file in package.json `scripts.test`" as an explicit task, or the new tests silently never run and "116 green" is meaningless.

### Phase Requirements → Test Map
| Req | Behavior | Test type | Automated command | File exists? |
|-----|----------|-----------|-------------------|--------------|
| TRUST-01 | `provenanceFor` returns `observed` for `high*`, `estimated` for `medium*`, `unknown` for missing — derived, not hardcoded | unit (pure) | `node --test tests/provenance.test.mjs` | ❌ Wave 0 |
| TRUST-01 | every profile node/link in `top100-map.json` maps to a non-throwing `{tag}` (covers the 33 dangling FK + 1 missing-confidence rows) | data-driven | same | ❌ Wave 0 |
| TRUST-02 | a sourced figure → `source.url` is a real non-empty URL from `profile.sources`; unsourced → no `source` key | unit + data | same | ❌ Wave 0 |
| TRUST-02 | `renderProvenanceBadge` emits `target="_blank" rel="noopener"` `<a>` only when `source` present; emits `aria-label` always | unit (string of returned HTML) | same | ❌ Wave 0 |
| TRUST-01 | viz/ui actually import & call `provenanceFor`/`renderProvenanceBadge` at the enumerated render paths | string-presence | `node --test tests/trust-wiring.test.mjs` | ❌ Wave 0 |
| (regression) | existing 116 stay green | all | `npm test` | ✅ |

### Sampling Rate
- **Per task commit:** `npm test` (fast, ~0.4 s).
- **Per wave merge:** `npm test` (full — it is the full suite).
- **Phase gate:** `npm test` 116 + new tests all green before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] `tests/provenance.test.mjs` — unit tests for `provenanceFor` (tag mapping, dangling FK, market-cap, unknown) + data-driven sweep over `top100-map.json`. Covers TRUST-01/02.
- [ ] `tests/trust-wiring.test.mjs` — string-asserts `js/viz/index.js` & `js/ui/index.js` import from `../trust/index.js` and reference `provenanceFor`/`renderProvenanceBadge`; asserts `js/trust/index.js` exports both.
- [ ] **package.json:** add the two new files to `scripts.test` (REQUIRED or they never run).
- [ ] No framework install needed; no `conftest`/fixtures (pure Node).
- Importing `js/trust/index.js` in a Node test: it is DOM-free for `provenanceFor` (safe to import). `renderProvenanceBadge` touches `el.innerHTML` — test it by passing a tiny stub `{innerHTML:''}` object (no jsdom needed) and asserting the resulting string, OR keep badge HTML generation in a separate pure `badgeHtml(prov)` helper that `renderProvenanceBadge` calls (recommended — fully unit-testable without any DOM).

## Security Domain

`security_enforcement` not found in `.planning/config.json` scope here; this is a public, read-only static site with no auth/PII/backend (Out-of-Scope list confirms). Minimal applicable control:

| ASVS | Applies | Control |
|------|---------|---------|
| V5 Input Validation / Output Encoding | yes | Source URLs come from the trusted committed data file, but the badge injects `source.url`/`title` via `innerHTML`. Use the existing `escapeHtml` (`data/index.js:9`) on `title` and validate `url` starts with `http` before emitting the `<a>`, to keep the no-XSS posture even though data is first-party. `rel="noopener noreferrer"` on every new-tab link (reverse-tabnabbing). |
| V6 Cryptography | no | none |

## Sources

### Primary (HIGH confidence)
- Parsed `data/top100-map.json` and `data/top100-map.js` this session — all field shapes, distributions, FK integrity, URL hosts `[VERIFIED]`.
- Read `js/trust/index.js`, `js/data/index.js`, `js/viz/index.js`, `js/ui/index.js`, `index.html`, `styles/components.css`, all referenced test files `[VERIFIED]`.
- `npm test` run this session → 116 pass / 0 fail; `package.json scripts.test` enumerates 5 files `[VERIFIED]`.
- `02-CONTEXT.md`, `REQUIREMENTS.md`, `01-02-SUMMARY.md` `[CITED]`.

### Secondary / Tertiary
- None — no external sources needed; phase is fully in-repo.

## Metadata

**Confidence breakdown:**
- Data shape: HIGH — parsed the actual files, counted every field.
- Render paths: HIGH — read the actual module source, line-referenced.
- Test approach: HIGH — confirmed runner, count, and the no-DOM string-test convention by reading + running.
- Tag-mapping semantics (observed/estimated): MEDIUM — derivation rule is the one defensible reading; flagged in Assumptions A1/A2 for user confirmation.

**Research date:** 2026-06-20
**Valid until:** 2026-07-20 (stable; in-repo, no fast-moving deps)
