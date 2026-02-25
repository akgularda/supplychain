import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const INDEX_PATH = path.join(process.cwd(), "macro-site", "index.html");
const APP_PATH = path.join(process.cwd(), "macro-site", "app.js");
const README_PATH = path.join(process.cwd(), "macro-site", "README.md");

test("macro-site exposes accessibility labels on key controls", () => {
  const html = fs.readFileSync(INDEX_PATH, "utf8");

  assert.match(html, /id="macroSearch"[^>]*aria-label="Search countries"/i);
  assert.match(html, /id="btnYear"[^>]*aria-label=/i);
  assert.match(html, /id="btnDirection"[^>]*aria-label=/i);
  assert.match(html, /id="btnThreshold"[^>]*aria-label=/i);
  assert.match(html, /id="btnBloc"[^>]*aria-label=/i);
  assert.match(html, /id="btnSector"[^>]*aria-label=/i);
  assert.match(html, /id="btnReset"[^>]*aria-label=/i);
});

test("macro-site app implements keyboard shortcuts", () => {
  const appJs = fs.readFileSync(APP_PATH, "utf8");

  assert.match(appJs, /addEventListener\("keydown",\s*handleGlobalKeydown\)/);
  assert.match(appJs, /event\.key\s*===\s*"\/"/);
  assert.match(appJs, /event\.key\s*!==\s*"Escape"/);
});

test("macro-site README keyboard shortcuts stay documented", () => {
  const readme = fs.readFileSync(README_PATH, "utf8");

  assert.match(readme, /## Keyboard Shortcuts/i);
  assert.match(readme, /`Esc`\s*-\s*Close detail panel\s*\/\s*Reset view/i);
  assert.match(readme, /`\/`\s*-\s*Focus search/i);
});
