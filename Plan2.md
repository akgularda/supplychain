# Supply Chain Viewer Full Improvements + Credit Ratings Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver all planned UX improvements and integrate credit-rating coverage (Fitch first, extensible to Moody's/S&P) for all 100 firms.

**Architecture:** Keep the app as a single-file `index.html` viewer plus generated data assets in `data/`. Add a ratings ingestion script that outputs a browser-consumable data bundle, then layer new UI panels (insights/provenance/mobile controls) and state-sharing behavior on top of current rendering/state logic.

**Tech Stack:** HTML/CSS/vanilla JavaScript, D3, Node scripts, Node test runner (`node:test`).

---

### Task 1: Extend ratings pipeline for all firms (Fitch + agency-ready schema)

**Files:**
- Modify: `scripts/fetch-fitch-ratings.mjs`
- Generate: `data/credit-ratings.json`
- Generate: `data/credit-ratings.js`

**Step 1: Harden entity matching**
- Improve token normalization/matching to avoid ticker collisions and false positives.
- Support symbol-specific alias queries for ambiguous issuer names.
- Prefer null/not-found over unsafe mappings.

**Step 2: Produce agency-ready output**
- Keep `fitch` populated when a credible match exists.
- Keep `moodys` and `spGlobal` keys present for each symbol as explicit placeholders.
- Include matching metadata (`matchScore`, `matchTokens`, `matchTarget`) for auditability.

**Step 3: Regenerate ratings bundle**
- Run: `node scripts/fetch-fitch-ratings.mjs`
- Expected: writes both `data/credit-ratings.json` and `data/credit-ratings.js` with 100 symbols.

---

### Task 2: Add profile insights surfaces in UI

**Files:**
- Modify: `index.html`

**Step 1: Add new UI containers**
- Add an insights panel area in company profile card.
- Add a provenance drawer for source references in profile mode.

**Step 2: Add analytics helpers**
- Implement risk score derivation (supplier concentration, source-backed ratio, geographic concentration).
- Build shared-supplier overlap index across all profiles.
- Build evidence timeline by source-year extraction for current profile.

**Step 3: Render insights**
- Show risk badge/label on profile card.
- Show top overlap peers and shared supplier counts.
- Show compact evidence timeline bars/rows.

---

### Task 3: Integrate agency ratings into profile + compare UX

**Files:**
- Modify: `index.html`
- Consume: `data/credit-ratings.js`

**Step 1: Load ratings data safely**
- Read `window.CREDIT_RATINGS` if available.
- Fall back gracefully when ratings file or symbol data is unavailable.

**Step 2: Render ratings in profile card**
- Display Fitch long-term and short-term rating info when present.
- Display placeholders for Moody's/S&P as unavailable/not loaded.
- Surface agency coverage status clearly (found/not-found).

**Step 3: Extend compare modal**
- Add rating rows to each company comparison card.
- Preserve existing compare behavior and accessibility semantics.

---

### Task 4: Implement interaction upgrades (autocomplete, shareable state, mobile controls)

**Files:**
- Modify: `index.html`

**Step 1: Search autocomplete**
- Add symbol/company suggestions while typing.
- Support keyboard and click selection without breaking existing search history.

**Step 2: URL state sharing**
- Serialize key app state (`mode`, `symbol`, `filters`, `compare`) into URL query params.
- Hydrate state from URL on load.
- Keep URL synced on state changes.

**Step 3: Mobile control sheet**
- Add a compact mobile-only control toggle.
- Move/clone critical controls into a bottom sheet for small screens.

---

### Task 5: Verify and regressions

**Files:**
- Modify: `tests/index-ui-integrity.test.mjs`
- Verify: `tests/*.test.mjs`

**Step 1: Add focused integrity checks**
- Assert ratings data script include and new insight/provenance containers exist.
- Assert key new controls (autocomplete list + mobile controls) are present.

**Step 2: Run full suite**
- Run: `node --test tests/*.test.mjs`
- Expected: pass with zero failures.

**Step 3: Manual browser smoke check**
- Run local server and open `index.html`.
- Confirm:
  1. global/profile rendering still works,
  2. profile card shows insights + ratings,
  3. compare modal includes ratings,
  4. URL state roundtrip works,
  5. mobile sheet appears on narrow viewport.
