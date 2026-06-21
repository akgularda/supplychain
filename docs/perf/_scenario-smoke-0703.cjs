// Phase 07-03 scenario integration smoke (auto-approved human-verify gate). Serves the
// REAL site via http-server and loads it over http:// (never file://). This harness proves
// the Phase 7 scenario stress-test PAINTS and WIRES end to end over real frozen data:
//   (1) zero console / pageerror events
//   (2) real data paints (nodes >= 100, svg circle.mc rendered)
//   (3) clicking #bScenarioTaiwan runs the Taiwan preset and #scenarioSummary reads the
//       live-derived headline /7 companies/ AND /\$11\.36T|11\.36/ (not hardcoded — comes
//       from runScenario over the fixtures)
//   (4) #scenarioImpactList renders exactly 7 .cItem rows (the 7 impacted firms)
//   (5) #scenarioProv contains a .prov-badge reading "Derived" and NOT "Observed"
//   (6) the Taiwan run highlights exactly the 7 impacted company nodes: matching circle.mc
//       go to fill-opacity ~1 and non-matching drop to ~0.03 (highlightBy effect)
//   (7) clicking #bScenarioReset clears the summary/list/prov and restores the graph
//
// Mirrors docs/perf/_render-smoke-0603.cjs: free port, real repo root, http:// not file://.
// d3 is CDN-loaded (cloudflare). If the sandbox blocks the CDN the real page cannot paint;
// the harness reports the CDN-blocked condition honestly and the auto-approved human-verify
// checkpoint covers the true visual pass (plan-sanctioned fallback, per STATE.md blocker).
// No app source is modified.
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

  // Boot http-server serving the repo root (no cache so the rich data file is always fresh).
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

    // Give d3 force simulation time to lay out and the entry script to wire UI.
    await page.waitForTimeout(4000);

    const d3Loaded = await page.evaluate(() => typeof window.d3 !== "undefined");

    // (1)+(2) data + paint.
    const paint = await page.evaluate(() => {
      const data = window.SUPPLY_MAP_DATA || {};
      return {
        dataLoaded: !!(data && Array.isArray(data.nodes)),
        nodeCount: (data.nodes || []).length,
        profileCount: data.profiles ? Object.keys(data.profiles).length : 0,
        svgNodeEls: document.querySelectorAll("svg g circle.mc, svg circle.mc").length,
        hasScenarioPanel: !!document.getElementById("scenarioPanel"),
        hasTaiwanBtn: !!document.getElementById("bScenarioTaiwan"),
      };
    });

    // (3)-(5) run the Taiwan preset, read the live headline + impact rows + Derived badge.
    let scenario = {
      clicked: false, summary: "", headlineSevenCompanies: false, headlineExposed: false,
      impactRows: 0, badgeText: "", isDerived: false, notObserved: false,
    };
    try {
      const btn = await page.$("#bScenarioTaiwan");
      if (btn) {
        await btn.click();
        await page.waitForTimeout(400);
        scenario = await page.evaluate(() => {
          const sumEl = document.getElementById("scenarioSummary");
          const listEl = document.getElementById("scenarioImpactList");
          const provEl = document.getElementById("scenarioProv");
          const summary = sumEl ? (sumEl.textContent || "").trim() : "";
          const rows = listEl ? listEl.querySelectorAll(".cItem").length : 0;
          const badge = provEl ? provEl.querySelector(".prov-badge") : null;
          const badgeText = badge ? (badge.textContent || "").trim() : "";
          const provText = provEl ? (provEl.textContent || "") : "";
          return {
            clicked: true,
            summary,
            // live-derived headline: "7 companies impacted · $11.36T market cap exposed"
            headlineSevenCompanies: /\b7 companies\b/.test(summary),
            headlineExposed: /\$11\.36T|11\.36/.test(summary) && /exposed/i.test(summary),
            impactRows: rows,
            badgeText,
            isDerived: /Derived/.test(badgeText),
            notObserved: !/Observed/.test(provText),
          };
        });
      }
    } catch (e) { scenario.error = e.message; }

    // (6) highlight: the 7 impacted nodes lit (fill-opacity ~1), the rest dimmed (~0.03).
    let highlight = { litCount: 0, dimmedCount: 0, sevenLit: false, dimsRest: false };
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
            // highlightBy lights exactly the 7 impacted company nodes.
            sevenLit: lit === 7,
            dimsRest: dimmed >= lit && dimmed > 0,
          };
        });
      } catch (e) { highlight.error = e.message; }
    }

    // (7) reset: summary/list/prov cleared, highlight restored.
    let reset = { clicked: false, summaryCleared: false, listCleared: false, provCleared: false, highlightRestored: false };
    try {
      const r = await page.$("#bScenarioReset");
      if (r) {
        await r.click();
        await page.waitForTimeout(400);
        reset = await page.evaluate(() => {
          const sumEl = document.getElementById("scenarioSummary");
          const listEl = document.getElementById("scenarioImpactList");
          const provEl = document.getElementById("scenarioProv");
          const summary = sumEl ? (sumEl.textContent || "").trim() : "";
          const circles = [...document.querySelectorAll("svg circle.mc")];
          // after resetHighlight every node returns to its base opacity (0.82 / 0.35),
          // i.e. no node sits at the dimmed 0.03 highlight floor.
          const dimmed = circles.filter((c) => parseFloat(c.getAttribute("fill-opacity") || "1") <= 0.1).length;
          return {
            clicked: true,
            summaryCleared: /No scenario run yet/i.test(summary) || summary.length === 0,
            listCleared: !listEl || listEl.querySelectorAll(".cItem").length === 0,
            provCleared: !provEl || (provEl.textContent || "").trim().length === 0,
            highlightRestored: dimmed === 0,
          };
        });
      }
    } catch (e) { reset.error = e.message; }

    const summary = {
      http_status: nav ? nav.status() : "no-response",
      d3_loaded: d3Loaded,
      cdn_blocked: !d3Loaded,
      paint,
      scenario,
      highlight,
      reset,
      captured_headline: scenario.summary,
      page_errors: errors.slice(0, 20),
      assertions: {
        zero_errors: errors.length === 0,
        paint_real_data: paint.dataLoaded && paint.nodeCount >= 100 && paint.svgNodeEls > 0,
        taiwan_headline: scenario.headlineSevenCompanies && scenario.headlineExposed,
        seven_impact_rows: scenario.impactRows === 7,
        derived_badge: scenario.isDerived && scenario.notObserved,
        highlight_seven_impacted: highlight.sevenLit && highlight.dimsRest,
        reset_clears: reset.summaryCleared && reset.listCleared && reset.provCleared && reset.highlightRestored,
      },
    };
    summary.PASS = Object.values(summary.assertions).every(Boolean);

    console.log(JSON.stringify(summary, null, 2));
    console.log(
      (summary.PASS ? "PASS" : "FAIL") +
      " — headline: " + JSON.stringify(scenario.summary)
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
