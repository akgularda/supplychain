// js/analytics/index.js — pure, DOM-free concentration & criticality engine.
//
// Mirrors the shape of js/trust/index.js: no `window`, no DOM, importable under
// node:test. All math is derived from the real frozen dataset (data/top100-map.json
// via DATA) — nothing is fabricated.
//
// ASSUMPTION (equal-weight HHI): the dataset has NO per-supplier volume/share
// field — every `supplier-input` link weight `l.v` is the constant 2. A raw
// Herfindahl index over a company's suppliers therefore degenerates to 1/k
// under the forced equal-weight assumption (all k-supplier firms tie). To stay
// honest *and* interpretable we report a COMPOSITE for companies:
//     score = round(100 · (wHHI · (1/k) + wShared · sharedFrac))   [clamped 0..100]
// where sharedFrac is the fraction of a company's suppliers that are shared
// single-points (fan-in > threshold across the whole graph). Weights (0.6/0.4)
// and the sharedFrac threshold (fan-in > 1) are opts params for tunability and
// testability. See 06-RESEARCH.md (Pitfall 1, Assumptions A1/A2, OQ2).

import { DATA, normalizeEntityLabel } from "../data/index.js";

// Extract the set of distinct, normalized supplier labels for a profile.
// Mirrors buildSharedSupplierOverlapIndex supplier extraction (js/data:30-33).
function supplierSet(profile) {
  return new Set(
    (profile?.nodes || [])
      .filter((n) => n.kind === "supplier")
      .map((n) => normalizeEntityLabel((n.l || "").split("\n")[0]))
      .filter(Boolean)
  );
}

// Build supplier fan-in once: Map<normalizedSupplierLabel, Set<symbol>>.
// Mirror of buildSharedSupplierOverlapIndex internals (js/data:27-38) so keys
// match the existing overlap index exactly.
export function buildSupplierFanIn(profiles = DATA.profiles) {
  const fanIn = new Map();
  Object.entries(profiles || {}).forEach(([symbol, profile]) => {
    for (const s of supplierSet(profile)) {
      if (!fanIn.has(s)) fanIn.set(s, new Set());
      fanIn.get(s).add(symbol);
    }
  });
  return fanIn; // Map<supplierLabel, Set<symbol>>
}

// Bounded [0,100] composite concentration for one company.
export function companyConcentration(symbol, opts = {}) {
  const {
    wHHI = 0.6,
    wShared = 0.4,
    sharedThreshold = 1, // a supplier is a shared single-point when fan-in > this
    profiles = DATA.profiles,
    fanIn = buildSupplierFanIn(profiles),
  } = opts;

  const p = profiles?.[symbol];
  if (!p) return null;

  const uniq = [...supplierSet(p)];
  const k = uniq.length;
  const hhi = k ? 1 / k : 1; // equal-weight Herfindahl (no per-supplier volume in data)
  const sharedCount = uniq.filter((s) => (fanIn.get(s)?.size || 0) > sharedThreshold).length;
  const sharedFrac = k ? sharedCount / k : 0;
  const score = Math.max(
    0,
    Math.min(100, Math.round(100 * (wHHI * hhi + wShared * sharedFrac)))
  );

  return { symbol, suppliers: k, hhi, sharedCount, sharedFrac, score, n: k }; // n = #relationships used
}

// Sector-level concentration grouped by layers[node.y] (NOT profile.category;
// see RESEARCH A3). Reported as within-sector REUSE % (fraction of supplier
// slots that are redundant) plus EFFECTIVE supplier count (1/HHI), rather than
// the raw HHI·100 which is an uninterpretable 1–7 (RESEARCH Pitfall 2).
export function sectorConcentration(sector, opts = {}) {
  const {
    profiles = DATA.profiles,
    nodes = DATA.nodes,
    layers = DATA.layers,
  } = opts;

  // symbol -> sector via the global node layer index.
  const sectorBySymbol = {};
  for (const node of nodes || []) {
    if (node && node.symbol != null) sectorBySymbol[node.symbol] = layers?.[node.y];
  }

  const symbols = Object.keys(sectorBySymbol).filter(
    (s) => sectorBySymbol[s] === sector && profiles?.[s]
  );

  const counts = new Map(); // supplierLabel -> # companies in this sector using it
  let slots = 0; // total supplier slots across the sector's companies
  for (const symbol of symbols) {
    const uniq = supplierSet(profiles[symbol]);
    slots += uniq.size;
    for (const s of uniq) counts.set(s, (counts.get(s) || 0) + 1);
  }

  const distinctSuppliers = counts.size;
  // reuse% = redundant slots / total slots (slots - distinct) / slots.
  const reusePct = slots ? Math.round((100 * (slots - distinctSuppliers)) / slots) : 0;

  // Effective number of suppliers = 1 / HHI over the in-sector slot shares.
  let hhi = 0;
  if (slots) {
    for (const c of counts.values()) {
      const share = c / slots;
      hhi += share * share;
    }
  }
  const effectiveSuppliers = hhi ? 1 / hhi : 0;

  return {
    sector,
    companies: symbols.length,
    distinctSuppliers,
    slots,
    reusePct,
    effectiveSuppliers,
  };
}

// Supplier criticality = fan-in ranking (count of companies depending on each
// supplier), sorted descending. Keyed purely on real fan-in count — independent
// of the editorial d.bn flag (RESEARCH Anti-Pattern: bn is a curated company
// flag with non-contiguous ranks, NOT derivable from fan-in).
export function supplierCriticality(opts = {}) {
  const { profiles = DATA.profiles, fanIn = buildSupplierFanIn(profiles), limit } = opts;
  const ranked = [...fanIn.entries()]
    .map(([supplier, set]) => ({ supplier, fanIn: set.size }))
    .sort((a, b) => b.fanIn - a.fanIn || a.supplier.localeCompare(b.supplier));
  return typeof limit === "number" ? ranked.slice(0, limit) : ranked;
}
