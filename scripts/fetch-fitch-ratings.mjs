import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MAP_PATH = path.join(ROOT, "data", "top100-map.json");
const OUT_JSON = path.join(ROOT, "data", "credit-ratings.json");
const OUT_JS = path.join(ROOT, "data", "credit-ratings.js");

const SEARCH_QUERY = `
query Search($archive: Boolean, $item: SearchItem, $searchMode: String, $term: String!, $filter: SearchFilterInput, $sort: String, $dateRange: String, $offset: Int, $limit: Int) {
  search(
    archive: $archive
    item: $item
    searchMode: $searchMode
    term: $term
    filter: $filter
    sort: $sort
    dateRange: $dateRange
    offset: $offset
    limit: $limit
  ) {
    totalEntityHits
    entity {
      name
      ultimateParent
      permalink
      ratings {
        orangeDisplay
        ratingCode
        ratingAlertDescription
        ratingTypeDescription
        ratingEffectiveDate
      }
    }
  }
}
`;

const API_URL = "https://api.fitchratings.com/";
const COMMON_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Content-Type": "application/json",
  Referer: "https://www.fitchratings.com/search/",
  Origin: "https://www.fitchratings.com",
};

const STRUCTURED_TERMS = [
  "trust",
  "issuer",
  "series",
  "dac",
  "b.v",
  "b.v.",
  "llc",
  "bonds",
  "notes",
  "lease",
  "fund",
  "securit",
];

const NOISE_TOKENS = new Set([
  "the",
  "and",
  "of",
  "for",
  "inc",
  "corp",
  "corporation",
  "co",
  "company",
  "group",
  "holding",
  "holdings",
  "plc",
  "ltd",
  "limited",
  "sa",
  "nv",
  "ag",
  "as",
  "spa",
  "n",
  "v",
  "s",
  "a",
]);

const GENERIC_MATCH_TOKENS = new Set([
  "bank",
  "financial",
  "international",
  "global",
  "energy",
  "technology",
  "technologies",
  "research",
  "materials",
  "sciences",
  "laboratories",
  "health",
  "service",
  "services",
]);

const QUERY_ALIASES_BY_SYMBOL = {
  "2222.SR": ["Saudi Arabian Oil Company", "Saudi Aramco"],
  MA: ["Mastercard Incorporated", "Mastercard Inc"],
  PG: ["Procter and Gamble Company", "The Procter and Gamble Company"],
  "0941.HK": ["China Mobile Limited"],
  AMAT: ["Applied Materials Inc"],
  LRCX: ["Lam Research Corporation"],
  TXN: ["Texas Instruments Incorporated"],
  ABT: ["Abbott Laboratories"],
  GILD: ["Gilead Sciences Inc"],
  NVO: ["Novo Nordisk A/S", "Novo Nordisk"],
  "NESN.SW": ["Nestle SA", "Nestle S.A."],
  KO: ["The Coca-Cola Company"],
  JNJ: ["Johnson & Johnson"],
};

function normalizeName(input) {
  return (input || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(inc|corp|corporation|co|company|group|holdings|plc|ltd|limited|sa|nv|ag|as|spa)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeCoreSequence(input) {
  const norm = normalizeName(input);
  if (!norm) return [];
  return norm
    .split(" ")
    .filter((token) => token && token.length > 1 && !NOISE_TOKENS.has(token));
}

function tokenizeCore(input) {
  const unique = new Set(tokenizeCoreSequence(input));
  return [...unique];
}

function overlapInfo(companyName, entityName) {
  const companySequence = tokenizeCoreSequence(companyName);
  const entitySequence = tokenizeCoreSequence(entityName);
  const companyTokens = [...new Set(companySequence)];
  const entityTokens = [...new Set(entitySequence)];
  const entitySet = new Set(entityTokens);
  const overlapTokens = companyTokens.filter((token) => entitySet.has(token));
  const companyCounts = Object.create(null);
  const entityCounts = Object.create(null);
  for (const token of companySequence) companyCounts[token] = (companyCounts[token] || 0) + 1;
  for (const token of entitySequence) entityCounts[token] = (entityCounts[token] || 0) + 1;
  let overlapWeighted = 0;
  for (const token of Object.keys(companyCounts)) {
    overlapWeighted += Math.min(companyCounts[token], entityCounts[token] || 0);
  }
  return {
    companySequence,
    entitySequence,
    companyTokens,
    entityTokens,
    overlapTokens,
    overlapCount: overlapTokens.length,
    overlapWeighted,
  };
}

function looksStructuredFinance(name) {
  const n = (name || "").toLowerCase();
  return STRUCTURED_TERMS.some((term) => n.includes(term));
}

function computeEntityScore(companyName, entityName, hasRatings) {
  const cNorm = normalizeName(companyName);
  const eNorm = normalizeName(entityName);
  const overlap = overlapInfo(companyName, entityName);
  const recall = overlap.companyTokens.length
    ? overlap.overlapCount / overlap.companyTokens.length
    : 0;
  const precision = overlap.entityTokens.length
    ? overlap.overlapCount / overlap.entityTokens.length
    : 0;
  const f1 = recall + precision ? (2 * recall * precision) / (recall + precision) : 0;
  let score = f1 * 100;

  if (eNorm === cNorm) score += 60;
  else if (cNorm && eNorm && (eNorm.includes(cNorm) || cNorm.includes(eNorm))) score += 20;
  if (hasRatings) score += 8;
  if (looksStructuredFinance(entityName) && !looksStructuredFinance(companyName)) score -= 30;
  if (
    overlap.overlapCount === 1 &&
    GENERIC_MATCH_TOKENS.has(overlap.overlapTokens[0] || "")
  ) {
    score -= 25;
  }
  if (overlap.entityTokens.length === 1 && overlap.companyTokens.length >= 2) score -= 18;
  const companySet = new Set(overlap.companyTokens);
  const extraSpecificTokens = overlap.entityTokens.filter(
    (token) => !companySet.has(token) && !GENERIC_MATCH_TOKENS.has(token),
  );
  score -= extraSpecificTokens.length * 5;

  return { score, overlap };
}

function isPlausibleMatch(companyName, entityName, scoreResult) {
  const overlap = scoreResult.overlap;
  if (!overlap.companyTokens.length || !overlap.entityTokens.length) return false;
  if (overlap.overlapCount === 0) return false;
  const requiredWeightedMatches =
    overlap.companySequence.length >= 2 ? Math.min(2, overlap.companySequence.length) : 1;
  if (overlap.overlapWeighted < requiredWeightedMatches) {
    const onlyToken = overlap.overlapTokens[0] || "";
    if (GENERIC_MATCH_TOKENS.has(onlyToken)) return false;
    return false;
  }
  if (
    overlap.overlapCount === 1 &&
    GENERIC_MATCH_TOKENS.has(overlap.overlapTokens[0] || "")
  ) {
    return false;
  }
  if (looksStructuredFinance(entityName) && !looksStructuredFinance(companyName)) return false;
  return true;
}

function extractIssuerRatings(ratings) {
  const arr = Array.isArray(ratings) ? ratings : [];
  const long = arr.find((r) =>
    (r.ratingTypeDescription || "").toLowerCase().includes("long term issuer default"),
  );
  const short = arr.find((r) =>
    (r.ratingTypeDescription || "").toLowerCase().includes("short term issuer default"),
  );
  const fallback = arr.find((r) =>
    (r.ratingTypeDescription || "").toLowerCase().includes("issuer default"),
  );

  const longOrFallback = long || fallback || null;
  return {
    longTerm: longOrFallback
      ? {
          code: longOrFallback.ratingCode || null,
          outlook: longOrFallback.ratingAlertDescription || null,
          effectiveDate: longOrFallback.ratingEffectiveDate || null,
          type: longOrFallback.ratingTypeDescription || null,
          display: longOrFallback.orangeDisplay || null,
        }
      : null,
    shortTerm: short
      ? {
          code: short.ratingCode || null,
          outlook: short.ratingAlertDescription || null,
          effectiveDate: short.ratingEffectiveDate || null,
          type: short.ratingTypeDescription || null,
          display: short.orangeDisplay || null,
        }
      : null,
  };
}

function buildSearchTerms(company, symbol) {
  const terms = new Set();
  const trimmed = (company || "").trim();
  if (trimmed) terms.add(trimmed);
  const noParen = trimmed.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  if (noParen) terms.add(noParen);
  const noAnd = noParen.replace(/\band\b/gi, " ").replace(/\s+/g, " ").trim();
  if (noAnd && noAnd.length > 3) terms.add(noAnd);

  const aliases = QUERY_ALIASES_BY_SYMBOL[symbol] || [];
  for (const alias of aliases) terms.add(alias);

  // Only query by ticker when the company name is itself an acronym.
  const companyTokens = tokenizeCore(company);
  if (
    symbol &&
    /^[A-Z]{2,5}$/.test(symbol) &&
    companyTokens.length === 1 &&
    companyTokens[0] === symbol.toLowerCase()
  ) {
    terms.add(symbol);
  }
  return [...terms];
}

async function searchEntities(term) {
  const payload = {
    operationName: "Search",
    variables: {
      archive: false,
      item: "ENTITY",
      searchMode: "keyword",
      term,
      filter: {},
      sort: "",
      dateRange: "",
      offset: 0,
      limit: 40,
    },
    query: SEARCH_QUERY,
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: COMMON_HEADERS,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Fitch API ${res.status} for term "${term}"`);
  }
  const json = await res.json();
  const entities = json?.data?.search?.entity || [];
  return entities;
}

function pickBestEntity(companyName, symbol, entities) {
  const targetNames = [companyName, ...(QUERY_ALIASES_BY_SYMBOL[symbol] || [])];
  let best = null;
  let bestScore = -Infinity;
  let bestOverlap = null;
  let bestTarget = companyName;
  for (const entity of entities) {
    const ratings = entity?.ratings || [];
    let bestForEntity = null;
    for (const targetName of targetNames) {
      const scoreResult = computeEntityScore(targetName, entity?.name || "", ratings.length > 0);
      if (!isPlausibleMatch(targetName, entity?.name || "", scoreResult)) continue;
      if (!bestForEntity || scoreResult.score > bestForEntity.score) {
        bestForEntity = { targetName, scoreResult };
      }
    }
    if (!bestForEntity) continue;
    if (bestForEntity.scoreResult.score > bestScore) {
      best = entity;
      bestScore = bestForEntity.scoreResult.score;
      bestOverlap = bestForEntity.scoreResult.overlap.overlapTokens;
      bestTarget = bestForEntity.targetName;
    }
  }

  if (!best) return null;
  const companyTokenCount = tokenizeCore(bestTarget).length;
  const minScore = companyTokenCount >= 2 ? 55 : 42;
  if (bestScore < minScore) return null;
  return { ...best, _score: bestScore, _overlap: bestOverlap || [], _target: bestTarget };
}

async function main() {
  const map = JSON.parse(fs.readFileSync(MAP_PATH, "utf8"));
  const nodes = map.nodes || [];
  const ratingsBySymbol = {};
  let withFitch = 0;

  for (const node of nodes) {
    const symbol = node.symbol;
    const company = node.company;
    const terms = buildSearchTerms(company, symbol);
    let allEntities = [];

    for (const term of terms) {
      try {
        const entities = await searchEntities(term);
        allEntities = allEntities.concat(entities);
      } catch (err) {
        // Continue with other terms if one query fails.
      }
      await new Promise((r) => setTimeout(r, 120));
    }

    const dedup = [];
    const seen = new Set();
    for (const ent of allEntities) {
      const key = `${ent?.name || ""}::${ent?.permalink || ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      dedup.push(ent);
    }

    const picked = pickBestEntity(company, symbol, dedup);
    const issuer = extractIssuerRatings(picked?.ratings || []);
    const hasFitch = Boolean(issuer.longTerm?.code || issuer.shortTerm?.code);
    if (hasFitch) withFitch += 1;

    ratingsBySymbol[symbol] = {
      symbol,
      company,
      fitch: hasFitch
        ? {
            entityName: picked?.name || null,
            permalink: picked?.permalink || null,
            longTerm: issuer.longTerm,
            shortTerm: issuer.shortTerm,
            matchScore: Number((picked?._score || 0).toFixed(2)),
            matchTokens: picked?._overlap || [],
            matchTarget: picked?._target || company,
          }
        : null,
      // Placeholder keys so the website can support "Fitch etc." agencies later.
      spGlobal: null,
      moodys: null,
      coverage: hasFitch ? "fitch_found" : "not_found",
    };
  }

  const output = {
    meta: {
      generatedAt: new Date().toISOString(),
      source: "https://api.fitchratings.com/ (public GraphQL search endpoint)",
      universeCount: nodes.length,
      fitchCoverageCount: withFitch,
      notes: [
        "Fitch ratings are best-effort matches based on entity search.",
        "S&P and Moody's are placeholders; public bulk endpoints are not available in this workspace.",
      ],
    },
    ratingsBySymbol,
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(output, null, 2));
  fs.writeFileSync(OUT_JS, `window.CREDIT_RATINGS = ${JSON.stringify(output, null, 2)};\n`);

  console.log(
    `Wrote ${path.relative(ROOT, OUT_JSON)} and ${path.relative(
      ROOT,
      OUT_JS,
    )}. Fitch coverage: ${withFitch}/${nodes.length}.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
