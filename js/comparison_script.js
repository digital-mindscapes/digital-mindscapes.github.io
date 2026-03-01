// =========================================
// DATA AND CONFIG
// =========================================

const metrics = [
    "ups", "downs", "score", "num_comments", "city_population", "population_16plus", "employed_count", "unemployed_count",
    "employment_rate", "median_household_income", "mean_household_income", "per_capita_income",
    "poverty_rate", "health_insurance_coverage_rate", "private_insurance_rate", "public_insurance_rate",
    "uninsured_rate", "depression_prevalence", "mental_health_issues_prevalence", "cognitive_difficulties_prevalence",
    "sleep_issues_prevalence", "high_blood_pressure_prevalence", "diabetes_prevalence", "obesity_prevalence",
    "stroke_prevalence", "high_cholesterol_prevalence", "drove_alone_rate", "public_transit_rate",
    "mean_commute_time", "employed_private_insurance_rate", "employed_public_insurance_rate",
    "employed_uninsured_rate", "not_in_labor_force_insured_rate", "is_rural", "labor_force_participation",
    "healthcare_education_workforce"
];

let stateData = [];
let selectedStates = new Set(); // Set of State IDs (e.g., "US-WI")
let activeMetric = "ups";

const regionMapping = {
    "Central": ["ND", "SD", "KS", "IA", "NE", "OK", "MO", "MN", "WI", "IN", "MI", "IL", "TX"],
    "East": ["WV", "ME", "DC", "NH", "VT", "CT", "RI", "MD", "DE", "MA", "NJ", "OH", "PA", "NY"],
    "South": ["SC", "LA", "MS", "AR", "AL", "TN", "KY", "GA", "NC", "VA", "FL"],
    "West": ["WY", "ID", "NM", "MT", "UT", "NV", "OR", "CO", "AZ", "WA", "CA", "AK", "HI"]
};

const regionColors = {
    "Central": "#0ea5e9", // Vibrant Blue
    "East": "#10b981",    // Vibrant Green
    "South": "#f59e0b",   // Vibrant Orange
    "West": "#a855f7"     // Vibrant Purple
};

function getRegion(stateAbbr) {
    for (const region in regionMapping) {
        if (regionMapping[region].includes(stateAbbr)) return region;
    }
    return "West"; // Default
}

let mapRoot, chartRoot;
let mapPolygonSeries, barSeries, xAxis, yAxis, legend;

// =========================================
// INITIALIZATION
// =========================================

async function init() {
    try {
        const response = await fetch("data/state_data_processed.json");
        const data = await response.json();

        // Map IDs to amCharts format (US.WI -> US-WI)
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

        // Set initial active state
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

    // Hover state
    mapPolygonSeries.mapPolygons.template.states.create("hover", {
        fill: am5.color(0xd3a29f)
    });

    // Active state (selected)
    mapPolygonSeries.mapPolygons.template.states.create("active", {
        fill: am5.color(0xc83830)
    });

    // Click behavior
    mapPolygonSeries.mapPolygons.template.events.on("click", (ev) => {
        const dataItem = ev.target.dataItem;
        const id = dataItem.get("id");

        // Check for Ctrl key (or just allow multi-select by default in comparison mode?)
        // The user specifically asked for "control+click"
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

    // Sync map state
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
        panX: false,
        panY: false,
        wheelX: "none",
        wheelY: "none",
        layout: chartRoot.horizontalLayout,
        paddingLeft: 160
    }));

    // Add legend
    legend = chart.children.push(am5.Legend.new(chartRoot, {
        nameField: "name",
        fillField: "color",
        strokeField: "color",
        marginLeft: 20,
        y: 20,
        layout: chartRoot.verticalLayout,
        clickTarget: "none"
    }));

    // Create axes
    yAxis = chart.yAxes.push(am5xy.CategoryAxis.new(chartRoot, {
        categoryField: "name",
        renderer: am5xy.AxisRendererY.new(chartRoot, {
            minGridDistance: 10,
            minorGridEnabled: true
        }),
        tooltip: am5.Tooltip.new(chartRoot, {})
    }));

    yAxis.get("renderer").labels.template.setAll({
        fontSize: 12,
        location: 0.5
    });

    xAxis = chart.xAxes.push(am5xy.ValueAxis.new(chartRoot, {
        renderer: am5xy.AxisRendererX.new(chartRoot, {}),
        tooltip: am5.Tooltip.new(chartRoot, {})
    }));

    // Create series
    barSeries = chart.series.push(am5xy.ColumnSeries.new(chartRoot, {
        xAxis: xAxis,
        yAxis: yAxis,
        valueXField: "value",
        categoryYField: "name",
        tooltip: am5.Tooltip.new(chartRoot, {
            pointerOrientation: "horizontal"
        })
    }));

    barSeries.columns.template.setAll({
        tooltipText: "{categoryY}: [bold]{valueX}[/]",
        width: am5.percent(90),
        strokeOpacity: 0
    });

    barSeries.columns.template.adapters.add("fill", function (fill, target) {
        const dataContext = target.dataItem.dataContext;
        if (dataContext && dataContext.region && regionColors[dataContext.region]) {
            return am5.color(regionColors[dataContext.region]);
        }
        return fill;
    });

    // Make stuff animate on load
    barSeries.appear(1000);
    chart.appear(1000, 100);
}

function updateChart() {
    const data = [];
    const regionOrder = ["Central", "East", "South", "West"];

    // Group selected states by region
    const selectedByRegion = { "Central": [], "East": [], "South": [], "West": [] };

    selectedStates.forEach(id => {
        const state = stateData.find(s => s.id === id);
        if (state) {
            let val = state[activeMetric];
            if (val === undefined) val = generateRandomValueForComparison(state.id, activeMetric);
            selectedByRegion[state.region].push({
                name: state.name,
                value: val,
                region: state.region
            });
        }
    });

    // Flatten data in region order and sort within regions by value (optional, but looks good)
    regionOrder.forEach(region => {
        selectedByRegion[region].sort((a, b) => a.value - b.value);
        selectedByRegion[region].forEach(item => data.push(item));
    });

    yAxis.data.setAll(data);
    barSeries.data.setAll(data);

    // Update Legend and Axis Ranges
    updateChartExtras(selectedByRegion);
}

function updateChartExtras(selectedByRegion) {
    // Clear existing axis ranges
    yAxis.axisRanges.clear();
    const legendData = [];

    for (const region in selectedByRegion) {
        const states = selectedByRegion[region];
        if (states.length > 0) {
            const lastState = states[states.length - 1].name;
            const color = am5.color(regionColors[region]);

            // Create Axis Range (Brackets)
            const rangeDataItem = yAxis.makeDataItem({ category: lastState });
            const range = yAxis.createAxisRange(rangeDataItem);

            rangeDataItem.get("label").setAll({
                fill: color,
                text: region,
                location: 1,
                fontWeight: "bold",
                dx: -130
            });

            rangeDataItem.get("grid").setAll({
                stroke: color,
                strokeOpacity: 1,
                location: 1
            });

            rangeDataItem.get("tick").setAll({
                stroke: color,
                strokeOpacity: 1,
                location: 1,
                visible: true,
                length: 130
            });

            legendData.push({ name: region, color: color });
        }
    }
    legend.data.setAll(legendData);
}

function generateRandomValueForComparison(stateId, metric) {
    let hash = 0;
    const str = stateId + metric;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    const seed = Math.abs(hash);

    if (metric.includes("rate") || metric.includes("prevalence")) {
        return (seed % 100) + (seed % 10) / 10;
    } else if (metric.includes("income")) {
        return (seed % 100) * 1000 + (seed % 1000);
    } else if (metric.includes("time")) {
        return 10 + (seed % 50);
    } else {
        return seed % 100000;
    }
}

// Start context
init();
