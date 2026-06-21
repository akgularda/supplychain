// Phase 03-03: assert the freshness indicator (TRUST-05) reads the LIVE dataset
// meta value, that js/ui updateStatusIndicator is the SOLE #lastUpdated owner
// (the js/viz duplicate write is gone), and that no hardcoded date drives it.
// String-presence style (repo convention — no DOM in the Node gate).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const UI = readFileSync(join(__dirname, "..", "js", "ui", "index.js"), "utf8");
const VIZ = readFileSync(join(__dirname, "..", "js", "viz", "index.js"), "utf8");
const HTML = readFileSync(join(__dirname, "..", "index.html"), "utf8");

test("index.html footer exposes the #lastUpdated freshness slot", () => {
  assert.match(HTML, /id="lastUpdated"/, "footer must carry a #lastUpdated element");
});

test("js/ui updateStatusIndicator reads the LIVE meta value (no hardcoded date)", () => {
  assert.match(UI, /function updateStatusIndicator\s*\(/, "updateStatusIndicator must exist");
  assert.match(
    UI,
    /window\.SUPPLY_MAP_DATA/,
    "must read window.SUPPLY_MAP_DATA live each call",
  );
  assert.match(
    UI,
    /meta\.(generatedAt|lastUpdated)/,
    "must read meta.generatedAt/lastUpdated for freshness",
  );
});

test("js/ui is the writer of #lastUpdated", () => {
  assert.match(
    UI,
    /getElementById\(['"]lastUpdated['"]\)/,
    "js/ui must set the #lastUpdated element",
  );
});

test("js/viz NO LONGER writes #lastUpdated (single owner — viz duplicate gone)", () => {
  assert.doesNotMatch(
    VIZ,
    /getElementById\(['"]lastUpdated['"]\)/,
    "viz must not write #lastUpdated; js/ui is the sole owner",
  );
});

test("no hardcoded date literal drives the freshness text", () => {
  // The freshness date must come from live meta, never an inline ISO/year literal.
  assert.doesNotMatch(
    UI,
    /lastUpdated['"]\)[^;]*=\s*['"]20\d\d-/,
    "the #lastUpdated assignment must not use a hardcoded ISO date string",
  );
  // No literal ISO date string anywhere in the freshness path.
  assert.doesNotMatch(UI, /["']20\d\d-\d\d-\d\dT/, "no hardcoded ISO datetime literal allowed");
});
