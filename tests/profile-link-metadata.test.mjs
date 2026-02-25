import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const data = JSON.parse(fs.readFileSync("data/top100-map.json", "utf8"));
const profiles = data.profiles || {};

test("profile links include relationship metadata fields", () => {
  const missing = [];

  for (const [symbol, profile] of Object.entries(profiles)) {
    for (const link of profile.links || []) {
      if (!link.k || !link.cf) {
        missing.push({ symbol, link });
      }
    }
  }

  assert.equal(
    missing.length,
    0,
    `Expected all profile links to include k/cf metadata; found ${missing.length} missing entries`,
  );
});

test("source-backed profiles include source-linked relationships", () => {
  const offenders = [];

  for (const [symbol, profile] of Object.entries(profiles)) {
    const hasSources = Array.isArray(profile.sources) && profile.sources.length > 0;
    if (!hasSources) continue;

    const links = profile.links || [];
    const sourcedCount = links.filter((link) => Boolean(link.sf)).length;
    if (sourcedCount === 0) {
      offenders.push({ symbol, linkCount: links.length });
    }
  }

  assert.equal(
    offenders.length,
    0,
    `Expected every source-backed profile to have at least one sf link; offenders: ${JSON.stringify(offenders)}`,
  );
});
