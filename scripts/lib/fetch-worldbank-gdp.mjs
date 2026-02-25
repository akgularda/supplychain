/**
 * Fetch World Bank GDP Data (current USD, annual)
 * Source: World Bank Open Data API
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(__dirname, "..", "..", "data", "raw");
const CACHE_FILE = path.join(RAW_DIR, "worldbank-gdp-snapshot.json");
const TARGET_YEAR = new Date().getUTCFullYear() - 2;
const GDP_API_URL =
  `https://api.worldbank.org/v2/countries/all/indicators/NY.GDP.MKTP.CD?format=json&per_page=20000&date=${TARGET_YEAR}`;

export async function fetchGDPData(options = {}) {
  const { refresh = false } = options;

  if (!refresh && fs.existsSync(CACHE_FILE)) {
    return loadCachedData();
  }

  try {
    console.log("Fetching GDP data from World Bank API...");
    const response = await fetch(GDP_API_URL);
    if (!response.ok) {
      throw new Error(`World Bank API returned ${response.status}`);
    }

    const payload = await response.json();
    const rows = payload?.[1];
    if (!Array.isArray(rows)) {
      throw new Error("Unexpected World Bank API response format");
    }

    const result = {};
    for (const row of rows) {
      const iso3 = row?.countryiso3code;
      const value = row?.value;
      if (!iso3 || typeof value !== "number" || value <= 0) continue;

      result[iso3] = {
        gdpUsd: value,
        year: Number(row.date),
        country: row?.country?.value || iso3,
      };
    }

    cacheData(result);
    console.log(`Fetched GDP data for ${Object.keys(result).length} codes`);
    return result;
  } catch (error) {
    console.warn(`World Bank API fetch failed: ${error.message}`);
    const cached = loadCachedData();
    if (cached) {
      return cached;
    }
    throw new Error(`Unable to fetch real GDP data and no cache exists: ${error.message}`);
  }
}

function loadCachedData() {
  if (fs.existsSync(CACHE_FILE)) {
    const cached = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
    if (cached?.data && typeof cached.data === "object") {
      console.log(`Loaded cached GDP data for ${Object.keys(cached.data).length} codes`);
      return cached.data;
    }
  }

  return null;
}

function cacheData(data) {
  if (!fs.existsSync(RAW_DIR)) {
    fs.mkdirSync(RAW_DIR, { recursive: true });
  }

  fs.writeFileSync(
    CACHE_FILE,
    JSON.stringify(
      {
        cachedAt: new Date().toISOString(),
        source: "World Bank API (NY.GDP.MKTP.CD)",
        data,
      },
      null,
      2,
    ),
    "utf8",
  );
}

/**
 * ISO3 -> ISO2 mapping used by generator/tests.
 * Includes broad coverage for countries used by macro-site.
 */
export function getISO3toISO2Map() {
  return {
    USA: "US",
    CHN: "CN",
    JPN: "JP",
    DEU: "DE",
    IND: "IN",
    GBR: "GB",
    FRA: "FR",
    ITA: "IT",
    BRA: "BR",
    CAN: "CA",
    KOR: "KR",
    RUS: "RU",
    AUS: "AU",
    ESP: "ES",
    MEX: "MX",
    IDN: "ID",
    NLD: "NL",
    SAU: "SA",
    TUR: "TR",
    CHE: "CH",
    POL: "PL",
    SWE: "SE",
    BEL: "BE",
    THA: "TH",
    AUT: "AT",
    NOR: "NO",
    ARE: "AE",
    SGP: "SG",
    VNM: "VN",
    MYS: "MY",
    IRL: "IE",
    ISR: "IL",
    PHL: "PH",
    PAK: "PK",
    EGY: "EG",
    ZAF: "ZA",
    NZL: "NZ",
    FIN: "FI",
    DNK: "DK",
    CHL: "CL",
    ARG: "AR",
    COL: "CO",
    PER: "PE",
    NGA: "NG",
    KEN: "KE",
    MAR: "MA",
    BGD: "BD",
    LKA: "LK",
    CZE: "CZ",
    ROU: "RO",
    PRT: "PT",
    GRC: "GR",
    HUN: "HU",
    UKR: "UA",
    KAZ: "KZ",
    QAT: "QA",
    KWT: "KW",
    OMN: "OM",
    BHR: "BH",
    LUX: "LU",
    HRV: "HR",
    SVK: "SK",
    SVN: "SI",
    BGR: "BG",
    SRB: "RS",
    LTU: "LT",
    LVA: "LV",
    EST: "EE",
    CYP: "CY",
    MLT: "MT",
    ISL: "IS",
    TWN: "TW",
    HKG: "HK",
    UGA: "UG",
    TZA: "TZ",
    ETH: "ET",
    GHA: "GH",
    CIV: "CI",
    CMR: "CM",
    AGO: "AO",
    DZA: "DZ",
    TUN: "TN",
    LBY: "LY",
    IRQ: "IQ",
    IRN: "IR",
    JOR: "JO",
    LBN: "LB",
    URY: "UY",
    PRY: "PY",
    BOL: "BO",
    ECU: "EC",
    VEN: "VE",
    GTM: "GT",
    CRI: "CR",
    PAN: "PA",
    DOM: "DO",
    HND: "HN",
    SLV: "SV",
    NIC: "NI",
    MMR: "MM",
    KHM: "KH",
    LAO: "LA",
    NPL: "NP",
  };
}
