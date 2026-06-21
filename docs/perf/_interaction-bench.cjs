// docs/perf/_interaction-bench.cjs — PERF-01 SC2 cold-vs-warm interaction micro-benchmark.
//
// WHY THIS EXISTS (read docs/perf/baseline-2026-06-20.md "Known Pre-Existing Render
// Condition"): the page does not paint locally — the committed data/top100-map.js snapshot
// lacks nodes/links/profiles, so Chrome records NO_FCP and an in-browser interaction-latency
// number is unmeasurable on this machine. Per 08-RESEARCH (Pitfall 4 / Open Question 2), the
// authoritative SC2 evidence is therefore a Node micro-benchmark of the PURE analytics: time
// the cold path (cache cleared before every call → supplier fan-in rebuilt each time, mirroring
// the pre-memo eager default-arg behavior) vs the warm path (memoized, one fan-in build for the
// whole session), over a representative interaction workload.
//
// This file is TOOLING, not a unit test — it is intentionally NOT registered in
// package.json scripts.test. Run it directly:  node docs/perf/_interaction-bench.cjs
//
// Honest-numbers contract (threat T-08-05): every figure printed comes from a live run, and the
// block re-prints the live anchors (GILD=36, NVDA=12, Taiwan=7) so the record is self-verifying.

const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");
const { pathToFileURL } = require("url");

async function main() {
  // The analytics engine is ESM; this harness is CommonJS — bridge via dynamic import().
  const analyticsUrl = pathToFileURL(
    path.resolve(__dirname, "../../js/analytics/index.js")
  ).href;
  const {
    companyConcentration,
    supplierCriticality,
    runScenario,
    buildSupplierFanIn,
    SCENARIO_PRESETS,
    __resetAnalyticsCache,
    __memoStats,
  } = await import(analyticsUrl);

  // Load the REAL frozen fixture (profiles keyed by symbol + nodes with marketcap).
  const data = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../../data/top100-map.json"), "utf8")
  );
  const profiles = data.profiles;
  const nodes = data.nodes;
  const symbols = Object.keys(profiles);

  const CRIT_CALLS = 50; // repeated "chokepoints panel" renders
  const SCENARIO_CALLS = 50; // repeated scenario runs (e.g. re-toggling the Taiwan preset)
  const taiwan = SCENARIO_PRESETS.TAIWAN_SEMI.disruption;

  // One unit of "real interaction": open every company profile (concentration per symbol),
  // render the chokepoints list CRIT_CALLS times, run the Taiwan scenario SCENARIO_CALLS times.
  // COLD passes __resetAnalyticsCache() before EACH call so the fan-in (and every memoized
  // result) is rebuilt from scratch every time — the pre-memoization cost profile.
  function workloadCold() {
    for (const sym of symbols) {
      __resetAnalyticsCache();
      companyConcentration(sym, { profiles });
    }
    for (let i = 0; i < CRIT_CALLS; i++) {
      __resetAnalyticsCache();
      supplierCriticality({ profiles, limit: 8 });
    }
    for (let i = 0; i < SCENARIO_CALLS; i++) {
      __resetAnalyticsCache();
      runScenario(taiwan, { profiles, nodes });
    }
  }

  // WARM: reset ONCE, then the identical workload runs fully memoized (fan-in built once,
  // every repeated concentration/criticality/scenario call served from cache).
  function workloadWarm() {
    __resetAnalyticsCache();
    for (const sym of symbols) companyConcentration(sym, { profiles });
    for (let i = 0; i < CRIT_CALLS; i++) supplierCriticality({ profiles, limit: 8 });
    for (let i = 0; i < SCENARIO_CALLS; i++) runScenario(taiwan, { profiles, nodes });
  }

  // Median-of-5 with a warmup pass to damp JIT / GC noise.
  function median(fn) {
    fn(); // warmup (not timed)
    const samples = [];
    for (let r = 0; r < 5; r++) {
      const t0 = performance.now();
      fn();
      samples.push(performance.now() - t0);
    }
    samples.sort((a, b) => a - b);
    return samples[Math.floor(samples.length / 2)];
  }

  const coldMs = median(workloadCold);
  const warmMs = median(workloadWarm);

  // Capture warm-path fan-in builds (memoization proof: should be 1 across the whole warm
  // workload) by running one clean warm pass and reading the stats immediately after.
  __resetAnalyticsCache();
  workloadWarmBody();
  const stats = __memoStats();

  function workloadWarmBody() {
    for (const sym of symbols) companyConcentration(sym, { profiles });
    for (let i = 0; i < CRIT_CALLS; i++) supplierCriticality({ profiles, limit: 8 });
    for (let i = 0; i < SCENARIO_CALLS; i++) runScenario(taiwan, { profiles, nodes });
  }

  // Re-prove the live anchors from the SAME warm cache (self-verifying record).
  const anchors = {
    GILD: companyConcentration("GILD", { profiles }).score,
    NVDA: companyConcentration("NVDA", { profiles }).score,
    taiwan: runScenario(taiwan, { profiles, nodes }).impactedCompanies.length,
  };

  const result = {
    profiles: symbols.length,
    workload: {
      profileOpens: symbols.length,
      criticalityCalls: CRIT_CALLS,
      scenarioCalls: SCENARIO_CALLS,
    },
    coldMs: Number(coldMs.toFixed(4)),
    warmMs: Number(warmMs.toFixed(4)),
    speedup: Number((coldMs / warmMs).toFixed(2)),
    fanInBuilds_warm: stats.fanIn.builds,
    memoStats_warm: stats,
    anchors,
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error("BENCH_FATAL: " + e.message);
  process.exit(1);
});
