// =========================================
// COUNTY MULTI-METRIC COMPARISON SCRIPT
// =========================================

let countyData = []; // Full merged dataset
let selectedCounties = new Set([]); // Will be populated in init if empty
let selectedSlots = { x: "pct_unemployment_rate", y: "depression_prevalence", size: "total_population_sum" };
let activeSlot = "x";
let currentChartMode = "bubble"; // "bubble", "radar", "heatmap"
let currentChartDiv = "bubbleChartDiv";
let chartRoot = null;
let currentView = "chart"; // "chart", "table"
let focusedState = ""; // Filter by state

// For Radar/Heatmap multi-metrics
let selectedRadarMetrics = [];
let selectedHeatmapMetrics = [];
let hiddenRadarCounties = new Set();

const radarPalette = [
    "#c83830", "#0ea5e9", "#10b981", "#f59e0b", "#a855f7",
    "#ec4899", "#14b8a6", "#3f6212", "#6366f1", "#e11d48"
];

const regionMapping = {
    "Central": ["ND", "SD", "KS", "IA", "NE", "OK", "MO", "MN", "WI", "IN", "MI", "IL", "TX"],
    "East": ["WV", "ME", "DC", "NH", "VT", "CT", "RI", "MD", "DE", "MA", "NJ", "OH", "PA", "NY"],
    "South": ["SC", "LA", "MS", "AR", "AL", "TN", "KY", "GA", "NC", "VA", "FL"],
    "West": ["WY", "ID", "NM", "MT", "UT", "NV", "OR", "CO", "AZ", "WA", "CA", "AK", "HI"]
};

const regionColors = {
    "Central": "#0ea5e9",
    "East": "#10b981",
    "South": "#f59e0b",
    "West": "#a855f7"
};

function getRegionColor(stateAbbr) {
    if (!stateAbbr) return "#999999";
    const abbr = stateAbbr.toUpperCase();
    for (const [region, states] of Object.entries(regionMapping)) {
        if (states.includes(abbr)) return regionColors[region];
    }
    return "#999999";
}

// Helper to normalize names for matching
// Helper to normalize names exactly like county_comparison_amcharts.js
function normalizeCountyName(name) {
    if (!name) return "";
    let n = name.toLowerCase()
        .replace(/\s+county$/i, "")
        .replace(/\s+parish$/i, "")
        .replace(/\s+borough$/i, "")
        .replace(/\s+census\s+area$/i, "")
        .replace(/\s+municipality$/i, "")
        .replace(/\bcity and borough of\s+/i, "")
        .replace(/\bcity of\s+/i, "")
        .replace(/\s+city$/i, "");

    return n.replace(/[^a-z0-9]/g, "").trim();
}

// ── Load and Merge ──────────────────────────────────────────
async function loadAndMergeData() {
    try {
        const [acsRes, placesRes] = await Promise.all([
            fetch("data/ACS%20Data/county_acs_flat.json"),
            fetch("data/PLACES%20Data/county_places_flat.json")
        ]);
        if (!acsRes.ok || !placesRes.ok) throw new Error("Data fetch failed");

        const acsData = await acsRes.json();
        const placesData = await placesRes.json();

        const placesLookup = {};
        placesData.forEach(d => {
            if (d.state_abbr && d.name) {
                const norm = normalizeCountyName(d.name);
                placesLookup[d.state_abbr.toUpperCase() + "_" + norm] = d;
            } else if (d.id) {
                placesLookup[d.id] = d;
            }
        });

        const geoLookup = new Map();
        if (typeof am5geodata_region_usa_usaCountiesLow !== 'undefined' && am5geodata_region_usa_usaCountiesLow.features) {
            am5geodata_region_usa_usaCountiesLow.features.forEach(f => {
                const props = f.properties || {};
                const name = normalizeCountyName(props.name);
                const state = (props.STATE || "").toUpperCase();
                if (name && state) {
                    geoLookup.set(state + "_" + name, f.id);
                }
            });
        }

        const merged = acsData.map(acs => {
            const state = (acs.state_abbr || "").toUpperCase();
            const norm = normalizeCountyName(acs.name);
            const lookupKey = state + "_" + norm;

            const places = placesLookup[lookupKey] || placesLookup[acs.id] || {};

            // Resolve standard 5-digit FIPS from map data mapping
            const mapId = geoLookup.get(lookupKey);
            const fips = mapId && mapId.includes("-") ? mapId.split("-").pop() : (acs.id || acs.GEOID);

            return {
                ...acs,
                ...places,
                id: fips,
                fips: fips,
                name: acs.name,
                state: acs.state_abbr,
                state_abbr: acs.state_abbr
            };
        });

        return merged;
    } catch (e) {
        console.error("loadAndMergeData failed:", e);
        throw e;
    }
}

// Caching for normalization to avoid repeated O(N) calculations
const _normCache = {};
function getMetricRange(metric) {
    if (_normCache[metric]) return _normCache[metric];
    const vals = countyData.map(d => d[metric]).filter(v => v !== null && v !== undefined && !isNaN(v));
    if (!vals.length) return { min: 0, max: 1 };
    const res = { min: Math.min(...vals), max: Math.max(...vals) };
    _normCache[metric] = res;
    return res;
}

function normalizeValue(metric, val) {
    if (val === null || val === undefined || isNaN(val)) return 0;
    const { min, max } = getMetricRange(metric);
    if (max === min) return 50;
    return ((val - min) / (max - min)) * 100;
}

// ── UI Initialization ───────────────────────────────────────
function initMetricCardListeners() {
    document.querySelectorAll(".metric-card").forEach(card => {
        card.addEventListener("click", () => {
            const metric = card.getAttribute("data-metric");
            if (currentChartMode === "bubble") assignSlot(metric);
            else if (currentChartMode === "radar") toggleRadarMetric(metric);
            else if (currentChartMode === "heatmap") toggleHeatmapMetric(metric);
        });
    });
}

function initSlotListeners() {
    document.querySelectorAll(".slot").forEach(slot => {
        slot.addEventListener("click", () => {
            document.querySelectorAll(".slot").forEach(s => s.classList.remove("active"));
            slot.classList.add("active");
            activeSlot = slot.getAttribute("data-slot");
            updateSlotUI();
        });
    });
    // Set first slot active
    const first = document.querySelector(".slot[data-slot='x']");
    if (first) {
        first.classList.add("active");
        activeSlot = "x";
    }
}

function assignSlot(metric) {
    selectedSlots[activeSlot] = metric;
    updateSlotUI();
    updateMetricCardSelection();

    // Auto-advance slot
    if (activeSlot === "x") setSlot("y");
    else if (activeSlot === "y") setSlot("size");
    else if (activeSlot === "size") setSlot("x");

    if (currentView === "chart") updateBubbleChart();
    else refreshTable();
}

function setSlot(slot) {
    document.querySelectorAll(".slot").forEach(s => s.classList.remove("active"));
    const el = document.querySelector(`.slot[data-slot='${slot}']`);
    if (el) el.classList.add("active");
    activeSlot = slot;
}

function updateSlotUI() {
    Object.keys(selectedSlots).forEach(key => {
        const val = selectedSlots[key];
        const el = document.querySelector(`.slot[data-slot='${key}'] .slot-value`);
        if (el) el.textContent = val ? (tableMetricMeta[val] ? tableMetricMeta[val].label : val) : "Select metric...";
    });
}

function updateMetricCardSelection() {
    document.querySelectorAll(".metric-card").forEach(card => {
        const m = card.getAttribute("data-metric");
        card.classList.remove("selected");
        if (currentChartMode === "bubble") {
            if (Object.values(selectedSlots).includes(m)) card.classList.add("selected");
        } else if (currentChartMode === "radar") {
            if (selectedRadarMetrics.includes(m)) card.classList.add("selected");
        } else if (currentChartMode === "heatmap") {
            if (selectedHeatmapMetrics.includes(m)) card.classList.add("selected");
        }
    });
}

// ── Mode Switching ──────────────────────────────────────────
const btnBubble = document.getElementById("btnBubbleMode");
const btnRadar = document.getElementById("btnRadarMode");
const btnHeatmap = document.getElementById("btnHeatmapMode");

function updateSidebarUI() {
    const bubbleSlots = document.getElementById("bubbleSlots");
    const radarChips = null; // No chips for radar here?
    const heatmapChips = document.getElementById("heatmapMetricChips");

    // Defaults
    bubbleSlots.style.display = "none";
    heatmapChips.style.display = "none";

    if (currentChartMode === "bubble") {
        bubbleSlots.style.display = "flex";
    } else if (currentChartMode === "heatmap") {
        heatmapChips.style.display = "block";
        updateHeatmapChipsUI();
    }
    updateMetricCardSelection();
}

btnBubble.onclick = () => switchMode("bubble");
btnRadar.onclick = () => switchMode("radar");
btnHeatmap.onclick = () => switchMode("heatmap");

function switchMode(mode) {
    currentChartMode = mode;
    [btnBubble, btnRadar, btnHeatmap].forEach(btn => {
        btn.style.background = "transparent";
        btn.style.color = "#555";
        btn.style.borderColor = "#ddd";
    });

    const activeBtn = mode === "bubble" ? btnBubble : mode === "radar" ? btnRadar : btnHeatmap;
    activeBtn.style.background = "#c83830";
    activeBtn.style.color = "#fff";
    activeBtn.style.borderColor = "#c83830";

    const bDiv = document.getElementById("bubbleChartDiv");
    const hDiv = document.getElementById("heatmapChartDiv");
    const rInfo = document.getElementById("radarInfoPanel");

    bDiv.style.display = "none";
    hDiv.style.display = "none";
    rInfo.style.display = "none";

    if (mode === "bubble") {
        bDiv.style.display = "block";
        currentChartDiv = "bubbleChartDiv";
        updateBubbleChart();
    } else if (mode === "radar") {
        currentChartDiv = "bubbleChartDiv"; // Draw into bubble div using SVG
        bDiv.style.display = "block";
        rInfo.style.display = "block";
        drawRadarChart();
    } else if (mode === "heatmap") {
        hDiv.style.display = "block";
        currentChartDiv = "heatmapChartDiv";
        drawHeatmapChart();
    }
    updateSidebarUI();
}

// ── Heatmap Multi-Metric Logic ─────────────────────────────
function toggleHeatmapMetric(metric) {
    const idx = selectedHeatmapMetrics.indexOf(metric);
    if (idx > -1) selectedHeatmapMetrics.splice(idx, 1);
    else if (selectedHeatmapMetrics.length < 12) selectedHeatmapMetrics.push(metric);

    updateHeatmapChipsUI();
    updateMetricCardSelection();
    if (currentChartMode === "heatmap") drawHeatmapChart();
}

function updateHeatmapChipsUI() {
    const container = document.getElementById("heatmapMetricChips");
    if (!selectedHeatmapMetrics.length) {
        container.innerHTML = '<p style="color:#999;font-size:0.85rem;text-align:center;padding:10px 0;margin:0;">Click metrics below to add to Heatmap (max 12)</p>';
        return;
    }
    container.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:6px;">' +
        selectedHeatmapMetrics.map(m => {
            const label = tableMetricMeta[m] ? tableMetricMeta[m].shortLabel || tableMetricMeta[m].label : m;
            return `<div class="chip" style="background:var(--main-color);color:white;padding:4px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;" onclick="toggleHeatmapMetric('${m}')">${label} <span>&times;</span></div>`;
        }).join("") + '</div>';
}

function toggleRadarMetric(metric) {
    const idx = selectedRadarMetrics.indexOf(metric);
    if (idx > -1) selectedRadarMetrics.splice(idx, 1);
    else if (selectedRadarMetrics.length < 8) selectedRadarMetrics.push(metric);

    updateMetricCardSelection();
    if (currentChartMode === "radar") drawRadarChart();
}

// ── Map Implementation ──────────────────────────────────────
let mapChart, mapPolygonSeries, mapRoot;

function initMap() {
    if (mapRoot) { mapRoot.dispose(); mapRoot = null; }
    const container = document.getElementById("multiMapDiv");
    if (!container) return;
    container.innerHTML = "";

    mapRoot = am5.Root.new("multiMapDiv");
    mapRoot.setThemes([am5themes_Animated.new(mapRoot)]);

    mapChart = mapRoot.container.children.push(am5map.MapChart.new(mapRoot, {
        panX: "translateX", panY: "translateY", wheelY: "zoom", projection: am5map.geoAlbersUsa()
    }));

    addCustomMapControls("multiMapDiv", mapChart, true);

    mapPolygonSeries = mapChart.series.push(am5map.MapPolygonSeries.new(mapRoot, {
        geoJSON: am5geodata_region_usa_usaCountiesLow,
        valueField: "value",
        calculateAggregates: true
    }));


    // Initial highlighting of selected counties
    mapPolygonSeries.events.on("datavalidated", () => {
        mapPolygonSeries.mapPolygons.each(p => {
            const mapId = p.dataItem.get("id");
            const fips = mapId && mapId.includes("-") ? mapId.split("-").pop() : mapId;
            if (fips && selectedCounties.has(fips)) {
                p.set("active", true);
            }
        });
    });

    updateMapData();

    mapPolygonSeries.mapPolygons.template.setAll({
        fill: am5.color(0xd9cec8),
        tooltipText: "{name}, {state}: Click to compare",
        stroke: am5.color(0xffffff),
        strokeWidth: 0.5,
        interactive: true,
        cursorOverStyle: "pointer"
    });

    mapPolygonSeries.mapPolygons.template.states.create("hover", { fill: am5.color(0xd3a29f) });
    mapPolygonSeries.mapPolygons.template.states.create("active", { fill: am5.color(0xc83830), stroke: am5.color(0x000000), strokeWidth: 1.5 });

    mapPolygonSeries.mapPolygons.template.events.on("click", function (ev) {
        const polygon = ev.target;
        const dataItem = polygon.dataItem;
        if (!dataItem) return;

        const mapId = dataItem.get("id");
        if (!mapId) return;

        // Extract FIPS from Map ID (e.g., "US-TX-48243" -> "48243")
        const fips = mapId.includes("-") ? mapId.split("-").pop() : mapId;

        if (ev.originalEvent.ctrlKey || ev.originalEvent.metaKey || window.innerWidth <= 768) {
            if (selectedCounties.has(fips)) {
                selectedCounties.delete(fips);
                polygon.set("active", false);
            } else {
                if (selectedCounties.size >= 12) {
                    alert("Maximum 12 locations can be compared at once.");
                    return;
                }
                selectedCounties.add(fips);
                polygon.set("active", true);
            }
        } else {
            selectedCounties.clear();
            mapPolygonSeries.mapPolygons.each(p => p.set("active", false));

            selectedCounties.add(fips);
            polygon.set("active", true);
        }

        updateCharts();
    });

    window.zoomToState = function (stateAbbr) {
        if (!mapPolygonSeries) return;
        focusedState = stateAbbr;

        if (!stateAbbr || stateAbbr === "All") {
            mapChart.goHome();
            mapPolygonSeries.mapPolygons.each(p => p.set("forceHidden", false));
            updateCharts();
            return;
        }

        let statePolygons = [];
        mapPolygonSeries.mapPolygons.each(p => {
            const di = p.dataItem.dataContext;
            const s = (di && di.state_abbr) || (p.dataItem.get("id") ? p.dataItem.get("id").split("-")[1] : "");
            if (s === stateAbbr) {
                p.set("forceHidden", false);
                statePolygons.push(p);
            } else {
                p.set("forceHidden", true);
            }
        });

        if (statePolygons.length) mapChart.zoomToFeatures(statePolygons);
        updateCharts();
    };
}

function updateCharts() {
    if (currentView === "chart") {
        if (currentChartMode === "bubble") updateBubbleChart();
        else if (currentChartMode === "radar") drawRadarChart();
        else drawHeatmapChart();
    } else {
        refreshTable();
    }
}

// ── Bubble Chart Implementation ────────────────────────────
function initBubbleChart() {
    if (chartRoot) { chartRoot.dispose(); chartRoot = null; }
    const containerId = currentChartDiv;
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    chartRoot = am5.Root.new(containerId);
    chartRoot.setThemes([am5themes_Animated.new(chartRoot)]);

    const chart = chartRoot.container.children.push(am5xy.XYChart.new(chartRoot, {
        panX: true, panY: true, wheelX: "zoomX", wheelY: "zoomY", pinchZoomX: true, pinchZoomY: true
    }));

    const xAxis = chart.xAxes.push(am5xy.ValueAxis.new(chartRoot, {
        renderer: am5xy.AxisRendererX.new(chartRoot, { minGridDistance: 50 })
    }));
    const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(chartRoot, {
        renderer: am5xy.AxisRendererY.new(chartRoot, {})
    }));

    const series = chart.series.push(am5xy.LineSeries.new(chartRoot, {
        name: "Counties",
        xAxis: xAxis, yAxis: yAxis,
        valueYField: "yValue", valueXField: "xValue", valueField: "sizeValue",
        calculateAggregates: true,
        seriesTooltipTarget: "bullet",
        tooltip: am5.Tooltip.new(chartRoot, {
            getFillFromSprite: false,
            labelText: "[bold]{name}[/]\n{xLabel}: {xRaw}\n{yLabel}: {yRaw}\n{sizeLabel}: {sizeRaw}"
        })
    }));

    series.get("tooltip").get("background").setAll({ fill: am5.color(0xffffff), fillOpacity: 0.9, stroke: am5.color(0xdddddd) });
    series.get("tooltip").label.setAll({ fill: am5.color(0x333333) });

    series.strokes.template.set("strokeOpacity", 0);
    const circleTemplate = am5.Template.new({});
    series.bullets.push(() => {
        const circle = am5.Circle.new(chartRoot, {
            radius: 5,
            fillOpacity: 0.7,
            stroke: am5.color(0xffffff),
            strokeWidth: 1
        }, circleTemplate);

        circle.adapters.add("fill", (fill, target) => {
            if (target.dataItem && target.dataItem.dataContext && target.dataItem.dataContext.color) {
                return am5.color(target.dataItem.dataContext.color);
            }
            return fill;
        });

        circle.states.create("hover", { fillOpacity: 1, strokeWidth: 2 });
        return am5.Bullet.new(chartRoot, { sprite: circle });
    });

    series.set("heatRules", [{
        target: circleTemplate,
        min: 4, max: 40, dataField: "value", key: "radius"
    }]);

    xAxis.children.push(am5.Label.new(chartRoot, { text: "X-Axis", x: am5.p50, centerX: am5.p50 }));
    yAxis.children.unshift(am5.Label.new(chartRoot, { text: "Y-Axis", rotation: -90, y: am5.p50, centerY: am5.p50 }));

    series.data.setAll([]);
    chart.appear(1000, 100);
}

function updateBubbleChart() {
    if (currentChartDiv === "heatmapChartDiv") return;
    if (!chartRoot || !chartRoot.container.children.length) initBubbleChart();

    const chart = chartRoot.container.children.getIndex(0);
    const series = chart.series.getIndex(0);
    const xAxis = chart.xAxes.getIndex(0);
    const yAxis = chart.yAxes.getIndex(0);

    const xM = selectedSlots.x;
    const yM = selectedSlots.y;
    const sM = selectedSlots.size;

    const xMeta = tableMetricMeta[xM] || { label: xM || "X-Axis", fmt: "dec" };
    const yMeta = tableMetricMeta[yM] || { label: yM || "Y-Axis", fmt: "dec" };
    const sMeta = tableMetricMeta[sM] || { label: sM || "Size", fmt: "dec" };

    xAxis.children.getIndex(1).set("text", xMeta.label);
    yAxis.children.getIndex(0).set("text", yMeta.label);

    const data = Array.from(selectedCounties).map(fips => {
        const d = countyData.find(c => (c.id === fips || c.fips === fips));
        if (!d) return null;
        return {
            name: d.name + (d.state_abbr ? ", " + d.state_abbr : ""),
            xValue: d[xM] || 0, yValue: d[yM] || 0, sizeValue: d[sM] || 1,
            color: getRegionColor(d.state_abbr),
            xRaw: formatValue(d[xM], xMeta.fmt), yRaw: formatValue(d[yM], yMeta.fmt), sizeRaw: formatValue(d[sM], sMeta.fmt),
            xLabel: xMeta.label, yLabel: yMeta.label, sizeLabel: sMeta.label
        };
    }).filter(Boolean);

    series.data.setAll(data);
}

// ── Radar Chart Implementation ────────────────────────────
function drawRadarChart() {
    const div = document.getElementById("bubbleChartDiv");
    if (chartRoot) { chartRoot.dispose(); chartRoot = null; }
    div.innerHTML = "";

    const countiesArr = Array.from(selectedCounties).map(id => countyData.find(c => c.id === id)).filter(Boolean);
    if (!countiesArr.length || !selectedRadarMetrics.length) {
        div.innerHTML = '<div style="height:100%; display:flex; align-items:center; justify-content:center; color:#999; font-size:1.1rem; padding:40px; text-align:center;">Select counties on the map and metrics on the left to generate the Radar Chart comparison.</div>';
        return;
    }

    // Logic identical to state radar but with counties
    const W = div.clientWidth;
    const H = 700;
    div.style.minHeight = H + "px";

    const N = selectedRadarMetrics.length;
    const cx = W / 2, cy = H / 2, R = Math.min(cx, cy) - 150;
    const angles = Array.from({ length: N }, (_, i) => (2 * Math.PI * i / N) - Math.PI / 2);
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", W); svg.setAttribute("height", H);

    // Grid
    for (let l = 1; l <= 5; l++) {
        const r = (l / 5) * R;
        const c = document.createElementNS(NS, "circle");
        c.setAttribute("cx", cx); c.setAttribute("cy", cy); c.setAttribute("r", r);
        c.setAttribute("fill", "none"); c.setAttribute("stroke", "#ddd"); c.setAttribute("stroke-dasharray", "5,5");
        svg.appendChild(c);
    }

    // Spokes and labels
    angles.forEach((ang, i) => {
        const x2 = cx + Math.cos(ang) * R, y2 = cy + Math.sin(ang) * R;
        const line = document.createElementNS(NS, "line");
        line.setAttribute("x1", cx); line.setAttribute("y1", cy); line.setAttribute("x2", x2); line.setAttribute("y2", y2);
        line.setAttribute("stroke", "#ddd"); svg.appendChild(line);

        const label = document.createElementNS(NS, "text");
        const meta = tableMetricMeta[selectedRadarMetrics[i]] || { label: selectedRadarMetrics[i] };
        label.textContent = meta.shortLabel || meta.label;
        label.setAttribute("x", cx + Math.cos(ang) * (R + 40));
        label.setAttribute("y", cy + Math.sin(ang) * (R + 40));
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("font-size", "12px");
        svg.appendChild(label);
    });

    countiesArr.forEach((county, ci) => {
        const color = radarPalette[ci % radarPalette.length];
        const pts = selectedRadarMetrics.map((m, i) => {
            const norm = normalizeValue(m, county[m]) / 100;
            return (cx + Math.cos(angles[i]) * R * norm) + "," + (cy + Math.sin(angles[i]) * R * norm);
        });
        const poly = document.createElementNS(NS, "polygon");
        poly.setAttribute("points", pts.join(" "));
        poly.setAttribute("fill", color); poly.setAttribute("fill-opacity", "0.2");
        poly.setAttribute("stroke", color); poly.setAttribute("stroke-width", "2");
        svg.appendChild(poly);
    });

    div.appendChild(svg);
}

// ── Heatmap Implementation ──────────────────────────────
function drawHeatmapChart() {
    const containerId = currentChartDiv;
    if (chartRoot) { chartRoot.dispose(); chartRoot = null; }
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    const countiesArr = Array.from(selectedCounties).map(id => countyData.find(c => c.id === id)).filter(Boolean);
    if (!countiesArr.length || !selectedHeatmapMetrics.length) {
        container.innerHTML = '<div style="height:100%; display:flex; align-items:center; justify-content:center; color:#999; font-size:1.1rem; padding:40px; text-align:center;">Select counties on the map and metrics on the left to generate the Heatmap Matrix.</div>';
        return;
    }

    chartRoot = am5.Root.new(containerId);
    chartRoot.setThemes([am5themes_Animated.new(chartRoot)]);

    const chart = chartRoot.container.children.push(am5xy.XYChart.new(chartRoot, {
        panX: false, panY: false, layout: chartRoot.verticalLayout
    }));

    const yAxis = chart.yAxes.push(am5xy.CategoryAxis.new(chartRoot, {
        categoryField: "name",
        renderer: am5xy.AxisRendererY.new(chartRoot, { inversed: true, minGridDistance: 15 })
    }));

    const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(chartRoot, {
        categoryField: "metric",
        renderer: am5xy.AxisRendererX.new(chartRoot, { opposite: true, minGridDistance: 30 })
    }));

    const series = chart.series.push(am5xy.ColumnSeries.new(chartRoot, {
        calculateAggregates: true, stroke: am5.color(0xffffff), clustered: false,
        xAxis: xAxis, yAxis: yAxis, categoryXField: "metric", categoryYField: "name", valueField: "value"
    }));

    series.columns.template.setAll({
        tooltipText: "{name}, {fullMetric}: [bold]{raw}[/]",
        strokeOpacity: 1, strokeWidth: 1, width: am5.percent(100), height: am5.percent(100)
    });

    series.set("heatRules", [{
        target: series.columns.template, min: am5.color(0xfffb77), max: am5.color(0xfe131a), dataField: "value", key: "fill"
    }]);

    const data = [];
    countiesArr.forEach(c => {
        selectedHeatmapMetrics.forEach(m => {
            const meta = tableMetricMeta[m] || { label: m, fmt: "dec" };
            data.push({
                name: c.name + ", " + c.state_abbr,
                metric: meta.shortLabel || meta.label,
                fullMetric: meta.label,
                raw: formatValue(c[m], meta.fmt),
                value: normalizeValue(m, c[m])
            });
        });
    });

    yAxis.data.setAll(countiesArr.map(c => ({ name: c.name + ", " + c.state_abbr })));
    xAxis.data.setAll(selectedHeatmapMetrics.map(m => ({ metric: tableMetricMeta[m] ? (tableMetricMeta[m].shortLabel || tableMetricMeta[m].label) : m })));
    series.data.setAll(data);
    chart.appear(1000, 100);
}

// ── View Switching ──────────────────────────────────────────
function switchView(view) {
    currentView = view;
    const cSec = document.getElementById("chartSection");
    const tSec = document.getElementById("tableSection");
    const mGrid = document.getElementById("metricsGrid");
    const btnC = document.getElementById("btnChartView");
    const btnT = document.getElementById("btnTableView");

    if (view === "chart") {
        cSec.style.display = "flex";
        tSec.style.display = "none";
        btnC.classList.add("active");
        btnT.classList.remove("active");
        updateCharts();
    } else {
        cSec.style.display = "none";
        tSec.style.display = "block";
        btnC.classList.remove("active");
        btnT.classList.add("active");
        refreshTable();
    }
}

function refreshTable() {
    const rows = Array.from(selectedCounties).map(id => countyData.find(c => c.id === id)).filter(Boolean);
    const activeMetric = currentChartMode === "bubble" ? (selectedSlots.x || selectedSlots.y || selectedSlots.size || "pct_unemployment_rate") :
        (currentChartMode === "radar" ? (selectedRadarMetrics[0] || "pct_unemployment_rate") :
            (selectedHeatmapMetrics[0] || "pct_unemployment_rate"));

    // Add rucc_class for rural/urban context in table
    rows.forEach(r => {
        if (!r.rucc_class) r.rucc_class = r.rucc_2013 ? (r.rucc_2013 <= 3 ? "Metro" : "Nonmetro") : "Unknown";
    });

    renderComparisonTable("multiMetricTableDiv", rows, activeMetric);
}

function clearAllSelections() {
    selectedCounties.clear();
    selectedSlots = { x: null, y: null, size: null };
    selectedRadarMetrics = [];
    selectedHeatmapMetrics = [];

    mapPolygonSeries.mapPolygons.each(p => p.set("active", false));
    updateSlotUI();
    updateHeatmapChipsUI();
    updateMetricCardSelection();
    updateMapData();
    updateCharts();
}

function updateMapData() {
    if (!mapPolygonSeries || !countyData.length) return;

    // Create a quick lookup for ACS/PLACES data by FIPS
    const dataByFips = {};
    countyData.forEach(d => {
        if (d.fips) dataByFips[d.fips] = d;
    });

    const mapData = [];
    mapPolygonSeries.mapPolygons.each(poly => {
        const pId = poly.get("id");
        if (!pId) return;

        // Extract FIPS: US-TX-48243 -> 48243
        const fips = pId.includes("-") ? pId.split("-").pop() : pId;
        const d = dataByFips[fips] || {};

        mapData.push({
            id: pId,
            name: d.name || poly.dataItem.dataContext.name || "Unknown",
            state: d.state || "",
            value: 0 // We don't have a single "value" for multi-metric yet
        });
    });

    mapPolygonSeries.data.setAll(mapData);
}

async function init() {
    showLoader(true);
    try {
        countyData = await loadAndMergeData();

        // Initial defaults for selection using FIPS
        if (selectedCounties.size === 0 && countyData.length > 0) {
            ["01001", "36061", "06037", "48201", "17031"].forEach(fips => {
                if (countyData.find(d => d.fips === fips)) selectedCounties.add(fips);
            });
            if (selectedCounties.size === 0) {
                for (let i = 0; i < 5; i++) if (countyData[i]) selectedCounties.add(countyData[i].fips);
            }
        }

        initMetricCardListeners();
        initSlotListeners();
        initMap();
        initBubbleChart();
        updateSidebarUI();
        updateSlotUI();
    } catch (err) {
        console.error("Initialization failed:", err);
        const mapDiv = document.getElementById("multiMapDiv");
        if (mapDiv) {
            mapDiv.innerHTML = `<div style="padding:40px; text-align:center; color:#c83830;">
                <h3 style="margin-bottom:10px;">Failed to load county data.</h3>
                <p style="color:#666; font-size:0.9rem;">${err.message}</p>
                <p style="margin-top:20px; font-size:0.85rem;">Please check your connection and refresh the page.</p>
            </div>`;
        }
    } finally {
        showLoader(false);
    }
}

function showLoader(show) {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.classList.toggle("active", show);
}

// Finalize initialization
am5.ready(function () {
    init();
});

// Modal logic (bridged)
window.openChartModal = function () {
    const m = document.getElementById("chartModal");
    m.style.display = "flex";
    currentChartDiv = "chartModalDiv";
    if (currentChartMode === "bubble") updateBubbleChart();
    else if (currentChartMode === "radar") drawRadarChart();
    else drawHeatmapChart();
};
window.closeChartModal = function () {
    document.getElementById("chartModal").style.display = "none";
    currentChartDiv = currentChartMode === "heatmap" ? "heatmapChartDiv" : "bubbleChartDiv";
    updateCharts();
};
