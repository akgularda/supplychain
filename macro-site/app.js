/**
 * Country Macro Viewer
 * SupplyChain-style interaction with country GDP bubbles and trade links.
 */

(function () {
  "use strict";

  let macroData = null;
  let currentYear = 2024;
  let currentDirection = "both";
  let minTradeThreshold = 1e9;
  let selectedSector = "all";
  let selectedBlocIds = ["all"];
  let blocCombinationMode = "union";
  let blocEdgeScope = "touching";
  let selectedCountry = null;
  let lockId = null;

  let simulation = null;
  let svg = null;
  let graphLayer = null;
  let zoomBehavior = null;
  let settleTimer = null;

  let nodeSel = null;
  let linkSel = null;
  let labelSel = null;

  let W = window.innerWidth;
  let H = window.innerHeight;

  let availableYears = [];

  const els = {};

  const SECTOR_COLORS = {
    medicine: "#e8453c",
    electronics: "#4c88cc",
    automotive: "#ff9f43",
    energy: "#8f6a48",
    agriculture: "#4caf50",
    textiles: "#9b7ad8",
    metals: "#7f8ea3",
    chemicals: "#f7b731",
  };

  const BASE_LINK_COLOR = {
    high: "rgba(232,69,60,0.18)",
    medium: "#1e1e1e",
    low: "#151515",
  };

  const MULTI_BLOC_COLOR = "#7f8ea3";

  const DEFAULT_VIEW_LENS = Object.freeze({
    gdpWeight: 0.62,
    tradeWeight: 0.38,
    bubbleScaleFloor: 0.72,
    bubbleScaleRange: 0.86,
    lowNodeColor: "#35597d",
    highNodeColor: "#e8453c",
    lowLinkColor: "#1f2f41",
    highLinkColor: "#e8453c",
  });

  const TRADE_BLOCS = [
    {
      id: "all",
      name: "Global",
      color: "#666666",
      members: [],
    },
    {
      id: "eu",
      name: "EU",
      color: "#4c88cc",
      members: ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"],
    },
    {
      id: "nato",
      name: "NATO",
      color: "#7f8ea3",
      members: ["AL", "BE", "BG", "CA", "HR", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IS", "IT", "LV", "LT", "LU", "ME", "NL", "MK", "NO", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "TR", "GB", "US"],
    },
    {
      id: "mercosur",
      name: "MERCOSUR",
      color: "#4caf50",
      members: ["AR", "BR", "PY", "UY", "BO"],
    },
    {
      id: "asean",
      name: "ASEAN",
      color: "#f7b731",
      members: ["BN", "KH", "ID", "LA", "MY", "MM", "PH", "SG", "TH", "VN"],
    },
    {
      id: "gcc",
      name: "GCC",
      color: "#9b7ad8",
      members: ["BH", "KW", "OM", "QA", "SA", "AE"],
    },
    {
      id: "usmca",
      name: "USMCA",
      color: "#ff9f43",
      members: ["US", "CA", "MX"],
    },
    {
      id: "brics",
      name: "BRICS",
      color: "#e8453c",
      members: ["BR", "RU", "IN", "CN", "ZA", "SA", "AE", "EG", "ET", "IR"],
    },
    {
      id: "afcfta",
      name: "AfCFTA",
      color: "#2a9d8f",
      members: ["DZ", "AO", "BJ", "BW", "BF", "BI", "CM", "CV", "CF", "TD", "KM", "CG", "CI", "CD", "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN", "GW", "KE", "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU", "MA", "MZ", "NA", "NE", "NG", "RW", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD", "TZ", "TG", "TN", "UG", "ZM", "ZW"],
    },
    {
      id: "cptpp",
      name: "CPTPP",
      color: "#00acc1",
      members: ["AU", "BN", "CA", "CL", "JP", "MY", "MX", "NZ", "PE", "SG", "VN", "GB"],
    },
    {
      id: "rcep",
      name: "RCEP",
      color: "#26a69a",
      members: ["AU", "BN", "KH", "CN", "ID", "JP", "KR", "LA", "MY", "MM", "NZ", "PH", "SG", "TH", "VN"],
    },
    {
      id: "eaeu",
      name: "EAEU",
      color: "#8d6e63",
      members: ["AM", "BY", "KZ", "KG", "RU"],
    },
    {
      id: "saarc",
      name: "SAARC",
      color: "#5c6bc0",
      members: ["AF", "BD", "BT", "IN", "MV", "NP", "PK", "LK"],
    },
    {
      id: "caricom",
      name: "CARICOM",
      color: "#26c6da",
      members: ["AG", "BS", "BB", "BZ", "DM", "GD", "GY", "HT", "JM", "KN", "LC", "VC", "SR", "TT"],
    },
    {
      id: "apec",
      name: "APEC",
      color: "#42a5f5",
      members: ["AU", "BN", "CA", "CL", "CN", "HK", "ID", "JP", "KR", "MY", "MX", "NZ", "PG", "PE", "PH", "RU", "SG", "TW", "TH", "US", "VN"],
    },
    {
      id: "oecd",
      name: "OECD",
      color: "#90a4ae",
      members: ["AU", "AT", "BE", "CA", "CL", "CO", "CR", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IS", "IE", "IL", "IT", "JP", "KR", "LV", "LT", "LU", "MX", "NL", "NZ", "NO", "PL", "PT", "SK", "SI", "ES", "SE", "CH", "TR", "GB", "US"],
    },
    {
      id: "g7",
      name: "G7",
      color: "#ffca28",
      members: ["CA", "FR", "DE", "IT", "JP", "GB", "US"],
    },
    {
      id: "g20",
      name: "G20",
      color: "#ffb300",
      members: ["AR", "AU", "BR", "CA", "CN", "FR", "DE", "IN", "ID", "IT", "JP", "KR", "MX", "RU", "SA", "ZA", "TR", "GB", "US"],
    },
  ];

  async function init() {
    cacheElements();
    showLoading();

    if (typeof window.countryMacroData === "undefined") {
      console.error("Country macro data is missing.");
      hideLoading();
      return;
    }

    macroData = window.countryMacroData;
    normalizeDataShape();
    precomputeSectorMaps();
    precomputeBlocMaps();
    setupScales();
    setupControls();
    setupSearch();
    setupSectorChips();
    setupBlocChips();

    renderVisualization();
    updateStats();
    renderTop10();
    addSectorLegend();
    updateSectorLegend();
    updateLastUpdated();

    hideLoading();
  }

  function cacheElements() {
    els.loading = document.getElementById("macroLoading");
    els.viz = document.getElementById("macroViz");
    els.search = document.getElementById("macroSearch");
    els.searchSuggest = document.getElementById("macroSearchSuggest");
    els.detail = document.getElementById("macroDetail");
    els.top10List = document.getElementById("top10List");
    els.top10Sector = document.getElementById("top10Sector");
    els.tooltip = document.getElementById("macroTooltip");

    els.statCountries = document.getElementById("statCountries");
    els.statLinks = document.getElementById("statLinks");
    els.statGdp = document.getElementById("statGdp");

    els.detailFlag = document.getElementById("detailFlag");
    els.detailName = document.getElementById("detailName");
    els.detailIso = document.getElementById("detailIso");
    els.detailGdp = document.getElementById("detailGdp");
    els.detailExports = document.getElementById("detailExports");
    els.detailImports = document.getElementById("detailImports");
    els.detailBalance = document.getElementById("detailBalance");
    els.detailPartners = document.getElementById("detailPartners");
    els.detailSectors = document.getElementById("detailSectors");

    els.tooltipName = document.getElementById("tooltipName");
    els.tooltipGdp = document.getElementById("tooltipGdp");
    els.tooltipTrade = document.getElementById("tooltipTrade");

    els.btnYear = document.getElementById("btnYear");
    els.btnDirection = document.getElementById("btnDirection");
    els.btnThreshold = document.getElementById("btnThreshold");
    els.btnBloc = document.getElementById("btnBloc");
    els.btnSector = document.getElementById("btnSector");
    els.btnReset = document.getElementById("btnReset");

    els.detailBlocs = document.getElementById("detailBlocs");
    els.detailProvenance = document.getElementById("detailProvenance");
  }

  function normalizeDataShape() {
    macroData.nodes = Array.isArray(macroData.nodes) ? macroData.nodes : [];
    macroData.links = Array.isArray(macroData.links) ? macroData.links : [];
    macroData.sectors = Array.isArray(macroData.sectors) ? macroData.sectors : [];
    macroData.topProducersBySectorYear = macroData.topProducersBySectorYear || {};
    macroData.sectorValuesBySectorYear = macroData.sectorValuesBySectorYear || {};

    const linkYears = [...new Set(macroData.links.map((l) => Number(l.year)).filter((y) => Number.isFinite(y)))];
    const producerYears = Object.keys(macroData.topProducersBySectorYear)
      .map(Number)
      .filter((y) => Number.isFinite(y));

    availableYears = (linkYears.length > 0
      ? [...new Set(linkYears)]
      : [...new Set(producerYears)]).sort((a, b) => b - a);
    currentYear = availableYears[0] || currentYear;
    els.btnYear.textContent = `Year: ${currentYear}`;

    if (macroData.sectors.length > 0) {
      const sectorIds = new Set(macroData.sectors.map((s) => s.id));
      if (selectedSector !== "all" && !sectorIds.has(selectedSector)) {
        selectedSector = "all";
      }
      if (els.top10Sector) {
        els.top10Sector.innerHTML = [
          `<option value="all">Default View</option>`,
          ...macroData.sectors.map((sector) => `<option value="${sector.id}">${escapeHtml(sector.name || sector.id)}</option>`),
        ].join("");
        els.top10Sector.value = selectedSector;
      }
    }

    const nodeByIso2 = new Map(macroData.nodes.map((node) => [node.iso2, node]));
    macroData.links = macroData.links.filter((link) => {
      const direction = String(link.direction || "export").toLowerCase();
      link.direction = ["both", "export", "import"].includes(direction) ? direction : "export";
      return nodeByIso2.has(link.s) && nodeByIso2.has(link.t) && link.s !== link.t;
    });

    macroData.nodes.forEach((node) => {
      node.exportsEstimated = Boolean(node.exportsEstimated);
      node.importsEstimated = Boolean(node.importsEstimated);
    });

    Object.values(macroData.topProducersBySectorYear || {}).forEach((yearRows) => {
      Object.values(yearRows || {}).forEach((rows) => {
        if (!Array.isArray(rows)) return;
        rows.forEach((row) => {
          row.provenance = row.provenance === "estimated" ? "estimated" : "observed";
        });
      });
    });
  }

  function precomputeSectorMaps() {
    macroData.sectorValues = {};
    macroData.sectorRanks = {};

    const allYears = new Set([
      ...Object.keys(macroData.topProducersBySectorYear || {}),
      ...Object.keys(macroData.sectorValuesBySectorYear || {}),
    ]);

    for (const year of allYears) {
      macroData.sectorValues[year] = {};
      macroData.sectorRanks[year] = {};

      for (const sector of macroData.sectors) {
        const sectorId = sector.id;

        const detailed = macroData.sectorValuesBySectorYear?.[year]?.[sectorId] || [];
        const top10 = macroData.topProducersBySectorYear?.[year]?.[sectorId] || [];
        const rows = detailed.length > 0 ? detailed : top10;

        const sorted = rows
          .map((row) => ({
            iso2: String(row.iso2 || "").toUpperCase(),
            value: Number(row.value || 0),
          }))
          .filter((row) => row.iso2.length === 2 && row.value > 0)
          .sort((a, b) => b.value - a.value);

        const valueMap = new Map(sorted.map((row) => [row.iso2, row.value]));
        const rankMap = new Map(sorted.map((row, index) => [row.iso2, index + 1]));

        macroData.sectorValues[year][sectorId] = valueMap;
        macroData.sectorRanks[year][sectorId] = rankMap;
      }
    }
  }

  function precomputeBlocMaps() {
    const nodeIso2Set = new Set(macroData.nodes.map((node) => node.iso2));
    const blocById = new Map();
    const memberships = new Map();

    for (const bloc of TRADE_BLOCS) {
      const memberSet = new Set(
        (bloc.members || [])
          .map((code) => String(code || "").toUpperCase())
          .filter((code) => nodeIso2Set.has(code)),
      );

      blocById.set(bloc.id, { ...bloc, memberSet });

      memberSet.forEach((iso2) => {
        if (!memberships.has(iso2)) {
          memberships.set(iso2, []);
        }
        memberships.get(iso2).push(bloc.id);
      });
    }

    macroData.tradeBlocs = TRADE_BLOCS.map((bloc) => ({
      id: bloc.id,
      name: bloc.name,
      color: bloc.color,
      memberCount: blocById.get(bloc.id)?.memberSet.size || 0,
    }));
    macroData.tradeBlocById = blocById;
    macroData.countryBlocMemberships = memberships;
  }

  function setupScales() {
    const maxGdp = d3.max(macroData.nodes, (d) => d.gdpUsd) || 1;
    const maxTrade = d3.max(macroData.links, (d) => d.tradeUsd) || 1;

    macroData.nodes.forEach((node) => {
      const computed = 8 + 52 * Math.sqrt((node.gdpUsd || 0) / maxGdp);
      node.baseZ = clamp(node.bubbleRadius || computed, 8, 60);
      node.displayZ = node.baseZ;
      node.defaultLensScore = 0;
      node.defaultLensGdpNorm = 0;
      node.defaultLensTradeNorm = 0;
      node.defaultTradeFlowUsd = 0;
    });

    macroData.links.forEach((link) => {
      link.v = 1 + 4 * Math.sqrt((link.tradeUsd || 0) / maxTrade);
    });
  }

  function setupControls() {
    els.btnYear.addEventListener("click", cycleYear);
    els.btnDirection.addEventListener("click", cycleDirection);
    els.btnThreshold.addEventListener("click", cycleThreshold);
    els.btnBloc.addEventListener("click", toggleBlocPanel);
    els.btnSector.addEventListener("click", toggleSectorPanel);
    els.btnReset.addEventListener("click", resetView);

    els.top10Sector.addEventListener("change", (event) => {
      selectedSector = event.target.value;
      syncSectorChipState();
      updateSectorVisualization(true);
      renderTop10();
      updateSectorLegend();

      if (selectedCountry) {
        selectCountry(selectedCountry);
      }
    });

    document.getElementById("applySectorFilter").addEventListener("click", applySectorFilter);
    document.getElementById("clearSectorFilter").addEventListener("click", clearSectorFilter);
    document.getElementById("applyBlocFilter").addEventListener("click", applyBlocFilter);
    document.getElementById("clearBlocFilter").addEventListener("click", clearBlocFilter);

    document.addEventListener("keydown", handleGlobalKeydown);
  }

  function setupSearch() {
    els.search.addEventListener("input", handleSearch);
    els.search.addEventListener("focus", handleSearchFocus);
    els.search.addEventListener("blur", () => {
      setTimeout(() => {
        els.searchSuggest.style.display = "none";
      }, 180);
    });
  }

  function handleGlobalKeydown(event) {
    if (event.key === "/") {
      const target = event.target;
      const isTypingTarget =
        target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || target?.isContentEditable;

      if (!isTypingTarget) {
        event.preventDefault();
        els.search?.focus();
        els.search?.select();
      }
      return;
    }

    if (event.key !== "Escape") {
      return;
    }

    const sectorPanel = document.getElementById("sectorFilterPanel");
    const blocPanel = document.getElementById("blocFilterPanel");
    const panelWasOpen = sectorPanel?.classList.contains("show") || blocPanel?.classList.contains("show");
    const detailWasOpen = els.detail?.classList.contains("show");

    sectorPanel?.classList.remove("show");
    blocPanel?.classList.remove("show");
    if (els.searchSuggest) {
      els.searchSuggest.style.display = "none";
    }

    if (detailWasOpen) {
      els.detail.classList.remove("show");
      selectedCountry = null;
      lockId = null;
      resetHighlight();
      return;
    }

    if (!panelWasOpen) {
      resetView();
    }
  }

  function setupSectorChips() {
    const chipContainer = document.getElementById("sectorChips");
    if (!chipContainer) return;

    chipContainer.innerHTML = [
      `<button class="sectorChip${selectedSector === "all" ? " on" : ""}" data-sector="all" style="--sector-color:#7f8ea3">Default</button>`,
      ...macroData.sectors.map((sector) => {
        const color = SECTOR_COLORS[sector.id] || "#e8453c";
        return `<button class="sectorChip${sector.id === selectedSector ? " on" : ""}" data-sector="${sector.id}" style="--sector-color:${color}">${escapeHtml(sector.name || sector.id)}</button>`;
      }),
    ].join("");

    chipContainer.querySelectorAll(".sectorChip").forEach((chip) => {
      chip.addEventListener("click", () => {
        chipContainer.querySelectorAll(".sectorChip").forEach((item) => item.classList.remove("on"));
        chip.classList.add("on");
      });
    });
  }

  function syncSectorChipState() {
    document.querySelectorAll(".sectorChip").forEach((chip) => {
      chip.classList.toggle("on", chip.dataset.sector === selectedSector);
    });
  }

  function setupBlocChips() {
    const chipContainer = document.getElementById("blocChips");
    if (!chipContainer) return;

    const visibleBlocs = macroData.tradeBlocs.filter((bloc) => bloc.id === "all" || bloc.memberCount > 0);

    chipContainer.innerHTML = visibleBlocs
      .map((bloc) => {
        const label = bloc.id === "all" ? bloc.name : `${bloc.name} (${bloc.memberCount})`;
        return `<button class="blocChip${selectedBlocIds.includes(bloc.id) ? " on" : ""}" data-bloc="${bloc.id}" style="--bloc-color:${bloc.color}">${escapeHtml(label)}</button>`;
      })
      .join("");

    chipContainer.querySelectorAll(".blocChip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const blocId = chip.dataset.bloc || "all";

        if (blocId === "all") {
          chipContainer.querySelectorAll(".blocChip").forEach((item) => {
            item.classList.toggle("on", item.dataset.bloc === "all");
          });
          return;
        }

        chip.classList.toggle("on");

        const globalChip = chipContainer.querySelector('.blocChip[data-bloc="all"]');
        if (globalChip) {
          globalChip.classList.remove("on");
        }

        const activeCount = chipContainer.querySelectorAll('.blocChip.on[data-bloc]:not([data-bloc="all"])').length;
        if (activeCount === 0 && globalChip) {
          globalChip.classList.add("on");
        }
      });
    });

    updateBlocButtonLabel();
    syncBlocFilterControls();
  }

  function syncBlocChipState() {
    document.querySelectorAll(".blocChip").forEach((chip) => {
      chip.classList.toggle("on", selectedBlocIds.includes(chip.dataset.bloc || ""));
    });
    updateBlocButtonLabel();
  }

  function syncBlocFilterControls() {
    const modeEl = document.getElementById("blocMode");
    const edgeScopeEl = document.getElementById("blocEdgeScope");
    if (modeEl) modeEl.value = blocCombinationMode;
    if (edgeScopeEl) edgeScopeEl.value = blocEdgeScope;
  }

  function renderVisualization() {
    const priorPositions = new Map(
      macroData.nodes.map((node) => [node.iso2, { x: node.x, y: node.y }]),
    );

    if (settleTimer) {
      clearTimeout(settleTimer);
      settleTimer = null;
    }

    if (simulation) {
      simulation.stop();
      simulation = null;
    }

    els.viz.innerHTML = "";

    W = els.viz.clientWidth;
    H = els.viz.clientHeight;

    const svgRoot = d3
      .select("#macroViz")
      .append("svg")
      .attr("width", W)
      .attr("height", H);

    zoomBehavior = d3.zoom().on("zoom", (event) => {
      graphLayer.attr("transform", event.transform);
    });

    svgRoot.call(zoomBehavior);
    graphLayer = svgRoot.append("g");

    graphLayer
      .append("defs")
      .append("marker")
      .attr("id", "macroArrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 8)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "rgba(100,100,100,0.24)");

    const filteredLinks = filterLinks();
    const nodeByIso2 = new Map(macroData.nodes.map((node) => [node.iso2, node]));

    const resolvedLinks = filteredLinks
      .map((link) => ({
        ...link,
        source: nodeByIso2.get(link.s),
        target: nodeByIso2.get(link.t),
      }))
      .filter((link) => link.source && link.target);

    macroData.nodes.forEach((node) => {
      const prior = priorPositions.get(node.iso2);
      if (prior && Number.isFinite(prior.x) && Number.isFinite(prior.y)) {
        node.x = prior.x;
        node.y = prior.y;
      } else {
        node.x = W * 0.1 + Math.random() * W * 0.8;
        node.y = H * 0.2 + Math.random() * H * 0.6;
      }
      node.displayZ = node.baseZ;
    });

    linkSel = graphLayer
      .append("g")
      .selectAll("line")
      .data(resolvedLinks)
      .join("line")
      .attr("stroke", (d) => baseLinkStroke(d))
      .attr("stroke-width", (d) => baseLinkWidth(d))
      .attr("marker-end", "url(#macroArrow)")
      .attr("cursor", "pointer")
      .on("mouseenter", (event, d) => {
        if (!lockId) showLinkTooltip(d, event);
      })
      .on("mousemove", (event) => {
        if (!lockId) moveTooltip(event);
      })
      .on("mouseleave", () => {
        if (!lockId) els.tooltip.style.display = "none";
      });

    nodeSel = graphLayer
      .append("g")
      .selectAll("g")
      .data(macroData.nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag()
          .on("start", (event, node) => {
            if (!event.active) simulation.alphaTarget(0.06).restart();
            node.fx = node.x;
            node.fy = node.y;
          })
          .on("drag", (event, node) => {
            node.fx = event.x;
            node.fy = event.y;
          })
          .on("end", (event, node) => {
            if (!event.active) simulation.alphaTarget(0);
            node.fx = null;
            node.fy = null;
          }),
      );

    nodeSel
      .append("circle")
      .attr("class", "sector-ring")
      .attr("r", (d) => (d.displayZ || d.baseZ || 10) + 4)
      .attr("fill", "none")
      .attr("stroke", "transparent")
      .attr("stroke-width", 1.2)
      .attr("stroke-dasharray", "4 4")
      .attr("opacity", 0);

    nodeSel
      .append("circle")
      .attr("class", "mc")
      .attr("r", (d) => d.displayZ || d.baseZ || 10)
      .attr("fill", (d) => getCountryColor(d))
      .attr("fill-opacity", 0.35)
      .attr("stroke", "#222")
      .attr("stroke-width", 0.6)
      .on("mouseenter", (event, node) => {
        if (!lockId) {
          showTooltip(node, event);
          highlightNode(node);
        }
      })
      .on("mousemove", (event) => {
        if (!lockId) moveTooltip(event);
      })
      .on("mouseleave", () => {
        if (!lockId) {
          els.tooltip.style.display = "none";
          resetHighlight();
        }
      })
      .on("click", (event, node) => {
        event.stopPropagation();

        if (lockId === node.iso2) {
          lockId = null;
          els.tooltip.style.display = "none";
          resetHighlight();
          return;
        }

        lockId = node.iso2;
        showTooltip(node, event);
        highlightNode(node);
        selectCountry(node);
      });

    labelSel = nodeSel
      .append("text")
      .attr("class", "country-label")
      .text((d) => d.country)
      .attr("dy", (d) => -(d.displayZ || d.baseZ || 10) - 4)
      .attr("text-anchor", "middle")
      .attr("fill", "#666")
      .attr("font-size", (d) => ((d.displayZ || d.baseZ || 10) >= 18 ? "9px" : "7px"))
      .attr("font-family", "'JetBrains Mono', monospace")
      .attr("pointer-events", "none");

    nodeSel
      .append("text")
      .attr("class", "gdp-label")
      .text((d) => formatCurrency(d.gdpUsd))
      .attr("dy", (d) => (d.displayZ || d.baseZ || 10) + 11)
      .attr("text-anchor", "middle")
      .attr("fill", "#444")
      .attr("font-size", "6px")
      .attr("font-family", "'JetBrains Mono', monospace")
      .attr("pointer-events", "none");

    simulation = d3
      .forceSimulation(macroData.nodes)
      .force(
        "link",
        d3
          .forceLink(resolvedLinks)
          .id((d) => d.iso2)
          .distance((d) => (d.v >= 3 ? 70 : 110))
          .strength((d) => (d.v || 1) * 0.11),
      )
      .force("charge", d3.forceManyBody().strength(-180))
      .force("x", d3.forceX(W / 2).strength(0.03))
      .force("y", d3.forceY(H / 2).strength(0.4))
      .force("collision", d3.forceCollide().radius((d) => (d.displayZ || d.baseZ || 10) + 8))
      .alphaDecay(0.016)
      .on("tick", () => {
        macroData.nodes.forEach((node) => {
          const m = (node.displayZ || node.baseZ || 10) + 12;
          node.x = Math.max(m, Math.min(W - m, node.x));
          node.y = Math.max(78 + m, Math.min(H - 20 - m, node.y));
        });

        linkSel
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);

        nodeSel.attr("transform", (d) => `translate(${d.x},${d.y})`);
      });

    settleTimer = setTimeout(() => {
      if (simulation) simulation.stop();
      settleTimer = null;
    }, 7000);

    svgRoot.transition().duration(450).call(zoomBehavior.transform, d3.zoomIdentity.scale(0.82));

    svgRoot.on("click", () => {
      if (lockId) {
        lockId = null;
        els.tooltip.style.display = "none";
        resetHighlight();
      }
    });

    updateSectorVisualization(false);
  }

  function filterLinks() {
    const hasImportRows = macroData.links.some(
      (link) => Number(link.year) === currentYear && link.direction === "import",
    );

    const filtered = [];

    for (const link of macroData.links) {
      if (Number(link.year) !== currentYear) continue;
      if (Number(link.tradeUsd || 0) < minTradeThreshold) continue;

      if (currentDirection === "both") {
        filtered.push(link);
        continue;
      }

      if (currentDirection === "exports") {
        if (link.direction === "import") continue;
        filtered.push(link);
        continue;
      }

      if (currentDirection === "imports") {
        if (hasImportRows) {
          if (link.direction !== "import") continue;
          filtered.push(link);
        } else {
          // Fallback when source dataset only contains exports: mirror flow direction.
          filtered.push({ ...link, s: link.t, t: link.s, direction: "import" });
        }
      }
    }

    const blocMemberSet = getActiveBlocMemberSet();
    if (!blocMemberSet) {
      return filtered;
    }

    if (blocEdgeScope === "internal") {
      return filtered.filter((link) => blocMemberSet.has(link.s) && blocMemberSet.has(link.t));
    }

    return filtered.filter((link) => blocMemberSet.has(link.s) || blocMemberSet.has(link.t));
  }

  function updateSectorVisualization(animated = true) {
    if (!nodeSel || !linkSel) return;

    const isDefaultLens = selectedSector === "all";
    const yearKey = String(currentYear);
    const sectorMap = macroData.sectorValues?.[yearKey]?.[selectedSector] || new Map();
    const rankMap = macroData.sectorRanks?.[yearKey]?.[selectedSector] || new Map();
    const activeBlocs = getActiveBlocs();
    const blocMemberSet = getActiveBlocMemberSet();
    const blocColor = activeBlocs.length === 1 ? activeBlocs[0].color : MULTI_BLOC_COLOR;
    const activeBlocById = new Map(activeBlocs.map((bloc) => [bloc.id, bloc]));
    const defaultLensMetrics = isDefaultLens
      ? computeDefaultLensMetrics(macroData.nodes, linkSel.data())
      : new Map();
    const defaultLensLeaders = new Set(
      isDefaultLens
        ? [...defaultLensMetrics.entries()]
          .sort(([, a], [, b]) => b.score - a.score)
          .slice(0, 8)
          .map(([iso2]) => iso2)
        : [],
    );

    const producerSet = new Set(sectorMap.keys());
    const top3Set = new Set(
      [...rankMap.entries()]
        .filter(([, rank]) => rank <= 3)
        .map(([iso2]) => iso2),
    );

    const sectorColor = SECTOR_COLORS[selectedSector] || "#e8453c";
    const highlightedLinkColor = hexToRgba(sectorColor, 0.34);
    const blocLinkColor = hexToRgba(blocColor, 0.42);
    const maxVisibleLinkV = d3.max(linkSel.data(), (link) => Number(link.v || 0)) || 1;

    macroData.nodes.forEach((node) => {
      node.sectorValue = Number(sectorMap.get(node.iso2) || 0);
      node.sectorRank = Number(rankMap.get(node.iso2) || 0);
      node.isSectorProducer = node.sectorValue > 0;
      node.isBlocMember = blocMemberSet ? blocMemberSet.has(node.iso2) : false;
      node.blocColor = getCountryBlocIds(node.iso2)
        .map((blocId) => activeBlocById.get(blocId))
        .find(Boolean)?.color || blocColor;

      if (isDefaultLens) {
        const metrics = defaultLensMetrics.get(node.iso2);
        node.defaultLensScore = Number(metrics?.score || 0);
        node.defaultLensGdpNorm = Number(metrics?.gdpNorm || 0);
        node.defaultLensTradeNorm = Number(metrics?.tradeNorm || 0);
        node.defaultTradeFlowUsd = Number(metrics?.tradeFlowUsd || 0);
        node.displayZ = clamp(node.baseZ * Number(metrics?.radiusScale || 1), 8, 72);
      } else {
        node.defaultLensScore = 0;
        node.defaultLensGdpNorm = 0;
        node.defaultLensTradeNorm = 0;
        node.defaultTradeFlowUsd = 0;
        node.displayZ = node.baseZ;
      }
    });

    const circleSelection = nodeSel.select(".mc");
    const ringSelection = nodeSel.select(".sector-ring");
    const linkSelection = linkSel;
    const labelSelection = labelSel;
    const gdpLabelSelection = nodeSel.select(".gdp-label");

    const applyCircleRadius = (selection) => {
      selection.attr("r", (node) => node.displayZ || node.baseZ || 10);
    };

    const applyRingRadius = (selection) => {
      selection.attr("r", (node) => (node.displayZ || node.baseZ || 10) + 4);
    };

    const applyCircle = (selection) => {
      selection
        .attr("fill", (node) => {
          if (isDefaultLens) {
            if (blocMemberSet && !node.isBlocMember) return "#222831";
            return getDefaultLensColor(node.defaultLensScore);
          }
          if (node.isSectorProducer) return sectorColor;
          if (blocMemberSet && node.isBlocMember) return node.blocColor || blocColor;
          return getCountryColor(node);
        })
        .attr("fill-opacity", (node) => {
          if (isDefaultLens) {
            if (blocMemberSet && !node.isBlocMember) return 0.1;
            return 0.34 + node.defaultLensScore * 0.5;
          }
          if (blocMemberSet && !node.isBlocMember) return 0.1;
          return node.isSectorProducer ? 0.7 : 0.34;
        })
        .attr("stroke", (node) => {
          if (isDefaultLens) {
            if (blocMemberSet && !node.isBlocMember) return "#283241";
            return getDefaultLensColor(clamp(node.defaultLensScore + 0.12, 0, 1));
          }
          if (node.isSectorProducer) return sectorColor;
          if (blocMemberSet && node.isBlocMember) return node.blocColor || blocColor;
          return "#222";
        })
        .attr("stroke-width", (node) => {
          if (isDefaultLens) {
            if (blocMemberSet && !node.isBlocMember) return 0.4;
            return 0.6 + node.defaultLensScore * 1.4;
          }
          if (blocMemberSet && !node.isBlocMember) return 0.4;
          if (!node.isSectorProducer) return 0.6;
          return node.sectorRank > 0 && node.sectorRank <= 3 ? 2.1 : 1.2;
        });
    };

    const applyRings = (selection) => {
      selection
        .attr("stroke", (node) => {
          if (isDefaultLens) {
            if (defaultLensLeaders.has(node.iso2)) return "#ff9f43";
            if (blocMemberSet && node.isBlocMember) return node.blocColor || blocColor;
            return "transparent";
          }
          if (top3Set.has(node.iso2)) return sectorColor;
          if (blocMemberSet && node.isBlocMember) return node.blocColor || blocColor;
          return "transparent";
        })
        .attr("opacity", (node) => {
          if (isDefaultLens) {
            if (defaultLensLeaders.has(node.iso2)) return 0.78;
            if (blocMemberSet && node.isBlocMember) return 0.52;
            return 0;
          }
          if (top3Set.has(node.iso2)) return 0.86;
          if (blocMemberSet && node.isBlocMember) return 0.55;
          return 0;
        });
    };

    const applyLinks = (selection) => {
      selection
        .attr("stroke", (link) => {
          const sourceIso = link.s || link.source?.iso2;
          const targetIso = link.t || link.target?.iso2;
          const linkIntensity = Math.sqrt(Math.max(0, Number(link.v || 0)) / maxVisibleLinkV);
          const touchesBloc = blocMemberSet && (blocMemberSet.has(sourceIso) || blocMemberSet.has(targetIso));

          if (isDefaultLens) {
            if (blocMemberSet && !touchesBloc) return "#111317";
            if (touchesBloc) {
              const linkBlocColor = activeBlocs.find((bloc) => bloc.memberSet.has(sourceIso) || bloc.memberSet.has(targetIso))?.color;
              if (linkBlocColor) {
                return hexToRgba(linkBlocColor, 0.42 + linkIntensity * 0.38);
              }
            }
            return getDefaultLinkColor(linkIntensity);
          }

          if (touchesBloc) {
            const linkBlocColor = activeBlocs.find((bloc) => bloc.memberSet.has(sourceIso) || bloc.memberSet.has(targetIso))?.color;
            return linkBlocColor ? hexToRgba(linkBlocColor, 0.42) : blocLinkColor;
          }
          if (producerSet.has(sourceIso) || producerSet.has(targetIso)) {
            return highlightedLinkColor;
          }
          return baseLinkStroke(link);
        })
        .attr("stroke-width", (link) => {
          const sourceIso = link.s || link.source?.iso2;
          const targetIso = link.t || link.target?.iso2;
          const linkIntensity = Math.sqrt(Math.max(0, Number(link.v || 0)) / maxVisibleLinkV);
          const touchesBloc = blocMemberSet && (blocMemberSet.has(sourceIso) || blocMemberSet.has(targetIso));

          if (isDefaultLens) {
            if (blocMemberSet && !touchesBloc) return 0.3;
            return 0.5 + linkIntensity * 2.1;
          }

          if (touchesBloc) {
            return Math.max(1.1, link.v * 0.95);
          }
          if (producerSet.has(sourceIso) || producerSet.has(targetIso)) {
            return Math.max(1, link.v * 0.9);
          }
          return baseLinkWidth(link);
        })
        .attr("stroke-opacity", (link) => {
          const sourceIso = link.s || link.source?.iso2;
          const targetIso = link.t || link.target?.iso2;
          const linkIntensity = Math.sqrt(Math.max(0, Number(link.v || 0)) / maxVisibleLinkV);
          const touchesBloc = blocMemberSet && (blocMemberSet.has(sourceIso) || blocMemberSet.has(targetIso));

          if (isDefaultLens) {
            if (blocMemberSet && !touchesBloc) return 0.08;
            return 0.44 + linkIntensity * 0.5;
          }

          if (blocMemberSet) {
            if (touchesBloc) return 0.9;
            return 0.08;
          }
          return producerSet.has(sourceIso) || producerSet.has(targetIso) ? 0.9 : 0.75;
        });
    };

    const applyCountryLabels = (selection) => {
      selection
        .attr("fill", (node) => {
          if (isDefaultLens) {
            if (blocMemberSet && !node.isBlocMember) return "#444";
            return node.defaultLensScore >= 0.55 ? "#ddd" : "#677487";
          }
          if (blocMemberSet && !node.isBlocMember) return "#444";
          return node.isSectorProducer ? "#ddd" : "#666";
        })
        .attr("fill-opacity", (node) => {
          if (isDefaultLens) {
            if (blocMemberSet && !node.isBlocMember) return 0.4;
            return 0.56 + node.defaultLensScore * 0.44;
          }
          return blocMemberSet && !node.isBlocMember ? 0.45 : 1;
        })
        .attr("dy", (node) => -(node.displayZ || node.baseZ || 10) - 4)
        .attr("font-size", (node) => ((node.displayZ || node.baseZ || 10) >= 18 ? "9px" : "7px"));
    };

    const applyGdpLabels = (selection) => {
      selection
        .attr("fill", (node) => {
          if (isDefaultLens && !(blocMemberSet && !node.isBlocMember)) {
            return node.defaultLensScore >= 0.7 ? "#667788" : "#4a4f59";
          }
          return "#444";
        })
        .attr("fill-opacity", (node) => {
          if (blocMemberSet && !node.isBlocMember) return 0.35;
          return 0.9;
        })
        .attr("dy", (node) => (node.displayZ || node.baseZ || 10) + 11);
    };

    if (animated) {
      applyCircleRadius(circleSelection.transition().duration(280));
      applyRingRadius(ringSelection.transition().duration(280));
      applyCircle(circleSelection.transition().duration(280));
      applyRings(ringSelection.transition().duration(280));
      applyLinks(linkSelection.transition().duration(260));
      applyCountryLabels(labelSelection.transition().duration(220));
      applyGdpLabels(gdpLabelSelection.transition().duration(220));
    } else {
      applyCircleRadius(circleSelection);
      applyRingRadius(ringSelection);
      applyCircle(circleSelection);
      applyRings(ringSelection);
      applyLinks(linkSelection);
      applyCountryLabels(labelSelection);
      applyGdpLabels(gdpLabelSelection);
    }

    if (simulation && animated) {
      simulation.force("collision", d3.forceCollide().radius((node) => (node.displayZ || node.baseZ || 10) + 8));
      simulation.alpha(0.16).restart();
    }
  }

  function handleSearch(event) {
    const query = event.target.value.toLowerCase().trim();

    if (query.length < 2) {
      els.searchSuggest.style.display = "none";
      return;
    }

    const matches = macroData.nodes
      .filter(
        (node) =>
          node.country.toLowerCase().includes(query)
          || node.iso2.toLowerCase().includes(query)
          || node.iso3.toLowerCase().includes(query),
      )
      .slice(0, 10);

    if (matches.length === 0) {
      els.searchSuggest.style.display = "none";
      return;
    }

    els.searchSuggest.innerHTML = matches
      .map((node) => {
        return `<div class="suggest-item" data-iso="${node.iso2}">${escapeHtml(node.country)} (${node.iso2})</div>`;
      })
      .join("");

    els.searchSuggest.style.display = "block";

    els.searchSuggest.querySelectorAll(".suggest-item").forEach((item) => {
      item.addEventListener("click", () => {
        const iso2 = item.dataset.iso;
        const node = macroData.nodes.find((country) => country.iso2 === iso2);
        if (!node) return;

        lockId = node.iso2;
        selectCountry(node);
        highlightNode(node);
        els.search.value = "";
        els.searchSuggest.style.display = "none";
      });
    });
  }

  function handleSearchFocus() {
    if (els.search.value.trim().length >= 2) {
      els.searchSuggest.style.display = "block";
    }
  }

  function showTooltip(node, event) {
    const sectorValue = getSectorValue(node.iso2, selectedSector, currentYear);
    const sectorRank = getSectorRank(node.iso2, selectedSector, currentYear);
    const sectorColor = selectedSector === "all" ? "#dddddd" : (SECTOR_COLORS[selectedSector] || "#e8453c");
    const blocNames = getCountryBlocNames(node.iso2);
    const sectorProvenance = getSectorProvenance(node.iso2, selectedSector, currentYear);
    const tradeProvenance = node.exportsEstimated || node.importsEstimated ? "estimated" : "observed";
    const inDefaultSectorMode = selectedSector === "all";

    els.tooltipName.textContent = node.country;
    els.tooltipName.style.color = sectorColor;
    els.tooltipGdp.textContent = `GDP: ${formatCurrency(node.gdpUsd)} | ${currentYear}`;

    const sectorSummary = inDefaultSectorMode
      ? `<div style="margin-top:6px;color:#aab6c7;font-weight:600;">Default lens: ${Math.round((node.defaultLensScore || 0) * 100)}/100</div>
         <div style="margin-top:4px;color:#6f7f92;">GDP signal ${Math.round((node.defaultLensGdpNorm || 0) * 100)} | Trade signal ${Math.round((node.defaultLensTradeNorm || 0) * 100)}</div>
         <div style="margin-top:4px;color:#6f7f92;">Visible trade intensity: ${formatCurrency(node.defaultTradeFlowUsd || 0)}</div>`
      : sectorValue > 0
        ? `<div style="margin-top:6px;color:${sectorColor};font-weight:600;">${toTitleCase(selectedSector)}: ${formatCurrency(sectorValue)} (rank #${sectorRank})</div>`
        : `<div style="margin-top:6px;color:#666;">No ${toTitleCase(selectedSector)} top-producer record</div>`;

    els.tooltipTrade.innerHTML = `
      <div>Total trade links (${currentYear}): ${formatCurrency(getTotalTrade(node.iso2))}</div>
      <div>Exports: ${formatCurrency(node.exportsUsd)}</div>
      <div>Imports: ${formatCurrency(node.importsUsd)}</div>
      <div>Trade data: ${formatProvenanceLabel(tradeProvenance)}</div>
      <div>Blocs: ${blocNames.length > 0 ? escapeHtml(blocNames.join(", ")) : "None in configured blocs"}</div>
      <div>${inDefaultSectorMode ? "Default lens" : `${toTitleCase(selectedSector)} data`}: ${inDefaultSectorMode ? "GDP + Trade Heat" : formatProvenanceLabel(sectorProvenance)}</div>
      ${sectorSummary}
    `;

    els.tooltip.style.display = "block";
    moveTooltip(event);
  }

  function showLinkTooltip(link, event) {
    const source = link.source || macroData.nodes.find((node) => node.iso2 === link.s);
    const target = link.target || macroData.nodes.find((node) => node.iso2 === link.t);

    els.tooltipName.textContent = `${source?.country || link.s} -> ${target?.country || link.t}`;
    els.tooltipName.style.color = "#ddd";
    els.tooltipGdp.textContent = `Year: ${link.year} | Direction: ${link.direction}`;
    els.tooltipTrade.textContent = `Trade: ${formatCurrency(link.tradeUsd)}`;

    els.tooltip.style.display = "block";
    moveTooltip(event);
  }

  function moveTooltip(event) {
    let x = event.clientX + 14;
    let y = event.clientY - 10;
    if (x + 460 > W) x = event.clientX - 460;
    if (y + 260 > H) y = H - 270;
    els.tooltip.style.left = `${x}px`;
    els.tooltip.style.top = `${y}px`;
  }

  function connected(iso2) {
    const all = new Set([iso2]);

    linkSel.data().forEach((link) => {
      const s = link.s || link.source?.iso2;
      const t = link.t || link.target?.iso2;
      if (s === iso2) all.add(t);
      if (t === iso2) all.add(s);
    });

    return { all };
  }

  function highlightNode(node) {
    if (!nodeSel || !linkSel) return;

    const conn = connected(node.iso2);

    nodeSel
      .select(".mc")
      .transition()
      .duration(150)
      .attr("fill-opacity", (candidate) => {
        if (conn.all.has(candidate.iso2)) {
          return candidate.isSectorProducer ? 0.9 : 0.76;
        }
        return 0.08;
      });

    labelSel
      .transition()
      .duration(150)
      .attr("fill-opacity", (candidate) => (conn.all.has(candidate.iso2) ? 1 : 0.18));

    linkSel
      .transition()
      .duration(150)
      .attr("stroke-opacity", (link) => {
        const s = link.s || link.source?.iso2;
        const t = link.t || link.target?.iso2;
        return s === node.iso2 || t === node.iso2 ? 1 : 0.03;
      })
      .attr("stroke", (link) => {
        const s = link.s || link.source?.iso2;
        const t = link.t || link.target?.iso2;
        if (s === node.iso2) return "var(--acc)";
        if (t === node.iso2) return "var(--blue)";
        return "#111";
      })
      .attr("stroke-width", (link) => {
        const s = link.s || link.source?.iso2;
        const t = link.t || link.target?.iso2;
        return s === node.iso2 || t === node.iso2 ? 2 : 0.3;
      });
  }

  function resetHighlight() {
    updateSectorVisualization(false);
    if (!labelSel) return;
    labelSel.attr("fill-opacity", 1);
  }

  function selectCountry(country) {
    selectedCountry = country;

    const sectorColor = selectedSector === "all" ? "#dddddd" : (SECTOR_COLORS[selectedSector] || "#e8453c");
    const sectorValue = getSectorValue(country.iso2, selectedSector, currentYear);
    const sectorRank = getSectorRank(country.iso2, selectedSector, currentYear);

    els.detailFlag.textContent = getFlagEmoji(country.iso2);
    els.detailName.textContent = country.country;
    els.detailName.style.color = sectorColor;
    els.detailIso.textContent = `${country.iso2} | ${country.iso3}`;

    els.detailGdp.textContent = formatCurrency(country.gdpUsd);
    els.detailExports.textContent = formatCurrency(country.exportsUsd);
    els.detailImports.textContent = formatCurrency(country.importsUsd);

    const balance = country.exportsUsd - country.importsUsd;
    els.detailBalance.textContent = `${balance >= 0 ? "+" : ""}${formatCurrency(balance)}`;
    els.detailBalance.style.color = balance >= 0 ? "var(--green)" : "var(--acc)";

    const partners = getTradePartners(country.iso2).slice(0, 6);
    els.detailPartners.innerHTML = partners.length > 0
      ? partners
        .map((partner) => `<div class="partnerItem"><span>${escapeHtml(partner.country)}</span><b>${formatCurrency(partner.tradeUsd)}</b></div>`)
        .join("")
      : `<div class="partnerItem"><span>No partner data for ${currentYear}</span><b>-</b></div>`;

    const sectorRows = macroData.sectors
      .map((sector) => {
        const value = getSectorValue(country.iso2, sector.id, currentYear);
        return {
          id: sector.id,
          name: sector.name || sector.id,
          value,
          rank: getSectorRank(country.iso2, sector.id, currentYear),
        };
      })
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const selectedSectorRow = {
      name: toTitleCase(selectedSector),
      value: sectorValue,
      rank: sectorRank,
    };

    const sectorSummary = sectorValue > 0
      ? `${formatCurrency(selectedSectorRow.value)} (rank #${selectedSectorRow.rank})`
      : "Not in current top producers";

    const sectorProvenance = getSectorProvenance(country.iso2, selectedSector, currentYear);
    const inDefaultSectorMode = selectedSector === "all";
    const defaultLensScorePct = Math.round((country.defaultLensScore || 0) * 100);
    const defaultLensTradePct = Math.round((country.defaultLensTradeNorm || 0) * 100);
    const defaultLensGdpPct = Math.round((country.defaultLensGdpNorm || 0) * 100);

    els.detailSectors.innerHTML = `
      ${inDefaultSectorMode
        ? `<div class="sectorItem"><span>Current mode</span><b>Default lens: GDP + Trade Heat</b></div>
           <div class="sectorItem"><span>Lens score</span><b>${defaultLensScorePct}/100</b></div>
           <div class="sectorItem"><span>GDP signal / Trade signal</span><b>${defaultLensGdpPct} / ${defaultLensTradePct}</b></div>
           <div class="sectorItem"><span>Visible trade intensity</span><b>${formatCurrency(country.defaultTradeFlowUsd || 0)}</b></div>`
        : `<div class="sectorItem"><span style="color:${sectorColor}">${escapeHtml(selectedSectorRow.name)} focus</span><b style="color:${sectorColor}">${sectorSummary}</b></div>`}
      ${sectorRows
        .map((row) => `<div class="sectorItem"><span>${escapeHtml(row.name)}</span><b>${formatCurrency(row.value)}${row.rank ? ` (#${row.rank})` : ""}</b></div>`)
        .join("")}
    `;

    const blocRows = getCountryBlocRows(country.iso2);
    els.detailBlocs.innerHTML = blocRows.length > 0
      ? blocRows
        .map((bloc) => `<div class="sectorItem"><span style="color:${bloc.color}">${escapeHtml(bloc.name)}</span><b>${bloc.memberCount} members</b></div>`)
        .join("")
      : `<div class="sectorItem"><span>Membership</span><b>None</b></div>`;

    const tradeProvenance = country.exportsEstimated || country.importsEstimated ? "estimated" : "observed";
    const exportsProvenance = country.exportsEstimated ? "estimated" : "observed";
    const importsProvenance = country.importsEstimated ? "estimated" : "observed";
    if (els.detailProvenance) {
      els.detailProvenance.innerHTML = `
        <div class="sectorItem">
          <span>Trade totals (${currentYear})</span>
          <b>${formatProvenanceLabel(tradeProvenance)}</b>
        </div>
        <div class="sectorItem">
          <span>Exports value</span>
          <b>${formatProvenanceLabel(exportsProvenance)}</b>
        </div>
        <div class="sectorItem">
          <span>Imports value</span>
          <b>${formatProvenanceLabel(importsProvenance)}</b>
        </div>
        <div class="sectorItem">
          <span>${inDefaultSectorMode ? "Product ranking" : `${escapeHtml(toTitleCase(selectedSector))} ranking`}</span>
          <b>${inDefaultSectorMode ? "Not selected" : formatProvenanceLabel(sectorProvenance)}</b>
        </div>
      `;
    }

    els.detail.classList.add("show");
  }

  function getTradePartners(iso2) {
    const partnerMap = new Map();

    macroData.links.forEach((link) => {
      if (Number(link.year) !== currentYear) return;

      const source = String(link.s || "").toUpperCase();
      const target = String(link.t || "").toUpperCase();
      const value = Number(link.tradeUsd || 0);
      if (!(value > 0)) return;

      if (source === iso2) {
        const node = macroData.nodes.find((country) => country.iso2 === target);
        if (!node) return;

        const current = partnerMap.get(target) || { country: node.country, tradeUsd: 0 };
        current.tradeUsd += value;
        partnerMap.set(target, current);
      }

      if (target === iso2) {
        const node = macroData.nodes.find((country) => country.iso2 === source);
        if (!node) return;

        const current = partnerMap.get(source) || { country: node.country, tradeUsd: 0 };
        current.tradeUsd += value;
        partnerMap.set(source, current);
      }
    });

    return [...partnerMap.values()].sort((a, b) => b.tradeUsd - a.tradeUsd);
  }

  function renderTop10() {
    const yearKey = String(currentYear);
    const top10 = macroData.topProducersBySectorYear?.[yearKey]?.[selectedSector] || [];

    const sectorColor = SECTOR_COLORS[selectedSector] || "#e8453c";
    if (selectedSector === "all") {
      els.top10List.innerHTML = `<div class="top10Item">Choose a product sector to view top producers.</div>`;
      return;
    }

    if (top10.length === 0) {
      els.top10List.innerHTML = `<div class="top10Item">No ${escapeHtml(toTitleCase(selectedSector))} producer data for ${yearKey}</div>`;
      return;
    }

    const maxValue = top10[0].value || 1;

    els.top10List.innerHTML = top10
      .slice(0, 10)
      .map((entry, index) => {
        const country = macroData.nodes.find((node) => node.iso2 === entry.iso2);
        const share = ((entry.value / maxValue) * 100).toFixed(0);
        const provenance = entry.provenance === "estimated" ? "estimated" : "observed";

        return `
          <div class="top10Item" data-iso="${entry.iso2}" style="border-left:3px solid ${sectorColor};">
            <span class="rank">${index + 1}</span>
            <span class="flag">${getFlagEmoji(entry.iso2)}</span>
            <div class="info">
              <div class="country">${escapeHtml(country ? country.country : entry.iso2)}</div>
              <div style="font-size:7px;color:#666;">${share}% of leader</div>
            </div>
            ${formatProvenanceBadge(provenance)}
            <span class="value" style="color:${sectorColor};">${formatCurrency(entry.value)}</span>
          </div>
        `;
      })
      .join("");

    els.top10List.querySelectorAll(".top10Item").forEach((item) => {
      item.addEventListener("click", () => {
        const iso2 = item.dataset.iso;
        const country = macroData.nodes.find((node) => node.iso2 === iso2);
        if (!country) return;

        lockId = country.iso2;
        selectCountry(country);
        highlightNode(country);
      });
    });
  }

  function addSectorLegend() {
    if (document.getElementById("sectorLegend")) {
      return;
    }

    const legend = document.createElement("div");
    legend.id = "sectorLegend";
    legend.innerHTML = `
      <div class="legendTitle">Sector</div>
      <div class="legendValue" id="legendSectorName">-</div>
      <div class="legendStat">
        <span class="legendLabel">Top Producer</span>
        <span class="legendStatValue" id="legendTopProducer">-</span>
      </div>
      <div class="legendStat">
        <span class="legendLabel">Top 10 Total</span>
        <span class="legendStatValue" id="legendTotal">-</span>
      </div>
      <div class="legendMeta" id="legendProvenance">Data provenance: -</div>
    `;

    document.body.appendChild(legend);
  }

  function updateSectorLegend() {
    const sectorColor = SECTOR_COLORS[selectedSector] || "#e8453c";
    const yearKey = String(currentYear);
    const rows = macroData.topProducersBySectorYear?.[yearKey]?.[selectedSector] || [];

    const nameEl = document.getElementById("legendSectorName");
    const topEl = document.getElementById("legendTopProducer");
    const totalEl = document.getElementById("legendTotal");
    const provenanceEl = document.getElementById("legendProvenance");

    if (!nameEl || !topEl || !totalEl || !provenanceEl) {
      return;
    }

    if (selectedSector === "all") {
      const leader = [...macroData.nodes]
        .sort((a, b) => Number(b.defaultLensScore || 0) - Number(a.defaultLensScore || 0))[0];
      const visibleTrade = (linkSel?.data?.() || [])
        .reduce((sum, link) => sum + Number(link.tradeUsd || 0), 0);

      nameEl.textContent = "Default Lens";
      nameEl.style.color = "#9fb3c8";
      topEl.textContent = leader
        ? `${leader.country} (${Math.round((leader.defaultLensScore || 0) * 100)}/100)`
        : "-";
      totalEl.textContent = formatCurrency(visibleTrade);
      provenanceEl.textContent = `Default lens: ${Math.round(DEFAULT_VIEW_LENS.gdpWeight * 100)}% GDP + ${Math.round(DEFAULT_VIEW_LENS.tradeWeight * 100)}% trade intensity`;
      return;
    }

    nameEl.textContent = toTitleCase(selectedSector);
    nameEl.style.color = sectorColor;

    if (rows.length === 0) {
      topEl.textContent = "-";
      totalEl.textContent = "-";
      provenanceEl.textContent = "Data provenance: no data";
      return;
    }

    const topCountry = macroData.nodes.find((node) => node.iso2 === rows[0].iso2);
    const total = rows.reduce((sum, row) => sum + Number(row.value || 0), 0);
    const estimatedCount = rows.filter((row) => row.provenance === "estimated").length;
    const observedCount = rows.length - estimatedCount;

    topEl.textContent = topCountry ? topCountry.country : rows[0].iso2;
    totalEl.textContent = formatCurrency(total);
    provenanceEl.textContent = `Data provenance: ${observedCount} observed / ${estimatedCount} estimated`;
  }

  function cycleYear() {
    if (availableYears.length === 0) return;

    const currentIndex = availableYears.indexOf(currentYear);
    const nextIndex = (currentIndex + 1) % availableYears.length;
    currentYear = availableYears[nextIndex];
    els.btnYear.textContent = `Year: ${currentYear}`;

    renderVisualization();
    renderTop10();
    updateSectorLegend();
    updateStats();

    if (selectedCountry) {
      selectCountry(selectedCountry);
    }
  }

  function cycleDirection() {
    const directions = ["both", "exports", "imports"];
    const currentIndex = directions.indexOf(currentDirection);
    currentDirection = directions[(currentIndex + 1) % directions.length];

    els.btnDirection.textContent = `Direction: ${toTitleCase(currentDirection)}`;

    renderVisualization();
    updateStats();
  }

  function cycleThreshold() {
    const thresholds = [1e9, 5e9, 10e9, 25e9, 50e9, 100e9];
    const currentIndex = thresholds.indexOf(minTradeThreshold);
    minTradeThreshold = thresholds[(currentIndex + 1) % thresholds.length];

    els.btnThreshold.textContent = `Min Trade: ${formatCurrency(minTradeThreshold)}`;

    renderVisualization();
    updateStats();
  }

  function toggleSectorPanel() {
    document.getElementById("blocFilterPanel").classList.remove("show");
    document.getElementById("sectorFilterPanel").classList.toggle("show");
  }

  function toggleBlocPanel() {
    document.getElementById("sectorFilterPanel").classList.remove("show");
    document.getElementById("blocFilterPanel").classList.toggle("show");
  }

  function applySectorFilter() {
    const activeChip = document.querySelector(".sectorChip.on");
    if (!activeChip) {
      document.getElementById("sectorFilterPanel").classList.remove("show");
      return;
    }

    selectedSector = activeChip.dataset.sector;
    els.top10Sector.value = selectedSector;

    updateSectorVisualization(true);
    renderTop10();
    updateSectorLegend();

    if (selectedCountry) {
      selectCountry(selectedCountry);
    }

    document.getElementById("sectorFilterPanel").classList.remove("show");
  }

  function clearSectorFilter() {
    selectedSector = "all";
    els.top10Sector.value = selectedSector;
    syncSectorChipState();

    updateSectorVisualization(true);
    renderTop10();
    updateSectorLegend();

    if (selectedCountry) {
      selectCountry(selectedCountry);
    }

    document.getElementById("sectorFilterPanel").classList.remove("show");
  }

  function applyBlocFilter() {
    const activeChipIds = [...document.querySelectorAll(".blocChip.on")]
      .map((chip) => chip.dataset.bloc || "")
      .filter(Boolean);

    selectedBlocIds = normalizeBlocSelection(activeChipIds);
    const modeEl = document.getElementById("blocMode");
    const edgeScopeEl = document.getElementById("blocEdgeScope");
    blocCombinationMode = modeEl?.value === "intersection" ? "intersection" : "union";
    blocEdgeScope = edgeScopeEl?.value === "internal" ? "internal" : "touching";
    syncBlocChipState();
    syncBlocFilterControls();
    renderVisualization();
    updateStats();
    updateSectorLegend();

    if (selectedCountry) {
      selectCountry(selectedCountry);
    }

    document.getElementById("blocFilterPanel").classList.remove("show");
  }

  function clearBlocFilter() {
    selectedBlocIds = ["all"];
    blocCombinationMode = "union";
    blocEdgeScope = "touching";
    syncBlocChipState();
    syncBlocFilterControls();
    renderVisualization();
    updateStats();
    updateSectorLegend();

    if (selectedCountry) {
      selectCountry(selectedCountry);
    }

    document.getElementById("blocFilterPanel").classList.remove("show");
  }

  function resetView() {
    currentYear = availableYears[0] || currentYear;
    currentDirection = "both";
    minTradeThreshold = 1e9;
    selectedSector = "all";
    selectedBlocIds = ["all"];
    blocCombinationMode = "union";
    blocEdgeScope = "touching";
    selectedCountry = null;
    lockId = null;

    els.btnYear.textContent = `Year: ${currentYear}`;
    els.btnDirection.textContent = "Direction: Both";
    els.btnThreshold.textContent = "Min Trade: $1.00B";
    els.top10Sector.value = selectedSector;

    syncSectorChipState();
    syncBlocChipState();
    syncBlocFilterControls();

    if (els.detail) {
      els.detail.classList.remove("show");
    }

    renderVisualization();
    renderTop10();
    updateSectorLegend();
    updateStats();
  }

  function updateStats() {
    const blocMembers = getActiveBlocMemberSet();
    const countryCount = blocMembers ? blocMembers.size : macroData.nodes.length;
    els.statCountries.textContent = String(countryCount);

    const filteredLinkCount = filterLinks().length;
    els.statLinks.textContent = String(filteredLinkCount);

    const scopedNodes = blocMembers
      ? macroData.nodes.filter((node) => blocMembers.has(node.iso2))
      : macroData.nodes;
    const totalGdp = scopedNodes.reduce((sum, node) => sum + Number(node.gdpUsd || 0), 0);
    els.statGdp.textContent = formatCurrency(totalGdp);
  }

  function updateLastUpdated() {
    const label = document.getElementById("lastUpdated");
    if (!label) return;

    const sourceDate =
      macroData?.meta?.snapshotDate
      || (macroData?.meta?.generatedAt ? new Date(macroData.meta.generatedAt).toISOString().split("T")[0] : null);

    if (sourceDate) {
      label.textContent = `Last updated: ${sourceDate}`;
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    label.textContent = `Last updated: ${today}`;
  }

  function normalizeBlocSelection(blocIds) {
    const validBlocIds = new Set(TRADE_BLOCS.map((bloc) => bloc.id));
    const unique = [...new Set((blocIds || []).filter((blocId) => validBlocIds.has(blocId)))];
    const nonGlobal = unique.filter((blocId) => blocId !== "all");

    if (unique.length === 0 || unique.includes("all")) {
      return ["all"];
    }

    return nonGlobal.length > 0 ? nonGlobal : ["all"];
  }

  function getActiveBlocs() {
    if (selectedBlocIds.includes("all")) {
      return [];
    }

    return selectedBlocIds
      .map((blocId) => macroData.tradeBlocById?.get(blocId))
      .filter(Boolean);
  }

  function getActiveBlocMemberSet() {
    const activeBlocs = getActiveBlocs();
    if (activeBlocs.length === 0) {
      return null;
    }

    if (blocCombinationMode === "intersection") {
      const intersection = new Set(activeBlocs[0].memberSet || []);
      for (let i = 1; i < activeBlocs.length; i += 1) {
        const memberSet = activeBlocs[i].memberSet || new Set();
        [...intersection].forEach((iso2) => {
          if (!memberSet.has(iso2)) {
            intersection.delete(iso2);
          }
        });
      }
      return intersection;
    }

    const union = new Set();
    activeBlocs.forEach((bloc) => {
      bloc.memberSet?.forEach((iso2) => union.add(iso2));
    });
    return union;
  }

  function getCountryBlocIds(iso2) {
    return macroData.countryBlocMemberships?.get(iso2) || [];
  }

  function getCountryBlocRows(iso2) {
    return getCountryBlocIds(iso2)
      .map((blocId) => macroData.tradeBlocById?.get(blocId))
      .filter(Boolean)
      .map((bloc) => ({
        id: bloc.id,
        name: bloc.name,
        color: bloc.color,
        memberCount: bloc.memberSet?.size || 0,
      }));
  }

  function getCountryBlocNames(iso2) {
    return getCountryBlocRows(iso2).map((bloc) => bloc.name);
  }

  function updateBlocButtonLabel() {
    const activeBlocs = getActiveBlocs();
    let label = "Global";

    if (activeBlocs.length === 1) {
      label = activeBlocs[0].name;
    } else if (activeBlocs.length === 2) {
      label = `${activeBlocs[0].name} + ${activeBlocs[1].name}`;
    } else if (activeBlocs.length > 2) {
      label = `${activeBlocs.length} Blocs`;
    }

    if (activeBlocs.length > 0) {
      label = `${label} [${blocCombinationMode}/${blocEdgeScope}]`;
    }

    if (els.btnBloc) {
      els.btnBloc.textContent = `Bloc: ${label}`;
    }
  }

  function getSectorTopProducerEntry(iso2, sectorId, year) {
    const rows = macroData.topProducersBySectorYear?.[String(year)]?.[sectorId] || [];
    return rows.find((row) => row.iso2 === iso2) || null;
  }

  function getSectorProvenance(iso2, sectorId, year) {
    if (sectorId === "all") return "not-selected";
    const topEntry = getSectorTopProducerEntry(iso2, sectorId, year);
    if (topEntry?.provenance === "estimated") return "estimated";
    if (topEntry?.provenance === "observed") return "observed";
    return getSectorValue(iso2, sectorId, year) > 0 ? "observed" : "not-ranked";
  }

  function formatProvenanceLabel(provenance) {
    if (provenance === "estimated") return "Estimated";
    if (provenance === "observed") return "Observed";
    if (provenance === "not-selected") return "Not selected";
    return "Not ranked";
  }

  function formatProvenanceBadge(provenance) {
    const normalized = provenance === "estimated" ? "estimated" : "observed";
    const label = normalized === "estimated" ? "Estimated" : "Observed";
    return `<span class="provBadge ${normalized}" title="Data provenance">${label}</span>`;
  }

  function getSectorValue(iso2, sectorId, year) {
    return Number(macroData.sectorValues?.[String(year)]?.[sectorId]?.get(iso2) || 0);
  }

  function getSectorRank(iso2, sectorId, year) {
    return Number(macroData.sectorRanks?.[String(year)]?.[sectorId]?.get(iso2) || 0);
  }

  function getTotalTrade(iso2) {
    return macroData.links
      .filter((link) => Number(link.year) === currentYear && (link.s === iso2 || link.t === iso2))
      .reduce((sum, link) => sum + Number(link.tradeUsd || 0), 0);
  }

  function computeDefaultLensMetrics(nodes, links) {
    const tradeByIso2 = new Map();
    const maxGdp = d3.max(nodes, (node) => Number(node.gdpUsd || 0)) || 1;

    (links || []).forEach((link) => {
      const tradeValue = Number(link.tradeUsd || 0);
      if (!(tradeValue > 0)) return;

      const sourceIso = String(link.s || link.source?.iso2 || "").toUpperCase();
      const targetIso = String(link.t || link.target?.iso2 || "").toUpperCase();
      if (sourceIso) {
        tradeByIso2.set(sourceIso, Number(tradeByIso2.get(sourceIso) || 0) + tradeValue);
      }
      if (targetIso) {
        tradeByIso2.set(targetIso, Number(tradeByIso2.get(targetIso) || 0) + tradeValue);
      }
    });

    const maxTradeFlow = d3.max([...tradeByIso2.values()]) || 1;
    const metricsByIso2 = new Map();

    nodes.forEach((node) => {
      const gdpNorm = Math.sqrt(Number(node.gdpUsd || 0) / maxGdp);
      const tradeFlowUsd = Number(tradeByIso2.get(node.iso2) || 0);
      const tradeNorm = Math.sqrt(tradeFlowUsd / maxTradeFlow);
      const score = clamp(
        (DEFAULT_VIEW_LENS.gdpWeight * gdpNorm)
          + (DEFAULT_VIEW_LENS.tradeWeight * tradeNorm),
        0,
        1,
      );

      metricsByIso2.set(node.iso2, {
        score,
        gdpNorm,
        tradeNorm,
        tradeFlowUsd,
        radiusScale: DEFAULT_VIEW_LENS.bubbleScaleFloor + (score * DEFAULT_VIEW_LENS.bubbleScaleRange),
      });
    });

    return metricsByIso2;
  }

  function getDefaultLensColor(score) {
    const normalized = clamp(Number(score || 0), 0, 1);
    return d3.interpolateLab(DEFAULT_VIEW_LENS.lowNodeColor, DEFAULT_VIEW_LENS.highNodeColor)(normalized);
  }

  function getDefaultLinkColor(score) {
    const normalized = clamp(Number(score || 0), 0, 1);
    return d3.interpolateLab(DEFAULT_VIEW_LENS.lowLinkColor, DEFAULT_VIEW_LENS.highLinkColor)(normalized);
  }

  function baseLinkStroke(link) {
    if ((link.v || 1) >= 3) return BASE_LINK_COLOR.high;
    if ((link.v || 1) >= 2) return BASE_LINK_COLOR.medium;
    return BASE_LINK_COLOR.low;
  }

  function baseLinkWidth(link) {
    if ((link.v || 1) >= 3) return 1.4;
    if ((link.v || 1) >= 2) return 0.7;
    return 0.35;
  }

  function formatCurrency(value) {
    const number = Number(value || 0);

    if (Math.abs(number) >= 1e12) return `$${(number / 1e12).toFixed(2)}T`;
    if (Math.abs(number) >= 1e9) return `$${(number / 1e9).toFixed(2)}B`;
    if (Math.abs(number) >= 1e6) return `$${(number / 1e6).toFixed(2)}M`;
    return `$${number.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }

  function getCountryColor(node) {
    const gdp = Number(node.gdpUsd || 0);
    if (gdp >= 10e12) return "#e8453c";
    if (gdp >= 1e12) return "#ff9800";
    if (gdp >= 100e9) return "#4caf50";
    return "#4488cc";
  }

  function getFlagEmoji(iso2) {
    if (!iso2 || iso2.length !== 2) return "??";
    const codePoints = iso2
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));

    return String.fromCodePoint(...codePoints);
  }

  function hexToRgba(hex, alpha) {
    const normalized = String(hex || "").replace("#", "");
    if (normalized.length !== 6) {
      return `rgba(232,69,60,${alpha})`;
    }

    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);

    if ([r, g, b].some((value) => Number.isNaN(value))) {
      return `rgba(232,69,60,${alpha})`;
    }

    return `rgba(${r},${g},${b},${alpha})`;
  }

  function toTitleCase(value) {
    return String(value || "")
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }

  function escapeHtml(input) {
    return String(input || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function showLoading() {
    if (els.loading) {
      els.loading.classList.add("show");
    }
  }

  function hideLoading() {
    if (els.loading) {
      els.loading.classList.remove("show");
    }
  }

  window.addEventListener("resize", () => {
    W = window.innerWidth;
    H = window.innerHeight;

    if (macroData) {
      renderVisualization();
      updateStats();
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
