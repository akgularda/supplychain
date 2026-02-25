/**
 * Fetch Sector Export Data
 * Source: UN Comtrade Public Preview API (HS chapters)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchGDPData, getISO3toISO2Map } from "./fetch-worldbank-gdp.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(__dirname, "..", "..", "data", "raw");
const CACHE_FILE = path.join(RAW_DIR, "sector-exports-snapshot.json");
const PARTNER_CACHE_FILE = path.join(RAW_DIR, "comtrade-partner-areas.json");

const COMTRADE_PREVIEW_URL = "https://comtradeapi.un.org/public/v1/preview/C/A/HS";
const PARTNER_AREAS_URL = "https://comtradeapi.un.org/files/v1/app/reference/partnerAreas.json";

const DEFAULT_YEARS = [new Date().getUTCFullYear() - 2, new Date().getUTCFullYear() - 3];
const REPORTER_POOL_SIZE = 90;
const REPORTER_CHUNK_SIZE = 45;
const REQUEST_DELAY_MS = 650;

const SECTOR_DEFINITIONS = [
  { id: "medicine", name: "Medicine", hsCodes: ["30"] },
  { id: "electronics", name: "Electronics", hsCodes: ["85"] },
  { id: "automotive", name: "Automotive", hsCodes: ["87"] },
  { id: "energy", name: "Energy", hsCodes: ["27"] },
  { id: "agriculture", name: "Agriculture", hsCodes: ["10"] },
  { id: "textiles", name: "Textiles", hsCodes: ["61"] },
  { id: "metals", name: "Metals", hsCodes: ["72"] },
  { id: "chemicals", name: "Chemicals", hsCodes: ["29"] },
];

export async function fetchSectorExports(options = {}) {
  const { refresh = false } = options;

  if (!refresh) {
    const cached = loadCachedSectorData();
    if (cached) {
      return cached;
    }
  }

  try {
    console.log("Fetching sector export data from UN Comtrade...");

    const partnerAreas = await loadPartnerAreas({ refresh });
    const partnerIndex = buildPartnerIndex(partnerAreas);
    const gdpData = await fetchGDPData();

    const universe = buildCountryUniverse(partnerIndex.byIso2, gdpData)
      .slice(0, REPORTER_POOL_SIZE);

    if (universe.length < 20) {
      throw new Error("Insufficient country coverage from partner reference");
    }

    const reporterCodeChunks = chunkArray(
      universe.map((c) => c.code),
      REPORTER_CHUNK_SIZE,
    );

    const data = {};

    for (const sector of SECTOR_DEFINITIONS) {
      data[sector.id] = {};

      for (const year of DEFAULT_YEARS) {
        const yearValues = new Map();

        for (const hsCode of sector.hsCodes) {
          for (const reporterChunk of reporterCodeChunks) {
            const rows = await fetchComtradeRows(
              {
                period: String(year),
                reporterCode: reporterChunk.join(","),
                partnerCode: "0",
                flowCode: "X",
                cmdCode: hsCode,
                partner2Code: "0",
                customsCode: "C00",
                motCode: "0",
                maxRecords: "500",
                includeDesc: "false",
              },
              { retries: 5 },
            );

            for (const row of rows) {
              const iso2 = partnerIndex.byCode.get(Number(row.reporterCode))?.iso2;
              const value = toPositiveNumber(row.primaryValue);
              if (!iso2 || !value) continue;
              yearValues.set(iso2, (yearValues.get(iso2) || 0) + value);
            }

            await sleep(REQUEST_DELAY_MS);
          }
        }

        let producers = [...yearValues.entries()]
          .map(([iso2, value]) => ({ iso2, value: Math.round(value) }))
          .sort((a, b) => b.value - a.value);

        data[sector.id][String(year)] = producers;
      }
    }

    const result = {
      cachedAt: new Date().toISOString(),
      source: "UN Comtrade Public Preview (HS chapters, exports)",
      sectors: SECTOR_DEFINITIONS.map((s) => s.id),
      years: [...DEFAULT_YEARS],
      data: normalizeSectorData(data),
    };

    cacheData(result);
    console.log(`Fetched sector exports for ${SECTOR_DEFINITIONS.length} sectors`);
    return result;
  } catch (error) {
    console.warn(`Sector export fetch failed: ${error.message}`);

    const cached = loadCachedSectorData();
    if (cached) {
      return cached;
    }

    throw new Error(`Unable to fetch real sector export data and no cache exists: ${error.message}`);
  }
}

export function getSectorDefinitions() {
  return {
    sectors: SECTOR_DEFINITIONS.map((sector) => ({
      id: sector.id,
      name: sector.name,
      hsCodes: [...sector.hsCodes],
    })),
    metadata: {
      version: "2.0",
      source: "UN Comtrade Public Preview (HS chapter mapping)",
      lastUpdated: new Date().toISOString().split("T")[0],
    },
  };
}

async function loadPartnerAreas({ refresh = false } = {}) {
  if (!refresh && fs.existsSync(PARTNER_CACHE_FILE)) {
    const cached = JSON.parse(fs.readFileSync(PARTNER_CACHE_FILE, "utf8"));
    if (Array.isArray(cached?.results) && cached.results.length > 0) {
      return cached.results;
    }
  }

  const response = await fetch(PARTNER_AREAS_URL);
  if (!response.ok) {
    throw new Error(`Partner reference endpoint returned ${response.status}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload?.results)) {
    throw new Error("Unexpected partner reference payload");
  }

  ensureRawDir();
  fs.writeFileSync(
    PARTNER_CACHE_FILE,
    JSON.stringify(
      {
        cachedAt: new Date().toISOString(),
        source: PARTNER_AREAS_URL,
        results: payload.results,
      },
      null,
      2,
    ),
    "utf8",
  );

  return payload.results;
}

function buildPartnerIndex(partnerAreas) {
  const byIso2 = new Map();
  const byCode = new Map();

  for (const area of partnerAreas) {
    if (area?.isGroup) continue;

    const iso2 = String(area?.PartnerCodeIsoAlpha2 || "").toUpperCase();
    const iso3 = String(area?.PartnerCodeIsoAlpha3 || "").toUpperCase();
    const code = Number(area?.PartnerCode);

    if (iso2.length !== 2 || iso3.length !== 3 || !Number.isFinite(code) || code <= 0) {
      continue;
    }

    const entry = { iso2, iso3, code };
    byIso2.set(iso2, entry);
    byCode.set(code, entry);
  }

  return { byIso2, byCode };
}

function buildCountryUniverse(partnerByIso2, gdpData) {
  const iso2to3 = invertIsoMap(getISO3toISO2Map());

  return Object.entries(iso2to3)
    .map(([iso2, iso3]) => {
      const partnerEntry = partnerByIso2.get(iso2);
      if (!partnerEntry) return null;

      return {
        iso2,
        iso3,
        code: partnerEntry.code,
        gdpUsd: Number(gdpData?.[iso3]?.gdpUsd || 0),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.gdpUsd - a.gdpUsd || a.iso2.localeCompare(b.iso2));
}

async function fetchComtradeRows(params, { retries = 4 } = {}) {
  const qs = new URLSearchParams(params);

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await fetch(`${COMTRADE_PREVIEW_URL}?${qs.toString()}`);

    if (response.status === 429 || response.status >= 500) {
      lastError = new Error(`Comtrade returned ${response.status}`);
      await sleep(backoffMs(attempt));
      continue;
    }

    if (!response.ok) {
      throw new Error(`Comtrade returned ${response.status}`);
    }

    const payload = await response.json();

    if (payload?.error) {
      const message = String(payload.error);
      if (message.toLowerCase().includes("too many")) {
        lastError = new Error(message);
        await sleep(backoffMs(attempt));
        continue;
      }
      throw new Error(message);
    }

    if (!Array.isArray(payload?.data)) {
      return [];
    }

    return payload.data;
  }

  throw lastError || new Error("Comtrade request failed after retries");
}

function loadCachedSectorData() {
  if (!fs.existsSync(CACHE_FILE)) {
    return null;
  }

  const snapshot = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  const source = String(snapshot?.source || "").toLowerCase();
  if (source.includes("fallback")) {
    return null;
  }

  if (snapshot?.data && typeof snapshot.data === "object") {
    console.log("Loaded cached sector export data");
    return {
      ...snapshot,
      years: Array.isArray(snapshot.years) ? snapshot.years : [...DEFAULT_YEARS],
      data: normalizeSectorData(snapshot.data),
    };
  }

  return null;
}

function cacheData(data) {
  ensureRawDir();
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), "utf8");
}

function ensureRawDir() {
  if (!fs.existsSync(RAW_DIR)) {
    fs.mkdirSync(RAW_DIR, { recursive: true });
  }
}

function normalizeSectorData(data) {
  const normalized = {};

  for (const sector of SECTOR_DEFINITIONS) {
    const sectorId = sector.id;
    const sourceYears = data?.[sectorId] && typeof data[sectorId] === "object"
      ? data[sectorId]
      : {};
    normalized[sectorId] = {};

    for (const yearKey of Object.keys(sourceYears)) {
      normalized[sectorId][yearKey] = (sourceYears[yearKey] || [])
        .map((row) => ({
          iso2: String(row?.iso2 || "").toUpperCase(),
          value: Math.round(Number(row?.value || 0)),
        }))
        .filter((row) => row.iso2.length === 2 && row.value > 0)
        .sort((a, b) => b.value - a.value);
    }
  }

  return normalized;
}

function chunkArray(list, size) {
  const chunks = [];
  for (let i = 0; i < list.length; i += size) {
    chunks.push(list.slice(i, i + size));
  }
  return chunks;
}

function toPositiveNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function invertIsoMap(iso3to2) {
  const result = {};
  for (const [iso3, iso2] of Object.entries(iso3to2)) {
    result[iso2] = iso3;
  }
  return result;
}

function backoffMs(attempt) {
  return Math.min(6000, 1000 * 2 ** attempt) + Math.floor(Math.random() * 180);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
