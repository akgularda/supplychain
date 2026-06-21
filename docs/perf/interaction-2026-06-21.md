# Interaction-Latency Record — 2026-06-21 (PERF-01 SC2)

> **Authoritative SC2 evidence: Node micro-benchmark of the pure analytics.** The in-browser
> interaction/paint number is **unmeasurable on this machine** (the committed data snapshot does
> not paint — see the caveat below), so per `08-RESEARCH.md` (Pitfall 4 / Open Question 2) the
> cold-vs-warm cost of the memoized analytics engine is the recorded measure of the PERF-01 SC2
> interaction-latency improvement. Every figure here comes from a live run of
> `node docs/perf/_interaction-bench.cjs`; the bench re-prints the live anchors so the record is
> self-verifying (threat T-08-05).

- **Date captured:** 2026-06-21
- **Requirement:** PERF-01 SC2 — measurable interaction-latency improvement, recorded.
- **Subject:** `js/analytics/index.js` per-session memo layer added in Plan 08-01.
- **Harness:** `docs/perf/_interaction-bench.cjs` (Node, `perf_hooks.performance.now()`; tooling,
  NOT registered in `package.json scripts.test`).
- **Fixture:** the real frozen `data/top100-map.json` (100 company profiles + nodes with marketcap).

---

## Method

A representative "interaction" workload runs the analytics the way the UI drives it:

- **Profile opens** — `companyConcentration(symbol, { profiles })` for **every one of the 100** profiles.
- **Chokepoints render** — `supplierCriticality({ profiles, limit: 8 })` **× 50**.
- **Scenario runs** — `runScenario(SCENARIO_PRESETS.TAIWAN_SEMI.disruption, { profiles, nodes })` **× 50**.

That single workload (100 profile opens + 50 criticality + 50 scenario = 200 hot calls) is timed
two ways:

| Path | Cache behavior | Models |
|------|----------------|--------|
| **COLD** | `__resetAnalyticsCache()` is called **before every single call**, so the shared supplier fan-in (and every memoized result) is rebuilt from scratch each time. | The pre-memoization cost profile — the eager default-arg `buildSupplierFanIn(profiles)` rebuild that fired on each call. |
| **WARM** | `__resetAnalyticsCache()` is called **once**, then the identical workload runs fully memoized. | The shipped behavior — fan-in built once per session, repeated interactions served O(1) from cache. |

Each path is measured **median-of-5** after a warmup pass to damp JIT/GC noise.

---

## Results

| Metric | Value |
|--------|-------|
| Profiles opened (N) | 100 |
| Criticality calls | 50 |
| Scenario calls | 50 |
| **COLD workload (cache cleared each call)** | **≈ 166 ms** (this run: 165.86 ms; cross-run range 166–170 ms) |
| **WARM workload (memoized)** | **≈ 2.8 ms** (this run: 2.78 ms) |
| **Speedup (cold ÷ warm)** | **≈ 60× faster** (this run: 59.6×; cross-run 60–64×) |
| **Warm-cache fan-in builds** | **1** (built once for the whole 200-call workload; 199 cache hits) |
| Warm criticality builds / hits | 1 / 49 |
| Warm scenario builds / hits | 1 / 49 |

Live anchors re-printed from the **same warm cache** (proves the cache returns the correct values,
not just faster ones):

| Anchor | Recorded | Expected |
|--------|----------|----------|
| `companyConcentration("GILD").score` | 36 | 36 |
| `companyConcentration("NVDA").score` | 12 | 12 |
| `runScenario(TAIWAN_SEMI).impactedCompanies.length` | 7 | 7 |

(Reproduce: `node docs/perf/_interaction-bench.cjs`. Absolute milliseconds vary slightly per run
and per machine; the **warm < cold** relationship and the **single fan-in build** are stable and
are the load-bearing facts.)

---

## SC2 Conclusion

**Warm-cache interaction cost is measurably and substantially lower than cold** — the same 200-call
interaction workload drops from ≈166 ms cold to ≈2.8 ms warm (≈60× faster). The mechanism is exactly
the memoization win from Plan 08-01: the shared supplier fan-in is built **once** per session
(`fanInBuilds_warm: 1`, 199 hits) instead of being rebuilt on every profile open / chokepoint render
/ scenario run, and the per-company / per-scenario results are themselves served from cache on repeat.
This is the recorded, honest evidence for **PERF-01 SC2**.

The absolute warm number is tiny in this micro-benchmark because the dataset is small (100 profiles)
and there is no DOM/paint cost in Node — that is expected and reported as-is. The point SC2 asks for
is a *measurable interaction-latency improvement*, and the cold-vs-warm delta plus the cache-hit
counts demonstrate it directly.

---

## Caveat — local "no paint" condition (why this Node bench is authoritative)

The natural SC2 measurement would be an in-browser interaction latency (e.g. time-to-update after a
profile open), captured with the Playwright harness `docs/perf/_perf-capture.cjs`. **That number is
not measurable on this machine.** As documented in `docs/perf/baseline-2026-06-20.md`
("Known Pre-Existing Render Condition"), the committed `data/top100-map.js` snapshot sets
`window.SUPPLY_MAP_DATA` **without `nodes`/`links`/`profiles`**, so the bootstrap guard throws, the
D3 visualization never renders, and Chrome records **`NO_FCP` (First Contentful Paint = null)** — both
the pre- and post-extraction Phase-1 runs hit this identical condition. With no paint there is no
in-page interaction-latency signal to read locally.

Therefore, per `08-RESEARCH.md` (Pitfall 4 — "page doesn't paint locally → prefer a Node micro-bench
of the pure functions" — and Open Question 2 — "record the Node micro-bench as the authoritative SC2
number; in-page capture optional/best-effort"), **this Node micro-benchmark is the authoritative SC2
measurement.** The Playwright in-page capture (`docs/perf/_perf-capture.cjs`) remains a best-effort
supplement that would require synthetic-data injection (`nodes`/`links`/`profiles`) to paint before it
could record an interaction number — it is not relied upon here.

---

## Phase-1 baseline reference

The Phase-1 baseline (`docs/perf/baseline-2026-06-20.md`) recorded navigation/paint timing only
(TTFB ≈321 ms, DCL ≈569 ms, **FCP = null / NO_FCP**) and explicitly carried no interaction-cost or
contentful-paint figure to improve against. This document supplies the missing interaction-cost
dimension for Phase 08 under the **same data snapshot and the same network-restricted sandbox**,
using the analytics-engine cold-vs-warm delta as the comparison the baseline could not paint.
