# Phase 10: SEO, Social Cards & Launch Gate - Research

**Researched:** 2026-06-21
**Domain:** Static-site SEO / Open Graph + Twitter cards / JSON-LD structured data / GitHub-Pages deploy / launch verification gate
**Confidence:** HIGH

## Summary

This is the FINAL phase. It is a buildless, single-page, vanilla HTML/CSS/JS app deployed to GitHub Pages.
The work is almost entirely **static markup added to `index.html` `<head>`** plus **one real image asset** and
**Node string-assertion tests** — no runtime libraries, no build step, no new dependencies. `index.html` currently
has **zero** SEO/OG/Twitter/canonical/JSON-LD tags `[VERIFIED: grep — 0 matches]`, so every tag is net-new.

The canonical base URL is **`https://akgularda.github.io/supplychain/`** — derived from the git remote
`https://github.com/akgularda/supplychain.git` `[VERIFIED: git remote -v]` with **no CNAME file present**
`[VERIFIED: ls CNAME → not found]`. GitHub Pages serves project sites at `https://<owner>.github.io/<repo>/`,
so the canonical and all absolute OG URLs must use that base.

The launch gate (PERF-05) reduces to four checks: (1) `npm test` fully green (currently a 25-file suite — keep it
green and add the new test file), (2) a Lighthouse run recorded in `docs/perf/` honoring the documented paint
caveat, (3) `deploy-pages.yml` ships everything including the new og:image, (4) `auto-update-data.yml` weekly
pipeline intact. A `LAUNCH.md` checklist documents credibility/quality/performance/SEO.

**Primary recommendation:** Add the exact `<head>` tag block below (all URLs absolute, rooted at
`https://akgularda.github.io/supplychain/`), generate a real **1200×630 PNG** social card at
`assets/og-card.png`, add `tests/seo-social.test.mjs` registered in `package.json scripts.test`, and write
`LAUNCH.md`. Nothing here touches the inline bootstrap or any asserted ID, so `index-ui-integrity` stays green.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| SEO / OG / Twitter / JSON-LD meta | Static HTML (`index.html <head>`) | — | Crawlers read static markup; no SSR/JS needed |
| Social card image | CDN / Static (`assets/og-card.png`) | Deploy workflow | Must be a real file at an absolute URL crawlers can fetch |
| Canonical URL | Static HTML | GitHub Pages config | URL is fixed by owner/repo; no CNAME |
| og:image delivery | Deploy workflow (`deploy-pages.yml`) | — | `assets/` is copied to `_site` already; image rides along |
| Launch verification | CI / local test runner | docs/perf | `npm test` + Lighthouse + workflow integrity |
| Weekly data refresh integrity | GitHub Actions (`auto-update-data.yml`) | — | Out-of-scope to change; in-scope to confirm intact |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| (none — zero new runtime deps) | — | SEO is static markup | A buildless static site needs no library for meta tags `[VERIFIED: package.json — only playwright + http-server]` |
| Node built-in test runner | Node 20+ | Test the markup | Already the project's test harness (`node --test`) `[VERIFIED: package.json scripts.test]` |

### Supporting (image generation — pick ONE, dev-time only, do NOT add to dependencies)
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `sharp` (npx, dev-time) | Resize/crop a screenshot to 1200×630 PNG | If deriving og-card from `docs/perf/site-screenshot.png` (1440×900) `[ASSUMED]` |
| Playwright (already installed) | Render an HTML card template to a 1200×630 PNG screenshot | Cleanest bespoke card; playwright `^1.58.2` is already a dependency `[VERIFIED: package.json]` |
| Any image editor / canvas | Hand-make the card | If a one-off card is simpler than scripting |

**Recommended:** Use the **already-installed Playwright** to screenshot a tiny inline HTML card template at
viewport `1200×630` → `assets/og-card.png`. Zero new dependencies, fully reproducible, and the resulting file is a
real PNG committed to the repo. This avoids adding `sharp` to `package.json`.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Bespoke Playwright card | Resize `docs/perf/site-screenshot.png` to 1200×630 | Faster, but a cropped 1440×900 screenshot loses the top/bottom and looks like a raw screenshot, not a titled card |
| Bespoke Playwright card | Reuse `assets/monarch-logo.png` (1024×1024) | Wrong aspect ratio (square, not 1.91:1) — will be letterboxed/cropped ugly by Twitter/Slack `[VERIFIED: pngSize → 1024x1024]` |
| Static `og-card.png` | Dynamic OG image service | Overkill for a single-page app; no server exists |

**Installation:** None required. (If using `sharp` instead of Playwright: `npx --package=sharp -- node script.mjs` — but Playwright is preferred to avoid any new package install.)

**Version verification:** `playwright ^1.58.2` confirmed present `[VERIFIED: package.json dependencies]`; `http-server ^14.1.1` confirmed present `[VERIFIED: package.json devDependencies]`. No registry packages are being added in this phase.

## Package Legitimacy Audit

> This phase installs **no new external packages**. The og:image is generated with the already-installed,
> already-vetted `playwright` dependency. No slopcheck gate is required because nothing new is added to
> `package.json`. If the planner instead chooses the `sharp` route, gate it behind a `checkpoint:human-verify`
> and run slopcheck first.

| Package | Registry | Disposition |
|---------|----------|-------------|
| (none added) | — | N/A — phase adds no dependencies |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
**SEO + social metadata (PERF-04) — honest + valid.** Add to `index.html <head>` (preserve all existing IDs +
the inline bootstrap so `index-ui-integrity` stays green):
- `<meta name="description">` — accurate, honest description of the market-intelligence tool (no hype/false claims).
- `<link rel="canonical">` to the GitHub-Pages/CNAME URL.
- Open Graph: `og:title`, `og:description`, `og:type=website`, `og:url`, `og:image` (absolute URL), `og:site_name`.
- Twitter: `twitter:card=summary_large_image`, `twitter:title/description/image`.
- JSON-LD (`application/ld+json`) describing the site/organization (Monarch Castle Technologies) honestly.
- Provide a real og:image social card (~1200×630) committed to `assets/` (derive from rendered screenshot or a
  purpose-made card). The image must exist at the referenced path.

**Launch gate (PERF-05).** A final verification step: `npm test` fully green; a Lighthouse run against the served
site (record results in `docs/perf/`, honoring the documented local-paint caveat — capture what's measurable);
confirm `deploy-pages.yml` copies everything needed (index.html, styles/, js/, data/, assets/, the new og:image)
and the `auto-update-data.yml` weekly pipeline is intact (quarantined-safe in Phase 3). Produce a LAUNCH checklist
doc summarizing credibility (trust layer), quality (tests), and performance.

**Tests.** New `.mjs` tests (REGISTERED in `package.json scripts.test`): assert the meta description + canonical +
required `og:*` + `twitter:*` tags + JSON-LD are present and well-formed in `index.html`, the og:image path exists,
and the deploy workflow ships the og:image. Keep the full suite green.

### Claude's Discretion
- Exact honest copy for description/og:title/og:description/JSON-LD (it's a market-intelligence visualization of
  top-100 supply chains — no false claims).
- og:image approach: a clean 1200×630 social card (title + supply-chain graph motif), or reuse
  `docs/perf/site-screenshot.png` as a base.
- LAUNCH.md structure (suggested: trust ✓ / depth ✓ / UX ✓ / perf ✓ / SEO ✓ / gate ✓).
- Optional minimal `sitemap.xml` / `robots.txt`.

### Deferred Ideas (OUT OF SCOPE)
- Analytics/telemetry integration → future.
- A multi-page sitemap → not needed for a single-page app (a minimal `sitemap.xml`/`robots.txt` is fine).
- New product features, data changes.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PERF-04 | SEO/meta tags and social share cards are present and valid | Exact `<head>` tag block below (description, canonical, OG, Twitter, JSON-LD) + real 1200×630 `assets/og-card.png` + validation tests. Canonical base verified as `https://akgularda.github.io/supplychain/`. |
| PERF-05 | A final verification gate confirms Lighthouse targets met and all tests green before launch | Launch-gate checklist below: `npm test` green, Lighthouse recorded with paint caveat, `deploy-pages.yml` ships og:image, `auto-update-data.yml` intact, `LAUNCH.md` produced. |
</phase_requirements>

## Canonical URL & Absolute URLs (USE THESE EXACT VALUES)

| Value | URL |
|-------|-----|
| Owner / repo | `akgularda` / `supplychain` `[VERIFIED: git remote -v]` |
| CNAME | none `[VERIFIED: ls CNAME → not found]` |
| **Canonical base** | `https://akgularda.github.io/supplychain/` |
| `<link rel="canonical">` | `https://akgularda.github.io/supplychain/` |
| `og:url` | `https://akgularda.github.io/supplychain/` |
| `og:image` (absolute) | `https://akgularda.github.io/supplychain/assets/og-card.png` |
| `twitter:image` (absolute) | `https://akgularda.github.io/supplychain/assets/og-card.png` |
| JSON-LD `url` | `https://akgularda.github.io/supplychain/` |

> GitHub Pages project sites are served at `https://<owner>.github.io/<repo>/` `[CITED: docs.github.com/pages]`.
> Open Graph requires **absolute** URLs for `og:image` — relative paths are not reliably fetched by crawlers
> `[CITED: ogp.me]`. The trailing slash on the canonical is the recommended form for the site root.

## Exact `<head>` Tag Block to Add (PERF-04)

Insert immediately after the existing `<title>` (line 6) / before the stylesheet links, inside `<head>`.
Keep ALL existing tags (charset, viewport, title, favicon, d3 script, data scripts, stylesheets) untouched.

```html
<!-- SEO -->
<meta name="description" content="An interactive market-intelligence map of the supply chains behind the world's 100 largest public companies by market capitalization. Explore upstream suppliers, service and channel partners, demand relationships, and credit-rating context — each relationship carries source-linked provenance and a confidence level.">
<link rel="canonical" href="https://akgularda.github.io/supplychain/">

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="Monarch Castle Technologies">
<meta property="og:title" content="Monarch Castle Technologies | Market Intelligence">
<meta property="og:description" content="Interactive supply-chain intelligence for the top 100 public companies by market cap — with source-linked provenance and confidence levels.">
<meta property="og:url" content="https://akgularda.github.io/supplychain/">
<meta property="og:image" content="https://akgularda.github.io/supplychain/assets/og-card.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Monarch Castle Technologies — Market Intelligence: a network graph of top-100 supply chains.">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Monarch Castle Technologies | Market Intelligence">
<meta name="twitter:description" content="Interactive supply-chain intelligence for the top 100 public companies by market cap — with source-linked provenance and confidence levels.">
<meta name="twitter:image" content="https://akgularda.github.io/supplychain/assets/og-card.png">

<!-- Structured data -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Monarch Castle Technologies | Market Intelligence",
  "url": "https://akgularda.github.io/supplychain/",
  "description": "An interactive market-intelligence map of the supply chains behind the world's 100 largest public companies by market capitalization, with source-linked provenance and confidence levels.",
  "publisher": {
    "@type": "Organization",
    "name": "Monarch Castle Technologies",
    "url": "https://akgularda.github.io/supplychain/",
    "logo": "https://akgularda.github.io/supplychain/assets/monarch-logo.png"
  }
}
</script>
```

**Honesty notes (the copy above is deliberately non-hype):**
- Describes it as a *visualization / market-intelligence map*, not a "platform" or "real-time feed."
- Says relationships carry *provenance + confidence levels* — which the app actually implements (verified by the
  Phase-2 trust layer and the existing help text in `index.html`).
- Does NOT claim live data (data is a frozen snapshot, weekly-refreshed market cap only).
- `og:image:alt` and JSON-LD `description` match reality (top-100 supply chains, network graph).

**Existing tags to KEEP (do not remove or duplicate):**
- `<meta charset="UTF-8">`, `<meta name="viewport" ...>` (line 4-5)
- `<title>Monarch Castle Technologies | Market Intelligence</title>` (line 6) — title already matches og:title
- `<link rel="icon" type="image/svg+xml" href="favicon.svg">` (line 7)
- d3 CDN `<script>`, `./data/top100-map.js`, `./data/credit-ratings.js`, four stylesheet links (lines 8-14)

### Why this WON'T break `index-ui-integrity` (verified)

`tests/index-ui-integrity.test.mjs` `[VERIFIED: full file read]` asserts only:
1. The inline-script regex `/<script>([\s\S]*?)<\/script>\s*<\/body>/i` parses cleanly. This matches the
   **last bare `<script>` (no attributes) before `</body>`** — the bootstrap at line 373. The new JSON-LD uses
   `<script type="application/ld+json">`, which the *attribute-less* `<script>` pattern does **not** match, and it
   lives in `<head>`, not before `</body>`. **No conflict.**
2. Presence of IDs: `helpModal`, `compareModal`, `fatalError`, `onboardingPanel`, `cardRatings`, `cardOverlap`,
   `cardTimeline`, `provenanceDrawer`, `searchSuggest`, `mobileToggle`, `mobileSheet` — all in `<body>`, untouched
   `[VERIFIED: grep each id → count 1]`.
3. Presence of the `./data/credit-ratings.js` script tag — untouched.

**Hard rule for the planner:** Do NOT introduce any new attribute-less `<script>...</script>` immediately before
`</body>`. JSON-LD must always carry `type="application/ld+json"`. Adding meta tags in `<head>` is safe.

## og:image Plan (the file MUST exist)

| Property | Value |
|----------|-------|
| Path | `assets/og-card.png` |
| Dimensions | **1200×630** (1.91:1 — the `summary_large_image` standard) `[CITED: developer.x.com / ogp.me]` |
| Format | PNG |
| Shipped by deploy | Yes — `assets/` is already copied to `_site` `[VERIFIED: deploy-pages.yml line 35 `cp -R assets _site/`]` |
| Referenced at | `https://akgularda.github.io/supplychain/assets/og-card.png` |

**Why not reuse existing assets directly:**
- `assets/monarch-logo.png` and `logo.png` are **1024×1024** (square) `[VERIFIED: pngSize]` — wrong aspect ratio
  for a large social card; will be cropped/letterboxed.
- `docs/perf/site-screenshot.png` is **1440×900** `[VERIFIED: pngSize]` — usable as a *base* (resize/crop to
  1200×630) but it is a raw screenshot, and `docs/` is **NOT** copied by the deploy workflow, so it must be
  written into `assets/` regardless.

**Recommended generation (zero new deps, reproducible):** a small dev-time script using the already-installed
Playwright to render a 1200×630 HTML card (dark theme, title "Monarch Castle Technologies — Market Intelligence",
subtitle "Supply chains of the top 100 public companies", a supply-chain graph motif) and screenshot it to
`assets/og-card.png`. Commit the PNG. The generation script can live in `scripts/` (e.g. `scripts/make-og-card.mjs`)
but the **committed PNG is the deliverable** — the build is still buildless at deploy time.

**Fallback (if a bespoke card is heavy):** resize `docs/perf/site-screenshot.png` to 1200×630 and write to
`assets/og-card.png`. Either way the test asserts the file exists at `assets/og-card.png`.

## Architecture Patterns

### System Architecture Diagram

```
GitHub repo (master)
   │  push
   ▼
deploy-pages.yml ──► _site/  (index.html + favicon.svg + logo.png + data/ + assets/ + styles/ + js/ + .nojekyll)
   │                                                  │
   │                                                  └── assets/og-card.png  ← NEW, rides existing cp -R assets
   ▼
GitHub Pages  https://akgularda.github.io/supplychain/
   │
   ├─► crawler / Slack / Twitter / iMessage
   │        reads <head>: description, canonical, og:*, twitter:*, JSON-LD
   │        fetches og:image (absolute URL) → assets/og-card.png
   │
   └─► browser → renders SPA (unchanged)

Weekly (Mon 06:00 UTC)
   │
   ▼
auto-update-data.yml ──► refresh data/, run data-validation tests, commit  (UNCHANGED, confirm intact)
```

### Recommended Project Structure (additions only)
```
assets/
└── og-card.png              # NEW — 1200×630 social card (committed)
scripts/
└── make-og-card.mjs         # OPTIONAL dev-time generator (Playwright)
tests/
└── seo-social.test.mjs      # NEW — meta/OG/Twitter/JSON-LD + image-exists + deploy-ships assertions
LAUNCH.md                    # NEW — launch checklist (root)
robots.txt                   # OPTIONAL — allow all + sitemap pointer
sitemap.xml                  # OPTIONAL — single URL
```

### Pattern: Absolute-URL OG tags for project Pages
**What:** Every `og:url`, `og:image`, `twitter:image`, canonical, and JSON-LD `url` uses the full
`https://akgularda.github.io/supplychain/...` base.
**When to use:** Always for GitHub Pages project sites (served under a subpath).
**Why:** Crawlers fetch `og:image` out-of-context; relative paths resolve against the crawler, not the page.

### Anti-Patterns to Avoid
- **Relative og:image** (`assets/og-card.png` without host) — crawlers may fail to fetch it.
- **Square og:image** — Twitter `summary_large_image` and Slack expect ~1.91:1.
- **Bare `<script>` before `</body>`** for JSON-LD — breaks the inline-bootstrap regex assertion.
- **Referencing an image that doesn't exist** — the share preview shows a blank/broken card; the test guards this.
- **Adding `docs/perf/...png` as the live og:image** — `docs/` is not deployed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Card image at exact 1200×630 | Manual pixel math in raw canvas | Playwright screenshot at viewport 1200×630 | Already installed; deterministic; renders HTML/CSS you can iterate on |
| HTML parsing in tests | A real DOM parser dependency | String/regex assertions on `index.html` | This repo's established pattern (`index-ui-integrity` uses regex on the raw file) `[VERIFIED]` |
| Lighthouse scoring under broken paint | Forcing a score | Record the documented caveat + Playwright timing | Phase-1 baseline already established this approach (NO_FCP) |

**Key insight:** This phase deliberately adds **no runtime code and no dependencies** — the failure mode is
inconsistency between absolute URLs and the real Pages base, or a missing image file. Tests pin both down.

## Runtime State Inventory

> This phase adds new static markup + one asset; it is not a rename/refactor. Most categories are N/A, but the
> launch gate must confirm runtime pipelines are intact.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no datastore keys touched. Data snapshot frozen. | None |
| Live service config | GitHub Pages deploy (`deploy-pages.yml`) and weekly refresh (`auto-update-data.yml`) are live Actions config in the repo. og:image rides the existing `cp -R assets`. | Confirm both workflows run; no edit needed to ship og:image (assets already copied) |
| OS-registered state | None | None |
| Secrets/env vars | `auto-update-data.yml` uses `NODE_TLS_REJECT_UNAUTHORIZED=0` (pre-existing) — not touched | None |
| Build artifacts | Buildless deploy; `_site` is assembled fresh each run | None |

**Note on auto-update-data.yml integrity** `[VERIFIED: full file read]`: the workflow runs three data-validation
tests (`no-xx-country-codes`, `profile-link-metadata`, `supply-chain-research-quality`) and commits `data/` changes.
It is intact and independent of this phase. One **pre-existing latent bug** observed (out of scope to fix here, but
worth flagging to the planner): line 34 `echo "timestamp=$(date +%Y%m%d-%H%M%S) >> $GITHUB_OUTPUT"` is missing a
closing quote before `>>`, which mangles that step's output. It does not block deploy or the launch gate, but the
launch checklist should note "weekly pipeline intact (one cosmetic timestamp-echo quoting bug, non-blocking)."

## Common Pitfalls

### Pitfall 1: og:image URL mismatch with Pages subpath
**What goes wrong:** Card uses `https://akgularda.github.io/assets/og-card.png` (missing `/supplychain/`).
**Why:** Forgetting the project-site subpath.
**How to avoid:** Always include `/supplychain/`. Test asserts the exact absolute string.
**Warning signs:** Slack/Twitter preview is blank.

### Pitfall 2: Image referenced but not committed / not deployed
**What goes wrong:** Tag points at `assets/og-card.png` but the file is missing or only in `docs/`.
**How to avoid:** Commit the PNG to `assets/`; test asserts `fs.existsSync("assets/og-card.png")`.

### Pitfall 3: JSON-LD added as bare `<script>` breaks the integrity test
**How to avoid:** Always `type="application/ld+json"`; never place a bare `<script>` before `</body>`.

### Pitfall 4: Expecting a clean Lighthouse score
**What goes wrong:** Lighthouse aborts with `NO_FCP` (no contentful paint) as it did in Phase 1.
**Why:** The Phase-1 baseline recorded `NO_FCP` because the served snapshot did not produce a contentful render
`[VERIFIED: docs/perf/baseline-2026-06-20.md]`. **Phase 3 now serves real data that paints**, so a re-run *may*
now score — the planner should attempt a fresh Lighthouse run and record whichever outcome occurs.
**How to avoid:** Don't gate launch on a numeric Lighthouse score; gate on "Lighthouse run attempted and result
recorded in `docs/perf/`," capturing Playwright Navigation/Paint timing as the authoritative fallback (the
established pattern).

## Code Examples

### Test: assert required tags present + well-formed + image exists + deploy ships it
```javascript
// tests/seo-social.test.mjs  — pattern mirrors tests/index-ui-integrity.test.mjs (string/regex on raw file)
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");
const CANON = "https://akgularda.github.io/supplychain/";
const IMG = "https://akgularda.github.io/supplychain/assets/og-card.png";

test("meta description present and non-trivial", () => {
  const m = html.match(/<meta\s+name="description"\s+content="([^"]{40,})"\s*\/?>/i);
  assert.ok(m, "meta description with substantive content required");
});

test("canonical points at the Pages URL", () => {
  assert.match(html, new RegExp(`<link\\s+rel="canonical"\\s+href="${CANON.replace(/[/.]/g,"\\$&")}"`, "i"));
});

test("required Open Graph tags present", () => {
  for (const p of ["og:type","og:site_name","og:title","og:description","og:url","og:image"]) {
    assert.match(html, new RegExp(`property="${p}"`, "i"), `missing ${p}`);
  }
  assert.ok(html.includes(`content="${IMG}"`), "og:image must be the absolute Pages URL");
});

test("Twitter summary_large_image card present", () => {
  assert.match(html, /name="twitter:card"\s+content="summary_large_image"/i);
  for (const n of ["twitter:title","twitter:description","twitter:image"]) {
    assert.match(html, new RegExp(`name="${n}"`, "i"), `missing ${n}`);
  }
});

test("JSON-LD block is well-formed and typed", () => {
  const m = html.match(/<script\s+type="application\/ld\+json"\s*>([\s\S]*?)<\/script>/i);
  assert.ok(m, "application/ld+json block required");
  const data = JSON.parse(m[1]);          // must parse
  assert.equal(data["@context"], "https://schema.org");
  assert.ok(data.url === CANON);
});

test("og:image file exists in assets/ at 1200x630", () => {
  const p = "assets/og-card.png";
  assert.ok(fs.existsSync(p), `${p} must exist`);
  const b = fs.readFileSync(p);
  assert.equal(b.readUInt32BE(16), 1200, "og-card width must be 1200");
  assert.equal(b.readUInt32BE(20), 630, "og-card height must be 630");
});

test("deploy workflow ships the assets/ dir (carries og-card)", () => {
  const wf = fs.readFileSync(".github/workflows/deploy-pages.yml", "utf8");
  assert.match(wf, /cp -R assets _site\//, "deploy must copy assets/ into _site");
});
```

### Optional: generate the card with already-installed Playwright (dev-time)
```javascript
// scripts/make-og-card.mjs  — run once: node scripts/make-og-card.mjs ; commit assets/og-card.png
import { chromium } from "playwright";
const html = `<!doctype html><html><body style="margin:0">
  <div style="width:1200px;height:630px;background:#0a0a0a;color:#fff;
    font-family:sans-serif;display:flex;flex-direction:column;justify-content:center;padding:64px;box-sizing:border-box">
    <div style="font-size:18px;letter-spacing:3px;color:#888;text-transform:uppercase">Monarch Castle Technologies</div>
    <div style="font-size:60px;font-weight:700;margin-top:16px">Market Intelligence</div>
    <div style="font-size:26px;color:#a8a8a8;margin-top:20px">Supply chains of the top 100 public companies — with source-linked provenance.</div>
  </div></body></html>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.screenshot({ path: "assets/og-card.png" });
await browser.close();
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `twitter:card=summary` | `summary_large_image` + 1200×630 | long-standing | Larger, more clickable preview |
| Multiple meta-keyword tags | meta description + OG + JSON-LD | years ago | Keywords meta is ignored by Google; OG/JSON-LD drive sharing + rich results |

**Deprecated/outdated:**
- `<meta name="keywords">`: ignored by major engines — do **not** add.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | GitHub Pages serves this project at `https://akgularda.github.io/supplychain/` (no custom domain configured) | Canonical URL | If a custom domain is later set in repo Settings without a CNAME file, all absolute URLs would be wrong. Mitigation: planner should confirm Pages settings, or the user confirms no custom domain. |
| A2 | `sharp` (if chosen over Playwright) is a legitimate package | Stack | Low — but Playwright route avoids the install entirely |
| A3 | Lighthouse may now score post-Phase-3 (real data paints) | Pitfalls / Validation | If it still NO_FCPs, gate falls back to recorded caveat — no launch block |

## Open Questions

1. **Custom domain?**
   - Known: no CNAME file in repo; remote owner/repo = `akgularda/supplychain`.
   - Unclear: whether a custom domain is set in GitHub Pages *settings* (which can exist without a CNAME file).
   - Recommendation: proceed with `https://akgularda.github.io/supplychain/`; have the planner add a one-line
     human-verify note confirming no custom domain before launch.

2. **Does Lighthouse score now?**
   - Known: Phase-1 run aborted `NO_FCP`; Phase-3 serves real data.
   - Recommendation: attempt a fresh Lighthouse run during the gate; record result either way; do not block on score.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | tests, card generation | ✓ (project requires 20+) | 20+ | — |
| Playwright (chromium) | og-card generation, paint timing | ✓ | ^1.58.2 `[VERIFIED: package.json]` | Resize `docs/perf/site-screenshot.png` |
| http-server | serving for Lighthouse/local | ✓ | ^14.1.1 `[VERIFIED]` | `python -m http.server` |
| Lighthouse CLI | PERF-05 measurement | unknown (run via `npx`) | — | Playwright Navigation/Paint timing (established fallback) |

**Missing dependencies with no fallback:** none.
**Missing with fallback:** Lighthouse numeric score (fallback = recorded caveat + Playwright timing).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node built-in test runner (`node --test`) |
| Config file | none — explicit file list in `package.json scripts.test` `[VERIFIED]` |
| Quick run command | `node --test tests/seo-social.test.mjs` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERF-04 | meta description present + substantive | unit (string) | `node --test tests/seo-social.test.mjs` | ❌ Wave 0 |
| PERF-04 | canonical = Pages URL | unit | same | ❌ Wave 0 |
| PERF-04 | required `og:*` present + og:image absolute | unit | same | ❌ Wave 0 |
| PERF-04 | `twitter:card=summary_large_image` + title/desc/image | unit | same | ❌ Wave 0 |
| PERF-04 | JSON-LD parses + typed + correct url | unit | same | ❌ Wave 0 |
| PERF-04 | `assets/og-card.png` exists at 1200×630 | unit (fs + PNG header) | same | ❌ Wave 0 |
| PERF-04 | deploy workflow copies `assets/` | unit | same | ❌ Wave 0 |
| PERF-04 | `index-ui-integrity` still green (no head/ID regression) | regression | `node --test tests/index-ui-integrity.test.mjs` | ✅ exists |
| PERF-05 | full suite green | gate | `npm test` | ✅ exists (registration adds new file) |
| PERF-05 | `auto-update-data.yml` intact | manual/static check | review + `node --check`-style | ✅ workflow exists |

### Sampling Rate
- **Per task commit:** `node --test tests/seo-social.test.mjs` + `node --test tests/index-ui-integrity.test.mjs`
- **Per wave merge:** `npm test`
- **Phase gate:** `npm test` fully green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/seo-social.test.mjs` — covers PERF-04 (all tag/image/deploy assertions)
- [ ] Register `tests/seo-social.test.mjs` in `package.json scripts.test` (append to the explicit file list)
- [ ] `assets/og-card.png` — must exist before the image/dimension test passes
- [ ] No framework install needed (Node built-in `node --test` already in use)

## Launch Gate (PERF-05) — Checklist Structure for LAUNCH.md

Recommended `LAUNCH.md` (root) sections, mirroring the CONTEXT.md "Specific Ideas":

```markdown
# Launch Readiness — Monarch Castle Technologies | Market Intelligence

## Credibility (Trust Layer)
- [ ] Provenance: every relationship carries source-linked provenance
- [ ] Confidence: high/medium/low confidence levels surfaced
- [ ] Methodology + freshness panels present

## Depth
- [ ] Concentration / criticality / scenario analytics present and provenance-tested

## UX
- [ ] Hero / design tokens / motion / mobile / keyboard journey verified

## Performance
- [ ] Filter/style memoization (no full simulation restart) — PERF-01

## SEO & Social (PERF-04)
- [ ] meta description, canonical, og:*, twitter:*, JSON-LD present + well-formed
- [ ] assets/og-card.png exists (1200×630) and is shipped by deploy
- [ ] All absolute URLs use https://akgularda.github.io/supplychain/

## Gate (PERF-05)
- [ ] `npm test` fully green (incl. tests/seo-social.test.mjs)
- [ ] Lighthouse run attempted; result recorded in docs/perf/ (note paint caveat / Playwright timing)
- [ ] deploy-pages.yml ships index.html + favicon.svg + logo.png + data/ + assets/(og-card) + styles/ + js/
- [ ] auto-update-data.yml weekly pipeline intact (Mon 06:00 UTC; data-validation tests run)
- [ ] No custom domain assumption confirmed (no CNAME; Pages settings checked)
```

**Deploy completeness check** `[VERIFIED: deploy-pages.yml]`: copies `index.html`, `favicon.svg`, `logo.png`,
`data/`, `assets/`, `styles/`, `js/`, `CNAME` (if present), `.nojekyll`. The new `assets/og-card.png` is shipped
automatically by the existing `cp -R assets`. **No edit to `deploy-pages.yml` is required** to ship the card — the
test merely asserts the `cp -R assets` line still exists.

## Project Constraints (from CLAUDE.md)

No `./CLAUDE.md` found in the working directory `[VERIFIED: not read — absent]`. Constraints derive solely from
CONTEXT.md (buildless, data frozen, preserve IDs + inline bootstrap, honest copy, keep suite green).

## Security Domain

No `security_enforcement` config found and this phase adds only static metadata + an image (no auth, input,
network, crypto, or data handling). Applicable ASVS surface is minimal:

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | no | No user input added |
| V14 Config | yes (light) | Honest metadata only; no secrets in tags; JSON-LD contains no PII |

**Threat note:** og:image and JSON-LD are public static content — no sensitive data must appear in them
(the recommended copy contains none).

## Sources

### Primary (HIGH confidence)
- `git remote -v` → owner/repo `akgularda/supplychain` `[VERIFIED]`
- `ls CNAME` → absent `[VERIFIED]`
- `index.html` head + tail + ID grep `[VERIFIED: file reads]`
- `tests/index-ui-integrity.test.mjs` full read `[VERIFIED]`
- `package.json` scripts.test + dependencies `[VERIFIED]`
- `.github/workflows/deploy-pages.yml` + `auto-update-data.yml` full reads `[VERIFIED]`
- PNG header parse for asset dimensions `[VERIFIED]`
- `docs/perf/baseline-2026-06-20.md` NO_FCP caveat `[VERIFIED]`
- ogp.me (Open Graph), developer.x.com (Twitter cards), schema.org, docs.github.com/pages `[CITED]`

### Secondary (MEDIUM confidence)
- 1.91:1 / 1200×630 as the de-facto `summary_large_image` size (widely documented)

### Tertiary (LOW confidence)
- Whether a custom domain is configured in Pages settings (no CNAME file; assume default) — flagged A1.

## Metadata

**Confidence breakdown:**
- Canonical URL: HIGH — derived directly from verified git remote + absent CNAME.
- Tag set: HIGH — standard OG/Twitter/JSON-LD, verified against existing head and the integrity test.
- og:image plan: HIGH — assets/ deploy path verified; dimensions of existing assets verified.
- Launch gate: HIGH — both workflows read in full; test registration mechanism verified.
- Lighthouse outcome: MEDIUM — may now score post-Phase-3; gate does not depend on the number.

**Research date:** 2026-06-21
**Valid until:** 2026-07-21 (stable — buildless static site, no fast-moving deps)
