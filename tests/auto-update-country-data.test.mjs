import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const WORKFLOW_PATH = path.join(process.cwd(), ".github", "workflows", "auto-update-data.yml");

test("auto-update workflow file exists", () => {
  assert.ok(fs.existsSync(WORKFLOW_PATH), "auto-update-data.yml must exist");
});

test("auto-update workflow includes country-data build step", () => {
  const workflow = fs.readFileSync(WORKFLOW_PATH, "utf8");
  
  assert.match(
    workflow,
    /build:country-data/,
    "Workflow must include build:country-data step"
  );
});

test("auto-update workflow includes country macro data tests", () => {
  const workflow = fs.readFileSync(WORKFLOW_PATH, "utf8");
  
  assert.match(
    workflow,
    /country-macro-data-schema\.test\.mjs/,
    "Workflow must run country-macro-data-schema.test.mjs"
  );
  
  assert.match(
    workflow,
    /country-macro-ingestion\.test\.mjs/,
    "Workflow must run country-macro-ingestion.test.mjs"
  );
});

test("auto-update workflow commits both data directories", () => {
  const workflow = fs.readFileSync(WORKFLOW_PATH, "utf8");
  
  assert.match(
    workflow,
    /git add data\//,
    "Workflow must add data/ directory"
  );
  
  assert.match(
    workflow,
    /country macro data/,
    "Commit message should mention country macro data"
  );
});

test("auto-update workflow has schedule trigger", () => {
  const workflow = fs.readFileSync(WORKFLOW_PATH, "utf8");
  
  assert.match(
    workflow,
    /schedule:/,
    "Workflow must have schedule trigger"
  );
  
  assert.match(
    workflow,
    /cron:/,
    "Workflow must have cron expression"
  );
});

test("auto-update workflow has manual dispatch trigger", () => {
  const workflow = fs.readFileSync(WORKFLOW_PATH, "utf8");
  
  assert.match(
    workflow,
    /workflow_dispatch:/,
    "Workflow must have workflow_dispatch trigger for manual runs"
  );
});

test("auto-update workflow has content write permissions", () => {
  const workflow = fs.readFileSync(WORKFLOW_PATH, "utf8");
  
  assert.match(
    workflow,
    /permissions:/,
    "Workflow must declare permissions"
  );
  
  assert.match(
    workflow,
    /contents:\s*write/,
    "Workflow must have contents: write permission"
  );
});
