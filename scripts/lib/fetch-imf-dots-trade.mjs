/**
 * Fetch Trade Data
 * Source: UN Comtrade Public Preview API (fallback: deterministic baseline)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchGDPData, getISO3toISO2Map } from "./fetch-worldbank-gdp.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(__dirname, "..", "..", "data", "raw");
const CACHE_FILE = path.join(RAW_DIR, "imf-dots-snapshot.json");
const PARTNER_CACHE_FILE = path.join(RAW_DIR, "comtrade-partner-areas.json");

const COMTRADE_PREVIEW_URL = "https://comtradeapi.un.org/public/v1/preview/C/A/HS";
const PARTNER_AREAS_URL = "https://comtradeapi.un.org/files/v1/app/reference/partnerAreas.json";

const DEFAULT_YEARS = [new Date().getUTCFullYear() - 2, new Date().getUTCFullYear() - 3];
const REPORTER_POOL_SIZE = 60;
const REPORTER_CHUNK_SIZE = 8; // 8 reporters x 60 partners ~= 480 rows max/request
const REQUEST_DELAY_MS = 650;

export async function fetchTradeData(options = {}) {
  const { refresh = false } = options;

  if (!refresh) {
    const cached = loadCachedTradeData();
    if (cached) {
      return cached;
    }
  }

  try {
    console.log("Fetching trade data from UN Comtrade Public Preview...");

    const partnerAreas = await loadPartnerAreas({ refresh });
    const partnerIndex = buildPartnerIndex(partnerAreas);
    const gdpData = await fetchGDPData();

    const universe = buildCountryUniverse(partnerIndex.byIso2, gdpData)
      .slice(0, REPORTER_POOL_SIZE);

    if (universe.length < 20) {
      throw new Error("Insufficient country coverage from partner reference");
    }

    const partnerCodesCsv = universe.map((c) => c.code).join(",");
    const reporterCodeChunks = chunkArray(
      universe.map((c) => c.code),
      REPORTER_CHUNK_SIZE,
    );

    const aggregated = new Map();

    for (const year of DEFAULT_YEARS) {
      for (let i = 0; i < reporterCodeChunks.length; i += 1) {
        const reporterCodesCsv = reporterCodeChunks[i].join(",");

        const rows = await fetchComtradeRows(
          {
            period: String(year),
            reporterCode: reporterCodesCsv,
            partnerCode: partnerCodesCsv,
            flowCode: "X",
            cmdCode: "TOTAL",
            partner2Code: "0",
            customsCode: "C00",
            motCode: "0",
            maxRecords: "500",
            includeDesc: "false",
          },
          { retries: 5 },
        );

        for (const row of rows) {
          const reporter = partnerIndex.byCode.get(Number(row.reporterCode))?.iso2;
          const partner = partnerIndex.byCode.get(Number(row.partnerCode))?.iso2;
          const tradeUsd = toPositiveNumber(row.primaryValue);

          if (!reporter || !partner || reporter === partner || !tradeUsd) {
            continue;
          }

          const key = `${year}|${reporter}|${partner}|export`;
          aggregated.set(key, (aggregated.get(key) || 0) + tradeUsd);
        }

        await sleep(REQUEST_DELAY_MS);
      }
    }

    const flows = [...aggregated.entries()].map(([key, tradeUsd]) => {
      const [year, reporter, partner, direction] = key.split("|");
      return {
        reporter,
        partner,
        tradeUsd: Math.round(tradeUsd),
        year: Number(year),
        direction,
      };
    });

    if (flows.length < 120) {
      throw new Error(`Low trade coverage from Comtrade (${flows.length} flows)`);
    }

    const result = {
      cachedAt: new Date().toISOString(),
      source: "UN Comtrade Public Preview (HS TOTAL, exports)",
      years: DEFAULT_YEARS,
      reporterPoolSize: universe.length,
      flows,
    };

    cacheData(result);
    console.log(`Fetched ${flows.length} bilateral trade flows from Comtrade`);
    return result;
  } catch (error) {
    console.warn(`Trade fetch failed: ${error.message}`);

    const cached = loadCachedTradeData();
    if (cached) {
      return cached;
    }

    throw new Error(`Unable to fetch real bilateral trade data and no cache exists: ${error.message}`);
  }
}

export function getCountryCodeMap() {
  const iso3to2 = getISO3toISO2Map();
  const iso2to3 = {};

  for (const [iso3, iso2] of Object.entries(iso3to2)) {
    iso2to3[iso2] = iso3;
  }

  return iso2to3;
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
  const iso2to3 = getCountryCodeMap();

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

function loadCachedTradeData() {
  if (!fs.existsSync(CACHE_FILE)) {
    return null;
  }

  const snapshot = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  const source = String(snapshot?.source || "").toLowerCase();
  if (source.includes("fallback")) {
    return null;
  }

  if (Array.isArray(snapshot?.flows) && snapshot.flows.length > 0) {
    console.log(`Loaded cached trade data with ${snapshot.flows.length} flows`);
    return snapshot;
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

function backoffMs(attempt) {
  return Math.min(6000, 1000 * 2 ** attempt) + Math.floor(Math.random() * 180);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
