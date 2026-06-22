---
phase: 12
slug: source-fk-integrity-workflow-fix
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-22
---

# Phase 12 — Validation Strategy

> Reconnect ONLY FKs that reference a real EXISTING source (the `swift-payments` source already used by 7 peer
> profiles): 3 references / 27 usages resolve; 6 references / 48 usages stay honestly Unknown. ZERO fabricated
> sources. Frozen `data/` JSON untouched (code-level resolver). One-line yml quote fix. Suite stays green.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `node --test` (`.mjs`) |
| **Config file** | `package.json scripts.test` (register new files!) |
| **Command** | `npm test` |
| **Runtime** | ~5–15 s |

## Sampling Rate
- After each task commit: `npm test`
- Before verification: full suite green (313 + integrity/workflow tests)

## Per-Task Verification Map

| Task | Wave | Req | Test Type | Assertion | Status |
|------|------|-----|-----------|-----------|--------|
| resolveSourceId + CANONICAL_SHARED_SOURCES | 1 | INTG-01 | unit | swift-payments → the verbatim real existing SWIFT source (title/url byte-equal to the one in the 7 sibling profiles); resolves for C, SAN, 601628.SS | ⬜ |
| reconnect wiring (sourceIndex build) | 1 | INTG-01 | unit/string | the 3 figures gain a reachable real source link; 27 usages resolved; data/ JSON unchanged (git diff clean) | ⬜ |
| orphans stay Unknown, zero fabrication | 1 | INTG-02/03 | unit | 6 orphan refs (novo-sustainability/amgn-products/txn-products/klac-products/tmo-business/gild-products) → null → Unknown floor; EVERY resolved FK → a source that pre-existed in the real sources table (no invented source) | ⬜ |
| methodology copy | 2 | INTG-02 | string | keeps literal `75`; adds resolved (27 usages / 3 refs) + remaining-Unknown (48 usages / 6 refs) counts; methodology-wiring stays green | ⬜ |
| workflow yml fix | 2 | INFRA-01 | unit/string | auto-update-data.yml line: `echo "timestamp=$(date +%Y%m%d-%H%M%S)" >> "$GITHUB_OUTPUT"`; no `>> $GITHUB_OUTPUT` captured inside the quoted echo; cron/validation/deploy unchanged | ⬜ |
| register + suite | 1/2 | INTG-03/INFRA-01 | regression | source-fk-integrity.test.mjs + workflow-timestamp-quote.test.mjs registered; `npm test` green (313 + new) | ⬜ |

## Wave 0 Requirements
- [ ] Register tests/source-fk-integrity.test.mjs + tests/workflow-timestamp-quote.test.mjs in package.json scripts.test

## Manual-Only Verifications
| Behavior | Req | Why Manual | Instructions |
|----------|-----|------------|--------------|
| Resolved figures show the real SWIFT source link | INTG-01 | Browser | http-server; open C/SAN profile, confirm the source link resolves to swift.com |

## Validation Sign-Off
- [ ] resolveSourceId resolves only to real existing sources; 3 refs / 27 usages reconnected
- [ ] orphans stay Unknown; zero fabricated sources (tested)
- [ ] data/ JSON contract unchanged; methodology keeps 75 + adds counts
- [ ] yml quote fixed; workflow valid
- [ ] New test files registered; suite green
- [x] `nyquist_compliant: true`

**Approval:** pending
