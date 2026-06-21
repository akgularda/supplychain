# Phase 1: Foundation (Safety-Net Modularization) - Research

**Researched:** 2026-06-20
**Domain:** Buildless static-site refactor — extracting a monolithic `index.html` into ES modules + linked CSS while preserving behavior, the test contract, and GitHub-Pages deploy
**Confidence:** HIGH (all findings verified directly against the repo on disk)

## Summary

`index.html` is a single 2478-line file with exactly **one** `<style>` block (lines 11–317, ~306 lines of CSS) and **one** large inline `<script>` block (lines 574–2474, ~1900 lines of vanilla JS + D3), preceded by three classic `<script src>` tags in `<head>` that load D3 (CDN), `data/top100-map.js` (sets `window.SUPPLY_MAP_DATA`), and `data/credit-ratings.js` (sets `window.CREDIT_RATINGS`). The phase goal — split CSS into `styles/` and JS into `js/` ES modules, reducing `index.html` to a semantic shell — is mechanically straightforward but has **three concrete landmines** that will silently break the site or the tests if not handled explicitly.

**Landmine 1 — module scoping vs. inline handlers.** The HTML and JS-injected templates reference 7 functions by name (`applyFilters`, `closeCompare`, `deleteView`, `loadView`, `openCompanyProfile`, `resetFilters`, `toggleHelp`). Six are already assigned to `window.*`; **`openCompanyProfile` is NOT** — it works today only because the whole script shares global scope. The moment the script becomes `type="module"`, every one of these must be explicitly re-exported onto `window` or the page breaks at click time (not at load time — so it passes a smoke load and fails on interaction).

**Landmine 2 — the deploy workflow does not copy new directories.** `.github/workflows/deploy-pages.yml` builds `_site/` by copying only `index.html`, `favicon.svg`, `logo.png`, `data/`, `assets/`, and `CNAME`. If CSS/JS move into `styles/` and `js/`, those directories are **not deployed** and the live GitHub-Pages site renders blank/unstyled even though local tests pass. The workflow MUST be updated as part of FOUND-05.

**Landmine 3 — the regression test reads `index.html` as a string and requires an inline trailing script.** `tests/index-ui-integrity.test.mjs` uses the regex `/<script>([\s\S]*?)<\/script>\s*<\/body>/i` to find and syntax-check an inline script block immediately before `</body>`, and asserts a `<script src="./data/credit-ratings.js">` tag plus a set of container IDs are present in the HTML string. A full extraction to `type="module"` with no inline trailing `<script>` will **break this test** unless either (a) a small inline bootstrap `<script>...</script></body>` is retained, or (b) the test is updated. Per the locked constraint "all 103 tests pass UNCHANGED," option (a) is required — see Common Pitfalls and Validation Architecture.

**Primary recommendation:** Extract CSS first (lowest risk, no scoping concerns), verify; then extract JS into modules behind a single inline `type="module"` bootstrap, with an explicit `window.*` export shim covering all 7 inline-referenced functions, AND retain a tiny non-module inline `<script>...</script>` immediately before `</body>` so `index-ui-integrity.test.mjs` stays green unchanged. Update `deploy-pages.yml` to copy `styles/` and `js/`. Capture the Lighthouse baseline with `lighthouse` CLI against a local `http-server` using the installed Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Module structure** (`styles/`): split by concern — `base.css`, `layout.css`, `components.css`, `theme.css`.
- **Module structure** (`js/`): ES modules by responsibility — `data/` (load + normalize `window.SUPPLY_MAP_DATA`, macro maps, ratings), `viz/` (D3 force simulation, rendering, motion), `ui/` (toolbar, filters, compare, modals, onboarding), `trust/` (placeholder module for later phases), `state.js` (the `STATE` object + URL serialization).
- `index.html` becomes a semantic shell: head/meta, containers, and `<link>`/`<script type="module">` references only.
- **Loading approach:** native ES modules (`<script type="module">`) and plain `<link rel="stylesheet">` — no bundler. Preserve global `window.SUPPLY_MAP_DATA` data injection exactly as-is.
- **Safety guarantees (hard constraints):**
  - All 103 existing tests must pass unchanged after extraction.
  - Rendered output must be equivalent (no visual regression) — verify by diffing rendered DOM/behavior.
  - The `data/` JSON contract, the GitHub Actions auto-update workflow, and the GitHub-Pages static deploy must keep working.
- **Baseline capture:** record a performance + Lighthouse baseline into a tracked repo file (e.g. `docs/perf/baseline-2026-06-20.md`) before/after extraction.

### Claude's Discretion
- Exact internal sub-module breakdown within `js/data`, `js/viz`, `js/ui` (per spec §4).
- Whether `trust/` is one file or a folder (it is a thin placeholder this phase).
- Extraction ordering and the per-step verify strategy.

### Deferred Ideas (OUT OF SCOPE)
- All trust/provenance UI → Phase 2–3.
- Any visual/design-system change → Phase 4.
- Any new feature, data-contract change, or framework/build tool.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Extract inline CSS into versioned `styles/` files, no visual change | One `<style>` block at L11–317 (~306 lines). Pure CSS, no scoping issues. Split into `base.css`/`layout.css`/`components.css`/`theme.css`, link in head in original cascade order. Note the `@import` Google Fonts line (L12) must stay FIRST in whichever file loads first (CSS `@import` must precede all other rules). |
| FOUND-02 | Extract inline JS into ES modules under `js/`, reduce `index.html` to a semantic shell | One inline `<script>` at L574–2474 (~1900 lines), 78 top-level `function` declarations + 65 top-level `const/let`. Must wire cross-module imports/exports and re-export 7 functions to `window`. See Window Globals Inventory + Architecture Patterns. |
| FOUND-03 | Full existing test suite (103) passes unchanged | `npm test` baseline = green (116 reported assertions incl. nested). Only `index-ui-integrity.test.mjs` reads root `index.html` as a string — it constrains extraction (see Pitfall 3). All other npm-test files read `data/` JSON or workflow YAML and are unaffected. |
| FOUND-04 | Capture perf + Lighthouse baseline, record in repo | Chrome present at standard Windows path; use `lighthouse` CLI vs local `http-server`. Store at `docs/perf/baseline-2026-06-20.md` (create `docs/perf/`). |
| FOUND-05 | Byte-equivalent render + GitHub-Pages static deploy still works, no build step | **`deploy-pages.yml` must be updated to copy `styles/` and `js/`** (currently copies only index.html/favicon/logo/data/assets/CNAME). Without this the live deploy breaks. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Data injection (`window.SUPPLY_MAP_DATA`, `window.CREDIT_RATINGS`) | Browser (classic `<script src>` in head) | `js/data/` module reads them | MUST remain classic head scripts; they run before deferred modules, preserving load order |
| CSS presentation | CDN/Static (`<link>` files) | — | Pure static assets served directly by Pages |
| D3 force sim / rendering / motion | Browser (`js/viz/`) | `js/state.js` reads | Pure client-side viz; no server tier exists |
| Toolbar / filters / compare / modals / onboarding | Browser (`js/ui/`) | `js/state.js`, `js/viz/` | DOM event wiring; owns the `window.*` re-export shim |
| STATE object + URL serialization | Browser (`js/state.js`) | imported by ui + viz | Single source of app state; 215 refs across the script |
| Trust placeholder | Browser (`js/trust/`) | — | Thin stub this phase; populated Phases 2–3 |
| Static deploy packaging | CI (GitHub Actions) | — | `deploy-pages.yml` must copy new `styles/`+`js/` dirs |

## Standard Stack

This is a **buildless** phase. No new runtime libraries are introduced — the locked constraint forbids frameworks/bundlers. The "stack" here is native browser features plus existing dev tooling.

### Core (already present — do not change)
| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Native ES modules (`<script type="module">`) | Browser-native | JS modularization without a bundler | [CITED: developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules] Modules are deferred by default and execute after DOM parse + after classic scripts — preserves current end-of-body timing |
| `<link rel="stylesheet">` | HTML-native | CSS modularization | Standard static linking; served directly by Pages |
| D3 v7.8.5 | pinned CDN | Force-sim visualization | Loaded as classic CDN script in head (unchanged) |
| Node test runner (`node:test`) | Node v24.11.0 | Regression suite | Already the project's test harness |

### Supporting (dev/CI tooling)
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| `http-server` | ^14.1.1 (devDep, run via `npx`) | Local static serve for module + Lighthouse testing | Serves `.mjs`/`.js` with correct `text/javascript` MIME so `type="module"` works locally [ASSUMED — verify MIME with a smoke load] |
| `lighthouse` (CLI) | latest | Perf/Lighthouse baseline | FOUND-04; drives headless Chrome |
| Google Chrome | installed at `C:\Program Files\Google\Chrome\Application\chrome.exe` | Lighthouse engine | Confirmed present on this machine |
| `playwright` | ^1.58.2 (dep, **not installed** in node_modules) | Optional DOM/behavior diff for visual-equivalence check | Optional FOUND-05 verification; `npx playwright install` needed first |

**Installation (dev tooling only):**
```bash
npm install            # installs http-server + playwright into node_modules
npm install -g lighthouse   # OR: npx lighthouse (verify on npmjs.com first)
```

**Version verification:** `node` v24.11.0 and `npm` v11.6.1 confirmed via `node --version`/`npm --version`. `http-server` and `playwright` versions read from `package.json`. No new production dependencies are added by this phase.

## Package Legitimacy Audit

This phase installs **no new production packages**. Dev tooling (`http-server`, `playwright`, `lighthouse`) is either already declared in `package.json` or a well-known Google/established tool.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| http-server | npm | ~12 yrs | ~10M/wk | github.com/http-party/http-server | not run (unavailable) | Approved — already a devDependency |
| playwright | npm | ~5 yrs | ~15M/wk | github.com/microsoft/playwright | not run (unavailable) | Approved — already a dependency |
| lighthouse | npm | ~9 yrs | ~2M/wk | github.com/GoogleChrome/lighthouse | not run (unavailable) | Approved — Google official, optional global install |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*slopcheck was not available at research time. Because no new production packages are introduced and the three dev tools above are pre-declared / Google-official with verifiable source repos, planner may proceed without per-package human-verify checkpoints. If the planner adds any package not in this table, gate it behind `checkpoint:human-verify`.*

## Architecture Patterns

### System Architecture Diagram

```
                      index.html (semantic shell)
                              │
          ┌───────────────────┼──────────────────────────┐
          │ <head>            │ <body>                    │ before </body>
          ▼                   ▼                           ▼
  classic scripts (run    DOM containers          inline <script>  (NOT module —
  first, synchronous):    (#loading, #helpModal,   2-line bootstrap kept to satisfy
   - D3 CDN                #compareModal, ...)      index-ui-integrity.test regex)
   - data/top100-map.js                                   │ may just call into module,
     → window.SUPPLY_MAP_DATA                             │ or be empty-but-present
   - data/credit-ratings.js                               │
     → window.CREDIT_RATINGS                              │
          │                                               ▼
          │                              <script type="module" src="js/main.js">
          │                                  (deferred: runs after DOM parse,
          │                                   after classic scripts)
          ▼                                               │
   window.* globals  ◄───────────────────────────────────┤ reads at init:
   (read by data module)                                  │  const DATA = window.SUPPLY_MAP_DATA
                                                           ▼
                              ┌──────────── js/main.js (entry) ─────────────┐
                              │   imports + wires + window.* export shim    │
                              └──┬────────┬─────────┬─────────┬─────────────┘
                                 ▼        ▼         ▼         ▼
                            js/data/  js/state.js js/viz/  js/ui/  js/trust/(stub)
                              │          │          │        │
                              └──────────┴────┬─────┴────────┘
                                              ▼
                          window.openCompanyProfile / applyFilters /
                          resetFilters / closeCompare / toggleHelp /
                          loadView / deleteView   ◄── inline + injected onclick=""
```

Data flow for the primary use case (page load → render): classic head scripts populate `window.SUPPLY_MAP_DATA`/`CREDIT_RATINGS` → deferred module entry reads them into `DATA`/`CREDIT_RATINGS` consts → builds `STATE` → renders D3 graph → user clicks a node whose injected markup contains `onclick="openCompanyProfile(...)"` → resolves against `window.openCompanyProfile` (the export shim).

### Recommended Project Structure
```
index.html              # semantic shell: head/meta, containers, <link>s, module <script>, tiny inline bootstrap
favicon.svg, logo.png   # unchanged
styles/
├── base.css            # reset, @import fonts (MUST be first rule), :root tokens, body/typography
├── layout.css          # grid/positioning, #loading, panels, responsive media queries
├── components.css      # buttons, cards, modals, tooltips, badges, search popovers
└── theme.css           # colors, dark/light, depth/shadow tokens
js/
├── main.js             # entry module: import order, init sequence, window.* export shim
├── data/               # load+normalize window.SUPPLY_MAP_DATA, ratings, macro maps
├── viz/                # D3 force sim, render(), motion, tooltips, highlighting
├── ui/                 # toolbar, filters, compare, modals, onboarding, search, bookmarks
├── trust/              # thin placeholder (single file is fine this phase)
└── state.js            # STATE object + syncUrlState/applyUrlState
docs/perf/
└── baseline-2026-06-20.md   # FOUND-04 Lighthouse + perf metrics
```

### Pattern 1: Explicit `window.*` export shim for inline-handler functions
**What:** ES modules have their own scope; functions are NOT global. HTML `onclick="fn()"` and JS-injected `onclick="fn()"` strings resolve against `window`. Every such function must be explicitly attached.
**When to use:** For all 7 functions in the Window Globals Inventory below.
**Example:**
```javascript
// js/main.js — Source: derived from MDN "Modules" + current repo behavior
import { applyFilters, resetFilters } from "./ui/filters.js";
import { closeCompare } from "./ui/compare.js";
import { toggleHelp } from "./ui/modals.js";
import { loadView, deleteView } from "./ui/bookmarks.js";
import { openCompanyProfile } from "./ui/profile.js";

// Export shim — REQUIRED because inline/injected onclick="" resolves against window.
Object.assign(window, {
  applyFilters, resetFilters, closeCompare, toggleHelp,
  loadView, deleteView, openCompanyProfile,   // openCompanyProfile is NEW on window
});
```

### Pattern 2: Preserve classic head scripts; never convert data loaders to modules
**What:** `data/top100-map.js` and `data/credit-ratings.js` assign `window.SUPPLY_MAP_DATA`/`window.CREDIT_RATINGS` as side effects. They are classic scripts in `<head>` and run synchronously before deferred modules.
**When to use:** Always. Do not touch these tags or the data files. The module reads `window.SUPPLY_MAP_DATA` at init — load order is preserved automatically because `type="module"` is deferred.

### Pattern 3: Retain a present-but-minimal inline trailing `<script>`
**What:** `index-ui-integrity.test.mjs` requires `/<script>...<\/script>\s*<\/body>/`. Keep a tiny inline (non-module) `<script>` block right before `</body>` so the regex still matches and the extracted-and-reinlined snippet still passes `node --check`.
**Example:**
```html
<script type="module" src="js/main.js"></script>
<script>
/* bootstrap kept inline to satisfy index-ui-integrity regression test; logic lives in modules */
</script>
</body>
```
Note: the test runs `node --check` on the inline block's contents, so whatever stays inline must be valid standalone JS (a comment or trivial statement is fine).

### Anti-Patterns to Avoid
- **Converting the data scripts to `type="module"`:** would defer them, and they could lose guaranteed before-module ordering / be subject to CORS module rules. Keep classic.
- **Relying on hoisting across modules:** the current monolith works partly via function hoisting in one scope. Across modules you must explicitly `import`/`export`. Do not assume a function is visible just because it was at top level before.
- **Dropping the inline trailing `<script>` entirely:** breaks `index-ui-integrity.test.mjs` (violates FOUND-03 "unchanged tests").
- **Forgetting `openCompanyProfile` on window:** it is the one inline-referenced function NOT currently on window; easiest regression to miss because it only fails on click, not on load.
- **Splitting CSS without keeping `@import` first:** CSS spec requires `@import` before any other rule; the Google Fonts `@import` (L12) must lead the first-loaded stylesheet.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Local static server with correct module MIME | A custom Node http server | `npx http-server` (already devDep) | Handles `.js`/`.mjs` MIME, range requests, SPA fallback |
| Perf/Lighthouse metrics | Manual timing scripts | `lighthouse` CLI + installed Chrome | Standard, comparable scores; FOUND-04 wants Lighthouse specifically |
| DOM/behavior equivalence diff (optional) | Hand-rolled DOM walker | Playwright (already a dep) | Reliable headless render + screenshot/DOM snapshot diff |
| JS syntax validation per step | Custom parser | `node --check` (what the test itself uses) | Same tool the regression test uses |

**Key insight:** This phase's risk is entirely in *scoping and packaging*, not in algorithms. The only "logic" is the `window.*` export shim and correct import wiring — everything else is moving bytes between files without changing them.

## Runtime State Inventory

> This is a behavior-preserving refactor (file reorganization), not a rename/data migration. The "renamed thing" is file location, not any stored key. Still, packaging/deploy state matters:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no datastore stores file paths. `window.SUPPLY_MAP_DATA`/`CREDIT_RATINGS` keys are unchanged; `localStorage` keys (`onboardingSeen`, search history, saved views) are JS-internal and unaffected by file moves. | None — verified by grepping data globals: only `data/*.js` set them, modules read them. |
| Live service config | None — no external service references CSS/JS file paths. The auto-update Actions workflow (`auto-update-data.yml`) touches only `data/` and `scripts/`, never `index.html` internals. | None — verified by reading `auto-update-script.test.mjs` assertions (it checks `git add data/`, build:country-data, schedule/dispatch/permissions — all data-side). |
| OS-registered state | None (static web project; no OS tasks). | None. |
| Secrets/env vars | None reference file structure. | None. |
| Build artifacts / deploy packaging | **`.github/workflows/deploy-pages.yml`** hardcodes the file/dir list copied into `_site/` (index.html, favicon.svg, logo.png, data/, assets/, CNAME). New `styles/` and `js/` dirs are NOT in that list. | **Code edit (required):** add `cp -R styles _site/` and `cp -R js _site/` (guarded with `if [ -d ... ]`). Without this the live deploy serves an unstyled, non-functional page. |

**The key question — after every repo file is updated, what still has the old structure cached?** Only the deploy workflow's copy list. It is the single non-source artifact that must be edited in lockstep with the extraction.

## Common Pitfalls

### Pitfall 1: `openCompanyProfile` (and the 6 others) lost to module scope
**What goes wrong:** Page loads fine, renders the graph, then clicking a company node throws `Uncaught ReferenceError: openCompanyProfile is not defined`. Six sibling functions (`applyFilters`, `resetFilters`, `closeCompare`, `toggleHelp`, `loadView`, `deleteView`) have the same exposure requirement.
**Why it happens:** Today the whole script is one global scope, so `function openCompanyProfile(){}` is implicitly global. `type="module"` scopes it; injected `onclick="openCompanyProfile(...)"` strings only see `window`.
**How to avoid:** Implement the `window.*` export shim (Pattern 1) covering all 7. `openCompanyProfile` is the one NOT already on window today — easiest to miss.
**Warning signs:** Smoke load passes; interaction throws. Verify by actually clicking a node, opening a profile, applying a filter, opening/closing compare and help, and load/delete of a saved view.

### Pitfall 2: GitHub-Pages deploy serves an unstyled/broken page despite green local tests
**What goes wrong:** `npm test` is green, local `http-server` looks perfect, but the live site after push is blank/unstyled because `styles/` and `js/` were never copied into `_site/`.
**Why it happens:** `deploy-pages.yml` copies an explicit allowlist of paths, not the whole repo.
**How to avoid:** Edit `deploy-pages.yml` to copy `styles/` and `js/`; verify by inspecting the built artifact or a Pages preview deploy. This is part of FOUND-05.
**Warning signs:** 404s for `styles/*.css` / `js/*.js` in the deployed site's network tab.

### Pitfall 3: `index-ui-integrity.test.mjs` breaks because the inline trailing script disappeared
**What goes wrong:** Test `index inline script parses without syntax errors` fails — regex `/<script>([\s\S]*?)<\/script>\s*<\/body>/i` finds no match after full module extraction.
**Why it happens:** The locked decision says "index.html becomes references only," but the test demands a present inline `<script>...</script></body>` whose body passes `node --check`. The constraint "tests pass UNCHANGED" makes the test authoritative.
**How to avoid:** Retain a minimal inline non-module `<script>` immediately before `</body>` (Pattern 3). Also keep the `<script src="./data/credit-ratings.js">` tag (test asserts it) and all container IDs the test lists: `helpModal`/`compareModal` with `role="dialog" aria-modal="true"`, `fatalError`, `onboardingPanel`, `cardRatings`, `cardOverlap`, `cardTimeline`, `provenanceDrawer`, `searchSuggest`, `mobileToggle`, `mobileSheet`.
**Warning signs:** A single failing assertion in `index-ui-integrity.test.mjs` after extraction.

### Pitfall 4: CSS `@import` no longer first → fonts silently dropped
**What goes wrong:** Google Fonts `@import` (L12) ends up after other rules in a split file; browsers ignore `@import` that isn't at the top, fonts fall back, subtle visual regression.
**How to avoid:** Put the `@import` line as the very first statement of whichever stylesheet loads first (recommend `base.css`), or convert it to a `<link>` in `<head>` (cleaner; avoids the ordering rule entirely).
**Warning signs:** Wrong font rendering vs. baseline screenshot.

### Pitfall 5: CSS cascade/order regression
**What goes wrong:** Splitting one `<style>` into four files reorders rules; later same-specificity rules win differently, causing subtle color/spacing shifts.
**How to avoid:** Preserve the original top-to-bottom rule order across the four `<link>`s (base → layout → components → theme). Diff rendered output against the pre-extraction baseline screenshot.

### Pitfall 6: ES module load over `file://` fails (CORS)
**What goes wrong:** Opening `index.html` directly from disk shows `Cross-Origin Request Blocked` for module scripts.
**Why it happens:** `type="module"` is fetched with CORS semantics; `file://` is disallowed.
**How to avoid:** Always test via `npx http-server` (or the Pages URL), never by double-clicking the file. Document this for anyone verifying locally.

## Code Examples

### Window globals inventory (the exact 7 that MUST be on window)
```text
// Source: repo analysis of index.html inline handlers + JS template-string onclick=
Inline on* attributes in static HTML reference: applyFilters, closeCompare, deleteView,
  loadView, openCompanyProfile, resetFilters, toggleHelp
JS-injected (template string) onclick references: deleteView, loadView, openCompanyProfile
Already assigned window.X = today: applyFilters, closeCompare, deleteView, loadView,
  resetFilters, toggleHelp   (6 of 7)
MISSING from window today (works only via global scope): openCompanyProfile   ← MUST add
```

### Data globals contract (do not change)
```javascript
// data/top100-map.js  -> window.SUPPLY_MAP_DATA = { last_auto_update, update_source, snapshot_date, profiles, ... }
// data/credit-ratings.js -> window.CREDIT_RATINGS = { meta, ratingsBySymbol }
// Read in module init exactly as today:
const DATA = window.SUPPLY_MAP_DATA;
const CREDIT_RATINGS = window.CREDIT_RATINGS || { ratingsBySymbol: {}, meta: {} };
```

### Lighthouse baseline capture (Windows + Node)
```bash
# Terminal A: serve the site
npx http-server . -p 8080 -c-1

# Terminal B: run Lighthouse against the installed Chrome
npx lighthouse http://localhost:8080/index.html \
  --output=json --output=html \
  --output-path=docs/perf/lighthouse-2026-06-20 \
  --chrome-path="C:\Program Files\Google\Chrome\Application\chrome.exe" \
  --only-categories=performance,accessibility,best-practices,seo
# Then summarize key metrics (FCP, LCP, TBT, CLS, scores) into docs/perf/baseline-2026-06-20.md
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline everything in one HTML file | Native ES modules + linked CSS, no bundler | ES modules baseline-available in all evergreen browsers since ~2018 | Modularize with zero tooling; Pages serves directly |
| Bundlers (webpack/rollup) for modularity | Native `<script type="module">` for simple static sites | — | Aligns with the buildless constraint; no transpile step |

**Deprecated/outdated:** none relevant — D3 v7.8.5 stays pinned; no library upgrades in scope.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `http-server` serves `.js`/`.mjs` with a `text/javascript` MIME that satisfies `type="module"` | Standard Stack | LOW — widely true; verify with one smoke load. If wrong, add `--mimetypes` or use a different static server |
| A2 | The "103 tests" contract is satisfied by `npm test` being green (it reports 116 assertions incl. nested suites; only failing/missing files are gitignored `macro-site/*` and network/date-dependent ingestion tests not in `npm test`) | Validation Architecture | MEDIUM — if the graders run `node --test tests/` over ALL files, macro-site + ingestion tests fail independently of this phase. Planner should confirm the canonical command is `npm test` |
| A3 | Converting the Google Fonts `@import` to a `<link>` (or keeping it first) preserves identical font rendering | Pitfall 4 | LOW — visually verify against baseline screenshot |
| A4 | Playwright DOM-diff is optional, not required, for FOUND-05 "byte-equivalent render" (a baseline screenshot diff + manual interaction check suffices) | Validation Architecture | LOW — planner may elevate to required |

**Note:** "byte-for-byte equivalent" in FOUND-05 is interpreted as *rendered-output equivalent* (visual + behavioral), not literal byte-identical HTML — extraction necessarily changes the HTML bytes. Confirm this interpretation with the user if strict byte-identity was intended (it is not achievable while extracting).

## Open Questions

1. **Canonical "all 103 tests" command.**
   - What we know: `npm test` runs 5 files and is green (116 reported). `node --test tests/` over all 12 files has independent failures (gitignored `macro-site/`, network/date-dependent ingestion).
   - What's unclear: which command defines the "103 pass" contract.
   - Recommendation: treat `npm test` as the gate (it's the declared script and is fully green); do not attempt to fix unrelated macro-site/ingestion failures in this phase. Flag for user confirmation.

2. **Strictness of "byte-for-byte equivalent" (FOUND-05).**
   - What we know: extraction changes HTML bytes by definition.
   - Recommendation: interpret as rendered/behavioral equivalence verified via screenshot + interaction diff. Confirm with user.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | tests, tooling | ✓ | v24.11.0 | — |
| npm | install/test | ✓ | v11.6.1 | — |
| http-server | local serve, Lighthouse target, module MIME | ✓ (devDep, via `npx`; not yet in node_modules) | ^14.1.1 | `python -m http.server` (verify MIME) |
| Google Chrome | Lighthouse engine | ✓ | at `C:\Program Files\Google\Chrome\Application\chrome.exe` | Edge (`--chrome-path` to msedge) |
| lighthouse CLI | FOUND-04 baseline | ✗ (not installed) | — | Chrome DevTools "Lighthouse" panel manually; record numbers |
| playwright | optional render/DOM diff | ✗ (dep declared, not installed) | ^1.58.2 | manual screenshot diff |

**Missing dependencies with no fallback:** none (all blocking deps present).
**Missing dependencies with fallback:** lighthouse (use DevTools panel), playwright (manual diff), http-server install (run `npm install` first).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node built-in `node:test` + `node:assert/strict` (Node v24.11.0) |
| Config file | none — files are `tests/*.test.mjs`, command is `package.json` `scripts.test` |
| Quick run command | `node --test tests/index-ui-integrity.test.mjs` (the only file touching root index.html) |
| Full suite command | `npm test` (5 files; green = 116 assertions, 0 fail) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | CSS extracted, no visual change | manual + screenshot diff | `npx lighthouse` accessibility score parity; visual diff vs baseline | ❌ Wave 0 (perf/visual script) |
| FOUND-02 | JS in ES modules, shell HTML, all globals exposed | regression + interaction | `node --test tests/index-ui-integrity.test.mjs` (syntax + IDs); manual click-through of 7 window fns | ✅ (existing) + ❌ Wave 0 (optional interaction smoke) |
| FOUND-03 | Full suite unchanged | regression | `npm test` | ✅ (existing) |
| FOUND-04 | Lighthouse baseline recorded | artifact | `npx lighthouse ... --output-path=docs/perf/...` | ❌ Wave 0 (baseline file) |
| FOUND-05 | Deploy still works, render equivalent | CI + manual | inspect `deploy-pages.yml` artifact contains styles/+js/; load via http-server (not file://) | ❌ Wave 0 (deploy workflow edit + verify) |

### Sampling Rate
- **Per task commit:** `node --test tests/index-ui-integrity.test.mjs` (fast; the only index.html regression test).
- **Per wave merge:** `npm test` (full declared suite, must be 0 fail).
- **Phase gate:** `npm test` green + Lighthouse baseline committed + manual interaction click-through of all 7 `window.*` functions + deploy workflow updated, before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] `docs/perf/baseline-2026-06-20.md` — capture pre-extraction Lighthouse + perf numbers FIRST (so post-extraction can prove no regression). Covers FOUND-04.
- [ ] Decide and document an interaction smoke check (manual checklist or optional Playwright script) for the 7 `window.*` functions. Covers FOUND-02/05.
- [ ] `npm install` to materialize `http-server` in node_modules; `npm install -g lighthouse` (or use `npx`).
- [ ] Edit `.github/workflows/deploy-pages.yml` to copy `styles/` and `js/`. Covers FOUND-05.
- [ ] No new `node:test` files are required for the extraction itself (existing tests are the contract); new tests arrive in Phases 2–3.

## Security Domain

This phase introduces no new data inputs, network calls, auth, or crypto. It reorganizes existing static files. ASVS exposure is minimal.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | public site, no auth (per Out of Scope) |
| V3 Session Management | no | no sessions |
| V4 Access Control | no | public read-only |
| V5 Input Validation | minor | existing `escapeHtml()` in the JS must be preserved during extraction (it guards injected labels) |
| V6 Cryptography | no | none |
| V14 Configuration | yes | preserve `.nojekyll`, CNAME, and pinned CDN for D3 (subresource integrity not currently used — out of scope to add) |

### Known Threat Patterns for buildless static site
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| DOM XSS via injected company/profile labels | Tampering | Keep existing `escapeHtml()` usage intact through the move to `js/`; do not drop it during refactor |
| Supply-chain risk from CDN D3 | Tampering | Pinned version `d3/7.8.5` retained (no change this phase) |

## Sources

### Primary (HIGH confidence)
- Repo files read directly: `index.html`, `package.json`, all 12 `tests/*.test.mjs`, `.github/workflows/deploy-pages.yml`, `.github/workflows/auto-update-data.yml` (via auto-update test), `data/top100-map.js`, `data/credit-ratings.js`, `.gitignore`, `CLAUDE.md`, CONTEXT.md, REQUIREMENTS.md, STATE.md.
- Live tool runs: `npm test` (116 pass / 0 fail), per-file `node --test`, `node --version` (v24.11.0), `npm --version` (v11.6.1), Chrome path probe.

### Secondary (MEDIUM confidence)
- [CITED: developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules] — ES module deferral and scoping semantics (training knowledge; standard and stable).

### Tertiary (LOW confidence)
- A1 (http-server module MIME) — assumed standard; verify with one smoke load.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libs; all tooling present/declared and version-checked.
- Architecture: HIGH — index.html structure, globals, and handlers enumerated directly from source.
- Pitfalls: HIGH — the three landmines (openCompanyProfile, deploy copy list, inline-script test regex) are verified against actual file contents and test assertions.

**Research date:** 2026-06-20
**Valid until:** 2026-07-20 (stable; buildless static — re-verify only if tests or deploy workflow change)
