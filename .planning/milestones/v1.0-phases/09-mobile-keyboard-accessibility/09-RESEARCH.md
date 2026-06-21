# Phase 9: Mobile & Keyboard Accessibility - Research

**Researched:** 2026-06-21
**Domain:** Responsive CSS, WAI-ARIA / keyboard accessibility, Playwright viewport + keyboard emulation
**Confidence:** HIGH (all findings verified against the live source in this repo; no external package decisions)

## Summary

This is a buildless static D3 site. Phases 5–7 added five new surfaces — `#bMethodology`, `#bTour`, `#bChokepoints` (+`#bChokepointsReset`), the scenario panel (`#bScenarioTaiwan`, `#scenarioChokepointSelect`, `#bScenarioReset`), and the hero overlay (`#heroPrev/#heroPause/#heroNext/#heroSkip`) — but the responsive `@media` rules, the mobile sheet, and the modal focus-trap registry were **not** updated to cover them. The single biggest defect is that `#chokepointsPanel` and `#scenarioPanel` have **zero CSS in any stylesheet** [VERIFIED: grep of styles/*.css returns no match] — they render in static document flow and overlap the fixed top bar/toolbar on every viewport, and have no mobile treatment at all.

For keyboard: every new control is a real `<button>`/`<select>` with an `aria-label`, so they are individually focusable and operable. The gaps are (1) the toolbar hides via `#bar{display:none}` on mobile with no keyboard-reachable equivalent for the new buttons (mobile sheet omits them), (2) the **hero overlay declares `role="dialog" aria-modal="true"` but is never registered as `activeModal`** [VERIFIED: js/main.js toggles it via `o.hidden` only; `openModal` is never called for it] — so there is no focus trap and focus is not moved into it on open, and Tab can leak to background controls behind a modal-claiming dialog, and (3) `#chokepointsPanel`/`#scenarioPanel` lack `role` semantics issues are fine (they have `role="region"` + `aria-label`) but sit in an illogical tab/visual order because they're unpositioned.

**Primary recommendation:** (1) Add `position:fixed` token-based layout + `@media(max-width:768px)` rules for `#chokepointsPanel`, `#scenarioPanel`, `#heroOverlay`, `#filterPanel`, and the modals; (2) add the five new controls to `#mobileSheet .mGrid` and wire them through the existing `wireMobile` helper; (3) make the hero overlay use the real `openModal`/`closeModal`/`trapFocus` machinery (or an equivalent scoped trap) so it traps focus and restores it; (4) add two new `.mjs` test files (one Node static-assertion test, one Playwright 390×844 + keyboard-only smoke) registered in `package.json scripts.test`, keeping the suite at **275 → 277+** green.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Responsive layout / clipping | CSS (`styles/*.css` `@media`) | — | Pure presentation; Phase-4 tokens own breakpoints |
| Mobile panel access (sheet) | CSS (`#mobileSheet`) + JS (`wireMobile`) | — | Sheet is markup+CSS; actions delegate to existing toolbar handlers |
| Touch node→profile | JS viz (`.on("click")`) | — | D3 click fires on tap; already works, must be asserted not built |
| Keyboard focus order / `:focus` | HTML (DOM order) + CSS (`:focus-visible`) | — | Tab order = DOM order; visible ring already exists in layout.css |
| Modal focus trap | JS (`trapFocus`/`openModal` in ui/index.js) | — | Existing machinery; hero overlay must opt in |
| ARIA roles/labels | HTML attributes | — | Static markup; new panels already have `role`/`aria-label` |
| Test: structure/ARIA/@media | Node (`node --test`, fs string asserts) | — | Cheap, no browser needed for attribute/CSS presence |
| Test: real keyboard + touch journey | Playwright (already a dep) | — | Only a browser can verify focus movement + tap → profile |

## Standard Stack

This phase introduces **no new runtime dependencies**. Everything needed is already installed.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `playwright` | ^1.58.2 (installed) [VERIFIED: package.json deps] | Headless Chromium for viewport (390×844) + keyboard-only + tap emulation | Already the project's e2e tool; `page.setViewportSize`, `page.keyboard`, `page.tap`, `hasTouch` device emulation |
| `node:test` + `node:assert/strict` | Node built-in (in use across 24 suites) | Static structural/ARIA/@media string assertions | Zero-dep, fast, matches every existing `*.test.mjs` |
| `http-server` | ^14.1.1 (devDep) [VERIFIED: package.json] | Serve the static site for Playwright to load | Already present; buildless deploy needs a static server in tests |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Chromium device descriptor (`devices['iPhone 13']` or manual `{viewport, hasTouch:true, isMobile:true}`) | bundled with Playwright | Enables `page.tap()` (requires `hasTouch`) | Mobile smoke only |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Playwright e2e for keyboard journey | jsdom + synthetic events | jsdom does NOT implement focus movement, `:focus-visible`, or `aria-modal` semantics faithfully — would produce false greens. Reject. |
| Full Playwright run on every `npm test` | Split: Node static test always-on + Playwright behind same `scripts.test` | Playwright adds ~2–4s and needs a served origin; acceptable since CI already lists it as a dep. Keep both registered. |
| `axe-core` automated audit | manual targeted asserts | axe is excellent but is a new dependency and a credibility/buildless concern; out of scope for v1. Defer to a future phase. |

**Installation:** None required. Confirm the browser binary is present:
```bash
npx playwright install chromium   # one-time; CI may already cache it
```

## Package Legitimacy Audit

> No new external packages are installed in this phase. All tooling (`playwright`, `http-server`, `node:test`) is already present and verified in `package.json`.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| playwright | npm | mature | very high | github.com/microsoft/playwright | n/a (pre-installed) | Already a dependency — no new install |
| http-server | npm | mature | very high | github.com/http-party/http-server | n/a (pre-installed) | Already a devDependency — no new install |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
                         index.html (semantic shell)
            ┌──────────────┬───────────────┬───────────────────────────┐
   fixed overlays      toolbar #bar     new panels (BROKEN)        modals/dialogs
   #top #subtitle   bReset…bMethodology  #chokepointsPanel        #helpModal
   #searchWrap        bTour bChokepoints  #scenarioPanel           #methodologyModal
   #companyCard       companyJump         (NO CSS → static flow,    #compareModal
   #legend #layers                         overlaps everything)     #onboardingPanel
        │                  │                      │                  #heroOverlay (dialog
        │                  │                      │                   but NOT trapped)
        ▼                  ▼                      ▼                        │
   ┌───────────────────────────────────────────────────────────────┐     │
   │  styles/*.css  base→layout→components→theme (cascade order)    │     │
   │   @media(max-width:768px): hides #bar, shows #mobileToggle,    │     │
   │   sizes #companyCard/#searchWrap — but NOT the 4 new panels    │     │
   └───────────────────────────────────────────────────────────────┘     │
        │                                                                 │
        ▼   (mobile)                                                      ▼
   #mobileToggle → #mobileSheet (.mGrid)  ──wireMobile()──►  toolbar handlers
        (Back/Reset/Filter/Export/Compare/Help/Save/Bookmarks/Global)
        ▲  MISSING: Methodology, Tour, Chokepoints, Scenario             │
        │                                                                │
   js/ui/index.js  wireUI()  ── openModal/closeModal/trapFocus ──────────┘
        keydown switch (g/l/f/b/'/'/e/h, ESC, Ctrl+S, Tab-trap when activeModal)
   js/main.js  hero wiring (bTour/heroNext/Prev/Pause/Skip, ESC→skip)
   js/viz/index.js  node .on("click")→openProfile  (fires on touch tap ✓)
```

### Recommended Project Structure
```
styles/theme.css        # ADD: @media rules for the 4 new panels + modal mobile sizing
                        #          (theme.css loads last → wins cascade, same place as
                        #           existing @media(max-width:768px) block, lines 1–104)
index.html              # ADD: 4 new buttons inside #mobileSheet .mGrid
js/ui/index.js          # ADD: wireMobile("mMethodology"…), make hero overlay an activeModal
                        #      OR add a scoped focus trap for #heroOverlay
tests/
  mobile-keyboard-a11y.test.mjs   # NEW (Node): static asserts — tabindex/role/aria/@media present
  mobile-keyboard.spec.mjs        # NEW (Playwright): 390×844 mobile + keyboard-only journey
```

### Pattern 1: Token-based fixed positioning for the new panels
**What:** `#chokepointsPanel`/`#scenarioPanel` currently have NO position rule, so they fall into static flow at the top of `<body>` and overlap the fixed `#top`/`#bar`. Give them `position:fixed` anchored with Phase-4 spacing tokens, then collapse them into the mobile sheet / full-width stack at ≤768px.
**When to use:** Both new panels, on every viewport (this also fixes desktop).
**Example:**
```css
/* layout.css (desktop) — anchor below the toolbar, left column, scrollable */
#chokepointsPanel,#scenarioPanel{
  position:fixed; left:var(--space-6); z-index:95;
  width:280px; max-height:38vh; overflow-y:auto;
  background:rgba(10,10,10,.95); border:1px solid var(--color-surface-raised);
  border-radius:var(--radius-lg); padding:var(--space-5); display:none;
}
#chokepointsPanel{ bottom:calc(var(--space-6) + 180px); }
#scenarioPanel{ bottom:var(--space-6); }

/* theme.css @media(max-width:768px) — full-width, stacked, above the canvas */
@media (max-width:768px){
  #chokepointsPanel,#scenarioPanel{
    left:8px; right:8px; width:auto; bottom:64px; max-height:40vh;
  }
}
```

### Pattern 2: Extend the mobile sheet for new controls (reuse `wireMobile`)
**What:** The `#mobileSheet .mGrid` lists 9 buttons; the four new toolbar actions are absent, so on mobile (where `#bar{display:none}`) they are completely unreachable.
**When to use:** Methodology, Tour, Chokepoints highlight, Scenario (Taiwan).
**Example:**
```html
<!-- index.html, inside #mobileSheet .mGrid -->
<button id="mMethodology" type="button">Method</button>
<button id="mTour"        type="button">Tour</button>
<button id="mChokepoints" type="button">Chokepts</button>
<button id="mScenario"    type="button">Scenario</button>
```
```js
// js/ui/index.js wireUI(), next to the existing wireMobile(...) calls
wireMobile("mMethodology", () => document.getElementById("bMethodology").click());
wireMobile("mTour",        () => document.getElementById("bTour").click());
wireMobile("mChokepoints", () => document.getElementById("bChokepoints").click());
wireMobile("mScenario",    () => document.getElementById("bScenarioTaiwan").click());
```
*Note:* `.mGrid` is `repeat(4,1fr)` on mobile — 13 buttons → 4 rows, fine. `wireMobile` already auto-closes the sheet after the action (`closeMobileAfterAction`).

### Pattern 3: Make the hero overlay a real trapped modal
**What:** `#heroOverlay` has `role="dialog" aria-modal="true"` but is shown/hidden via `o.hidden=false/true` in `js/main.js heroRender`. It is never set as `activeModal`, so `trapFocus` never runs and `openModal`'s "focus first element / restore on close" never applies. With `aria-modal="true"` a screen reader treats the background as inert while sighted keyboard focus can still Tab out — an inconsistency to fix.
**When to use:** On every hero `render(step)` (open) and `render(null)` (close).
**Example (minimal, reuses existing machinery):**
```js
// in heroRender(step,...) when step shown:
//   import + call openModal-equivalent OR set activeModal = heroOverlay and focus heroSkip
//   on close (step===null): closeModal-equivalent → restore focus, clear activeModal
// The existing keydown switch already does trapFocus(e, activeModal) on Tab and
// routes Escape; register heroOverlay there too. main.js already has a scoped
// ESC→skip handler — fold it into the central ESC switch to avoid double-binding.
```
**Tradeoff:** The hero auto-advances every 5.5s; trapping focus is correct for `aria-modal` but ensure `Pause`/`Skip` are reachable first in Tab order (they are — DOM order is Prev/Pause/Next/Skip).

### Anti-Patterns to Avoid
- **`div onclick` without keyboard:** `#top10Sidebar` items use `<div ... onclick=openCompanyProfile>` (no `tabindex`/`role`/keydown) [VERIFIED: js/ui/index.js renderTop10List]. It's hidden on mobile and not in the search→filter→select→reset journey, so it's out of the PERF-03 critical path — but if any task touches it, add `role="button" tabindex="0"` + Enter/Space. Do not regress it; do not expand scope to fix it unless trivial.
- **Hover-only provenance:** the tooltip `#tt` opens on `mouseenter` only. The reachable tap path to the same source data is the company card `Sources` button → `#provenanceDrawer` (keyboard + tap) [VERIFIED: cardSourcesBtn→openProvenance]. Assert that path exists; do NOT make the hover tooltip the sole route to source links.
- **Hiding focus:** never reintroduce `outline:none` without a `:focus-visible` replacement. The global ring `button:focus-visible,select:focus-visible,input:focus-visible{outline:1px solid var(--acc)}` already exists (layout.css:22) — preserve it.
- **Restarting the simulation on a filter/reset:** PERF-01's no-restart invariant is enforced by `no-restart-invariant.test.mjs`; mobile/keyboard changes must not call `simulation.restart()`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trap for hero overlay | A new bespoke trap loop | Existing `trapFocus`/`openModal`/`closeModal` in `js/ui/index.js` | Already handles Shift+Tab wrap, first-focus, and focus restore; tested by modal flows |
| Mobile control access | Custom mobile menu | Existing `#mobileSheet` + `wireMobile()` helper | Auto-closes sheet, delegates to toolbar handlers, already styled |
| Touch tap → profile | A `touchstart` listener on nodes | The existing D3 `.on("click")` | Click is synthesized from tap on touch devices; adding touchstart causes double-fire |
| Visible focus ring | New per-element outlines | The existing global `:focus-visible` token rule | One rule, accent-token colored, already in layout.css |
| Reduced motion | New media query | Existing `@media(prefers-reduced-motion:reduce)` block (theme.css:151) | Already zeroes animations + hero autoplay respects `reducedMotion()` |

**Key insight:** Phase 9 is almost entirely *wiring existing primitives to the new surfaces*, not building new mechanisms. The machinery (focus trap, mobile sheet, focus ring, reduced motion, touch click) all exists; the new panels/controls were simply never connected to it.

## Runtime State Inventory

> Phase 9 is a CSS/markup/wiring change — no rename, no datastore, no migration. Inventory included for completeness.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — verified by grep; no datastore keys changed | none |
| Live service config | None — buildless static site, no external service config | none |
| OS-registered state | None — no scheduled tasks/daemons | none |
| Secrets/env vars | None | none |
| Build artifacts | None — buildless; data frozen (`window.SUPPLY_MAP_DATA` static) | none |

**localStorage flags touched:** `heroSeen`, `onboardingSeen`, `searchHistory`, `savedViews` are read/written by existing code; Phase 9 must not change their keys. (verified: js/state.js helpers + ui/index.js)

## Common Pitfalls

### Pitfall 1: New panels invisible because they're `display:none` with no toggle, OR visible-but-overlapping because they have no position
**What goes wrong:** `#chokepointsPanel`/`#scenarioPanel` have NO CSS at all. They are NOT `display:none` (unlike `#companyCard`/`#filterPanel`), so they render in static flow at the very top of `<body>`, overlapping `#top` and `#bar`.
**Why it happens:** The panels were added to HTML in Phases 6–7 with inline `role`/`aria-label` but no stylesheet rule was ever written.
**How to avoid:** Add explicit `position:fixed` + `display` rules (Pattern 1). Decide the open/close UX (always-visible docked vs. toggled) before writing tasks.
**Warning signs:** At 390px the chokepoints/scenario text appears jammed under the logo; on desktop they cover the toolbar.

### Pitfall 2: Mobile users cannot reach Methodology/Tour/Chokepoints/Scenario
**What goes wrong:** `@media(max-width:768px){ #bar{display:none} }` removes the entire toolbar, but the mobile sheet only mirrors 9 of the older buttons.
**Why it happens:** `#mobileSheet .mGrid` was authored before the new toolbar buttons existed.
**How to avoid:** Add the 4 buttons + `wireMobile` calls (Pattern 2).
**Warning signs:** On a phone, no way to open Methodology or replay the Tour.

### Pitfall 3: Hero overlay claims to be a modal but doesn't trap focus
**What goes wrong:** `aria-modal="true"` tells AT the rest of the page is inert, but Tab still moves to background controls and focus isn't placed inside on open.
**Why it happens:** Hero uses `hidden` toggling, bypassing `openModal`/`activeModal`.
**How to avoid:** Register it as `activeModal` on show / clear on hide, and move focus to `#heroSkip` (or `#heroNext`) on open; restore on close (Pattern 3).
**Warning signs:** Keyboard journey test: after the tour opens, `Tab` lands on `#bReset` instead of staying within the overlay.

### Pitfall 4: `#scenarioChokepointSelect` fires on `change` only — keyboard users must commit
**What goes wrong:** The select runs the scenario on `change`. With a keyboard, opening the native dropdown and arrowing changes value but `change` fires on commit (Enter/blur) — this is fine, but a test that only `selectOption()`s must wait for the impact list to populate.
**How to avoid:** In the Playwright test, use `page.selectOption('#scenarioChokepointSelect', {index:1})` then assert `#scenarioImpactList` non-empty.
**Warning signs:** Flaky scenario assertion if it reads the list before the `change` handler runs.

### Pitfall 5: Adding a test file but forgetting `package.json scripts.test`
**What goes wrong:** `npm test` runs ONLY the 24 explicitly listed files [VERIFIED: package.json scripts.test is an explicit file list, not a glob]. A new `.mjs` not added there is silently never run. (This is exactly why the orphaned `macro-site-*.test.mjs` files — which reference a non-existent `macro-site/` dir — pass `npm test`: they're not in the list. `node --test tests/*.test.mjs` would FAIL on them.)
**How to avoid:** Append both new files to the `scripts.test` string. Confirm `npm test` reports **277+ pass, 0 fail**.
**Warning signs:** New test "passes" locally via `node --test tests/mytest.mjs` but `npm test` count is unchanged at 275.

## Code Examples

### Node static-assertion test (no browser) — tabindex/role/aria/@media presence
```js
// tests/mobile-keyboard-a11y.test.mjs   [Source: pattern mirrors macro-site-accessibility.test.mjs]
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf8");
const theme = fs.readFileSync(path.join(process.cwd(), "styles", "theme.css"), "utf8");
const layout = fs.readFileSync(path.join(process.cwd(), "styles", "layout.css"), "utf8");
const css = theme + layout;

test("new toolbar controls expose accessible names", () => {
  for (const id of ["bMethodology","bTour","bChokepoints","bScenarioTaiwan","bScenarioReset"]) {
    assert.match(html, new RegExp(`id="${id}"[^>]*aria-label=`), `${id} needs aria-label`);
  }
  assert.match(html, /id="scenarioChokepointSelect"[^>]*aria-label=/);
});

test("hero overlay controls are keyboard-operable buttons with labels", () => {
  for (const id of ["heroPrev","heroPause","heroNext","heroSkip"]) {
    assert.match(html, new RegExp(`id="${id}"[^>]*aria-label=`), `${id} needs aria-label`);
  }
});

test("new panels carry region roles + labels", () => {
  assert.match(html, /id="chokepointsPanel"[^>]*role="region"[^>]*aria-label=/);
  assert.match(html, /id="scenarioPanel"[^>]*role="region"[^>]*aria-label=/);
});

test("mobile sheet exposes the new controls", () => {
  for (const id of ["mMethodology","mTour","mChokepoints","mScenario"]) {
    assert.match(html, new RegExp(`id="${id}"`), `mobile sheet missing ${id}`);
  }
});

test("responsive rules cover the new panels", () => {
  assert.match(css, /@media[^{]*max-width:\s*768px/);
  assert.match(css, /#chokepointsPanel/);   // positioned somewhere
  assert.match(css, /#scenarioPanel/);
});

test("visible focus ring preserved", () => {
  assert.match(layout, /:focus-visible[^}]*outline/);
});
```

### Playwright mobile + keyboard-only smoke
```js
// tests/mobile-keyboard.spec.mjs   [Source: Playwright API — setViewportSize/keyboard/tap]
import test from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { createServer } from "http-server";

let server, base;
test.before(async () => {
  server = createServer({ root: process.cwd(), cache: -1 });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.server.address().port}/index.html`;
});
test.after(() => server.server.close());

test("mobile 390x844: node tap opens a profile and panels reachable", async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport:{width:390,height:844}, hasTouch:true, isMobile:true });
  const page = await ctx.newPage();
  await page.goto(base);
  await page.waitForSelector("#canvas .node", { timeout: 15000 });
  await page.tap("#mobileToggle");
  await assert.ok(await page.isVisible("#mobileSheet"));
  // node tap -> profile (D3 click fires on tap)
  await page.locator("#canvas .node").first().tap();
  await page.waitForSelector("#companyCard", { state: "visible" });
  await browser.close();
});

test("keyboard-only journey: search -> filter -> select -> reset (no pointer)", async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext()).newPage();
  await page.goto(base);
  await page.waitForSelector("#canvas .node");
  await page.keyboard.press("/");                 // focus search
  assert.equal(await page.evaluate(() => document.activeElement.id), "q");
  await page.keyboard.type("AAPL");
  await page.keyboard.press("Enter");             // select via suggestion
  await page.waitForSelector("#companyCard", { state: "visible" });
  await page.keyboard.press("Escape");            // reset to global
  // every new control is focusable + has an accessible name:
  const noName = await page.$$eval(
    "#bMethodology,#bTour,#bChokepoints,#bScenarioTaiwan,#bScenarioReset,#heroSkip,#scenarioChokepointSelect",
    els => els.filter(e => !e.getAttribute("aria-label")).map(e=>e.id));
  assert.deepEqual(noName, []);
  await browser.close();
});
```
*Note:* keep Playwright tests resilient to the ~15s D3 settle; gate on selectors, not timeouts. If CI lacks a Chromium binary, the planner should add `npx playwright install chromium` to the test setup task.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `outline:none` global reset | `:focus-visible` only (keyboard, not mouse) | already in layout.css | Preserve; don't regress to `outline:none` |
| `div onclick` for actions | real `<button>`/`role=button tabindex=0`+keydown | WCAG 2.1 baseline | New controls already use `<button>` — keep |
| Hover-only tooltips | tap/click equivalent (provenance drawer) | WCAG 1.4.13 | Tap path exists; assert it |

**Deprecated/outdated:**
- The orphaned `macro-site-*.test.mjs` files reference a non-existent `macro-site/` directory and only pass because they're excluded from `scripts.test`. Do NOT add them to the run list and do NOT model new tests on their path assumptions.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `node:test` (built-in) + `node:assert/strict`; Playwright ^1.58.2 for browser smoke |
| Config file | none — explicit file list in `package.json` `scripts.test` |
| Quick run command | `node --test tests/mobile-keyboard-a11y.test.mjs` |
| Full suite command | `npm test` (currently **275 pass / 0 fail** [VERIFIED: ran `npm test`]) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERF-02 | New panels positioned + responsive `@media` present | unit (string) | `node --test tests/mobile-keyboard-a11y.test.mjs` | ❌ Wave 0 |
| PERF-02 | Mobile sheet exposes new controls | unit (string) | same file | ❌ Wave 0 |
| PERF-02 | 390×844: node tap → profile; sheet reachable | e2e | `node --test tests/mobile-keyboard.spec.mjs` | ❌ Wave 0 |
| PERF-03 | search→filter→select→reset keyboard-only path | e2e | same spec | ❌ Wave 0 |
| PERF-03 | every new control focusable + accessible name | unit + e2e | both new files | ❌ Wave 0 |
| PERF-03 | hero overlay traps + restores focus | e2e | spec (assert activeElement inside overlay after open) | ❌ Wave 0 |
| PERF-03 SC3 | ARIA baseline preserved (roles/labels on new panels) | unit (string) | a11y test | ❌ Wave 0 |
| (regression) | suite stays green incl. no-restart invariant | full | `npm test` → 277+ pass | ✅ existing 275 |

### Sampling Rate
- **Per task commit:** `node --test tests/mobile-keyboard-a11y.test.mjs` (fast, no browser)
- **Per wave merge:** `npm test` (full 277+, includes both new files + the no-restart invariant)
- **Phase gate:** `npm test` green (0 fail) before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/mobile-keyboard-a11y.test.mjs` — covers PERF-02 (responsive/markup) + PERF-03 SC3 (ARIA)
- [ ] `tests/mobile-keyboard.spec.mjs` — covers PERF-02 (touch) + PERF-03 (keyboard journey, focus trap)
- [ ] Register BOTH new files in `package.json scripts.test` (else silently unrun — Pitfall 5)
- [ ] Ensure Chromium binary available for Playwright (`npx playwright install chromium` in CI/setup)

## Security Domain

> `security_enforcement` config not located in `.planning/config.json` for this read; this phase is presentation/markup/test only and introduces no new input, network, auth, crypto, or data flow.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth in product (public investor site) |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | No protected resources |
| V5 Input Validation | low | Only existing search input; no new user input. Existing `escapeHtml` on innerHTML paths preserved |
| V6 Cryptography | no | None |

### Known Threat Patterns for static D3 site
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via innerHTML in new panels | Tampering | `escapeHtml` already applied in `renderScenario`/`renderChokepoints`; Phase 9 must NOT introduce raw-string innerHTML for the new mobile buttons (use `<button>` markup / textContent) |
| Test server exposure | Info disclosure | `http-server` bound to `127.0.0.1` and ephemeral port in tests; closed in `test.after` |

## Project Constraints (from CLAUDE.md)

No `./CLAUDE.md` found in the working directory at research time. Constraints derive from CONTEXT.md and the codebase:
- **Buildless / static** — no framework, no build tool, no bundler (REQUIREMENTS Out of Scope).
- **Data frozen** — `window.SUPPLY_MAP_DATA` is static; do not change data.
- **No new features / no SEO** — SEO + launch gate is Phase 10; gesture richness is deferred.
- **Suite stays green** — `npm test` (currently 275) must remain 0-fail; new tests added to `scripts.test`.
- **Preserve PERF-01 no-restart invariant** — enforced by `no-restart-invariant.test.mjs`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `#chokepointsPanel`/`#scenarioPanel` should be docked `position:fixed` panels (vs. toggled like `#filterPanel`) | Pattern 1 | Low — exact open/close UX is Claude's discretion; either works as long as not overlapping. Confirm with planner whether they should be toggle-on-demand to save mobile space. |
| A2 | Chromium binary is available in the CI/test environment for Playwright | Validation | Medium — if absent, the e2e spec errors at launch; mitigation is a `playwright install chromium` setup task. The Node static test (a11y) has no such dependency and still covers PERF-02/03 structurally. |
| A3 | `node --test` `before`/`after` hooks reliably manage the http-server lifecycle | Code Examples | Low — standard pattern; alternative is `page.goto('file://…')` but module `<script type=module>` + CORS may block file:// loading, so a served origin is safer. |
| A4 | Hero overlay should fully trap focus despite 5.5s autoplay | Pattern 3 | Low-Medium — trapping is correct for `aria-modal="true"`; if autoplay + trap feels jarring, alternative is to drop `aria-modal` to `false` and NOT trap. Planner/discuss should pick one consistent model. |

## Open Questions

1. **Docked vs. toggled new panels on mobile**
   - What we know: they currently have no CSS and overlap everything; mobile has limited space.
   - What's unclear: should chokepoints/scenario be always-visible docked panels, or opened on demand from the mobile sheet (like Filter)?
   - Recommendation: toggle-on-demand via the mobile sheet on ≤768px (saves space), docked on desktop. Cheap either way; pick during planning.

2. **Hero overlay focus model**
   - What we know: it declares `aria-modal="true"` but doesn't trap.
   - What's unclear: trap-and-restore (A4) vs. relax `aria-modal`.
   - Recommendation: trap + restore using existing `openModal`/`closeModal`; place initial focus on `#heroSkip` so escape-without-mouse is one key away.

3. **`#top10Sidebar` div-onclick keyboard gap**
   - What we know: not keyboard-operable, but hidden ≤768px and outside the PERF-03 journey.
   - Recommendation: out of scope unless a task already edits it; if so, add `role="button" tabindex="0"` + Enter/Space. Note for completeness, don't expand scope.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node `node:test` | All tests | ✓ | bundled | — |
| playwright (npm) | e2e smoke | ✓ (dep) | ^1.58.2 | Node static a11y test still covers structure |
| Chromium binary | Playwright launch | ? (verify) | — | `npx playwright install chromium` setup task |
| http-server | serve static site in e2e | ✓ (devDep) | ^14.1.1 | `file://` (risky w/ ES modules + CORS) |

**Missing dependencies with no fallback:** none confirmed.
**Missing dependencies with fallback:** Chromium binary may need a one-time install; the Node static test is the fallback structural gate.

## Sources

### Primary (HIGH confidence)
- This repo (read in session): `index.html`, `styles/{layout,components,theme}.css`, `js/ui/index.js`, `js/ui/narrative.js`, `js/main.js`, `js/viz/index.js`, `package.json`, `tests/macro-site-accessibility.test.mjs`, `tests/index-ui-integrity.test.mjs` — all claims tagged [VERIFIED] come from direct reads/greps.
- `npm test` executed in session → 275 pass / 0 fail.
- `grep styles/*.css` for `chokepoint|scenario` → no matches (confirms missing CSS).

### Secondary (MEDIUM confidence)
- Playwright API surface (`setViewportSize`, `hasTouch`, `page.tap`, `page.keyboard`) — from training knowledge of the stable Playwright API; cross-checks against installed `^1.58.2`. [ASSUMED] for exact method availability; verify against `node_modules/playwright` if a method errors.

### Tertiary (LOW confidence)
- WCAG 1.4.13 (hover/focus content) and 2.1.1 (keyboard) category numbers cited from training; the substantive controls (focusable buttons, tap path, visible focus) are verified in code regardless of the exact WCAG numbering.

## Metadata

**Confidence breakdown:**
- Mobile gaps: HIGH — missing CSS and missing mobile-sheet buttons verified by grep/read.
- Keyboard gaps: HIGH — hero overlay non-trapping verified in main.js; all controls confirmed as labeled `<button>`/`<select>` in index.html.
- ARIA: HIGH — roles/labels read directly from markup.
- Testing: MEDIUM-HIGH — pattern matches existing suites; Playwright method names [ASSUMED] pending binary check.

**Research date:** 2026-06-21
**Valid until:** ~2026-07-21 (stable buildless codebase; re-verify only if Phases 5–7 markup changes)
