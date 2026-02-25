# Macro-Site Excellence Upgrade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Turn `macro-site` into a flagship, trustworthy macro-intelligence product with defensible data, premium visuals, fast interactions, and production-grade accessibility.

**Architecture:** Keep the current standalone architecture (`macro-site/index.html` + `styles.css` + `app.js`) but add a stricter data contract from the generator layer, explicit uncertainty/provenance metadata, deterministic filter state handling, and test-backed interaction behavior. Execute in phases so every phase ships independently with measurable quality gains.

**Tech Stack:** Vanilla JS + D3 v7, Node test runner, Playwright, data generators in `scripts/*.mjs`.

---

## Skill Stack To Use During Execution
- `@superpowers/brainstorming` for UX/visual concept checkpoints before major UI behavior changes.
- `@superpowers/test-driven-development` for each feature task.
- `@superpowers/systematic-debugging` for any regression/failing behavior.
- `@superpowers/verification-before-completion` before claiming each phase done.
- `@superpowers/requesting-code-review` after each major phase.
- `@superpowers/finishing-a-development-branch` at release prep.

## Success Metrics (Definition of Done)
1. Data transparency: every displayed major figure is tagged `observed` or `estimated`.
2. Accessibility: keyboard-only journey covers search, filters, selection, and reset.
3. Performance: filter interactions feel immediate; no full simulation restart for simple style/filter changes.
4. Visual quality: region/bloc structure is legible at first glance, and Medicine sector storytelling is obvious.
5. Reliability: new behavior tests cover filter math, keyboard shortcuts, provenance badges, and URL state restore.

---

## Phase 1: Data Trust + Provenance (Highest Priority)

### Task 1: Align and harden data source contract

**Files:**
- Modify: `scripts/generate-country-macro-data.mjs`
- Modify: `macro-site/README.md`
- Test: `tests/country-macro-data-schema.test.mjs`

**Step 1: Write the failing test**
- Add assertions that `meta.sources.trade` and README source statement are consistent.
- Add assertion that `meta.snapshotDate` exists and is ISO.

**Step 2: Run test to verify it fails**
- Run: `npm test -- tests/country-macro-data-schema.test.mjs`
- Expected: FAIL on source consistency assertion.

**Step 3: Write minimal implementation**
- Normalize source labels in generator output.
- Update README source section to match generated metadata exactly.

**Step 4: Run tests to verify pass**
- Run: `npm test -- tests/country-macro-data-schema.test.mjs`
- Expected: PASS.

**Step 5: Commit**
```bash
git add scripts/generate-country-macro-data.mjs macro-site/README.md tests/country-macro-data-schema.test.mjs
git commit -m "chore: align macro data source contract across generator and docs"
```

### Task 2: Mark estimated values explicitly in data model

**Files:**
- Modify: `scripts/generate-country-macro-data.mjs`
- Modify: `data/country-macro-map.js` (regenerated)
- Test: `tests/country-macro-ingestion.test.mjs`

**Step 1: Write failing test**
- Assert top producers rows include a provenance flag (`observed`/`estimated`).
- Assert trade totals carry an estimation marker when modeled.

**Step 2: Run failing test**
- Run: `npm test -- tests/country-macro-ingestion.test.mjs`
- Expected: FAIL (missing flags).

**Step 3: Implement minimal changes**
- In `ensureTopN`, mark fallback entries with `provenance: "estimated"`.
- In `applyTradeTotals`, mark modeled exports/imports with `tradeEstimate: true`.
- Regenerate data with `npm run build:country-data`.

**Step 4: Verify**
- Run: `npm test -- tests/country-macro-ingestion.test.mjs`
- Expected: PASS.

**Step 5: Commit**
```bash
git add scripts/generate-country-macro-data.mjs data/country-macro-map.js tests/country-macro-ingestion.test.mjs
git commit -m "feat: add explicit provenance markers for estimated macro values"
```

### Task 3: Surface provenance and uncertainty in UI

**Files:**
- Modify: `macro-site/app.js`
- Modify: `macro-site/index.html`
- Modify: `macro-site/styles.css`
- Test: `tests/macro-site-integrity.test.mjs`

**Step 1: Write failing test**
- Assert provenance container IDs exist (e.g. `detailProvenance`, `legendProvenance`).

**Step 2: Run failing test**
- Run: `npm test -- tests/macro-site-integrity.test.mjs`
- Expected: FAIL (missing IDs).

**Step 3: Implement minimal UI**
- Add badges for `Observed` / `Estimated` in detail card + top10 rows.
- Add hover/help copy explaining modeled values.

**Step 4: Verify**
- Run: `npm test -- tests/macro-site-integrity.test.mjs`
- Expected: PASS.

**Step 5: Commit**
```bash
git add macro-site/index.html macro-site/styles.css macro-site/app.js tests/macro-site-integrity.test.mjs
git commit -m "feat: expose data provenance and uncertainty badges in macro UI"
```

---

## Phase 2: Interaction + Accessibility

### Task 4: Implement promised keyboard shortcuts and ARIA semantics

**Files:**
- Modify: `macro-site/index.html`
- Modify: `macro-site/app.js`
- Modify: `macro-site/README.md`
- Create: `tests/macro-site-accessibility.test.mjs`

**Step 1: Write failing tests**
- Keyboard: `/` focuses search, `Esc` closes panels/details.
- DOM: key interactive controls have `aria-label` and relevant roles.

**Step 2: Run failing tests**
- Run: `npm test -- tests/macro-site-accessibility.test.mjs`
- Expected: FAIL.

**Step 3: Implement minimal behavior**
- Add `document.addEventListener("keydown", ...)` handler.
- Add missing semantic attributes in HTML.
- Keep README shortcut docs synchronized with actual implementation.

**Step 4: Verify pass**
- Run: `npm test -- tests/macro-site-accessibility.test.mjs`
- Expected: PASS.

**Step 5: Commit**
```bash
git add macro-site/index.html macro-site/app.js macro-site/README.md tests/macro-site-accessibility.test.mjs
git commit -m "feat: add keyboard shortcuts and accessibility semantics to macro-site"
```

### Task 5: Advanced bloc filtering modes (union/intersection + edge scope)

**Files:**
- Modify: `macro-site/index.html`
- Modify: `macro-site/app.js`
- Modify: `macro-site/styles.css`
- Create: `tests/macro-site-bloc-filter.test.mjs`

**Step 1: Write failing tests**
- Multi-bloc `union` and `intersection` produce expected member counts.
- Edge scope toggles (`touching` vs `internal-only`) change link counts predictably.

**Step 2: Run failing tests**
- Run: `npm test -- tests/macro-site-bloc-filter.test.mjs`
- Expected: FAIL.

**Step 3: Implement minimal functionality**
- Add bloc mode controls and state machine.
- Extend `filterLinks()` logic to support both set operators and edge scopes.
- Update stats labels for clarity.

**Step 4: Verify**
- Run: `npm test -- tests/macro-site-bloc-filter.test.mjs`
- Expected: PASS.

**Step 5: Commit**
```bash
git add macro-site/index.html macro-site/styles.css macro-site/app.js tests/macro-site-bloc-filter.test.mjs
git commit -m "feat: add union/intersection and edge-scope bloc filtering"
```

### Task 6: URL state + presets for reproducible views

**Files:**
- Modify: `macro-site/app.js`
- Modify: `macro-site/index.html`
- Create: `tests/macro-site-state-restore.test.mjs`

**Step 1: Write failing test**
- Assert state can round-trip via query params (`year`, `sector`, `blocs`, `mode`, `threshold`, `direction`).

**Step 2: Run failing test**
- Run: `npm test -- tests/macro-site-state-restore.test.mjs`
- Expected: FAIL.

**Step 3: Implement minimal behavior**
- Add parser/serializer helpers.
- Hydrate state on load before first render.
- Add quick presets (`EU pharma`, `BRICS energy`, `NATO defense`) in UI.

**Step 4: Verify**
- Run: `npm test -- tests/macro-site-state-restore.test.mjs`
- Expected: PASS.

**Step 5: Commit**
```bash
git add macro-site/index.html macro-site/app.js tests/macro-site-state-restore.test.mjs
git commit -m "feat: add URL-state restoration and macro filter presets"
```

---

## Phase 3: Visual System Upgrade (SupplyChain-level polish)

### Task 7: Layout system and premium visual pass

**Files:**
- Modify: `macro-site/styles.css`
- Modify: `macro-site/index.html`
- Modify: `macro-site/app.js`
- Create: `docs/plans/2026-02-24-macro-visual-spec.md`

**Step 1: Design checkpoint (@superpowers/brainstorming)**
- Lock a visual direction: typography, color tokens, hierarchy, motion language.

**Step 2: Implement layout shell**
- Replace ad-hoc fixed-layer overlap with a coherent panel layout grid.
- Keep mobile control model but improve docking and spacing.

**Step 3: Upgrade visualization semantics**
- Region-anchored clustering.
- Bloc hull overlays.
- Sector emphasis layers (especially Medicine storytelling).

**Step 4: Verify manually + screenshot baseline**
- Validate desktop and mobile in Playwright snapshots.

**Step 5: Commit**
```bash
git add macro-site/index.html macro-site/styles.css macro-site/app.js docs/plans/2026-02-24-macro-visual-spec.md
git commit -m "feat: introduce premium visual system and structured macro-site layout"
```

---

## Phase 4: Performance + Reliability

### Task 8: Incremental rendering and filter-performance optimization

**Files:**
- Modify: `macro-site/app.js`
- Create: `tests/macro-site-performance.test.mjs`

**Step 1: Write failing perf guard**
- Add assertion on max allowed filter-apply latency in headless interaction test.

**Step 2: Run failing perf test**
- Run: `npm test -- tests/macro-site-performance.test.mjs`
- Expected: FAIL (baseline).

**Step 3: Implement optimization**
- Cache filtered link sets by deterministic key.
- Avoid full simulation restart for style-only updates.
- Re-run simulation only when topology changes.

**Step 4: Verify perf + regressions**
- Run full suite: `npm test`
- Expected: PASS and improved interaction latency.

**Step 5: Commit**
```bash
git add macro-site/app.js tests/macro-site-performance.test.mjs
git commit -m "perf: cache filter computations and avoid unnecessary force re-simulations"
```

---

## Final Validation Gate

### Task 9: End-to-end verification and release docs

**Files:**
- Modify: `macro-site/README.md`
- Modify: `docs/AUTO_UPDATE_GUIDE.md` (if data contract changed)
- Create: `docs/plans/2026-02-24-macro-release-checklist.md`

**Step 1: Run full tests**
- Run: `npm test`
- Expected: all passing.

**Step 2: Browser verification (Playwright)**
- Validate: keyboard flow, bloc modes, provenance badges, URL-state restore, mobile panel behavior.

**Step 3: Data verification command**
- Run: `npm run build:country-data` and ensure generated map reflects provenance fields.

**Step 4: Update documentation**
- README controls + shortcuts + provenance legend + known limitations.

**Step 5: Commit**
```bash
git add macro-site/README.md docs/AUTO_UPDATE_GUIDE.md docs/plans/2026-02-24-macro-release-checklist.md
git commit -m "docs: finalize macro-site operational and release documentation"
```

---

## Recommended Execution Order
1. Phase 1 (data trust) — prevents visual improvements from presenting ambiguous numbers.
2. Phase 2 (interaction + accessibility) — ensures core UX is correct before polish.
3. Phase 3 (visual system) — elevate quality once correctness is stable.
4. Phase 4 (performance) — optimize after behavior is locked.
5. Final validation gate.

## Risk Register
1. **Data coverage risk:** bloc counts depend on node universe; mitigation is expanding country map before strict bloc comparatives.
2. **UX complexity risk:** too many controls can overload users; mitigation is presets + progressive disclosure.
3. **Performance risk:** additional overlays can slow D3; mitigation is memoized filters and conditional redraw.
4. **Credibility risk:** estimated values misread as observed; mitigation is mandatory provenance badges everywhere.

## Out-of-Scope (For This Plan)
1. Backend/API migration.
2. Real-time streaming macro updates.
3. User accounts/collaborative saved workspaces.

## Handoff
- Use `superpowers:executing-plans` for phased implementation.
- At phase boundaries, run `superpowers:requesting-code-review`.
- Before completion claims, enforce `superpowers:verification-before-completion`.
