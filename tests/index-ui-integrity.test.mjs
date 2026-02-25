import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const html = fs.readFileSync("index.html", "utf8");

function extractInlineScript(source) {
  const match = source.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/i);
  assert.ok(match, "Expected one inline script block in index.html");
  return match[1];
}

test("index inline script parses without syntax errors", () => {
  const script = extractInlineScript(html);
  const tempFile = path.join(os.tmpdir(), `supplychain-inline-${Date.now()}.js`);
  fs.writeFileSync(tempFile, script, "utf8");

  const check = spawnSync(process.execPath, ["--check", tempFile], { encoding: "utf8" });
  if (check.status !== 0) {
    const err = check.stderr || check.stdout || "unknown syntax error";
    assert.fail(`Inline script syntax check failed:\n${err}`);
  }
});

test("help and compare modals include accessibility dialog semantics", () => {
  assert.match(
    html,
    /<div id="helpModal"[^>]*role="dialog"[^>]*aria-modal="true"/i,
    "helpModal must declare dialog semantics",
  );
  assert.match(
    html,
    /<div id="compareModal"[^>]*role="dialog"[^>]*aria-modal="true"/i,
    "compareModal must declare dialog semantics",
  );
});

test("fatal error banner and onboarding panel are present", () => {
  assert.match(html, /id="fatalError"/, "fatalError banner container is required");
  assert.match(html, /id="onboardingPanel"/, "onboarding panel container is required");
});

test("ratings script and insights containers are present", () => {
  assert.match(
    html,
    /<script[^>]+src="\.\/data\/credit-ratings\.js"/i,
    "credit ratings data script must be loaded",
  );
  assert.match(html, /id="cardRatings"/, "cardRatings container is required");
  assert.match(html, /id="cardOverlap"/, "cardOverlap container is required");
  assert.match(html, /id="cardTimeline"/, "cardTimeline container is required");
  assert.match(html, /id="provenanceDrawer"/, "provenanceDrawer container is required");
});

test("autocomplete and mobile controls are present", () => {
  assert.match(html, /id="searchSuggest"/, "searchSuggest container is required");
  assert.match(html, /id="mobileToggle"/, "mobileToggle button is required");
  assert.match(html, /id="mobileSheet"/, "mobileSheet container is required");
});
