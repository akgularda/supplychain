// Phase 03-02: assert js/viz/index.js wires confidenceScore into the node + link
// tooltips and renders "Confidence: NN%" next to the Phase-2 badge, with a LIVE
// nowYear derived from DATA.meta.generatedAt (no hardcoded year in the score path).
// String-presence style (the repo convention — no DOM in the Node gate).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const VIZ = readFileSync(join(__dirname, "..", "js", "viz", "index.js"), "utf8");

test("viz imports confidenceScore from ../trust/index.js", () => {
  assert.match(VIZ, /import\s*\{[^}]*confidenceScore[^}]*\}\s*from\s*["']\.\.\/trust\/index\.js["']/s);
});

test("viz imports sourceYear from ../data/index.js", () => {
  assert.match(VIZ, /import\s*\{[^}]*sourceYear[^}]*\}\s*from\s*["']\.\.\/data\/index\.js["']/s);
});

test("viz calls confidenceScore in at least two render paths (node + link tooltip)", () => {
  const calls = (VIZ.match(/confidenceScore\(/g) || []).length;
  assert.ok(calls >= 2, `expected >=2 confidenceScore( calls, found ${calls}`);
});

test("viz calls sourceYear to resolve a figure's usable year", () => {
  assert.match(VIZ, /sourceYear\(/);
});

test("both tooltips render the literal 'Confidence:' label with a percent score", () => {
  const labels = (VIZ.match(/Confidence:\s*\$\{\s*score\s*\}\s*%/g) || []).length;
  assert.ok(labels >= 2, `expected >=2 'Confidence: \${score}%' interpolations, found ${labels}`);
});

test("nowYear is derived live from DATA.meta.generatedAt (no hardcoded year literal)", () => {
  assert.match(VIZ, /DATA\.meta\??\.?generatedAt/);
  assert.match(VIZ, /getUTCFullYear\(\)/);
});
