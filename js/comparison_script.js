// =========================================
// COMPARISON MODE — ALL ACS + PLACES Data
// =========================================

const metrics = [
    // Economic Factors (ACS)
    "pct_unemployment_rate", "pct_in_labor_force",
    "pct_natural_resources_construction",
    // Education (ACS)
    "pct_graduate_professional_degree",
    // Health Outcomes (PLACES)
    "depression_prevalence", "obesity_prevalence", "diabetes_prevalence",
    "arthritis_prevalence", "asthma_prevalence", "high_blood_pressure_prevalence",
    "high_cholesterol_prevalence", "coronary_heart_disease_prevalence",
    "stroke_prevalence", "cancer_prevalence", "copd_prevalence",
    // Health Status (PLACES)
    "mental_health_issues_prevalence", "physical_health_issues_prevalence",
    "general_health_prevalence",
    // Health Risk Behaviors (PLACES)
    "smoking_prevalence", "binge_drinking_prevalence", "physical_inactivity_prevalence",
    // Prevention (PLACES)
    "checkup_prevalence", "cholesterol_screening_prevalence",
    "bp_medication_prevalence", "access2_prevalence",
    // Disability (PLACES)
    "disability_prevalence", "cognitive_difficulties_prevalence",
    "mobility_difficulty_prevalence", "hearing_disability_prevalence",
    "vision_difficulty_prevalence", "self_care_difficulty_prevalence",
    "independent_living_difficulty_prevalence",
    // Social Needs (PLACES)
    "loneliness_prevalence", "emotional_support_prevalence",
    "food_insecurity_prevalence", "food_stamp_prevalence",
    "housing_insecurity_prevalence", "utility_shutoff_prevalence",
    "lack_transportation_prevalence",
    // Demographics & Housing (ACS)
    "total_population_sum", "average_household_size", "average_family_size",
    "pct_speak_english_less_than_very_well",
    "pct_households_1plus_people_65plus",
    "households_with_broadband_sum"
];

let stateData = [];
let selectedStates = new Set();
let activeMetric = "pct_unemployment_rate";
let regionMode = true;
let verticalChartMode = false;

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

function getRegion(stateAbbr) {
    for (const region in regionMapping) {
        if (regionMapping[region].includes(stateAbbr)) return region;
    }
    return "West";
}

let mapRoot, chartRoot;
let mapPolygonSeries, barSeries, xAxis, yAxis, legend;

// =========================================
// DATA LOADING — merge ACS + PLACES
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
// INITIALIZATION
// =========================================

async function init() {
    try {
        const data = await loadAndMergeData();

        stateData = data.map(d => ({
            ...d,
            id: d.id.replace(".", "-"),
            region: getRegion(d.state_abbr)
        }));

        initMetricCardListeners();
        initMobileMetricDropdown();
        initMap();

        document.getElementById("clearSelection").addEventListener("click", clearSelection);

        const rToggle = document.getElementById("regionToggle");
        if (rToggle) {
            regionMode = !rToggle.checked;
            window.tableGroupMode = regionMode;
            rToggle.addEventListener("change", (e) => {
                regionMode = !e.target.checked;
                window.tableGroupMode = regionMode;
                updateChart();
                if (currentView === 'table') refreshTable();
                mapPolygonSeries.mapPolygons.each((polygon) => {
                    if (polygon.get("active")) {
                        polygon.set("active", false);
                        polygon.set("active", true);
                    }
                });
            });
        }

        // Set vertical mode BEFORE building the chart
        const vToggle = document.getElementById("verticalToggle");
        if (vToggle) {
            verticalChartMode = vToggle.checked;
            vToggle.addEventListener("change", (e) => {
                verticalChartMode = e.target.checked;
                initChart();
                updateChart();
            });
        }

        // Now init the chart with the correct vertical mode
        initChart();
    } catch (err) {
        console.error("Failed to initialize:", err);
    }
}

function initMetricCardListeners() {
    const cards = document.querySelectorAll(".metric-card");
    cards.forEach(card => {
        const m = card.getAttribute("data-metric");
        if (!m) return;

        if (m === activeMetric) card.classList.add("active");

        card.onclick = () => {
            document.querySelectorAll(".metric-card").forEach(el => el.classList.remove("active"));
            card.classList.add("active");
            activeMetric = m;
            updateChart();
            // Sync mobile dropdown if it exists
            const dd = document.getElementById("mobileMetricSelect");
            if (dd) dd.value = m;
        };
    });
}

// =========================================
// MOBILE METRIC DROPDOWN
// =========================================

function initMobileMetricDropdown() {
    const grid = document.getElementById("metricsGrid");
    const header = document.querySelector(".metrics-header");
    if (!grid || !header) return;

    // Build grouped select from DOM
    const select = document.createElement("select");
    select.id = "mobileMetricSelect";
    select.className = "mobile-metric-dropdown";

    let currentGroup = null;

    Array.from(grid.children).forEach(child => {
        if (child.classList.contains("section-header")) {
            const h3 = child.querySelector("h3");
            if (h3) {
                currentGroup = document.createElement("optgroup");
                currentGroup.label = h3.textContent.trim();
                select.appendChild(currentGroup);
            }
        } else if (child.classList.contains("metric-card")) {
            const metric = child.getAttribute("data-metric");
            const label = child.querySelector(".metric-label");
            if (metric && label) {
                const option = document.createElement("option");
                option.value = metric;
                option.textContent = label.textContent.trim();
                if (metric === activeMetric) option.selected = true;
                if (currentGroup) {
                    currentGroup.appendChild(option);
                } else {
                    select.appendChild(option);
                }
            }
        }
    });

    select.addEventListener("change", (e) => {
        activeMetric = e.target.value;
        // Sync desktop cards
        document.querySelectorAll(".metric-card").forEach(el => el.classList.remove("active"));
        const activeCard = document.querySelector(`.metric-card[data-metric="${activeMetric}"]`);
        if (activeCard) activeCard.classList.add("active");
        updateChart();
    });

    // Insert after the header content
    header.appendChild(select);
}

// =========================================
// MAP LOGIC (amCharts 5)
// =========================================

function initMap() {
    mapRoot = am5.Root.new("compMapDiv");
    mapRoot.setThemes([am5themes_Animated.new(mapRoot)]);

    const mapChart = mapRoot.container.children.push(am5map.MapChart.new(mapRoot, {
        panX: "rotateX",
        projection: am5map.geoAlbersUsa()
    }));

    mapPolygonSeries = mapChart.series.push(am5map.MapPolygonSeries.new(mapRoot, {
        geoJSON: am5geodata_usaLow
    }));

    mapPolygonSeries.mapPolygons.template.setAll({
        tooltipText: "{name}",
        fill: am5.color(0xd9cec8),
        stroke: am5.color(0xffffff),
        strokeWidth: 1,
        cursorOverStyle: "pointer",
        interactive: true
    });

    mapPolygonSeries.mapPolygons.template.states.create("hover", { fill: am5.color(0xd3a29f) });
    mapPolygonSeries.mapPolygons.template.states.create("active", { fill: am5.color(0xc83830) });

    mapPolygonSeries.mapPolygons.template.adapters.add("fill", function (fill, target) {
        if (target.get("active")) {
            const dataContext = target.dataItem.dataContext;
            if (regionMode && dataContext && dataContext.region && regionColors[dataContext.region]) {
                return am5.color(regionColors[dataContext.region]);
            }
            return am5.color(0xc83830);
        }
        return fill;
    });

    mapPolygonSeries.mapPolygons.template.events.on("click", (ev) => {
        const dataItem = ev.target.dataItem;
        const id = dataItem.get("id");

        if (ev.originalEvent.ctrlKey || ev.originalEvent.metaKey) {
            toggleStateSelection(id);
        } else {
            clearSelection();
            toggleStateSelection(id);
        }
    });

    initMapData();
    addCustomMapControls("compMapDiv", mapChart, true);
}

function initMapData() {
    mapPolygonSeries.data.setAll(stateData);
}

function toggleStateSelection(id) {
    if (selectedStates.has(id)) {
        selectedStates.delete(id);
    } else {
        selectedStates.add(id);
    }

    mapPolygonSeries.mapPolygons.each((polygon) => {
        const pId = polygon.dataItem.get("id");
        polygon.set("active", selectedStates.has(pId));
    });

    updateChart();
}

function clearSelection() {
    selectedStates.clear();
    mapPolygonSeries.mapPolygons.each((polygon) => {
        polygon.set("active", false);
    });
    updateChart();
}

// =========================================
// CHART LOGIC (amCharts 5)
// =========================================

let yAxisLabel;
let currentChartDiv = "compChartDiv";

function initChart() {
    if (chartRoot) {
        chartRoot.dispose();
    }

    chartRoot = am5.Root.new(currentChartDiv);
    chartRoot.setThemes([am5themes_Animated.new(chartRoot)]);

    const isVert = verticalChartMode;

    const isMobileChart = window.innerWidth <= 768;

    const chart = chartRoot.container.children.push(am5xy.XYChart.new(chartRoot, {
        panX: false, panY: false, wheelX: "none", wheelY: "none",
        layout: isMobileChart ? chartRoot.verticalLayout : chartRoot.horizontalLayout,
        paddingLeft: isVert ? 0 : (isMobileChart ? 40 : 160),
        paddingTop: isVert ? (isMobileChart ? 10 : 70) : 20,
        paddingBottom: isVert ? (isMobileChart ? 40 : 100) : 0
    }));

    // On mobile vertical, give the chart div enough height for the bars
    if (isMobileChart && isVert) {
        const el = document.getElementById("compChartDiv");
        if (el) el.style.minHeight = "550px";
    } else if (isMobileChart) {
        const el = document.getElementById("compChartDiv");
        if (el) el.style.minHeight = "";
    }

    if (isMobileChart) {
        legend = chart.children.push(am5.Legend.new(chartRoot, {
            nameField: "name", fillField: "color", strokeField: "color",
            centerX: am5.p50, x: am5.p50,
            layout: am5.GridLayout.new(chartRoot, { maxColumns: 2, fixedWidthGrid: true }),
            clickTarget: "none",
            marginTop: 30
        }));
    } else {
        legend = chart.children.push(am5.Legend.new(chartRoot, {
            nameField: "name", fillField: "color", strokeField: "color",
            marginLeft: 20, y: 20, layout: chartRoot.verticalLayout, clickTarget: "none"
        }));
    }

    if (isVert) {
        xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(chartRoot, {
            categoryField: "name",
            renderer: am5xy.AxisRendererX.new(chartRoot, { minGridDistance: 30 }),
            tooltip: am5.Tooltip.new(chartRoot, {})
        }));
        xAxis.get("renderer").labels.template.setAll({ rotation: -45, centerY: am5.p50, centerX: am5.p100, paddingRight: 15, fontSize: isMobileChart ? 9 : 14, fontWeight: isMobileChart ? "bold" : "normal" });

        yAxis = chart.yAxes.push(am5xy.ValueAxis.new(chartRoot, {
            renderer: am5xy.AxisRendererY.new(chartRoot, {}),
            tooltip: am5.Tooltip.new(chartRoot, {})
        }));
    } else {
        yAxis = chart.yAxes.push(am5xy.CategoryAxis.new(chartRoot, {
            categoryField: "name",
            renderer: am5xy.AxisRendererY.new(chartRoot, { minGridDistance: 10, minorGridEnabled: true }),
            tooltip: am5.Tooltip.new(chartRoot, {})
        }));
        yAxis.get("renderer").labels.template.setAll({ fontSize: isMobileChart ? 9 : 12, fontWeight: isMobileChart ? "bold" : "normal", location: 0.5 });

        xAxis = chart.xAxes.push(am5xy.ValueAxis.new(chartRoot, {
            renderer: am5xy.AxisRendererX.new(chartRoot, {}),
            tooltip: am5.Tooltip.new(chartRoot, {})
        }));
    }

    barSeries = chart.series.push(am5xy.ColumnSeries.new(chartRoot, {
        xAxis: xAxis, yAxis: yAxis,
        valueXField: isVert ? undefined : "value",
        valueYField: isVert ? "value" : undefined,
        categoryXField: isVert ? "name" : undefined,
        categoryYField: isVert ? undefined : "name",
        tooltip: am5.Tooltip.new(chartRoot, { pointerOrientation: isVert ? "vertical" : "horizontal" })
    }));

    const isMobile = window.innerWidth <= 768;
    barSeries.columns.template.setAll({
        tooltipText: isVert ? "{categoryX}: [bold]{valueY}[/]" : "{categoryY}: [bold]{valueX}[/]",
        width: am5.percent(isMobile ? 60 : 90), strokeOpacity: 0
    });

    barSeries.columns.template.adapters.add("fill", function (fill, target) {
        if (!regionMode) return am5.color(0xc83830);
        const dataContext = target.dataItem.dataContext;
        if (dataContext && dataContext.region && regionColors[dataContext.region]) {
            return am5.color(regionColors[dataContext.region]);
        }
        return fill;
    });

    if (isVert) {
        barSeries.bullets.push(function () {
            return am5.Bullet.new(chartRoot, {
                locationY: 1,
                sprite: am5.Label.new(chartRoot, {
                    text: "{valueY}",
                    centerY: am5.p100,
                    centerX: am5.p50,
                    populateText: true,
                    dy: -5,
                    fontSize: 14,
                    fontWeight: "bold",
                    fill: am5.color(0x333333)
                })
            });
        });
    }

    barSeries.appear(1000);
    chart.appear(1000, 100);
}

function updateChart() {
    const data = [];
    const regionOrder = ["Central", "East", "South", "West"];
    const selectedByRegion = { "Central": [], "East": [], "South": [], "West": [] };

    selectedStates.forEach(id => {
        const state = stateData.find(s => s.id === id);
        if (state) {
            let val = state[activeMetric];
            if (val === undefined || val === null) val = 0;
            selectedByRegion[state.region].push({
                name: state.name, value: val, region: state.region
            });
        }
    });

    if (regionMode) {
        legend.show();
        regionOrder.forEach(region => {
            selectedByRegion[region].sort((a, b) => a.value - b.value);
            selectedByRegion[region].forEach(item => data.push(item));
        });
    } else {
        legend.hide();
        let allItems = [];
        regionOrder.forEach(region => {
            selectedByRegion[region].forEach(item => allItems.push(item));
        });
        allItems.sort((a, b) => a.value - b.value);
        allItems.forEach(item => data.push(item));
    }

    xAxis.data.setAll(data);
    yAxis.data.setAll(data);
    barSeries.data.setAll(data);
    updateChartExtras(selectedByRegion);

    // Keep table in sync whenever the chart updates
    if (currentView === 'table') refreshTable();
}

function updateChartExtras(selectedByRegion) {
    const catAxis = verticalChartMode ? xAxis : yAxis;
    catAxis.axisRanges.clear();
    const legendData = [];

    if (!regionMode) {
        legend.data.setAll([]);
        return;
    }

    for (const region in selectedByRegion) {
        const states = selectedByRegion[region];
        if (states.length > 0) {
            const lastState = states[states.length - 1].name;
            const color = am5.color(regionColors[region]);

            const rangeDataItem = catAxis.makeDataItem({ category: lastState });
            const range = catAxis.createAxisRange(rangeDataItem);

            if (verticalChartMode) {
                rangeDataItem.get("label").setAll({
                    fill: color, text: region, location: 1, fontWeight: "bold", dy: 80, rotation: 0, centerX: am5.p50
                });
                rangeDataItem.get("grid").setAll({ stroke: color, strokeOpacity: 1, location: 1 });
                rangeDataItem.get("tick").setAll({
                    stroke: color, strokeOpacity: 1, location: 1, visible: true, length: 80
                });
            } else {
                rangeDataItem.get("label").setAll({
                    fill: color, text: region, location: 1, fontWeight: "bold", dx: -130
                });
                rangeDataItem.get("grid").setAll({ stroke: color, strokeOpacity: 1, location: 1 });
                rangeDataItem.get("tick").setAll({
                    stroke: color, strokeOpacity: 1, location: 1, visible: true, length: 130
                });
            }

            legendData.push({ name: region, color: color });
        }
    }
    legend.data.setAll(legendData);
}

init();

// =========================================
// VIEW TOGGLE  (Chart ↔ Table)
// =========================================

let currentView = 'chart';

function switchView(view) {
    currentView = view;
    const chartSection = document.getElementById('chartSection');
    const tableSection = document.getElementById('tableSection');
    const btnChart = document.getElementById('btnChartView');
    const btnTable = document.getElementById('btnTableView');

    if (view === 'chart') {
        chartSection && chartSection.classList.remove('active') || (chartSection && (chartSection.style.display = ''));
        tableSection && tableSection.classList.remove('active');
        btnChart && btnChart.classList.add('active');
        btnTable && btnTable.classList.remove('active');
        // restore original comp-bottom-section display
        if (chartSection) chartSection.style.display = '';
        if (tableSection) tableSection.style.display = 'none';
    } else {
        if (chartSection) chartSection.style.display = 'none';
        if (tableSection) { tableSection.style.display = 'flex'; }
        btnChart && btnChart.classList.remove('active');
        btnTable && btnTable.classList.add('active');
        refreshTable();
    }
}

function refreshTable() {
    const rows = [];
    selectedStates.forEach(id => {
        const state = stateData.find(s => s.id === id);
        if (state) rows.push({ ...state, name: state.name });
    });
    if (typeof renderComparisonTable === 'function') {
        renderComparisonTable('compTableDiv', rows, activeMetric);
    }
}

// =========================================
// MODAL FUNCTIONS
// =========================================

function openChartModal() {
    const modal = document.getElementById("chartModal");
    if (!modal) return;

    modal.style.display = "flex";
    document.body.style.overflow = "hidden"; // Prevent background scrolling

    currentChartDiv = "chartModalDiv";
    initChart();
    updateChart();
}

function closeChartModal(event) {
    if (event && event.target !== event.currentTarget && !event.target.classList.contains('chart-modal-close')) {
        return;
    }

    const modal = document.getElementById("chartModal");
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "";

        currentChartDiv = "compChartDiv";
        initChart();
        updateChart();
    }
}
