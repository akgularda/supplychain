# Country Macro Data Contract

**Version:** 1.0  
**Last Updated:** 2026-02-24

## Overview

This document defines the schema for the country macro dataset used by the standalone Country Macro Viewer website (`macro-site/`).

## File Locations

- JSON: `data/country-macro-map.json`
- JS (for browser): `data/country-macro-map.js`
- Sector definitions: `data/sector-definitions.json`

## Root Schema

```typescript
interface CountryMacroData {
  meta: Meta;
  nodes: CountryNode[];
  links: TradeLink[];
  sectors: Sector[];
  topProducersBySectorYear: Record<number, Record<string, TopProducer[]>>;
}
```

## Meta

```typescript
interface Meta {
  generatedAt: string;        // ISO 8601 timestamp
  sources: {
    gdp: string;              // Source description for GDP data
    trade: string;            // Source description for trade data
    sectors: string;          // Source description for sector data
  };
  snapshotDate: string;       // YYYY-MM-DD format
}
```

## Country Node

```typescript
interface CountryNode {
  iso2: string;               // 2-letter ISO country code (e.g., "US")
  iso3: string;               // 3-letter ISO country code (e.g., "USA")
  country: string;            // Full country name
  gdpUsd: number;             // GDP in current USD
  exportsUsd: number;         // Total exports in USD
  importsUsd: number;         // Total imports in USD
  bubbleRadius: number;       // Pre-computed radius for visualization
}
```

### Node Requirements

- `gdpUsd` must be > 0
- `exportsUsd` and `importsUsd` must be >= 0
- `bubbleRadius` is computed from GDP using sqrt scale
- ISO codes must be valid (no "XX" placeholder codes)

## Trade Link

```typescript
interface TradeLink {
  s: string;                  // Source country ISO2 code
  t: string;                  // Target country ISO2 code
  tradeUsd: number;           // Bilateral trade value in USD
  year: number;               // Year of data (e.g., 2024)
  direction: 'both' | 'export' | 'import';  // Trade direction
  weight: number;             // Edge weight (typically 1)
}
```

### Link Requirements

- `s` and `t` must reference valid country ISO2 codes
- `tradeUsd` must be > 0
- `year` must be a valid year (e.g., 2020-2026)
- Links are undirected for visualization (s-t same as t-s)

## Sector

```typescript
interface Sector {
  id: string;                 // Unique sector identifier
  name: string;               // Display name
}
```

### Required Sectors (minimum 8)

1. `medicine` - Pharmaceuticals and medical products
2. `electronics` - Consumer and industrial electronics
3. `automotive` - Vehicles and auto parts
4. `energy` - Oil, gas, renewables
5. `agriculture` - Agricultural products
6. `textiles` - Textiles and apparel
7. `metals` - Metal products and mining
8. `chemicals` - Chemical products

## Top Producers

```typescript
type TopProducer = {
  iso2: string;               // Country ISO2 code
  value: number;              // Export value in USD
};

// Structure: topProducersBySectorYear[year][sectorId] = TopProducer[]
```

### Requirements

- Each sector must have exactly 10 producers for latest year
- Producers ranked by `value` descending
- Must include medicine sector with 10 countries

## Data Quality Rules

1. **Country Count**: >= 100 countries
2. **Trade Links**: Non-empty, with at least 50 links per year
3. **Medicine Top 10**: Exactly 10 countries for latest year
4. **No Invalid Codes**: No "XX" or placeholder country codes
5. **Numeric Validity**: All USD values must be positive numbers
6. **Year Coverage**: At least 2 years of data (2023, 2024)

## Example (Abbreviated)

```json
{
  "meta": {
    "generatedAt": "2026-02-24T00:00:00Z",
    "sources": {
      "gdp": "World Bank",
      "trade": "IMF DOTS",
      "sectors": "UN Comtrade"
    },
    "snapshotDate": "2026-02-24"
  },
  "nodes": [
    {
      "iso2": "US",
      "iso3": "USA",
      "country": "United States",
      "gdpUsd": 27360000000000,
      "exportsUsd": 2050000000000,
      "importsUsd": 3200000000000,
      "bubbleRadius": 60
    }
  ],
  "links": [
    {
      "s": "US",
      "t": "CN",
      "tradeUsd": 650000000000,
      "year": 2024,
      "direction": "both",
      "weight": 1
    }
  ],
  "sectors": [
    { "id": "medicine", "name": "Medicine" }
  ],
  "topProducersBySectorYear": {
    "2024": {
      "medicine": [
        { "iso2": "US", "value": 550000000000 },
        { "iso2": "CH", "value": 180000000000 }
      ]
    }
  }
}
```

## Validation

Run schema tests:
```bash
node --test tests/country-macro-data-schema.test.mjs
```
