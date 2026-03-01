// =========================================
// MULTI-METRIC BUBBLE CHART LOGIC (amCharts 5)
// =========================================

let stateData = [];
let selectedStates = new Set(["US-WI", "US-IL", "US-MN", "US-IA"]); // Defaults
let selectedSlots = {
    x: "employed_count",
    y: "ups",
    size: "city_population"
};
let activeSlot = "x";

// Region Mapping from user reference
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
let mapPolygonSeries, xAxis, yAxis, series, xAxisLabel, yAxisLabel, legend;

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
        initSlotListeners();
        initMap();
        initChart();
        updateSlotUI();

        document.getElementById("clearSelection").addEventListener("click", clearAllSlots);
    } catch (err) {
        console.error("Failed to initialize:", err);
    }
}

function initMetricCardListeners() {
    const cards = document.querySelectorAll(".metric-card");
    cards.forEach(card => {
        const m = card.getAttribute("data-metric");
        if (!m) return;

        card.addEventListener("click", function () {
            assignToNextAvailableSlot(m);
        });
    });
}

function initSlotListeners() {
    document.querySelectorAll(".slot").forEach(slot => {
        slot.addEventListener("click", () => {
            activeSlot = slot.getAttribute("data-slot");
            updateSlotUI();
        });
        slot.style.cursor = "pointer";
    });
}

function assignToNextAvailableSlot(metric) {
    selectedSlots[activeSlot] = metric;

    // Auto-advance to next slot for better UX
    const slots = ["x", "y", "size"];
    const currentIndex = slots.indexOf(activeSlot);
    activeSlot = slots[(currentIndex + 1) % slots.length];

    updateSlotUI();
    updateChart();
}

function updateSlotUI() {
    const slots = ["x", "y", "size"];
    slots.forEach(s => {
        const slotEl = document.querySelector(`.slot[data-slot="${s}"]`);
        const valEl = slotEl.querySelector(".slot-value");

        // Highlight active slot
        slotEl.style.backgroundColor = (s === activeSlot) ? "rgba(200, 56, 48, 0.1)" : "transparent";
        slotEl.style.borderRadius = "8px";

        if (valEl) {
            const metric = selectedSlots[s];
            valEl.innerText = metric ? metric.replace(/_/g, " ").toUpperCase() : "Select metric...";
        }
    });

    // Mark active cards
    document.querySelectorAll(".metric-card").forEach(card => {
        const m = card.getAttribute("data-metric");
        card.classList.remove("selected");
        if (Object.values(selectedSlots).includes(m)) {
            card.classList.add("selected");
        }
    });
}

function clearAllSlots() {
    selectedSlots = { x: null, y: null, size: null };
    selectedStates.clear();
    mapPolygonSeries.mapPolygons.each((polygon) => {
        polygon.set("active", false);
    });
    updateSlotUI();
    updateChart();
}

// Map Logic (State Selector)
function initMap() {
    mapRoot = am5.Root.new("multiMapDiv");
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
        const id = ev.target.dataItem.get("id");
        toggleStateSelection(id);
    });

    mapPolygonSeries.data.setAll(stateData);

    // Set initial active states
    mapPolygonSeries.events.on("datavalidated", () => {
        mapPolygonSeries.mapPolygons.each((polygon) => {
            const pId = polygon.dataItem.get("id");
            if (selectedStates.has(pId)) polygon.set("active", true);
        });
    });
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

// Chart Logic (Bubble)
let circleTemplate;

function initChart() {
    chartRoot = am5.Root.new("bubbleChartDiv");
    chartRoot.setThemes([am5themes_Animated.new(chartRoot)]);

    const chart = chartRoot.container.children.push(am5xy.XYChart.new(chartRoot, {
        panX: true,
        panY: true,
        wheelY: "zoomXY",
        pinchZoomX: true,
        pinchZoomY: true,
        layout: chartRoot.verticalLayout
    }));

    // Add Legend
    legend = chart.children.push(am5.Legend.new(chartRoot, {
        centerX: am5.p50,
        x: am5.p50,
        layout: chartRoot.horizontalLayout,
        nameField: "name",
        fillField: "color",
        strokeField: "color",
        paddingTop: 15,
        paddingBottom: 15,
        clickTarget: "none"
    }));

    legend.data.setAll([
        { name: "Central", color: am5.color(regionColors["Central"]) },
        { name: "East", color: am5.color(regionColors["East"]) },
        { name: "South", color: am5.color(regionColors["South"]) },
        { name: "West", color: am5.color(regionColors["West"]) }
    ]);

    xAxis = chart.xAxes.push(am5xy.ValueAxis.new(chartRoot, {
        extraMax: 0.1,
        extraMin: 0.1,
        renderer: am5xy.AxisRendererX.new(chartRoot, { minGridDistance: 50 }),
        tooltip: am5.Tooltip.new(chartRoot, {})
    }));

    yAxis = chart.yAxes.push(am5xy.ValueAxis.new(chartRoot, {
        extraMax: 0.1,
        extraMin: 0.1,
        renderer: am5xy.AxisRendererY.new(chartRoot, {}),
        tooltip: am5.Tooltip.new(chartRoot, {})
    }));

    xAxisLabel = am5.Label.new(chartRoot, {
        text: "X Axis",
        x: am5.p50,
        centerX: am5.p50,
        fontWeight: "bold"
    });
    xAxis.children.push(xAxisLabel);

    yAxisLabel = am5.Label.new(chartRoot, {
        rotation: -90,
        text: "Y Axis",
        y: am5.p50,
        centerX: am5.p50,
        fontWeight: "bold"
    });
    yAxis.children.unshift(yAxisLabel);

    series = chart.series.push(am5xy.LineSeries.new(chartRoot, {
        calculateAggregates: true,
        minBulletDistance: 0,
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "y",
        valueXField: "x",
        valueField: "size",
        seriesTooltipTarget: "bullet",
        tooltip: am5.Tooltip.new(chartRoot, {
            pointerOrientation: "horizontal",
            labelText: "[bold]{title}[/]\nRegion: {region}\nX: {valueX}\nY: {valueY}\nSize: {value}"
        })
    }));

    series.strokes.template.set("visible", false);

    // Bullet (Bubble)
    circleTemplate = am5.Template.new({});

    // Adapter for Region Color
    circleTemplate.adapters.add("fill", function (fill, target) {
        const dataContext = target.dataItem.dataContext;
        if (dataContext && dataContext.region && regionColors[dataContext.region]) {
            return am5.color(regionColors[dataContext.region]);
        }
        return fill;
    });

    series.bullets.push(function () {
        return am5.Bullet.new(chartRoot, {
            sprite: am5.Circle.new(chartRoot, {
                radius: 5,
                fill: am5.color(0xc83830), // Default fill
                fillOpacity: 0.7,
                stroke: am5.color(0xffffff),
                strokeWidth: 2
            }, circleTemplate)
        });
    });

    // Heat Rules for Size
    series.set("heatRules", [{
        target: circleTemplate,
        min: 10,
        max: 80,
        dataField: "value",
        key: "radius"
    }]);

    chart.set("cursor", am5xy.XYCursor.new(chartRoot, {
        xAxis: xAxis,
        yAxis: yAxis,
        snapToSeries: [series]
    }));

    updateChart();
    series.appear(1000);
    chart.appear(1000, 100);
}

function updateChart() {
    if (!selectedSlots.x || !selectedSlots.y) {
        series.data.setAll([]);
        return;
    }

    if (xAxisLabel) xAxisLabel.set("text", selectedSlots.x.replace(/_/g, " ").toUpperCase());
    if (yAxisLabel) yAxisLabel.set("text", selectedSlots.y.replace(/_/g, " ").toUpperCase());

    const chartData = [];

    selectedStates.forEach(id => {
        const state = stateData.find(s => s.id === id);
        if (state) {
            const getVal = (m) => {
                if (!m) return 0;
                let v = state[m];
                return (v !== undefined && typeof v === 'number') ? v : generateRandomValue(state.id, m);
            };

            const xVal = getVal(selectedSlots.x);
            const yVal = getVal(selectedSlots.y);
            const sizeVal = getVal(selectedSlots.size);

            chartData.push({
                title: state.name,
                region: state.region,
                x: xVal,
                y: yVal,
                size: Math.max(0.1, sizeVal || 10)
            });
        }
    });

    series.data.setAll(chartData);
}

function generateRandomValue(stateId, metric) {
    // Seeded random based on stateId and metric name
    let hash = 0;
    const str = stateId + metric;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    const seed = Math.abs(hash);

    if (metric.includes("income") || metric.includes("sales")) return (seed % 80000) + 20000;
    if (metric.includes("population")) return (seed % 1000000) + 100000;
    if (metric.includes("rate") || metric.includes("prevalence")) return (seed % 40);
    return (seed % 1000);
}

init();
