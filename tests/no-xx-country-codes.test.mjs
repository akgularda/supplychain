import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const map = JSON.parse(fs.readFileSync("data/top100-map.json", "utf8"));
const profiles = map.profiles || {};

test("profile nodes do not use XX placeholder country code", () => {
  const offenders = [];

  for (const [symbol, profile] of Object.entries(profiles)) {
    for (const node of profile.nodes || []) {
      if ((node.c || "") === "XX") {
        offenders.push({ symbol, id: node.id, label: (node.l || "").split("\n")[0] });
      }
    }
  }

  assert.equal(
    offenders.length,
    0,
    `Found ${offenders.length} profile nodes still using XX. Samples: ${JSON.stringify(offenders.slice(0, 12))}`,
  );
});
