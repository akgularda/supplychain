# Visual & UX Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `subagent-driven-development` to implement this plan task-by-task.

**Goal:** Transform the supply chain website with professional visual polish, modern UI patterns, and enhanced user experience.

**Architecture:** Single-file enhancement approach - all changes to `index.html` with improved CSS styling, JavaScript animations, and UI component refinements.

**Tech Stack:** Vanilla JavaScript, D3.js v7, CSS3 with custom properties, Google Fonts (Bricolage Grotesque, Inter, JetBrains Mono)

---

## Pre-Implementation Checklist

### Step 0: Verify Current State

Run the website to establish baseline:
```bash
# Open in browser
start index.html
```

Expected: Website loads with current dark theme, 100 companies visible, toolbar and company card functional.

**Test Suite Status:**
```bash
# Run existing tests (if node test runner available)
node --test tests/*.test.mjs
```
Expected: 103/103 tests passing

---

## Task 1: Enhanced Header with Animated Statistics

**Files:**
- Modify: `index.html` (lines 1-100 for CSS, lines 200-250 for HTML, lines 400-600 for JS)

**Step 1: Add CSS for animated counters and improved header**

Add after existing `#top` styles (around line 25):

```css
/* Enhanced Header Styles */
#top {
  background: linear-gradient(180deg, rgba(15,15,15,0.98) 0%, rgba(10,10,10,0.95) 100%);
  backdrop-filter: blur(8px);
  box-shadow: 0 1px 0 rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.4);
}

#title {
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.st b {
  font-variant-numeric: tabular-nums;
  background: linear-gradient(135deg, #fff 0%, #b0b0b0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-live {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #4caf50;
  border-radius: 50%;
  margin-right: 6px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.9); }
}

#lastUpdated {
  color: #666;
  font-size: 8px;
}

#lastUpdated.updated {
  color: #4caf50;
  animation: flash 0.5s ease;
}

@keyframes flash {
  0%, 100% { color: #666; }
  50% { color: #4caf50; }
}
```

**Step 2: Update header HTML structure**

Replace the stats section in `#top` (around line 230):

```html
<div class="st">
  <span><span class="stat-live"></span><b id="sN">0</b> nodes</span>
  <span><b id="sL">0</b> links</span>
  <span><b id="sC">0</b> countries</span>
  <span><b id="sY">0</b> layers</span>
  <span><b id="sM">$0T</b> cap</span>
</div>
```

**Step 3: Add animation counter JavaScript**

Add after STATE initialization (around line 450):

```javascript
// Animated counter utility
function animateCounter(elementId, target, duration = 1000, prefix = '', suffix = '') {
  const el = document.getElementById(elementId);
  if (!el) return;
  
  const start = 0;
  const startTime = performance.now();
  const easeOutQuad = t => t * (2 - t);
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutQuad(progress);
    const current = Math.floor(start + (target - start) * eased);
    
    el.textContent = prefix + current.toLocaleString() + suffix;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

// Update stats display with animation
function updateStats(nodes, links, countries, layers, marketCap) {
  animateCounter('sN', nodes.length, 800);
  animateCounter('sL', links.length, 800);
  animateCounter('sC', countries, 800);
  animateCounter('sY', layers, 800);
  animateCounter('sM', marketCap, 1000, '$', 'T');
}
```

**Step 4: Update render functions to use animated stats**

Find where stats are updated (search for `sN.textContent`) and replace with:

```javascript
updateStats(nodes, links, countryCount, layerCount, totalMarketCap);
```

**Step 5: Test animated counters**

Refresh browser and verify:
- Numbers count up smoothly on load
- Live indicator pulses green
- Stats display with proper formatting

**Step 6: Commit**

```bash
git add index.html
git commit -m "feat: add animated statistics to header"
```

---

## Task 2: Enhanced Company Card Design

**Files:**
- Modify: `index.html` (CSS lines 50-120, HTML lines 280-340, JS lines 700-900)

**Step 1: Add CSS for improved company card**

Add after existing `#companyCard` styles:

```css
/* Enhanced Company Card */
#companyCard {
  background: linear-gradient(180deg, rgba(18,18,18,0.98) 0%, rgba(10,10,10,0.96) 100%);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3);
  border-radius: 8px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

#companyCard::-webkit-scrollbar {
  width: 6px;
}

#companyCard::-webkit-scrollbar-track {
  background: rgba(255,255,255,0.03);
}

#companyCard::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
}

#companyCard .cTop {
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

#companyCard .cLogoWrap {
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

#companyCard .cName {
  background: linear-gradient(135deg, #fff 0%, #d0d0d0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

#companyCard .cStats {
  background: rgba(255,255,255,0.03);
  padding: 8px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.05);
}

#companyCard .cStat {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
}

#companyCard .cStat b {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Risk Badge Improvements */
.cRiskBadge {
  font-weight: 600;
  letter-spacing: 0.3px;
}

.cRiskBadge.critical {
  color: #ff6b6b;
  border-color: #8b2323;
  background: linear-gradient(135deg, rgba(139,35,35,0.3) 0%, rgba(139,35,35,0.1) 100%);
}

.cRiskBadge.high {
  color: #ff8f8f;
  border-color: #6c2c2c;
  background: linear-gradient(135deg, rgba(108,44,44,0.3) 0%, rgba(108,44,44,0.1) 100%);
}

.cRiskBadge.medium {
  color: #ffd899;
  border-color: #6a5125;
  background: linear-gradient(135deg, rgba(106,81,37,0.3) 0%, rgba(106,81,37,0.1) 100%);
}

.cRiskBadge.low {
  color: #9fdbac;
  border-color: #2a5a35;
  background: linear-gradient(135deg, rgba(42,90,53,0.3) 0%, rgba(42,90,53,0.1) 100%);
}

/* Credit Rating Badges */
.credit-rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  border-radius: 3px;
  font-size: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.credit-rating.sp { background: rgba(232,69,60,0.15); color: #e8453c; border: 1px solid rgba(232,69,60,0.3); }
.credit-rating.moodys { background: rgba(76,136,204,0.15); color: #4c88cc; border: 1px solid rgba(76,136,204,0.3); }
.credit-rating.fitch { background: rgba(156,39,176,0.15); color: #9c27b0; border: 1px solid rgba(156,39,176,0.3); }

.credit-rating-grade {
  font-weight: 700;
  min-width: 20px;
  text-align: center;
}
```

**Step 2: Update company card HTML structure**

Replace `#companyCard` content (around line 290):

```html
<div id="companyCard">
  <div class="cTop">
    <div class="cLogoWrap">
      <img class="cLogo" id="cardLogo" alt="Company logo">
      <div class="cLogoFallback" id="cardLogoFallback">--</div>
    </div>
    <div style="flex:1">
      <div class="cName" id="cardName">Company</div>
      <div class="cSym" id="cardSymbol">SYMB</div>
      <div class="cStats" style="margin-top:6px">
        <div class="cStat"><b id="cardSuppliers">0</b> suppliers</div>
        <div class="cStat"><b id="cardServices">0</b> services</div>
        <div class="cStat"><b id="cardChannels">0</b> channels</div>
      </div>
    </div>
    <button id="cardCompare" style="background:#111;border:1px solid #222;color:#666;font-size:16px;cursor:pointer;width:28px;height:28px;border-radius:4px" title="Add to compare" aria-label="Add company to compare">+</button>
  </div>
  <div class="cHq">
    <img class="cFlag" id="cardFlag" alt="Country flag">
    <div class="cFlagFallback" id="cardFlagFallback">--</div>
    <div class="cHqText" id="cardHqText">City, Country</div>
  </div>
  <div class="cInsights">
    <div class="cSecTitle">Credit Ratings</div>
    <div class="cRatings" id="cardRatings"></div>

    <div class="cSecTitle" style="margin-top:10px">Risk & Resilience</div>
    <div class="cRiskRow">
      <span class="cRiskBadge low" id="cardRiskBadge">Low Risk</span>
      <span class="cMuted" id="cardRiskText">Profile risk summary</span>
    </div>
    <div class="cList" id="cardRiskDetails"></div>

    <div class="cSecTitle" style="margin-top:10px">Shared Supplier Overlap</div>
    <div class="cList" id="cardOverlap"></div>

    <div class="cSecTitle" style="margin-top:10px">Evidence Timeline</div>
    <div class="cList" id="cardTimeline"></div>

    <div class="cActions">
      <button id="cardSourcesBtn" type="button" aria-label="Open source provenance panel">Sources</button>
    </div>
  </div>
</div>
```

**Step 3: Add credit rating display function**

Add JavaScript function (around line 750):

```javascript
function renderCreditRatings(symbol, container) {
  const ratings = window.SUPPLY_MAP_DATA?.creditRatings?.[symbol];
  if (!ratings) {
    container.innerHTML = '<div class="cMuted">No credit rating data available</div>';
    return;
  }
  
  const ratingHTML = [];
  
  if (ratings.sp) {
    ratingHTML.push(`
      <div class="cRate">
        <span class="credit-rating sp">
          <span class="credit-rating-grade">${ratings.sp.grade}</span>
          <span>S&P</span>
        </span>
        <span>${ratings.sp.outlook || 'Stable'}</span>
      </div>
    `);
  }
  
  if (ratings.moodys) {
    ratingHTML.push(`
      <div class="cRate">
        <span class="credit-rating moodys">
          <span class="credit-rating-grade">${ratings.moodys.grade}</span>
          <span>Moody's</span>
        </span>
        <span>${ratings.moodys.outlook || 'Stable'}</span>
      </div>
    `);
  }
  
  if (ratings.fitch) {
    ratingHTML.push(`
      <div class="cRate">
        <span class="credit-rating fitch">
          <span class="credit-rating-grade">${ratings.fitch.grade}</span>
          <span>Fitch</span>
        </span>
        <span>${ratings.fitch.outlook || 'Stable'}</span>
      </div>
    `);
  }
  
  container.innerHTML = ratingHTML.join('') || '<div class="cMuted">No credit rating data available</div>';
}
```

**Step 4: Update company card render function**

Find `showCompanyCard` function and update to call `renderCreditRatings`:

```javascript
renderCreditRatings(symbol, document.getElementById('cardRatings'));
```

**Step 5: Test company card improvements**

Click on different companies and verify:
- Logo displays with improved shadow
- Name has gradient text effect
- Stats show with green numbers
- Credit ratings display properly
- Risk badges have gradient backgrounds
- Card scrolls smoothly if content overflows

**Step 6: Commit**

```bash
git add index.html
git commit -m "feat: enhance company card with credit ratings and improved styling"
```

---

## Task 3: Improved Tooltip Design

**Files:**
- Modify: `index.html` (CSS lines 40-50, JS tooltip render function)

**Step 1: Add CSS for multi-column tooltip**

```css
/* Enhanced Tooltip */
#tt {
  background: linear-gradient(180deg, rgba(20,20,20,0.98) 0%, rgba(12,12,12,0.96) 100%);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.4);
  border-radius: 8px;
  max-width: 500px;
}

#tt .tn {
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

#tt .td {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 10px;
}

#tt .td-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

#tt .td-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 10px;
}

#tt .td-label {
  color: #888;
  text-transform: uppercase;
  font-size: 8px;
  letter-spacing: 0.5px;
  min-width: 70px;
}

#tt .td-value {
  color: #ddd;
  font-weight: 500;
}

#tt .source-link {
  color: #86b7ff;
  text-decoration: none;
  border-bottom: 1px solid rgba(134,183,255,0.3);
  transition: all 0.2s;
}

#tt .source-link:hover {
  color: #a8d0ff;
  border-bottom-color: rgba(134,183,255,0.6);
}

#tt .confidence-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.confidence-high { background: rgba(76,175,80,0.2); color: #66bb6a; border: 1px solid rgba(76,175,80,0.4); }
.confidence-medium { background: rgba(255,193,7,0.2); color: #ffb300; border: 1px solid rgba(255,193,7,0.4); }
.confidence-low { background: rgba(158,158,158,0.2); color: #9e9e9e; border: 1px solid rgba(158,158,158,0.4); }
```

**Step 2: Update tooltip rendering function**

Find tooltip render code and update to use multi-column layout:

```javascript
function renderTooltip(d) {
  const tt = document.getElementById('tt');
  
  // Check for source verification
  const verified = d.confidence === 'high' || d.sourceId;
  const confidenceClass = `confidence-${d.confidence || 'low'}`;
  const confidenceLabel = (d.confidence || 'low').charAt(0).toUpperCase() + (d.confidence || 'low').slice(1);
  
  tt.innerHTML = `
    <div class="tn">${d.label || d.id}</div>
    <div class="tf">${d.kind || 'Node'} · <span class="confidence-badge ${confidenceClass}">${confidenceLabel} Confidence</span></div>
    <div class="td">
      <div class="td-col">
        ${d.country ? `
          <div class="td-item">
            <span class="td-label">Country</span>
            <span class="td-value">${d.country}</span>
          </div>
        ` : ''}
        ${d.type ? `
          <div class="td-item">
            <span class="td-label">Type</span>
            <span class="td-value">${d.type}</span>
          </div>
        ` : ''}
      </div>
      <div class="td-col">
        ${d.value ? `
          <div class="td-item">
            <span class="td-label">Value</span>
            <span class="td-value">${formatValue(d.value)}</span>
          </div>
        ` : ''}
        ${verified ? `
          <div class="td-item">
            <span class="td-label">Source</span>
            <span class="td-value">✓ Verified</span>
          </div>
        ` : ''}
      </div>
    </div>
    ${d.sourceUrl ? `
      <div class="tu">
        <a href="${d.sourceUrl}" target="_blank" rel="noopener" class="source-link">View Source →</a>
      </div>
    ` : ''}
  `;
  
  positionTooltip(d);
  tt.style.display = 'block';
}
```

**Step 3: Test tooltip improvements**

Hover over different nodes and verify:
- Two-column layout displays properly
- Confidence badge shows correct color
- Source links are clickable
- Tooltip positions correctly

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: improve tooltip with multi-column layout and confidence badges"
```

---

## Task 4: Smooth Transitions and Micro-interactions

**Files:**
- Modify: `index.html` (CSS and JS animation functions)

**Step 1: Add CSS transitions**

```css
/* Smooth Transitions */
#companyCard, #tt, #filterPanel, #provenanceDrawer {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

#bar button, #bar select {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

#bar button:hover {
  transform: translateY(-1px);
}

#bar button:active {
  transform: translateY(0);
}

.node {
  transition: filter 0.2s ease, opacity 0.2s ease;
}

.node:hover {
  filter: brightness(1.2) drop-shadow(0 0 8px currentColor);
}

.link {
  transition: opacity 0.2s ease;
}

/* Fade in animation */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

#companyCard.show, #tt.show, .modal.show {
  animation: fadeIn 0.2s ease forwards;
}

/* Button press effect */
.btn-press {
  transition: transform 0.05s ease;
}

.btn-press:active {
  transform: scale(0.96);
}
```

**Step 2: Add page load fade-in**

Add to body styles:

```css
body {
  animation: pageFadeIn 0.4s ease forwards;
}

@keyframes pageFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**Step 3: Add micro-interaction JavaScript**

Add after initialization:

```javascript
// Button press micro-interactions
document.querySelectorAll('#bar button, #companyCard button').forEach(btn => {
  btn.classList.add('btn-press');
});

// Smooth mode transitions
function transitionToProfile(symbol) {
  const card = document.getElementById('companyCard');
  card.style.opacity = '0';
  card.style.transform = 'translateY(8px)';
  
  setTimeout(() => {
    showCompanyCard(symbol);
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
  }, 150);
}
```

**Step 4: Test animations**

Refresh and verify:
- Page fades in smoothly
- Buttons have hover lift effect
- Company card fades in when opened
- Nodes brighten on hover

**Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add smooth transitions and micro-interactions"
```

---

## Task 5: Mobile Experience Improvements

**Files:**
- Modify: `index.html` (media queries and mobile sheet)

**Step 1: Enhance mobile CSS**

Update media queries:

```css
@media (max-width: 768px) {
  #bar {
    display: none;
  }
  
  #companyCard {
    width: calc(100% - 16px);
    right: 8px;
    left: 8px;
    top: 80px !important;
    max-height: calc(100vh - 100px);
  }
  
  #searchWrap {
    top: 12px;
    right: 8px;
    width: calc(100% - 100px);
  }
  
  #subtitle {
    display: none;
  }
  
  .st {
    gap: 10px;
  }
  
  .st b {
    font-size: 14px;
  }
  
  .st span {
    font-size: 7px;
  }
  
  #lg {
    max-width: 80vw;
  }
  
  #mobileToggle {
    display: block;
    position: fixed;
    left: 8px;
    bottom: 8px;
    z-index: 130;
    background: linear-gradient(135deg, #1a1a1a, #222);
    border: 1px solid #333;
    color: #ddd;
    padding: 10px 14px;
    font-size: 9px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  
  #mobileSheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 140;
    background: linear-gradient(180deg, rgba(8,8,8,0.98) 0%, rgba(8,8,8,0.99) 100%);
    border-top: 1px solid #2a2a2a;
    padding: 12px;
    border-radius: 12px 12px 0 0;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.4);
  }
  
  #mobileSheet .mGrid {
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  
  #mobileSheet button {
    background: linear-gradient(135deg, #1a1a1a, #222);
    border: 1px solid #333;
    color: #aaa;
    padding: 10px 8px;
    font-size: 8px;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    border-radius: 6px;
    transition: all 0.15s;
  }
  
  #mobileSheet button:hover, #mobileSheet button:active {
    border-color: var(--acc);
    color: var(--acc);
    transform: translateY(-2px);
  }
  
  /* Improve touch targets */
  #bar button, #bar select, #companyCard button {
    min-height: 36px;
    min-width: 36px;
  }
  
  /* Larger tooltips on mobile */
  #tt {
    max-width: calc(100vw - 24px);
    padding: 14px;
  }
}
```

**Step 2: Test mobile view**

Use browser dev tools to test at 375px width:
- Mobile controls button visible
- Company card spans full width
- Touch targets are large enough
- Grid has 4 columns

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: improve mobile experience with better touch targets and layout"
```

---

## Task 6: Final Polish and Testing

**Files:**
- All modified: `index.html`

**Step 1: Run full test suite**

```bash
node --test tests/*.test.mjs
```

Expected: 103/103 tests still passing

**Step 2: Browser verification checklist**

Test in Chrome, Firefox, Safari:

- [ ] Page loads with fade-in animation
- [ ] Stats count up smoothly
- [ ] Live indicator pulses
- [ ] Company card opens with animation
- [ ] Credit ratings display correctly
- [ ] Tooltips show multi-column layout
- [ ] Confidence badges color-coded
- [ ] Buttons have hover effects
- [ ] Mobile view works properly
- [ ] All interactions smooth (60fps)

**Step 3: Performance check**

Open DevTools Performance tab:
- Record page load
- Verify no long tasks (>50ms)
- Check for forced synchronous layouts
- Verify 60fps animations

**Step 4: Accessibility check**

- Tab through all interactive elements
- Verify focus states visible
- Check color contrast (WCAG AA)
- Test with screen reader

**Step 5: Final commit**

```bash
git add index.html
git commit -m "feat: complete visual and UX polish implementation"
```

---

## Post-Implementation

### Verification Commands

```bash
# Run all tests
node --test tests/*.test.mjs

# Check file size (should be reasonable)
wc -l index.html

# Git status
git status
git log --oneline -5
```

### Expected Results

- **Visual:** Modern, polished interface with smooth animations
- **UX:** Intuitive interactions with clear feedback
- **Performance:** 60fps animations, fast page load
- **Mobile:** Fully responsive with touch-optimized controls
- **Tests:** All 103 tests still passing

### Next Steps

After completing Phase 1, consider implementing:

1. **Phase 2: Data Insights** - Risk scoring, shared supplier analysis
2. **Phase 3: Professional Features** - Command palette, saved views, PDF export

---

## Summary of Changes

| Component | Changes |
|-----------|---------|
| Header | Animated counters, live indicator, gradient text |
| Company Card | Credit ratings, gradient backgrounds, improved scrolling |
| Tooltips | Multi-column layout, confidence badges, source links |
| Animations | Fade-ins, hover effects, button press, smooth transitions |
| Mobile | Larger touch targets, improved layout, 4-column grid |

**Total Estimated Time:** 45-60 minutes
**Files Modified:** 1 (`index.html`)
**Commits:** 5-6 focused commits
