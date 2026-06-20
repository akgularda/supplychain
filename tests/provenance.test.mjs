import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { provenanceFor, badgeHtml } from "../js/trust/index.js";

const ALLOWED_TAGS = new Set(["observed", "estimated", "unknown"]);

// Rich dataset (test suite reads the JSON; the browser loads the thin .js).
const data = JSON.parse(fs.readFileSync("data/top100-map.json", "utf8"));
const profiles = data.profiles || {};
const meta = data.meta || {};

// Mirror js/data/index.js:153 — build the per-profile source FK index.
function sourceIndexFor(profile) {
  return Object.fromEntries((profile.sources || []).map((s) => [s.id, s]));
}

// --- provenanceFor: tag derivation (data-derived, never fabricated) -------

test("provenanceFor derives observed from a resolving high* confidence", () => {
  const ctx = { sourceIndex: { S1: { id: "S1", title: "SEC 10-K", url: "https://www.sec.gov/x" } } };
  const prov = provenanceFor({ confidence: "high (company disclosure)", sourceId: "S1" }, ctx);
  assert.equal(prov.tag, "observed");
  assert.ok(prov.source, "expected a resolved source");
  assert.equal(prov.source.url, "https://www.sec.gov/x");
});

test("provenanceFor derives estimated from a resolving medium* confidence", () => {
  const ctx = { sourceIndex: { S1: { id: "S1", title: "Vendor IR", url: "https://example.com/ir" } } };
  const prov = provenanceFor({ confidence: "medium (source-backed)", sourceId: "S1" }, ctx);
  assert.equal(prov.tag, "estimated");
  assert.ok(prov.source, "expected a resolved source");
});

test("provenanceFor reads link cf and an empty sf yields no source key", () => {
  const ctx = { sourceIndex: { S1: { id: "S1", title: "x", url: "https://example.com" } } };
  const prov = provenanceFor({ cf: "medium (structural)", sf: "" }, ctx);
  assert.equal(prov.tag, "estimated");
  assert.equal(prov.source, undefined, "empty sf must produce NO source key");
});

test("provenanceFor with a dangling FK keeps the tag but drops the source", () => {
  const ctx = { sourceIndex: { S1: { id: "S1", title: "x", url: "https://example.com" } } };
  const prov = provenanceFor({ sourceId: "DANGLING", confidence: "high (SEC filing)" }, ctx);
  assert.equal(prov.tag, "observed");
  assert.equal(prov.source, undefined, "dangling FK must produce NO source key");
});

test("provenanceFor with no confidence/cf returns unknown and no source", () => {
  const prov = provenanceFor({}, { sourceIndex: {} });
  assert.equal(prov.tag, "unknown");
  assert.equal(prov.source, undefined);
});

test("provenanceFor market-cap marker tags observed and links to meta.source", () => {
  const prov = provenanceFor(
    { marketcap: true },
    { meta: { source: "https://companiesmarketcap.com/?download=csv" } },
  );
  assert.equal(prov.tag, "observed");
  assert.equal(prov.source.url, "https://companiesmarketcap.com/?download=csv");
});

test("provenanceFor market-cap marker without a url falls back to unknown", () => {
  const prov = provenanceFor({ marketcap: true }, { meta: {} });
  assert.equal(prov.tag, "unknown");
  assert.equal(prov.source, undefined);
});

test("provenanceFor market-cap marker accepts top100_source_url as the url", () => {
  const prov = provenanceFor(
    { marketcap: true },
    { meta: { top100_source_url: "https://companiesmarketcap.com/?download=csv" } },
  );
  assert.equal(prov.tag, "observed");
  assert.equal(prov.source.url, "https://companiesmarketcap.com/?download=csv");
});

// --- DATA SWEEP: every real profile node + link -> non-throwing {tag} -----

test("data sweep: every profile node maps to an allowed tag without throwing", () => {
  let resolvedToSource = 0;
  let unsourced = 0;
  let total = 0;

  for (const profile of Object.values(profiles)) {
    const sourceIndex = sourceIndexFor(profile);
    for (const node of profile.nodes || []) {
      total += 1;
      const prov = provenanceFor(node, { sourceIndex, meta });
      assert.ok(ALLOWED_TAGS.has(prov.tag), `tag must be in allowed set, got ${prov.tag}`);
      // The tag must be DERIVED: no literal observed/estimated token lives in the data.
      const raw = String(node.confidence ?? "").toLowerCase();
      if (raw.startsWith("high")) assert.equal(prov.tag, "observed");
      else if (raw.startsWith("medium")) assert.equal(prov.tag, "estimated");
      else assert.equal(prov.tag, "unknown");
      if (prov.source) {
        assert.ok(prov.source.url, "a present source must carry a url");
        resolvedToSource += 1;
      } else {
        unsourced += 1;
      }
    }
  }

  assert.ok(total > 0, "expected to sweep at least one node");
  // Proves derivation is real, not hardcoded: both buckets must be non-empty.
  assert.ok(resolvedToSource > 0, "expected at least one node to resolve to a real source");
  assert.ok(unsourced > 0, "expected at least one node (dangling/missing FK) to be unsourced");
});

test("data sweep: every profile link maps to an allowed tag without throwing", () => {
  let unsourced = 0;
  let total = 0;

  for (const profile of Object.values(profiles)) {
    const sourceIndex = sourceIndexFor(profile);
    for (const link of profile.links || []) {
      total += 1;
      const prov = provenanceFor(link, { sourceIndex, meta });
      assert.ok(ALLOWED_TAGS.has(prov.tag), `tag must be in allowed set, got ${prov.tag}`);
      if (!prov.source) unsourced += 1;
    }
  }

  assert.ok(total > 0, "expected to sweep at least one link");
  assert.ok(unsourced > 0, "expected at least one unsourced link (empty/dangling sf)");
});

// --- badgeHtml: accessible pill + guarded source link --------------------

test("badgeHtml renders observed pill with a reachable source link", () => {
  const html = badgeHtml({ tag: "observed", source: { label: "SEC 10-K", url: "https://www.sec.gov/x" } });
  assert.match(html, /confidence-high/);
  assert.match(html, /aria-label="Provenance: Observed/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener/);
  assert.match(html, /https:\/\/www\.sec\.gov\/x/);
});

test("badgeHtml renders unknown pill with NO link", () => {
  const html = badgeHtml({ tag: "unknown" });
  assert.match(html, /confidence-low/);
  assert.match(html, /Unknown/);
  assert.ok(!/<a /.test(html), "unknown badge must not emit an <a> link");
});

test("badgeHtml renders estimated pill with the medium class", () => {
  const html = badgeHtml({ tag: "estimated", source: { label: "IR", url: "https://example.com/ir" } });
  assert.match(html, /confidence-medium/);
  assert.match(html, /Estimated/);
});

test("badgeHtml omits the <a> when the source url is not http*", () => {
  const html = badgeHtml({ tag: "observed", source: { label: "x", url: "javascript:alert(1)" } });
  assert.ok(!/<a /.test(html), "non-http url must not be emitted as a link");
});

test("badgeHtml escapes a malicious source title", () => {
  const html = badgeHtml({ tag: "observed", source: { label: "<img>", url: "https://example.com" } });
  assert.match(html, /&lt;img&gt;/);
  assert.ok(!/<img>/.test(html), "raw <img> must not appear in the output");
});
