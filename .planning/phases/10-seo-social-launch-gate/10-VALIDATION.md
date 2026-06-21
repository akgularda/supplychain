---
phase: 10
slug: seo-social-launch-gate
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-21
---

# Phase 10 — Validation Strategy

> SEO/OG/Twitter/JSON-LD tags present + well-formed; og:image exists at the canonical subpath; deploy ships it;
> auto-update pipeline intact; final gate proves tests green + Lighthouse recorded. Honest copy, no false claims.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `node --test` (`.mjs`) + Playwright (og-card gen + Lighthouse) |
| **Config file** | `package.json scripts.test` (register new file!) |
| **Command** | `npm test` |
| **Runtime** | ~10–25 s |

## Sampling Rate
- After each task commit: `npm test`
- Lighthouse run recorded before the gate
- Before verification: full suite green (294 + SEO test)

## Per-Task Verification Map

| Task | Wave | Req | Test Type | Assertion | Status |
|------|------|-----|-----------|-----------|--------|
| SEO/OG/Twitter/JSON-LD tags in <head> | 1 | PERF-04 | string | meta description + canonical (https://akgularda.github.io/supplychain/) + og:type/site_name/title/description/url/image/image:width=1200/height=630/alt + twitter:card=summary_large_image/title/description/image + valid application/ld+json (WebSite+Organization); NO bare <script> before </body> (index-ui-integrity green) | ⬜ |
| og:image 1200×630 generated | 1 | PERF-04 | unit/file | assets/og-card.png exists, ~1200×630; referenced absolute URL matches; deploy-pages.yml copies assets/ | ⬜ |
| register SEO test | 1 | PERF-04 | infra | tests/seo-meta.test.mjs in package.json scripts.test | ⬜ |
| launch gate: Lighthouse + deploy + pipeline | 2 | PERF-05 | gate | `npm test` green; Lighthouse recorded in docs/perf/ (honor paint caveat); deploy ships index/styles/js/data/assets(og-card); auto-update-data.yml intact | ⬜ |
| LAUNCH.md checklist | 2 | PERF-05 | doc | LAUNCH.md summarizes trust/depth/UX/perf/SEO/gate with real status | ⬜ |
| final gate + suite | 3 | PERF-04/05 | regression | full `npm test` green; all metadata valid | ⬜ |

## Wave 0 Requirements
- [ ] Register tests/seo-meta.test.mjs in package.json scripts.test

## Manual-Only Verifications
| Behavior | Req | Why Manual | Instructions |
|----------|-----|------------|--------------|
| Social card previews correctly; no custom domain set | PERF-04 | External preview tooling / GH settings | Paste URL into a card validator; confirm GitHub Pages custom-domain setting (no CNAME → default) |

## Validation Sign-Off
- [ ] All SEO/OG/Twitter/JSON-LD tags present + well-formed (string-tested); honest copy
- [ ] og:image exists (1200×630) + shipped by deploy
- [ ] Lighthouse recorded; deploy + auto-update pipeline confirmed
- [ ] LAUNCH.md present; new test registered; suite green
- [x] `nyquist_compliant: true`

**Approval:** pending
