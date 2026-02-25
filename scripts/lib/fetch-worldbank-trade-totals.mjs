/**
 * Fetch World Bank Trade Totals (current USD, annual)
 * Indicators:
 * - NE.EXP.GNFS.CD (Exports of goods and services)
 * - NE.IMP.GNFS.CD (Imports of goods and services)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(__dirname, "..", "..", "data", "raw");
const CACHE_FILE = path.join(RAW_DIR, "worldbank-trade-totals-snapshot.json");
const TARGET_YEAR = new Date().getUTCFullYear() - 2;

const INDICATORS = {
  exportsUsd: "NE.EXP.GNFS.CD",
  importsUsd: "NE.IMP.GNFS.CD",
};

function buildApiUrl(indicatorCode) {
  return `https://api.worldbank.org/v2/countries/all/indicators/${indicatorCode}?format=json&per_page=20000&date=${TARGET_YEAR}`;
}

export async function fetchWorldBankTradeTotals(options = {}) {
  const { refresh = false } = options;

  if (!refresh) {
    const cached = loadCachedData();
    if (cached) {
      return cached;
    }
  }

  try {
    console.log("Fetching trade totals from World Bank API...");

    const [exportsRows, importsRows] = await Promise.all([
      fetchIndicatorRows(INDICATORS.exportsUsd),
      fetchIndicatorRows(INDICATORS.importsUsd),
    ]);

    const totalsByIso3 = {};

    for (const row of exportsRows) {
      const iso3 = String(row?.countryiso3code || "").toUpperCase();
      const value = Number(row?.value || 0);
      if (iso3.length !== 3 || !(value > 0)) continue;

      totalsByIso3[iso3] = {
        ...(totalsByIso3[iso3] || {}),
        exportsUsd: value,
        year: Number(row?.date) || TARGET_YEAR,
      };
    }

    for (const row of importsRows) {
      const iso3 = String(row?.countryiso3code || "").toUpperCase();
      const value = Number(row?.value || 0);
      if (iso3.length !== 3 || !(value > 0)) continue;

      totalsByIso3[iso3] = {
        ...(totalsByIso3[iso3] || {}),
        importsUsd: value,
        year: Number(row?.date) || TARGET_YEAR,
      };
    }

    for (const entry of Object.values(totalsByIso3)) {
      entry.exportsUsd = Math.round(Number(entry.exportsUsd || 0));
      entry.importsUsd = Math.round(Number(entry.importsUsd || 0));
    }

    const result = {
      cachedAt: new Date().toISOString(),
      source: "World Bank API (NE.EXP.GNFS.CD, NE.IMP.GNFS.CD)",
      year: TARGET_YEAR,
      data: totalsByIso3,
    };

    cacheData(result);
    console.log(`Fetched trade totals for ${Object.keys(totalsByIso3).length} ISO3 codes`);
    return result;
  } catch (error) {
    console.warn(`World Bank trade totals fetch failed: ${error.message}`);

    const cached = loadCachedData();
    if (cached) {
      return cached;
    }

    throw new Error(`Unable to fetch real trade totals and no cache exists: ${error.message}`);
  }
}

async function fetchIndicatorRows(indicatorCode) {
  const response = await fetch(buildApiUrl(indicatorCode));
  if (!response.ok) {
    throw new Error(`World Bank indicator ${indicatorCode} returned ${response.status}`);
  }

  const payload = await response.json();
  const rows = payload?.[1];
  if (!Array.isArray(rows)) {
    throw new Error(`Unexpected World Bank payload for ${indicatorCode}`);
  }

  return rows;
}

function loadCachedData() {
  if (!fs.existsSync(CACHE_FILE)) {
    return null;
  }

  const cached = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  if (cached?.data && typeof cached.data === "object") {
    console.log(`Loaded cached World Bank trade totals for ${Object.keys(cached.data).length} codes`);
    return cached;
  }

  return null;
}

function cacheData(payload) {
  if (!fs.existsSync(RAW_DIR)) {
    fs.mkdirSync(RAW_DIR, { recursive: true });
  }

  fs.writeFileSync(CACHE_FILE, JSON.stringify(payload, null, 2), "utf8");
}

