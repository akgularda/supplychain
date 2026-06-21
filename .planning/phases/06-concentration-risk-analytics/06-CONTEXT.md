# Phase 6: Concentration & Risk Analytics - Context

**Gathered:** 2026-06-21
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous)

<domain>
## Phase Boundary

Let investors instantly grasp WHERE supply-chain risk concentrates: (1) a quantified concentration score
per company and per sector/layer, computed from REAL data; (2) risk/bottleneck analytics that highlight the
critical single points of failure in the network; (3) every displayed analytic carries HONEST provenance
consistent with the Phase 2–3 trust layer — derived numbers are tagged as derived/estimated with a
methodology reference, never presented as unsourced "observed" facts. Builds on the existing overlap index
and bottleneck flag. Out of scope: scenario stress-tests / "what-if" simulation (Phase 7), performance
internals (Phase 8), mobile (Phase 9), data changes.
</domain>

<decisions>
## Implementation Decisions

### Concentration score (DEPTH-01) — real-data-derived, pure
- Add pure analytics functions (in js/data or a new js/analytics module, DOM-free + unit-testable):
  - **Per-company supplier concentration**: how dependent a company is on few/shared suppliers — e.g. an
    HHI-style (Herfindahl) index over its suppliers, or the share of its supply represented by its top
    suppliers, plus how many of its suppliers are shared single-points (from supplierToSymbols). Output a
    bounded, interpretable score (e.g. 0–100) + a short interpretation.
  - **Per-sector/layer concentration**: aggregate concentration across a layer (how few suppliers serve the
    whole layer). Bounded score.
- Display per company (profile panel) and per sector (layer view / a small panel). Use real graph data only.

### Risk / bottleneck analytics (DEPTH-02)
- Compute supplier CRITICALITY from the real graph: a supplier depended on by many companies (high fan-in
  via supplierToSymbols) is a single point of failure. Rank and surface the top critical single-points
  (e.g. a "Critical chokepoints" list/highlight) — quantified, not just the existing boolean d.bn flag.
  Reconcile with / enrich the existing `d.bn` bottleneck signal.
- Provide a highlight/affordance so investors can see the chokepoints in the graph (reuse highlightBy).

### Provenance of derived analytics (DEPTH-02 / trust consistency)
- These are COMPUTED aggregates, not source facts. Tag each displayed analytic with an honest "derived"
  provenance state (extend the Phase-2 trust module with a `derived` tag or reuse estimated + a "computed
  from N relationships" note) linking to the Methodology view. Update the Methodology copy to explain the
  concentration + criticality formulas and their inputs. NEVER show a derived number as observed/unsourced.

### Tests
- Pure unit tests for concentration (bounds, monotonicity: more shared/fewer suppliers → higher
  concentration) and criticality (a supplier serving more companies ranks higher), plus string/wiring tests
  for display + derived-provenance tagging. Register new test files in package.json scripts.test. Keep the
  full suite (214) green.
</decisions>

<code_context>
## Existing Code Insights
- js/data: buildSharedSupplierOverlapIndex / getTopOverlap / supplierToSymbols (fan-in basis); profiles[].nodes (kind==='supplier'); links; bottleneck flag d.bn.
- js/trust (Phases 2–3): provenanceFor/confidenceScore/badge — extend with a derived/estimated tag for computed analytics.
- js/viz highlightBy for chokepoint highlight; js/ui profile panel + methodology modal for display + formula docs.
- Gate: `npm test` (214) runs only files in package.json scripts.test — register new ones. Buildless; data frozen.
</code_context>

<specifics>
## Specific Ideas
- Concentration shown as "Supplier concentration: NN/100 (HHI-based)" in the profile, with a derived badge + methodology link.
- "Critical chokepoints" panel: top N suppliers by number of dependent companies, with counts (real), highlightable in the graph.
</specifics>

<deferred>
## Deferred Ideas
- "What-if" disruption scenarios over these analytics → Phase 7.
- Memoized recompute / perf → Phase 8.
</deferred>
