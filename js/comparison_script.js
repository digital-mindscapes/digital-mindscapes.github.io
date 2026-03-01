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
        initMap();
        initChart();

        document.getElementById("clearSelection").addEventListener("click", clearSelection);
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
        };
    });
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

function initChart() {
    chartRoot = am5.Root.new("compChartDiv");
    chartRoot.setThemes([am5themes_Animated.new(chartRoot)]);

    const chart = chartRoot.container.children.push(am5xy.XYChart.new(chartRoot, {
        panX: false, panY: false, wheelX: "none", wheelY: "none",
        layout: chartRoot.horizontalLayout, paddingLeft: 160
    }));

    legend = chart.children.push(am5.Legend.new(chartRoot, {
        nameField: "name", fillField: "color", strokeField: "color",
        marginLeft: 20, y: 20, layout: chartRoot.verticalLayout, clickTarget: "none"
    }));

    yAxis = chart.yAxes.push(am5xy.CategoryAxis.new(chartRoot, {
        categoryField: "name",
        renderer: am5xy.AxisRendererY.new(chartRoot, { minGridDistance: 10, minorGridEnabled: true }),
        tooltip: am5.Tooltip.new(chartRoot, {})
    }));

    yAxis.get("renderer").labels.template.setAll({ fontSize: 12, location: 0.5 });

    xAxis = chart.xAxes.push(am5xy.ValueAxis.new(chartRoot, {
        renderer: am5xy.AxisRendererX.new(chartRoot, {}),
        tooltip: am5.Tooltip.new(chartRoot, {})
    }));

    barSeries = chart.series.push(am5xy.ColumnSeries.new(chartRoot, {
        xAxis: xAxis, yAxis: yAxis,
        valueXField: "value", categoryYField: "name",
        tooltip: am5.Tooltip.new(chartRoot, { pointerOrientation: "horizontal" })
    }));

    barSeries.columns.template.setAll({
        tooltipText: "{categoryY}: [bold]{valueX}[/]",
        width: am5.percent(90), strokeOpacity: 0
    });

    barSeries.columns.template.adapters.add("fill", function (fill, target) {
        const dataContext = target.dataItem.dataContext;
        if (dataContext && dataContext.region && regionColors[dataContext.region]) {
            return am5.color(regionColors[dataContext.region]);
        }
        return fill;
    });

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

    regionOrder.forEach(region => {
        selectedByRegion[region].sort((a, b) => a.value - b.value);
        selectedByRegion[region].forEach(item => data.push(item));
    });

    yAxis.data.setAll(data);
    barSeries.data.setAll(data);
    updateChartExtras(selectedByRegion);
}

function updateChartExtras(selectedByRegion) {
    yAxis.axisRanges.clear();
    const legendData = [];

    for (const region in selectedByRegion) {
        const states = selectedByRegion[region];
        if (states.length > 0) {
            const lastState = states[states.length - 1].name;
            const color = am5.color(regionColors[region]);

            const rangeDataItem = yAxis.makeDataItem({ category: lastState });
            const range = yAxis.createAxisRange(rangeDataItem);

            rangeDataItem.get("label").setAll({
                fill: color, text: region, location: 1, fontWeight: "bold", dx: -130
            });
            rangeDataItem.get("grid").setAll({ stroke: color, strokeOpacity: 1, location: 1 });
            rangeDataItem.get("tick").setAll({
                stroke: color, strokeOpacity: 1, location: 1, visible: true, length: 130
            });

            legendData.push({ name: region, color: color });
        }
    }
    legend.data.setAll(legendData);
}

init();
