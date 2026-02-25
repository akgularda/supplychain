import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const RAW_DIR = path.join(process.cwd(), "data", "raw");
const EXPECTED_RECENT_YEAR = String(new Date().getUTCFullYear() - 2);

test("raw data directory exists", () => {
  assert.ok(fs.existsSync(RAW_DIR), "data/raw directory must exist");
});

test("GDP fetch module exports correctly", async () => {
  const { fetchGDPData, getISO3toISO2Map } = await import("../scripts/lib/fetch-worldbank-gdp.mjs");
  
  assert.ok(typeof fetchGDPData === "function", "fetchGDPData must be a function");
  assert.ok(typeof getISO3toISO2Map === "function", "getISO3toISO2Map must be a function");
  
  const gdpData = await fetchGDPData();
  assert.ok(typeof gdpData === "object", "GDP data must be an object");
  assert.ok(Object.keys(gdpData).length > 0, "GDP data must not be empty");
  
  // Check normalized country codes
  for (const [iso3, data] of Object.entries(gdpData)) {
    assert.ok(iso3.length === 3, `ISO3 code must be 3 characters: ${iso3}`);
    assert.ok(typeof data.gdpUsd === "number", `GDP must be a number for ${iso3}`);
    assert.ok(data.gdpUsd > 0, `GDP must be positive for ${iso3}`);
  }
});

test("Trade fetch module exports correctly", async () => {
  const { fetchTradeData, getCountryCodeMap } = await import("../scripts/lib/fetch-imf-dots-trade.mjs");
  
  assert.ok(typeof fetchTradeData === "function", "fetchTradeData must be a function");
  assert.ok(typeof getCountryCodeMap === "function", "getCountryCodeMap must be a function");
  
  const tradeData = await fetchTradeData();
  assert.ok(typeof tradeData === "object", "Trade data must be an object");
  assert.ok(Array.isArray(tradeData.flows), "Trade data must have flows array");
  assert.ok(tradeData.flows.length > 0, "Trade flows must not be empty");
  
  // Check trade flow structure
  for (const flow of tradeData.flows.slice(0, 10)) {
    assert.ok(typeof flow.reporter === "string", "Flow reporter must be string");
    assert.ok(typeof flow.partner === "string", "Flow partner must be string");
    assert.ok(typeof flow.tradeUsd === "number", "Flow tradeUsd must be number");
    assert.ok(flow.tradeUsd > 0, "Flow tradeUsd must be positive");
    assert.ok(typeof flow.year === "number", "Flow year must be number");
  }
});

test("Sector exports fetch module exports correctly", async () => {
  const { fetchSectorExports, getSectorDefinitions } = await import("../scripts/lib/fetch-sector-exports.mjs");
  
  assert.ok(typeof fetchSectorExports === "function", "fetchSectorExports must be a function");
  assert.ok(typeof getSectorDefinitions === "function", "getSectorDefinitions must be a function");
  
  const sectorData = await fetchSectorExports();
  assert.ok(typeof sectorData === "object", "Sector data must be an object");
  assert.ok(sectorData.data, "Sector data must have data property");
  
  // Check sector structure
  const sectors = Object.keys(sectorData.data);
  assert.ok(sectors.length >= 8, `Must have >= 8 sectors, found ${sectors.length}`);
  
  for (const sector of sectors) {
    const sectorInfo = sectorData.data[sector];
    assert.ok(sectorInfo[EXPECTED_RECENT_YEAR], `Sector ${sector} must have ${EXPECTED_RECENT_YEAR} data`);
    assert.ok(Array.isArray(sectorInfo[EXPECTED_RECENT_YEAR]), `Sector ${sector} ${EXPECTED_RECENT_YEAR} data must be array`);
    assert.ok(sectorInfo[EXPECTED_RECENT_YEAR].length > 0, `Sector ${sector} must have producers`);
  }
});

test("Sector definitions include required sectors", async () => {
  const { getSectorDefinitions } = await import("../scripts/lib/fetch-sector-exports.mjs");
  
  const definitions = getSectorDefinitions();
  const sectorIds = definitions.sectors.map(s => s.id);
  
  const requiredSectors = ['medicine', 'electronics', 'automotive', 'energy', 'agriculture', 'textiles', 'metals', 'chemicals'];
  
  for (const sector of requiredSectors) {
    assert.ok(sectorIds.includes(sector), `Required sector missing: ${sector}`);
  }
  
  // Check HS codes
  for (const sector of definitions.sectors) {
    assert.ok(sector.id, "Sector must have id");
    assert.ok(sector.name, "Sector must have name");
    assert.ok(Array.isArray(sector.hsCodes), "Sector must have hsCodes array");
    assert.ok(sector.hsCodes.length > 0, "Sector must have at least one HS code");
  }
});

test("Country code mappings are consistent", async () => {
  const { getISO3toISO2Map } = await import("../scripts/lib/fetch-worldbank-gdp.mjs");
  const { getCountryCodeMap } = await import("../scripts/lib/fetch-imf-dots-trade.mjs");
  
  const iso3to2 = getISO3toISO2Map();
  const iso2to3 = getCountryCodeMap();
  
  // Check that mappings are inverses
  for (const [iso2, iso3] of Object.entries(iso2to3)) {
    assert.ok(iso3to2[iso3] === iso2, `ISO mapping mismatch: ${iso2} <-> ${iso3}`);
  }
});
