# Phase 7: Scenario Stress-Tests - Research

**Researched:** 2026-06-21
**Domain:** Pure data-derived scenario engine (supply-chain disruption impact) + UI wiring + provenance + tests
**Confidence:** HIGH (all numbers computed live from the frozen `data/top100-map.json`; existing analytics/trust/viz/ui APIs read directly from source)

## Summary

Phase 7 ships the signature differentiator: a pure `runScenario(disruption, ctx)` analytic that, given a disabled supplier, computes the real downstream impact (companies affected, suppliers lost, concentration shift, market-cap exposed), plus a "Taiwan semiconductor disruption" preset, a scenario UI panel, honest derived provenance, and tests — keeping the 242-test suite green. The engine is a thin composition over the Phase-6 primitives already in `js/analytics/index.js` (`buildSupplierFanIn`, `companyConcentration`, `supplierCriticality`) and the `js/trust` derived-provenance branch already used by the concentration card.

The dominant finding from inspecting the real data: **TSMC is fragmented across multiple distinct normalized supplier labels**, not one. A normalized-label match for TSMC/Taiwan-Semiconductor yields exactly **7 dependent companies** (`NVDA, AAPL, AVGO, 000660.KS, AMD, AMAT, KLAC`) with a combined **$11.36T** market cap exposed. The "40 refs" mentioned in CONTEXT is a raw substring grep over the whole dataset, not the normalized fan-in — using it as the headline number would be dishonest. The engine must therefore accept a **set of disabled labels** (a preset bundles the real label variants) and report what it actually finds.

The second critical finding: **the existing composite `companyConcentration.score` is NOT monotonic** when a supplier is removed. Because the score mixes `0.6·HHI + 0.4·sharedFrac`, removing TSMC (itself a shared single-point) can *lower* a firm's composite score (verified: AAPL 20→15, AVGO 20→15, AMAT 28→25). The honest, monotonic "concentration worsens" metric is **HHI = 1/k**, which always rises when k drops (verified: every dependent 0.200→0.250). The scenario engine must report `concentrationBefore/After` as **HHI** (not the composite), and the test "after ≥ before" must assert on HHI.

**Primary recommendation:** Add a pure `runScenario(disruption, ctx)` to `js/analytics/index.js` that composes the existing primitives; report concentration delta as HHI (monotonic); add a `companyConcentration` opts param `excludeSuppliers` (minimal change) so before/after reuse one function; ship a `TAIWAN_SEMI` preset whose `disableSuppliers` is the real label set; wire a `#scenarioPanel` mirroring `#chokepointsPanel`; tag outputs `derived` via the existing trust branch; add `tests/scenario.test.mjs` + `tests/scenario-wiring.test.mjs` to `package.json scripts.test`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEPTH-03 | At least one scenario stress-test ("Taiwan semiconductor disruption") runs over real data and shows downstream impact | `runScenario` API design (below); real Taiwan-semi impact set = 7 firms / $11.36T derived live; `highlightBy` predicate for impacted companies; `#scenarioPanel` insertion point identified |
| DEPTH-04 | Every derived analytic carries provenance and is covered by tests | Reuse `provenanceFor({derived:true, n})` + `badgeHtml` (already returns "Derived" badge); methodology copy additions specified; unit + wiring/provenance string tests specified |
</phase_requirements>

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Scenario engine (DEPTH-03) — pure, real-data**
- Add a pure `runScenario(disruption, ctx)` to js/analytics (DOM-free, unit-testable). A disruption targets real entities — e.g. `{ disableSuppliers: [normalizedLabel...] }` or `{ disableSupplier: 'tsmc' }`. Output: `{ impactedCompanies: [{symbol, lostSuppliers, concentrationBefore, concentrationAfter}], totalMarketCapExposed, supplierCount }`. Computed from the real graph (supplierToSymbols / profiles[].nodes / node marketcap). State assumptions (a company is "impacted" if it loses ≥1 supplier; severity by share of suppliers lost) — no fabrication.
- Reuse Phase-6 analytics (buildSupplierFanIn, companyConcentration) for before/after concentration deltas.

**Shipped scenario (DEPTH-03)**
- A concrete "Taiwan semiconductor disruption" preset: disable TSMC (and/or Taiwan-linked semiconductor suppliers found in real data) → list impacted companies + combined market-cap exposed + concentration worsening. Numbers derived live from data (TSMC fan-in etc.), never hardcoded.

**Scenario UI (DEPTH-03)**
- A scenario picker/panel: choose a preset (Taiwan semis) or a chokepoint supplier to "disrupt"; show an impact panel (affected companies + exposed $cap) and highlight the impacted companies in the graph (reuse highlightBy). A "reset" returns to normal. Clear, honest framing.

**Provenance (DEPTH-04)**
- Scenario outputs are DERIVED — tag with the Phase-6 `derived` provenance ('derived' badge + "computed from N relationships", methodology link). Update Methodology copy to explain the scenario model + assumptions + limits. Never present scenario output as observed fact.

**Tests**
- Pure unit tests: runScenario impact set correctness (disabling TSMC impacts exactly the real dependents), market-cap exposed sums real values, concentration-after ≥ before for impacted firms, empty/no-op disruption is safe. Wiring/provenance string tests. Register new test files in package.json scripts.test. Keep the full suite (242) green.

### Claude's Discretion
- The exact v1 definition of "Taiwan-linked semiconductor suppliers" (just the TSMC label variants vs. a broader TW-country semiconductor set) — recommendation below, no fabrication.
- Severity buckets / formula for share-of-suppliers-lost.
- Whether `companyConcentration` change is an `excludeSuppliers` opts param vs. an injected supplier list (recommendation below).
- Allowing disruption of any top chokepoint (from Phase-6 criticality) as the generalized control.

### Deferred Ideas (OUT OF SCOPE)
- Multi-hop cascade / probabilistic propagation → future (v1 = direct dependents impact only).
- Perf memoization of repeated scenario runs → Phase 8.
- Any data change (frozen dataset).
</user_constraints>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| `runScenario` impact math (impacted set, $cap, concentration delta) | Pure analytics module (`js/analytics`) | — | DOM-free, unit-testable under node:test; mirrors existing concentration/criticality functions reading `DATA.profiles` |
| Concentration before/after recompute | Pure analytics (`companyConcentration` + new opts) | — | Reuse the single source of truth; do not re-derive HHI in the scenario fn |
| Market-cap lookup per impacted firm | Pure analytics (reads top-level `DATA.nodes[].marketcap`) | `js/data` (the data contract) | Marketcap lives on top-level nodes keyed by `symbol`, not on profiles |
| Scenario panel render + preset/chokepoint picker + impact list | UI (`js/ui/index.js` + `index.html` `#scenarioPanel`) | — | Mirrors `#chokepointsPanel` exactly |
| Graph highlight of impacted companies | Viz (`highlightBy` predicate) | UI (calls it) | `highlightBy(fn)` already exists; predicate `n => impactedSymbols.has(n.symbol)` |
| Derived provenance badge + methodology copy | Trust (`provenanceFor`/`badgeHtml`) + `index.html` methodology modal | UI (renders badge) | Reuse the existing `derived` branch — no new trust code needed |

## Real Impact Data (Taiwan Semiconductor Disruption)

> All numbers below were computed live from `C:/Users/akgul/Downloads/Downloads/supplychain/data/top100-map.json` during research. They are the ground truth the tests should assert; the shipped app derives them at runtime, never hardcoded. `[VERIFIED: data/top100-map.json]`

### How TSMC appears in the data

Supplier nodes live at `profiles[symbol].nodes[]` with `kind === "supplier"`. The normalized label is `normalizeEntityLabel(node.l.split("\n")[0])` (lowercased, whitespace-collapsed). TSMC is **fragmented across 6 distinct normalized labels** — there is no single canonical "tsmc" node: `[VERIFIED: data/top100-map.json]`

| Normalized supplier label | Dependent companies | Fan-in |
|---------------------------|---------------------|--------|
| `taiwan semiconductor manufacturing company (tsmc)` | AAPL, AVGO, AMAT | 3 |
| `tsmc foundry capacity` | NVDA | 1 |
| `tsmc (hbm4 and cowos collaboration)` | 000660.KS (SK Hynix) | 1 |
| `tsmc n2 process technology` | AMD | 1 |
| `tsmc` | KLAC | 1 |

All five labels carry country code `c === "TW"`. (A sixth grep hit, `automotive semiconductor suppliers` / `be semiconductor industries n.v. (besi)`, are *not* TSMC and are excluded.)

### The real "Taiwan semiconductor disruption" headline numbers

Disabling the TSMC label set above impacts exactly **7 distinct companies**: `[VERIFIED: data/top100-map.json]`

| Symbol | Company | Market cap | TSMC label lost |
|--------|---------|-----------|------------------|
| NVDA | NVIDIA | $4.622T | tsmc foundry capacity |
| AAPL | Apple | $3.889T | taiwan semiconductor manufacturing company (tsmc) |
| AVGO | Broadcom | $1.577T | taiwan semiconductor manufacturing company (tsmc) |
| 000660.KS | SK Hynix | $0.452T | tsmc (hbm4 and cowos collaboration) |
| AMD | AMD | $0.326T | tsmc n2 process technology |
| AMAT | Applied Materials | $0.298T | taiwan semiconductor manufacturing company (tsmc) |
| KLAC | KLA | $0.197T | tsmc |

**N companies impacted = 7. Total market cap exposed = $11.361T** (`11,360,589,871,184` raw dollars; `marketcap` field on top-level `DATA.nodes`, in raw USD). `[VERIFIED: data/top100-map.json]`

Each impacted firm loses exactly **1** supplier and goes from **k=5 → k=4** distinct suppliers, so **HHI 0.200 → 0.250** for all seven (concentration worsens monotonically). `[VERIFIED: data/top100-map.json]`

### Recommended v1 definition of "Taiwan-linked semiconductor suppliers"

**Recommendation: ship the TSMC label set (5 labels above) as `TAIWAN_SEMI.disableSuppliers`** — the honest, defensible v1. Rationale:
- It is unambiguously TSMC, unambiguously Taiwan (`c === "TW"`), unambiguously semiconductor.
- The headline "7 companies, $11.36T exposed" is fully derived from these labels.

A **broader** "all TW-country suppliers" definition exists in the data (9 dependents, adds Foxconn/`hon hai precision industry (foxconn)`, GlobalWafers, MediaTek, UMC, and TSM itself via GlobalWafers) but it conflates assembly (Foxconn) and non-Taiwan-fabless logic with foundry risk and would overstate "semiconductor" scope. **Do not** use the broad set for the headline preset; it may optionally be offered later as a separate "Taiwan supply chain (all)" scenario. `[VERIFIED: data/top100-map.json]`

> ASSUMPTION A1: The preset's label list is hand-curated from the 5 real labels found at research time. If the frozen data later changes, the list must be re-derived. Because the data is frozen for this milestone (CLAUDE.md constraint), this is stable. Tagged `[ASSUMED]` only in that it's a curated bundle, but every member is `[VERIFIED]` against current data.

## Engine API

### `runScenario(disruption, ctx)` — pure, DOM-free

```js
// js/analytics/index.js (new export)
//
// Pure scenario engine (DEPTH-03). DOM-free, unit-testable. Computes the DIRECT
// downstream impact of disabling one or more suppliers. v1 is single-hop: a company
// is "impacted" iff it loses >= 1 of its distinct suppliers. No cascade (deferred).
//
// disruption: { disableSuppliers?: string[], disableSupplier?: string }
//   - labels are NORMALIZED supplier labels (normalizeEntityLabel form), matching
//     buildSupplierFanIn / companyConcentration keys exactly.
// ctx (opts): { profiles = DATA.profiles, nodes = DATA.nodes, fanIn = buildSupplierFanIn(profiles) }
//
// returns {
//   impactedCompanies: [{ symbol, company, marketcap, lostSuppliers: string[],
//                         suppliersBefore, suppliersAfter,
//                         concentrationBefore, concentrationAfter,  // HHI (1/k), monotonic
//                         severity }],          // 'low'|'medium'|'high' by share lost
//   totalMarketCapExposed,                      // sum of impacted firms' marketcap (raw USD)
//   supplierCount,                              // # of disabled supplier labels actually present in graph
//   disabled: string[]                          // normalized labels applied
// }
export function runScenario(disruption = {}, ctx = {}) {
  const { profiles = DATA.profiles, nodes = DATA.nodes, fanIn } = ctx;
  const fan = fanIn || buildSupplierFanIn(profiles);

  // 1. Normalize the disabled-supplier set (accept both shapes).
  const disabled = new Set(
    [...(disruption.disableSuppliers || []),
     ...(disruption.disableSupplier ? [disruption.disableSupplier] : [])]
      .map((s) => normalizeEntityLabel(s)).filter(Boolean)
  );

  // 2. marketcap lookup by symbol (top-level nodes carry marketcap; profiles do not).
  const mcap = {};
  for (const n of nodes || []) if (n && n.symbol != null) mcap[n.symbol] = n.marketcap || 0;

  // 3. Candidate impacted symbols = union of fan-in sets of the disabled labels.
  const candidates = new Set();
  for (const label of disabled) for (const sym of (fan.get(label) || [])) candidates.add(sym);

  const impactedCompanies = [];
  let totalMarketCapExposed = 0;
  for (const symbol of candidates) {
    const before = companyConcentration(symbol, { profiles, fanIn: fan });
    if (!before) continue;
    const after = companyConcentration(symbol, { profiles, fanIn: fan, excludeSuppliers: disabled });
    const lostSuppliers = [...disabled].filter((d) => (fan.get(d) || new Set()).has(symbol));
    if (lostSuppliers.length === 0) continue;            // "impacted" = loses >= 1 supplier
    const share = before.suppliers ? lostSuppliers.length / before.suppliers : 0;
    const severity = share >= 0.5 ? "high" : share >= 0.25 ? "medium" : "low";
    impactedCompanies.push({
      symbol, company: profiles[symbol]?.company || symbol, marketcap: mcap[symbol] || 0,
      lostSuppliers, suppliersBefore: before.suppliers, suppliersAfter: after.suppliers,
      concentrationBefore: before.hhi, concentrationAfter: after.hhi, severity,
    });
    totalMarketCapExposed += mcap[symbol] || 0;
  }
  impactedCompanies.sort((a, b) => b.marketcap - a.marketcap || a.symbol.localeCompare(b.symbol));
  return {
    impactedCompanies, totalMarketCapExposed,
    supplierCount: [...disabled].filter((d) => fan.has(d)).length,
    disabled: [...disabled],
  };
}
```

### The shipped preset

```js
// js/analytics/index.js — derived live; the LABELS are the only curated input.
export const SCENARIO_PRESETS = {
  TAIWAN_SEMI: {
    id: "taiwan-semi",
    label: "Taiwan semiconductor disruption",
    disruption: {
      disableSuppliers: [
        "taiwan semiconductor manufacturing company (tsmc)",
        "tsmc foundry capacity",
        "tsmc (hbm4 and cowos collaboration)",
        "tsmc n2 process technology",
        "tsmc",
      ],
    },
  },
};
```

The UI runs `runScenario(SCENARIO_PRESETS.TAIWAN_SEMI.disruption)` and renders "{impactedCompanies.length} companies impacted, ${(totalMarketCapExposed/1e12).toFixed(2)}T market cap exposed". No number is hardcoded in the UI.

### Definitions & assumptions (state these in code + methodology)

- **Impacted** = a company that loses ≥ 1 of its distinct suppliers when the disruption is applied. `[VERIFIED: matches CONTEXT decision]`
- **v1 is single-hop** (direct dependents only). Cascade/propagation is deferred. `[CITED: CONTEXT Deferred Ideas]`
- **Concentration before/after = HHI = 1/k** (the monotonic component), NOT the composite score. `[VERIFIED: data/top100-map.json — composite is non-monotonic, see Pitfall 1]`
- **Severity** = share of suppliers lost: `>=0.5` high, `>=0.25` medium, else low. For the Taiwan preset every firm loses 1 of 5 (share 0.20) → severity "low" — honest, since a 1-of-5 loss is a real but not catastrophic single-hop hit. `[ASSUMED — discretion buckets]`
- **Market cap exposed** = sum of impacted firms' `marketcap` (raw USD, from top-level `DATA.nodes`). This is "the combined market cap of firms that would feel the disruption," NOT a dollar loss estimate. The UI copy must say "market cap exposed," not "lost." `[VERIFIED: data/top100-map.json]`

## Concentration-After Mechanics (the minimal js/analytics change)

`companyConcentration(symbol, opts)` already accepts `{ wHHI, wShared, sharedThreshold, profiles, fanIn }` and computes `uniq = [...supplierSet(p)]`. **The minimal change is a single `excludeSuppliers` opts param** that filters `uniq` before computing k/HHI/sharedFrac:

```js
// js/analytics/index.js  companyConcentration — add one opt + one filter line.
export function companyConcentration(symbol, opts = {}) {
  const {
    wHHI = 0.6, wShared = 0.4, sharedThreshold = 1,
    profiles = DATA.profiles, fanIn = buildSupplierFanIn(profiles),
    excludeSuppliers,                              // NEW: Set<normalizedLabel> | string[] | undefined
  } = opts;
  const p = profiles?.[symbol];
  if (!p) return null;
  const exclude = excludeSuppliers instanceof Set ? excludeSuppliers
                : Array.isArray(excludeSuppliers) ? new Set(excludeSuppliers) : null;
  const uniq = [...supplierSet(p)].filter((s) => !exclude || !exclude.has(s));  // NEW filter
  const k = uniq.length;
  // ... unchanged from here
}
```

This is **purely additive and backward-compatible**: with `excludeSuppliers` undefined, `uniq` is unchanged, so all 242 existing concentration tests stay green. The scenario engine calls `companyConcentration(symbol, { ..., excludeSuppliers: disabled })` for the "after" value. Recommended over "inject a supplier list" because it keeps the single source of truth (`supplierSet`) and changes the function in one place.

> Why HHI not the composite for the delta: removing a *shared* supplier lowers `sharedFrac`, which can drop the composite even though the firm is now MORE concentrated (fewer suppliers). Verified non-monotonic cases under the composite: AAPL 20→15, AVGO 20→15, AMAT 28→25. HHI (1/k) is strictly monotonic: 0.200→0.250 for all 7. The engine returns `before.hhi`/`after.hhi`; the test asserts `after >= before` on HHI. `[VERIFIED: data/top100-map.json]`

## Provenance (DEPTH-04)

No new trust code needed. Reuse the existing derived branch — `js/trust/index.js:27` already handles `{ derived: true, n }` and `badgeHtml` already emits the "Derived" label (`confidence-medium` class). `[VERIFIED: js/trust/index.js]`

```js
// In js/ui — mirror the concentration card at js/ui/index.js:471.
import { provenanceFor, badgeHtml } from "../trust/index.js";
const n = result.impactedCompanies.reduce((s, c) => s + c.lostSuppliers.length, 0);
const badge = badgeHtml(provenanceFor({ derived: true, n }, { methodologyUrl: "#methodology" }));
// -> renders: <span class="prov-badge ... confidence-medium">Derived</span> + Methodology link
// note text: "computed from N relationships"
```

### Methodology copy additions (in `index.html` methodology modal, after the chokepoints `<h3>` at line 118)

Add an `<h3>Scenario stress-tests (derived)</h3>` block stating:
- The model: "disable one or more real suppliers → list the companies that lose ≥1 supplier."
- It is **single-hop** (direct dependents only); cascade is explicitly out of scope for v1.
- Concentration shift is reported as **HHI = 1/k** (rises when a supplier is removed); the composite concentration score is not used here because it is not monotonic under removal.
- "Market cap exposed" is the combined market cap of impacted firms — **exposure, not a loss estimate**.
- The Taiwan preset disables the real TSMC supplier-label variants found in the data.

## UI Wiring

### Insertion points (mirror `#chokepointsPanel` exactly)

| What | Where | Pattern to copy |
|------|-------|-----------------|
| Scenario panel container `#scenarioPanel` | `index.html` — sibling of `#chokepointsPanel` (after line 282, before `#tt` at 284) | `#chokepointsPanel` block (lines 274–282) |
| Impact list `#scenarioImpactList` + summary `#scenarioSummary` | inside `#scenarioPanel` | `#chokepointsList` (line 277) |
| Preset button `#bScenarioTaiwan` + chokepoint `<select>` + `#bScenarioReset` | `#scenarioPanel` `.cActions` | `#bChokepoints` / `#bChokepointsReset` (lines 279–280) |
| Derived badge target `#scenarioProv` | `#scenarioPanel` header | concentration card badge (js/ui:471) |
| Render fn `renderScenario(result)` + `runTaiwanScenario()` + `highlightImpacted(result)` | `js/ui/index.js` — beside `renderChokepoints`/`highlightChokepoints` (lines 636–660) | the chokepoints trio |
| Bootstrap wiring | `js/ui/index.js` after line 872 (chokepoint wiring) | `renderChokepoints(); addEventListener("bChokepoints"...)` |
| Module imports | `js/ui/index.js:16` — add `runScenario, SCENARIO_PRESETS` to the analytics import | existing `companyConcentration, supplierCriticality` import |

### Graph highlight (reuse `highlightBy`)

`highlightBy(fn)` is exported from `js/viz` and already imported by `js/ui` (line 12). In global mode each node carries `.symbol`. So:

```js
function highlightImpacted(result) {
  const impacted = new Set(result.impactedCompanies.map((c) => c.symbol));
  highlightBy((n) => impacted.has(n.symbol));   // company nodes only have .symbol
}
// reset returns to normal via the already-wired resetHighlight
```

> Note: highlight only takes effect in **global** mode (profile mode has different nodes). Mirror the chokepoint UX (panel is global-mode chrome). Preserve all existing IDs and the bootstrap order; only append.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Supplier fan-in (who depends on X) | A new traversal | `buildSupplierFanIn(profiles)` | Already keyed identically to the overlap index; reused by criticality |
| Per-company concentration | New HHI math | `companyConcentration(symbol, { excludeSuppliers })` | Single source of truth; one additive opt covers before/after |
| Derived provenance badge | New badge markup/branch | `provenanceFor({derived:true,n})` + `badgeHtml` | Already emits "Derived"; DEPTH-04 reuse |
| Graph highlight of a symbol set | New D3 opacity pass | `highlightBy(n => set.has(n.symbol))` | Exported, already used by chokepoints/search |
| Market-cap lookup | Recompute from links | top-level `DATA.nodes[].marketcap` keyed by `symbol` | Profiles do NOT carry marketcap; top nodes do (raw USD) |
| Label normalization | Custom lowercasing | `normalizeEntityLabel` | Must match fan-in keys exactly or fan-in lookups miss |

**Key insight:** Phase 7 is composition, not new algorithms. The only genuinely new code is `runScenario` (a join over existing primitives) + one `excludeSuppliers` opt + UI panel.

## Common Pitfalls

### Pitfall 1: Asserting the composite concentration score rises after removal
**What goes wrong:** Test "concentrationAfter ≥ before" fails for AAPL/AVGO/AMAT.
**Why:** The composite `0.6·HHI + 0.4·sharedFrac` drops when a *shared* supplier (TSMC) is removed because `sharedFrac` falls.
**How to avoid:** Report and assert on **HHI (1/k)**, which is monotonic under removal. The engine returns `before.hhi`/`after.hhi`.
**Warning signs:** Any "after < before" in a unit test using `.score`.

### Pitfall 2: Treating TSMC as one label / using the "40 refs" number
**What goes wrong:** A single `disableSupplier: "tsmc"` only hits KLAC (fan-in 1); the headline becomes "1 company."
**Why:** TSMC is fragmented across 6 normalized labels; "40 refs" is a raw substring grep, not normalized fan-in.
**How to avoid:** The preset bundles the 5 real label variants; headline is derived from the union (7 firms).
**Warning signs:** Impacted count of 1 or 3 instead of 7.

### Pitfall 3: Reading marketcap off profiles
**What goes wrong:** `profiles[symbol].marketcap` is `undefined` → `totalMarketCapExposed = 0`.
**Why:** Marketcap lives on top-level `DATA.nodes`, keyed by `symbol`; profiles don't carry it.
**How to avoid:** Build `mcap[symbol]` from `DATA.nodes` (engine does this; pass `nodes` in tests).
**Warning signs:** $0.00T exposed in the panel.

### Pitfall 4: Forgetting to register new test files
**What goes wrong:** New tests never run; suite still shows 242; regressions slip through.
**Why:** `npm test` runs only the explicit file list in `package.json scripts.test`.
**How to avoid:** Append `tests/scenario.test.mjs tests/scenario-wiring.test.mjs` to the script.
**Warning signs:** Test count unchanged after adding files.

### Pitfall 5: Mutating frozen data / not passing profiles in tests
**What goes wrong:** Tests depend on `window` or accidentally mutate `DATA`.
**Why:** Pure functions default to `DATA` (undefined under node:test).
**How to avoid:** Mirror existing tests — `JSON.parse(readFileSync("data/top100-map.json"))` and pass `{ profiles, nodes }` explicitly. Never mutate.

## Runtime State Inventory

> This is a code/UI-only phase over a frozen dataset — no rename/migration. Included for completeness.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — dataset is frozen (`data/top100-map.json`), engine is read-only. Verified: CLAUDE.md "data frozen" + CONTEXT "any data change" out of scope. | None |
| Live service config | None — buildless static site, no external services touched by this phase. | None |
| OS-registered state | None. | None |
| Secrets/env vars | None — no secrets in scope. | None |
| Build artifacts | None — buildless; `data/top100-map.js` (thin) and `.json` (rich) already coexist; this phase adds no data. | None |

## Code Examples

### Run the preset and render (UI)
```js
// Source: composed from js/ui:632-660 (chokepoints) + js/analytics (new runScenario)
import { runScenario, SCENARIO_PRESETS } from "../analytics/index.js";

function runTaiwanScenario() {
  const result = runScenario(SCENARIO_PRESETS.TAIWAN_SEMI.disruption, { profiles: DATA.profiles, nodes: DATA.nodes });
  renderScenario(result);
  highlightImpacted(result);
}

function renderScenario(result) {
  const cap = (result.totalMarketCapExposed / 1e12).toFixed(2);
  scenarioSummaryEl.textContent =
    `${result.impactedCompanies.length} companies impacted · $${cap}T market cap exposed`;
  scenarioImpactListEl.innerHTML = result.impactedCompanies.map((c) =>
    `<div class="cItem"><span>${escapeHtml(c.company)} (${escapeHtml(c.symbol)})</span>` +
    `<b>${c.lostSuppliers.length} supplier · ${(c.concentrationBefore).toFixed(2)}→${(c.concentrationAfter).toFixed(2)} HHI</b></div>`
  ).join("");
  const n = result.impactedCompanies.reduce((s, c) => s + c.lostSuppliers.length, 0);
  if (scenarioProvEl) scenarioProvEl.innerHTML = badgeHtml(provenanceFor({ derived: true, n }, { methodologyUrl: "#methodology" }));
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Concentration shown statically per company (Phase 6) | Interactive what-if removal recomputing HHI live | Phase 7 | The differentiator; reuses Phase-6 primitives |
| Composite score for all concentration reporting | HHI for scenario deltas (monotonic), composite for static card | Phase 7 | Honest monotonic delta; static card unchanged |

**Deprecated/outdated:** none — purely additive.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (`node --test`), ESM `.mjs` |
| Config file | none — explicit file list in `package.json` `scripts.test` |
| Quick run command | `node --test tests/scenario.test.mjs tests/scenario-wiring.test.mjs` |
| Full suite command | `npm test` (currently 242 tests, all passing) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEPTH-03 | Taiwan preset impacts exactly the 7 real dependents | unit | `node --test tests/scenario.test.mjs` | ❌ Wave 0 |
| DEPTH-03 | `totalMarketCapExposed` === 11,360,589,871,184 (sum of real marketcaps) | unit | `node --test tests/scenario.test.mjs` | ❌ Wave 0 |
| DEPTH-03 | `concentrationAfter >= concentrationBefore` (HHI) for every impacted firm | unit | `node --test tests/scenario.test.mjs` | ❌ Wave 0 |
| DEPTH-03 | Empty/no-op disruption → `{impactedCompanies:[], totalMarketCapExposed:0}` (safe) | unit | `node --test tests/scenario.test.mjs` | ❌ Wave 0 |
| DEPTH-03 | `companyConcentration` with `excludeSuppliers` undefined === legacy output (back-compat) | unit | `node --test tests/scenario.test.mjs` | ❌ Wave 0 |
| DEPTH-03 | Single `disableSupplier:"tsmc"` impacts only KLAC (label-fragmentation guard) | unit | `node --test tests/scenario.test.mjs` | ❌ Wave 0 |
| DEPTH-03 | `#scenarioPanel` exists in index.html; UI imports `runScenario`/`SCENARIO_PRESETS`; calls `highlightBy` | string/wiring | `node --test tests/scenario-wiring.test.mjs` | ❌ Wave 0 |
| DEPTH-04 | Scenario output renders the `derived` provenance ("Derived" badge + "computed from N relationships" + methodology link) | string/wiring | `node --test tests/scenario-wiring.test.mjs` | ❌ Wave 0 |
| DEPTH-04 | Methodology modal contains the scenario-model block (single-hop + HHI + "exposure not loss") | string | `node --test tests/scenario-wiring.test.mjs` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test tests/scenario.test.mjs tests/scenario-wiring.test.mjs`
- **Per wave merge:** `npm test` (full 242 + new)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/scenario.test.mjs` — pure engine: impact set, $cap, HHI monotonicity, no-op, back-compat, label-fragmentation (DEPTH-03)
- [ ] `tests/scenario-wiring.test.mjs` — index.html panel + UI import/highlight + derived-provenance string + methodology copy (DEPTH-03/04)
- [ ] `package.json` `scripts.test` — append both files (else they never run)

*(No framework install needed — `node --test` is built in; pattern mirrors `tests/criticality-wiring.test.mjs`.)*

## Project Constraints (from CLAUDE.md)

- **Buildless static site** (HTML/CSS/vanilla JS + D3). No framework/build tool — do not introduce one.
- **Data contract frozen:** `data/` JSON contract and the weekly auto-update pipeline must keep working; **no data change** this phase.
- **Existing test suite stays green** (242 now); new behavior gets new tests registered in `package.json`.
- **Data integrity:** real, sourced data only — nothing fabricated; derived analytics tagged "Derived" with a methodology link.
- **Audience:** sophisticated investors, public, no login — copy must be honest ("exposure," not "loss"; single-hop limit stated).

## Package Legitimacy Audit

**Not applicable.** This phase installs **no external packages**. It is pure vanilla-JS additions to existing modules plus two new `.mjs` test files run by Node's built-in test runner. Existing deps (`playwright`, `http-server`) are unchanged. No npm install occurs. `[VERIFIED: package.json]`

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The 5 curated TSMC label variants are the complete real set | Real Impact Data | Low — derived from full data scan; data frozen. If a variant is missed, impacted count < 7 (test catches it) |
| A2 | Severity buckets (0.5/0.25 thresholds) | Engine API | Low — discretion; Taiwan preset is "low" (1 of 5); affects label only, not the headline numbers |
| A3 | "Market cap exposed" framing (exposure, not loss) is the honest investor reading | Engine/UI/Methodology | Low — explicitly an exposure metric; UI copy must avoid "lost" |

## Open Questions

1. **Generalized chokepoint disruption control**
   - What we know: CONTEXT permits disrupting any top chokepoint (Phase-6 `supplierCriticality`) as the generalized control; `runScenario({disableSupplier: label})` already supports it.
   - What's unclear: whether v1 ships the chokepoint `<select>` or only the Taiwan preset button.
   - Recommendation: ship the Taiwan preset button (required for DEPTH-03) + a chokepoint `<select>` populated from `supplierCriticality({limit:8})` reusing the same render path — low marginal cost, satisfies the "generalized control" idea.

2. **HHI display precision in the panel**
   - What we know: HHI values are 0.20→0.25 for the preset.
   - Recommendation: show 2-decimal HHI ("0.20→0.25") plus suppliers ("5→4 suppliers") for legibility; both are derived.

## Sources

### Primary (HIGH confidence)
- `data/top100-map.json` — direct computation: TSMC label fragmentation, 7 dependents, $11.361T, HHI 0.200→0.250, composite non-monotonicity, marketcap field on top-level nodes
- `js/analytics/index.js` — `buildSupplierFanIn`, `companyConcentration` (opts shape), `supplierCriticality`
- `js/trust/index.js` — `provenanceFor` derived branch, `badgeHtml` "Derived"
- `js/viz/index.js` — `highlightBy(fn)` signature, global-mode node `.symbol`
- `js/ui/index.js` — chokepoints render/highlight/bootstrap pattern; analytics import
- `index.html` — `#chokepointsPanel` insertion model, methodology modal location
- `package.json` — `scripts.test` file list (242 baseline confirmed by run)
- `CLAUDE.md`, `.planning/config.json` — constraints, nyquist_validation=true

### Secondary (MEDIUM confidence)
- none required

### Tertiary (LOW confidence)
- none

## Metadata

**Confidence breakdown:**
- Real impact numbers: HIGH — computed live from frozen data, will be the test fixtures
- Engine API / minimal analytics change: HIGH — composes existing verified primitives; `excludeSuppliers` is additive
- HHI-vs-composite monotonicity: HIGH — empirically verified non-monotonic composite + monotonic HHI
- UI wiring: HIGH — mirrors the existing chokepoints panel one-for-one

**Research date:** 2026-06-21
**Valid until:** stable while `data/top100-map.json` is frozen (this milestone). Re-derive the TSMC label set only if the dataset changes.
