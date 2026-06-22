// Phase 11-02 multi-hop scenario integration smoke (auto-approved human-verify gate).
// Serves the REAL site via http-server over http:// (never file://) and proves the
// multi-hop scenario panel PAINTS and WIRES end to end over the real frozen data:
//   (1) zero console / pageerror events
//   (2) real data paints (nodes >= 100, svg circle.mc rendered)
//   (3) clicking #bScenarioTaiwan runs the Taiwan preset at maxHops:3 and
//       #scenarioSummary reads the live-derived multi-hop headline
//       /8 companies impacted across 2 hop\(s\)/ AND /\$13\.28T exposed/ (derived from
//       runScenario over the real data — not hardcoded; the old 7 / $11.36T is gone)
//   (4) #scenarioHopBreakdown reads "7 direct · 1 indirect" (TSM is the hop-2 firm)
//   (5) #scenarioImpactList renders exactly 8 .cItem rows (the 8 impacted firms)
//   (6) #scenarioProv contains a .prov-badge reading "Derived" and NOT "Observed"
//   (7) the Taiwan run highlights exactly the 8 impacted company nodes
//
// Mirrors docs/perf/_scenario-smoke-0703.cjs: free port, real repo root, http:// not file://.
// d3 is CDN-loaded. If the sandbox blocks the CDN the page cannot paint; the harness
// reports the CDN-blocked condition honestly (plan-sanctioned fallback). No app source modified.
const { spawn } = require("child_process");
const net = require("net");
const { chromium } = require("playwright");

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function waitForServer(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const sock = net.connect(port, "127.0.0.1");
      sock.on("connect", () => { sock.end(); resolve(); });
      sock.on("error", () => {
        sock.destroy();
        if (Date.now() > deadline) reject(new Error("http-server did not start"));
        else setTimeout(tryConnect, 150);
      });
    };
    tryConnect();
  });
}

(async () => {
  const repoRoot = require("path").resolve(__dirname, "..", "..");
  const port = await freePort();

  const srv = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["http-server", repoRoot, "-p", String(port), "-c-1", "-a", "127.0.0.1", "--silent"],
    { cwd: repoRoot, shell: process.platform === "win32" }
  );
  srv.on("error", (e) => console.log("HTTP_SERVER_SPAWN_ERROR: " + e.message));

  let browser;
  try {
    await waitForServer(port, 20000);

    browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-gpu"] });
    const page = await browser.newPage({ viewport: { width: 1350, height: 940 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push("console.error: " + m.text()); });

    const url = `http://127.0.0.1:${port}/index.html`;
    let nav;
    try {
      nav = await page.goto(url, { waitUntil: "load", timeout: 60000 });
    } catch (e) { console.log("GOTO_ERROR: " + e.message); }

    await page.waitForTimeout(4000);

    const d3Loaded = await page.evaluate(() => typeof window.d3 !== "undefined");

    const paint = await page.evaluate(() => {
      const data = window.SUPPLY_MAP_DATA || {};
      return {
        dataLoaded: !!(data && Array.isArray(data.nodes)),
        nodeCount: (data.nodes || []).length,
        svgNodeEls: document.querySelectorAll("svg g circle.mc, svg circle.mc").length,
        hasScenarioPanel: !!document.getElementById("scenarioPanel"),
        hasHopBreakdown: !!document.getElementById("scenarioHopBreakdown"),
        hasTaiwanBtn: !!document.getElementById("bScenarioTaiwan"),
      };
    });

    let scenario = {
      clicked: false, summary: "", hopBreakdown: "",
      headlineEightCompanies: false, headlineTwoHops: false, headlineExposed: false,
      hopSplitDirectIndirect: false, impactRows: 0, badgeText: "", isDerived: false, notObserved: false,
    };
    try {
      const btn = await page.$("#bScenarioTaiwan");
      if (btn) {
        await btn.click();
        await page.waitForTimeout(400);
        scenario = await page.evaluate(() => {
          const sumEl = document.getElementById("scenarioSummary");
          const hopEl = document.getElementById("scenarioHopBreakdown");
          const listEl = document.getElementById("scenarioImpactList");
          const provEl = document.getElementById("scenarioProv");
          const summary = sumEl ? (sumEl.textContent || "").trim() : "";
          const hopBreakdown = hopEl ? (hopEl.textContent || "").trim() : "";
          const rows = listEl ? listEl.querySelectorAll(".cItem").length : 0;
          const badge = provEl ? provEl.querySelector(".prov-badge") : null;
          const badgeText = badge ? (badge.textContent || "").trim() : "";
          const provText = provEl ? (provEl.textContent || "") : "";
          return {
            clicked: true,
            summary,
            hopBreakdown,
            // live-derived headline: "8 companies impacted across 2 hop(s) · $13.28T exposed"
            headlineEightCompanies: /\b8 companies impacted\b/.test(summary),
            headlineTwoHops: /across 2 hop\(s\)/.test(summary),
            headlineExposed: /\$13\.28T/.test(summary) && /exposed/i.test(summary),
            // direct-vs-indirect split: "7 direct · 1 indirect"
            hopSplitDirectIndirect: /7 direct/.test(hopBreakdown) && /1 indirect/.test(hopBreakdown),
            impactRows: rows,
            badgeText,
            isDerived: /Derived/.test(badgeText),
            notObserved: !/Observed/.test(provText),
          };
        });
      }
    } catch (e) { scenario.error = e.message; }

    let highlight = { litCount: 0, dimmedCount: 0, eightLit: false, dimsRest: false };
    if (paint.svgNodeEls > 0) {
      try {
        highlight = await page.evaluate(() => {
          const circles = [...document.querySelectorAll("svg circle.mc")];
          let lit = 0, dimmed = 0;
          for (const c of circles) {
            const fo = parseFloat(c.getAttribute("fill-opacity") || "1");
            if (fo >= 0.9) lit++;
            else if (fo <= 0.1) dimmed++;
          }
          return {
            litCount: lit,
            dimmedCount: dimmed,
            eightLit: lit === 8,
            dimsRest: dimmed >= lit && dimmed > 0,
          };
        });
      } catch (e) { highlight.error = e.message; }
    }

    const summary = {
      http_status: nav ? nav.status() : "no-response",
      d3_loaded: d3Loaded,
      cdn_blocked: !d3Loaded,
      paint,
      scenario,
      highlight,
      captured_headline: scenario.summary,
      captured_hop_breakdown: scenario.hopBreakdown,
      page_errors: errors.slice(0, 20),
      assertions: {
        zero_errors: errors.length === 0,
        paint_real_data: paint.dataLoaded && paint.nodeCount >= 100 && paint.svgNodeEls > 0,
        hop_breakdown_panel_present: paint.hasHopBreakdown,
        taiwan_headline_multihop: scenario.headlineEightCompanies && scenario.headlineTwoHops && scenario.headlineExposed,
        hop_split_7_direct_1_indirect: scenario.hopSplitDirectIndirect,
        eight_impact_rows: scenario.impactRows === 8,
        derived_badge: scenario.isDerived && scenario.notObserved,
        highlight_eight_impacted: highlight.eightLit && highlight.dimsRest,
      },
    };
    summary.PASS = Object.values(summary.assertions).every(Boolean);

    console.log(JSON.stringify(summary, null, 2));
    console.log(
      (summary.PASS ? "PASS" : "FAIL") +
      " — headline: " + JSON.stringify(scenario.summary) +
      " | hops: " + JSON.stringify(scenario.hopBreakdown)
    );
    await browser.close();
    srv.kill();
    process.exit(summary.PASS ? 0 : 2);
  } catch (e) {
    console.log("FATAL: " + e.message);
    if (browser) await browser.close().catch(() => {});
    srv.kill();
    process.exit(1);
  }
})();
