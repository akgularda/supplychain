// Phase 02-02: assert js/viz/index.js wires the trust API into the three viz
// render paths (node tooltip, link tooltip, $cap stat bar / verified-node class)
// and no longer carries the old duplicated inline confidence derivation.
// String-presence style (the repo convention — no DOM in the Node gate).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const VIZ = readFileSync(join(__dirname, "..", "js", "viz", "index.js"), "utf8");

test("viz imports the trust API from ../trust/index.js", () => {
  assert.match(VIZ, /from\s+["']\.\.\/trust\/index\.js["']/);
  assert.match(VIZ, /provenanceFor/);
  assert.match(VIZ, /badgeHtml/);
  assert.match(VIZ, /renderProvenanceBadge/);
});

test("viz tooltips call provenanceFor (node + link render paths)", () => {
  const calls = (VIZ.match(/provenanceFor\(/g) || []).length;
  assert.ok(calls >= 2, `expected >=2 provenanceFor( calls, found ${calls}`);
});

test("the old inline confidenceLower derivation is gone from viz", () => {
  assert.doesNotMatch(VIZ, /confidenceLower/);
});

test("$cap stat bar uses the market-cap observed marker", () => {
  assert.match(VIZ, /marketcap:\s*true/);
});

test("verified-node class is trust-derived, not a standalone .includes('source') check", () => {
  assert.doesNotMatch(VIZ, /confidence\.includes\(["']source["']\)/);
});
