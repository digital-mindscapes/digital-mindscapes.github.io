// =========================================
// MULTI-METRIC: Bubble Chart + Radar Chart
// =========================================

let stateData = [];
let selectedStates = new Set();

// --- Bubble mode ---
let selectedSlots = { x: "pct_unemployment_rate", y: "depression_prevalence", size: "total_population_sum" };
let activeSlot = "x";

// --- Radar mode ---
let selectedRadarMetrics = [];
const MAX_RADAR_METRICS = 8;
let hiddenRadarStates = new Set();

// --- Mode ---
let currentChartMode = "bubble";
let currentView = "chart";
let currentChartDiv = "bubbleChartDiv";

let radarInfoPanelCached = null;
document.addEventListener("DOMContentLoaded", () => {
    radarInfoPanelCached = document.getElementById("radarInfoPanel");
});

function safeClearDiv(divId) {
    const div = document.getElementById(divId);
    if (!div) return;
    if (radarInfoPanelCached && radarInfoPanelCached.parentNode === div) {
        div.removeChild(radarInfoPanelCached);
    }
    div.innerHTML = "";
    div.style.minHeight = "";
    div.style.height = "";
}

function updateRadarInfoPanel() {
    if (!radarInfoPanelCached) radarInfoPanelCached = document.getElementById("radarInfoPanel");
    if (!radarInfoPanelCached) return;

    if (currentChartMode === "radar" && currentView === "chart") {
        radarInfoPanelCached.style.display = "block";
        const container = document.getElementById(currentChartDiv);
        if (currentChartDiv === "chartModalDiv") {
            radarInfoPanelCached.style.marginTop = "40px";
            radarInfoPanelCached.style.marginBottom = "10px";
            radarInfoPanelCached.style.maxWidth = "900px";
            radarInfoPanelCached.style.width = "95%";
            radarInfoPanelCached.style.marginLeft = "auto";
            radarInfoPanelCached.style.marginRight = "auto";
            radarInfoPanelCached.style.boxSizing = "border-box";
            if (container) container.appendChild(radarInfoPanelCached);
        } else {
            radarInfoPanelCached.style.marginTop = "60px"; // Increased margin to prevent overlap
            radarInfoPanelCached.style.marginBottom = "40px";
            radarInfoPanelCached.style.maxWidth = "1100px";
            radarInfoPanelCached.style.width = "95%";
            radarInfoPanelCached.style.marginLeft = "auto";
            radarInfoPanelCached.style.marginRight = "auto";
            radarInfoPanelCached.style.boxSizing = "border-box";
            radarInfoPanelCached.style.position = "relative";
            radarInfoPanelCached.style.zIndex = "10";
            const section = document.getElementById("chartSection");
            if (section) section.appendChild(radarInfoPanelCached);
        }
    } else {
        radarInfoPanelCached.style.display = "none";
        if (radarInfoPanelCached.parentNode) {
            radarInfoPanelCached.parentNode.removeChild(radarInfoPanelCached);
        }
    }
}

// --- Table Sorting & Grouping ---
let multiTableSortBy = "name";
let multiTableSortAsc = true;
let multiTableGrouped = false;

function toggleMultiTableSort(metric) {
    if (multiTableSortBy === metric) {
        multiTableSortAsc = !multiTableSortAsc;
    } else {
        multiTableSortBy = metric;
        multiTableSortAsc = (metric === "name");
    }
    drawMultiMetricTable();
}

function toggleMultiTableGroup() {
    multiTableGrouped = !multiTableGrouped;
    if (mapPolygonSeries) {
        mapPolygonSeries.mapPolygons.each(p => {
            if (p.get("active")) {
                p.set("active", false);
                p.set("active", true);
            }
        });
    }
    drawMultiMetricTable();
}

// --- amCharts handles ---
let mapRoot, chartRoot;
let mapPolygonSeries;
let bubbleSeries, xAxis, yAxis, xAxisLabel, yAxisLabel;
let circleTemplate;

const regionMapping = {
    "Central": ["ND", "SD", "KS", "IA", "NE", "OK", "MO", "MN", "WI", "IN", "MI", "IL", "TX"],
    "East": ["WV", "ME", "DC", "NH", "VT", "CT", "RI", "MD", "DE", "MA", "NJ", "OH", "PA", "NY"],
    "South": ["SC", "LA", "MS", "AR", "AL", "TN", "KY", "GA", "NC", "VA", "FL"],
    "West": ["WY", "ID", "NM", "MT", "UT", "NV", "OR", "CO", "AZ", "WA", "CA", "AK", "HI"]
};
const regionColors = { "Central": "#0ea5e9", "East": "#10b981", "South": "#f59e0b", "West": "#a855f7" };

const radarPalette = [
    "#c83830", "#0ea5e9", "#10b981", "#f59e0b", "#a855f7",
    "#ef4444", "#06b6d4", "#84cc16", "#f97316", "#8b5cf6",
    "#ec4899", "#14b8a6", "#eab308", "#3b82f6", "#d946ef"
];

function getRegion(abbr) {
    for (const r in regionMapping) { if (regionMapping[r].includes(abbr)) return r; }
    return "West";
}

// =========================================
// DATA LOADING
// =========================================
async function loadAndMergeData() {
    const [acsRes, placesRes] = await Promise.all([
        fetch("data/ACS Data/state_acs_flat.json"),
        fetch("data/PLACES Data/state_places_flat.json")
    ]);
    const acsData = await acsRes.json();
    const placesData = await placesRes.json();
    const placesLookup = {};
    placesData.forEach(d => { placesLookup[d.id] = d; });
    return acsData.map(acs => {
        const places = placesLookup[acs.id] || {};
        return { ...acs, ...places, id: acs.id, name: acs.name, state_abbr: acs.state_abbr };
    });
}

// =========================================
// NORMALIZATION (0-100 across all states)
// =========================================
function normalizeValue(metric, value) {
    const vals = stateData.map(s => s[metric]).filter(v => typeof v === "number" && !isNaN(v));
    if (!vals.length) return 0;
    const mn = Math.min(...vals), mx = Math.max(...vals);
    if (mx === mn) return 50;
    return Math.round(((value - mn) / (mx - mn)) * 100);
}

// =========================================
// INIT
// =========================================
async function init() {
    try {
        const data = await loadAndMergeData();
        stateData = data.map(d => ({ ...d, id: d.id.replace(".", "-"), region: getRegion(d.state_abbr) }));
        initMetricCardListeners();
        initSlotListeners();
        initMap();
        initBubbleChart();
        updateSidebarUI();
        document.getElementById("clearSelection").addEventListener("click", clearAll);
        document.getElementById("btnBubbleMode").addEventListener("click", () => switchMode("bubble"));
        document.getElementById("btnRadarMode").addEventListener("click", () => switchMode("radar"));
    } catch (err) { console.error("Init failed:", err); }
}

// =========================================
// METRIC CARD + SLOT LISTENERS
// =========================================
function initMetricCardListeners() {
    document.querySelectorAll(".metric-card").forEach(card => {
        const m = card.getAttribute("data-metric");
        if (!m) return;
        card.addEventListener("click", () => {
            if (currentChartMode === "bubble") assignSlot(m);
            else toggleRadarMetric(m);
        });
    });
}

function initSlotListeners() {
    document.querySelectorAll(".slot").forEach(slot => {
        slot.addEventListener("click", () => { activeSlot = slot.getAttribute("data-slot"); updateSidebarUI(); });
        slot.style.cursor = "pointer";
    });
}

function assignSlot(metric) {
    selectedSlots[activeSlot] = metric;
    const slots = ["x", "y", "size"];
    activeSlot = slots[(slots.indexOf(activeSlot) + 1) % slots.length];
    updateSidebarUI();
    if (currentView === "chart") updateBubbleChart();
    else drawMultiMetricTable();
}

function toggleRadarMetric(metric) {
    const idx = selectedRadarMetrics.indexOf(metric);
    if (idx >= 0) selectedRadarMetrics.splice(idx, 1);
    else { if (selectedRadarMetrics.length >= MAX_RADAR_METRICS) selectedRadarMetrics.shift(); selectedRadarMetrics.push(metric); }
    updateSidebarUI();
    if (currentView === "chart") drawRadarChart();
    else drawMultiMetricTable();
}

function clearAll() {
    selectedSlots = { x: null, y: null, size: null };
    selectedRadarMetrics = [];
    selectedStates.clear();
    if (mapPolygonSeries) mapPolygonSeries.mapPolygons.each(p => p.set("active", false));
    updateSidebarUI();
    if (currentView === "chart") {
        if (currentChartMode === "bubble") updateBubbleChart();
        else drawRadarChart();
    } else {
        drawMultiMetricTable();
    }
}

// =========================================
// MODE SWITCHING
// =========================================
function switchMode(mode) {
    if (mode === currentChartMode) return;
    currentChartMode = mode;
    updateSidebarUI();
    if (currentView === "table") {
        drawMultiMetricTable();
        return;
    }
    const chartDiv = document.getElementById(currentChartDiv);
    if (mode === "bubble") {
        safeClearDiv(currentChartDiv);
        initBubbleChart();
    } else {
        if (chartRoot) { chartRoot.dispose(); chartRoot = null; }
        drawRadarChart();
    }
    updateRadarInfoPanel();
}

function switchView(view) {
    currentView = view;
    const btnC = document.getElementById("btnChartView");
    const btnT = document.getElementById("btnTableView");
    const chartSec = document.getElementById("chartSection");
    const tableSec = document.getElementById("tableSection");

    if (view === "chart") {
        btnC.classList.add("active");
        btnT.classList.remove("active");
        chartSec.style.display = "flex";
        tableSec.style.display = "none";
        if (currentChartMode === "bubble") {
            if (!chartRoot) initBubbleChart();
            updateBubbleChart();
        } else {
            drawRadarChart();
        }
    } else {
        btnC.classList.remove("active");
        btnT.classList.add("active");
        chartSec.style.display = "none";
        tableSec.style.display = "block";
        drawMultiMetricTable();
    }
    updateRadarInfoPanel();
}

function drawMultiMetricTable() {
    const container = document.getElementById("multiMetricTableDiv");
    if (!container) return;

    let statesArr = Array.from(selectedStates).map(id => stateData.find(s => s.id === id)).filter(Boolean);
    if (statesArr.length === 0) {
        container.innerHTML = '<div class="ct-empty"><p style="text-align:center;color:#999;padding:40px;">Select states on the map to see data here.</p></div>';
        return;
    }

    const metrics = currentChartMode === "bubble"
        ? [selectedSlots.x, selectedSlots.y, selectedSlots.size].filter(Boolean)
        : selectedRadarMetrics;

    if (metrics.length === 0) {
        container.innerHTML = '<div class="ct-empty"><p style="text-align:center;color:#999;padding:40px;">Select metrics on the left to see data here.</p></div>';
        return;
    }

    if (window.multiTableSearchQuery === undefined) window.multiTableSearchQuery = "";
    if (window.multiTableSearchQuery) {
        const q = window.multiTableSearchQuery.toLowerCase();
        statesArr = statesArr.filter(r =>
            (r.name && r.name.toLowerCase().includes(q)) ||
            (r.region && r.region.toLowerCase().includes(q))
        );
    }
    window.multiTableSelectedRows = statesArr;

    // Sort statesArr
    statesArr.sort((a, b) => {
        let va = a[multiTableSortBy];
        let vb = b[multiTableSortBy];
        if (multiTableSortBy === "name") {
            return multiTableSortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
        }
        if (va === undefined || va === null) return 1;
        if (vb === undefined || vb === null) return -1;
        return multiTableSortAsc ? va - vb : vb - va;
    });

    let html = `
    <div class="ct-toolbar" style="margin-bottom:15px;">
        <div class="ct-search-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Search locations..." id="multiSearchInput" value="${window.multiTableSearchQuery}"
                   oninput="window.multiTableSearchQuery = this.value; drawMultiMetricTable();">
        </div>
        <div class="ct-actions">
            <button class="ct-action-btn" onclick="exportMultiTableToCSV(window.multiTableSelectedRows)" title="Export CSV">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                CSV
            </button>
            <button class="ct-action-btn" onclick="copyTableHTML('multiMetricTableDiv')" title="Copy HTML">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                HTML
            </button>
            <button class="ct-action-btn" onclick="copyMultiTableLaTeX(window.multiTableSelectedRows)" title="Copy LaTeX">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                LaTeX
            </button>
        </div>
    </div>
    <div class="ct-single-header" style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:12px;">
            <div class="ct-metric-pill">
                <span class="ct-metric-name">Comparison Data Table</span>
            </div>
            <button class="ct-group-toggle ${multiTableGrouped ? 'active' : ''}" 
                    onclick="toggleMultiTableGroup()">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" 
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18M3 12h18M3 18h18"/>
                </svg>
                Group Regions
            </button>
        </div>
        <span class="ct-row-count">${statesArr.length} selected state${statesArr.length === 1 ? "" : "s"}</span>
    </div>
    <div class="ct-scroll" style="overflow-x: auto;">
    <table class="ct-table" style="min-width: 100%;">
        <thead>
            <tr>
                <th class="ct-th ct-sortable" style="position:sticky; left:0; z-index:10; background:#f8fafc; min-width:140px; cursor:pointer;" onclick="toggleMultiTableSort('name')">
                    State ${multiTableSortBy === 'name' ? (multiTableSortAsc ? '↑' : '↓') : ''}
                </th>
                ${metrics.map(m => {
        const meta = tableMetricMeta[m] || { label: m, unit: "" };
        return `<th class="ct-th ct-sortable" style="min-width:120px; cursor:pointer;" onclick="toggleMultiTableSort('${m}')">
                        ${meta.label}${meta.unit ? ` (${meta.unit})` : ""}
                        ${multiTableSortBy === m ? (multiTableSortAsc ? '↑' : '↓') : ''}
                    </th>`;
    }).join("")}
            </tr>
        </thead>
        <tbody>`;

    const groupIcons = {
        "Metro": `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.8;"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="2"></line><line x1="15" y1="22" x2="15" y2="2"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="10" x2="20" y2="10"></line><line x1="4" y1="14" x2="20" y2="14"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>`,
        "Nonmetro": `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.8;"><path d="M12 3l8 11h-16l8-11z"></path><path d="M12 17v4"></path></svg>`,
        "Default": `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.8;"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>`
    };

    function renderRows(sArr) {
        let rHtml = "";
        sArr.forEach(state => {
            const badgeColor = regionColors[state.region] || "#888";
            rHtml += `<tr class="ct-row">
                <td class="ct-td" style="position:sticky; left:0; z-index:5; background:white; font-weight:700;">
                    ${state.name}
                    ${!multiTableGrouped ? `<span class="ct-region-badge" style="margin-left:8px; display:inline-block; background:${badgeColor}20;color:${badgeColor};border:1px solid ${badgeColor}40">${state.region}</span>` : ""}
                </td>
                ${metrics.map(m => {
                const val = state[m];
                const meta = tableMetricMeta[m] || { label: m, unit: "", fmt: "dec" };
                const displayVal = formatValue(val, meta.fmt);

                const allVals = stateData.map(s => s[m]).filter(v => typeof v === "number" && !isNaN(v));
                const min = Math.min(...allVals), max = Math.max(...allVals);
                const norm = (max === min) ? 0.5 : (val - min) / (max - min);
                const bg = heatColor(norm, meta.higherIsBad);

                return `<td class="ct-td" style="background:${bg}">${displayVal}</td>`;
            }).join("")}
            </tr>`;
        });
        return rHtml;
    }

    if (multiTableGrouped) {
        // use ordered regions
        const regions = ["Central", "East", "South", "West"];
        regions.forEach(r => {
            const rStates = statesArr.filter(s => s.region === r);
            if (rStates.length === 0) return;
            const badgeColor = regionColors[r] || "#64748b";
            const icon = groupIcons["Default"];
            html += `
                <tr class="ct-group-header">
                    <td colspan="${metrics.length + 1}" style="background: #f8fafc; padding: 10px 15px; border-bottom: 2px solid ${badgeColor}40; font-weight: 800; color: ${badgeColor}; font-size: 0.9rem; letter-spacing: 0.5px;">
                        <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
                            <div style="display:flex; align-items:center; gap:10px;">
                                ${icon}
                                ${r.toUpperCase()}
                            </div>
                            <span style="font-size:0.75rem; font-weight:600; opacity:0.8;">${rStates.length} states</span>
                        </div>
                    </td>
                </tr>`;
            html += renderRows(rStates);
        });
    } else {
        html += renderRows(statesArr);
    }

    html += `</tbody></table></div>`;
    container.innerHTML = html;

    const searchInput = document.getElementById('multiSearchInput');
    if (searchInput && window.multiTableSearchQuery) {
        searchInput.focus();
        searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
    }
}

// =========================================
// TABLE EXPORT HELPERS
// =========================================
function exportMultiTableToCSV(rows) {
    if (!rows || rows.length === 0) return;
    const metrics = currentChartMode === "bubble"
        ? [selectedSlots.x, selectedSlots.y, selectedSlots.size].filter(Boolean)
        : selectedRadarMetrics;

    const headers = ["Rank", "Location", "Region"];
    metrics.forEach(m => {
        const meta = tableMetricMeta[m] || { label: m, unit: "" };
        const unitLabel = meta.unit ? ` (${meta.unit})` : "";
        headers.push(`${meta.label}${unitLabel}`);
    });

    let csvContent = headers.join(",") + "\n";
    rows.forEach((row, i) => {
        const line = [i + 1, `"${row.name}"`, `"${row.region || ''}"`];
        metrics.forEach(m => {
            const meta = tableMetricMeta[m] || { fmt: "dec" };
            const val = formatValue(row[m], meta.fmt).replace(/,/g, '');
            line.push(val);
        });
        csvContent += line.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "multi_metric_comparison.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function copyMultiTableLaTeX(rows) {
    if (!rows || rows.length === 0) return;
    const metrics = currentChartMode === "bubble"
        ? [selectedSlots.x, selectedSlots.y, selectedSlots.size].filter(Boolean)
        : selectedRadarMetrics;

    let latex = "% --- LaTeX Table Setup ---\n";
    latex += "\\begin{table}[htbp]\n";
    latex += "  \\centering\n";
    latex += "  \\caption{Multi-Metric Geographic Comparison}\n";

    let cols = "rll" + "r".repeat(metrics.length);
    latex += `  \\begin{tabular}{${cols}}\n`;
    latex += "    \\toprule\n";

    let headerRow = ["Rank", "Location", "Region"];
    metrics.forEach(m => {
        const meta = tableMetricMeta[m] || { label: m, unit: "" };
        const cleanLabel = meta.label.replace(/_/g, '\\_').replace(/%/g, '\\%').replace(/&/g, '\\&');
        const unitText = meta.unit ? ` (${meta.unit.replace(/%/g, '\\%')})` : "";
        headerRow.push(`${cleanLabel}${unitText}`);
    });
    latex += `    ${headerRow.join(" & ")} \\\\\n`;
    latex += "    \\midrule\n";

    rows.forEach((row, i) => {
        const name = row.name.replace(/&/g, '\\&').replace(/_/g, '\\_').replace(/%/g, '\\%');
        const reg = (row.region || "").replace(/&/g, '\\&').replace(/_/g, '\\_').replace(/%/g, '\\%');

        let lineVals = [i + 1, name, reg];
        metrics.forEach(m => {
            const valNum = parseFloat(row[m]);
            const meta = tableMetricMeta[m] || { fmt: "dec" };
            const valStr = formatValue(valNum, meta.fmt).replace(/%/g, '\\%').replace(/&/g, '\\&');
            lineVals.push(valStr);
        });
        latex += `    ${lineVals.join(" & ")} \\\\\n`;
    });

    latex += "    \\bottomrule\n";
    latex += "  \\end{tabular}\n";
    latex += "\\end{table}";

    navigator.clipboard.writeText(latex).then(() => {
        const btn = document.querySelector('.ct-action-btn[title="Copy LaTeX"]');
        if (typeof showCopyFeedback === 'function') showCopyFeedback(btn);
    }).catch(err => console.error('Failed to copy LaTeX:', err));
}

// =========================================
// SIDEBAR UI
// =========================================
function updateSidebarUI() {
    const btnB = document.getElementById("btnBubbleMode");
    const btnR = document.getElementById("btnRadarMode");
    if (btnB && btnR) {
        const base = "display:flex;align-items:center;gap:6px;padding:7px 18px;border-radius:30px;font-weight:700;font-size:0.85rem;cursor:pointer;transition:all 0.2s;border-style:solid;border-width:1.5px;";
        btnB.style.cssText = base + (currentChartMode === "bubble" ? "background:#c83830;color:#fff;border-color:#c83830;" : "background:transparent;color:#555;border-color:#ddd;");
        btnR.style.cssText = base + (currentChartMode === "radar" ? "background:#c83830;color:#fff;border-color:#c83830;" : "background:transparent;color:#555;border-color:#ddd;");
    }

    const bubbleSlots = document.getElementById("bubbleSlots");
    const radarChips = document.getElementById("radarMetricChips");
    const radarInfo = document.getElementById("radarInfoPanel");
    if (bubbleSlots) bubbleSlots.style.display = currentChartMode === "bubble" ? "flex" : "none";
    if (radarChips) radarChips.style.display = currentChartMode === "radar" ? "block" : "none";
    if (radarInfo) radarInfo.style.display = currentChartMode === "radar" ? "block" : "none";

    if (currentChartMode === "bubble") updateBubbleSlotUI();
    else updateRadarChipsUI();

    document.querySelectorAll(".metric-card").forEach(card => {
        const m = card.getAttribute("data-metric");
        card.classList.remove("selected");
        if (currentChartMode === "bubble" && Object.values(selectedSlots).includes(m)) card.classList.add("selected");
        if (currentChartMode === "radar" && selectedRadarMetrics.includes(m)) card.classList.add("selected");
    });
}

function updateBubbleSlotUI() {
    ["x", "y", "size"].forEach(s => {
        const el = document.querySelector(`.slot[data-slot="${s}"]`);
        if (!el) return;
        const val = el.querySelector(".slot-value");
        el.style.backgroundColor = s === activeSlot ? "rgba(200,56,48,0.1)" : "transparent";
        el.style.borderRadius = "8px";
        if (val) val.innerText = selectedSlots[s] ? selectedSlots[s].replace(/_/g, " ").toUpperCase() : "Select metric...";
    });
}

function updateRadarChipsUI() {
    const container = document.getElementById("radarMetricChips");
    if (!container) return;
    if (!selectedRadarMetrics.length) {
        container.innerHTML = '<p style="color:#999;font-size:0.85rem;text-align:center;padding:10px 0;margin:0;">Click metrics below to add (max ' + MAX_RADAR_METRICS + ')</p>';
        return;
    }
    let html = '<div style="font-size:0.8rem;color:#888;margin-bottom:8px;">' + selectedRadarMetrics.length + '/' + MAX_RADAR_METRICS + ' metrics selected</div><div style="display:flex;flex-wrap:wrap;">';
    selectedRadarMetrics.forEach((m, i) => {
        const color = radarPalette[i % radarPalette.length];
        const label = m.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        html += '<div onclick="toggleRadarMetric(\'' + m + '\')" style="display:inline-flex;align-items:center;gap:5px;background:' + color + '22;border:1.5px solid ' + color + ';color:' + color + ';border-radius:20px;padding:4px 10px;font-size:0.78rem;font-weight:700;cursor:pointer;margin:3px;white-space:nowrap;">'
            + label + ' <span style="font-size:1rem;line-height:1;">&#215;</span></div>';
    });
    html += '</div>';
    container.innerHTML = html;
}

// =========================================
// MAP
// =========================================
function initMap() {
    mapRoot = am5.Root.new("multiMapDiv");
    mapRoot.setThemes([am5themes_Animated.new(mapRoot)]);

    // Add export menu
    let exporting = am5plugins_exporting.Exporting.new(mapRoot, {
        menu: am5plugins_exporting.ExportingMenu.new(mapRoot, {
            align: "right",
            valign: "top"
        })
    });

    const mapChart = mapRoot.container.children.push(am5map.MapChart.new(mapRoot, { panX: "rotateX", projection: am5map.geoAlbersUsa() }));
    mapPolygonSeries = mapChart.series.push(am5map.MapPolygonSeries.new(mapRoot, { geoJSON: am5geodata_usaLow }));
    mapPolygonSeries.mapPolygons.template.setAll({ tooltipText: "{name}", fill: am5.color(0xd9cec8), stroke: am5.color(0xffffff), strokeWidth: 1, cursorOverStyle: "pointer", interactive: true });
    mapPolygonSeries.mapPolygons.template.states.create("hover", { fill: am5.color(0xd3a29f) });
    mapPolygonSeries.mapPolygons.template.states.create("active", { fill: am5.color(0xc83830) });
    mapPolygonSeries.mapPolygons.template.events.on("click", ev => toggleState(ev.target.dataItem.get("id")));
    mapPolygonSeries.mapPolygons.template.adapters.add("fill", function (fill, target) {
        if (target.get("active")) {
            const dataContext = target.dataItem.dataContext;
            if (multiTableGrouped && dataContext && dataContext.region && regionColors[dataContext.region]) {
                return am5.color(regionColors[dataContext.region]);
            }
            return am5.color(0xc83830);
        }
        return fill;
    });
    mapPolygonSeries.data.setAll(stateData);
    mapPolygonSeries.events.on("datavalidated", () => {
        mapPolygonSeries.mapPolygons.each(p => { if (selectedStates.has(p.dataItem.get("id"))) p.set("active", true); });
    });
    addCustomMapControls("multiMapDiv", mapChart, true);
}

function toggleState(id) {
    if (selectedStates.has(id)) selectedStates.delete(id); else selectedStates.add(id);
    mapPolygonSeries.mapPolygons.each(p => p.set("active", selectedStates.has(p.dataItem.get("id"))));
    if (currentView === "chart") {
        if (currentChartMode === "bubble") updateBubbleChart(); else drawRadarChart();
    } else {
        drawMultiMetricTable();
    }
}

// =========================================
// BUBBLE CHART
// =========================================
function initBubbleChart() {
    chartRoot = am5.Root.new(currentChartDiv);
    chartRoot.setThemes([am5themes_Animated.new(chartRoot)]);

    // Add export menu
    let exporting = am5plugins_exporting.Exporting.new(chartRoot, {
        menu: am5plugins_exporting.ExportingMenu.new(chartRoot, {
            align: "right",
            valign: "bottom"
        })
    });

    const chart = chartRoot.container.children.push(am5xy.XYChart.new(chartRoot, { panX: true, panY: true, wheelY: "zoomXY", pinchZoomX: true, pinchZoomY: true, layout: chartRoot.verticalLayout }));
    const legend = chart.children.push(am5.Legend.new(chartRoot, { centerX: am5.p50, x: am5.p50, layout: chartRoot.horizontalLayout, nameField: "name", fillField: "color", strokeField: "color", paddingTop: 15, paddingBottom: 15, clickTarget: "none" }));
    legend.data.setAll(Object.entries(regionColors).map(([name, c]) => ({ name, color: am5.color(c) })));
    xAxis = chart.xAxes.push(am5xy.ValueAxis.new(chartRoot, { extraMax: 0.1, extraMin: 0.1, renderer: am5xy.AxisRendererX.new(chartRoot, { minGridDistance: 50 }), tooltip: am5.Tooltip.new(chartRoot, {}) }));
    yAxis = chart.yAxes.push(am5xy.ValueAxis.new(chartRoot, { extraMax: 0.1, extraMin: 0.1, renderer: am5xy.AxisRendererY.new(chartRoot, {}), tooltip: am5.Tooltip.new(chartRoot, {}) }));
    xAxisLabel = am5.Label.new(chartRoot, { text: "X Axis", x: am5.p50, centerX: am5.p50, fontWeight: "bold" });
    xAxis.children.push(xAxisLabel);
    yAxisLabel = am5.Label.new(chartRoot, { rotation: -90, text: "Y Axis", y: am5.p50, centerX: am5.p50, fontWeight: "bold" });
    yAxis.children.unshift(yAxisLabel);
    bubbleSeries = chart.series.push(am5xy.LineSeries.new(chartRoot, { calculateAggregates: true, minBulletDistance: 0, xAxis, yAxis, valueYField: "y", valueXField: "x", valueField: "size", seriesTooltipTarget: "bullet", tooltip: am5.Tooltip.new(chartRoot, { pointerOrientation: "horizontal", labelText: "[bold]{title}[/]\nRegion: {region}\nX: {valueX}\nY: {valueY}\nSize: {value}" }) }));
    bubbleSeries.strokes.template.set("visible", false);
    circleTemplate = am5.Template.new({});
    circleTemplate.adapters.add("fill", (fill, target) => {
        const dc = target.dataItem && target.dataItem.dataContext;
        return (dc && regionColors[dc.region]) ? am5.color(regionColors[dc.region]) : fill;
    });
    bubbleSeries.bullets.push(() => am5.Bullet.new(chartRoot, { sprite: am5.Circle.new(chartRoot, { radius: 5, fill: am5.color(0xc83830), fillOpacity: 0.7, stroke: am5.color(0xffffff), strokeWidth: 2 }, circleTemplate) }));
    bubbleSeries.set("heatRules", [{ target: circleTemplate, min: 10, max: 80, dataField: "value", key: "radius" }]);
    chart.set("cursor", am5xy.XYCursor.new(chartRoot, { xAxis, yAxis, snapToSeries: [bubbleSeries] }));
    updateBubbleChart();
    bubbleSeries.appear(1000);
    chart.appear(1000, 100);
}

function updateBubbleChart() {
    if (!bubbleSeries) return;
    if (!selectedSlots.x || !selectedSlots.y) { bubbleSeries.data.setAll([]); return; }
    if (xAxisLabel) xAxisLabel.set("text", selectedSlots.x.replace(/_/g, " ").toUpperCase());
    if (yAxisLabel) yAxisLabel.set("text", selectedSlots.y.replace(/_/g, " ").toUpperCase());
    const data = [];
    selectedStates.forEach(id => {
        const s = stateData.find(d => d.id === id);
        if (!s) return;
        const v = m => (!m || typeof s[m] !== "number") ? 0 : s[m];
        data.push({ title: s.name, region: s.region, x: v(selectedSlots.x), y: v(selectedSlots.y), size: Math.max(0.1, v(selectedSlots.size) || 10) });
    });
    bubbleSeries.data.setAll(data);
}

function toggleRadarState(stateId) {
    if (hiddenRadarStates.has(stateId)) {
        hiddenRadarStates.delete(stateId);
    } else {
        hiddenRadarStates.add(stateId);
    }
    drawRadarChart();
}

// =========================================
// RADAR CHART (pure SVG)
// =========================================
function drawRadarChart() {
    const div = document.getElementById(currentChartDiv);
    if (!div) return;
    safeClearDiv(currentChartDiv);
    div.style.position = "relative";

    if (selectedRadarMetrics.length < 2 || selectedStates.size === 0) {
        const msg = selectedRadarMetrics.length < 2
            ? "Select at least <strong>2 metrics</strong> from the left panel, then click states on the map"
            : "Click at least <strong>1 state</strong> on the map to compare";
        div.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#aaa;font-size:15px;text-align:center;flex-direction:column;gap:15px;"><svg xmlns=\'http://www.w3.org/2000/svg\' width=\'44\' height=\'44\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'#ccc\' stroke-width=\'1.5\'><polygon points=\'12 2 19 21 12 17 5 21 12 2\'/></svg>' + msg + '</div>';
        return;
    }

    let W = div.clientWidth;
    let H = div.clientHeight;

    // Reliability check: If returning from display:none or flex reflow, dimensions might be 0
    if (!W || W < 100) W = div.parentElement ? div.parentElement.clientWidth : 800;

    // In normal view, force a standard height if the flex container is being stubborn
    if (currentChartDiv === "bubbleChartDiv") {
        H = 650;
    } else if (!H || H < 100) {
        H = 700;
    }

    div.style.minHeight = H + "px"; // Force container to respect the SVG height
    const isMobile = window.innerWidth <= 768;


    // In modal, ensure we have a decent height since it's scrollable
    if (currentChartDiv === "chartModalDiv") {
        if (H < 700) H = 700;
    }
    const statesArr = Array.from(selectedStates);
    const N = selectedRadarMetrics.length;
    const LEVELS = 5;
    const itemW = 180;
    const itemsPerRow = Math.max(1, Math.floor(W / itemW));
    const legendRows = Math.ceil(statesArr.length / itemsPerRow);
    const LEGEND_H = legendRows * 30 + 60;

    const cx = W / 2;
    const cy = LEGEND_H + (H - LEGEND_H) / 2;
    const padding = isMobile ? 120 : 180;
    const verticalPadding = isMobile ? 80 : 100;
    const R = Math.min(cx - padding, (H - LEGEND_H) / 2 - verticalPadding);
    const angles = Array.from({ length: N }, (_, i) => (2 * Math.PI * i / N) - Math.PI / 2);
    const NS = "http://www.w3.org/2000/svg";

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", W);
    svg.setAttribute("height", H);
    svg.style.cssText = "font-family:system-ui,-apple-system,sans-serif;display:block;";

    function mkEl(tag, attrs) {
        const e = document.createElementNS(NS, tag);
        if (attrs) Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
        return e;
    }
    function mkTxt(s, attrs) { const e = mkEl("text", attrs); e.textContent = s; return e; }

    // ── Grid circles ────────────────────────────────────────────
    for (let l = 1; l <= LEVELS; l++) {
        const r = (l / LEVELS) * R;
        svg.appendChild(mkEl("circle", { cx, cy, r, fill: l % 2 === 0 ? "rgba(0,0,0,0.02)" : "none", stroke: "#ddd", "stroke-dasharray": "5,5", "stroke-width": "1.5" }));
        svg.appendChild(mkTxt(String(Math.round((l / LEVELS) * 100)), { x: cx + 5, y: cy - r + 15, "font-size": isMobile ? "10" : "13", "font-weight": "700", fill: "#bbb", "text-anchor": "start" }));
    }

    // ── Spokes + labels ──────────────────────────────────────────
    angles.forEach((ang, i) => {
        const x2 = cx + Math.cos(ang) * R;
        const y2 = cy + Math.sin(ang) * R;
        svg.appendChild(mkEl("line", { x1: cx, y1: cy, x2, y2, stroke: "#ccc", "stroke-dasharray": "5,5", "stroke-width": isMobile ? "1" : "1.5" }));

        const lr = R + (isMobile ? 35 : 45);
        const lx = cx + Math.cos(ang) * lr;
        const ly = cy + Math.sin(ang) * lr;
        const words = selectedRadarMetrics[i].replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()).split(" ");
        const lines = [];
        let cur = "";
        const maxLineLen = isMobile ? 12 : 14;
        words.forEach(w => { if (cur.length + w.length + 1 > maxLineLen && cur) { lines.push(cur); cur = w; } else { cur = cur ? cur + " " + w : w; } });
        if (cur) lines.push(cur);

        const lh = isMobile ? 14 : 20;
        const labelEl = mkEl("text", { "text-anchor": "middle", "font-size": isMobile ? "11" : "17", "font-weight": isMobile ? "400" : "800", fill: "#222" });
        lines.forEach((line, li) => {
            const ts = document.createElementNS(NS, "tspan");
            ts.setAttribute("x", lx);
            ts.setAttribute("y", ly - (lines.length - 1) * lh / 2 + li * lh);
            ts.textContent = line;
            labelEl.appendChild(ts);
        });
        svg.appendChild(labelEl);
    });

    const tip = document.createElement("div");
    tip.style.cssText = "position:absolute;background:rgba(20,20,20,0.95);color:#fff;padding:14px 20px;border-radius:12px;font-size:15px;pointer-events:none;display:none;z-index:200;line-height:1.7;white-space:nowrap;box-shadow:0 10px 30px rgba(0,0,0,0.4);";
    div.appendChild(tip);
    div.addEventListener("mouseleave", () => { tip.style.display = "none"; });

    // No extra declaration here
    statesArr.forEach((stateId, si) => {
        if (hiddenRadarStates.has(stateId)) return;
        const state = stateData.find(s => s.id === stateId);
        if (!state) return;
        const color = radarPalette[si % radarPalette.length];

        const pts = selectedRadarMetrics.map((metric, i) => {
            const raw = state[metric];
            const rawVal = (typeof raw === "number" && !isNaN(raw)) ? raw : null;
            const norm = rawVal !== null ? normalizeValue(metric, rawVal) / 100 : 0;
            return { x: cx + Math.cos(angles[i]) * R * norm, y: cy + Math.sin(angles[i]) * R * norm, norm, rawVal, metric };
        });

        const tipRows = pts.map(p => {
            const ml = p.metric.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
            const raw = p.rawVal !== null ? p.rawVal.toFixed(2) : "N/A";
            const score = Math.round(p.norm * 100);
            return '<span style="color:#aaa;font-size:14px;">' + ml + '</span>'
                + '<span style="float:right;margin-left:28px;color:#fff;font-weight:700;">' + score + ' <span style="color:#888;font-size:12px;font-weight:400;">(' + raw + ')</span></span>';
        }).join("<br>");

        const polyEl = mkEl("polygon", {
            points: pts.map(p => p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" "),
            fill: color, "fill-opacity": "0.24",
            stroke: color, "stroke-width": isMobile ? "2" : "3.2", "stroke-linejoin": "round",
            style: "cursor:pointer;"
        });
        polyEl.addEventListener("mouseenter", () => {
            tip.innerHTML = '<strong style="font-size:17px;">' + state.name + '</strong>'
                + '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.22);margin:12px 0;">'
                + tipRows
                + '<div style="color:#999;font-size:12px;margin-top:12px;">Score 0&#8211;100 | Raw value in parentheses</div>';
            tip.style.display = "block";
        });
        polyEl.addEventListener("mousemove", e => {
            const cr = div.getBoundingClientRect();
            tip.style.left = (e.clientX - cr.left + 18) + "px";
            tip.style.top = (e.clientY - cr.top - 16) + "px";
        });
        polyEl.addEventListener("mouseleave", () => { tip.style.display = "none"; });
        svg.appendChild(polyEl);

        pts.forEach(p => {
            const dot = mkEl("circle", { cx: p.x, cy: p.y, r: isMobile ? 4 : 6.5, fill: color, stroke: "white", "stroke-width": isMobile ? "1.5" : "2.8", style: "cursor:pointer;" });
            const ml = p.metric.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
            dot.addEventListener("mouseenter", () => {
                tip.innerHTML = '<strong style="font-size:17px;">' + state.name + '</strong> &#8212; ' + ml
                    + '<br>Score: <strong>' + Math.round(p.norm * 100) + '</strong> / 100'
                    + '<br>Raw value: ' + (p.rawVal !== null ? p.rawVal.toFixed(2) : "N/A");
                tip.style.display = "block";
            });
            dot.addEventListener("mousemove", e => {
                const cr = div.getBoundingClientRect();
                tip.style.left = (e.clientX - cr.left + 18) + "px";
                tip.style.top = (e.clientY - cr.top - 16) + "px";
            });
            dot.addEventListener("mouseleave", () => { tip.style.display = "none"; });
            svg.appendChild(dot);
        });
    });

    statesArr.forEach((stateId, si) => {
        const state = stateData.find(s => s.id === stateId);
        if (!state) return;
        const isHidden = hiddenRadarStates.has(stateId);
        const color = radarPalette[si % radarPalette.length];
        const row = Math.floor(si / itemsPerRow);
        const col = si % itemsPerRow;
        const rowCount = Math.min(statesArr.length - row * itemsPerRow, itemsPerRow);
        const lx = (W - rowCount * itemW) / 2 + col * itemW + 10;
        const ly = row * 30 + 25;

        const g = mkEl("g", { style: "cursor:pointer; transition: opacity 0.2s;" });
        if (isHidden) g.setAttribute("opacity", "0.35");

        g.appendChild(mkEl("circle", { cx: lx, cy: ly, r: isMobile ? 5 : 7, fill: color }));
        g.appendChild(mkTxt(state.name, { x: lx + 20, y: ly + (isMobile ? 5 : 7), "font-size": isMobile ? "13" : "16", "font-weight": isMobile ? "500" : "700", fill: "#333" }));

        g.onclick = () => toggleRadarState(stateId);
        svg.appendChild(g);
    });

    div.appendChild(svg);
    updateRadarInfoPanel();
}

init();

// =========================================
// MODAL FUNCTIONS
// =========================================

function openChartModal() {
    const modal = document.getElementById("chartModal");
    if (!modal) return;

    modal.style.display = "flex";
    document.body.style.overflow = "hidden"; // Prevent background scrolling

    currentChartDiv = "chartModalDiv";

    // Clear out current container before re-rendering
    safeClearDiv("bubbleChartDiv");

    // Use a small timeout to ensure the modal is laid out before drawing
    setTimeout(() => {
        if (currentChartMode === "bubble") {
            if (chartRoot) { chartRoot.dispose(); chartRoot = null; }
            initBubbleChart();
            updateBubbleChart();
        } else {
            if (chartRoot) { chartRoot.dispose(); chartRoot = null; }
            drawRadarChart();
        }
        updateRadarInfoPanel();
    }, 50);
}

function closeChartModal(event) {
    if (event && event.target !== event.currentTarget && !event.target.classList.contains('chart-modal-close')) {
        return;
    }

    const modal = document.getElementById("chartModal");
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "";

        currentChartDiv = "bubbleChartDiv";

        // Clear out modal container
        safeClearDiv("chartModalDiv");

        // Use a small timeout to allow the browser to reflow the page after modal closes
        setTimeout(() => {
            if (currentChartMode === "bubble") {
                if (chartRoot) { chartRoot.dispose(); chartRoot = null; }
                initBubbleChart();
                updateBubbleChart();
            } else {
                if (chartRoot) { chartRoot.dispose(); chartRoot = null; }
                drawRadarChart();
            }
            updateRadarInfoPanel();
        }, 100);
    }
}
