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

let currentView = "chart";
let chartType = "bar";
let mapRoot, chartRoot;
let mapPolygonSeries, barSeries, treeSeries, radarSeries, xAxis, yAxis, legend, activeState;

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

        // verticalChartMode is handled by buttons now
        verticalChartMode = false;

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

    // Add export menu
    let exporting = am5plugins_exporting.Exporting.new(mapRoot, {
        menu: am5plugins_exporting.ExportingMenu.new(mapRoot, {
            align: "right",
            valign: "top"
        })
    });

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

        if (ev.originalEvent.ctrlKey || ev.originalEvent.metaKey || window.innerWidth <= 768) {
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

function initChart(isModal = false) {
    if (chartRoot) {
        chartRoot.dispose();
        chartRoot = null;
    }

    const containerId = isModal ? "chartModalDiv" : "compChartDiv";
    chartRoot = am5.Root.new(containerId);

    const myTheme = am5.Theme.new(chartRoot);
    myTheme.rule("HierarchyNode", ["depth0"]).setAll({ forceHidden: true });
    myTheme.rule("HierarchyNode", ["depth1"]).setAll({ forceHidden: regionMode ? true : false });

    chartRoot.setThemes([
        myTheme,
        am5themes_Animated.new(chartRoot)
    ]);

    // Add export menu
    let exporting = am5plugins_exporting.Exporting.new(chartRoot, {
        menu: am5plugins_exporting.ExportingMenu.new(chartRoot, {
            align: "right",
            valign: "bottom"
        })
    });

    if (chartType === "bar") {
        initBarChart(isModal);
    } else if (chartType === "treemap") {
        initTreeMap(isModal);
    } else if (chartType === "circular_bar") {
        initRadarChart(isModal);
    } else if (chartType === "voronoi_treemap") {
        initVoronoiTreeMap(isModal);
    }
}

function initBarChart(isModal) {
    const isMobileChart = window.innerWidth <= 768;
    const isVert = verticalChartMode;

    const chart = chartRoot.container.children.push(am5xy.XYChart.new(chartRoot, {
        panX: false, panY: false, wheelX: "none", wheelY: "none",
        layout: chartRoot.verticalLayout,
        paddingLeft: isVert ? 0 : (isMobileChart ? 40 : 160),
        paddingTop: isVert ? (isMobileChart ? 10 : 70) : 20,
        paddingBottom: isVert ? (isMobileChart ? 40 : 100) : 0
    }));

    // On mobile vertical, give the chart div enough height for the bars
    if (isMobileChart && isVert) {
        const el = document.getElementById(isModal ? "chartModalDiv" : "compChartDiv");
        if (el) el.style.minHeight = "550px";
    } else if (isMobileChart) {
        const el = document.getElementById(isModal ? "chartModalDiv" : "compChartDiv");
        if (el) el.style.minHeight = "";
    }

    legend = chart.children.push(am5.Legend.new(chartRoot, {
        nameField: "name", fillField: "color", strokeField: "color",
        centerX: am5.p50, x: am5.p50,
        layout: isMobileChart ? am5.GridLayout.new(chartRoot, { maxColumns: 2, fixedWidthGrid: true }) : chartRoot.horizontalLayout,
        clickTarget: "none",
        marginTop: 30
    }));

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

function initTreeMap(isModal) {
    const isMobileChart = window.innerWidth <= 768;
    if (isMobileChart) {
        const el = document.getElementById(isModal ? "chartModalDiv" : "compChartDiv");
        if (el) el.style.minHeight = "450px";
    }
    const container = chartRoot.container.children.push(
        am5.Container.new(chartRoot, {
            width: am5.percent(100),
            height: am5.percent(100),
            layout: chartRoot.verticalLayout
        })
    );

    treeSeries = container.children.push(
        am5hierarchy.Treemap.new(chartRoot, {
            singleBranchOnly: false,
            sort: "descending",
            valueField: "value",
            categoryField: "name",
            childDataField: "children",
            initialDepth: 2,
            nodePaddingOuter: 0,
            nodePaddingInner: 2
        })
    );

    legend = container.children.push(am5.Legend.new(chartRoot, {
        nameField: "name", fillField: "color", strokeField: "color",
        centerX: am5.p50, x: am5.p50,
        layout: isMobileChart ? am5.GridLayout.new(chartRoot, { maxColumns: 2, fixedWidthGrid: true }) : chartRoot.horizontalLayout,
        clickTarget: "none",
        marginTop: 30
    }));

    treeSeries.rectangles.template.setAll({
        strokeWidth: 2,
        stroke: am5.color(0xffffff),
        cornerRadiusTL: 4,
        cornerRadiusTR: 4,
        cornerRadiusBL: 4,
        cornerRadiusBR: 4,
        tooltipText: "{name}: [bold]{value}[/]"
    });

    treeSeries.rectangles.template.adapters.add("fill", function (fill, target) {
        if (!regionMode) return am5.color(0xc83830);
        const dataContext = target.dataItem.dataContext;
        if (dataContext && dataContext.region && regionColors[dataContext.region]) {
            return am5.color(regionColors[dataContext.region]);
        }
        return am5.color(0xc83830);
    });

    treeSeries.labels.template.setAll({
        centerY: am5.p0,
        y: 10,
        fontSize: 14,
        fontWeight: "600"
    });

    treeSeries.bullets.push(function (root, series, dataItem) {
        const isMobile = window.innerWidth <= 768;
        if (isMobile) return;

        const dataContext = dataItem.dataContext;
        if (dataContext && dataContext.abbr) {
            const container = am5.Container.new(root, {
                centerX: am5.p50,
                centerY: am5.p100,
                y: -10
            });

            container.children.push(am5.Picture.new(root, {
                width: 30,
                height: 20,
                centerX: am5.p50,
                src: `https://flagcdn.com/w40/us-${dataContext.abbr.toLowerCase()}.png`
            }));

            return am5.Bullet.new(root, {
                locationX: 0.5,
                locationY: 0.5,
                sprite: container
            });
        }
    });

    treeSeries.appear(1000, 100);
}

function initRadarChart(isModal) {
    const isMobileChart = window.innerWidth <= 768;

    const chart = chartRoot.container.children.push(am5radar.RadarChart.new(chartRoot, {
        panX: false,
        panY: false,
        wheelX: "none",
        wheelY: "none",
        startAngle: -84,
        endAngle: 264,
        innerRadius: am5.percent(40)
    }));

    // Add cursor
    const cursor = chart.set("cursor", am5radar.RadarCursor.new(chartRoot, {
        behavior: "zoomX"
    }));
    cursor.lineY.set("forceHidden", true);

    // Create axes
    let xRenderer = am5radar.AxisRendererCircular.new(chartRoot, {
        minGridDistance: 30
    });
    xRenderer.grid.template.set("forceHidden", true);

    xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(chartRoot, {
        maxDeviation: 0,
        categoryField: "name",
        renderer: xRenderer
    }));

    let yRenderer = am5radar.AxisRendererRadial.new(chartRoot, {});
    yRenderer.labels.template.set("centerX", am5.p50);

    yAxis = chart.yAxes.push(am5xy.ValueAxis.new(chartRoot, {
        maxDeviation: 0.3,
        min: 0,
        renderer: yRenderer
    }));

    // Add series
    radarSeries = chart.series.push(am5radar.RadarColumnSeries.new(chartRoot, {
        name: "Series 1",
        sequencedInterpolation: true,
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "value",
        categoryXField: "name"
    }));

    // Rounded corners for columns
    radarSeries.columns.template.setAll({
        cornerRadius: 5,
        tooltipText: "{categoryX}: [bold]{valueY}[/]"
    });

    // Color adaptation based on region
    radarSeries.columns.template.adapters.add("fill", function (fill, target) {
        if (!regionMode) return am5.color(0xc83830);
        const dataContext = target.dataItem.dataContext;
        if (dataContext && dataContext.region && regionColors[dataContext.region]) {
            return am5.color(regionColors[dataContext.region]);
        }
        return am5.color(0xc83830);
    });

    radarSeries.columns.template.adapters.add("stroke", function (stroke, target) {
        if (!regionMode) return am5.color(0xc83830);
        const dataContext = target.dataItem.dataContext;
        if (dataContext && dataContext.region && regionColors[dataContext.region]) {
            return am5.color(regionColors[dataContext.region]);
        }
        return am5.color(0xc83830);
    });

    legend = chart.children.push(am5.Legend.new(chartRoot, {
        nameField: "name", fillField: "color", strokeField: "color",
        centerX: am5.p50, x: am5.p50,
        layout: isMobileChart ? am5.GridLayout.new(chartRoot, { maxColumns: 2, fixedWidthGrid: true }) : chartRoot.horizontalLayout,
        clickTarget: "none",
        marginTop: 30
    }));

    radarSeries.appear(1000);
    chart.appear(1000, 100);
}

function updateChart() {
    if (chartType === "bar") {
        updateBarChart();
    } else if (chartType === "treemap") {
        updateTreeMap();
    } else if (chartType === "circular_bar") {
        updateRadarChart();
    } else if (chartType === "voronoi_treemap") {
        updateVoronoiTreeMap();
    }
}

function updateBarChart() {
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

    barSeries.data.setAll(data);
    if (xAxis && xAxis.get("categoryField")) xAxis.data.setAll(data);
    if (yAxis && yAxis.get("categoryField")) yAxis.data.setAll(data);
    updateChartExtras(selectedByRegion);

    // Keep table in sync whenever the chart updates
    if (currentView === 'table') refreshTable();
}

function updateTreeMap() {
    if (!treeSeries) return;

    const rootData = {
        name: "Root",
        children: []
    };

    const regions = ["Central", "East", "South", "West"];
    const regionNodes = {};

    regions.forEach(r => {
        regionNodes[r] = {
            name: r,
            region: r,
            children: []
        };
    });

    selectedStates.forEach(id => {
        const state = stateData.find(s => s.id === id);
        if (state) {
            let val = state[activeMetric] || 0;
            regionNodes[state.region].children.push({
                name: state.name,
                value: val,
                region: state.region,
                abbr: state.state_abbr
            });
        }
    });

    if (regionMode) {
        rootData.children = regions
            .filter(r => regionNodes[r].children.length > 0)
            .map(r => regionNodes[r]);
    } else {
        // Flatten the data for non-region mode
        const allItems = [];
        regions.forEach(r => {
            regionNodes[r].children.forEach(c => allItems.push(c));
        });
        rootData.children = allItems;
    }

    treeSeries.data.setAll([rootData]);

    if (legend) {
        if (regionMode) {
            legend.show();
            const legendData = [];
            regions.forEach(r => {
                if (regionNodes[r].children.length > 0) {
                    legendData.push({ name: r, color: am5.color(regionColors[r]) });
                }
            });
            legend.data.setAll(legendData);
        } else {
            legend.hide();
            legend.data.setAll([]);
        }
    }

    // Keep table in sync whenever the chart updates
    if (currentView === 'table') refreshTable();
}

function updateRadarChart() {
    if (!radarSeries) return;

    const data = [];
    const regionOrder = ["Central", "East", "South", "West"];
    const selectedByRegion = { "Central": [], "East": [], "South": [], "West": [] };

    selectedStates.forEach(id => {
        const state = stateData.find(s => s.id === id);
        if (state) {
            let val = state[activeMetric] || 0;
            selectedByRegion[state.region].push({
                name: state.name, value: val, region: state.region
            });
        }
    });

    const legendData = [];
    if (regionMode) {
        legend.show();
        regionOrder.forEach(region => {
            selectedByRegion[region].sort((a, b) => a.value - b.value);
            selectedByRegion[region].forEach(item => data.push(item));
            if (selectedByRegion[region].length > 0) {
                legendData.push({ name: region, color: am5.color(regionColors[region]) });
            }
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

    radarSeries.data.setAll(data);
    xAxis.data.setAll(data);
    legend.data.setAll(legendData);

    if (currentView === 'table') refreshTable();
}

function initVoronoiTreeMap(isModal) {
    const isMobileChart = window.innerWidth <= 768;
    const container = chartRoot.container.children.push(
        am5.Container.new(chartRoot, {
            width: am5.percent(100), height: am5.percent(100),
            layout: chartRoot.verticalLayout
        })
    );

    treeSeries = container.children.push(
        am5hierarchy.Voronoi.new(chartRoot, {
            singleBranchOnly: false,
            sort: "descending",
            valueField: "value",
            categoryField: "name",
            childDataField: "children",
            initialDepth: 2,
            colors: am5.ColorSet.new(chartRoot, {})
        })
    );

    treeSeries.polygons.template.setAll({
        strokeWidth: 2,
        stroke: am5.color(0xffffff),
        tooltipText: "{name}: [bold]{value}[/]"
    });

    treeSeries.polygons.template.adapters.add("fill", function (fill, target) {
        if (!regionMode) return am5.color(0xc83830);
        const dataContext = target.dataItem.dataContext;
        if (dataContext && dataContext.region && regionColors[dataContext.region]) {
            return am5.color(regionColors[dataContext.region]);
        }
        return am5.color(0xc83830);
    });

    treeSeries.labels.template.setAll({
        fontSize: 14, fontWeight: "600", fill: am5.color(0xffffff)
    });

    treeSeries.appear(1000, 100);
}

function updateVoronoiTreeMap() {
    if (!treeSeries) return;
    const rootData = { name: "Root", children: [] };
    const regions = ["Central", "East", "South", "West"];
    const regionNodes = {};
    regions.forEach(r => { regionNodes[r] = { name: r, region: r, children: [] }; });

    selectedStates.forEach(id => {
        const state = stateData.find(s => s.id === id);
        if (state) {
            let val = state[activeMetric] || 0;
            regionNodes[state.region].children.push({
                name: state.name, value: val, region: state.region
            });
        }
    });

    rootData.children = regions
        .filter(r => regionNodes[r].children.length > 0)
        .map(r => regionNodes[r]);

    treeSeries.data.setAll([rootData]);
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



function switchView(view) {
    currentView = view;
    const chartSection = document.getElementById('chartSection');
    const tableSection = document.getElementById('tableSection');
    const btnChart = document.getElementById('btnChartView');
    const btnTable = document.getElementById('btnTableView');
    const chartTypeToggle = document.getElementById('chartTypeToggleBar');

    if (view === 'chart') {
        if (chartSection) chartSection.style.display = '';
        if (tableSection) tableSection.style.display = 'none';
        if (chartTypeToggle) chartTypeToggle.style.display = 'flex';
        btnChart && btnChart.classList.add('active');
        btnTable && btnTable.classList.remove('active');
    } else {
        if (chartSection) chartSection.style.display = 'none';
        if (tableSection) tableSection.style.display = 'flex';
        if (chartTypeToggle) chartTypeToggle.style.display = 'none';
        btnChart && btnChart.classList.remove('active');
        btnTable && btnTable.classList.add('active');
        refreshTable();
    }
}

function switchChartType(type) {
    chartType = type.startsWith('bar') ? 'bar' : type;
    verticalChartMode = type === 'bar_vertical';

    const btnHBar = document.getElementById('btnHBarChart');
    const btnVBar = document.getElementById('btnVBarChart');
    const btnTree = document.getElementById('btnTreeMap');
    const btnCircular = document.getElementById('btnCircularBarChart');

    btnHBar && btnHBar.classList.remove('active');
    btnVBar && btnVBar.classList.remove('active');
    btnTree && btnTree.classList.remove('active');
    btnCircular && btnCircular.classList.remove('active');

    if (type === 'bar') {
        btnHBar && btnHBar.classList.add('active');
    } else if (type === 'bar_vertical') {
        btnVBar && btnVBar.classList.add('active');
    } else if (type === 'treemap') {
        btnTree && btnTree.classList.add('active');
    } else {
        btnCircular && btnCircular.classList.add('active');
    }

    initChart(currentChartDiv === "chartModalDiv");
    updateChart();
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
    initChart(true);
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
        initChart(false);
        updateChart();
    }
}
