# Monarch Castle Technologies — Market Intelligence

## What This Is

A public, investor-facing market-intelligence website: a single-page, D3-powered interactive
visualization of the top 100 companies by market cap and their global supply chains, layered with
country macro data, credit ratings, and trade flows (IMF DOTS, World Bank GDP, UN Comtrade). It is a
buildless static site deployed to GitHub Pages, with data auto-updated weekly via GitHub Actions. No
login — anyone can explore. This milestone elevates it to a world-class, best-in-the-world experience
for a sophisticated investor audience.

## Core Value

Investors trust every number and instantly grasp supply-chain structure, concentration, and risk —
credibility first, then beauty, then unique depth. If everything else fails, the data must be
trustworthy and traceable to a source.

## Requirements

### Validated

<!-- Inferred from existing code — already shipped and relied upon. -->

- ✓ Interactive D3 force-directed visualization of top-100 companies + supply-chain links — existing
- ✓ Company profile drill-down with relationship confidence and source references — existing
- ✓ Filters, search (with history), comparison mode, export, bookmarks/save views — existing
- ✓ Keyboard shortcuts, help/onboarding modals, accessibility (ARIA) baseline — existing
- ✓ Country macro data, credit ratings, and trade-flow layers — existing
- ✓ Weekly automated data refresh via GitHub Actions; static GitHub-Pages deploy — existing
- ✓ Node test suite (103 tests passing) covering UI integrity, data schema, ingestion — existing
- ✓ Foundation: monolithic index.html modularized into `styles/` + `js/` ES modules; tests green; perf baseline — v1.0
- ✓ Trust layer: observed/estimated/unknown provenance badges + source links + 0–100% confidence + Methodology view + live freshness — v1.0
- ✓ Visual wow + storytelling: full design-token system, build-once smooth D3 motion, first-30s guided hero + investor narrative — v1.0
- ✓ Depth of intelligence: HHI concentration score, supplier criticality/chokepoints, Taiwan scenario stress-test (7 firms/$11.36T) — all with honest derived provenance — v1.0
- ✓ Performance, accessibility & launch: ~60× memoized filters (no full-sim restart), mobile + full keyboard journey, SEO/OG/Twitter/JSON-LD + social card, launch gate — v1.0

### Active

<!-- Next milestone candidates (deferred from v1.0 as honest, documented limits). -->

- [ ] Per-supplier volume weighting so concentration uses true HHI (v1.0 used equal-weight 1/k — no volume in data)
- [ ] Multi-hop cascade in scenario stress-tests (v1.0 ships single-hop direct-dependents only)
- [ ] Backfill the ~75 dangling source FKs (currently degrade honestly to the Unknown confidence floor)
- [ ] Fix the cosmetic timestamp-echo quoting bug in `auto-update-data.yml` (non-blocking, disclosed in LAUNCH.md)

### Out of Scope

- Login / user accounts / collaborative saved workspaces — audience is public investors; no auth needed
- Backend / API migration — keep buildless static GitHub-Pages deploy
- Real-time streaming macro updates — weekly auto-update is sufficient
- Any fabricated or unsourced data — credibility is the core value; every figure must trace to a source
- Heavy framework / build tool (React, Vite, etc.) — preserve the simple static deploy

## Context

- Codebase is a large monolithic `index.html` with inline CSS/JS, plus `data/` JSON, `scripts/`
  (data fetchers in `.mjs`), `tests/` (Node `.mjs`), and GitHub Actions workflows.
- Approved design spec is the source of truth:
  `docs/superpowers/specs/2026-06-20-monarch-best-in-world-design.md`.
- Existing internal planning docs (`plan.md`, `FUTURE_ENHANCEMENTS_PLAN.md`,
  `WEBSITE_IMPROVEMENTS_PLAN.md`) already concluded data-trust must precede visual polish.
- Data sources: IMF DOTS, World Bank GDP/trade totals, UN Comtrade, credit ratings, top-100 market cap.

## Constraints

- **Tech stack**: Buildless static site (HTML/CSS/vanilla JS + D3). No framework/build tool — preserve GitHub-Pages direct serve.
- **Compatibility**: The `data/` JSON contract and the auto-update Actions pipeline must keep working.
- **Quality**: The existing 103-test suite must stay green throughout; new behavior gets new tests.
- **Data integrity**: Real, sourced data only — nothing fabricated; every major figure tagged observed/estimated with a reachable source.
- **Audience**: Sophisticated investors; public; no login.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hybrid: thin modularization then phased value | Maintainable foundation + fast visible wins without risking the working static deploy/tests | — Pending |
| Trust before visual wow | Investors bounce on unsourced numbers; matches existing risk register | — Pending |
| Real-data-only (no fabrication) | Credibility is the core value | — Pending |
| Keep buildless static GitHub-Pages deploy | Preserve simple, working deploy + auto-update pipeline | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
## Current State

**Shipped v1.0 (2026-06-21)** — live at https://akgularda.github.io/supplychain/ — 10 phases, 33 plans,
25/25 requirements, **301/301 tests green**, milestone audit PASSED. Lighthouse SEO 100 / Best-Practices 100 /
A11y 93 / Perf 58 (cold loopback). Buildless static GitHub-Pages deploy + weekly auto-update pipeline intact.
The original "best supply-chain website in the world for investors" goal is delivered across all three pillars
(trust → wow → depth). See `LAUNCH.md` and `.planning/milestones/v1.0-*`.

---
*Last updated: 2026-06-21 after v1.0 milestone*
