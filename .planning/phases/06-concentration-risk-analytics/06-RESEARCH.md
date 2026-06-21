# Phase 6: Concentration & Risk Analytics - Research

**Researched:** 2026-06-21
**Domain:** Supply-chain network analytics (concentration / Herfindahl, fan-in criticality) over a frozen buildless ESM dataset, with honest derived-provenance display
**Confidence:** HIGH (all numbers below computed directly from `data/top100-map.json` in this session)

## Summary

This phase computes two real, defensible analytics from the existing graph and displays them with honest "derived" provenance. The data was inspected directly: `data/top100-map.json` has 100 profiles, each with 3–5 distinct suppliers (median 5), 458 distinct supplier labels total, and **no per-supplier volume/share field** — every `supplier-input` link weight `l.v` is the constant `2`. That single fact drives the whole design: a raw Herfindahl (HHI) over a company's suppliers degenerates to `1/k` under the forced equal-weight assumption, which is uninformative on its own (all 5-supplier companies tie at 0.20). The honest, interpretable metric is therefore a **composite**: `0.6·HHI(equal-weight) + 0.4·sharedFrac`, where `sharedFrac` is the fraction of a company's suppliers that are shared single-points (fan-in > 1 in `supplierToSymbols`). This is bounded [0,100], monotonic in both axes, uses only real graph structure, and explicitly states the equal-weight assumption rather than fabricating volumes.

Criticality (single points of failure) is the supplier **fan-in** — the count of companies depending on a supplier — computed exactly from the existing `buildSharedSupplierOverlapIndex` machinery (`supplierToSymbols`). The real distribution is sparse: 458 distinct suppliers, only **19 serve more than one company**, max fan-in is **4** ("credit and risk data inputs"), with TSMC, several pharma fill-finish/API inputs, and China UnionPay tied at 3. Critically, the existing `d.bn` flag is **NOT** derivable from fan-in — it is a curated editorial flag on 19 global *company* nodes with non-contiguous ranks (1–12, 16, 20, 21, 23, 32, 34, 35), independent of supplier criticality. The recommendation is to keep `d.bn` as-is and surface a *separate*, quantified "Critical chokepoints" ranking keyed on raw fan-in count.

**Primary recommendation:** Add a pure DOM-free `js/analytics/index.js` module exporting `companyConcentration(symbol)`, `sectorConcentration(sector)`, and `supplierCriticality()`; tag every displayed analytic via a new `provenanceFor({derived:true})` branch returning `tag:"derived"` + a "computed from N relationships" note linking to Methodology; wire into the profile panel (js/ui ~line 458) + a new chokepoints panel + `highlightBy` for graph highlight; register two new `.test.mjs` files. Keep all 214 existing tests green.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Concentration math (HHI, sharedFrac) | Pure logic module (`js/analytics`) | — | DOM-free, deterministic, unit-testable in Node like `js/trust` |
| Criticality / fan-in ranking | Pure logic module (`js/analytics`) | `js/data` (reuses `supplierToSymbols`) | Already derivable from existing overlap index; keep math pure |
| Derived provenance tagging | `js/trust` | — | Trust vocabulary lives here (`provenanceFor`/`badgeHtml`); extend, don't fork |
| Profile-panel display | `js/ui` (browser/DOM) | `js/analytics` (imports) | UI owns DOM; imports pure analytics |
| Sector + chokepoints panel | `js/ui` (browser/DOM) | `js/analytics` | New panel, same pattern as existing cards |
| Graph chokepoint highlight | `js/viz` (`highlightBy`) | `js/analytics` | viz owns the D3 selection; analytics supplies the predicate set |
| Methodology copy (formulas) | `index.html` static | `js/ui` (modal wiring exists) | Static dialog body; wiring already present |

## Standard Stack

No new runtime dependencies. This is a pure-JS analytics phase over a frozen dataset; the "stack" is the existing toolchain.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:test` | bundled (Node ≥ 18) | Unit + wiring tests | Repo convention — all 24 test files use it [VERIFIED: tests/*.test.mjs] |
| `node:assert/strict` | bundled | Assertions | Repo convention [VERIFIED: tests/provenance.test.mjs:2] |
| D3 (already loaded) | site-loaded global | Graph highlight reuse via `highlightBy` | Existing viz dependency [VERIFIED: js/viz/index.js:385] |

### Supporting
None. No npm install. `package.json` declares `playwright` + `http-server` only; neither is needed for the new pure tests.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Composite (HHI + sharedFrac) | Pure HHI `1/k` | Degenerate — all 5-supplier firms tie at 0.20; no per-supplier weight exists to differentiate [VERIFIED: all `l.v`=2] |
| Composite | Top-supplier share | Also degenerate under equal weight (top share = 1/k = HHI here) |
| Raw fan-in count for criticality | Normalized `fanIn/maxFanIn·100` | Normalization is fine for a bar, but the honest primary ranking key is the raw integer count (4, 3, 3, …) — show the real number |

**Installation:**
```bash
# none — no new packages
```

**Version verification:** No registry packages added. Node built-in test runner already in use across all 24 suites [VERIFIED: package.json scripts.test lists 18 of 24 files].

## Package Legitimacy Audit

No external packages are installed by this phase. Package Legitimacy Gate is **N/A** — all code uses Node built-ins (`node:test`, `node:assert`, `node:fs`) and existing project modules. Nothing to slopcheck.

## Architecture Patterns

### System Architecture Diagram

```
data/top100-map.json (frozen)
        │  profiles[].nodes (kind==='supplier', l, c, tier, sourceId, confidence)
        │  nodes[] (global, y=sector layer, bn flag, rank, symbol)
        │  layers{} (y -> sector name)
        ▼
js/data/index.js
  buildSharedSupplierOverlapIndex() ──► supplierToSymbols (Map: supplier -> Set<symbol>)   [FAN-IN BASIS]
        │                                       │
        ▼                                       ▼
js/analytics/index.js  (NEW, pure)      js/analytics/index.js
  companyConcentration(symbol)          supplierCriticality()
   = 0.6·(1/k) + 0.4·sharedFrac           = [{supplier, fanIn}] sorted desc
  sectorConcentration(sector)
   = effective-suppliers + reuse%
        │                                       │
        ▼                                       ▼
js/trust/index.js: provenanceFor({derived:true, n}) ──► {tag:'derived', note:'computed from N relationships'}
        │                                       │
        ▼                                       ▼
js/ui/index.js (profile panel ~L458)    js/ui (NEW chokepoints/sector panel)
  "Supplier concentration: NN/100"        "Critical chokepoints" list (counts)
   + derived badge + Methodology link             │
                                                  ▼
                                        js/viz highlightBy(d => chokepointIds.has(d.id))
                                                  │
                                                  ▼
                                        index.html Methodology modal (NEW formula copy)
```

### Recommended Project Structure
```
js/
├── analytics/
│   └── index.js        # NEW: pure companyConcentration / sectorConcentration / supplierCriticality
├── data/index.js       # unchanged (source of supplierToSymbols + profiles)
├── trust/index.js      # EXTEND: provenanceFor derived branch + badgeHtml derived label
├── ui/index.js         # EXTEND: profile card + new chokepoints/sector panel
└── viz/index.js        # EXTEND: chokepoint highlight predicate (reuse highlightBy)
tests/
├── concentration.test.mjs   # NEW: bounds + monotonicity + sector
└── criticality-wiring.test.mjs  # NEW: ranking + derived provenance + ui/html string wiring
```

### Pattern 1: Pure analytics module mirroring js/trust
**What:** A DOM-free, `window`-free ESM module exporting pure functions, importable under `node:test`.
**When to use:** All concentration/criticality math.
**Example:**
```javascript
// js/analytics/index.js — pure, no DOM, no window (mirrors js/trust/index.js shape)
import { SHARED_SUPPLIER_OVERLAP, DATA, normalizeEntityLabel } from "../data/index.js";

// Build fan-in once (mirror of buildSharedSupplierOverlapIndex internals).
// Source: js/data/index.js:27-60 supplierToSymbols logic.
export function buildSupplierFanIn(profiles = DATA.profiles) {
  const fanIn = new Map();
  Object.entries(profiles).forEach(([symbol, p]) => {
    const suppliers = new Set(
      (p.nodes || [])
        .filter((n) => n.kind === "supplier")
        .map((n) => normalizeEntityLabel((n.l || "").split("\n")[0]))
        .filter(Boolean)
    );
    for (const s of suppliers) {
      if (!fanIn.has(s)) fanIn.set(s, new Set());
      fanIn.get(s).add(symbol);
    }
  });
  return fanIn; // Map<supplierLabel, Set<symbol>>
}

// Bounded [0,100] composite concentration. Equal-weight assumption stated explicitly.
export function companyConcentration(symbol, opts = {}) {
  const { wHHI = 0.6, wShared = 0.4, profiles = DATA.profiles, fanIn = buildSupplierFanIn(profiles) } = opts;
  const p = profiles[symbol];
  if (!p) return null;
  const uniq = [...new Set(
    (p.nodes || [])
      .filter((n) => n.kind === "supplier")
      .map((n) => normalizeEntityLabel((n.l || "").split("\n")[0]))
      .filter(Boolean)
  )];
  const k = uniq.length;
  const hhi = k ? 1 / k : 1;                       // equal-weight Herfindahl (no per-supplier volume in data)
  const sharedCount = uniq.filter((s) => (fanIn.get(s)?.size || 0) > 1).length;
  const sharedFrac = k ? sharedCount / k : 0;
  const score = Math.max(0, Math.min(100, Math.round(100 * (wHHI * hhi + wShared * sharedFrac))));
  return { symbol, suppliers: k, hhi, sharedCount, sharedFrac, score, n: k }; // n = #relationships used
}
```

### Pattern 2: Derived provenance via existing trust vocabulary
**What:** Extend `provenanceFor` with a `derived` branch; do not invent a parallel system.
**Example:**
```javascript
// js/trust/index.js — add as branch 0 of provenanceFor, before the marketcap check.
// Source: js/trust/index.js:23-46 (existing provenanceFor).
if (input && input.derived === true) {
  const n = Number.isFinite(input.n) ? input.n : 0;
  return {
    tag: "derived",
    note: `computed from ${n} relationship${n === 1 ? "" : "s"}`,
    source: ctx.methodologyUrl ? { label: "Methodology", url: ctx.methodologyUrl } : undefined,
  };
}
```
And in `badgeHtml` (js/trust/index.js:87): add `tag === "derived" ? "Derived" : …` label and a `confidence-derived` / reuse `confidence-medium` class. **Do not** present derived as observed.

### Anti-Patterns to Avoid
- **Fabricating supplier volumes** to make HHI vary. There is no volume field; all `l.v`=2. State the equal-weight assumption instead. [VERIFIED]
- **Treating `d.bn` as a chokepoint metric.** `bn` is a curated company-prominence flag, not fan-in. [VERIFIED: ranks non-contiguous]
- **Tagging derived numbers `observed`.** Violates the Phase 2–3 trust contract and DEPTH-04. Use the new `derived` tag.
- **Putting math in `js/ui`.** Keep it pure in `js/analytics` so tests can import without a DOM.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Supplier fan-in index | New traversal | Mirror `buildSharedSupplierOverlapIndex` / reuse `supplierToSymbols` | Identical normalization already battle-tested [js/data:27-60] |
| Label normalization | Custom lowercasing | `normalizeEntityLabel` (exported) | Matches existing overlap keys exactly [js/data:20] |
| Provenance badge HTML | New badge markup | `badgeHtml` + new derived branch | Reuses `.confidence-*`/`.source-link` CSS + a11y attrs [js/trust:87] |
| Graph highlight | New D3 selection logic | `highlightBy(fn)` | Already dims non-matches + clears links [js/viz:385] |
| HTML escaping | Inline replace | `escapeHtml` (data + trust both export) | Consistent XSS guard |

**Key insight:** Every primitive this phase needs already exists; the phase is composition + honest labeling, not new infrastructure.

## Runtime State Inventory

Not applicable — this is a greenfield-analytics + display phase, not a rename/refactor/migration. No stored data, live service config, OS-registered state, secrets, or build artifacts are renamed or moved. Data is frozen and read-only.

## Common Pitfalls

### Pitfall 1: HHI looks broken (everything ~0.20)
**What goes wrong:** Pure equal-weight HHI = 1/k; with k mostly 5, scores tie.
**Why it happens:** No per-supplier share field in the data (`l.v`≡2). [VERIFIED]
**How to avoid:** Use the composite (HHI + sharedFrac); document the equal-weight assumption in Methodology.
**Warning signs:** A test asserting "two different companies get different scores" fails — that is expected for pure HHI; differentiation comes from sharedFrac.

### Pitfall 2: Sector HHI yields tiny uninterpretable numbers (1–7/100)
**What goes wrong:** Raw HHI over 50–122 distinct suppliers per sector is ~0.01–0.07. [VERIFIED: real run]
**Why it happens:** Many suppliers spread the weight; raw HHI is mathematically right but visually meaningless.
**How to avoid:** Report sector concentration as **within-sector reuse %** (fraction of supplier slots that are shared) plus **effective number of suppliers** (`1/HHI`), not the raw HHI·100. Real reuse: Healthcare 12%, Finance 9%, Energy 6%, Semis/Cloud 3%, most others 0%. [VERIFIED]
**Warning signs:** Sector panel shows "2/100" for everything.

### Pitfall 3: New test files silently not run
**What goes wrong:** `scripts.test` lists files explicitly; an unregistered `.test.mjs` never runs.
**Why it happens:** `package.json` test command enumerates 18 files by name (note: 6 other `.test.mjs` exist in tests/ but are excluded — `auto-update-country-data`, `country-macro-*`, `macro-site-*`). [VERIFIED]
**How to avoid:** Append both new files to `scripts.test`. Re-run `npm test`; expect 214 + new count.
**Warning signs:** Green run but new tests' names absent from output.

### Pitfall 4: `package.json` says `"type": "commonjs"` but tests are `.mjs`
**What goes wrong:** Assuming ESM is the default module type.
**Why it happens:** Project is buildless CommonJS-typed; `.mjs` extension forces ESM per file. `js/*` modules are loaded as ESM in the browser and imported by `.mjs` tests. [VERIFIED]
**How to avoid:** New analytics module must be importable as ESM. Keep using `.mjs` for tests and `import`/`export` in `js/analytics/index.js`. Do not add `"type":"module"`.

## Code Examples

### Worked example — company concentration (REAL numbers)
```text
# computed in-session from data/top100-map.json
GILD  Gilead Sciences   k=5  sharedFrac=0.6  -> C = 100*(0.6*0.20 + 0.4*0.60) = 36/100
BAC   Bank of America   k=4  sharedFrac=0.5  -> C = 100*(0.6*0.25 + 0.4*0.50) = 35/100
LLY   Eli Lilly         k=5  sharedFrac=0.4  -> C = 100*(0.6*0.20 + 0.4*0.40) = 28/100
AAPL  Apple             k=5  sharedFrac=0.2  -> C = 100*(0.6*0.20 + 0.4*0.20) = 20/100
NVDA  NVIDIA            k=5  sharedFrac=0.0  -> C = 100*(0.6*0.20 + 0.4*0.00) = 12/100
APH   Amphenol          k=5  sharedFrac=0.0  -> C = 12/100  (sector floor)
# observed range across all 100 companies: 12 – 36 ; theoretical bounds [0,100]
```

### Worked example — criticality / chokepoints (REAL fan-in)
```text
# distinct suppliers: 458 ; suppliers serving >1 company: 19 ; max fan-in: 4
# fan-in histogram (companies-served -> #suppliers): {1:439, 2:13, 3:5, 4:1}
#1  4 companies  <-  credit and risk data inputs
#2  3 companies  <-  taiwan semiconductor manufacturing company (tsmc)
#3  3 companies  <-  api and biologics manufacturing inputs
#4  3 companies  <-  external manufacturing and fill-finish partners
#5  3 companies  <-  china unionpay
#6  3 companies  <-  external manufacturing and fill-finish inputs
#7  2 companies  <-  corning incorporated
#8  2 companies  <-  halliburton
```

### Monotonicity (proves the testable properties)
```text
C in k (sharedFrac=0):       k=2->30, 3->20, 4->15, 5->12, 6->10   (fewer suppliers => higher)
C in sharedFrac (k=5):       0->12, .2->20, .4->28, .6->36, .8->44, 1->52  (more shared => higher)
Bounds: C(k=1, shared=1)=100 ; C(k=8, shared=0)=8
```

### Sector concentration (REAL, sector = `layers[y]`)
```text
sector                       companies  distinctSup  slots  reuse%   effectiveSuppliers(1/HHI)
Healthcare & Life Sciences      12          53        60     12%      ~ high reuse signal
Finance & Payments              19          78        86      9%
Energy & Raw Inputs              7          33        35      6%
Semiconductors & Components     12          58        60      3%
Cloud / Network / Media          7          33        34      3%
Hardware & Equipment             3          15        15      0%
Consumer Demand & Services      25         122       122      0%
# recommend displaying: reuse% + effective-supplier count, NOT raw HHI*100 (which is 1-7).
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Boolean `d.bn` "bottleneck" flag (curated, 19 company nodes) | Quantified fan-in criticality ranking (real counts) | This phase | Investors see *which* supplier and *how many* depend on it, not a binary dot |
| Risk shown as qualitative `supplierRisk: high/medium/low` (js/data `computeProfileRisk`) | Numeric 0–100 concentration score with derived badge | This phase | Defensible, comparable, sourced-as-derived |

**Deprecated/outdated:** Nothing removed. `computeProfileRisk` and `d.bn` remain; the new score *complements* them. `d.bn` is explicitly **not** repurposed.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Equal supplier weight is acceptable because the data has no volume field (all `l.v`=2) | Standard Stack / Pitfall 1 | If a future dataset adds volumes, HHI should use them; current score would understate true concentration. LOW risk — data is frozen this milestone. |
| A2 | Weights 0.6/0.4 (HHI/sharedFrac) are reasonable defaults | Code Examples | Different weights shift the ranking slightly; both axes stay monotonic. Make weights a function parameter so they are tunable + testable. LOW risk. |
| A3 | "Sector" = `D.layers[node.y]` (10 named layers) is the right grouping, not the granular `profile.category` | Sector example | `category` is near-unique per company (unusable). Layer grouping verified to produce 10 sectors with real spread. LOW risk. |
| A4 | Displaying sector concentration as reuse% + effective-supplier count is more honest than raw HHI·100 | Pitfall 2 | Raw HHI is mathematically valid but uninterpretable (1–7/100). Presentation choice, not a data claim. LOW risk. |

All four assumptions are presentation/parameter choices over verified real data, not fabricated facts. None require new data.

## Open Questions

1. **Should the company score be normalized so the observed 12–36 range stretches to use more of 0–100?**
   - What we know: theoretical bounds are [0,100]; observed real range is 12–36 because k is always 3–5.
   - What's unclear: whether investors prefer raw interpretable score or a percentile/min-max stretch.
   - Recommendation: ship the **raw bounded score** (honest, formula-traceable) and label it "HHI-based, 0–100". Do not stretch — stretching would misrepresent absolute concentration. A percentile rank can be added as a secondary line if desired.

2. **Should `sharedFrac` count fan-in≥2 or fan-in≥3 as "single point"?**
   - What we know: 19 suppliers have fan-in>1; only 6 have fan-in≥3.
   - Recommendation: use fan-in>1 (any sharing is a concentration signal); expose the threshold as a parameter for tests.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js + `node:test` | Unit/wiring tests | ✓ | ran `npm test` -> 214 pass [VERIFIED] | — |
| `data/top100-map.json` | All analytics | ✓ | 100 profiles, 458 suppliers [VERIFIED] | — |
| D3 (`highlightBy`) | Graph highlight | ✓ | site-loaded global [js/viz:385] | — |

No missing dependencies. No external services. Pure code/data-read phase.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `node:test` + `node:assert/strict` (Node ≥ 18 built-in) |
| Config file | none — files enumerated in `package.json` `scripts.test` |
| Quick run command | `npm test` |
| Full suite command | `npm test` (single command runs all registered `.test.mjs`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEPTH-01 | `companyConcentration` returns integer in [0,100] | unit | `npm test` (concentration.test.mjs) | ❌ Wave 0 |
| DEPTH-01 | Monotonic: smaller k → higher score (sharedFrac fixed) | unit | `npm test` | ❌ Wave 0 |
| DEPTH-01 | Monotonic: higher sharedFrac → higher score (k fixed) | unit | `npm test` | ❌ Wave 0 |
| DEPTH-01 | `sectorConcentration` returns bounded reuse% + effective count over real layers | unit | `npm test` | ❌ Wave 0 |
| DEPTH-02 | `supplierCriticality()` ranks more-dependents above fewer; top = "credit and risk data inputs" (4) | unit | `npm test` | ❌ Wave 0 |
| DEPTH-02 | Criticality counts match `supplierToSymbols` fan-in (≥1 supplier with fan-in≥3) | unit | `npm test` | ❌ Wave 0 |
| DEPTH-02/04 | `provenanceFor({derived:true,n})` → `tag:"derived"` + "computed from N relationships" note | unit | `npm test` | ❌ Wave 0 |
| DEPTH-02/04 | `badgeHtml` for derived tag emits "Derived" label, never "Observed" | unit | `npm test` | ❌ Wave 0 |
| DEPTH-01/02 | js/ui profile panel string-wires concentration score + derived badge + methodology link | wiring (string) | `npm test` | ❌ Wave 0 |
| DEPTH-02 | js/ui chokepoints panel + js/viz highlight predicate wired | wiring (string) | `npm test` | ❌ Wave 0 |
| DEPTH-04 | index.html Methodology modal contains the concentration + criticality formula copy | wiring (string) | `npm test` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test` (full suite; fast — ~1.1s)
- **Phase gate:** Full suite green (214 prior + new) before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/concentration.test.mjs` — covers DEPTH-01 (bounds, monotonicity ×2, sector)
- [ ] `tests/criticality-wiring.test.mjs` — covers DEPTH-02/04 (ranking, fan-in match, derived provenance, ui/html string wiring)
- [ ] Register BOTH new files in `package.json` `scripts.test` (currently 18 files listed → 20)
- [ ] Framework install: none — `node:test` already in use across all suites

*Test-data note:* pure tests should read `data/top100-map.json` via `node:fs` and pass `profiles` into the analytics functions (mirror `tests/provenance.test.mjs:9`) so they do not depend on `window`.

## Security Domain

`security_enforcement` default (enabled). This phase adds no auth, no network, no new input surface.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Public static site, no auth (Out of Scope per REQUIREMENTS) |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | No protected resources |
| V5 Input Validation / Output Encoding | yes | All new display strings (supplier labels, scores) MUST pass through existing `escapeHtml` before innerHTML — supplier labels are dataset-controlled but the badge/source link path already enforces `http`-only URLs (js/trust:93) |
| V6 Cryptography | no | No secrets/crypto |

### Known Threat Patterns for buildless ESM + innerHTML display
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| DOM XSS via unescaped supplier label in new panels | Tampering | Reuse `escapeHtml` on every interpolated label (existing pattern, js/ui:468) |
| Malicious source URL injected into derived badge link | Tampering | `badgeHtml` already gates `url.startsWith("http")` + `rel="noopener noreferrer"` (js/trust:93,100) — derived branch must reuse same guard |

## Sources

### Primary (HIGH confidence)
- `data/top100-map.json` — direct in-session computation: 100 profiles, 458 distinct suppliers, fan-in histogram {1:439,2:13,3:5,4:1}, all `l.v`=2, `layers` = 10 sectors, `bn` on 19 global nodes with ranks 1–12/16/20/21/23/32/34/35.
- `js/data/index.js` — `buildSharedSupplierOverlapIndex`/`supplierToSymbols` (27–60), `normalizeEntityLabel` (20), exports (235).
- `js/trust/index.js` — `provenanceFor` (23–46), `confidenceScore` (65), `badgeHtml` (87–108).
- `js/ui/index.js` — profile card render (450–483), `getTopOverlap` use (460), methodology wiring (600–605, 807–811).
- `js/viz/index.js` — `highlightBy` (385), `d.bn` rendering (376, 452–467).
- `index.html` — Methodology modal body (83–116).
- `package.json` — `scripts.test` (18 files), `type:"commonjs"`.
- `npm test` run — 214 pass / 0 fail [VERIFIED this session].

### Secondary (MEDIUM confidence)
- HHI / Herfindahl as the standard concentration index for supplier portfolios — well-established economics measure; equal-weight `1/k` is its mathematically exact value when shares are equal.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps; verified existing toolchain runs 214 tests.
- Architecture: HIGH — all wiring points read directly from source; numbers computed from real data.
- Pitfalls: HIGH — each pitfall was empirically reproduced (degenerate HHI, tiny sector HHI, all `l.v`=2, `bn` non-contiguous).

**Research date:** 2026-06-21
**Valid until:** 2026-07-21 (stable — dataset is frozen for this milestone)
