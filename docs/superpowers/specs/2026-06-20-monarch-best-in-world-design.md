# Monarch Castle Technologies — "Best Supply-Chain Website in the World" Design

**Date:** 2026-06-20
**Status:** Approved (brainstorming) — pending spec review
**Owner:** akgularda

## 1. Context

The site already exists at `github.com/akgularda/supplychain` and deploys to GitHub Pages as
**Monarch Castle Technologies | Market Intelligence**. It is a single-page, D3-powered interactive
visualization of the top 100 companies by market cap and their supply chains, layered with country
macro data, credit ratings, and trade flows (IMF DOTS, World Bank GDP, UN Comtrade). Data
auto-updates weekly via GitHub Actions. The codebase has 103 passing Node tests and a deep existing
feature set (filters, compare, export, keyboard navigation, accessibility, help/onboarding modals).

The site is currently a large monolithic `index.html` with inline CSS and JavaScript.

## 2. Goal & Audience

Elevate the existing tool to a **world-class, investor-facing market-intelligence experience**.

- **Audience:** investors (sophisticated, skeptical of unsourced numbers). No login — fully public.
- **Definition of "best in the world":** credible + beautiful + uniquely deep, in that priority order.

### Non-negotiable rules
- **Only real, sourced data.** Nothing fabricated. Every figure is traceable to a source.
- **Preserve what works:** static GitHub-Pages deploy, the auto-update Actions pipeline, and the
  existing test suite must stay green throughout.

## 3. Approach (chosen)

**Hybrid: thin, safe modularization → then phased value.** Extract CSS/JS into separate static files
(no framework; GitHub Pages keeps serving the files directly), preserve all tests, then execute a
prioritized roadmap. This gives a maintainable foundation *and* fast visible wins without betting the
working deploy on a rewrite.

Approaches considered and rejected:
- **Incremental on the monolith** — fastest, but the giant `index.html` grows unmaintainable.
- **Full refactor + build tool (Vite)** — cleanest foundation, but delays every visible win and
  risks the static deploy and the test suite.

## 4. Architecture

Keep a **buildless static site** servable by GitHub Pages:

- `index.html` — semantic shell only (head/meta, containers, script/style links).
- `styles/` — extracted CSS, split by concern (`base`, `layout`, `components`, `theme`).
- `js/` — ES modules split by responsibility:
  - `data/` — load + normalize `window.SUPPLY_MAP_DATA`, macro maps, ratings.
  - `viz/` — D3 force simulation, rendering, motion.
  - `ui/` — toolbar, filters, compare, modals, onboarding.
  - `trust/` — provenance/confidence scoring and badge rendering.
  - `state.js` — the single `STATE` object + URL state serialization.
- `data/` — unchanged JSON contract; auto-update scripts untouched.
- `tests/` — existing `.mjs` tests stay; new tests added per phase.

Each module has one clear purpose, a documented interface, and is independently testable. No data
contract change in Phase 0 so the auto-update pipeline and tests are unaffected.

## 5. Phase Roadmap

### Phase 0 — Foundation (safety net)
Extract inline CSS/JS into `styles/` and `js/` modules; `index.html` becomes the static shell. Keep
all 103 tests green. Capture a performance + Lighthouse baseline. **No user-visible change.**

**Done when:** site renders identically, all existing tests pass, baseline metrics recorded.

### Phase 1 — Trust layer (credibility first)
- Provenance badge on every displayed figure: `observed` vs `estimated`.
- Inline source links (SEC filing, annual report, etc.) on hover/click.
- Confidence scoring 0–100%, weighted by source type and age decay.
- A dedicated **Methodology** view explaining sources, weighting, and limits.
- Visible data-freshness / "last verified" guarantee tied to the auto-update pipeline.

**Done when:** no major figure is shown without a provenance tag and a reachable source; confidence
and freshness are visible; new tests cover provenance/confidence math.

### Phase 2 — Visual wow + storytelling
- Refined design system: typography scale, color, depth, consistent motion.
- A **"first 30 seconds"** guided hero moment that auto-reveals the global map with narration.
- Smooth D3 motion (no jarring restarts); investor narrative flow: market → concentration → risk →
  opportunity.

**Done when:** a first-time investor reaches an "aha" within 30s; design system is consistent;
storytelling flow is demonstrable and tested for non-regression.

### Phase 3 — Depth of intelligence
- Risk & bottleneck analytics; supply-chain concentration scoring.
- Scenario stress-tests (e.g., "Taiwan semiconductor disruption") over real data.
- Investor signals derived from the trusted dataset.

**Done when:** at least one scenario stress-test and concentration/bottleneck analytic ship on real
data, each with provenance, covered by tests.

### Phase 4 — Performance, accessibility & launch
- Memoized filters; no full-simulation restart for style/filter changes.
- Mobile excellence; full keyboard-only journey (search → filter → select → reset).
- SEO/meta/social cards; final verification gate before shipping.

**Done when:** interactions feel immediate; keyboard journey complete; Lighthouse targets met; all
tests pass.

## 6. Success Metrics (Definition of Done)
1. **Trust:** every displayed major figure is tagged `observed`/`estimated` with a reachable source.
2. **Wow:** first-time investor reaches a clear "aha" within ~30 seconds.
3. **Depth:** ≥1 scenario stress-test and concentration/bottleneck analytic on real data.
4. **Performance:** filter/interaction feels immediate; no full simulation restart for simple changes.
5. **Reliability:** new behavior tests cover provenance math, confidence scoring, storytelling flow,
   scenario logic, and URL-state restore — and the full suite stays green.

## 7. Out of Scope
- Backend/API migration; real-time streaming macro updates.
- User accounts / login / collaborative saved workspaces.
- Any fabricated or unsourced data.

## 8. Risks & Mitigations
- **Credibility risk** (estimates read as observed) → mandatory provenance badges everywhere (Phase 1
  precedes visual polish).
- **UX complexity** (too many controls) → presets + progressive disclosure.
- **Performance** (overlays slow D3) → memoized filters, conditional redraw.
- **Refactor regression** → Phase 0 keeps the data contract fixed and the test suite green before any
  feature work.

## 9. Execution
Driven through GSD phases (per the user's request). Each phase: plan → execute → code review →
verification gate before completion claims.
