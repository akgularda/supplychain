# Auto-Update System Guide

## Overview

The market cap data automatically updates every Monday at 6:00 AM UTC via GitHub Actions.

## Manual Update

To run an update manually:

```bash
node scripts/update-marketcap-data.mjs
```

## Update Indicators

- **Green dot**: Data updated within 7 days ✓
- **Yellow dot**: Data 7-14 days old ⚠
- **Red dot**: Data >14 days old ✗

## Troubleshooting

### Update Failed

Check GitHub Actions logs:
1. Go to repository Actions tab
2. Click "Auto-Update Market Cap Data" workflow
3. Review failed run logs

### Force Update

```bash
node scripts/update-marketcap-data.mjs --force
```

### Restore Backup

Backups stored in `data/backups/`:

```bash
cp data/backups/top100-backup-YYYYMMDD.json data/top100-map-updated.json
```

## Data Sources

- **Market Caps**: companiesmarketcap.com (weekly CSV)
- **Credit Ratings**: Static data in `data/credit-ratings.js`
- **Supply Chain**: Manually curated, preserved during updates

## Adding New Companies

When new companies enter top 100:
1. Auto-update adds them with basic data
2. Manually enrich supply chain relationships
3. Add credit ratings if available
