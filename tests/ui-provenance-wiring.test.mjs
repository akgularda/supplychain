// Phase 02-03: assert js/ui/index.js wires the trust API into the ui-owned
// render paths — the company-card anchor figure and the compare-grid
// "Verified Entities" count — and that the src.t->title drawer bug is fixed.
// String-presence style (the repo convention — no DOM in the Node gate).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const UI = readFileSync(join(__dirname, "..", "js", "ui", "index.js"), "utf8");
const DATA = readFileSync(join(__dirname, "..", "js", "data", "index.js"), "utf8");

test("ui imports the trust API from ../trust/index.js", () => {
  assert.match(UI, /from\s+["']\.\.\/trust\/index\.js["']/);
  assert.match(UI, /provenanceFor/);
  assert.match(UI, /renderProvenanceBadge/);
});

test("ui calls provenanceFor on >=2 render paths (card anchor + compare grid)", () => {
  const calls = (UI.match(/provenanceFor\(/g) || []).length;
  assert.ok(calls >= 2, `expected >=2 provenanceFor( calls, found ${calls}`);
});

test("compare-grid Verified Entities no longer uses the old inline filter", () => {
  // The prior heuristic: `const verified = p.nodes.filter(n => n.confidence && n.confidence.includes('source')).length;`
  // That exact verified-count filter must be gone; the count now goes through provenanceFor.
  assert.doesNotMatch(UI, /const verified = p\.nodes\.filter\(n => n\.confidence && n\.confidence\.includes\(["']source["']\)\)/);
  // The verified count is derived from a provenanceFor result (observed + resolving source).
  assert.match(UI, /const verified = p\.nodes\.filter\([\s\S]*?provenanceFor\(/);
});

test("openProvenance reads the real source.title (src.t bug fixed)", () => {
  assert.match(UI, /src\.title/);
  assert.doesNotMatch(UI, /src\.t\b(?!itle)/);
});

test("parseYearsFromSources reads source.title (src.t bug fixed in data)", () => {
  assert.match(DATA, /source\.title/);
  assert.doesNotMatch(DATA, /source\.t\b(?!itle)/);
});
