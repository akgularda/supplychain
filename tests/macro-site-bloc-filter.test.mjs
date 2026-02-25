import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const INDEX_PATH = path.join(process.cwd(), "macro-site", "index.html");
const APP_PATH = path.join(process.cwd(), "macro-site", "app.js");

test("bloc panel includes mode and edge scope controls", () => {
  const html = fs.readFileSync(INDEX_PATH, "utf8");

  assert.match(html, /id="blocMode"/);
  assert.match(html, /id="blocEdgeScope"/);
  assert.match(html, /option value="union"/);
  assert.match(html, /option value="intersection"/);
  assert.match(html, /option value="touching"/);
  assert.match(html, /option value="internal"/);
});

test("bloc filter logic supports intersection and internal scopes", () => {
  const appJs = fs.readFileSync(APP_PATH, "utf8");

  assert.match(appJs, /blocCombinationMode\s*=\s*"union"/);
  assert.match(appJs, /blocEdgeScope\s*=\s*"touching"/);
  assert.match(appJs, /blocCombinationMode\s*===\s*"intersection"/);
  assert.match(appJs, /blocEdgeScope\s*===\s*"internal"/);
  assert.match(appJs, /blocMemberSet\.has\(link\.s\)\s*&&\s*blocMemberSet\.has\(link\.t\)/);
});
