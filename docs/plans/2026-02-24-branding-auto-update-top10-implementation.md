# Monarch Castle Technologies Branding, Auto-Update & Top 10 Cards Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `subagent-driven-development` to implement this plan task-by-task.

**Goal:** Add professional Monarch Castle Technologies branding, automated weekly data updates via GitHub Actions, and detailed top 10 company cards grid above visualization.

**Architecture:** Three independent feature modules: (1) Header branding replacement, (2) GitHub Actions workflow + update script, (3) Top 10 cards grid with detailed company information. All changes to existing files plus new workflow and script files.

**Tech Stack:** Vanilla JavaScript, Node.js 20+, GitHub Actions, D3.js v7, CSS3 with custom properties

---

## Pre-Implementation Checklist

### Step 0: Verify Current State

```bash
cd C:\Users\akgul\Downloads\SupplyChain
git status
node --test tests/*.test.mjs
```

Expected: Clean working tree, 108/108 tests passing

---

## Task 1: Copy Logo Asset

**Files:**
- Create: `assets/monarch-logo.png`
- Source: `C:\Users\akgul\OneDrive\Desktop\General\Monarch Castle Technologies\website\logo.png`

**Step 1: Create assets directory**

```bash
mkdir assets
```

**Step 2: Copy logo file**

Manually copy the logo from OneDrive to the assets folder:
```bash
# User must copy manually since OneDrive is outside workspace
# Copy: C:\Users\akgul\OneDrive\Desktop\General\Monarch Castle Technologies\website\logo.png
# To:   C:\Users\akgul\Downloads\SupplyChain\assets\monarch-logo.png
```

**Step 3: Verify logo exists**

```bash
ls -la assets/monarch-logo.png
```

Expected: File exists, reasonable size (< 100KB)

**Step 4: Commit**

```bash
git add assets/monarch-logo.png
git commit -m "feat: add Monarch Castle Technologies logo asset"
```

---

## Task 2: Update Header Branding

**Files:**
- Modify: `index.html:18-25` (header HTML structure)
- Modify: `index.html:20-35` (CSS for branding)

**Step 1: Update page title**

Find line 6:
```html
<title>Global Supply Chain - Top 100 Market Cap</title>
```

Replace with:
```html
<title>Monarch Castle Technologies | Market Intelligence</title>
```

**Step 2: Update header HTML structure**

Find the `#title` div (around line 230):
```html
<div id="title"><span>Global Supply Chain</span> / Top 100 Market Cap</div>
```

Replace with:
```html
<div id="title">
  <img src="./assets/monarch-logo.png" alt="Monarch Castle Technologies" class="logo">
  <span class="companyName">Monarch Castle Technologies</span>
  <span class="separator">|</span>
  <span class="tagline">Market Intelligence</span>
</div>
```

**Step 3: Add CSS for branding**

Find existing `#title` styles (around line 20) and replace with:

```css
#title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.3px;
  line-height: 1;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  transition: filter 0.2s ease;
}

#title:hover {
  filter: brightness(1.1);
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
```

**Step 4: Test branding in browser**

Open `index.html` and verify:
- Logo displays at 32x32px in top-left
- Company name uses Inter font
- Tagline is lighter gray
- Hover effect brightens header
- Page title shows "Monarch Castle Technologies" in browser tab

**Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add Monarch Castle Technologies professional branding to header"
```

---

## Task 3: Create Auto-Update Script

**Files:**
- Create: `scripts/update-marketcap-data.mjs`
- Modify: `package.json` (add dependencies if needed)

**Step 1: Create update script**

Create `scripts/update-marketcap-data.mjs`:

```javascript
#!/usr/bin/env node

/**
 * Auto-update market cap data from companiesmarketcap.com
 * Runs weekly via GitHub Actions
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const DATA_DIR = join(ROOT_DIR, 'data');
const BACKUP_DIR = join(DATA_DIR, 'backups');

const CSV_URL = 'https://companiesmarketcap.com/?download=CSV';

// Ensure backup directory exists
if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Fetch CSV from companiesmarketcap.com
 */
async function fetchCSV() {
  console.log('📥 Downloading latest market cap data...');
  
  const response = await fetch(CSV_URL);
  if (!response.ok) {
    throw new Error(`Failed to download CSV: ${response.status} ${response.statusText}`);
  }
  
  return await response.text();
}

/**
 * Parse CSV into structured data
 */
function parseCSV(csvText) {
  console.log('📊 Parsing CSV data...');
  
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  const companies = lines.slice(1).map(line => {
    const values = line.split(',');
    const company = {};
    
    headers.forEach((header, index) => {
      let value = values[index]?.trim() || '';
      
      // Clean company name (remove quotes)
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      
      // Parse market cap (remove $ and T/B/M suffixes)
      if (header.includes('Market Cap')) {
        value = parseMarketCap(value);
      }
      
      // Parse rank as number
      if (header.includes('Rank')) {
        value = parseInt(value, 10) || 0;
      }
      
      company[header.trim().toLowerCase().replace(/\s+/g, '_')] = value;
    });
    
    return company;
  });
  
  return companies;
}

/**
 * Parse market cap string to number (in trillions)
 */
function parseMarketCap(value) {
  if (!value || value === 'N/A') return 0;
  
  const match = value.match(/[\$]?([0-9.]+)([TBM])?/);
  if (!match) return 0;
  
  const num = parseFloat(match[1]);
  const suffix = match[2]?.toUpperCase() || 'B';
  
  switch (suffix) {
    case 'T': return num; // Already in trillions
    case 'B': return num / 1000; // Convert billions to trillions
    case 'M': return num / 1000000; // Convert millions to trillions
    default: return num / 1000;
  }
}

/**
 * Load existing data to preserve supply chain relationships
 */
function loadExistingData() {
  const filePath = join(DATA_DIR, 'top100-map-updated.json');
  
  if (!existsSync(filePath)) {
    console.log('⚠️  No existing data found, creating fresh dataset');
    return null;
  }
  
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Merge new market cap data with existing supply chain data
 */
function mergeData(existingData, newCompanies) {
  console.log('🔀 Merging new market cap data with existing supply chain data...');
  
  if (!existingData) {
    return createFreshDataset(newCompanies);
  }
  
  // Create map of new data by symbol
  const newMap = new Map();
  newCompanies.forEach(c => {
    if (c.symbol) {
      newMap.set(c.symbol.toUpperCase(), c);
    }
  });
  
  // Update existing companies with new market caps
  const updatedCompanies = existingData.companies.map(existing => {
    const symbol = existing.symbol?.toUpperCase();
    const newData = newMap.get(symbol);
    
    if (newData) {
      return {
        ...existing,
        rank: newData.rank || existing.rank,
        marketCap: newData.market_cap_usd || existing.marketCap,
        // Preserve all supply chain data
        profile: existing.profile,
        hq: existing.hq,
        sector: existing.sector || newData.sector || 'Diversified',
      };
    }
    
    return existing;
  });
  
  // Add any new companies not in existing data
  newCompanies.forEach(newCompany => {
    const symbol = newCompany.symbol?.toUpperCase();
    const exists = updatedCompanies.some(c => c.symbol?.toUpperCase() === symbol);
    
    if (!exists && symbol) {
      updatedCompanies.push({
        rank: newCompany.rank,
        symbol: symbol,
        name: newCompany.name,
        marketCap: newCompany.market_cap_usd,
        sector: newCompany.sector || 'Diversified',
        hq: {
          city: 'Unknown',
          country: 'Unknown',
          country_code: 'XX',
          flag_emoji: '🏳️',
          logo_url: `https://companiesmarketcap.com/img/company-logos/64/${symbol}.png`
        },
        profile: {
          upstream: ['Supply Chain Data Pending'],
          services: ['Data Pending'],
          channels: ['Data Pending'],
          demand: ['Data Pending']
        }
      });
    }
  });
  
  // Sort by rank
  updatedCompanies.sort((a, b) => (a.rank || 999) - (b.rank || 999));
  
  return {
    ...existingData,
    snapshot_date: new Date().toISOString().split('T')[0],
    last_auto_update: new Date().toISOString(),
    update_source: 'companiesmarketcap.com',
    companies: updatedCompanies
  };
}

/**
 * Create fresh dataset if no existing data
 */
function createFreshDataset(companies) {
  console.log('📝 Creating fresh dataset...');
  
  return {
    snapshot_date: new Date().toISOString().split('T')[0],
    last_auto_update: new Date().toISOString(),
    update_source: 'companiesmarketcap.com',
    companies: companies.map(c => ({
      rank: c.rank,
      symbol: c.symbol?.toUpperCase(),
      name: c.name,
      marketCap: c.market_cap_usd,
      sector: c.sector || 'Diversified',
      hq: {
        city: 'Unknown',
        country: 'Unknown',
        country_code: 'XX',
        flag_emoji: '🏳️',
        logo_url: `https://companiesmarketcap.com/img/company-logos/64/${c.symbol?.toUpperCase()}.png`
      },
      profile: {
        upstream: ['Supply Chain Data Pending'],
        services: ['Data Pending'],
        channels: ['Data Pending'],
        demand: ['Data Pending']
      }
    }))
  };
}

/**
 * Generate change report
 */
function generateChangeReport(oldData, newData) {
  const changes = [];
  
  if (!oldData) {
    return 'Fresh dataset created';
  }
  
  // Find ranking changes
  const oldRankMap = new Map();
  oldData.companies.forEach(c => oldRankMap.set(c.symbol, c.rank));
  
  newData.companies.slice(0, 20).forEach(company => {
    const oldRank = oldRankMap.get(company.symbol);
    if (oldRank && oldRank !== company.rank) {
      const change = oldRank - company.rank;
      const direction = change > 0 ? '↑' : change < 0 ? '↓' : '─';
      changes.push(`${company.symbol}: #${oldRank} → #${company.rank} (${direction}${Math.abs(change)})`);
    }
  });
  
  return changes.length > 0 
    ? `Top ranking changes:\n${changes.slice(0, 10).join('\n')}`
    : 'No significant changes in top 20';
}

/**
 * Write data files
 */
function writeDataFiles(data) {
  console.log('💾 Writing data files...');
  
  // Write JSON data file
  const jsonPath = join(DATA_DIR, 'top100-map-updated.json');
  writeFileSync(jsonPath, JSON.stringify(data, null, 2));
  
  // Write JS file for D3 visualization
  const jsPath = join(DATA_DIR, 'top100-map.js');
  const jsContent = `// Auto-generated market cap data - ${new Date().toISOString()}\nwindow.SUPPLY_MAP_DATA = ${JSON.stringify(data, null, 2)};`;
  writeFileSync(jsPath, jsContent);
  
  console.log(`✅ Data files updated: ${data.companies.length} companies`);
}

/**
 * Create backup of existing data
 */
function createBackup() {
  const filePath = join(DATA_DIR, 'top100-map-updated.json');
  
  if (existsSync(filePath)) {
    const backupPath = join(BACKUP_DIR, `top100-backup-${new Date().toISOString().split('T')[0]}.json`);
    const content = readFileSync(filePath);
    writeFileSync(backupPath, content);
    console.log(`💾 Backup created: ${backupPath}`);
  }
}

/**
 * Main update function
 */
async function main() {
  try {
    console.log('🚀 Starting market cap data update...\n');
    
    // Create backup first
    createBackup();
    
    // Load existing data
    const existingData = loadExistingData();
    
    // Fetch and parse new data
    const csvText = await fetchCSV();
    const newCompanies = parseCSV(csvText);
    
    console.log(`📊 Found ${newCompanies.length} companies in latest data\n`);
    
    // Merge data
    const mergedData = mergeData(existingData, newCompanies);
    
    // Generate change report
    const report = generateChangeReport(existingData, mergedData);
    console.log('\n📋 Change Report:');
    console.log(report);
    
    // Write updated files
    writeDataFiles(mergedData);
    
    console.log('\n✅ Update completed successfully!');
    console.log(`📅 Snapshot date: ${mergedData.snapshot_date}`);
    console.log(`🕐 Last update: ${mergedData.last_auto_update}`);
    
  } catch (error) {
    console.error('❌ Update failed:', error.message);
    process.exit(1);
  }
}

// Run update
main();
```

**Step 2: Make script executable**

```bash
chmod +x scripts/update-marketcap-data.mjs
```

**Step 3: Test script locally**

```bash
node scripts/update-marketcap-data.mjs
```

Expected: Script runs, downloads CSV, updates data files, creates backup

**Step 4: Verify data files updated**

```bash
ls -la data/top100-map*.js* data/backups/
```

Expected: Files updated with current timestamp

**Step 5: Commit**

```bash
git add scripts/update-marketcap-data.mjs data/
git commit -m "feat: create auto-update script for weekly market cap data refresh"
```

---

## Task 4: Create GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/auto-update-data.yml`

**Step 1: Create .github directory structure**

```bash
mkdir -p .github/workflows
```

**Step 2: Create workflow file**

Create `.github/workflows/auto-update-data.yml`:

```yaml
name: Auto-Update Market Cap Data

on:
  schedule:
    - cron: '0 6 * * 1'  # Every Monday at 6:00 AM UTC
  workflow_dispatch:  # Allow manual trigger

permissions:
  contents: write

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
      
      - name: Install dependencies (if any)
        run: |
          if [ -f package.json ]; then
            npm install
          fi
      
      - name: Create backup timestamp
        id: timestamp
        run: echo "timestamp=$(date +%Y%m%d-%H%M%S) >> $GITHUB_OUTPUT"
      
      - name: Download and parse latest CSV
        run: node scripts/update-marketcap-data.mjs
        env:
          NODE_TLS_REJECT_UNAUTHORIZED: '0'
      
      - name: Check for changes
        id: git-check
        run: |
          git diff --quiet data/ || echo "changes=true" >> $GITHUB_OUTPUT
      
      - name: Generate change summary
        id: summary
        if: steps.git-check.outputs.changes == 'true'
        run: |
          echo "## Auto-Update Summary" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "✅ Market cap data updated successfully" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**Update Time:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**Changes Detected:** Yes" >> $GITHUB_STEP_SUMMARY
      
      - name: Commit and push if changes
        if: steps.git-check.outputs.changes == 'true'
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git add data/
          git commit -m "chore: auto-update market cap data $(date +%Y-%m-%d)"
          git push
          echo "pushed=true" >> $GITHUB_OUTPUT
      
      - name: No changes detected
        if: steps.git-check.outputs.changes != 'true'
        run: |
          echo "## Auto-Update Summary" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "ℹ️ No changes detected in market cap data" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**Check Time:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")" >> $GITHUB_STEP_SUMMARY
```

**Step 3: Verify workflow syntax**

```bash
# Optional: Use actionlint if available
npm install -g actionlint
actionlint .github/workflows/auto-update-data.yml
```

Expected: No syntax errors

**Step 4: Commit**

```bash
git add .github/workflows/auto-update-data.yml
git commit -m "feat: add GitHub Actions workflow for weekly auto-update"
```

---

## Task 5: Add Update Status Indicator to Footer

**Files:**
- Modify: `index.html` (footer HTML and JavaScript)

**Step 1: Add CSS for update status indicator**

Find footer styles (around line 270) and add:

```css
#footer {
  display: flex;
  align-items: center;
  gap: 8px;
}

#footer .updateStatus {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 8px;
  color: #666;
}

#footer .statusDot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

#footer .statusDot.fresh {
  background: #4caf50;
}

#footer .statusDot.stale {
  background: #ff9800;
}

#footer .statusDot.outdated {
  background: #f44336;
}
```

**Step 2: Update footer HTML**

Find the footer div (around line 310):
```html
<div id="footer" style="position:fixed;bottom:8px;left:12px;font-size:8px;color:#444">Data updated: <span id="lastUpdated">--</span></div>
```

Replace with:
```html
<div id="footer" style="position:fixed;bottom:8px;left:12px;font-size:8px;color:#444;display:flex;align-items:center;gap:8px">
  <span class="updateStatus">
    <span class="statusDot" id="updateStatusDot"></span>
    <span id="updateStatusText">Checking...</span>
  </span>
  <span>|</span>
  <span>Data updated: <span id="lastUpdated">--</span></span>
</div>
```

**Step 3: Add JavaScript for update status**

Find the script section and add after data loading:

```javascript
function updateStatusIndicator() {
  const data = window.SUPPLY_MAP_DATA;
  if (!data || !data.last_auto_update) {
    document.getElementById('updateStatusText').textContent = 'Unknown';
    document.getElementById('updateStatusDot').className = 'statusDot outdated';
    return;
  }
  
  const lastUpdate = new Date(data.last_auto_update);
  const now = new Date();
  const daysOld = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24));
  
  const dot = document.getElementById('updateStatusDot');
  const text = document.getElementById('updateStatusText');
  const dateEl = document.getElementById('lastUpdated');
  
  // Format date for display
  dateEl.textContent = lastUpdate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
  
  // Set status based on age
  if (daysOld <= 7) {
    dot.className = 'statusDot fresh';
    text.textContent = 'Updated';
  } else if (daysOld <= 14) {
    dot.className = 'statusDot stale';
    text.textContent = 'Aging';
  } else {
    dot.className = 'statusDot outdated';
    text.textContent = 'Outdated';
  }
}

// Call after data loads
updateStatusIndicator();
```

**Step 4: Test status indicator**

Open browser and verify:
- Dot shows correct color based on data age
- Text shows "Updated"/"Aging"/"Outdated"
- Date displays correctly

**Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add update status indicator with color-coded freshness dot"
```

---

## Task 6: Create Top 10 Cards HTML Structure

**Files:**
- Modify: `index.html` (add cards container after header)

**Step 1: Add cards container HTML**

Find the `#top` header div closing and add after it (around line 250):

```html
<!-- Top 10 Companies Grid -->
<div id="top10Container" style="position:fixed;top:60px;left:0;right:0;z-index:95;padding:16px;pointer-events:none;display:none">
  <div id="top10Cards" style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;max-width:1400px;margin:0 auto;pointer-events:auto"></div>
  <button id="seeFullTop100" onclick="scrollToVisualization()" style="display:block;max-width:300px;margin:24px auto;background:linear-gradient(135deg,#1a1a1a,#222);border:1px solid #333;color:#ddd;padding:12px 24px;font-size:10px;text-transform:uppercase;letter-spacing:1px;border-radius:6px;cursor:pointer;transition:all 0.2s;text-align:center">See Full Top 100 →</button>
</div>
```

**Step 2: Add scrollToVisualization function**

Add to JavaScript section:

```javascript
function scrollToVisualization() {
  document.getElementById('canvas').scrollIntoView({ behavior: 'smooth' });
  // Highlight all nodes
  highlightAllNodes();
}

function highlightAllNodes() {
  // Remove any existing highlights
  d3.selectAll('.node').style('opacity', 1);
  // Flash effect
  d3.selectAll('.node').transition()
    .duration(300)
    .style('opacity', 0.5)
    .transition()
    .duration(300)
    .style('opacity', 1);
}
```

**Step 3: Show container on data load**

Add after data loads:

```javascript
document.getElementById('top10Container').style.display = 'block';
```

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add Top 10 cards container HTML structure"
```

---

## Task 7: Add CSS for Top 10 Cards

**Files:**
- Modify: `index.html` (add card styles to CSS section)

**Step 1: Add card CSS**

Find the `</style>` closing tag and add before it:

```css
/* Top 10 Cards */
#top10Cards {
  padding: 0 16px;
}

.top10-card {
  background: linear-gradient(180deg, rgba(18,18,18,0.98) 0%, rgba(10,10,10,0.96) 100%);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  padding: 14px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  transition: all 0.2s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 10px;
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
}

.top10-card .cardLogo {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: contain;
  background: #0f0f0f;
  border: 1px solid rgba(255,255,255,0.08);
}

.top10-card .cardLogoFallback {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
  border: 1px solid rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #ddd;
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
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.top10-card .cardSection:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.top10-card .cardStat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 9px;
  color: #aaa;
  margin-bottom: 6px;
}

.top10-card .cardStat:last-child {
  margin-bottom: 0;
}

.top10-card .cardStat b {
  color: #fff;
  font-weight: 600;
}

.top10-card .rankChange {
  font-size: 9px;
  margin-left: 4px;
}

.rank-up { color: #4caf50; }
.rank-down { color: #f44336; }
.rank-same { color: #666; }

.top10-card .creditRatings {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.top10-card .supplyChainStats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
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
  font-family: 'JetBrains Mono', monospace;
}

.top10-card .viewProfile:hover {
  background: rgba(232,69,60,0.25);
  border-color: rgba(232,69,60,0.5);
}

#seeFullTop100:hover {
  border-color: var(--acc);
  color: var(--acc);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(232,69,60,0.3);
}

/* Mobile responsive */
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
  
  #top10Container {
    top: auto;
    bottom: 0;
    background: rgba(8,8,8,0.98);
    border-top: 1px solid #2a2a2a;
    max-height: 50vh;
    overflow-y: auto;
  }
  
  #seeFullTop100 {
    margin: 16px auto;
  }
}
```

**Step 2: Commit**

```bash
git add index.html
git commit -m "feat: add professional CSS styling for Top 10 company cards"
```

---

## Task 8: Add JavaScript for Card Rendering

**Files:**
- Modify: `index.html` (add card rendering functions)

**Step 1: Add renderTop10Cards function**

Add to JavaScript section:

```javascript
function renderTop10Cards() {
  const data = window.SUPPLY_MAP_DATA;
  if (!data || !data.companies) return;
  
  const container = document.getElementById('top10Cards');
  const top10 = data.companies.slice(0, 10);
  
  container.innerHTML = top10.map((company, index) => {
    const logoUrl = company.hq?.logo_url || `https://companiesmarketcap.com/img/company-logos/64/${company.symbol}.png`;
    const flag = company.hq?.flag_emoji || '🏳️';
    const country = company.hq?.country || 'Unknown';
    
    // Get profile stats
    const profile = company.profile || {};
    const supplierCount = profile.upstream?.length || 0;
    const serviceCount = profile.services?.length || 0;
    const channelCount = profile.channels?.length || 0;
    const demandCount = profile.demand?.length || 0;
    
    // Get credit ratings
    const ratings = window.SUPPLY_MAP_DATA?.creditRatings?.[company.symbol];
    
    return `
      <div class="top10-card" data-symbol="${company.symbol}" onclick="openCompanyProfile('${company.symbol}')">
        <div class="cardHeader">
          <img src="${logoUrl}" alt="${company.name}" class="cardLogo" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="cardLogoFallback" style="display:none">${getInitials(company.name)}</div>
          <div>
            <div class="cardSymbol">${company.symbol}</div>
            <div class="cardName">${company.name}</div>
          </div>
        </div>
        
        <div class="cardSection">
          <div class="cardStat">
            <span>Market Cap</span>
            <b>$${formatMarketCap(company.marketCap || 0)}</b>
          </div>
          <div class="cardStat">
            <span>Rank</span>
            <span>#${company.rank || index + 1}</span>
          </div>
          <div class="cardStat">
            <span>Country</span>
            <span>${flag} ${country}</span>
          </div>
          <div class="cardStat">
            <span>Sector</span>
            <span>${company.sector || 'Diversified'}</span>
          </div>
        </div>
        
        ${ratings ? `
        <div class="cardSection">
          <div class="cardStat">
            <span>Credit Ratings</span>
          </div>
          <div class="creditRatings">
            ${ratings.sp ? `<span class="credit-rating sp"><span class="credit-rating-grade">${ratings.sp.grade}</span></span>` : ''}
            ${ratings.moodys ? `<span class="credit-rating moodys"><span class="credit-rating-grade">${ratings.moodys.grade}</span></span>` : ''}
            ${ratings.fitch ? `<span class="credit-rating fitch"><span class="credit-rating-grade">${ratings.fitch.grade}</span></span>` : ''}
          </div>
        </div>
        ` : ''}
        
        <div class="cardSection">
          <div class="cardStat">
            <span>Supply Chain</span>
          </div>
          <div class="supplyChainStats">
            <span><b style="color:#4caf50">${supplierCount}</b> suppliers</span>
            <span><b style="color:#4caf50">${serviceCount}</b> services</span>
            <span><b style="color:#4caf50">${channelCount}</b> channels</span>
            <span><b style="color:#4caf50">${demandCount}</b> demand</span>
          </div>
        </div>
        
        <button class="viewProfile">View Profile →</button>
      </div>
    `;
  }).join('');
}

function getInitials(name) {
  if (!name) return '??';
  const words = name.split(' ');
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function formatMarketCap(trillions) {
  if (!trillions) return '0.00T';
  if (trillions >= 1) return `${trillions.toFixed(2)}T`;
  if (trillions >= 0.001) return `${(trillions * 1000).toFixed(0)}B`;
  return `${(trillions * 1000000).toFixed(0)}M`;
}

function openCompanyProfile(symbol) {
  // Scroll to visualization
  document.getElementById('canvas').scrollIntoView({ behavior: 'smooth' });
  // Open company card
  setTimeout(() => {
    showCompanyCard(symbol);
  }, 500);
}

// Call after data loads
renderTop10Cards();
```

**Step 2: Test card rendering**

Open browser and verify:
- All 10 cards render correctly
- Logos load (or fallback to initials)
- Market caps format correctly
- Credit ratings show (if available)
- Supply chain stats display
- "View Profile" button opens company

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add JavaScript rendering for Top 10 company cards with full details"
```

---

## Task 9: Create Test File for Auto-Update

**Files:**
- Create: `tests/auto-update-script.test.mjs`

**Step 1: Create test file**

Create `tests/auto-update-script.test.mjs`:

```javascript
import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const DATA_DIR = join(ROOT_DIR, 'data');

describe('Auto-Update System', () => {
  let data;
  
  before(() => {
    const dataPath = join(DATA_DIR, 'top100-map-updated.json');
    const content = readFileSync(dataPath, 'utf-8');
    data = JSON.parse(content);
  });
  
  it('data file has auto-update metadata', () => {
    assert.ok(data.last_auto_update, 'Missing last_auto_update field');
    assert.ok(data.update_source, 'Missing update_source field');
    assert.ok(data.snapshot_date, 'Missing snapshot_date field');
  });
  
  it('last_auto_update is valid ISO date', () => {
    const date = new Date(data.last_auto_update);
    assert.ok(!isNaN(date.getTime()), 'last_auto_update is not a valid date');
  });
  
  it('update_source is companiesmarketcap.com', () => {
    assert.strictEqual(data.update_source, 'companiesmarketcap.com');
  });
  
  it('has 100 companies', () => {
    assert.strictEqual(data.companies.length, 100, 'Should have exactly 100 companies');
  });
  
  it('all companies have required fields', () => {
    data.companies.forEach((company, index) => {
      assert.ok(company.symbol, `Company ${index} missing symbol`);
      assert.ok(company.name, `Company ${index} missing name`);
      assert.ok(company.rank, `Company ${index} missing rank`);
      assert.ok(typeof company.marketCap === 'number', `Company ${index} marketCap not a number`);
    });
  });
  
  it('companies are sorted by rank', () => {
    for (let i = 1; i < data.companies.length; i++) {
      assert.ok(
        data.companies[i].rank >= data.companies[i - 1].rank,
        `Companies not sorted by rank at index ${i}`
      );
    }
  });
  
  it('market caps are positive numbers', () => {
    data.companies.forEach((company, index) => {
      assert.ok(
        company.marketCap > 0,
        `Company ${index} (${company.symbol}) has invalid market cap: ${company.marketCap}`
      );
    });
  });
  
  it('ranks are between 1 and 100', () => {
    data.companies.forEach((company, index) => {
      assert.ok(
        company.rank >= 1 && company.rank <= 100,
        `Company ${index} (${company.symbol}) has invalid rank: ${company.rank}`
      );
    });
  });
});
```

**Step 2: Run tests**

```bash
node --test tests/auto-update-script.test.mjs
```

Expected: 8/8 tests passing

**Step 3: Commit**

```bash
git add tests/auto-update-script.test.mjs
git commit -m "test: add test suite for auto-update data validation"
```

---

## Task 10: Final Testing and Documentation

**Files:**
- All modified files
- Create: `docs/AUTO_UPDATE_GUIDE.md`

**Step 1: Run full test suite**

```bash
node --test tests/*.test.mjs
```

Expected: All tests passing (116+ total)

**Step 2: Browser verification checklist**

Open `index.html` and verify:

**Branding:**
- [ ] Logo displays at 32x32px in top-left
- [ ] Company name uses Inter font
- [ ] Tagline "Market Intelligence" visible
- [ ] Hover effect brightens header
- [ ] Page title shows in browser tab

**Update Status:**
- [ ] Footer shows update status dot
- [ ] Dot color matches data age (green/yellow/red)
- [ ] Status text shows "Updated"/"Aging"/"Outdated"
- [ ] Last updated date displays correctly

**Top 10 Cards:**
- [ ] All 10 cards render above visualization
- [ ] Grid layout: 5 columns on desktop
- [ ] Logos load for all companies
- [ ] Market caps format correctly ($X.XXT)
- [ ] Credit ratings display (or hidden if N/A)
- [ ] Supply chain stats show counts
- [ ] "View Profile" buttons work
- [ ] "See Full Top 100" button visible
- [ ] Cards responsive on mobile (2 columns)
- [ ] Hover effects work (lift + shadow)

**Step 3: Create documentation**

Create `docs/AUTO_UPDATE_GUIDE.md`:

```markdown
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
```

**Step 4: Final commit**

```bash
git add docs/AUTO_UPDATE_GUIDE.md
git commit -m "docs: add auto-update system user guide"
```

---

## Post-Implementation

### Verification Commands

```bash
# Run all tests
node --test tests/*.test.mjs

# Check git log
git log --oneline -10

# Verify file structure
ls -la assets/ .github/workflows/ scripts/ data/backups/
```

### Expected Results

- **Branding**: Professional Monarch Castle Technologies header
- **Auto-Update**: Workflow scheduled, script tested
- **Top 10 Cards**: 10 detailed cards above visualization
- **Tests**: 116+ tests passing
- **Documentation**: Complete user guide

### Git Commit History (Expected)

```
docs: add auto-update system user guide
test: add test suite for auto-update data validation
feat: add JavaScript rendering for Top 10 company cards with full details
feat: add professional CSS styling for Top 10 company cards
feat: add Top 10 cards container HTML structure
feat: add update status indicator with color-coded freshness dot
feat: add GitHub Actions workflow for weekly auto-update
feat: create auto-update script for weekly market cap data refresh
feat: add Monarch Castle Technologies professional branding to header
feat: add Monarch Castle Technologies logo asset
```

---

## Summary

| Task | Feature | Files Changed | Tests |
|------|---------|---------------|-------|
| 1 | Logo asset | assets/monarch-logo.png | Manual |
| 2 | Header branding | index.html | Manual |
| 3 | Auto-update script | scripts/update-marketcap-data.mjs | Unit |
| 4 | GitHub workflow | .github/workflows/auto-update-data.yml | Integration |
| 5 | Update status | index.html | Manual |
| 6 | Cards HTML | index.html | Manual |
| 7 | Cards CSS | index.html | Manual |
| 8 | Cards JS | index.html | Manual |
| 9 | Auto-update tests | tests/auto-update-script.test.mjs | 8 tests |
| 10 | Documentation | docs/AUTO_UPDATE_GUIDE.md | Manual |

**Total Estimated Time:** 60-90 minutes
**Files Created:** 5
**Files Modified:** 1 (index.html, multiple commits)
**Tests Added:** 8
