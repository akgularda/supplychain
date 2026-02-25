import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const APP_PATH = path.join(process.cwd(), "macro-site", "app.js");

test("default view uses GDP + trade lens primitives", () => {
  const appJs = fs.readFileSync(APP_PATH, "utf8");

  assert.match(appJs, /const DEFAULT_VIEW_LENS = Object\.freeze\(/);
  assert.match(appJs, /defaultLensScore/);
  assert.match(appJs, /function getDefaultLensColor\(/);
  assert.match(appJs, /Default lens:/);
});

