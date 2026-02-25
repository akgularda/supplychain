# Country Macro Viewer

Standalone website for visualizing global GDP and bilateral trade flows.

## Features

- **GDP Bubble Chart**: Countries sized by GDP (USD)
- **Trade Flow Visualization**: Bilateral trade connections with configurable filters
- **Default Lens**: GDP + trade heat scoring before any product sector is selected
- **Sector Drilldown**: Top 10 producers by sector (including Medicine)
- **Country Detail Cards**: GDP, exports, imports, trade balance, and top partners
- **Interactive Controls**: Year, direction, minimum trade threshold filters

## Running

Open `macro-site/index.html` in a browser, or serve with:

```bash
npx http-server macro-site -p 8080
```

Then navigate to `http://localhost:8080`.

## Data

The site loads data from `../data/country-macro-map.js`. To regenerate:

```bash
npm run build:country-data
```

## Controls

| Control | Description |
|---------|-------------|
| Year | Cycle through available years |
| Direction | Filter by exports, imports, or both |
| Min Trade | Set minimum trade threshold |
| Bloc | Multi-select blocs with union/intersection member mode and touching/internal edge scope |
| Sectors | Open sector filter panel |
| Reset | Reset all filters to defaults |

## Keyboard Shortcuts

- `Esc` - Close detail panel / Reset view
- `/` - Focus search

## Data Sources

- GDP: World Bank (current USD)
- Bilateral Trade Links: UN Comtrade Public Preview (HS TOTAL, exports)
- Country Trade Totals (exports/imports): World Bank API (NE.EXP.GNFS.CD, NE.IMP.GNFS.CD)
- Sector Exports: UN Comtrade Public Preview (HS chapters, exports)

## Architecture

- Vanilla JavaScript (ES modules pattern)
- D3.js v7 for visualization
- Standalone from main supply chain site
- Independent data contract

## Development

Tests:
```bash
node --test tests/macro-site-integrity.test.mjs
```
