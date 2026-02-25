import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const DATA_PATH = path.join(process.cwd(), "data", "country-macro-map.js");
const JSON_PATH = path.join(process.cwd(), "data", "country-macro-map.json");
const MACRO_README_PATH = path.join(process.cwd(), "macro-site", "README.md");

/**
 * Extract data from JS file by evaluating in a sandbox
 */
function loadData() {
  const content = fs.readFileSync(DATA_PATH, "utf8");
  
  // Create a sandbox context
  const sandbox = {
    window: { countryMacroData: null }
  };
  
  // Execute the script in sandbox
  const context = vm.createContext(sandbox);
  vm.runInContext(content, context);
  
  return sandbox.window.countryMacroData;
}

test("country-macro-map.js exists and is valid", () => {
  assert.ok(fs.existsSync(DATA_PATH), "country-macro-map.js must exist");
});

test("data has required top-level fields", async () => {
  const data = loadData();
  
  assert.ok(data, "Data must be loadable");
  assert.ok(data.meta, "data.meta is required");
  assert.ok(Array.isArray(data.nodes), "data.nodes must be an array");
  assert.ok(Array.isArray(data.links), "data.links must be an array");
  assert.ok(Array.isArray(data.sectors), "data.sectors must be an array");
  assert.ok(data.topProducersBySectorYear, "data.topProducersBySectorYear is required");
});

test("meta field has required properties", async () => {
  const data = loadData();
  const meta = data.meta;
  
  assert.ok(meta.generatedAt, "meta.generatedAt is required");
  assert.ok(meta.sources, "meta.sources is required");
  assert.ok(meta.sources.gdp, "meta.sources.gdp is required");
  assert.ok(meta.sources.trade, "meta.sources.trade is required");
  assert.ok(meta.sources.sectors, "meta.sources.sectors is required");
  assert.ok(meta.snapshotDate, "meta.snapshotDate is required");
  assert.match(
    meta.snapshotDate,
    /^\d{4}-\d{2}-\d{2}$/,
    `meta.snapshotDate must be ISO date (YYYY-MM-DD), got ${meta.snapshotDate}`,
  );
});

test("trade source contract is aligned with macro-site README", async () => {
  const data = loadData();
  const readme = fs.readFileSync(MACRO_README_PATH, "utf8");
  const tradeSource = String(data?.meta?.sources?.trade || "");

  assert.ok(
    tradeSource.toLowerCase().includes("comtrade"),
    `Expected trade source to reference Comtrade, got ${tradeSource}`,
  );

  assert.match(
    readme,
    /Bilateral Trade Links:\s*UN Comtrade/i,
    "macro-site README must document UN Comtrade as bilateral trade source",
  );
});

test("node fields are complete and valid", async () => {
  const data = loadData();
  const nodes = data.nodes;
  
  assert.ok(nodes.length >= 100, `Must have >= 100 countries, found ${nodes.length}`);
  
  const requiredFields = ["iso2", "iso3", "country", "gdpUsd", "exportsUsd", "importsUsd", "bubbleRadius"];
  
  for (const node of nodes) {
    for (const field of requiredFields) {
      assert.ok(node[field] !== undefined, `Node ${node.iso2 || "unknown"} missing field: ${field}`);
    }
    
    // Validate types and ranges
    assert.ok(typeof node.iso2 === "string" && node.iso2.length === 2, `Invalid iso2: ${node.iso2}`);
    assert.ok(typeof node.iso3 === "string" && node.iso3.length === 3, `Invalid iso3: ${node.iso3}`);
    assert.ok(typeof node.country === "string" && node.country.length > 0, "Country name must be non-empty");
    assert.ok(typeof node.gdpUsd === "number" && node.gdpUsd > 0, `GDP must be positive: ${node.gdpUsd}`);
    assert.ok(typeof node.exportsUsd === "number" && node.exportsUsd >= 0, `Exports must be >= 0: ${node.exportsUsd}`);
    assert.ok(typeof node.importsUsd === "number" && node.importsUsd >= 0, `Imports must be >= 0: ${node.importsUsd}`);
    assert.ok(typeof node.bubbleRadius === "number" && node.bubbleRadius > 0, `Bubble radius must be positive: ${node.bubbleRadius}`);
    
    // No XX placeholder codes
    assert.notEqual(node.iso2, "XX", "XX placeholder codes not allowed");
  }
});

test("link fields are complete and valid", async () => {
  const data = loadData();
  const links = data.links;
  
  assert.ok(links.length > 0, "Must have at least one trade link");
  
  const nodeIso2Set = new Set(data.nodes.map(n => n.iso2));
  
  for (const link of links) {
    assert.ok(link.s, "Link source (s) is required");
    assert.ok(link.t, "Link target (t) is required");
    assert.ok(typeof link.tradeUsd === "number" && link.tradeUsd > 0, `Trade value must be positive: ${link.tradeUsd}`);
    assert.ok(typeof link.year === "number", `Year must be a number: ${link.year}`);
    assert.ok(["both", "export", "import"].includes(link.direction), `Invalid direction: ${link.direction}`);
    
    // Validate country references
    assert.ok(nodeIso2Set.has(link.s), `Link source ${link.s} not found in nodes`);
    assert.ok(nodeIso2Set.has(link.t), `Link target ${link.t} not found in nodes`);
  }
});

test("sectors include required minimum 8 sectors", async () => {
  const data = loadData();
  const sectors = data.sectors;
  
  assert.ok(sectors.length >= 8, `Must have >= 8 sectors, found ${sectors.length}`);
  
  const requiredSectorIds = ["medicine", "electronics", "automotive", "energy", "agriculture", "textiles", "metals", "chemicals"];
  const sectorIds = new Set(sectors.map(s => s.id));
  
  for (const id of requiredSectorIds) {
    assert.ok(sectorIds.has(id), `Required sector missing: ${id}`);
  }
  
  // Validate sector structure
  for (const sector of sectors) {
    assert.ok(sector.id, "Sector id is required");
    assert.ok(sector.name, "Sector name is required");
  }
});

test("topProducersBySectorYear has medicine producers for latest year", async () => {
  const data = loadData();
  const topProducers = data.topProducersBySectorYear;
  
  assert.ok(topProducers, "topProducersBySectorYear is required");
  
  const years = Object.keys(topProducers).map(Number).sort((a, b) => b - a);
  assert.ok(years.length >= 1, "Must have at least one year of top producers data");
  
  const latestYear = years[0].toString();
  const yearData = topProducers[latestYear];
  
  assert.ok(yearData, `Year ${latestYear} must have sector data`);
  assert.ok(yearData.medicine, `Medicine sector required for year ${latestYear}`);
  assert.ok(Array.isArray(yearData.medicine), "Medicine top producers must be an array");
  assert.ok(
    yearData.medicine.length > 0 && yearData.medicine.length <= 10,
    `Medicine must have 1-10 producers, found ${yearData.medicine.length}`,
  );
  
  // Validate producer structure
  for (const producer of yearData.medicine) {
    assert.ok(producer.iso2, "Producer iso2 is required");
    assert.ok(typeof producer.value === "number" && producer.value > 0, `Producer value must be positive: ${producer.value}`);
    assert.equal(
      producer.provenance,
      "observed",
      `Producer provenance must be observed (real data mode), got ${producer.provenance}`,
    );
  }
});

test("nodes expose trade estimation flags", async () => {
  const data = loadData();
  for (const node of data.nodes) {
    assert.equal(
      typeof node.exportsEstimated,
      "boolean",
      `Node ${node.iso2} must include boolean exportsEstimated`,
    );
    assert.equal(
      typeof node.importsEstimated,
      "boolean",
      `Node ${node.iso2} must include boolean importsEstimated`,
    );
    assert.equal(
      node.exportsEstimated,
      false,
      `Node ${node.iso2} exportsEstimated must be false in real-data mode`,
    );
    assert.equal(
      node.importsEstimated,
      false,
      `Node ${node.iso2} importsEstimated must be false in real-data mode`,
    );
  }
});

test("all sectors have producer lists for latest year", async () => {
  const data = loadData();
  const topProducers = data.topProducersBySectorYear;
  
  const years = Object.keys(topProducers).map(Number).sort((a, b) => b - a);
  const latestYear = years[0].toString();
  const yearData = topProducers[latestYear];
  
  for (const sector of data.sectors) {
    const producers = yearData[sector.id];
    assert.ok(producers, `Sector ${sector.id} must have top producers data`);
    assert.ok(Array.isArray(producers), `Top producers for ${sector.id} must be an array`);
    assert.ok(
      producers.length > 0 && producers.length <= 10,
      `Sector ${sector.id} must have 1-10 producers, found ${producers.length}`,
    );
    producers.forEach((producer) => {
      assert.equal(
        producer.provenance,
        "observed",
        `Sector ${sector.id} producer provenance must be observed, got ${producer.provenance}`,
      );
    });
  }
});

test("data has multiple years of coverage", async () => {
  const data = loadData();
  const linkYears = [...new Set(data.links.map(l => l.year))].sort((a, b) => a - b);
  
  assert.ok(linkYears.length >= 2, `Must have >= 2 years of link data, found ${linkYears.length}`);
  
  const producerYears = Object.keys(data.topProducersBySectorYear).map(Number).sort((a, b) => a - b);
  assert.ok(producerYears.length >= 2, `Must have >= 2 years of producer data, found ${producerYears.length}`);
});
