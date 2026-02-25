# Monarch Castle Technologies Branding, Auto-Update & Top 10 Cards Design

**Date:** 2026-02-24  
**Author:** Claude (AI Assistant)  
**Status:** Approved for Implementation

---

## Overview

This document describes three major enhancements to the Global Supply Chain visualization website:

1. **Professional Branding** - Monarch Castle Technologies logo and company name in header
2. **Auto-Update System** - GitHub Actions workflow for weekly market cap data updates
3. **Top 10 Cards** - Detailed company cards grid above visualization with "See More" functionality

---

## Section 1: Professional Branding

### Goal
Replace generic "Global Supply Chain" title with professional Monarch Castle Technologies branding.

### Design Specification

**Header Layout:**
```
┌────────────────────────────────────────────────────────────────────────┐
│ [Logo 32x32] Monarch Castle Technologies | Market Intelligence        │
│                                     [Stats: 2,847 nodes · 8,234 links] │
└────────────────────────────────────────────────────────────────────────┘
```

**Logo Specifications:**
- Size: 32x32 pixels
- Format: PNG (copied to `./assets/monarch-logo.png`)
- Border radius: 4px
- Box shadow: `0 2px 8px rgba(0,0,0,0.3)`
- Hover effect: `brightness(1.1)` on container

**Typography:**
- Font: Inter (already loaded via Google Fonts)
- Company Name: `font-weight: 500`, `font-size: 14px`, `color: #ffffff`
- Tagline: `font-weight: 400`, `font-size: 14px`, `color: #888888`
- Separator: `color: #505050` (pipe character)

**Page Title:**
- Update `<title>` to: "Monarch Castle Technologies | Market Intelligence"
- Update favicon reference if needed

**CSS Changes:**
```css
#title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
}

#title .logo {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  object-fit: contain;
}

#title .companyName {
  font-weight: 500;
  color: #fff;
}

#title .tagline {
  font-weight: 400;
  color: #888;
}

#title .separator {
  color: #505050;
  margin: 0 2px;
}

#title:hover {
  filter: brightness(1.1);
  transition: filter 0.2s ease;
}
```

**HTML Structure:**
```html
<div id="title">
  <img src="./assets/monarch-logo.png" alt="Monarch Castle Technologies" class="logo">
  <span class="companyName">Monarch Castle Technologies</span>
  <span class="separator">|</span>
  <span class="tagline">Market Intelligence</span>
</div>
```

---

## Section 2: Auto-Update System

### Goal
Automatically update market cap data and company rankings weekly using GitHub Actions.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTO-UPDATE SYSTEM                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Schedule: Every Monday 6:00 AM UTC                         │
│                                                             │
│  Step 1: Download CSV                                       │
│    Source: https://companiesmarketcap.com/?download=CSV     │
│    Destination: /tmp/latest-marketcap.csv                   │
│                                                             │
│  Step 2: Parse & Compare                                    │
│    Script: scripts/update-marketcap-data.mjs                │
│    Compare: new CSV vs existing data/top100-map-updated.json│
│    Detect: Ranking changes, market cap changes, new entries │
│                                                             │
│  Step 3: Update Data Files                                  │
│    Update: data/top100-map-updated.json (source data)       │
│    Regenerate: data/top100-map.js (D3 visualization data)   │
│    Preserve: All supply chain relationships                 │
│                                                             │
│  Step 4: Commit Changes                                     │
│    Commit message: "chore: auto-update market cap data      │
│                     [YYYY-MM-DD]"                           │
│    Changelog: List top 5 ranking changes in commit body     │
│    Push: To master branch                                   │
│                                                             │
│  Step 5: Notification (optional)                            │
│    GitHub Actions summary with change report                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### File: `.github/workflows/auto-update-data.yml`

```yaml
name: Auto-Update Market Cap Data

on:
  schedule:
    - cron: '0 6 * * 1'  # Every Monday at 6:00 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  update-data:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Download and parse latest CSV
        run: node scripts/update-marketcap-data.mjs
      
      - name: Check for changes
        id: git-check
        run: |
          git diff --quiet data/ || echo "changes=true" >> $GITHUB_OUTPUT
      
      - name: Commit and push if changes
        if: steps.git-check.outputs.changes == 'true'
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git add data/
          git commit -m "chore: auto-update market cap data $(date +%Y-%m-%d)"
          git push
      
      - name: Generate summary
        run: |
          echo "## Auto-Update Summary" >> $GITHUB_STEP_SUMMARY
          echo "✅ Data updated successfully" >> $GITHUB_STEP_SUMMARY
          echo "📅 Update time: $(date)" >> $GITHUB_STEP_SUMMARY
```

### File: `scripts/update-marketcap-data.mjs`

**Key Functions:**
1. `fetchCSV(url)` - Download CSV from companiesmarketcap.com
2. `parseCSV(csvText)` - Parse CSV into structured data
3. `compareData(oldData, newData)` - Detect changes in rankings/market caps
4. `mergeData(existingData, newMarketCaps)` - Update market caps while preserving relationships
5. `generateChangeReport(changes)` - Create human-readable changelog
6. `writeDataFiles(data)` - Write updated JSON/JS files

**Data Preservation:**
- Supply chain relationships (upstream, services, channels, demand)
- Credit ratings data
- Source citations and confidence levels
- HQ information (city, country, flag)
- All custom profile enrichments

**Metadata Updates:**
```javascript
{
  "snapshot_date": "2026-02-24",
  "last_auto_update": "2026-02-24T06:00:00Z",
  "update_source": "companiesmarketcap.com",
  "update_commit_hash": "abc123",
  "companies": [...]
}
```

### Update Status Indicator

**Footer Display:**
```javascript
function getUpdateStatusAge() {
  const lastUpdate = new Date(DATA.last_auto_update);
  const now = new Date();
  const daysOld = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24));
  
  if (daysOld <= 7) return { class: 'fresh', color: '#4caf50', text: 'Updated' };
  if (daysOld <= 14) return { class: 'stale', color: '#ff9800', text: 'Aging' };
  return { class: 'outdated', color: '#f44336', text: 'Outdated' };
}
```

**Visual Indicator:**
- Green dot (pulsing): Updated within 7 days
- Yellow dot: 7-14 days old
- Red dot: >14 days old

---

## Section 3: Top 10 Detailed Cards

### Goal
Display top 10 companies by market cap in detailed cards above visualization with "See Full Top 100" functionality.

### Layout Specification

**Desktop (≥1200px):**
```
┌─────────────────────────────────────────────────────────────────┐
│  [Card 1] [Card 2] [Card 3] [Card 4] [Card 5]                   │
│  [Card 6] [Card 7] [Card 8] [Card 9] [Card 10]                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           See Full Top 100 →                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Supply Chain Visualization Canvas]                            │
└─────────────────────────────────────────────────────────────────┘
```

**Mobile (<768px):**
```
┌─────────────────────────┐
│  [Card 1] [Card 2]      │
│  [Card 3] [Card 4]      │
│  [Card 5]               │
│  ...                    │
│  [See Full Top 100 →]   │
│  [Visualization]        │
└─────────────────────────┘
```

### Card Structure (Full Detail - Option C)

```
┌──────────────────────────────────────────┐
│ [Logo 40x40] NVDA                        │
│ NVIDIA Corporation                       │
│ ──────────────────────────────────────── │
│ Market Cap: $3.42T                       │
│ Rank: #1 (▲ 0)                           │
│ Country: 🇺🇸 United States               │
│ Sector: Semiconductors                   │
│ Employees: 29,600                        │
│ ──────────────────────────────────────── │
│ Credit Ratings: [AAA] [Aaa] [AAA]        │
│ ──────────────────────────────────────── │
│ Suppliers: 5 · Services: 4               │
│ Channels: 3 · Demand: 2                  │
│ Key: TSMC, SK hynix, Micron              │
│ ──────────────────────────────────────── │
│ [View Profile →]                         │
└──────────────────────────────────────────┘
```

### Card Data Fields

**Header Section:**
- Company logo (40x40px, from companiesmarketcap.com API)
- Stock symbol (bold, uppercase)
- Full company name

**Primary Stats:**
- Market cap (formatted: $X.XXT, animated counter)
- Current rank with change indicator (▲/▼/─)
- Country with flag emoji
- Sector/Industry classification
- Employee count (if available)

**Credit Ratings:**
- S&P badge (red theme)
- Moody's badge (blue theme)
- Fitch badge (purple theme)
- Show "N/A" if not rated

**Supply Chain Stats:**
- Supplier count
- Service provider count
- Channel/distributor count
- Demand node count
- Top 3 key suppliers (truncated if long)

**Action:**
- "View Profile →" button
- Opens company in visualization below
- Smooth scroll to visualization

### CSS Styling

**Grid Container:**
```css
#top10Cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 1200px) {
  #top10Cards {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  #top10Cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    padding: 12px;
  }
}
```

**Individual Card:**
```css
.top10-card {
  background: linear-gradient(180deg, rgba(18,18,18,0.98) 0%, rgba(10,10,10,0.96) 100%);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  padding: 14px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  transition: all 0.2s ease;
  cursor: pointer;
}

.top10-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  border-color: rgba(255,255,255,0.12);
}

.top10-card .cardHeader {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.top10-card .cardLogo {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: contain;
  background: #0f0f0f;
}

.top10-card .cardSymbol {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

.top10-card .cardName {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: #888;
  margin-top: 2px;
}

.top10-card .cardSection {
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.top10-card .cardStat {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: #aaa;
  margin-bottom: 6px;
}

.top10-card .cardStat b {
  color: #fff;
  font-weight: 600;
}

.top10-card .rankChange {
  font-size: 9px;
}

.rank-up { color: #4caf50; }
.rank-down { color: #f44336; }
.rank-same { color: #666; }

.top10-card .creditRatings {
  display: flex;
  gap: 4px;
  margin-top: 6px;
}

.top10-card .supplyChainStats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 8px;
  color: #888;
}

.top10-card .supplyChainStats span {
  background: rgba(255,255,255,0.05);
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid rgba(255,255,255,0.08);
}

.top10-card .viewProfile {
  width: 100%;
  background: rgba(232,69,60,0.15);
  border: 1px solid rgba(232,69,60,0.3);
  color: #e8453c;
  padding: 6px 10px;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
  text-decoration: none;
  display: block;
}

.top10-card .viewProfile:hover {
  background: rgba(232,69,60,0.25);
  border-color: rgba(232,69,60,0.5);
}
```

**"See Full Top 100" Button:**
```css
#seeFullTop100 {
  display: block;
  max-width: 300px;
  margin: 24px auto;
  background: linear-gradient(135deg, #1a1a1a, #222);
  border: 1px solid #333;
  color: #ddd;
  padding: 12px 24px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  text-decoration: none;
}

#seeFullTop100:hover {
  border-color: var(--acc);
  color: var(--acc);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(232,69,60,0.3);
}
```

### JavaScript Functionality

**Card Rendering:**
```javascript
function renderTop10Cards(companies) {
  const container = document.getElementById('top10Cards');
  const top10 = companies.slice(0, 10);
  
  container.innerHTML = top10.map((company, index) => `
    <div class="top10-card" data-symbol="${company.symbol}">
      <div class="cardHeader">
        <img src="${company.hq.logo_url}" alt="${company.name}" class="cardLogo">
        <div>
          <div class="cardSymbol">${company.symbol}</div>
          <div class="cardName">${company.name}</div>
        </div>
      </div>
      
      <div class="cardSection">
        <div class="cardStat">
          <span>Market Cap</span>
          <b class="marketCap" data-value="${company.marketCap}">$${formatMarketCap(company.marketCap)}</b>
        </div>
        <div class="cardStat">
          <span>Rank</span>
          <span>#${company.rank} <span class="rankChange ${getRankChangeClass(company.rankChange)}">${getRankChangeIcon(company.rankChange)}</span></span>
        </div>
        <div class="cardStat">
          <span>Country</span>
          <span>${company.hq.flag_emoji} ${company.hq.country}</span>
        </div>
        <div class="cardStat">
          <span>Sector</span>
          <span>${company.sector || 'N/A'}</span>
        </div>
      </div>
      
      <div class="cardSection">
        <div class="cardStat">
          <span>Credit Ratings</span>
        </div>
        <div class="creditRatings">
          ${renderCreditRatingBadges(company.symbol)}
        </div>
      </div>
      
      <div class="cardSection">
        <div class="cardStat">
          <span>Supply Chain</span>
        </div>
        <div class="supplyChainStats">
          ${renderSupplyChainStats(company.symbol)}
        </div>
        ${company.topSuppliers ? `<div style="font-size:8px;color:#666;margin-top:6px">Key: ${company.topSuppliers.slice(0,3).join(', ')}</div>` : ''}
      </div>
      
      <button class="viewProfile" onclick="openCompanyProfile('${company.symbol}')">
        View Profile →
      </button>
    </div>
  `).join('');
  
  // Animate market cap counters
  document.querySelectorAll('.marketCap').forEach(el => {
    const target = parseFloat(el.dataset.value);
    animateCounter(el, target, 1000, '$', 'T');
  });
}

function openCompanyProfile(symbol) {
  // Smooth scroll to visualization
  document.getElementById('canvas').scrollIntoView({ behavior: 'smooth' });
  // Open company in visualization
  showCompanyCard(symbol);
}
```

**Data Preparation:**
```javascript
// Add rank change tracking
function calculateRankChanges(currentData, previousData) {
  const rankMap = new Map();
  previousData.companies.forEach(c => rankMap.set(c.symbol, c.rank));
  
  currentData.companies.forEach(company => {
    const prevRank = rankMap.get(company.symbol);
    if (prevRank) {
      company.rankChange = prevRank - company.rank; // Positive = moved up
    } else {
      company.rankChange = 0;
    }
  });
  
  return currentData;
}
```

---

## Section 4: File Structure

### New Files to Create

```
SupplyChain/
├── assets/
│   └── monarch-logo.png (copy from OneDrive)
├── .github/
│   └── workflows/
│       └── auto-update-data.yml
├── scripts/
│   └── update-marketcap-data.mjs
├── data/
│   ├── top100-map.js (existing, regenerated)
│   ├── top100-map-updated.json (existing, updated)
│   └── credit-ratings.js (existing, preserved)
└── index.html (modified)
```

### Modified Files

1. **index.html**
   - Header branding (lines 18-25)
   - Top 10 cards section (new, after header)
   - Update status indicator (footer)
   - CSS for cards and branding
   - JavaScript for card rendering

2. **data/top100-map-updated.json**
   - Add `last_auto_update` field
   - Add `update_source` field
   - Preserve all existing structure

---

## Section 5: Testing Checklist

### Branding Tests
- [ ] Logo displays at 32x32px
- [ ] Logo has rounded corners (4px)
- [ ] Company name uses Inter font
- [ ] Tagline is lighter weight
- [ ] Hover effect works on header
- [ ] Page title updated in browser tab

### Auto-Update Tests
- [ ] GitHub Action triggers on schedule
- [ ] CSV downloads successfully
- [ ] Parser handles all CSV formats
- [ ] Market cap changes detected
- [ ] Ranking changes detected
- [ ] Data files update correctly
- [ ] Git commit creates with proper message
- [ ] No supply chain data lost in update
- [ ] Update status indicator shows correct age

### Top 10 Cards Tests
- [ ] All 10 cards render correctly
- [ ] Logos load for all companies
- [ ] Market caps format correctly ($X.XXT)
- [ ] Rank change indicators show (▲/▼/─)
- [ ] Credit ratings display (or N/A)
- [ ] Supply chain stats show correct counts
- [ ] "View Profile" button opens company
- [ ] Smooth scroll to visualization works
- [ ] Grid responsive (5 cols → 3 cols → 2 cols)
- [ ] Card hover effects work
- [ ] "See Full Top 100" button visible and functional

### Cross-Browser Tests
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### Performance Tests
- [ ] Page load < 2 seconds
- [ ] Card rendering < 500ms
- [ ] Animations at 60fps
- [ ] No layout shift on load
- [ ] Smooth scroll performance

---

## Section 6: Success Metrics

| Feature | Metric | Target |
|---------|--------|--------|
| Branding | Logo visibility | 100% load success |
| Branding | Brand recognition | Clear, professional |
| Auto-Update | Update frequency | Weekly (every Monday) |
| Auto-Update | Data accuracy | 100% match with source |
| Auto-Update | Failure recovery | Auto-retry 3x |
| Top 10 Cards | Load time | < 500ms |
| Top 10 Cards | Click-through rate | > 30% of visitors |
| Top 10 Cards | Mobile usability | Full functionality |

---

## Section 7: Edge Cases & Error Handling

### Logo Loading Failures
```javascript
// Fallback to text initials if logo fails
img.onerror = () => {
  img.style.display = 'none';
  fallback.style.display = 'flex';
  fallback.textContent = getInitials(company.name);
};
```

### Auto-Update Failures
```yaml
# Retry logic in GitHub Action
- name: Download CSV
  run: |
    for i in 1 2 3; do
      node scripts/update-marketcap-data.mjs && break || sleep 3600
    done
```

### Data Validation
```javascript
function validateCompany(company) {
  const errors = [];
  if (!company.symbol || !/^[A-Z0-9.]+$/.test(company.symbol)) {
    errors.push('Invalid symbol format');
  }
  if (typeof company.marketCap !== 'number' || company.marketCap <= 0) {
    errors.push('Invalid market cap');
  }
  if (!company.hq?.country_code || company.hq.country_code.length !== 2) {
    errors.push('Invalid country code');
  }
  return errors;
}
```

### Missing Data Handling
- Credit ratings: Show "N/A" if not available
- Employee count: Hide field if not available
- Sector: Use "Diversified" if not classified
- Top suppliers: Show "—" if not tracked

---

## Section 8: Maintenance & Updates

### Manual Override
```bash
# Run update manually if needed
node scripts/update-marketcap-data.mjs

# Force refresh all data
node scripts/update-marketcap-data.mjs --force
```

### Data Backup
```bash
# Before each auto-update, create backup
cp data/top100-map-updated.json data/backups/top100-backup-$(date +%Y%m%d).json
```

### Version History
Keep changelog in `docs/CHANGELOG.md`:
```markdown
## 2026-02-24
- Added Monarch Castle Technologies branding
- Implemented auto-update system
- Added Top 10 company cards

## 2026-02-17
- Enhanced company card with credit ratings
- Improved tooltip design
- Added smooth transitions
```

---

## Approval

**Design approved for implementation:** ☐

**Approved by:** [User]  
**Date:** [To be filled]

**Next Step:** Invoke `writing-plans` skill to create detailed implementation plan.
