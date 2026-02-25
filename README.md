# SupplyChain Market Intelligence

Interactive supply-chain intelligence map for the top 100 public companies by market cap.

## Scope

This README documents the root SupplyChain application only.

## Core Features

- Interactive D3 network graph with layer and country context.
- Company profile card with upstream, service, channel, and demand entities.
- Relationship metadata and source-linked provenance in profile links.
- Credit ratings overlay from generated ratings data.

## Tech Stack

- HTML/CSS/Vanilla JavaScript
- D3.js (CDN-loaded in `index.html`)
- Node.js scripts for data generation and verification
- Node built-in test runner (`node --test`)

## Repository Structure

- `index.html`: Main web application.
- `data/`: Browser-ready datasets (`top100-map.*`, `credit-ratings.*`, and supporting data files).
- `scripts/`: Data update, generation, and verification scripts.
- `scripts/lib/`: Source-specific data fetch helpers.
- `tests/`: Data and UI integrity tests.
- `.github/workflows/auto-update-data.yml`: Scheduled data refresh workflow.

## Requirements

- Node.js 20+
- npm

## Local Setup

```bash
npm install
npx http-server . -p 8080
```

Open `http://localhost:8080`.

## Data Workflows

Generate top-100 company map data:

```bash
node scripts/generate-top100-data.mjs
```

Update market cap data and merge with existing company profile structure:

```bash
node scripts/update-marketcap-data.mjs
```

Fetch and generate credit ratings dataset:

```bash
node scripts/fetch-fitch-ratings.mjs
```

Run data verification checks:

```bash
node scripts/verify-data.mjs
```

## Testing

Run all configured tests:

```bash
npm test
```

Run focused root-app tests:

```bash
node --test tests/index-ui-integrity.test.mjs
node --test tests/no-xx-country-codes.test.mjs
node --test tests/profile-link-metadata.test.mjs
node --test tests/supply-chain-research-quality.test.mjs
```

## Outputs

Main generated artifacts consumed by the app:

- `data/top100-map.json`
- `data/top100-map.js`
- `data/credit-ratings.json`
- `data/credit-ratings.js`
