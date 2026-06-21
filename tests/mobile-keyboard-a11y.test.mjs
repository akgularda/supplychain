import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf8");
const theme = fs.readFileSync(path.join(process.cwd(), "styles", "theme.css"), "utf8");
const layout = fs.readFileSync(path.join(process.cwd(), "styles", "layout.css"), "utf8");
const css = theme + layout;

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
