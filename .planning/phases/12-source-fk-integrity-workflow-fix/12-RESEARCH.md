# Phase 12: Source-FK Integrity & Workflow Fix - Research

**Researched:** 2026-06-22
**Domain:** Data-integrity FK reconnection (honest, no fabrication) + GitHub Actions YAML quoting fix
**Confidence:** HIGH (all FK counts and resolvability computed directly from the frozen dataset; yml fix verified against the live file and the gated test suite)

## Summary

The dataset (`data/top100-map.json` and the byte-equivalent served `data/top100-map.js`) contains exactly **75 dangling source-FK usages** (`node.sourceId` + `link.sf` references whose id is absent from that profile's own `sources` array). These collapse to **9 distinct `(profile, fkId)` pairs** across 9 profiles. Provenance is resolved **profile-scoped** — `sourceIndex` is built per-profile from `p.sources` (js/ui/index.js:340, 657; js/data/index.js:167), so an id only resolves if it exists in the *same* profile's sources.

Applying strict, conservative resolution rules (normalized-id match, id/title substring, canonical-shared-source match — never a fabricated or unrelated source), the honest result is:

- **3 distinct pairs / 27 FK usages are genuinely resolvable** — all three are the FK `swift-payments` in profiles **C (Citigroup), SAN (Santander), 601628.SS (China Life)**. `swift-payments` is a **real, canonical shared source** with a single byte-identical definition (`title:"SWIFT payments network overview"`, `url:"https://www.swift.com/payments"`) already present in **7 sibling bank/insurer profiles** (BAC, HSBC, MUFG, 1398.HK, 601288.SS, 601939.SS, CBA.AX). Reconnecting these three is NOT fabrication — it points the FK at the identical real source the dataset already cites elsewhere, on banking/financial demand nodes that semantically match.
- **6 distinct pairs / 48 FK usages are truly orphaned** — `novo-sustainability`, `amgn-products`, `txn-products`, `klac-products`, `tmo-business`, `gild-products`. None of these ids exist as a real source **anywhere** in the dataset; there is no near-miss id, no title match, no canonical sibling. Reconnecting any of them would require inventing a source. They stay honestly at the Unknown floor.

**Conservatism flag on 601628.SS:** China Life is a *life insurer*, not a payments bank. The SWIFT-settlement link on life-insurance demand nodes is weaker than for C/SAN. The dataset author deliberately cited `swift-payments` as generic "settlement infrastructure context" for financial firms (it appears on 601288.SS and 601939.SS — Chinese *banks*). Two defensible counts exist: **strict = 2** (C, SAN only) or **broad = 3** (incl. 601628.SS). Recommendation: resolve all 3 (the source is identical and the author's intent is explicit), but surface the strict/broad split to the planner/discuss for a final call.

**Primary recommendation:** Add a pure, profile-scoped `resolveSourceId(fkId, ctx)` in `js/data/index.js` that returns a real source object or `null` using a single safe rule — a `CANONICAL_SHARED_SOURCES` allow-list keyed on `swift-payments` → the verbatim existing SWIFT source. Wire it into the `sourceIndex` build so `provenanceFor` transparently resolves. Update the Methodology copy in `index.html:168` to "27 of 75 ... resolve; 48 remain at the Unknown floor." Fix the yml quote on line 34. Leave the frozen `data/` JSON untouched (code-level resolver). Register two new `.mjs` tests in `package.json` scripts.test; keep the suite green (313 → 313 + new test files' cases).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| FK resolution (dangling → real source) | Data layer (`js/data/index.js`) | Trust core (`js/trust/index.js` consumes resolved `sourceIndex`) | Resolution is a pure data transform; trust core already accepts a `ctx.sourceIndex` and must stay fabrication-free |
| Provenance badge / source link | Trust core (`provenanceFor`/`badgeHtml`) | UI (`js/ui/index.js` renders) | Already implemented; only needs a richer `sourceIndex` |
| Methodology disclosure copy | Static HTML (`index.html`) | Test gate (`methodology-wiring.test.mjs`) | Copy is the honest public record of remaining-Unknown count |
| Weekly data refresh | CI/CD (`auto-update-data.yml`) | — | Pure infrastructure; cosmetic shell-quoting bug, no app code touched |

## Standard Stack

No new runtime dependencies. This phase is buildless and uses the repo's existing stack.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `node:test` | node 20 | Test runner for the new `.mjs` integrity tests | Already the only test runner in `package.json` scripts.test |
| Node.js `node:assert/strict` | node 20 | Assertions | Repo convention across all 28 test files |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Code-level resolver allow-list | Edit the frozen `data/*.json`/`.js` to add `swift-payments` to C/SAN/601628 source arrays | A data edit only maps to a REAL existing source, so it would also be honest — but it mutates the frozen contract and risks `data-shape`/`data` snapshot drift. CONTEXT prefers a code-level resolver. Keep JSON frozen. |

**Installation:** None — no packages added.

## Package Legitimacy Audit

Not applicable — this phase installs **zero** external packages. All work uses Node.js built-ins (`node:test`, `node:assert`, `node:fs`) already in use across the repo. No registry interaction, no `npm install`.

## Architecture Patterns

### System Architecture Diagram

```
data/top100-map.js (frozen)              CANONICAL_SHARED_SOURCES (new, js/data)
   profiles[sym].sources[]  ───┐            { "swift-payments": {id,title,url,note} }
   profiles[sym].nodes[].sourceId          │
   profiles[sym].links[].sf      │         │
                                 ▼         ▼
              graphForMode()/UI builds sourceIndex
              sourceIndex = { ...fromOwnSources, ...resolveSharedFKs(profile) }
                                 │
                                 ▼
              provenanceFor(node|link, { sourceIndex, meta })   (js/trust, PURE)
                 fk = input.sourceId ?? input.sf
                 src = sourceIndex[fk]            ← now resolves swift-payments
                 src?.url ? {tag, source:{label,url}} : {tag}   ← Unknown floor for orphans
                                 │
                                 ▼
              badgeHtml(prov) → "source ↗" link (resolved) OR "Unknown" (orphan)
```

The resolver injects ONLY canonical-shared real sources into the per-profile `sourceIndex`. Orphan FKs (`*-products`, `*-business`, `novo-sustainability`) find nothing and degrade to `{tag}` — the existing honest Unknown floor (js/trust/index.js:50–57). No `provenanceFor` logic change is required; the only change is enriching `sourceIndex` at the two build sites.

### Pattern 1: Pure profile-scoped resolver (recommended)
**What:** A pure function returning a real source or `null`, plus a small allow-list of canonical shared sources verified to already exist in the dataset.
**When to use:** At every `sourceIndex` build site in the UI.
**Example:**
```javascript
// js/data/index.js — new export. Verbatim copy of the existing canonical source.
// Source: data/top100-map.json — swift-payments defined identically in 7 bank profiles.
const CANONICAL_SHARED_SOURCES = {
  "swift-payments": {
    id: "swift-payments",
    title: "SWIFT payments network overview",
    url: "https://www.swift.com/payments",
    note: "Industry settlement and messaging infrastructure context for global banks.",
  },
};

// Pure: returns a REAL source object or null. ctx.ownIds = Set of the profile's own source ids.
// Rule order (conservative): own source wins; else canonical-shared allow-list; else null.
function resolveSourceId(fkId, ctx = {}) {
  if (!fkId) return null;
  if (ctx.ownSources && ctx.ownSources[fkId]) return ctx.ownSources[fkId]; // already present
  if (Object.prototype.hasOwnProperty.call(CANONICAL_SHARED_SOURCES, fkId)) {
    return CANONICAL_SHARED_SOURCES[fkId];
  }
  return null; // truly orphaned → caller leaves it at the Unknown floor
}
```

**Consuming side (js/ui/index.js:340 and :657, and graphForMode sourceIndex at js/data:167):**
```javascript
// Build the per-profile sourceIndex, then layer in canonical-shared resolutions.
const ownSources = Object.fromEntries((profile?.sources || []).map(s => [s.id, s]));
const sourceIndex = { ...ownSources };
for (const n of (profile?.nodes || [])) {
  const r = resolveSourceId(n.sourceId, { ownSources });
  if (r && !sourceIndex[n.sourceId]) sourceIndex[n.sourceId] = r;
}
for (const l of (profile?.links || [])) {
  const r = resolveSourceId(l.sf, { ownSources });
  if (r && !sourceIndex[l.sf]) sourceIndex[l.sf] = r;
}
// provenanceFor(node|link, { sourceIndex, meta: DATA.meta }) — unchanged.
```

### Anti-Patterns to Avoid
- **Inventing a source for `*-products`/`*-business`/`novo-sustainability`:** Forbidden by the hard rule. These ids exist nowhere as real sources. Leave at Unknown.
- **Cross-profile fuzzy/substring matching `*-products` → `*-suppliers`:** Tempting (e.g. `amgn-products` → `amgn-suppliers`) but it points a *product/channel* FK at a *supplier* source — an unrelated source. Conservative rule rejects it.
- **Mutating the frozen `data/` JSON to add the resolution:** Avoid; use the code-level allow-list to keep the contract intact and `data-shape`/snapshot tests stable.
- **Resolving `swift-payments` for a non-financial profile:** The allow-list keys on the id; only profiles that actually reference `swift-payments` (the 3 financial firms) consume it, so there is no spillover.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| FK → source lookup | A new bespoke index/cache | Extend the existing per-profile `sourceIndex` + `provenanceFor` | Already pure, tested, fabrication-guarded |
| "Unknown floor" degradation | New unknown-handling branch | Existing `provenanceFor` returns `{tag}` when no source resolves (js/trust:56) | Zero new code path; already the honest behavior |
| YAML validity check | Custom YAML parser test | String-presence assertion (repo convention, see `data-shape.test.mjs`) | Matches the buildless, no-DOM test style |

**Key insight:** The honest integrity fix is overwhelmingly *subtraction* (verifying what is NOT resolvable) plus one tiny allow-list. The value is the verified count + documentation, not a code-heavy resolver.

## Runtime State Inventory

This is a code/data-integrity + CI-config phase, not a rename/migration. The relevant "state" is the frozen dataset and the served JS.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `data/top100-map.json` (1.57 MB) + served `data/top100-map.js` (1.52 MB) — byte-equivalent profile data; 75 dangling FK usages in BOTH. `data/top100-map-updated.json` (flat shape, used by `auto-update-script.test.mjs`) is unrelated to FK integrity. | None — keep frozen; resolver is code-level. If a data edit is ever chosen, it must touch BOTH `.json` and `.js` identically and only add the REAL `swift-payments` source. |
| Live service config | GitHub Actions `auto-update-data.yml` weekly cron (Mon 06:00 UTC). | Fix line 34 quote only; cron/deploy untouched. |
| OS-registered state | None. | None — verified: no OS-level registrations involved. |
| Secrets/env vars | `NODE_TLS_REJECT_UNAUTHORIZED: '0'` in yml (line 39) — unrelated to the fix. | None. |
| Build artifacts | Buildless project; `data/top100-map.js` is hand-maintained, not generated from `.json`. | If choosing a data edit over the resolver, regenerate/sync `.js` from `.json` by hand. Resolver approach avoids this entirely. |

**The key question — what runtime state still holds the old value after a repo edit?** With the code-level resolver, *nothing*: the data stays frozen, and the resolver is evaluated at render time from the live `sourceIndex`.

## Common Pitfalls

### Pitfall 1: Breaking `methodology-wiring.test.mjs:51` (`/\b75\b/`)
**What goes wrong:** That test asserts the literal `75` appears in the Methodology copy. Changing the copy to "27 of 75 ... 48 remain" KEEPS `75` present, so it still passes — but if the new copy drops the number 75 entirely, the test fails.
**Why it happens:** The copy is the honest public record and the test pins the number.
**How to avoid:** New copy MUST still contain `75` (total) AND now `27` (resolved) and `48` (remaining). Update the new test to assert all three.
**Warning signs:** `npm test` red on `methodology copy states the REAL dataset facts`.

### Pitfall 2: 601628.SS over-resolution (semantic mismatch)
**What goes wrong:** Counting China Life's `swift-payments` as resolvable when SWIFT settlement is a weak fit for a life insurer.
**Why it happens:** The id matches a canonical real source, but the consuming nodes are life-insurance demand, not payments.
**How to avoid:** Surface the strict(2)/broad(3) split to discuss/planner. Default to broad (3) because the dataset author explicitly cites `swift-payments` as "settlement infrastructure context" for financial firms, but make the choice explicit, not silent.
**Warning signs:** A reviewer asking "why does a life insurer link to SWIFT payments?"

### Pitfall 3: Editing only `.json` and not the served `.js`
**What goes wrong:** If a data edit is chosen, editing `top100-map.json` alone leaves the *served* `top100-map.js` (what the browser actually loads) unchanged — the fix never reaches users.
**Why it happens:** Two files carry the same data; only `.js` is served.
**How to avoid:** Prefer the code-level resolver (no data edit). If a data edit is unavoidable, mirror it in BOTH files and re-run `data-shape.test.mjs`.

### Pitfall 4: yml — fixing the quote but not the redirection quoting
**What goes wrong:** Fixing only the first quote and leaving `$GITHUB_OUTPUT` unquoted.
**How to avoid:** Apply the full CONTEXT-specified correction (quote both the value and `"$GITHUB_OUTPUT"`).

## Code Examples

### The exact `index.html` Methodology copy change (line 168)
```html
<!-- BEFORE (index.html:168) -->
<li>About <strong>75 dangling source references</strong> (source FKs that do not resolve to a listed source) remain in the dataset; figures behind them score at the Unknown floor.</li>

<!-- AFTER (honest resolved/remaining counts) -->
<li>Of <strong>75 previously-dangling source references</strong> (source FKs without a listed source), <strong>27 now resolve</strong> to a real, already-cited source (the SWIFT payments network, shared across global-bank profiles); the remaining <strong>48</strong> have no real matching source and stay honestly at the Unknown floor.</li>
```

### The exact `auto-update-data.yml` fix (INFRA-01, line 34)
```yaml
# BEFORE (line 34) — closing quote misplaced, redirection captured inside the string:
        run: echo "timestamp=$(date +%Y%m%d-%H%M%S) >> $GITHUB_OUTPUT"

# AFTER — value quoted, redirection outside the string, GITHUB_OUTPUT quoted:
        run: echo "timestamp=$(date +%Y%m%d-%H%M%S)" >> "$GITHUB_OUTPUT"
```
The rest of the workflow (cron `0 6 * * 1`, `workflow_dispatch`, the data-validation step on line 42, git commit/push, step summaries) is unaffected. No test in the gated `npm test` list parses the yml (`auto-update-country-data.test.mjs` references it but only checks `existsSync`, and it is NOT in `package.json` scripts.test).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| All 75 FKs at Unknown floor | 27 resolve to a real shared source; 48 honest Unknown | This phase | Real source links appear for 3 financial-firm profiles; honest count documented |

**Deprecated/outdated:** The Methodology line stating "About 75 dangling ... remain" becomes the resolved/remaining split.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | China Life (601628.SS) `swift-payments` is honestly resolvable (broad count = 3). Strict count = 2 (C, SAN only). | Summary / Pitfall 2 | If rejected, resolved=18 usages/2 pairs, remaining=57/7. Methodology copy and tests must use the chosen numbers. **Needs discuss/planner confirmation.** |
| A2 | Resolving `swift-payments` to the canonical existing SWIFT source is not "fabrication" because the identical source object already exists in 7 sibling profiles. | Summary | Low — the source title/url are verbatim from the dataset, not invented. If treated as fabrication, resolved=0 and all 75 stay Unknown (still a valid, honest outcome per CONTEXT). |

**Note:** All numeric FK counts (75 usages, 9 pairs, 27/48 split) are `[VERIFIED: data/top100-map.json computed]`. Only the *resolvability judgment* for 601628.SS (A1) and the fabrication-boundary judgment (A2) are assumptions requiring confirmation.

## Open Questions

1. **Strict (2) vs broad (3) resolvable count for `swift-payments`.**
   - What we know: id is a real canonical source in 7 bank profiles; C/SAN are banks, 601628.SS is a life insurer.
   - What's unclear: whether the SWIFT link is appropriate for a life insurer's demand nodes.
   - Recommendation: default broad (3) with the rationale documented; let discuss/planner downgrade to strict (2) if desired. Either way the copy + tests use the chosen numbers.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INTG-01 | Dangling FKs that resolve to a real existing source are reconnected; resolved count reported | `resolveSourceId` + `CANONICAL_SHARED_SOURCES` allow-list resolves `swift-payments` (27 usages / 3 pairs) to the verbatim existing SWIFT source; count = 27 (broad) or 18 (strict) |
| INTG-02 | FKs with no real match stay at Unknown floor; no fabricated sources; remaining count in Methodology | 48 usages / 6 pairs (`*-products`, `*-business`, `novo-sustainability`) have no real source anywhere → existing `provenanceFor` Unknown floor; Methodology copy updated (index.html:168) |
| INTG-03 | New tests assert resolved-vs-remaining + zero fabricated sources; `data/` contract intact | Tests compute counts directly from `data/top100-map.json`/`.js`, assert every resolved FK maps to a source id that pre-existed in the dataset, and assert the served `.js` is unchanged (resolver is code-level) |
| INFRA-01 | yml timestamp quoting fixed; workflow valid; tests/cron/deploy intact | Exact one-line fix (line 34) provided; gated suite does not parse the yml; cron/deploy untouched |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` + `node:assert/strict` (node 20) |
| Config file | none — test files enumerated in `package.json` scripts.test |
| Quick run command | `node --test tests/<new-file>.test.mjs` |
| Full suite command | `npm test` (currently 313 cases, all green — verified this session) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INTG-01 | Exactly 27 (broad) / 18 (strict) FK usages resolve via the allow-list; 3/2 distinct pairs; all to `swift-payments` | unit | `node --test tests/source-fk-integrity.test.mjs` | ❌ Wave 0 |
| INTG-02 | 48/57 usages remain orphaned → Unknown floor; remaining-Unknown count present in `index.html` Methodology copy | unit | `node --test tests/source-fk-integrity.test.mjs` | ❌ Wave 0 |
| INTG-03 | Every resolved FK target id pre-existed as a REAL source in the dataset (zero fabrication); served `data/top100-map.js` dangling-usage count unchanged (contract intact) | unit | `node --test tests/source-fk-integrity.test.mjs` | ❌ Wave 0 |
| INFRA-01 | `auto-update-data.yml` line has `echo "timestamp=...$(...)" >> "$GITHUB_OUTPUT"` and NOT `>> $GITHUB_OUTPUT` inside the quoted echo | unit | `node --test tests/workflow-timestamp-quote.test.mjs` | ❌ Wave 0 |
| INTG-02 | Methodology copy still cites 75 AND new 27/48 (so `methodology-wiring.test.mjs` stays green) | regression | `node --test tests/methodology-wiring.test.mjs` | ✅ exists (update assertions) |

### Sampling Rate
- **Per task commit:** `node --test tests/source-fk-integrity.test.mjs tests/workflow-timestamp-quote.test.mjs tests/methodology-wiring.test.mjs`
- **Per wave merge:** `npm test`
- **Phase gate:** Full `npm test` green (313 + new cases) before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] `tests/source-fk-integrity.test.mjs` — covers INTG-01/02/03 (resolved count, orphan count, zero-fabrication, contract-unchanged). Loads `data/top100-map.js` via the `new Function('window', SRC)` shim already used by `data-shape.test.mjs`.
- [ ] `tests/workflow-timestamp-quote.test.mjs` — covers INFRA-01 (string-presence assertion on `auto-update-data.yml`: must match `echo "timestamp=...$(date +%Y%m%d-%H%M%S)" >> "$GITHUB_OUTPUT"`, must NOT match `%H%M%S) >> $GITHUB_OUTPUT"`).
- [ ] Register BOTH new files in `package.json` scripts.test (append to the existing `node --test ...` list).
- [ ] Update `tests/methodology-wiring.test.mjs` line 51 area to also assert `/\b27\b/` and `/\b48\b/` (keep `/\b75\b/`).
- [ ] Framework install: none — `node:test` is built in.

### Zero-fabrication assertion design (INTG-03, the core honesty gate)
```javascript
// Build the universe of REAL source ids that exist anywhere in the frozen dataset.
const realIds = new Set();
for (const p of Object.values(DATA.profiles)) for (const s of (p.sources||[])) realIds.add(s.id);
// Every id the resolver maps a dangling FK TO must already be in realIds (no invention).
for (const [fk] of resolvedPairs) assert.ok(realIds.has(fk), `resolved FK ${fk} must be a pre-existing real source`);
// And the resolved target object's url must equal the canonical existing definition.
```

## Security Domain

`security_enforcement` is not set in `.planning/config.json` (treat as enabled), but this phase has a minimal attack surface (static data + CI config; no auth, no user input, no network in app code).

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | n/a |
| V3 Session Management | no | n/a |
| V4 Access Control | no | n/a |
| V5 Input Validation / Output Encoding | yes | Resolved source `url`/`title` flow into `badgeHtml`, which already `escapeHtml`-escapes the title and only emits `<a>` when `url.startsWith("http")` (js/trust:111–119). The canonical `swift-payments` url is `https://...` — passes the V5 control. No new sink. |
| V6 Cryptography | no | n/a |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stored XSS via source title/url | Tampering | Existing `escapeHtml` on title + http(s)-only `<a>` href guard; canonical source is a static trusted constant |
| CI command injection in yml echo | Tampering | The fix uses `$(date ...)` (fixed format, no user input) and proper quoting; no untrusted interpolation |

## Sources

### Primary (HIGH confidence)
- `data/top100-map.json` (computed) — 75 dangling FK usages, 9 distinct pairs, swift-payments canonical in 7 profiles, 6 orphan ids absent everywhere.
- `data/top100-map.js` (computed via window-shim eval) — byte-equivalent profile data, identical 75 usages, swift-payments present.
- `js/trust/index.js` (read) — `provenanceFor` Unknown-floor + `badgeHtml` V5 escaping behavior.
- `js/data/index.js` (read) — `normalizeEntityLabel`, `graphForMode` sourceIndex build (:167), export surface.
- `js/ui/index.js` (read) — `sourceIndex` build sites (:340, :657) consuming `provenanceFor`.
- `index.html:168` (read) — exact current dangling-FK Methodology copy.
- `.github/workflows/auto-update-data.yml:34` (read) — exact misquoted echo.
- `package.json` + `npm test` run (executed) — 313 cases green baseline; `methodology-wiring.test.mjs:51` pins `/\b75\b/`.

### Secondary (MEDIUM confidence)
- none.

### Tertiary (LOW confidence)
- none — all claims computed or read directly.

## Metadata

**Confidence breakdown:**
- FK counts & resolvability: HIGH — computed directly from both data files.
- Resolver design: HIGH — pure function mirrors existing `sourceIndex`/`provenanceFor` contract; no new dependency.
- yml fix: HIGH — verbatim from CONTEXT and verified against the live file + gated suite.
- 601628.SS resolvability judgment: MEDIUM — semantic call flagged as assumption A1 for discuss/planner.

**Research date:** 2026-06-22
**Valid until:** 2026-07-22 (stable — frozen dataset; only changes if `data/` is regenerated by the weekly job, which touches market caps, not source FKs)
