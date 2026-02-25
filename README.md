# SupplyChain Intelligence Suite

Interactive data visualization project with two web experiences:

- `index.html`: Top-100 market cap supply-chain relationship graph (company-level).
- `macro-site/index.html`: Country macro graph (GDP bubbles + bilateral trade links + sector leaders).

## Highlights

- Real-time style graph UX with D3.js.
- Company-level network with profile cards, source-linked provenance, and credit rating overlays.
- Country-level macro graph with GDP-sized nodes, bilateral trade corridors, sector drilldowns (medicine, electronics, automotive, energy, agriculture, textiles, metals, chemicals), trade bloc filtering (EU, NATO, MERCOSUR, ASEAN, GCC, USMCA, BRICS, AfCFTA, CPTPP, RCEP, EAEU, SAARC, CARICOM, APEC, OECD, G7, G20), and real-data provenance display.

## Tech Stack

- Vanilla JavaScript
- D3.js v7
- Node.js scripts for ingestion/generation
- Node test runner (`node --test`)

## Project Structure

- `index.html`: Main company supply-chain app (single-file app with inline script/style).
- `macro-site/`: Country macro app (`index.html`, `styles.css`, `app.js`, app-specific README).
- `data/`: Generated browser-ready datasets (`*.json`, `*.js`) and ratings data.
- `data/raw/`: Cached raw snapshots used by generators.
- `scripts/`: Data ingestion/generation utilities.
- `scripts/lib/`: Source-specific fetchers (World Bank, UN Comtrade, etc.).
- `tests/`: Data contract + UI integrity + ingestion coverage.
- `.github/workflows/auto-update-data.yml`: Scheduled data refresh workflow.

## Data Sources

Main sources currently used:

- World Bank API GDP: `NY.GDP.MKTP.CD`
- World Bank API country trade totals: `NE.EXP.GNFS.CD`, `NE.IMP.GNFS.CD`
- UN Comtrade Public Preview bilateral trade links: HS TOTAL (exports)
- UN Comtrade Public Preview sector exports: HS chapter-level exports

Real-data-only mode:

- Synthetic fallback values are disabled for country macro generation.
- If a required source is unavailable and no valid cache exists, generation fails instead of fabricating numbers.

## Local Setup

Requirements:

- Node.js 20+

Install:

```bash
npm install
```

Run tests:

```bash
npm test
```

Serve locally:

```bash
npx http-server . -p 8080
```

Open:

- `http://localhost:8080/` (company supply-chain graph)
- `http://localhost:8080/macro-site/` (country macro graph)

## Data Generation

Build country macro dataset:

```bash
npm run build:country-data
```

Force-refresh source pulls and rebuild:

```bash
node scripts/generate-country-macro-data.mjs --refresh
```

Update market-cap-driven company dataset:

```bash
node scripts/update-marketcap-data.mjs
```

## Test Coverage Overview

The test suite checks:

- macro-site structural integrity and accessibility affordances
- country macro schema and provenance contracts
- ingestion module behavior
- root index UI integrity
- source quality/metadata checks for profile relationships
- workflow expectations for auto-update automation

## Automation

GitHub Actions workflow:

- File: `.github/workflows/auto-update-data.yml`
- Schedule: every Monday at 06:00 UTC
- Manual trigger: enabled (`workflow_dispatch`)
- Pipeline step: update market cap data
- Pipeline step: rebuild country macro dataset
- Pipeline step: run country ingestion/schema tests
- Pipeline step: commit `data/` changes when diffs exist

## Notes

- This repo currently includes generated artifacts under `data/`.
- `node_modules/` should remain untracked in normal Git usage.
- The workspace may contain planning docs in `docs/plans/` and `plan*.md` files used during implementation iterations.
