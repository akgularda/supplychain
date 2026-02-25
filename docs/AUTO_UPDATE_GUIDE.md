# Country Macro Auto-Update Guide

**Last Updated:** 2026-02-24

## Overview

The Country Macro Viewer website (`macro-site/`) uses automatically generated data from multiple sources:

- **GDP Data:** World Bank Open Data API
- **Bilateral Trade:** IMF Direction of Trade Statistics (DOTS)
- **Sector Exports:** UN Comtrade / HS Code Classification

## Automated Updates

### GitHub Actions Workflow

The workflow `.github/workflows/auto-update-data.yml` runs weekly (Mondays at 6:00 AM UTC) to:

1. Update market cap data for the main supply chain site
2. **Regenerate country macro dataset**
3. **Run data validation tests**
4. Commit and push changes if data has changed

### Manual Trigger

You can manually trigger the workflow:

```bash
# Via GitHub UI
1. Go to Actions tab
2. Select "Auto-Update Market Cap Data"
3. Click "Run workflow"
```

## Data Generation

### Local Generation

To regenerate the country macro dataset locally:

```bash
npm run build:country-data
```

This will:
1. Fetch latest GDP data from World Bank API
2. Generate bilateral trade flows
3. Generate sector export data
4. Combine into `data/country-macro-map.json` and `data/country-macro-map.js`

### Output Files

- `data/country-macro-map.json` - Full JSON dataset
- `data/country-macro-map.js` - Browser-ready JS with `window.countryMacroData`
- `data/raw/worldbank-gdp-snapshot.json` - Cached GDP data
- `data/raw/imf-dots-snapshot.json` - Cached trade data
- `data/raw/sector-exports-snapshot.json` - Cached sector data

## Data Contract

See `docs/plans/country-macro-data-contract.md` for the complete schema specification.

### Key Requirements

- **>= 100 countries** with GDP, exports, imports
- **>= 8 sectors** including medicine, electronics, automotive, etc.
- **Top 10 producers** per sector per year
- **Multiple years** of data (2023, 2024+)
- **No XX placeholder** country codes

## Validation Tests

Run all tests:

```bash
npm test
```

Run specific macro tests:

```bash
node --test tests/country-macro-data-schema.test.mjs
node --test tests/country-macro-ingestion.test.mjs
node --test tests/macro-site-integrity.test.mjs
```

## Fallback Behavior

If remote APIs fail:
1. System falls back to cached snapshots in `data/raw/`
2. If no cache exists, uses built-in fallback data for major economies
3. Dataset generation continues with available data

## Running the Macro Site

### Development

```bash
npx http-server macro-site -p 8080
```

Then open: `http://localhost:8080`

### Production

The `macro-site/` folder can be deployed as a standalone static site.

## Troubleshooting

### "Country not found in nodes"

Ensure the country ISO code is in:
- `scripts/generate-country-macro-data.mjs` → `COUNTRY_NAMES`
- `scripts/generate-country-macro-data.mjs` → `ISO2_TO_ISO3`
- Or add to `SPECIAL_COUNTRIES` if not in World Bank data

### "Sector missing top 10 producers"

Check `scripts/lib/fetch-sector-exports.mjs` → `sectorProducers` has 10 entries per sector.

### "Link references unknown country"

Ensure all trade link country codes exist in the nodes array.

## Data Sources

| Source | API | License |
|--------|-----|---------|
| World Bank GDP | https://api.worldbank.org/ | CC BY-4.0 |
| IMF DOTS | https://data.imf.org/ | Terms of Use |
| UN Comtrade | https://comtradeplus.un.org/ | Terms of Use |

## Snapshot Dates

Check the generated data metadata:

```javascript
console.log(window.countryMacroData.meta);
// {
//   generatedAt: "2026-02-24T...",
//   snapshotDate: "2026-02-24",
//   sources: { ... }
// }
```
