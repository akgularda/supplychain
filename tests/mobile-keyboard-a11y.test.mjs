import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf8");
const theme = fs.readFileSync(path.join(process.cwd(), "styles", "theme.css"), "utf8");
const layout = fs.readFileSync(path.join(process.cwd(), "styles", "layout.css"), "utf8");
const css = theme + layout;
const ui = fs.readFileSync(path.join(process.cwd(), "js", "ui", "index.js"), "utf8");
const main = fs.readFileSync(path.join(process.cwd(), "js", "main.js"), "utf8");

test("new toolbar controls expose accessible names", () => {
  for (const id of ["bMethodology", "bTour", "bChokepoints", "bScenarioTaiwan", "bScenarioReset"]) {
    assert.match(html, new RegExp(`id="${id}"[^>]*aria-label=`), `${id} needs aria-label`);
  }
  assert.match(html, /id="scenarioChokepointSelect"[^>]*aria-label=/, "scenarioChokepointSelect needs aria-label");
});

test("hero overlay controls are keyboard-operable buttons with labels", () => {
  for (const id of ["heroPrev", "heroPause", "heroNext", "heroSkip"]) {
    assert.match(html, new RegExp(`id="${id}"[^>]*aria-label=`), `${id} needs aria-label`);
  }
});

test("new panels carry region roles + labels", () => {
  assert.match(html, /id="chokepointsPanel"[^>]*role="region"[^>]*aria-label=/, "chokepointsPanel needs role=region + aria-label");
  assert.match(html, /id="scenarioPanel"[^>]*role="region"[^>]*aria-label=/, "scenarioPanel needs role=region + aria-label");
});

test("mobile sheet exposes the new controls", () => {
  for (const id of ["mMethodology", "mTour", "mChokepoints", "mScenario"]) {
    assert.match(html, new RegExp(`id="${id}"`), `mobile sheet missing ${id}`);
  }
});

test("new panels are positioned (no static-flow header overlap)", () => {
  // #chokepointsPanel and #scenarioPanel must be position:fixed somewhere in the cascade
  assert.match(css, /#chokepointsPanel/, "chokepointsPanel must be styled");
  assert.match(css, /#scenarioPanel/, "scenarioPanel must be styled");
  assert.match(
    layout,
    /#(chokepointsPanel|scenarioPanel)[^{]*[,{][^}]*position\s*:\s*fixed/,
    "new panels must be position:fixed in layout.css"
  );
});

test("responsive rules cover the new panels + filter + hero + modals", () => {
  const mq = css.match(/@media[^{]*max-width:\s*768px[^{]*\{[\s\S]*?\n\}/);
  assert.ok(mq, "an @media (max-width:768px) block must exist");
  const block = theme.match(/@media\s*\(\s*max-width:\s*768px\s*\)\s*\{[\s\S]*?\n\}/);
  assert.ok(block, "theme.css @media(max-width:768px) block must exist");
  const b = block[0];
  for (const sel of ["#chokepointsPanel", "#scenarioPanel", "#filterPanel", "#heroOverlay"]) {
    assert.ok(b.includes(sel), `@media(max-width:768px) must cover ${sel}`);
  }
  // at least one of the modals gets mobile treatment
  assert.ok(
    /#helpModal|#methodologyModal|#compareModal/.test(b),
    "@media(max-width:768px) must cover the modals"
  );
});

test("visible focus ring preserved", () => {
  assert.match(layout, /:focus-visible[^}]*outline/, "global :focus-visible outline rule must remain");
});

// --- Plan 09-02 (PERF-03): keyboard journey + hero-trap wiring + focus ring --

test("hero overlay is provably routed through the modal trap machinery (PERF-03)", () => {
  // ui/index.js wires the hero overlay into the SAME activeModal/openModal-style
  // machinery as every other dialog (no hand-rolled trap loop).
  for (const token of ["activeModal", "openHeroOverlay", "closeHeroOverlay", "registerHeroOverlay", "heroOverlayEl"]) {
    assert.match(ui, new RegExp(token), `js/ui/index.js must reference ${token}`);
  }
  // The central ESC switch must route the hero overlay (single ESC binding).
  assert.match(ui, /activeModal\s*===\s*heroOverlayEl/, "central ESC switch must handle the hero overlay");
  // openHeroOverlay focuses #heroSkip first (escape-without-mouse is one key away).
  assert.match(ui, /querySelector\(["']#heroSkip["']\)/, "openHeroOverlay must focus #heroSkip first");
  // main.js routes the overlay open/close through the helpers (not bare hidden toggling).
  assert.match(main, /registerHeroOverlay/, "main.js must register the hero overlay");
  assert.match(main, /openHeroOverlay\(\)/, "main.js heroRender must open via the modal machinery");
  assert.match(main, /closeHeroOverlay\(\)/, "main.js heroRender must close via the modal machinery");
});

test("the keyboard-only journey search -> filter -> select -> reset stays wired (PERF-03)", () => {
  // search: '/' focuses the search input
  assert.match(ui, /case '\/':[\s\S]*?searchInput\.focus\(\);[\s\S]*?break;/, "'/' must focus the search input");
  // filter: bFilter toggles the filter panel; apply/reset wired
  assert.match(ui, /getElementById\("bFilter"\)\.onclick/, "#bFilter must toggle the filter panel");
  assert.match(ui, /function applyFilters\(/, "applyFilters must exist");
  assert.match(ui, /function resetFilters\(/, "resetFilters must exist");
  // select: search Enter / company jump select open a profile
  assert.match(ui, /jump\.addEventListener\("change"/, "company jump select must open a profile");
  assert.match(ui, /searchInput\.addEventListener\("keydown"/, "search Enter must select a result");
  // reset: Escape returns to global / clears the lock (central keydown switch)
  assert.match(ui, /case 'escape':[\s\S]*openGlobal\(\)/, "Escape must reset the view to global");
  assert.match(ui, /getElementById\("bReset"\)\.onclick/, "#bReset must be wired");
});

test("every new control + mobile-sheet button is focusable with an accessible name (PERF-03)", () => {
  // Toolbar / select / hero controls: accessible name via aria-label.
  const ariaLabelled = [
    "bMethodology", "bTour", "bChokepoints", "bScenarioTaiwan", "bScenarioReset",
    "scenarioChokepointSelect", "heroSkip",
  ];
  for (const id of ariaLabelled) {
    assert.match(html, new RegExp(`id="${id}"[^>]*aria-label="[^"]+"`), `${id} needs a non-empty aria-label`);
  }
  // The 4 mobile-sheet buttons (09-01): focusable <button> with visible textContent.
  const sheetButtons = {
    mMethodology: "Method",
    mTour: "Tour",
    mChokepoints: "Chokepts",
    mScenario: "Scenario",
  };
  for (const [id, label] of Object.entries(sheetButtons)) {
    assert.match(
      html,
      new RegExp(`<button id="${id}"[^>]*>\\s*${label}\\s*</button>`),
      `${id} must be a <button> with visible "${label}" text`,
    );
  }
});

test("focusable controls keep the visible focus ring (no outline:none reintroduced)", () => {
  // The token :focus-visible rule applies to button/select/input.
  assert.match(
    layout,
    /button:focus-visible[^}]*outline\s*:\s*[^};]*var\(--acc\)/,
    "button:focus-visible must keep the --acc outline ring",
  );
  // Guard against a blanket outline:none on these interactive controls.
  assert.doesNotMatch(
    css,
    /\bbutton\s*\{[^}]*outline\s*:\s*none/,
    "no blanket outline:none on button",
  );
});
