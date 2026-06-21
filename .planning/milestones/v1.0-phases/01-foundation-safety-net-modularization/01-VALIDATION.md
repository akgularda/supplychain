---
phase: 1
slug: foundation-safety-net-modularization
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-20
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. This phase is a behavior-preserving
> refactor: the existing test suite IS the regression contract. No new product behavior is added, so validation
> centers on "nothing changed."

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node built-in `node --test` (`.mjs` tests in `tests/`) |
| **Config file** | none — `package.json` `test` script |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5–15 seconds |

**Decision (resolves research open question 1):** The authoritative gate is `npm test` (green: 116 assertions,
0 failures). `node --test tests/` is NOT the gate — it fails on gitignored `macro-site/*` and
network/date-dependent ingestion tests unrelated to this phase.

**Decision (resolves research open question 2):** FOUND-05 "byte-for-byte equivalent" means rendered/behavioral
equivalence (DOM + behavior), not literal byte-identity (impossible when extracting inline code into files).

---

## Sampling Rate

- **After every extraction step (CSS block, each JS module):** Run `npm test`
- **After every plan wave:** Run `npm test` (full suite)
- **Before verification:** `npm test` green AND manual render parity check passed
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | FOUND-01 | — | CSS extracted; `index.html` links `styles/*.css`; render unchanged | regression | `npm test` | ✅ | ⬜ pending |
| 1-01-02 | 01 | 1 | FOUND-02 | — | JS extracted to `js/*` modules; `window.*` globals preserved (incl. `openCompanyProfile`); retained inline bootstrap satisfies `index-ui-integrity` | regression | `npm test` | ✅ | ⬜ pending |
| 1-01-03 | 01 | 1 | FOUND-03 | — | Full suite green, unchanged | regression | `npm test` | ✅ | ⬜ pending |
| 1-01-04 | 01 | 2 | FOUND-05 | — | `deploy-pages.yml` copies `styles/` + `js/`; site serves under http-server with module MIME | manual + ci | `npm test` + workflow inspection | ✅ | ⬜ pending |
| 1-01-05 | 01 | 2 | FOUND-04 | — | Lighthouse/perf baseline recorded under `docs/perf/` | manual | Lighthouse run, output committed | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Lighthouse tooling availability confirmed (Chrome present at standard Windows path per research); `npx lighthouse` or `lighthouse` CLI for baseline capture
- [ ] Local static server (`http-server`) available to serve ES modules for render-parity check and Lighthouse

*Existing `node --test` infrastructure covers all regression requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Rendered/behavioral parity (no visual regression) | FOUND-05 | Visual equivalence isn't asserted by existing tests | Serve via `http-server`, load page, exercise: company click (`openCompanyProfile`), filters, compare, help modal; confirm identical behavior to pre-refactor |
| Lighthouse/perf baseline capture | FOUND-04 | Baseline is a recorded artifact, not a pass/fail test | Run Lighthouse against served site; commit results to `docs/perf/baseline-2026-06-20.md` |
| GitHub-Pages deploy serves new dirs | FOUND-05 | Deploy correctness only observable via the Actions workflow | Confirm `deploy-pages.yml` copies `styles/` and `js/` into `_site/` |

---

## Validation Sign-Off

- [ ] All tasks have automated verify (`npm test`) or Wave 0 dependencies
- [ ] Sampling continuity: `npm test` after every extraction step
- [ ] Wave 0 covers Lighthouse + static-server tooling
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
