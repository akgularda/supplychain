// tests/no-restart-invariant.test.mjs
//
// PERF-01 source-level guard: prove the "simple filter/style/highlight change never
// restarts the force simulation or re-renders the graph" invariant at the source level
// so it cannot silently regress.
//
// Strategy: slice the BODY of each simple-change handler (filter apply/reset, the
// bLabels/bFlow/bBottlenecks onclicks, the keydown l/f/b cases, highlightChokepoints,
// and the viz highlightBy/resetHighlight primitives) and assert NONE contain a banned
// simulation-restart / re-render call.
//
// The invariant is "*simple* changes don't restart", NOT "nothing restarts". So the
// legitimate reheats are ALLOW-LISTED:
//   - bReset's STATE.simulation.alpha(0.22).restart()  (js/ui:1108)
//   - render()/updateGraph()                            (view/data changes)
// The guard scopes its assertions to the sliced simple-change bodies only, and an
// explicit allow-list assertion proves bReset's reheat remains present (guards against
// it being accidentally deleted, and documents the invariant boundary).

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const UI = readFileSync("js/ui/index.js", "utf8");
const VIZ = readFileSync("js/viz/index.js", "utf8");

// Crude but sufficient brace-matcher: find `signature`, then slice from its first "{"
// to the matching "}". Works for the named functions and the inline arrow `= () => {`
// handlers (the signature for those is the LHS up to and including `=> {`).
function bodyOf(src, signature) {
  const start = src.indexOf(signature);
  assert.ok(start >= 0, `not found: ${signature}`);
  let depth = 0;
  const open = src.indexOf("{", start);
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) return src.slice(open, i + 1);
  }
  throw new Error("unbalanced braces for " + signature);
}

// The banned set: a full-simulation restart or a re-render in a simple-change body
// means the opacity-only invariant has been broken.
const BANNED = [
  /\bd3\.forceSimulation\s*\(/,
  /\.alpha\s*\(/,
  /\.restart\s*\(/,
  /\bupdateGraph\s*\(/,
  /\brender\s*\(/,
];

function assertClean(label, body) {
  for (const re of BANNED) {
    assert.doesNotMatch(body, re, `${label} must not match ${re} (simple changes never restart/re-render)`);
  }
}

// --- Named simple-change handlers in js/ui ---------------------------------
for (const sig of [
  "function applyFilters(",
  "function resetFilters(",
  "function highlightChokepoints(",
]) {
  test(`${sig}) body contains no simulation-restart / re-render call`, () => {
    assertClean(sig, bodyOf(UI, sig));
  });
}

// --- Viz highlight primitives (opacity-only) -------------------------------
for (const sig of ["function highlightBy(", "function resetHighlight("]) {
  test(`${sig}) (viz) is opacity-only — no restart / re-render`, () => {
    assertClean(sig, bodyOf(VIZ, sig));
  });
}

// --- Inline wireUI onclick handlers (bLabels / bBottlenecks) ----------------
for (const sig of [
  'document.getElementById("bLabels").onclick = () => {',
  'document.getElementById("bBottlenecks").onclick = () => {',
]) {
  test(`inline ${sig} body contains no restart / re-render call`, () => {
    assertClean(sig, bodyOf(UI, sig));
  });
}

// --- bFlow is a single bare toggleParticles() call --------------------------
test("bFlow onclick is a bare toggleParticles() call (no restart / re-render)", () => {
  assert.match(
    UI,
    /document\.getElementById\("bFlow"\)\.onclick = \(\) => toggleParticles\(\);/,
    "bFlow must delegate to toggleParticles() only",
  );
  // The single-statement arrow has no body to slice; assert the statement itself is clean.
  const stmt = UI.slice(UI.indexOf('document.getElementById("bFlow").onclick'));
  assertClean("bFlow onclick", stmt.slice(0, stmt.indexOf(";") + 1));
});

// --- keydown switch cases l / f / b -----------------------------------------
// Slice the substring between `case 'X':` and the next `break;` and assert it is clean.
function caseBody(letter) {
  const marker = `case '${letter}':`;
  const start = UI.indexOf(marker);
  assert.ok(start >= 0, `keydown case not found: ${marker}`);
  const end = UI.indexOf("break;", start);
  assert.ok(end > start, `no break; after ${marker}`);
  return UI.slice(start, end + "break;".length);
}
for (const letter of ["l", "f", "b"]) {
  test(`keydown case '${letter}' contains no restart / re-render call`, () => {
    assertClean(`keydown case '${letter}'`, caseBody(letter));
  });
}

// --- ALLOW-LIST PROOF: bReset's legitimate reheat MUST remain ----------------
// Documents the invariant boundary: the guard above is scoped to simple changes; the
// view/data-change reheat is intentional and must not be removed.
test("ALLOW-LIST: bReset legitimately reheats (alpha(0.22).restart() present)", () => {
  assert.match(
    UI,
    /alpha\(0\.22\)\.restart\(\)/,
    "bReset's legitimate reheat must remain — invariant is scoped to simple changes only",
  );
});
