---
phase: 2
slug: provenance-source-linking
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-20
---

# Phase 2 — Validation Strategy

> Provenance must be DATA-DERIVED and real. Validation centers on: tags come from data (never hardcoded),
> sourced figures get reachable links, unsourced figures show an explicit unknown state, and the suite stays green.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `node --test` (`.mjs`, `node:assert/strict`), no jsdom |
| **Config file** | `package.json` `scripts.test` (explicit file list) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5–15 s |

**CRITICAL GATE CAVEAT (from research):** `npm test` only runs the files explicitly listed in
`package.json scripts.test`. Any NEW provenance test file MUST be added to that list in Wave 0, or it
silently never runs and the green count is meaningless.

## Sampling Rate
- After each task commit: `npm test`
- Before verification: `npm test` green (existing 116 + new provenance tests)
- Max feedback latency: ~15 s

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 2-xx | — | 0 | TRUST-01/02 | infra | new test file added to `package.json scripts.test` | ⬜ |
| 2-xx | — | 1 | TRUST-01 | unit | `provenanceFor()` maps high*→observed, medium*→estimated, missing→unknown — data-derived, asserted | ⬜ |
| 2-xx | — | 1 | TRUST-02 | unit | sourced figure → reachable {title,url} link; unsourced → explicit unknown (no fabricated tag) | ⬜ |
| 2-xx | — | 1 | TRUST-01/02 | string | major-figure render paths attach a provenance badge (stat bar, tooltip, profile, compare) | ⬜ |
| 2-xx | — | 1 | TRUST-01/02 | regression | full `npm test` green (116 + new) | ⬜ |

## Wave 0 Requirements
- [ ] Register the new provenance `.mjs` test file in `package.json scripts.test` (else it never runs)

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Badge hover/click opens real source URL in new tab | TRUST-02 | Browser interaction | Serve via http-server, hover tooltip / click profile badge, confirm real source opens |

## Validation Sign-Off
- [ ] Every major-figure path has a provenance assertion or Wave 0 dependency
- [ ] New test file registered in package.json
- [ ] No fabricated tags (unknown path tested)
- [x] `nyquist_compliant: true`

**Approval:** pending
