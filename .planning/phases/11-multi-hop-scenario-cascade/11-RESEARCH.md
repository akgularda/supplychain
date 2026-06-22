# Phase 11: Multi-Hop Scenario Cascade - Research

**Researched:** 2026-06-22
**Domain:** Graph traversal (bounded BFS cascade) over a frozen supply-chain dataset; pure DOM-free analytics + buildless UI
**Confidence:** HIGH (all claims derived from the real `data/top100-map.json` via executed scripts, not training data)

## Summary

The REAL graph **does support a meaningful multi-hop cascade — barely, and honestly.** There are exactly **6 "bridge" edges** where a top-100 company is itself a supplier-label that another top-100 company depends on (TSM, TCEHY, ASML, AZN, AMAT, LIN). These 6 edges are what make hop-2+ possible. For the **Taiwan preset specifically, a true hop-2 exists**: disabling TSMC impacts AMAT (Applied Materials) at hop-1, and AMAT is a supplier to TSM — so TSM appears at hop-2. Result: `maxHops:1` → **7 firms / $11.36T** (unchanged v1.0 anchor); `maxHops>=2` → **8 firms / $13.28T** (adds TSM). The global graph reaches **depth 3** in a few chains and is **acyclic** — so the visited-set cycle guard is *defensive* (correct and required by CASC-01) but is not exercised by the real data; a synthetic cyclic fixture must drive that test.

The cascade is NOT shallow-to-the-point-of-uselessness, but it IS sparse: only 28 of 458 supplier labels produce any hop>=2 effect, and most cascades add 1 company. This is the honest result to document: **multi-hop is a true superset of single-hop, and on most disruptions it equals single-hop.** No edges are fabricated.

**Primary recommendation:** Extend `runScenario` with a `maxHops` param **defaulting to `1`** (NOT 3) so every existing no-`maxHops` call site and test reproduces the v1.0 result byte-for-identically. Build a company→company adjacency from the existing `fanIn` + a derived `selfLabels` map (company's own name/symbol/paren-acronym that appears as a supplier label). Add `hop` to each impacted company, a `byHop` breakdown, and `maxHopReached`. Memo key must append `|${maxHops}`. UI: set the preset/chokepoint call sites to `maxHops:3`, render a direct-vs-indirect split, and edit the Methodology copy to describe the bounded multi-hop model while **keeping the literal phrase "direct dependents"** (a wiring test matches `/single-hop|direct dependents/i`).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CASC-01 | `runScenario` propagates beyond direct dependents to multi-hop over the REAL graph, bounded + cycle-safe | Engine design §Engine; bridge-edge census proves real hop-2/3 exist; acyclic real graph confirmed so visited-set is defensive |
| CASC-02 | Output distinguishes hop levels; panel shows hop breakdown; impacted set + cap derived live (not hardcoded) | `{impactedCompanies:[{...,hop}], byHop, maxHopReached}` shape; UI §; Taiwan multi-hop = 8 firms / $13.28T derived live |
| CASC-03 | Keep `derived` badge; Methodology copy updated to explain multi-hop model + bound + assumptions (replace v1.0 "single-hop only") | UI §Methodology copy; existing `derived:true` badge path untouched; wiring-test compatibility verified |
| CASC-04 | New unit tests: termination on cycles, hop-count accuracy, multi-hop ⊇ single-hop, real fixtures; full suite green | §Validation Architecture; synthetic cyclic fixture; backward-compat anchors (7/$11.36T) preserved by default maxHops:1 |
</phase_requirements>

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Extend `runScenario(disruption, ctx)` with bounded multi-hop propagation: disrupt supplier(s) → direct dependents (hop 1) → if a dependent is itself an input/supplier to other companies, those are hop-2 impacted, etc. Traversal MUST be cycle-safe (visited set) and bounded (a `maxHops` param, sensible default).
- **Honesty rule:** the cascade traverses ONLY real edges in the graph. If the real data is shallow (few or no company-as-supplier edges), multi-hop legitimately equals single-hop for those cases — that is the honest result, documented, NOT padded. multiHop impacted set ⊇ singleHop set always.
- Output gains per-hop structure: `{impactedCompanies:[{...,hop}], byHop:{1:[...],2:[...]}, maxHopReached, totalMarketCapExposed,...}`. Pure/DOM-free; backward-compatible (single-hop = maxHops:1 behavior unchanged so v1.0 fixtures/tests stay green).
- Scenario panel shows a direct-vs-indirect hop breakdown; impacted count + market-cap exposed reflect the full multi-hop result, derived live (NO hardcoded 7 / $11.36T). Keep the honest `Derived` badge.
- Methodology copy: replace the v1.0 "single-hop only" note with the multi-hop model, its termination bound, and assumptions.
- Pure unit tests: cycle termination (synthetic cyclic fixture terminates), hop-count accuracy, multiHop ⊇ singleHop on the real dataset, maxHops bound respected, backward-compat (default/maxHops:1 reproduces the v1.0 Taiwan result: 7 firms / $11.36T). Register new test file(s) in package.json scripts.test. Keep the full 301-suite green.

### Claude's Discretion
- `maxHops` default value (CONTEXT suggested 3; see Engine §Backward-Compat Conflict — research finds default MUST be 1 to keep existing memo/fixture tests green; UI call sites pass maxHops:3 explicitly).
- Exact panel markup for the direct/indirect split.

### Deferred Ideas (OUT OF SCOPE)
- Probabilistic / weighted cascade severity → future (needs real volume data).
- FK integrity + workflow fix → Phase 12.
- Volume-weighted HHI (HHI-01) — no real volume data.
</user_constraints>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Multi-hop traversal + per-hop labeling | Analytics engine (`js/analytics/index.js`) | — | Pure, DOM-free, unit-testable; mirrors existing `runScenario` |
| Company→company adjacency derivation | Analytics engine | `js/data` (`normalizeEntityLabel`, `fanIn` keys) | Adjacency is derived from existing `fanIn` + a new `selfLabels` map; no data writes |
| Hop-breakdown rendering | UI (`js/ui/index.js` + `index.html` `#scenarioPanel`) | — | DOM-only; reads the pure engine result |
| Methodology copy | Static HTML (`index.html` methodology modal) | — | Documentation/provenance, no logic |
| Provenance badge | `js/trust` (existing `provenanceFor`/`badgeHtml`) | UI | Reuse the existing `derived:true` path unchanged |

## CRITICAL FINDING — Real 2nd-Order Edges (with counts)

**Method:** Read `data/top100-map.json` (100 profiles, 100 nodes, 186 global links). For each profile, extracted `supplier`-kind nodes, normalized the first line of `n.l` via the same rule as `normalizeEntityLabel` / `buildSupplierFanIn` / `buildSharedSupplierOverlapIndex`. Built `fanIn: Map<supplierLabel, Set<symbol>>` (matches the engine's `buildSupplierFanIn` exactly). Then matched each supplier label against every company's normalized `company` name, its `symbol`, and any parenthetical acronym in the company name. [VERIFIED: executed against data/top100-map.json]

### The 6 bridge edges (the ONLY 2nd-order-capable edges)

| Company-as-supplier (label) | Owner symbol | Depended on by | Enables hop-2 into |
|------------------------------|--------------|----------------|--------------------|
| `tsmc` | TSM | KLAC | KLAC depends on TSM |
| `tencent` | TCEHY | PRX.AS | PRX.AS depends on TCEHY |
| `asml` | ASML | TSM | TSM depends on ASML |
| `astrazeneca` | AZN | MRK | MRK depends on AZN |
| `applied materials` | AMAT | TSM | TSM depends on AMAT |
| `linde` | LIN | TSM | TSM depends on LIN |

There are **exactly 6** company→company supply edges. The real company-supply graph is **acyclic** (DFS back-edge check: none found). [VERIFIED: executed]

### Taiwan preset cascade (quantified)

Disabling the 5 TSMC label variants (`taiwan semiconductor manufacturing company (tsmc)`, `tsmc foundry capacity`, `tsmc (hbm4 and cowos collaboration)`, `tsmc n2 process technology`, `tsmc`):

| maxHops | impacted | cap exposed | byHop |
|---------|----------|-------------|-------|
| 1 | **7** | **$11.36T** (`11360589871184`) | `{1:7}` |
| 2 | 8 | $13.28T | `{1:7, 2:1}` |
| 3 | 8 | $13.28T | `{1:7, 2:1}` |
| 5 | 8 | $13.28T | `{1:7, 2:1}` |

**The real hop-2 chain:** TSMC disabled → **AMAT** impacted at hop-1 (AMAT buys from TSMC) → AMAT is a supplier-label that **TSM** depends on → **TSM** impacted at hop-2. Hop-1 set = `[000660.KS, AAPL, AMAT, AMD, AVGO, KLAC, NVDA]`; hop-2 set = `[TSM]`. [VERIFIED: executed]

### Global cascade depth census

- Distinct supplier labels: **458**. Only **28** produce any hop>=2 effect when disabled individually. [VERIFIED]
- Global maximum cascade depth over all single-supplier disruptions: **3**. [VERIFIED]
- Depth-3 chains all route through the TSM hub (e.g. `carl zeiss smt → ASML → TSM → KLAC`-style fan via the ASML/AMAT/LIN→TSM→KLAC ladder). [VERIFIED]

### Honest framing (REQUIRED in Methodology + RESEARCH)

> The cascade traverses only real edges. Real second-order edges exist but are sparse: 6 company-as-supplier bridges, max depth 3, and most disruptions add zero or one company at hop-2. Multi-hop is therefore a **true superset** of single-hop that, for the majority of disruptions, **equals** single-hop. No edges are fabricated. The Taiwan preset is one of the cases where hop-2 is non-empty (adds TSM, +$1.92T).

## Standard Stack

No new runtime dependencies. The phase is pure JS over the frozen dataset, buildless, `node --test` for tests. Existing stack:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js `node:test` | bundled (Node 18+) | Unit test runner | Already the project's only test runner; 26 files in `scripts.test` |
| Node.js `node:assert/strict` | bundled | Assertions | Used by every existing test |

No npm install needed. No external packages introduced — **§Package Legitimacy Audit is N/A** (zero new packages).

## Package Legitimacy Audit

**No external packages are installed by this phase.** All work is pure JS over the existing frozen dataset using bundled `node:test`/`node:assert`. slopcheck/registry verification is not applicable. (Existing deps `playwright`, `http-server` are unchanged.)

## Architecture Patterns

### System Architecture Diagram

```
disruption {disableSuppliers?, disableSupplier?, maxHops?}
        │
        ▼
  normalize labels (normalizeEntityLabel)  ──► disabled: Set<label>
        │
        ▼
  ┌───────────────────────── BFS over hops (bounded by maxHops, guarded by visited set) ──────────────────────────┐
  │ frontierLabels = disabled                                                                                     │
  │ hop = 1..maxHops:                                                                                              │
  │   impactedThisHop = ⋃ fanIn.get(label)  for label in frontierLabels,  minus already-visited symbols           │
  │   record hop for each new symbol; push to impactedCompanies + byHop[hop]                                       │
  │   nextFrontier = ⋃ selfLabels[sym]  for sym in impactedThisHop  (a company's own name/symbol-as-supplier)      │
  │                  minus disabled labels  ── this is the company→company bridge step                             │
  │   if nextFrontier empty OR hop==maxHops: stop                                                                  │
  └───────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
  per-symbol enrich: companyConcentration before/after (excludeSuppliers=disabled), lostSuppliers, severity, hop
        │
        ▼
  result { impactedCompanies:[{...,hop}], byHop, maxHopReached, totalMarketCapExposed, supplierCount, disabled }
        │
        ▼
  renderScenario (UI)  ──► headline (N impacted / H hops / $X.XT) + direct/indirect split + Derived badge
```

`fanIn` = existing `buildSupplierFanIn` (`Map<supplierLabel, Set<symbol>>`). `selfLabels` = NEW derived `Map<symbol, label[]>` of the company's own identity labels that appear as supplier-label keys in `fanIn`.

### Recommended Project Structure

```
js/analytics/index.js   # extend runScenario; add _buildSelfLabels + maxHops BFS (no new files)
js/ui/index.js          # renderScenario hop breakdown; pass maxHops:3 at call sites
index.html              # #scenarioPanel direct/indirect split markup; methodology copy edit
tests/scenario-cascade.test.mjs   # NEW — cascade correctness (register in package.json)
```

### Pattern 1: Bounded cycle-safe BFS with a visited set

**What:** Standard graph BFS where membership in a global `visited`/`hopOf` map prevents re-visiting a node, and a `maxHops` counter bounds depth. Both guarantees are independent: visited-set guarantees termination even on a cyclic graph; `maxHops` bounds work even on a deep acyclic graph.
**When to use:** Any propagation over a graph that may contain cycles or be arbitrarily deep.
**Example:**
```javascript
// Source: derived for this phase; mirrors the executed census script (HIGH confidence)
function _cascade(disabled, fanIn, selfLabels, maxHops) {
  const hopOf = new Map();          // symbol -> hop (the visited set; cycle guard)
  const byHop = {};                  // hop -> [symbol]
  let frontier = new Set(disabled);  // current wave of disabled supplier-labels
  let hop = 0, maxHopReached = 0;
  while (hop < maxHops) {
    hop++;
    const impactedThisHop = new Set();
    for (const label of frontier)
      for (const sym of (fanIn.get(label) || []))
        if (!hopOf.has(sym)) { hopOf.set(sym, hop); impactedThisHop.add(sym); }
    if (impactedThisHop.size === 0) break;      // nothing new -> terminate
    byHop[hop] = [...impactedThisHop];
    maxHopReached = hop;
    const next = new Set();                       // company->company bridge step
    for (const sym of impactedThisHop)
      for (const l of (selfLabels.get(sym) || []))
        if (!disabled.has(l)) next.add(l);
    if (next.size === 0) break;                   // no company is itself a supplier -> stop
    frontier = next;
  }
  return { hopOf, byHop, maxHopReached };
}
```

### Pattern 2: Deriving `selfLabels` (the bridge map) from real data

```javascript
// Source: derived; identical matching rule used in the verified census (HIGH)
function _buildSelfLabels(profiles, fanIn) {
  const selfLabels = new Map();
  for (const sym of Object.keys(profiles)) {
    const labels = new Set();
    const co = normalizeEntityLabel(profiles[sym].company || "");
    if (fanIn.has(co)) labels.add(co);
    const s = normalizeEntityLabel(sym);
    if (fanIn.has(s)) labels.add(s);
    const m = (profiles[sym].company || "").match(/\(([^)]+)\)/); // e.g. "...(TSMC)"
    if (m) { const pn = normalizeEntityLabel(m[1]); if (fanIn.has(pn)) labels.add(pn); }
    selfLabels.set(sym, [...labels]);
  }
  return selfLabels;
}
```
This yields exactly the 6 bridge entries (TSM, TCEHY, ASML, AZN, AMAT, LIN). Memoize it alongside `fanIn` (same per-session lifetime, `DATA.profiles` frozen).

### Anti-Patterns to Avoid

- **Defaulting `maxHops` to 3** (CONTEXT's suggestion): breaks the v1.0 anchor tests. See §Backward-Compat Conflict. Default to `1`; pass `3` at the UI call sites.
- **Re-disabling already-impacted company-labels:** the `next` frontier must exclude any label already in `disabled`; otherwise a company that is both disabled-as-supplier and impacted-as-company double-counts. (Real data: harmless because disabled labels are never company self-labels in the presets, but the guard is required for correctness on arbitrary input.)
- **Keying the memo without `maxHops`:** a `maxHops:1` call and a `maxHops:3` call MUST be distinct cache entries. Omitting it returns the wrong (stale-hop) result. See §Engine memo key.
- **Counting hop-2 companies' "lostSuppliers" as the disabled set:** a hop-2 company (e.g. TSM) lost its supplier *AMAT* (which is itself impacted), not TSMC directly. `lostSuppliers` for a hop-N company must be the frontier labels that reached it, not the original `disabled` set. Decide and document the per-hop `lostSuppliers` semantics (recommend: the labels in the wave that impacted it).

## Engine Design (DEFINITIVE)

### API
```javascript
runScenario(disruption = {}, ctx = {})
// disruption: { disableSuppliers?: string[], disableSupplier?: string, maxHops?: number }
//   maxHops default = 1  (single-hop == v1.0 behavior, EXACTLY)
//   maxHops also accepted via ctx.maxHops for symmetry; disruption.maxHops wins if both set
// ctx: { profiles = DATA.profiles, nodes = DATA.nodes, fanIn, selfLabels }
```

### Output shape (backward-compatible superset)
```javascript
{
  impactedCompanies: [{                 // EXISTING fields preserved; NEW: hop
    symbol, company, marketcap, lostSuppliers, suppliersBefore, suppliersAfter,
    concentrationBefore, concentrationAfter, severity,
    hop,                                // NEW: 1=direct, 2+=indirect
  }],
  byHop: { 1: [symbol,...], 2: [symbol,...] },   // NEW
  maxHopReached,                                  // NEW
  totalMarketCapExposed,                          // EXISTING — now sums ALL hops
  supplierCount,                                  // EXISTING — count of disabled labels present in graph
  disabled,                                       // EXISTING
}
```
With `maxHops:1`, `byHop` = `{1:[...]}`, `maxHopReached` = 1, and `impactedCompanies` is byte-identical to v1.0 (every existing field + a `hop:1` on each). **Verify the v1.0 tests do NOT `deepEqual` the whole impactedCompanies array** — they assert `.length`, `.map(c=>c.symbol)`, and per-field values, so adding `hop` is safe. [VERIFIED: read scenario.test.mjs — no full-object deepEqual on impactedCompanies; only field-level asserts. The one `deepEqual` is on `companyConcentration` output (back-compat) which is untouched.]

### Memo key
```javascript
// CURRENT: `${[...disabled].sort().join(",")}|${_profilesTag(profiles)}`
// NEW:     `${[...disabled].sort().join(",")}|${_profilesTag(profiles)}|h${maxHops}`
```
Append `|h${maxHops}`. This keeps the existing memo test green: `analytics-memo.test.mjs:67` runs two `maxHops`-less calls (both default to 1 → same `|h1` suffix) and asserts `builds===1`. [VERIFIED: read analytics-memo.test.mjs]

### Backward-Compat Conflict (IMPORTANT — resolve in plan)

CONTEXT §Specifics suggests `maxHops default small (e.g. 3)`. **This conflicts with two existing tests** that call `runScenario(TAIWAN_SEMI.disruption, {profiles, nodes})` with no `maxHops` and assert exactly 7 firms / $11.36T:
- `tests/scenario.test.mjs:30,37,44,49` (4 assertions, incl. exact 7 + 11360589871184)
- `tests/analytics-memo.test.mjs:60` (7 firms / 11360589871184)

A default of 3 would make those calls return 8 firms / $13.28T → **5+ test failures**, breaking the 301-suite green requirement.

**Resolution (recommended, lowest-risk):** `maxHops` default = **1**. The product UI opts into multi-hop by passing `maxHops:3` explicitly at the two call sites (`runTaiwanScenario`, `runChokepointScenario`). This satisfies:
- CASC-01/02 (engine supports + UI shows multi-hop),
- backward-compat ("default/maxHops:1 reproduces the v1.0 Taiwan result" — CONTEXT's own test wording confirms maxHops:1 is the v1.0 anchor),
- zero edits to the 2 existing fixture/memo tests.

This is the honest reading of CONTEXT: the Decisions block says *"single-hop = maxHops:1 behavior unchanged so v1.0 fixtures/tests stay green"* and the Tests block says *"default/maxHops:1 reproduces the v1.0 Taiwan result"* — i.e. **default IS maxHops:1**. The "e.g. 3" under Specifics is Claude's-discretion guidance for the *UI* default, not the engine default. Plan should note this explicitly.

## UI Design (DEFINITIVE)

### `index.html` `#scenarioPanel` (lines 330-342)
- Line 332 subtitle: change `direct downstream impact (single-hop)` → e.g. `multi-hop downstream cascade (bounded, cycle-safe)`.
- Add a hop-breakdown container after `#scenarioSummary`, e.g. `<div class="cMuted" id="scenarioHopBreakdown"></div>` (new id — mirror the additive id pattern the wiring test enforces). The wiring test `scenario-wiring.test.mjs:16` asserts the 7 existing ids are present; it does not forbid new ids, so adding one is safe. If you add an id and want it test-guarded, extend that list in the cascade test.

### `js/ui/index.js renderScenario` (lines 733-760)
- Headline: `${result.impactedCompanies.length} companies impacted across ${result.maxHopReached} hop(s) · $${(result.totalMarketCapExposed/1e12).toFixed(2)}T exposed`. Must stay derived from `.length`/`totalMarketCapExposed`/`maxHopReached` — the test forbids literals `11.36` and `7 companies impacted`. [VERIFIED: scenario-wiring.test.mjs:67-74]
- Direct/indirect split: `const direct = result.byHop[1]?.length || 0; const indirect = result.impactedCompanies.length - direct;` → render `"${direct} direct · ${indirect} indirect"`.
- Impact list: optionally group by `c.hop` or tag each row with `hop ${c.hop}`. Keep `escapeHtml` on every label (T-07-03 contract).
- Keep the `provenanceFor({derived:true, n})` badge path unchanged (CASC-03).
- Call sites `runTaiwanScenario` (770) and `runChokepointScenario` (782): add `maxHops: 3` to the disruption (or ctx) object.

### Methodology copy (`index.html` line 160) — replace, keep "direct dependents"
Replace the `<li><strong>Single-hop only.</strong> ...</li>` bullet with a multi-hop description. **Constraint:** `scenario-wiring.test.mjs:58` asserts `/single-hop|direct dependents/i`. Keep the literal phrase **"direct dependents"** so that regex stays satisfied. Suggested copy:
> **Bounded multi-hop cascade.** The model starts from the disabled suppliers' *direct dependents* (hop 1), then propagates to companies that depend on an impacted firm which is itself a supplier (hop 2+). Traversal is **cycle-safe** (a visited set guarantees termination) and **bounded** (at most N hops). Real second-order edges are sparse — most disruptions add no indirect impact, so multi-hop often equals the direct-dependent set. No edges are fabricated.

Also update lines 162-163 (exposure-not-loss + TSMC bullets) — they must remain because wiring asserts `exposure`, `not a loss|exposure, not`, `tsmc|taiwan`, `HHI`. [VERIFIED: scenario-wiring.test.mjs:57-63]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Supplier→company index | A second fan-in builder | Existing `buildSupplierFanIn` (memoized) | Already keyed to the normalized label contract; reuse keeps keys identical |
| Label normalization | Custom lowercasing/trim | `normalizeEntityLabel` | The fanIn keys are built with it; any divergence silently misses edges |
| Per-company concentration before/after | Recompute HHI inline | `companyConcentration({excludeSuppliers})` | Already memoized + excludeSig in cache key; the hop-1 path already uses it |
| Cycle detection / termination | A recursion-depth heuristic | A `visited`/`hopOf` Set membership check | The textbook guarantee; works on cyclic AND acyclic graphs |

**Key insight:** the entire engine is a thin BFS wrapper over two already-correct, already-memoized primitives (`fanIn`, `companyConcentration`). The only genuinely new derived structure is `selfLabels` (6 entries on real data).

## Runtime State Inventory

> This is a code/logic + copy change over a **frozen** dataset. No rename/migration.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — `data/top100-map.json` is frozen and NOT modified (no new edges, no fabrication). Verified: cascade reads existing supplier nodes only. | None |
| Live service config | None — buildless static site, no external services touched. | None |
| OS-registered state | None. | None |
| Secrets/env vars | None. | None |
| Build artifacts | None — buildless; no compiled output. New test file is source only. | None |

**Nothing found in any category — verified: the phase adds traversal logic + UI copy, mutates no data.**

## Common Pitfalls

### Pitfall 1: Default maxHops breaks v1.0 anchors
**What goes wrong:** Setting engine default `maxHops>1` flips Taiwan from 7→8 firms, breaking 5+ existing assertions.
**Why:** Two test files call `runScenario` with no `maxHops` and assert exactly 7 / $11.36T.
**How to avoid:** Engine default = 1; UI passes `maxHops:3`.
**Warning signs:** `scenario.test.mjs` / `analytics-memo.test.mjs` red after the engine edit.

### Pitfall 2: Memo collision across hop depths
**What goes wrong:** A `maxHops:1` then `maxHops:3` call on the same disabled set returns the cached 1-hop result.
**Why:** Cache key omits `maxHops`.
**How to avoid:** Append `|h${maxHops}` to `scenarioKey`.
**Warning signs:** UI shows 7 firms even after opting into maxHops:3; or hop-count test flickers under caching.

### Pitfall 3: Label-mismatch silently drops bridge edges
**What goes wrong:** Building `selfLabels` with a different normalization than `fanIn` finds 0 bridges.
**Why:** `fanIn` keys come from `normalizeEntityLabel(n.l.split("\n")[0])`; company names/symbols must be normalized the same way.
**How to avoid:** Use `normalizeEntityLabel` for `company`, `symbol`, and paren-acronym. Assert in test that `selfLabels` has the 6 expected owners (TSM, TCEHY, ASML, AZN, AMAT, LIN).
**Warning signs:** multi-hop === single-hop for the Taiwan preset (should be 8 not 7 at maxHops>=2).

### Pitfall 4: Treating absence of cycles as "no guard needed"
**What goes wrong:** Skipping the visited set because real data is acyclic → CASC-01 ("cycle-safe") unmet and a future data edit could hang.
**Why:** Real graph is acyclic *today*; the requirement is structural.
**How to avoid:** Always use the `hopOf`/visited Set. Prove it with a synthetic cyclic fixture test.
**Warning signs:** No synthetic-cycle test; reliance on `maxHops` alone for termination.

## Code Examples

### Wiring maxHops into runScenario (preserving the existing structure)
```javascript
// Source: js/analytics/index.js:250-271 extended (HIGH — based on read of current file)
export function runScenario(disruption = {}, ctx = {}) {
  const { profiles = DATA.profiles, nodes = DATA.nodes, fanIn } = ctx;
  const fan = fanIn || buildSupplierFanIn(profiles);
  const selfLabels = ctx.selfLabels || buildSelfLabels(profiles, fan); // memoized
  const maxHops = Math.max(1, Number(disruption.maxHops ?? ctx.maxHops ?? 1));

  const disabled = new Set(
    [...(disruption.disableSuppliers || []),
     ...(disruption.disableSupplier ? [disruption.disableSupplier] : [])]
      .map((s) => normalizeEntityLabel(s)).filter(Boolean)
  );

  const scenarioKey =
    `${[...disabled].sort().join(",")}|${_profilesTag(profiles)}|h${maxHops}`;
  return _memo("scenario", scenarioKey, () =>
    _runScenarioCompute(disabled, profiles, nodes, fan, selfLabels, maxHops)
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `runScenario` single-hop only (v1.0) | Bounded multi-hop BFS, default maxHops:1 (back-compat), UI opts into 3 | Phase 11 | True superset; Taiwan 8 firms / $13.28T at multi-hop |

**Deprecated/outdated:**
- Methodology "Single-hop only ... out of scope for v1" bullet → replaced by the bounded multi-hop description (keep the phrase "direct dependents").

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Engine `maxHops` default should be **1** (not 3) and UI opts into 3 | Engine §Backward-Compat | If planner instead edits the 2 fixture tests to expect 8/$13.28T, that's an alternative path — but it changes "v1.0 anchors" and risks the no-fabrication/credibility framing. Default-1 is lower-risk and matches CONTEXT's test wording. |
| A2 | Per-hop `lostSuppliers` semantics for hop>=2 = the frontier labels that reached the company (e.g. TSM lost "applied materials") | Engine / Anti-Pattern | If planner wants hop-2 `lostSuppliers` to list the original disabled set instead, the displayed "lost suppliers" for TSM would be misleading. Recommend frontier-label semantics; confirm in plan. |
| A3 | Adding a `hop` field to each `impactedCompanies` entry does not break any test | Engine §Output | Verified no full-array deepEqual exists in scenario.test.mjs; but a future plan-checker should re-grep for `deepEqual.*impactedCompanies` before finalizing. |

## Open Questions

1. **Should the bridge match be widened beyond exact name/symbol/paren-acronym?**
   - What we know: exact matching yields 6 bridges; the data uses inconsistent supplier labels (e.g. "msd (merck)", "intel foundry" are NOT top-100 self-labels but appear in the depth census via other companies).
   - What's unclear: whether the plan wants a curated alias map to catch e.g. "intel foundry"→INTC. That risks editorializing edges.
   - Recommendation: keep exact matching (honest, no curation). Document the 6 bridges as the complete set. Do NOT add an alias map (would border on fabrication).

2. **Cycle test fixture shape.**
   - What we know: real graph is acyclic, so the cycle guard needs a synthetic fixture (profiles where A is supplier to B and B is supplier to A).
   - Recommendation: build a tiny `{profiles, nodes}` fixture inline in the cascade test (2-3 companies, a real 2-cycle) and assert the run terminates and visits each once.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js + `node:test` | All tests | ✓ | Node 18+ (project standard) | — |
| `data/top100-map.json` | Engine + tests | ✓ | frozen, 1.57 MB, 100 profiles | — |

No missing dependencies. No external services. No network.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js `node:test` + `node:assert/strict` (bundled) |
| Config file | none — files listed explicitly in `package.json` `scripts.test` |
| Quick run command | `node --test tests/scenario-cascade.test.mjs tests/scenario.test.mjs tests/analytics-memo.test.mjs` |
| Full suite command | `npm test` (must stay green; currently the 301-assertion suite across 26 files) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CASC-01 | Cascade terminates on a synthetic 2-cycle (visited set) | unit | `node --test tests/scenario-cascade.test.mjs` | ❌ Wave 0 |
| CASC-01 | `maxHops` bound respected (maxHops:1 stops at hop 1) | unit | same | ❌ Wave 0 |
| CASC-01 | Hop-count accuracy: Taiwan maxHops:3 → byHop {1:7,2:1}, maxHopReached 2 | unit | same | ❌ Wave 0 |
| CASC-01/04 | multi-hop impacted ⊇ single-hop impacted on REAL data (8 ⊇ 7, TSM added) | unit | same | ❌ Wave 0 |
| CASC-02 | `selfLabels` derives exactly the 6 bridges (TSM,TCEHY,ASML,AZN,AMAT,LIN) | unit | same | ❌ Wave 0 |
| CASC-02 | UI headline derived live (no `11.36`, no `7 companies impacted`) | wiring | `node --test tests/scenario-wiring.test.mjs` | ✅ extend |
| CASC-02 | `#scenarioPanel` hop-breakdown id present | wiring | same | ✅ extend |
| CASC-03 | Methodology copy describes multi-hop + bound + keeps "direct dependents"/exposure/HHI/TSMC | wiring | same | ✅ extend |
| CASC-03 | `derived:true` badge still rendered | wiring | same | ✅ exists |
| CASC-04 (back-compat) | maxHops:1 / default reproduces 7 firms / `11360589871184` | unit | `node --test tests/scenario.test.mjs tests/analytics-memo.test.mjs` | ✅ exists (must stay green) |
| CASC-04 (back-compat) | memo key includes maxHops (1-hop vs 3-hop distinct entries; equivalent shapes still collide) | unit | `node --test tests/analytics-memo.test.mjs` (+ new cascade memo test) | ✅ extend |

### Sampling Rate
- **Per task commit:** `node --test tests/scenario-cascade.test.mjs tests/scenario.test.mjs tests/analytics-memo.test.mjs tests/scenario-wiring.test.mjs`
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full `npm test` green before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] `tests/scenario-cascade.test.mjs` — covers CASC-01/02/04: cycle termination (synthetic fixture), maxHops bound, hop-count accuracy, multi-hop ⊇ single-hop on real data, the 6-bridge `selfLabels` assertion, and memo-key-includes-maxHops.
- [ ] Register `tests/scenario-cascade.test.mjs` in `package.json` `scripts.test` (append to the `node --test ...` list).
- [ ] Extend `tests/scenario-wiring.test.mjs` for the new hop-breakdown id + multi-hop methodology phrasing (optional but recommended).
- [ ] Framework install: none — `node:test` is bundled.

## Security Domain

Static buildless public site, no auth/sessions/network/user input in this phase. The only untrusted-ish strings are supplier/company labels rendered into the panel — already mitigated by the existing `escapeHtml` contract (T-07-03), which MUST be applied to any new label rendered in the hop breakdown.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation / Output Encoding | yes | `escapeHtml` on every label before `innerHTML` (existing contract) |
| V2/V3/V4 Auth/Session/Access | no | No auth surface (public static site) |
| V6 Cryptography | no | None |

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via supplier/company label in panel | Tampering | `escapeHtml(...)` before innerHTML (already enforced in renderScenario) |

## Sources

### Primary (HIGH confidence)
- `data/top100-map.json` (executed analysis: bridge-edge census, Taiwan cascade simulation, depth census, cycle detection) — the definitive source for all edge/count claims.
- `js/analytics/index.js` (read: runScenario, _memo, companyConcentration, buildSupplierFanIn, SCENARIO_PRESETS) — engine extension points.
- `js/data/index.js` (read: normalizeEntityLabel, buildSharedSupplierOverlapIndex supplier extraction) — normalization contract.
- `tests/scenario.test.mjs`, `tests/analytics-memo.test.mjs`, `tests/scenario-wiring.test.mjs` (read) — backward-compat constraints + wiring regexes.
- `index.html` (read: #scenarioPanel lines 330-342, methodology lines 155-164) — UI/copy edit points.

### Secondary (MEDIUM confidence)
- None required — all claims verified against the frozen dataset directly.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Real 2nd-order edges (6 bridges, Taiwan hop-2 = TSM, depth 3, acyclic): HIGH — executed against the actual dataset.
- Engine design + backward-compat (default maxHops:1, memo key): HIGH — verified against the exact assertions in scenario.test.mjs / analytics-memo.test.mjs.
- UI/Methodology edits: HIGH — verified against the wiring-test regexes that must stay green.
- Per-hop `lostSuppliers` semantics for hop>=2: MEDIUM — a design choice (A2), flagged for plan confirmation.

**Research date:** 2026-06-22
**Valid until:** Stable until `data/top100-map.json` changes (frozen) — re-run the census if the dataset is regenerated.
