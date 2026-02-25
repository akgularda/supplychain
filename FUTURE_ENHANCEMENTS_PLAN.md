# Future Enhancements - Comprehensive Implementation Plan

## Overview
Complete roadmap for 20+ future website enhancements across 5 categories plus quick wins.

**Current State:** 103/103 tests passing, 15/15 initial improvements complete

---

## Category A: Data & Analytics (5 Features)

### A1. Supply Chain Risk Scoring
**Goal:** Calculate and visualize supply chain concentration and geographic risk

**Implementation:**
```javascript
// Risk calculation algorithm
function calculateRisk(profile) {
  const supplierCount = profile.nodes.filter(n => n.kind === 'supplier').length;
  const countryExposure = calculateCountryExposure(profile.nodes);
  const singleSource = profile.nodes.filter(n => isSingleSource(n)).length;
  
  return {
    concentrationRisk: supplierCount < 3 ? 'high' : supplierCount < 5 ? 'medium' : 'low',
    geographicRisk: countryExposure.maxCountry > 0.5 ? 'high' : 'medium',
    singleSourceRisk: singleSource > 0 ? 'high' : 'low',
    overallScore: calculateOverallScore(...)
  };
}
```

**UI Changes:**
- Add risk badge to company card (🔴 🟡 🟢)
- Risk panel showing breakdown by category
- Heat map overlay on global view

**Files:** `index.html`, `generate-top100-data.mjs`

**Effort:** 4 hours

---

### A2. Shared Supplier Discovery
**Goal:** Find companies sharing the same suppliers (systemic risk identification)

**Implementation:**
```javascript
// Build supplier index
const supplierIndex = new Map();
Object.values(DATA.profiles).forEach(profile => {
  profile.nodes.filter(n => n.kind === 'supplier').forEach(supplier => {
    if (!supplierIndex.has(supplier.d)) supplierIndex.set(supplier.d, []);
    supplierIndex.get(supplier.d).push(profile.symbol);
  });
});

// Query: "Who shares this supplier?"
function findSharedSuppliers(symbol) {
  const mySuppliers = getDataBaseSuppliers(symbol);
  return mySuppliers.map(s => ({
    supplier: s,
    sharedWith: supplierIndex.get(s).filter(x => x !== symbol)
  }));
}
```

**UI Changes:**
- New "Shared Risk" tab in company profile
- Network view showing shared supplier connections
- Alert indicator for critical shared dependencies

**Files:** `index.html`, `generate-top100-data.mjs`

**Effort:** 6 hours

---

### A3. Timeline/History View
**Goal:** Track supply chain changes over time

**Implementation:**
- Add `snapshot_date` versioning to data
- Store historical profiles in `/data/history/` folder
- Timeline slider UI component
- Diff view between versions

**Data Structure:**
```json
{
  "symbol": "AAPL",
  "snapshots": [
    { "date": "2024-01-01", "profile": {...} },
    { "date": "2024-06-01", "profile": {...} },
    { "date": "2025-01-01", "profile": {...} }
  ]
}
```

**UI Changes:**
- Timeline slider at bottom of profile view
- "Changed" badge on modified nodes
- Diff panel showing additions/removals

**Files:** `index.html`, `generate-top100-data.mjs`, new `/data/history/` folder

**Effort:** 8 hours

---

### A4. Supply Chain Depth Analysis
**Goal:** Show tier-2, tier-3 supplier relationships

**Implementation:**
- Recursive supplier lookup
- Depth indicator on nodes (Tier 1, Tier 2, Tier 3)
- Expandable/collapsible tiers
- Depth filter (show only Tier 1, or all tiers)

**UI Changes:**
- Tier badges on supplier nodes
- Expand/collapse controls
- Depth histogram in stats

**Files:** `index.html`, `generate-top100-data.mjs`

**Effort:** 6 hours

---

### A5. Industry Benchmarking
**Goal:** Compare company supply chain metrics against industry averages

**Implementation:**
```javascript
const industryAverages = {
  semiconductor: { avgSuppliers: 12, avgServices: 8, avgChannels: 6 },
  pharma: { avgSuppliers: 15, avgServices: 10, avgChannels: 8 },
  // ...
};

function getBenchmark(symbol, metric) {
  const industry = getIndustry(symbol);
  return industryAverages[industry][metric];
}
```

**UI Changes:**
- Benchmark comparison in company card
- "Above/Below average" indicators
- Industry percentile ranking

**Files:** `index.html`, `generate-top100-data.mjs`

**Effort:** 4 hours

---

## Category B: User Experience (6 Features)

### B1. Saved Views/Bookmarks ⭐ HIGH PRIORITY
**Goal:** Save and share filtered views

**Implementation:**
```javascript
// Save view state
function saveView(name) {
  const state = {
    mode: STATE.mode,
    symbol: STATE.symbol,
    filters: STATE.filters,
    zoom: getCurrentZoom(),
    timestamp: Date.now()
  };
  const views = JSON.parse(localStorage.getItem('savedViews') || '[]');
  views.push({ name, state });
  localStorage.setItem('savedViews', JSON.stringify(views));
}

// Load view
function loadView(name) {
  const views = JSON.parse(localStorage.getItem('savedViews') || '[]');
  const view = views.find(v => v.name === name);
  restoreState(view.state);
}
```

**UI Changes:**
- "Save View" button in toolbar
- Bookmarks panel with saved views
- Share URL with view state encoded

**Files:** `index.html`

**Effort:** 3 hours

---

### B2. Notifications/Alerts
**Goal:** Alert users about supply chain changes

**Implementation:**
- Store user's watched companies in localStorage
- Check for data updates on load
- Show notification badge for changes

**UI Changes:**
- Bell icon in toolbar with notification count
- Notifications panel listing changes
- "Watch this company" toggle on company card

**Files:** `index.html`

**Effort:** 4 hours

---

### B3. Presentation Mode
**Goal:** Guided tour through supply chain

**Implementation:**
```javascript
const presentationSteps = [
  { view: 'global', zoom: 0.5, note: 'Top 100 companies by market cap' },
  { view: 'profile', symbol: 'AAPL', zoom: 1, note: 'Apple supply chain' },
  { view: 'highlight', filter: n => n.kind === 'supplier', note: 'Key suppliers' },
  // ...
];

function nextSlide() {
  const step = presentationSteps[currentSlide];
  applyStep(step);
  currentSlide++;
}
```

**UI Changes:**
- "Present" button in toolbar
- Slide counter and navigation
- Speaker notes panel

**Files:** `index.html`

**Effort:** 5 hours

---

### B4. Customizable Dashboard
**Goal:** User-configurable layout and widgets

**Implementation:**
- Draggable/resizable panels
- Widget library (stats, chart, map, list)
- Save layout to localStorage

**UI Changes:**
- Dashboard mode toggle
- Widget picker
- Layout save/load

**Files:** `index.html` (major CSS changes)

**Effort:** 10 hours

---

### B5. Quick Search Palette (Cmd+K)
**Goal:** Spotlight-style command palette

**Implementation:**
```javascript
// Command palette
const commands = [
  { key: 'Go to company', action: (q) => openProfile(q) },
  { key: 'Filter suppliers', action: () => applyFilter('supplier') },
  { key: 'Export data', action: () => exportData() },
  // ...
];

// Fuzzy match on command + company search
```

**UI Changes:**
- Cmd+K overlay modal
- Search input with command suggestions
- Keyboard navigation

**Files:** `index.html`

**Effort:** 4 hours

---

### B6. Recently Viewed History
**Goal:** Quick access to recently viewed companies

**Implementation:**
- Track last 20 viewed companies
- Show in dropdown or side panel
- Keyboard navigation (Alt+←/→)

**UI Changes:**
- "Recent" dropdown in toolbar
- Back/forward navigation buttons

**Files:** `index.html`

**Effort:** 2 hours

---

## Category C: Data Quality (4 Features)

### C1. Source Confidence Scoring ⭐ HIGH PRIORITY
**Goal:** Weighted confidence based on source type and age

**Implementation:**
```javascript
const sourceWeights = {
  'SEC filing': 1.0,
  'Annual report': 0.9,
  'Press release': 0.7,
  'News article': 0.5,
  'Inferred': 0.3
};

function calculateConfidence(sourceId, sourceDate) {
  const baseWeight = sourceWeights[sourceId.type] || 0.5;
  const ageFactor = calculateAgeDecay(sourceDate);
  return baseWeight * ageFactor;
}
```

**UI Changes:**
- Confidence score (0-100%) in tooltips
- Source type icons
- "Last verified" date display

**Files:** `generate-top100-data.mjs`, `index.html`

**Effort:** 4 hours

---

### C2. Missing Data Indicators
**Goal:** Show which companies need more research

**Implementation:**
```javascript
function getDataQuality(symbol) {
  const profile = DATA.profiles[symbol];
  return {
    supplierCount: profile.nodes.filter(n => n.kind === 'supplier').length,
    verifiedCount: profile.nodes.filter(n => n.sourceId).length,
    completeness: calculateCompleteness(profile),
    priority: calculatePriority(...)
  };
}
```

**UI Changes:**
- Data quality badge on company nodes
- "Needs research" filter
- Priority queue view

**Files:** `index.html`, `generate-top100-data.mjs`

**Effort:** 3 hours

---

### C3. Cross-Reference Validation
**Goal:** Auto-detect conflicts between company filings

**Implementation:**
- Compare supplier claims from both sides
- Flag inconsistencies (e.g., A says supplies B, B doesn't list A)
- Reconciliation suggestions

**UI Changes:**
- Conflict indicator on disputed nodes
- Reconciliation panel
- "Verify this relationship" button

**Files:** `generate-top100-data.mjs`, `index.html`

**Effort:** 6 hours

---

### C4. Source Freshness Tracking
**Goal:** Track when data was last verified

**Implementation:**
- Add `lastVerified` date to each node
- Add `sourceAge` calculation
- Stale data warning (> 1 year old)

**UI Changes:**
- "Last verified" in tooltips
- Stale data warning (orange/red indicator)
- "Verify this data" action

**Files:** `generate-top100-data.mjs`, `index.html`

**Effort:** 3 hours

---

## Category D: Technical (4 Features)

### D1. Performance Optimization
**Goal:** Handle larger datasets smoothly

**Implementation:**
- Virtual scrolling for node lists
- Web Workers for force simulation
- Progressive loading (load visible nodes first)
- Canvas rendering for large graphs

**Files:** `index.html` (major refactoring)

**Effort:** 12 hours

---

### D2. Offline Support
**Goal:** Work without internet connection

**Implementation:**
```javascript
// Service Worker
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Cache data files
caches.open('supply-chain-v1').then((cache) => {
  cache.addAll(['/data/top100-map.js', '/index.html']);
});
```

**UI Changes:**
- Offline indicator
- "Download for offline" button
- Sync when back online

**Files:** New `sw.js`, `index.html`, `manifest.json`

**Effort:** 6 hours

---

### D3. REST API
**Goal:** Programmatic access to data

**Implementation:**
```javascript
// Simple Express server
app.get('/api/companies', (req, res) => {
  res.json(DATA.nodes);
});

app.get('/api/companies/:symbol/profile', (req, res) => {
  res.json(DATA.profiles[req.params.symbol]);
});

app.get('/api/search?q=:query', (req, res) => {
  res.json(searchResults(req.query.q));
});
```

**Documentation:**
- OpenAPI/Swagger spec
- Example queries
- Rate limiting

**Files:** New `server.js`, `api-docs.md`

**Effort:** 8 hours

---

### D4. GraphQL API
**Goal:** Flexible queries for complex data needs

**Implementation:**
```graphql
type Query {
  company(symbol: String!): Company
  companies(filter: CompanyFilter): [Company]
  search(query: String!): [SearchResult]
  sharedSuppliers(symbol: String!): [Supplier]
}

type Company {
  symbol: String!
  name: String!
  profile: Profile
  riskScore: RiskScore
}
```

**Files:** New `schema.graphql`, `resolvers.js`

**Effort:** 10 hours

---

## Category E: Collaboration (4 Features)

### E1. Annotation System
**Goal:** Add notes to nodes

**Implementation:**
```javascript
const annotations = new Map();

function addAnnotation(nodeId, note) {
  if (!annotations.has(nodeId)) annotations.set(nodeId, []);
  annotations.get(nodeId).push({
    note,
    author: 'user',
    timestamp: Date.now()
  });
  saveAnnotations();
}
```

**UI Changes:**
- "Add note" button on node hover
- Annotations panel
- Export annotated report

**Files:** `index.html`

**Effort:** 4 hours

---

### E2. Multi-User Sessions
**Goal:** Real-time collaboration

**Implementation:**
- WebSocket server for sync
- Cursor presence indicators
- Shared view state

**UI Changes:**
- User avatars with cursors
- Chat panel
- "Follow presenter" mode

**Files:** New `server.js` (WebSocket), `index.html`

**Effort:** 16 hours

---

### E3. Report Generation
**Goal:** PDF export with charts

**Implementation:**
- Use jsPDF or pdfmake for PDF generation
- Include charts, tables, annotations
- Custom templates (executive summary, detailed analysis)

**UI Changes:**
- "Export Report" button
- Template selector
- Preview before download

**Files:** `index.html`, add jsPDF library

**Effort:** 6 hours

---

### E4. Team Workspaces
**Goal:** Shared annotation and view collections

**Implementation:**
- User accounts (simple auth)
- Shared workspace storage
- Permission levels (view/edit/admin)

**UI Changes:**
- Workspace selector
- Team member list
- Activity feed

**Files:** New `auth.js`, `workspace.js`, `index.html`

**Effort:** 20 hours

---

## Quick Wins (< 1 hour each)

### Q1. Add "Last Updated" Timestamp
**Implementation:** Add `dataUpdated` field to DATA, display in footer
**Files:** `index.html`
**Effort:** 15 min

### Q2. Show Source Count in Tooltips
**Implementation:** Count sources per node, display in tooltip
**Files:** `index.html`
**Effort:** 30 min

### Q3. Copy-to-Clipboard for Symbols
**Implementation:** Click symbol to copy, show toast notification
**Files:** `index.html`
**Effort:** 30 min

### Q4. Show Total Market Cap in Stats
**Implementation:** Sum market cap, add to top stats bar
**Files:** `index.html`
**Effort:** 15 min

### Q5. Add Favicon
**Implementation:** Create SVG favicon, add to `<head>`
**Files:** `favicon.svg`, `index.html`
**Effort:** 30 min

### Q6. Node Count by Type in Legend
**Implementation:** Count nodes by kind, show in legend
**Files:** `index.html`
**Effort:** 30 min

### Q7. Print Stylesheet
**Implementation:** Add `@media print` CSS for clean printing
**Files:** `index.html`
**Effort:** 30 min

### Q8. 404 Page for Unknown Companies
**Implementation:** Handle invalid symbol in URL
**Files:** `index.html`
**Effort:** 15 min

---

## Implementation Phases

### Phase 1: Quick Wins (Week 1)
- Q1-Q8 (4 hours total)
- Immediate user value
- Build momentum

### Phase 2: High Priority (Weeks 2-3)
- B1. Saved Views/Bookmarks
- A2. Shared Supplier Discovery
- C1. Source Confidence Scoring
- **Total:** 13 hours

### Phase 3: Data & Analytics (Weeks 4-5)
- A1. Risk Scoring
- A3. Timeline View
- A4. Depth Analysis
- A5. Benchmarking
- **Total:** 24 hours

### Phase 4: User Experience (Weeks 6-7)
- B2. Notifications
- B3. Presentation Mode
- B5. Command Palette
- B6. Recent History
- **Total:** 15 hours

### Phase 5: Data Quality (Week 8)
- C2. Missing Data Indicators
- C3. Cross-Reference Validation
- C4. Source Freshness
- **Total:** 12 hours

### Phase 6: Technical Foundation (Weeks 9-10)
- D1. Performance Optimization
- D2. Offline Support
- D3. REST API
- **Total:** 26 hours

### Phase 7: Collaboration (Weeks 11-13)
- E1. Annotations
- E3. Report Generation
- E2. Multi-User (optional)
- E4. Workspaces (optional)
- **Total:** 26-62 hours

---

## Summary

| Category | Features | Total Effort |
|----------|----------|--------------|
| Quick Wins | 8 | 4 hours |
| Data & Analytics | 5 | 28 hours |
| User Experience | 6 | 28 hours |
| Data Quality | 4 | 16 hours |
| Technical | 4 | 36 hours |
| Collaboration | 4 | 46 hours |
| **Total** | **31** | **158 hours** |

---

## Recommended Priority Order

1. **Quick Wins** (4h) - Immediate value
2. **Saved Views** (3h) - Most requested
3. **Shared Suppliers** (6h) - Unique insight
4. **Source Confidence** (4h) - Builds on verification
5. **Risk Scoring** (4h) - High impact
6. **Command Palette** (4h) - Power user feature
7. **REST API** (8h) - Enables integrations
8. **Report Generation** (6h) - Presentation ready
9. **Offline Support** (6h) - Portability
10. **Remaining features** as needed

---

## Files That Will Change

| File | Features Affected |
|------|-------------------|
| `index.html` | All UI features |
| `generate-top100-data.mjs` | Data structure features |
| `sw.js` (new) | Offline support |
| `server.js` (new) | API, WebSocket |
| `manifest.json` (new) | PWA support |

---

## Testing Requirements

Each feature needs:
- [ ] Unit tests (if applicable)
- [ ] Manual testing checklist
- [ ] Cross-browser testing
- [ ] Mobile testing
- [ ] Performance testing (for technical features)

---

## Success Metrics

| Feature | Success Metric |
|---------|----------------|
| Saved Views | 50% of users save ≥1 view |
| Shared Suppliers | Used in 20% of sessions |
| Export | 100 exports/week |
| API | 10 external integrations |
| Performance | < 100ms interaction latency |
| Offline | Works without network |
