import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const MACRO_SITE_DIR = path.join(process.cwd(), "macro-site");

test("macro-site directory exists", () => {
  assert.ok(fs.existsSync(MACRO_SITE_DIR), "macro-site directory must exist");
});

test("macro-site/index.html exists", () => {
  const htmlPath = path.join(MACRO_SITE_DIR, "index.html");
  assert.ok(fs.existsSync(htmlPath), "macro-site/index.html must exist");
});

test("macro-site/styles.css exists", () => {
  const cssPath = path.join(MACRO_SITE_DIR, "styles.css");
  assert.ok(fs.existsSync(cssPath), "macro-site/styles.css must exist");
});

test("macro-site/app.js exists", () => {
  const jsPath = path.join(MACRO_SITE_DIR, "app.js");
  assert.ok(fs.existsSync(jsPath), "macro-site/app.js must exist");
});

test("macro-site/README.md exists", () => {
  const readmePath = path.join(MACRO_SITE_DIR, "README.md");
  assert.ok(fs.existsSync(readmePath), "macro-site/README.md must exist");
});

test("macro-site/index.html contains required container IDs", () => {
  const htmlPath = path.join(MACRO_SITE_DIR, "index.html");
  const html = fs.readFileSync(htmlPath, "utf8");
  
  const requiredIds = [
    "macroViz",      // Main visualization container
    "macroBar",      // Control bar
    "macroSearch",   // Search input
    "macroDetail",   // Country detail card
    "detailProvenance", // Provenance detail panel
    "macroTop10",    // Top 10 producers panel
    "macroLoading",  // Loading indicator
  ];
  
  for (const id of requiredIds) {
    assert.match(html, new RegExp(`id="${id}"`), `macro-site/index.html must contain id="${id}"`);
  }
});

test("macro-site/app.js declares legend provenance element", () => {
  const jsPath = path.join(MACRO_SITE_DIR, "app.js");
  const js = fs.readFileSync(jsPath, "utf8");
  assert.match(js, /id="legendProvenance"/, "macro-site/app.js must render legendProvenance element");
});

test("macro-site loads D3 and country macro data", () => {
  const htmlPath = path.join(MACRO_SITE_DIR, "index.html");
  const html = fs.readFileSync(htmlPath, "utf8");
  
  assert.match(
    html,
    /<script[^>]+src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/d3\/7\./i,
    "macro-site must load D3 v7"
  );
  
  assert.match(
    html,
    /<script[^>]+src="\.\.\/data\/country-macro-map\.js"/i,
    "macro-site must load country-macro-map.js"
  );
});
