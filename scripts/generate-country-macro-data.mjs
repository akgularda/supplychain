#!/usr/bin/env node
/**
 * Generate Country Macro Dataset
 * Combines GDP, bilateral trade, and sector export data into a browser-ready dataset.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchGDPData, getISO3toISO2Map } from "./lib/fetch-worldbank-gdp.mjs";
import { fetchTradeData } from "./lib/fetch-imf-dots-trade.mjs";
import { fetchSectorExports, getSectorDefinitions } from "./lib/fetch-sector-exports.mjs";
import { fetchWorldBankTradeTotals } from "./lib/fetch-worldbank-trade-totals.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");

const COUNTRY_NAMES = {
  US: "United States", CN: "China", JP: "Japan", DE: "Germany",
  IN: "India", GB: "United Kingdom", FR: "France", IT: "Italy",
  BR: "Brazil", CA: "Canada", KR: "South Korea", RU: "Russia",
  AU: "Australia", ES: "Spain", MX: "Mexico", ID: "Indonesia",
  NL: "Netherlands", SA: "Saudi Arabia", TR: "Turkey", CH: "Switzerland",
  PL: "Poland", SE: "Sweden", BE: "Belgium", TH: "Thailand", AT: "Austria",
  NO: "Norway", AE: "United Arab Emirates", SG: "Singapore", VN: "Vietnam", MY: "Malaysia",
  IE: "Ireland", IL: "Israel", PH: "Philippines", PK: "Pakistan", EG: "Egypt",
  ZA: "South Africa", NZ: "New Zealand", FI: "Finland", DK: "Denmark", CL: "Chile",
  AR: "Argentina", CO: "Colombia", PE: "Peru", NG: "Nigeria", KE: "Kenya",
  MA: "Morocco", BD: "Bangladesh", LK: "Sri Lanka", CZ: "Czech Republic", RO: "Romania",
  PT: "Portugal", GR: "Greece", HU: "Hungary", UA: "Ukraine", KZ: "Kazakhstan",
  QA: "Qatar", KW: "Kuwait", OM: "Oman", BH: "Bahrain", LU: "Luxembourg",
  HR: "Croatia", SK: "Slovakia", SI: "Slovenia", BG: "Bulgaria", RS: "Serbia",
  LT: "Lithuania", LV: "Latvia", EE: "Estonia", CY: "Cyprus", MT: "Malta",
  IS: "Iceland", TW: "Taiwan", HK: "Hong Kong", UG: "Uganda", TZ: "Tanzania",
  ET: "Ethiopia", GH: "Ghana", CI: "Ivory Coast", CM: "Cameroon", AO: "Angola",
  DZ: "Algeria", TN: "Tunisia", LY: "Libya", IQ: "Iraq", IR: "Iran",
  JO: "Jordan", LB: "Lebanon", UY: "Uruguay", PY: "Paraguay", BO: "Bolivia",
  EC: "Ecuador", VE: "Venezuela", GT: "Guatemala", CR: "Costa Rica", PA: "Panama",
  DO: "Dominican Republic", HN: "Honduras", SV: "El Salvador", NI: "Nicaragua", MM: "Myanmar",
  KH: "Cambodia", LA: "Laos", NP: "Nepal",
};

const SPECIAL_COUNTRIES = {
  TW: { iso3: "TWN", gdpUsd: 790000000000, country: "Taiwan" },
  HK: { iso3: "HKG", gdpUsd: 360000000000, country: "Hong Kong" },
};

const VALID_DIRECTIONS = new Set(["both", "export", "import"]);

async function generateData() {
  console.log("Generating country macro dataset...\n");
  const refresh = process.argv.includes("--refresh");

  const gdpData = await fetchGDPData({ refresh });
  const tradeData = await fetchTradeData({ refresh });
  if (refresh) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
  const sectorData = await fetchSectorExports({ refresh });
  const tradeTotalsData = await fetchWorldBankTradeTotals({ refresh });

  console.log("Building nodes...");
  const nodes = buildNodes(gdpData);
  const nodeIso2Set = new Set(nodes.map((n) => n.iso2));

  console.log("Building links...");
  const links = buildLinks(tradeData.flows || [], nodeIso2Set);

  console.log("Applying trade totals...");
  applyTradeTotals(nodes, links, tradeTotalsData.data || {});

  console.log("Preparing sector outputs...");
  const sectors = getSectorDefinitions().sectors;
  const topProducersBySectorYear = buildTopProducersBySectorYear(sectorData.data || {}, sectors, nodes);
  const sectorValuesBySectorYear = buildSectorValuesBySectorYear(sectorData.data || {}, sectors);
  if (Object.keys(topProducersBySectorYear).length === 0) {
    throw new Error("No sector-year data available from source; refusing to generate synthetic years.");
  }

  const dataset = {
    meta: {
      generatedAt: new Date().toISOString(),
      sources: {
        gdp: "World Bank API (NY.GDP.MKTP.CD)",
        trade: `${String(tradeData?.source || "UN Comtrade Public Preview (HS TOTAL, exports)")}; totals: ${String(tradeTotalsData?.source || "World Bank API (NE.EXP.GNFS.CD, NE.IMP.GNFS.CD)")}`,
        sectors: String(sectorData?.source || "UN Comtrade Public Preview (HS chapters, exports)"),
      },
      snapshotDate: new Date().toISOString().split("T")[0],
      linkYears: [...new Set(links.map((l) => l.year))].sort((a, b) => b - a),
      sectorYears: Object.keys(topProducersBySectorYear).map(Number).sort((a, b) => b - a),
    },
    nodes,
    links,
    sectors,
    topProducersBySectorYear,
    sectorValuesBySectorYear,
  };

  const jsonPath = path.join(DATA_DIR, "country-macro-map.json");
  fs.writeFileSync(jsonPath, JSON.stringify(dataset, null, 2), "utf8");
  console.log(`Written: ${jsonPath}`);

  const jsPath = path.join(DATA_DIR, "country-macro-map.js");
  const jsContent = `/**\n * Country Macro Map Data\n * Generated: ${new Date().toISOString()}\n * Sources: World Bank + UN Comtrade\n */\n\nwindow.countryMacroData = ${JSON.stringify(dataset, null, 2)};\n`;
  fs.writeFileSync(jsPath, jsContent, "utf8");
  console.log(`Written: ${jsPath}`);

  console.log("\nDataset generation complete");
  console.log(`  Countries: ${nodes.length}`);
  console.log(`  Links: ${links.length}`);
  console.log(`  Sectors: ${sectors.length}`);
  console.log(`  Sector years: ${Object.keys(topProducersBySectorYear).join(", ")}`);
}

function buildNodes(gdpData) {
  const iso3to2 = getISO3toISO2Map();
  const nodes = [];

  for (const [iso3, entry] of Object.entries(gdpData)) {
    const iso2 = iso3to2[iso3];
    if (!iso2 || !COUNTRY_NAMES[iso2]) continue;

    const gdpUsd = Number(entry?.gdpUsd || 0);
    if (!(gdpUsd > 0)) continue;

    nodes.push({
      iso2,
      iso3,
      country: COUNTRY_NAMES[iso2],
      gdpUsd: Math.round(gdpUsd),
      exportsUsd: 0,
      importsUsd: 0,
      exportsEstimated: false,
      importsEstimated: false,
      bubbleRadius: 0,
    });
  }

  for (const [iso2, special] of Object.entries(SPECIAL_COUNTRIES)) {
    if (nodes.some((n) => n.iso2 === iso2)) continue;

    nodes.push({
      iso2,
      iso3: special.iso3,
      country: special.country,
      gdpUsd: Math.round(special.gdpUsd),
      exportsUsd: 0,
      importsUsd: 0,
      exportsEstimated: false,
      importsEstimated: false,
      bubbleRadius: 0,
    });
  }

  nodes.sort((a, b) => b.gdpUsd - a.gdpUsd);

  const maxGdp = Math.max(...nodes.map((n) => n.gdpUsd), 1);
  for (const node of nodes) {
    const radius = 8 + 52 * Math.sqrt(node.gdpUsd / maxGdp);
    node.bubbleRadius = clamp(Math.round(radius), 4, 60);
  }

  return nodes;
}

function buildLinks(rawFlows, validIso2Set) {
  const aggregated = new Map();

  for (const flow of rawFlows) {
    const s = String(flow?.reporter || "").toUpperCase();
    const t = String(flow?.partner || "").toUpperCase();
    const year = Number(flow?.year);
    const tradeUsd = Number(flow?.tradeUsd || 0);
    const directionRaw = String(flow?.direction || "export").toLowerCase();
    const direction = VALID_DIRECTIONS.has(directionRaw) ? directionRaw : "export";

    if (!validIso2Set.has(s) || !validIso2Set.has(t) || s === t) continue;
    if (!Number.isFinite(year) || year < 1990) continue;
    if (!(tradeUsd > 0)) continue;

    const key = `${year}|${direction}|${s}|${t}`;
    aggregated.set(key, (aggregated.get(key) || 0) + tradeUsd);
  }

  return [...aggregated.entries()]
    .map(([key, tradeUsd]) => {
      const [year, direction, s, t] = key.split("|");
      return {
        s,
        t,
        tradeUsd: Math.round(tradeUsd),
        year: Number(year),
        direction,
        weight: 1,
      };
    })
    .filter((link) => link.tradeUsd >= 150000000)
    .sort((a, b) => b.tradeUsd - a.tradeUsd);
}

function applyTradeTotals(nodes, links, worldBankTradeTotalsByIso3 = {}) {
  const nodeByIso2 = new Map(nodes.map((n) => [n.iso2, n]));
  const years = [...new Set(links.map((l) => l.year))].sort((a, b) => b - a);
  const latestYear = years[0];

  if (latestYear) {
    for (const link of links) {
      if (link.year !== latestYear) continue;

      const source = nodeByIso2.get(link.s);
      const target = nodeByIso2.get(link.t);
      if (!source || !target) continue;

      const value = Number(link.tradeUsd || 0);
      if (!(value > 0)) continue;

      if (link.direction === "import") {
        source.importsUsd += value;
        target.exportsUsd += value;
      } else {
        source.exportsUsd += value;
        target.importsUsd += value;
      }
    }
  }

  nodes.sort((a, b) => b.gdpUsd - a.gdpUsd);

  for (const node of nodes) {
    const wb = worldBankTradeTotalsByIso3?.[node.iso3];
    const wbExports = Number(wb?.exportsUsd || 0);
    const wbImports = Number(wb?.importsUsd || 0);

    if (wbExports > 0) {
      node.exportsUsd = Math.round(wbExports);
    } else {
      node.exportsUsd = Math.round(Math.max(0, Number(node.exportsUsd || 0)));
    }

    if (wbImports > 0) {
      node.importsUsd = Math.round(wbImports);
    } else {
      node.importsUsd = Math.round(Math.max(0, Number(node.importsUsd || 0)));
    }

    // Real-data mode: no synthetic trade-value modeling.
    node.exportsEstimated = false;
    node.importsEstimated = false;
  }
}

function buildTopProducersBySectorYear(sectorData, sectors, nodes) {
  const nodeIso2Set = new Set(nodes.map((n) => n.iso2));

  const years = extractAllYears(sectorData);
  const result = {};

  for (const year of years) {
    const yearKey = String(year);
    result[yearKey] = {};

    for (const sector of sectors) {
      const raw = sectorData?.[sector.id]?.[yearKey] || [];
      const normalized = dedupeProducerList(raw, nodeIso2Set)
        .sort((a, b) => b.value - a.value);

      result[yearKey][sector.id] = normalized.slice(0, 10);
    }
  }

  return result;
}

function buildSectorValuesBySectorYear(sectorData, sectors) {
  const years = extractAllYears(sectorData);
  const result = {};

  for (const year of years) {
    const yearKey = String(year);
    result[yearKey] = {};

    for (const sector of sectors) {
      const raw = sectorData?.[sector.id]?.[yearKey] || [];
      result[yearKey][sector.id] = raw
        .map((row) => ({
          iso2: String(row?.iso2 || "").toUpperCase(),
          value: Math.round(Number(row?.value || 0)),
        }))
        .filter((row) => row.iso2.length === 2 && row.value > 0)
        .sort((a, b) => b.value - a.value);
    }
  }

  return result;
}

function dedupeProducerList(rows, validIso2Set) {
  const byIso2 = new Map();

  for (const row of rows) {
    const iso2 = String(row?.iso2 || "").toUpperCase();
    const value = Number(row?.value || 0);
    if (!validIso2Set.has(iso2) || !(value > 0)) continue;

    if (!byIso2.has(iso2) || byIso2.get(iso2) < value) {
      byIso2.set(iso2, value);
    }
  }

  return [...byIso2.entries()].map(([iso2, value]) => ({
    iso2,
    value: Math.round(value),
    provenance: "observed",
  }));
}

function extractAllYears(sectorData) {
  const yearSet = new Set();

  for (const sectorValues of Object.values(sectorData || {})) {
    for (const year of Object.keys(sectorValues || {})) {
      if (/^\d{4}$/.test(year)) {
        yearSet.add(Number(year));
      }
    }
  }

  return [...yearSet].sort((a, b) => b - a);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

generateData().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
