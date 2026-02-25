# Country Macro Website (Standalone) Implementation Plan

> **For AI:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Yet, use all skills.

**Goal:** Build a new standalone website (separate from the current one) with a similar visual language, where country bubbles are sized by GDP, link lines represent bilateral trade, and sector drilldowns show top producers (including Medicine top 10).

**Architecture:** Create a new app surface in its own folder (`macro-site/`) with its own HTML/CSS/JS entrypoint. Reuse visual style patterns from the current site, but do not merge with existing `index.html` logic. Use a dedicated country macro dataset (`data/country-macro-map.{json,js}`) and independent UI state.

**Tech Stack:** Vanilla JS, D3 v7, Node.js data scripts, JSON/JS payloads, Node test runner (`node --test`)

---

## Hard Requirement
1. This is a separate website, not a new mode in the existing site.
2. Existing `index.html` behavior remains unchanged.
3. New macro site must run independently and be deployable as its own page.

## Scope
1. Country nodes sized by GDP.
2. Country-to-country trade edges (year + threshold + direction filters).
3. Sector drilldown panel with top-10 producer countries.
4. Medicine sector included from first release.
5. Similar UI feel: dark theme, compact controls, detail card, search/filter, side panel.

---

### Task 1: Create Standalone App Skeleton

**Files:**
- Create: `macro-site/index.html`
- Create: `macro-site/styles.css`
- Create: `macro-site/app.js`
- Create: `macro-site/README.md`

**Steps:**
1. Create a failing test `tests/macro-site-integrity.test.mjs` that expects these files and required container IDs.
2. Run: `node --test tests/macro-site-integrity.test.mjs` (expect FAIL).
3. Create minimal app shell with script/style wiring and placeholder containers.
4. Re-run test (expect PASS).
5. Commit.

---

### Task 2: Define Country Macro Data Contract

**Files:**
- Create: `docs/plans/country-macro-data-contract.md`
- Create: `data/sector-definitions.json`
- Create: `tests/country-macro-data-schema.test.mjs`

**Steps:**
1. Write schema test first with required fields:
- `meta`, `nodes`, `links`, `sectors`, `topProducersBySectorYear`.
2. Add required node fields: `iso2`, `iso3`, `country`, `gdpUsd`, `exportsUsd`, `importsUsd`, `bubbleRadius`.
3. Add required link fields: `s`, `t`, `tradeUsd`, `year`, `direction`, `weight`.
4. Run test (expect FAIL until generator exists).
5. Commit.

---

### Task 3: Build GDP/Trade/Sector Source Adapters

**Files:**
- Create: `scripts/lib/fetch-worldbank-gdp.mjs`
- Create: `scripts/lib/fetch-imf-dots-trade.mjs`
- Create: `scripts/lib/fetch-sector-exports.mjs`
- Create: `tests/country-macro-ingestion.test.mjs`
- Create: `data/raw/.gitkeep`

**Steps:**
1. Add failing ingestion tests for normalized country codes and numeric values.
2. Implement adapters with snapshot caching in `data/raw/`.
3. If remote fetch fails, fallback to latest local snapshot.
4. Run: `node --test tests/country-macro-ingestion.test.mjs` (expect PASS).
5. Commit.

---

### Task 4: Generate Country Macro Dataset

**Files:**
- Create: `scripts/generate-country-macro-data.mjs`
- Create: `data/country-macro-map.json` (generated)
- Create: `data/country-macro-map.js` (generated)
- Modify: `package.json`

**Steps:**
1. Extend schema test to require:
- >=100 countries,
- non-empty trade links,
- medicine top-10 for latest year.
2. Implement generator pipeline:
- merge GDP + bilateral trade + sector exports,
- compute bubble radius,
- build trade edge list,
- build `topProducersBySectorYear`.
3. Add npm script: `"build:country-data": "node scripts/generate-country-macro-data.mjs"`.
4. Run:
- `npm run build:country-data`
- `node --test tests/country-macro-data-schema.test.mjs`
5. Commit.

---

### Task 5: Build Standalone UI Shell (Similar Style)

**Files:**
- Modify: `macro-site/index.html`
- Modify: `macro-site/styles.css`
- Modify: `macro-site/app.js`

**Steps:**
1. Add top bar, stats row, search input, left control panel, right detail card, top producers panel.
2. Load D3 and `../data/country-macro-map.js` in standalone page.
3. Add UI integrity checks in `tests/macro-site-integrity.test.mjs` for mandatory containers.
4. Run tests (expect PASS).
5. Commit.

---

### Task 6: Render GDP Bubble Graph

**Files:**
- Modify: `macro-site/app.js`
- Modify: `macro-site/styles.css`
- Modify: `tests/macro-site-integrity.test.mjs`

**Steps:**
1. Map country nodes to D3 circles with `bubbleRadius`.
2. Label each node: country + compact GDP.
3. Add GDP legend and tooltip fields.
4. Ensure panning/zooming and hover highlighting.
5. Commit.

---

### Task 7: Render Trade Connections and Controls

**Files:**
- Modify: `macro-site/app.js`
- Modify: `macro-site/index.html`

**Steps:**
1. Draw trade links with width from `tradeUsd` scale.
2. Add controls:
- year selector,
- minimum trade threshold,
- direction (`exports` / `imports` / `both`).
3. Recompute visible links on control changes.
4. Add/update tests for control IDs and behavior hooks.
5. Commit.

---

### Task 8: Implement Sector Drilldown + Medicine Top 10

**Files:**
- Modify: `macro-site/index.html`
- Modify: `macro-site/app.js`
- Create: `tests/country-macro-sector-top10.test.mjs`

**Steps:**
1. Add sector selector/chips sourced from `data/sector-definitions.json`.
2. Build right panel section `Top 10 <Sector> Producers`.
3. Ensure medicine sector returns exactly 10 ranked countries for latest year.
4. Update graph styling on sector change (emphasis/filter).
5. Run sector tests (expect PASS).
6. Commit.

---

### Task 9: Country Detail Card and Partner Insights

**Files:**
- Modify: `macro-site/app.js`
- Modify: `macro-site/index.html`

**Steps:**
1. Clicking country opens detail card with:
- GDP,
- exports/imports/trade balance,
- top 5 trade partners,
- top sectors for selected year.
2. Add compare shortlist (2-4 countries) inside standalone app.
3. Add test hooks for detail card sections.
4. Commit.

---

### Task 10: Mobile and Performance Hardening

**Files:**
- Modify: `macro-site/styles.css`
- Modify: `macro-site/app.js`

**Steps:**
1. Responsive layout for mobile and tablet.
2. Cap visible links on small screens.
3. Debounce filter events.
4. Adaptive labels by zoom level.
5. Ensure keyboard focus and control accessibility.
6. Commit.

---

### Task 11: Workflow and Documentation Integration

**Files:**
- Modify: `.github/workflows/auto-update-data.yml`
- Modify: `docs/AUTO_UPDATE_GUIDE.md`
- Create: `tests/auto-update-country-data.test.mjs`

**Steps:**
1. Add workflow step to regenerate country macro dataset.
2. Keep existing company update flow unchanged.
3. Add test to verify workflow includes country-data build.
4. Update docs with standalone macro-site run/build instructions.
5. Commit.

---

### Task 12: Final Verification Gate

**Files:**
- Modify: `planmacro.md` (checklist completion marks)

**Steps:**
1. Run full tests: `node --test tests/*.test.mjs`.
2. Manual verify `macro-site/index.html`:
- GDP bubbles
- trade links
- medicine top-10 panel
- sector switching
- search/filter/card/compare.
3. Confirm existing `index.html` remains unchanged functionally.
4. Record exact data snapshot date in docs.
5. Final commit.

---

## Data Source Policy
1. GDP: World Bank annual GDP (current USD).
2. Bilateral trade: IMF DOTS (or equivalent stable bilateral dataset).
3. Sector ranking: product-level exports mapped to sector taxonomy (medicine mapped to pharma HS groups).
4. Store source URLs and snapshot date in dataset `meta`.
5. If source fetch fails, use cached local snapshot and set fallback flag.

## Definition of Done
1. A separate standalone website exists at `macro-site/index.html`.
2. Country bubbles are scaled by GDP and trade lines reflect bilateral flow.
3. Medicine top-10 producers panel is visible and accurate for selected year.
4. At least 8 sectors are available in drilldown.
5. Existing current website remains intact.
6. Auto-update can regenerate country macro data.

---

Plan prepared on **February 24, 2026**.
