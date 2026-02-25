# Supply Chain Website - Complete Implementation Plan

## Current State
- ✅ 103/103 tests passing
- ✅ 15/15 initial improvements complete
- ✅ All source verification complete (100 companies)

---

## Quick Wins Implementation (4 hours)

### Q1. Last Updated Timestamp

**File:** `index.html`

**Add to DATA object in generator:**
```javascript
// In generate-top100-data.mjs, add to output:
const OUTPUT = {
  snapshot_date: new Date().toISOString().split('T')[0],
  last_updated: new Date().toLocaleString(),
  nodes: ...,
  links: ...,
  profiles: ...
};
```

**Add to index.html footer:**
```html
<div id="footer" style="position:fixed;bottom:8px;left:12px;font-size:8px;color:#444">
  Data updated: <span id="lastUpdated">--</span>
</div>
```

```javascript
// In render():
document.getElementById('lastUpdated').textContent = DATA.last_updated || DATA.snapshot_date;
```

---

### Q2. Source Count in Tooltips

**File:** `index.html`

**Modify showTooltip function:**
```javascript
function showTooltip(d, ev) {
  tt.style.display = "block";
  tt.querySelector(".tn").textContent = d.l.replace("\n", " - ");
  tt.querySelector(".tf").textContent = `${d.c} ${asCountryName(d.c)} / ${STATE.layerMap[d.layer] || `Layer ${d.layer}`}`;
  tt.querySelector(".td").textContent = d.d || "";
  tt.querySelector(".ts").textContent = d.s || "";
  
  // Count sources for this node
  const sourceCount = d.sourceId ? 1 : 0;
  const sourceEl = tt.querySelector(".ts");
  if (sourceCount > 0) {
    sourceEl.textContent = `${d.s || ''} | ${sourceCount} source(s)`;
  }
  
  const verifiedEl = tt.querySelector(".tv");
  if (d.confidence && d.confidence.includes("source-backed")) {
    verifiedEl.style.display = "flex";
    verifiedEl.textContent = "Source-verified entity";
  } else {
    verifiedEl.style.display = "none";
  }
  
  tt.querySelector(".tc").textContent = d.confidence ? `Confidence: ${d.confidence}` : "";
  if (d.sourceId && STATE.sourceIndex[d.sourceId]) {
    tt.querySelector(".tu").textContent = `Source: ${STATE.sourceIndex[d.sourceId].url}`;
  } else {
    tt.querySelector(".tu").textContent = "";
  }
  moveTooltip(ev);
}
```

---

### Q3. Copy-to-Clipboard for Symbols

**File:** `index.html`

**Add click handler to company card symbol:**
```javascript
// Add to updateCompanyCard function:
cardSymbol.style.cursor = 'pointer';
cardSymbol.title = 'Click to copy symbol';
cardSymbol.onclick = () => {
  navigator.clipboard.writeText(cardSymbol.textContent);
  showToast(`Copied ${cardSymbol.textContent}`);
};

// Add toast notification function:
function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--acc);
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 11px;
    z-index: 2000;
    animation: fadeOut 2s forwards;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// Add CSS animation:
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    0% { opacity: 1; }
    80% { opacity: 1; }
    100% { opacity: 0; }
  }
`;
document.head.appendChild(style);
```

---

### Q4. Total Market Cap in Stats

**File:** `index.html`

**Add to stats bar:**
```html
<div class="st">
  <span><b id="sN">0</b>nodes</span>
  <span><b id="sL">0</b>links</span>
  <span><b id="sC">0</b>countries</span>
  <span><b id="sY">0</b>layers</span>
  <span><b id="sM">$0T</b>market cap</span> <!-- NEW -->
</div>
```

**Update updateStats function:**
```javascript
function updateStats() {
  document.getElementById("sN").textContent = STATE.nodes.length;
  document.getElementById("sL").textContent = STATE.links.length;
  document.getElementById("sC").textContent = new Set(STATE.nodes.map((n) => n.c)).size;
  document.getElementById("sY").textContent = Object.keys(STATE.layerMap).length;
  
  // Calculate total market cap
  const totalCap = STATE.nodes
    .filter(n => n.marketcap)
    .reduce((sum, n) => sum + n.marketcap, 0);
  document.getElementById("sM").textContent = `$${(totalCap / 1e12).toFixed(2)}T`;
}
```

---

### Q5. Favicon

**File:** `favicon.svg` (create new):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="45" fill="#0a0a0a" stroke="#e8453c" stroke-width="3"/>
  <circle cx="30" cy="35" r="8" fill="#e8453c"/>
  <circle cx="70" cy="35" r="8" fill="#4488cc"/>
  <circle cx="50" cy="70" r="8" fill="#4caf50"/>
  <line x1="30" y1="35" x2="50" y2="70" stroke="#333" stroke-width="2"/>
  <line x1="70" y1="35" x2="50" y2="70" stroke="#333" stroke-width="2"/>
</svg>
```

**Add to index.html `<head>`:**
```html
<link rel="icon" type="image/svg+xml" href="favicon.svg">
```

---

### Q6. Node Count by Type in Legend

**File:** `index.html`

**Modify buildLegend function:**
```javascript
function buildLegend() {
  legendEl.innerHTML = "";
  const used = [...new Set(STATE.nodes.map((n) => n.c))];
  
  // Add node type counts
  const typeCounts = {
    company: STATE.nodes.filter(n => n.kind === 'company').length,
    supplier: STATE.nodes.filter(n => n.kind === 'supplier').length,
    service: STATE.nodes.filter(n => n.kind === 'service').length,
    channel: STATE.nodes.filter(n => n.kind === 'channel').length,
    demand: STATE.nodes.filter(n => n.kind === 'demand').length
  };
  
  // Type counts section
  const typeHeader = document.createElement('div');
  typeHeader.style.cssText = 'font-size:8px;color:#666;text-transform:uppercase;margin-bottom:4px';
  typeHeader.textContent = 'Node Types';
  legendEl.appendChild(typeHeader);
  
  Object.entries(typeCounts).forEach(([type, count]) => {
    if (count > 0) {
      const li = document.createElement("div");
      li.className = "li";
      li.style.color = '#888';
      li.innerHTML = `<span style="color:#666">${type}:</span> <b style="color:#aaa">${count}</b>`;
      legendEl.appendChild(li);
    }
  });
  
  // Country section
  const countryHeader = document.createElement('div');
  countryHeader.style.cssText = 'font-size:8px;color:#666;text-transform:uppercase;margin:8px 0 4px';
  countryHeader.textContent = 'Countries';
  legendEl.appendChild(countryHeader);
  
  used.forEach((code) => {
    const li = document.createElement("div");
    li.className = "li";
    const color = DATA.countries[code]?.c || "#777";
    li.innerHTML = `<span class="ld" style="background:${color}"></span>${code} ${asCountryName(code)}`;
    legendEl.appendChild(li);
  });
}
```

---

### Q7. Print Stylesheet

**File:** `index.html`

**Add to `<style>` section:**
```css
@media print {
  #top, #bar, #q, #companyCard, #hint, #lg, #ly, #filterPanel, #loading, #helpModal, #compareModal {
    display: none !important;
  }
  
  #canvas {
    position: static;
    width: 100%;
    height: 600px;
  }
  
  body {
    background: white;
    color: black;
    overflow: visible;
  }
  
  .node-label {
    fill: black !important;
  }
}
```

**Add print button to toolbar:**
```html
<button id="bPrint" title="Print view">Print</button>
```

```javascript
document.getElementById("bPrint").onclick = () => window.print();
```

---

### Q8. 404 Handler for Unknown Companies

**File:** `index.html`

**Add to openProfile function:**
```javascript
function openProfile(symbol) {
  if (!DATA.profiles[symbol]) {
    showToast(`Company ${symbol} not found`);
    return;
  }
  STATE.mode = "profile";
  STATE.symbol = symbol;
  STATE.hoverSymbol = null;
  document.getElementById("bBack").style.display = "inline-block";
  jump.value = symbol;
  render();
}
```

**Add to jump select handler:**
```javascript
jump.addEventListener("change", () => {
  if (jump.value && DATA.profiles[jump.value]) {
    openProfile(jump.value);
  } else if (jump.value) {
    showToast(`Profile not available for ${jump.value}`);
    jump.value = "";
  }
});
```

---

## Phase 2: High Priority Features (13 hours)

### B1. Saved Views/Bookmarks (3 hours)

**File:** `index.html`

**Add to STATE:**
```javascript
const STATE = {
  // ... existing
  savedViews: JSON.parse(localStorage.getItem('savedViews') || '[]'),
};
```

**Add save/load functions:**
```javascript
function saveView(name) {
  const state = {
    mode: STATE.mode,
    symbol: STATE.symbol,
    filters: STATE.filters,
    zoom: d3.zoomTransform(svg.node()).k,
    x: d3.zoomTransform(svg.node()).x,
    y: d3.zoomTransform(svg.node()).y,
    timestamp: Date.now()
  };
  
  const existing = STATE.savedViews.findIndex(v => v.name === name);
  const view = { name, state, date: new Date().toLocaleDateString() };
  
  if (existing >= 0) {
    STATE.savedViews[existing] = view;
  } else {
    STATE.savedViews.push(view);
  }
  
  localStorage.setItem('savedViews', JSON.stringify(STATE.savedViews));
  renderBookmarksPanel();
  showToast(`View "${name}" saved`);
}

function loadView(name) {
  const view = STATE.savedViews.find(v => v.name === name);
  if (!view) return;
  
  STATE.mode = view.state.mode;
  STATE.symbol = view.state.symbol;
  STATE.filters = view.state.filters;
  
  if (STATE.mode === 'profile' && !DATA.profiles[STATE.symbol]) {
    showToast('Profile no longer available');
    return;
  }
  
  render();
  
  // Restore zoom
  svg.transition().duration(750).call(
    zoom.transform,
    d3.zoomIdentity.translate(view.state.x, view.state.y).scale(view.state.zoom)
  );
  
  showToast(`Loaded "${name}"`);
}

function deleteView(name) {
  STATE.savedViews = STATE.savedViews.filter(v => v.name !== name);
  localStorage.setItem('savedViews', JSON.stringify(STATE.savedViews));
  renderBookmarksPanel();
  showToast(`Deleted "${name}"`);
}

function renderBookmarksPanel() {
  let panel = document.getElementById('bookmarksPanel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'bookmarksPanel';
    panel.style.cssText = `
      position: fixed;
      top: 92px;
      right: 12px;
      z-index: 95;
      background: rgba(10,10,10,.95);
      border: 1px solid #252525;
      padding: 10px;
      display: none;
      max-width: 280px;
      max-height: 400px;
      overflow-y: auto;
    `;
    document.body.appendChild(panel);
  }
  
  if (STATE.savedViews.length === 0) {
    panel.innerHTML = '<div style="font-size:9px;color:#666">No saved views</div>';
    return;
  }
  
  panel.innerHTML = `
    <h3 style="font-size:9px;color:var(--dim);text-transform:uppercase;margin-bottom:8px">Saved Views</h3>
    ${STATE.savedViews.map(v => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #1a1a1a">
        <div style="cursor:pointer;font-size:9px;color:#aaa" onclick="loadView('${v.name}')">
          <b style="color:#fff">${v.name}</b>
          <div style="color:#666;font-size:8px">${v.date} • ${v.state.mode === 'profile' ? v.state.symbol : 'Global'}</div>
        </div>
        <button style="background:none;border:none;color:#666;cursor:pointer;font-size:14px" onclick="deleteView('${v.name}')">&times;</button>
      </div>
    `).join('')}
  `;
}

function toggleBookmarks() {
  const panel = document.getElementById('bookmarksPanel');
  if (!panel) return;
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
  renderBookmarksPanel();
}

// Quick save dialog
function promptSaveView() {
  const name = prompt('Enter view name:');
  if (name) saveView(name);
}
```

**Add to toolbar:**
```html
<button id="bSave" title="Save view">Save</button>
<button id="bBookmarks" title="Bookmarks">★</button>
```

```javascript
document.getElementById("bSave").onclick = () => promptSaveView();
document.getElementById("bBookmarks").onclick = () => toggleBookmarks();
```

**Add keyboard shortcut:**
```javascript
case 's': if (e.ctrlKey || e.metaKey) { e.preventDefault(); promptSaveView(); } break;
```

---

### A2. Shared Supplier Discovery (6 hours)

**File:** `index.html`

**Build supplier index on load:**
```javascript
// After DATA is loaded:
const SUPPLIER_INDEX = new Map();
const SYMBOL_INDEX = new Map();

DATA.nodes.forEach(n => {
  SYMBOL_INDEX.set(n.symbol, n);
});

Object.entries(DATA.profiles).forEach(([symbol, profile]) => {
  profile.nodes.filter(n => n.kind === 'supplier').forEach(supplier => {
    const key = supplier.d.toLowerCase();
    if (!SUPPLIER_INDEX.has(key)) SUPPLIER_INDEX.set(key, []);
    SUPPLIER_INDEX.get(key).push(symbol);
  });
});

function findSharedSuppliers(symbol) {
  const profile = DATA.profiles[symbol];
  if (!profile) return [];
  
  const mySuppliers = profile.nodes
    .filter(n => n.kind === 'supplier')
    .map(n => ({ name: n.d, sharedWith: SUPPLIER_INDEX.get(n.d.toLowerCase())?.filter(s => s !== symbol) || [] }))
    .filter(s => s.sharedWith.length > 0);
  
  return mySuppliers;
}

function getSystemicRiskNodes() {
  const results = [];
  SUPPLIER_INDEX.forEach((companies, supplier) => {
    if (companies.length >= 3) {
      results.push({
        supplier,
        companies,
        risk: companies.length >= 5 ? 'high' : companies.length >= 3 ? 'medium' : 'low'
      });
    }
  });
  return results.sort((a, b) => b.companies.length - a.companies.length);
}
```

**Add Shared Risk modal:**
```html
<div id="sharedRiskModal" style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:1000;background:rgba(0,0,0,.9);display:none;overflow-y:auto">
  <div class="content" style="padding:24px;max-width:1000px;margin:0 auto">
    <div class="header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
      <h2 style="font-family:'Bricolage Grotesque';font-size:20px;font-weight:700;color:#fff">Shared Supplier Risk</h2>
      <button class="close" onclick="closeSharedRisk()" style="background:none;border:none;color:#666;font-size:24px;cursor:pointer">&times;</button>
    </div>
    
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
      <div>
        <h3 style="font-size:12px;color:var(--acc);margin-bottom:12px;text-transform:uppercase">Critical Shared Suppliers</h3>
        <div id="criticalSuppliers" style="background:#111;border:1px solid #222;border-radius:4px;padding:12px;max-height:400px;overflow-y:auto"></div>
      </div>
      <div>
        <h3 style="font-size:12px;color:var(--acc);margin-bottom:12px;text-transform:uppercase">Your Selection</h3>
        <div id="selectedCompanyRisk" style="background:#111;border:1px solid #222;border-radius:4px;padding:12px;max-height:400px;overflow-y:auto"></div>
      </div>
    </div>
  </div>
</div>
```

**Add functions:**
```javascript
function showSharedRisk(symbol) {
  const modal = document.getElementById('sharedRiskModal');
  
  // Critical suppliers
  const critical = getSystemicRiskNodes().slice(0, 20);
  document.getElementById('criticalSuppliers').innerHTML = critical.map(s => `
    <div style="padding:8px 0;border-bottom:1px solid #1a1a1a">
      <div style="font-size:10px;color:#fff;margin-bottom:4px">${s.supplier}</div>
      <div style="font-size:9px;color:#666">Shared by: ${s.companies.join(', ')}</div>
      <div style="font-size:8px;color:${s.risk === 'high' ? '#e8453c' : s.risk === 'medium' ? '#f0ad4e' : '#4caf50'};margin-top:4px">
        Risk: ${s.risk.toUpperCase()} (${s.companies.length} companies)
      </div>
    </div>
  `).join('');
  
  // Selected company
  if (symbol && DATA.profiles[symbol]) {
    const shared = findSharedSuppliers(symbol);
    document.getElementById('selectedCompanyRisk').innerHTML = shared.length > 0 ? shared.map(s => `
      <div style="padding:8px 0;border-bottom:1px solid #1a1a1a">
        <div style="font-size:10px;color:#fff;margin-bottom:4px">${s.name}</div>
        <div style="font-size:9px;color:#666">Also used by: ${s.sharedWith.join(', ')}</div>
      </div>
    `).join('') : '<div style="color:#666;font-size:9px">No shared suppliers found</div>';
  }
  
  modal.style.display = 'block';
}

function closeSharedRisk() {
  document.getElementById('sharedRiskModal').style.display = 'none';
}

// Add button to toolbar
// <button id="bSharedRisk" title="Shared supplier risk">⚠</button>
document.getElementById("bSharedRisk").onclick = () => showSharedRisk(STATE.mode === 'profile' ? STATE.symbol : null);
```

---

### C1. Source Confidence Scoring (4 hours)

**File:** `generate-top100-data.mjs`

**Add source weights:**
```javascript
const SOURCE_WEIGHTS = {
  '10-k': 1.0,
  '20-f': 1.0,
  'annual': 0.9,
  'press': 0.7,
  'news': 0.5,
  'inferred': 0.3
};

function getSourceWeight(sourceId) {
  if (!sourceId) return 0.3;
  const id = sourceId.toLowerCase();
  if (id.includes('10-k') || id.includes('sec')) return 1.0;
  if (id.includes('20-f')) return 1.0;
  if (id.includes('annual')) return 0.9;
  if (id.includes('press')) return 0.7;
  if (id.includes('news')) return 0.5;
  return 0.3;
}

function calculateConfidenceScore(sourceId, dateStr) {
  const baseWeight = getSourceWeight(sourceId);
  
  // Age decay (10% per year)
  let ageFactor = 1.0;
  if (dateStr) {
    const sourceDate = new Date(dateStr);
    const yearsOld = (Date.now() - sourceDate) / (365.25 * 24 * 60 * 60 * 1000);
    ageFactor = Math.max(0.3, 1.0 - (yearsOld * 0.1));
  }
  
  return Math.round(baseWeight * ageFactor * 100);
}
```

**Update profile generation to include scores:**
```javascript
// In buildSourceBackedProfile, add to nodes:
nodes.push({
  id,
  l: `${name}\n...`,
  // ... existing fields
  confidenceScore: calculateConfidenceScore(itemSource, new Date().toISOString()),
  sourceDate: new Date().toISOString()
});
```

**File:** `index.html`

**Update tooltip to show score:**
```javascript
function showTooltip(d, ev) {
  // ... existing code
  
  const scoreEl = tt.querySelector(".tc");
  if (d.confidenceScore) {
    const scoreColor = d.confidenceScore >= 80 ? '#4caf50' : d.confidenceScore >= 50 ? '#f0ad4e' : '#e8453c';
    scoreEl.innerHTML = `Confidence: <b style="color:${scoreColor}">${d.confidenceScore}%</b> (${d.confidence || 'inferred'})`;
  } else {
    scoreEl.textContent = d.confidence ? `Confidence: ${d.confidence}` : "";
  }
  
  // ... rest of function
}
```

---

---

## Phase 3: Data & Analytics (28 hours)

### A1. Supply Chain Risk Scoring (4 hours)

**File:** `generate-top100-data.mjs`

**Add risk calculation function:**
```javascript
function calculateRiskScore(profile) {
  const suppliers = profile.nodes.filter(n => n.kind === 'supplier');
  const services = profile.nodes.filter(n => n.kind === 'service');
  const channels = profile.nodes.filter(n => n.kind === 'channel');
  
  // Concentration risk
  const supplierCount = suppliers.length;
  const concentrationRisk = supplierCount < 3 ? 'high' : supplierCount < 5 ? 'medium' : 'low';
  
  // Geographic risk
  const countryCount = new Set(suppliers.map(s => s.c)).size;
  const countries = {};
  suppliers.forEach(s => { countries[s.c] = (countries[s.c] || 0) + 1; });
  const maxCountryPct = supplierCount > 0 ? Math.max(...Object.values(countries)) / supplierCount : 0;
  const geographicRisk = maxCountryPct > 0.5 ? 'high' : maxCountryPct > 0.3 ? 'medium' : 'low';
  
  // Single source risk
  const singleSourceCount = suppliers.filter(s => !s.sourceId).length;
  const singleSourceRisk = singleSourceCount > 0 ? 'medium' : 'low';
  
  // Overall score (0-100)
  const score = Math.round(
    (concentrationRisk === 'low' ? 40 : concentrationRisk === 'medium' ? 25 : 10) +
    (geographicRisk === 'low' ? 30 : geographicRisk === 'medium' ? 20 : 10) +
    (singleSourceRisk === 'low' ? 30 : 15)
  );
  
  return {
    concentrationRisk,
    geographicRisk,
    singleSourceRisk,
    overallScore: score,
    supplierCount,
    countryCount,
    maxCountryPct: Math.round(maxCountryPct * 100)
  };
}

// Add to profile output
profiles[symbol] = {
  ...profile,
  riskScore: calculateRiskScore(profile)
};
```

**File:** `index.html`

**Add risk badge to company card:**
```javascript
function updateCompanyCard() {
  // ... existing code
  
  const profile = DATA.profiles[symbol];
  if (profile && profile.riskScore) {
    const riskColor = profile.riskScore.overallScore >= 70 ? '#4caf50' : profile.riskScore.overallScore >= 40 ? '#f0ad4e' : '#e8453c';
    const riskLabel = profile.riskScore.overallScore >= 70 ? 'LOW' : profile.riskScore.overallScore >= 40 ? 'MEDIUM' : 'HIGH';
    
    const riskBadge = document.createElement('div');
    riskBadge.style.cssText = `
      margin-top: 8px;
      padding: 4px 8px;
      background: ${riskColor}22;
      border: 1px solid ${riskColor};
      border-radius: 3px;
      font-size: 8px;
      color: ${riskColor};
      text-transform: uppercase;
      text-align: center;
    `;
    riskBadge.innerHTML = `Risk Score: <b>${profile.riskScore.overallScore}</b>/100 (${riskLabel})`;
    companyCard.appendChild(riskBadge);
  }
}
```

---

### A3. Timeline/History View (8 hours)

**File:** `generate-top100-data.mjs`

**Add history tracking:**
```javascript
// At top of file
const HISTORY_DIR = 'data/history/';
const fs = require('fs');
const path = require('path');

// Ensure history directory exists
if (!fs.existsSync(HISTORY_DIR)) {
  fs.mkdirSync(HISTORY_DIR, { recursive: true });
}

// Save snapshot
const snapshot = {
  date: new Date().toISOString().split('T')[0],
  nodes: OUTPUT.nodes,
  links: OUTPUT.links,
  profiles: OUTPUT.profiles
};

fs.writeFileSync(
  path.join(HISTORY_DIR, `${snapshot.date}.json`),
  JSON.stringify(snapshot, null, 2)
);

// Load historical data for comparison
function loadHistory(date) {
  const filePath = path.join(HISTORY_DIR, `${date}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return null;
}
```

**File:** `index.html`

**Add timeline slider:**
```html
<div id="timelinePanel" style="position:fixed;bottom:40px;left:12px;right:12px;z-index:90;display:none">
  <div style="background:rgba(10,10,10,.95);border:1px solid #252525;padding:12px;border-radius:4px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <span style="font-size:9px;color:#666;text-transform:uppercase">Timeline View</span>
      <span id="timelineDate" style="font-size:10px;color:#fff;font-weight:600">--</span>
    </div>
    <input type="range" id="timelineSlider" min="0" max="100" value="100" style="width:100%">
    <div style="display:flex;justify-content:space-between;margin-top:4px">
      <span style="font-size:7px;color:#444">Oldest</span>
      <span style="font-size:7px;color:#444">Current</span>
    </div>
  </div>
</div>
```

```javascript
// Load available snapshots
const AVAILABLE_SNAPSHOTS = []; // Will be populated from data

function initTimeline() {
  const slider = document.getElementById('timelineSlider');
  const dateLabel = document.getElementById('timelineDate');
  
  slider.addEventListener('input', (e) => {
    const index = Math.floor((e.target.value / 100) * AVAILABLE_SNAPSHOTS.length);
    const snapshot = AVAILABLE_SNAPSHOTS[Math.min(index, AVAILABLE_SNAPSHOTS.length - 1)];
    dateLabel.textContent = snapshot.date;
    // Load and display snapshot
    loadSnapshot(snapshot.date);
  });
}

function toggleTimeline() {
  const panel = document.getElementById('timelinePanel');
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
  if (panel.style.display === 'block') initTimeline();
}

// Add button to toolbar
// <button id="bTimeline" title="Timeline view">📅</button>
document.getElementById("bTimeline").onclick = () => toggleTimeline();
```

---

### A4. Supply Chain Depth Analysis (6 hours)

**File:** `generate-top100-data.mjs`

**Add tier calculation:**
```javascript
function calculateSupplierTiers(profile, allProfiles) {
  const suppliers = profile.nodes.filter(n => n.kind === 'supplier');
  
  suppliers.forEach(supplier => {
    // Check if this supplier is also a company in our dataset
    const supplierCompany = Object.values(allProfiles).find(p => 
      p.company.toLowerCase().includes(supplier.d.toLowerCase()) ||
      supplier.d.toLowerCase().includes(p.company.toLowerCase())
    );
    
    if (supplierCompany) {
      // This is a tier-1 supplier that's also tracked
      supplier.tier = 1;
      supplier.hasSubSuppliers = true;
      
      // Get their suppliers (our tier-2)
      const subSuppliers = supplierCompany.nodes.filter(n => n.kind === 'supplier');
      supplier.subSupplierCount = subSuppliers.length;
    } else {
      supplier.tier = 'unknown';
      supplier.hasSubSuppliers = false;
      supplier.subSupplierCount = 0;
    }
  });
  
  return profile;
}
```

**File:** `index.html`

**Add tier filter:**
```html
<!-- Add to filter panel -->
<div class="fg">
  <label>Tier Depth</label>
  <select id="fTier">
    <option value="all">All Tiers</option>
    <option value="1">Tier 1 Only</option>
    <option value="2">Tier 1 + Tier 2</option>
  </select>
</div>
```

```javascript
// Add tier badge to supplier nodes
nodeSel.append("text")
  .text((d) => d.tier === 1 ? 'T1' : d.tier === 2 ? 'T2' : '')
  .attr("dy", (d) => (d.z || 10) - 2)
  .attr("text-anchor", "end")
  .attr("font-size", "6px")
  .attr("fill", "#666")
  .attr("font-family", "'JetBrains Mono',monospace");
```

---

### A5. Industry Benchmarking (4 hours)

**File:** `generate-top100-data.mjs`

**Add industry classification and benchmarks:**
```javascript
const INDUSTRY_BENCHMARKS = {
  semiconductor: { suppliers: 12, services: 8, channels: 6, demand: 4 },
  pharma: { suppliers: 15, services: 10, channels: 8, demand: 5 },
  banking: { suppliers: 8, services: 12, channels: 10, demand: 6 },
  tech: { suppliers: 10, services: 9, channels: 7, demand: 5 },
  energy: { suppliers: 14, services: 11, channels: 5, demand: 3 },
  consumer: { suppliers: 11, services: 7, channels: 9, demand: 6 },
  industrial: { suppliers: 13, services: 9, channels: 6, demand: 4 },
  telecom: { suppliers: 9, services: 8, channels: 7, demand: 5 },
  materials: { suppliers: 10, services: 8, channels: 5, demand: 4 },
  default: { suppliers: 10, services: 8, channels: 7, demand: 5 }
};

const INDUSTRY_BY_SYMBOL = {
  // Semiconductor
  NVDA: 'semiconductor', AMD: 'semiconductor', INTC: 'semiconductor',
  TSM: 'semiconductor', ASML: 'semiconductor', AVGO: 'semiconductor',
  MU: 'semiconductor', AMAT: 'semiconductor', LRCX: 'semiconductor', KLAC: 'semiconductor',
  // Pharma
  LLY: 'pharma', JNJ: 'pharma', ABBV: 'pharma', MRK: 'pharma',
  AZN: 'pharma', NVS: 'pharma', AMGN: 'pharma', NVO: 'pharma', GILD: 'pharma',
  // Banking
  JPM: 'banking', V: 'banking', MA: 'banking', BAC: 'banking',
  C: 'banking', GS: 'banking', MS: 'banking', WFC: 'banking', HSBC: 'banking',
  // Tech
  AAPL: 'tech', MSFT: 'tech', GOOG: 'tech', META: 'tech',
  ORCL: 'tech', IBM: 'tech', SAP: 'tech', PLTR: 'tech', CSCO: 'tech',
  // Energy
  XOM: 'energy', CVX: 'energy', SHEL: 'energy', '2222.SR': 'energy',
  // Consumer
  AMZN: 'consumer', WMT: 'consumer', COST: 'consumer', HD: 'consumer',
  PG: 'consumer', KO: 'consumer', PEP: 'consumer', MCD: 'consumer',
  // Industrial
  GE: 'industrial', CAT: 'industrial', RTX: 'industrial', HON: 'industrial',
  // Telecom
  T: 'telecom', VZ: 'telecom', TMUS: 'telecom', '0941.HK': 'telecom',
  // Materials
  BHP: 'materials', RIO: 'materials', LIN: 'materials',
  // Default
};

function getIndustry(symbol) {
  return INDUSTRY_BY_SYMBOL[symbol] || 'default';
}

function getBenchmark(symbol) {
  const industry = getIndustry(symbol);
  return INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS.default;
}

function calculateBenchmarkComparison(profile) {
  const benchmark = getBenchmark(profile.symbol);
  const actual = {
    suppliers: profile.nodes.filter(n => n.kind === 'supplier').length,
    services: profile.nodes.filter(n => n.kind === 'service').length,
    channels: profile.nodes.filter(n => n.kind === 'channel').length,
    demand: profile.nodes.filter(n => n.kind === 'demand').length
  };
  
  return {
    suppliers: { actual: actual.suppliers, benchmark: benchmark.suppliers, pct: Math.round((actual.suppliers / benchmark.suppliers) * 100) },
    services: { actual: actual.services, benchmark: benchmark.services, pct: Math.round((actual.services / benchmark.services) * 100) },
    channels: { actual: actual.channels, benchmark: benchmark.channels, pct: Math.round((actual.channels / benchmark.channels) * 100) },
    demand: { actual: actual.demand, benchmark: benchmark.demand, pct: Math.round((actual.demand / benchmark.demand) * 100) }
  };
}
```

**File:** `index.html`

**Add benchmark display to company card:**
```javascript
function updateCompanyCard() {
  // ... existing code
  
  const profile = DATA.profiles[symbol];
  if (profile && profile.benchmark) {
    const b = profile.benchmark;
    const benchmarkHtml = `
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid #212121">
        <div style="font-size:8px;color:#666;text-transform:uppercase;margin-bottom:4px">vs Industry</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:8px">
          <div style="color:#888">Suppliers: <b style="color:${b.suppliers.pct >= 100 ? '#4caf50' : '#f0ad4e'}">${b.suppliers.actual}</b> (${b.suppliers.pct}%)</div>
          <div style="color:#888">Services: <b style="color:${b.services.pct >= 100 ? '#4caf50' : '#f0ad4e'}">${b.services.actual}</b> (${b.services.pct}%)</div>
        </div>
      </div>
    `;
    companyCard.insertAdjacentHTML('beforeend', benchmarkHtml);
  }
}
```

---

## Phase 4: User Experience (15 hours)

### B2. Notifications/Alerts (4 hours)

**File:** `index.html`

```javascript
// Track watched companies
const WATCHED = JSON.parse(localStorage.getItem('watchedCompanies') || '[]');

function toggleWatch(symbol) {
  const index = WATCHED.indexOf(symbol);
  if (index >= 0) {
    WATCHED.splice(index, 1);
    showToast(`Unwatched ${symbol}`);
  } else {
    WATCHED.push(symbol);
    showToast(`Watching ${symbol}`);
  }
  localStorage.setItem('watchedCompanies', JSON.stringify(WATCHED));
  updateWatchButton();
}

function updateWatchButton() {
  const btn = document.getElementById('cardWatch');
  const symbol = STATE.mode === 'profile' ? STATE.symbol : STATE.hoverSymbol;
  if (!symbol) return;
  
  btn.textContent = WATCHED.includes(symbol) ? '★' : '☆';
  btn.style.color = WATCHED.includes(symbol) ? '#f0ad4e' : '#666';
}

function checkForUpdates() {
  const lastCheck = localStorage.getItem('lastUpdateCheck');
  const now = Date.now();
  
  if (!lastCheck || now - parseInt(lastCheck) > 24 * 60 * 60 * 1000) {
    // Check for updates (compare with server timestamp)
    localStorage.setItem('lastUpdateCheck', now.toString());
  }
}

// Add watch button to company card
// <button id="cardWatch" style="background:none;border:none;color:#666;font-size:16px;cursor:pointer">☆</button>
document.getElementById('cardWatch').onclick = () => toggleWatch(STATE.mode === 'profile' ? STATE.symbol : STATE.hoverSymbol);
```

---

### B3. Presentation Mode (5 hours)

**File:** `index.html`

```javascript
const PRESENTATION_STEPS = [
  { title: 'Global Overview', view: 'global', zoom: 0.5, note: 'Top 100 companies by market capitalization' },
  { title: 'Technology Sector', view: 'global', filter: n => ['NVDA', 'AAPL', 'MSFT', 'GOOG', 'META'].includes(n.symbol), zoom: 1, note: 'Major technology companies' },
  { title: 'Apple Profile', view: 'profile', symbol: 'AAPL', zoom: 1, note: 'Apple supply chain with verified suppliers' },
  { title: 'Apple Suppliers', view: 'profile', filter: n => n.kind === 'supplier', zoom: 1, note: 'Key upstream suppliers' },
  { title: 'Back to Global', view: 'global', zoom: 0.8, note: 'Return to global view' }
];

let currentSlide = 0;
let presentationMode = false;

function startPresentation() {
  presentationMode = true;
  currentSlide = 0;
  showSlide(0);
  
  const overlay = document.createElement('div');
  overlay.id = 'presentationOverlay';
  overlay.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,.9);
    border: 1px solid #333;
    padding: 16px 24px;
    border-radius: 6px;
    z-index: 500;
    text-align: center;
  `;
  overlay.innerHTML = `
    <div id="presentationNote" style="font-size:13px;color:#fff;margin-bottom:8px"></div>
    <div style="display:flex;gap:16px;align-items:center;justify-content:center">
      <button onclick="prevSlide()" style="background:#222;border:1px solid #444;color:#fff;padding:4px 12px;cursor:pointer;border-radius:3px">← Previous</button>
      <span id="presentationCounter" style="font-size:11px;color:#666">1 / ${PRESENTATION_STEPS.length}</span>
      <button onclick="nextSlide()" style="background:var(--acc);border:none;color:#fff;padding:4px 12px;cursor:pointer;border-radius:3px">Next →</button>
    </div>
  `;
  document.body.appendChild(overlay);
  showSlide(0);
}

function showSlide(index) {
  const step = PRESENTATION_STEPS[index];
  document.getElementById('presentationNote').textContent = step.note;
  document.getElementById('presentationCounter').textContent = `${index + 1} / ${PRESENTATION_STEPS.length}`;
  
  if (step.view === 'global' && STATE.mode !== 'global') {
    openGlobal();
  } else if (step.view === 'profile' && step.symbol) {
    openProfile(step.symbol);
  }
  
  setTimeout(() => {
    if (step.filter) {
      highlightBy(step.filter);
    } else {
      resetHighlight();
    }
    
    svg.transition().duration(1000).call(
      zoom.transform,
      d3.zoomIdentity.translate(0, 0).scale(step.zoom || 1)
    );
  }, 500);
}

function nextSlide() {
  if (currentSlide < PRESENTATION_STEPS.length - 1) {
    currentSlide++;
    showSlide(currentSlide);
  } else {
    endPresentation();
  }
}

function prevSlide() {
  if (currentSlide > 0) {
    currentSlide--;
    showSlide(currentSlide);
  }
}

function endPresentation() {
  presentationMode = false;
  document.getElementById('presentationOverlay')?.remove();
}

// Add button to toolbar
// <button id="bPresent" title="Presentation mode">▶</button>
document.getElementById("bPresent").onclick = () => startPresentation();
```

---

### B5. Command Palette (Cmd+K) (4 hours)

**File:** `index.html`

```html
<div id="commandPalette" style="position:fixed;top:100px;left:50%;transform:translateX(-50%);width:500px;max-height:400px;background:rgba(10,10,10,.98);border:1px solid #333;border-radius:6px;z-index:1000;display:none;overflow:hidden;box-shadow:0 4px 40px rgba(0,0,0,.6)">
  <div style="padding:12px;border-bottom:1px solid #222">
    <input id="commandInput" type="text" placeholder="Type a command or search..." style="width:100%;background:transparent;border:none;color:#fff;font-size:13px;outline:none;font-family:'JetBrains Mono',monospace">
  </div>
  <div id="commandResults" style="overflow-y:auto;max-height:350px"></div>
</div>
```

```javascript
const COMMANDS = [
  { key: 'Go to company', type: 'command', action: (q) => { const n = DATA.nodes.find(n => n.symbol.toLowerCase() === q.toLowerCase()); if (n) openProfile(n.symbol); } },
  { key: 'Open global view', type: 'command', action: () => openGlobal() },
  { key: 'Toggle labels', type: 'command', action: () => document.getElementById('bLabels').click() },
  { key: 'Toggle flow', type: 'command', action: () => document.getElementById('bFlow').click() },
  { key: 'Export data', type: 'command', action: () => exportData() },
  { key: 'Show help', type: 'command', action: () => toggleHelp() },
  { key: 'Show filters', type: 'command', action: () => document.getElementById('bFilter').click() },
];

function showCommandPalette() {
  const palette = document.getElementById('commandPalette');
  const input = document.getElementById('commandInput');
  const results = document.getElementById('commandResults');
  
  palette.style.display = 'block';
  input.value = '';
  input.focus();
  
  renderCommands(COMMANDS);
  
  input.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    
    // Search companies
    const companyResults = DATA.nodes
      .filter(n => n.symbol.toLowerCase().includes(query) || n.company.toLowerCase().includes(query))
      .slice(0, 10)
      .map(n => ({
        key: `${n.symbol} - ${n.company}`,
        type: 'company',
        symbol: n.symbol,
        action: () => openProfile(n.symbol)
      }));
    
    // Search commands
    const commandResults = COMMANDS.filter(c => c.key.toLowerCase().includes(query));
    
    renderCommands([...commandResults, ...companyResults]);
  });
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideCommandPalette();
  });
}

function hideCommandPalette() {
  document.getElementById('commandPalette').style.display = 'none';
}

function renderCommands(items) {
  const results = document.getElementById('commandResults');
  if (items.length === 0) {
    results.innerHTML = '<div style="padding:12px;color:#666;font-size:11px">No results</div>';
    return;
  }
  
  results.innerHTML = items.map((item, i) => `
    <div style="padding:10px 12px;border-bottom:1px solid #1a1a1a;cursor:pointer;font-size:11px;display:flex;justify-content:space-between;align-items:center"
         onmouseover="this.style.background='#1a1a1a'" onmouseout="this.style.background='transparent'"
         onclick="${item.action.toString().includes('openProfile') ? `openProfile('${item.symbol}')` : item.action.toString()}">
      <span style="color:${item.type === 'company' ? '#4488cc' : '#aaa'}">${item.key}</span>
      <span style="color:#444;font-size:9px">${item.type}</span>
    </div>
  `).join('');
}

// Keyboard shortcut
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    showCommandPalette();
  }
});

// Add to toolbar
// <button id="bCommand" title="Command palette (⌘K)">⌘</button>
document.getElementById("bCommand").onclick = () => showCommandPalette();
```

---

### B6. Recently Viewed History (2 hours)

**File:** `index.html`

```javascript
const RECENT_HISTORY = JSON.parse(localStorage.getItem('recentHistory') || '[]');

function addToHistory(symbol) {
  const existing = RECENT_HISTORY.findIndex(h => h.symbol === symbol);
  if (existing >= 0) RECENT_HISTORY.splice(existing, 1);
  
  RECENT_HISTORY.unshift({
    symbol,
    name: DATA.nodes.find(n => n.symbol === symbol)?.company || symbol,
    timestamp: Date.now()
  });
  
  RECENT_HISTORY = RECENT_HISTORY.slice(0, 20);
  localStorage.setItem('recentHistory', JSON.stringify(RECENT_HISTORY));
  renderRecentHistory();
}

function renderRecentHistory() {
  const btn = document.getElementById('bRecent');
  if (!btn) return;
  
  btn.title = `Recently viewed: ${RECENT_HISTORY.slice(0, 5).map(h => h.symbol).join(', ')}`;
}

function showRecentHistory() {
  const panel = document.createElement('div');
  panel.style.cssText = `
    position: fixed;
    top: 92px;
    right: 12px;
    z-index: 95;
    background: rgba(10,10,10,.95);
    border: 1px solid #252525;
    padding: 10px;
    border-radius: 4px;
    max-width: 280px;
  `;
  
  panel.innerHTML = `
    <h3 style="font-size:9px;color:var(--dim);text-transform:uppercase;margin-bottom:8px">Recently Viewed</h3>
    ${RECENT_HISTORY.length === 0 ? '<div style="font-size:9px;color:#666">No recent companies</div>' : ''}
    ${RECENT_HISTORY.map(h => `
      <div style="padding:6px 0;border-bottom:1px solid #1a1a1a;cursor:pointer" onclick="openProfile('${h.symbol}')">
        <div style="font-size:9px;color:#fff">${h.symbol}</div>
        <div style="font-size:8px;color:#666">${h.name}</div>
      </div>
    `).join('')}
  `;
  
  document.body.appendChild(panel);
  setTimeout(() => panel.remove(), 5000);
}

// Add to openProfile
function openProfile(symbol) {
  if (!DATA.profiles[symbol]) return;
  addToHistory(symbol);
  // ... rest of function
}

// Add button
// <button id="bRecent" title="Recent history">🕐</button>
document.getElementById("bRecent").onclick = () => showRecentHistory();
```

---

## Phase 5: Data Quality (16 hours)

### C2. Missing Data Indicators (3 hours)

**File:** `generate-top100-data.mjs`

```javascript
function calculateDataQuality(profile) {
  const suppliers = profile.nodes.filter(n => n.kind === 'supplier');
  const verified = profile.nodes.filter(n => n.sourceId);
  const hasHqCity = !!DATA.nodes.find(n => n.symbol === profile.symbol)?.hq?.city;
  
  const score = Math.min(100, 
    (suppliers.length >= 5 ? 40 : suppliers.length * 8) +
    (verified.length >= 3 ? 40 : verified.length * 13) +
    (hasHqCity ? 20 : 0)
  );
  
  return {
    score,
    supplierCount: suppliers.length,
    verifiedCount: verified.length,
    hasHqCity,
    priority: score < 50 ? 'high' : score < 70 ? 'medium' : 'low'
  };
}

// Add to profile output
profiles[symbol].dataQuality = calculateDataQuality(profiles[symbol]);
```

**File:** `index.html`

```javascript
// Add quality indicator to nodes
nodeSel.filter(d => d.dataQuality?.priority === 'high')
  .append('circle')
  .attr('r', (d) => (d.z || 10) + 8)
  .attr('stroke', '#f0ad4e')
  .attr('stroke-width', 1.5)
  .attr('stroke-dasharray', '2 2')
  .attr('fill', 'none');
```

---

### C3. Cross-Reference Validation (6 hours)

**File:** `generate-top100-data.mjs`

```javascript
function validateRelationships(profiles) {
  const conflicts = [];
  
  Object.entries(profiles).forEach(([symbol, profile]) => {
    profile.nodes.filter(n => n.kind === 'supplier').forEach(supplier => {
      // Check if supplier claims to supply this company
      const supplierProfile = Object.values(profiles).find(p => 
        p.company.toLowerCase().includes(supplier.d.toLowerCase())
      );
      
      if (supplierProfile) {
        const hasReverseLink = supplierProfile.nodes.some(n => 
          n.d.toLowerCase().includes(profile.company.toLowerCase())
        );
        
        if (!hasReverseLink) {
          conflicts.push({
            type: 'missing_reverse_link',
            supplier: supplier.d,
            customer: profile.company,
            symbol: symbol
          });
        }
      }
    });
  });
  
  return conflicts;
}

// Run validation
const CONFLICTS = validateRelationships(profiles);
console.log(`Found ${CONFLICTS.length} potential conflicts`);
```

---

### C4. Source Freshness Tracking (3 hours)

**File:** `generate-top100-data.mjs`

```javascript
// Add to each node
{
  ...node,
  lastVerified: new Date().toISOString(),
  sourceAge: 0 // days
}

function calculateSourceAge(dateStr) {
  const sourceDate = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now - sourceDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
```

**File:** `index.html`

```javascript
// Show stale warning in tooltip
function showTooltip(d, ev) {
  // ... existing code
  
  if (d.lastVerified) {
    const ageDays = calculateSourceAge(d.lastVerified);
    if (ageDays > 365) {
      const staleWarning = document.createElement('div');
      staleWarning.style.cssText = 'margin-top:6px;font-size:9px;color:#f0ad4e';
      staleWarning.textContent = `⚠ Last verified ${ageDays} days ago`;
      tt.appendChild(staleWarning);
    }
  }
}
```

---

## Phase 6: Technical (36 hours)

### D1. Performance Optimization (12 hours)

**File:** `index.html`

```javascript
// Use Canvas for large graphs
const useCanvas = STATE.nodes.length > 200;

if (useCanvas) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  canvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none';
  document.getElementById('canvas').appendChild(canvas);
  const ctx = canvas.getContext('2d');
  
  // Render nodes to canvas
  function renderCanvas() {
    ctx.clearRect(0, 0, W, H);
    STATE.nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.z || 10, 0, Math.PI * 2);
      ctx.fillStyle = DATA.countries[n.c]?.c || '#777';
      ctx.fill();
    });
  }
}
```

---

### D2. Offline Support (6 hours)

**File:** `sw.js` (new)

```javascript
const CACHE_NAME = 'supply-chain-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/data/top100-map.js',
  '/favicon.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
```

**File:** `index.html`

```html
<!-- Add to <head> -->
<link rel="manifest" href="manifest.json">
```

```javascript
// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(() => console.log('Service Worker registered'))
    .catch(err => console.error('SW registration failed:', err));
}
```

**File:** `manifest.json` (new)

```json
{
  "name": "Global Supply Chain",
  "short_name": "SupplyChain",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#e8453c",
  "icons": [{
    "src": "favicon.svg",
    "sizes": "any",
    "type": "image/svg+xml"
  }]
}
```

---

### D3. REST API (8 hours)

**File:** `server.js` (new)

```javascript
const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

const DATA = JSON.parse(fs.readFileSync('data/top100-map.json', 'utf8'));

app.get('/api/companies', (req, res) => {
  res.json(DATA.nodes);
});

app.get('/api/companies/:symbol', (req, res) => {
  const company = DATA.nodes.find(n => n.symbol === req.params.symbol);
  if (!company) return res.status(404).json({ error: 'Not found' });
  res.json(company);
});

app.get('/api/companies/:symbol/profile', (req, res) => {
  const profile = DATA.profiles[req.params.symbol];
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  res.json(profile);
});

app.get('/api/search', (req, res) => {
  const q = req.query.q?.toLowerCase() || '';
  const results = DATA.nodes.filter(n => 
    n.symbol.toLowerCase().includes(q) || 
    n.company.toLowerCase().includes(q)
  ).slice(0, 20);
  res.json(results);
});

app.get('/api/stats', (req, res) => {
  res.json({
    totalCompanies: DATA.nodes.length,
    totalProfiles: Object.keys(DATA.profiles).length,
    snapshotDate: DATA.snapshot_date
  });
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
```

---

### D4. GraphQL API (10 hours)

**File:** `schema.graphql` (new)

```graphql
type Company {
  symbol: String!
  name: String!
  rank: Int!
  marketcap: Float!
  country: String!
  hq: HQ!
}

type HQ {
  city: String!
  country: String!
  countryCode: String!
}

type Profile {
  symbol: String!
  company: String!
  category: String!
  upstream: [Node!]!
  services: [Node!]!
  channels: [Node!]!
  demand: [Node!]!
  riskScore: RiskScore
  dataQuality: DataQuality
}

type Node {
  id: ID!
  name: String!
  kind: String!
  tier: Int!
  confidence: String!
  sourceId: String
}

type RiskScore {
  overallScore: Int!
  concentrationRisk: String!
  geographicRisk: String!
}

type DataQuality {
  score: Int!
  priority: String!
}

type Query {
  company(symbol: String!): Company
  companies: [Company!]!
  profile(symbol: String!): Profile
  search(query: String!): [Company!]!
  sharedSuppliers(symbol: String!): [SharedSupplier!]!
  stats: Stats!
}

type SharedSupplier {
  name: String!
  companies: [String!]!
  risk: String!
}

type Stats {
  totalCompanies: Int!
  totalProfiles: Int!
  snapshotDate: String!
}
```

---

## Phase 7: Collaboration (46 hours)

### E1. Annotation System (4 hours)

**File:** `index.html`

```javascript
const ANNOTATIONS = JSON.parse(localStorage.getItem('annotations') || '{}');

function addAnnotation(nodeId, note) {
  if (!ANNOTATIONS[nodeId]) ANNOTATIONS[nodeId] = [];
  ANNOTATIONS[nodeId].push({
    note,
    timestamp: Date.now(),
    author: 'user'
  });
  localStorage.setItem('annotations', JSON.stringify(ANNOTATIONS));
  showToast('Annotation added');
}

function getAnnotations(nodeId) {
  return ANNOTATIONS[nodeId] || [];
}

// Add annotation button on node click
nodeSel.on('dblclick', (ev, d) => {
  const note = prompt('Add annotation:');
  if (note) {
    addAnnotation(d.id, note);
    showAnnotations(d.id);
  }
});
```

---

### E3. Report Generation (6 hours)

**File:** `index.html`

```html
<!-- Add jsPDF library -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```

```javascript
async function generateReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  const symbol = STATE.mode === 'profile' ? STATE.symbol : null;
  if (!symbol) {
    showToast('Open a company profile first');
    return;
  }
  
  const profile = DATA.profiles[symbol];
  
  // Title
  doc.setFontSize(20);
  doc.text(`${profile.company} (${symbol})`, 20, 20);
  doc.setFontSize(12);
  doc.text(`Supply Chain Analysis`, 20, 30);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 38);
  
  // Stats
  doc.setFontSize(14);
  doc.text('Summary', 20, 50);
  doc.setFontSize(10);
  doc.text(`Suppliers: ${profile.nodes.filter(n => n.kind === 'supplier').length}`, 20, 60);
  doc.text(`Services: ${profile.nodes.filter(n => n.kind === 'service').length}`, 20, 66);
  doc.text(`Channels: ${profile.nodes.filter(n => n.kind === 'channel').length}`, 20, 72);
  
  // Risk score
  if (profile.riskScore) {
    doc.text(`Risk Score: ${profile.riskScore.overallScore}/100`, 20, 82);
  }
  
  // Suppliers list
  doc.setFontSize(14);
  doc.text('Key Suppliers', 20, 100);
  doc.setFontSize(9);
  
  profile.nodes
    .filter(n => n.kind === 'supplier')
    .slice(0, 20)
    .forEach((s, i) => {
      doc.text(`${i + 1}. ${s.d.split('\n')[0]}`, 20, 108 + (i * 5));
    });
  
  doc.save(`${symbol}-supply-chain-report.pdf`);
}

// Add button
// <button id="bReport" title="Generate PDF report">📄</button>
document.getElementById("bReport").onclick = () => generateReport();
```

---

## Implementation Priority

### Week 1: Quick Wins (4h)
- [ ] Q1-Q8 complete

### Week 2-3: High Priority (13h)
- [ ] B1. Saved Views
- [ ] A2. Shared Suppliers
- [ ] C1. Source Confidence

### Week 4-5: Data Features (24h)
- [ ] A1. Risk Scoring
- [ ] A3. Timeline
- [ ] A4. Depth Analysis
- [ ] A5. Benchmarking

### Week 6-7: UX Features (15h)
- [ ] B2. Notifications
- [ ] B3. Presentation
- [ ] B5. Command Palette
- [ ] B6. Recent History

### Week 8: Data Quality (16h)
- [ ] C2. Missing Data
- [ ] C3. Validation
- [ ] C4. Freshness

### Week 9-11: Technical (36h)
- [ ] D1. Performance
- [ ] D2. Offline
- [ ] D3. REST API
- [ ] D4. GraphQL

### Week 12-14: Collaboration (46h)
- [ ] E1. Annotations
- [ ] E3. Reports
- [ ] E2. Multi-user (optional)
- [ ] E4. Workspaces (optional)

---

## Total: ~158 hours

