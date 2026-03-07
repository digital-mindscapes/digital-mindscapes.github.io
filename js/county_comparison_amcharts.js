// =========================================
// COUNTY COMPARISON MODE — ALL ACS + PLACES Data (amCharts 5)
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

const metricLabels = {
    "pct_unemployment_rate": "Unemployment Rate",
    "pct_in_labor_force": "Labor Force %",
    "pct_natural_resources_construction": "Construction Jobs",
    "pct_graduate_professional_degree": "Graduate Degree",
    "depression_prevalence": "Depression",
    "obesity_prevalence": "Obesity",
    "diabetes_prevalence": "Diabetes",
    "arthritis_prevalence": "Arthritis",
    "asthma_prevalence": "Asthma",
    "high_blood_pressure_prevalence": "High Blood Pressure",
    "high_cholesterol_prevalence": "High Cholesterol",
    "coronary_heart_disease_prevalence": "Heart Disease",
    "stroke_prevalence": "Stroke",
    "cancer_prevalence": "Cancer",
    "copd_prevalence": "COPD",
    "mental_health_issues_prevalence": "Mental Distress",
    "physical_health_issues_prevalence": "Physical Distress",
    "general_health_prevalence": "Fair/Poor Health",
    "smoking_prevalence": "Smoking",
    "binge_drinking_prevalence": "Binge Drinking",
    "physical_inactivity_prevalence": "Physical Inactivity",
    "checkup_prevalence": "Annual Checkup",
    "cholesterol_screening_prevalence": "Cholesterol Screen",
    "bp_medication_prevalence": "BP Medication",
    "access2_prevalence": "Lack Ins. (18-64)",
    "disability_prevalence": "Any Disability",
    "cognitive_difficulties_prevalence": "Cognitive",
    "mobility_difficulty_prevalence": "Mobility",
    "hearing_disability_prevalence": "Hearing",
    "vision_difficulty_prevalence": "Vision",
    "self_care_difficulty_prevalence": "Self-Care",
    "independent_living_difficulty_prevalence": "Indep. Living",
    "loneliness_prevalence": "Social Isolation",
    "emotional_support_prevalence": "Lack Emot. Support",
    "food_insecurity_prevalence": "Food Insecurity",
    "food_stamp_prevalence": "Food Stamps",
    "housing_insecurity_prevalence": "Housing Insecurity",
    "utility_shutoff_prevalence": "Utility Threat",
    "lack_transportation_prevalence": "Transport Barriers",
    "total_population_sum": "Population",
    "average_household_size": "Household Size",
    "average_family_size": "Family Size",
    "pct_speak_english_less_than_very_well": "Limited English",
    "pct_households_1plus_people_65plus": "HH w/ Seniors",
    "households_with_broadband_sum": "Broadband HH"
};


let allCountyData = [];
let activeMetric = "pct_unemployment_rate";
let heatmapMode = true;
let regionMode = false;
let verticalChartMode = false;
let selectedCounties = new Set(); // Stores amCharts ids (e.g. US-AL-001)
let countyDataLookup = {}; // Stores amCharts ids mapping to county data

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
    if (!stateAbbr) return "West";
    for (const region in regionMapping) {
        if (regionMapping[region].includes(stateAbbr.toUpperCase())) return region;
    }
    return "West";
}

let mapRoot, chartRoot;
let mapPolygonSeries, barSeries, xAxis, yAxis, legend, activeState;

// =========================================
// DATA LOADING
// =========================================

async function loadAndMergeData() {
    try {
        const [acsRes, placesRes] = await Promise.all([
            fetch("data/ACS Data/county_acs_flat.json"),
            fetch("data/PLACES Data/county_places_flat.json")
        ]);
        const acsData = await acsRes.json();
        const placesData = await placesRes.json();

        const placesLookup = {};
        placesData.forEach(d => {
            if (d.state_abbr && d.name) {
                const norm = normalizeCountyName(d.name);
                placesLookup[d.state_abbr.toUpperCase() + "_" + norm] = d;
            } else if (d.id) {
                placesLookup[d.id] = d; // Fallback to id
            }
        });

        return acsData.map(acs => {
            let places = {};
            if (acs.state_abbr && acs.name) {
                const norm = normalizeCountyName(acs.name);
                places = placesLookup[acs.state_abbr.toUpperCase() + "_" + norm] || placesLookup[acs.id] || {};
            } else {
                places = placesLookup[acs.id] || {};
            }

            // Retain acs fields like id, name, etc. prioritizing acs metadata
            return { ...acs, ...places, id: acs.id, name: acs.name, state_abbr: acs.state_abbr, state_name: acs.state_name };
        });
    } catch (e) {
        console.error("Error loading data:", e);
        return [];
    }
}

// Helper to normalize names for matching against amCharts properties
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

    // Remove all non-alphanumeric characters to robustly match "DeKalb" vs "De Kalb", "O'Brien" vs "OBrien"
    return n.replace(/[^a-z0-9]/g, "");
}

// =========================================
// INITIALIZATION
// =========================================

async function init() {
    try {
        document.getElementById("chartdiv").innerHTML = '<div id="mapLoading" style="text-align:center;padding:80px;color:#868e96;font-weight:600;">Loading map data...</div>';

        allCountyData = await loadAndMergeData();
        console.log("County data loaded:", allCountyData.length, "counties");

        // Clear loading message by empty string so amCharts can attach
        document.getElementById("chartdiv").innerHTML = '';

        initMetricCardListeners();
        initMobileMetricDropdown();

        // Initialize empty containers first
        initMap();
        initChart();
        updateMapData();

        const clearBtn = document.getElementById("clearSelection");
        if (clearBtn) {
            clearBtn.addEventListener("click", clearSelection);
        }

        const hToggle = document.getElementById("heatmapToggle");
        if (hToggle) {
            hToggle.addEventListener("change", (e) => {
                heatmapMode = e.target.checked;

                if (heatmapMode) {
                    mapPolygonSeries.set("heatRules", [{
                        target: mapPolygonSeries.mapPolygons.template,
                        dataField: "value",
                        min: am5.color(0xF1EEF6),
                        max: am5.color(0x500007),
                        key: "fill"
                    }]);
                } else {
                    mapPolygonSeries.set("heatRules", []);
                }

                if (activeState) {
                    if (heatmapMode) {
                        activeState.set("fill", undefined);
                    } else {
                        activeState.set("fill", am5.color(0xc83830));
                    }
                }
                updateMapData();
                mapPolygonSeries.mapPolygons.each((polygon) => {
                    if (polygon.get("active")) {
                        polygon.set("active", false);
                        polygon.set("active", true);
                    }
                });
            });
        }

        const rToggle = document.getElementById("regionToggle");
        if (rToggle) {
            regionMode = rToggle.checked;
            window.tableGroupMode = regionMode;
            rToggle.addEventListener("change", (e) => {
                regionMode = e.target.checked;
                window.tableGroupMode = regionMode;
                if (regionMode) {
                    window.tableGroupStateMode = false;
                    const sToggle = document.getElementById("stateGroupToggle");
                    if (sToggle) sToggle.checked = false;
                }
                initChart();
                updateChart();
                mapPolygonSeries.mapPolygons.each((polygon) => {
                    if (polygon.get("active")) {
                        polygon.set("active", false);
                        polygon.set("active", true);
                    } else {
                        polygon.markDirtyKey("fill");
                    }
                });
            });
        }

        const sToggle = document.getElementById("stateGroupToggle");
        if (sToggle) {
            window.tableGroupStateMode = sToggle.checked;
            sToggle.addEventListener("change", (e) => {
                window.tableGroupStateMode = e.target.checked;
                if (window.tableGroupStateMode) {
                    window.tableGroupMode = false;
                    regionMode = false;
                    if (rToggle) rToggle.checked = false;
                }
                updateChart();
                if (currentView === 'table') refreshTable();
            });
        }

        verticalChartMode = false;

        const ruccGroupToggle = document.getElementById("ruccGroupToggle");
        if (ruccGroupToggle) {
            ruccGroupMode = ruccGroupToggle.checked;
            ruccGroupToggle.addEventListener("change", (e) => {
                ruccGroupMode = e.target.checked;
                if (ruccGroupMode && regionMode) {
                    document.getElementById("regionToggle").checked = false;
                    regionMode = false;
                }
                updateChart();
            });
        }

        const ruccFilterSelect = document.getElementById("ruccFilterSelect");
        if (ruccFilterSelect) {
            ruccFilter = ruccFilterSelect.value;
            ruccFilterSelect.addEventListener("change", (e) => {
                ruccFilter = e.target.value;
                updateMapData();
                updateChart();
            });
        }

    } catch (err) {
        console.error("Failed to initialize county comparison:", err);
    }
}

function clearSelection() {
    selectedCounties.clear();
    if (mapPolygonSeries) {
        mapPolygonSeries.mapPolygons.each(p => {
            p.set("active", false);
        });
    }
    updateChart();
}

function updateMapData() {
    if (!mapPolygonSeries) return;

    const lookup = {};
    allCountyData.forEach(d => {
        if (d.state_abbr) {
            const norm = normalizeCountyName(d.name);
            lookup[d.state_abbr.toUpperCase() + "_" + norm] = d;
        }
    });

    const mapData = [];
    const geoFeatures = am5geodata_region_usa_usaCountiesLow.features;

    geoFeatures.forEach(feature => {
        const pId = feature.id;
        if (!pId) return;

        let stateAbbr = "";
        if (feature.properties && feature.properties.STATE) {
            stateAbbr = feature.properties.STATE;
        } else {
            const parts = pId.split("-");
            if (parts.length >= 3) {
                stateAbbr = parts[1];
            } else {
                return;
            }
        }

        const name = feature.properties.name;
        const norm = normalizeCountyName(name);

        const county = lookup[stateAbbr + "_" + norm];

        const region = getRegion(stateAbbr);

        // Build a full state name lookup to ensure group-by-state always shows full names
        const stateNameMap = {
            "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
            "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
            "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
            "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
            "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
            "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
            "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
            "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
            "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
            "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
            "DC": "District of Columbia"
        };
        const resolvedStateName = (county && county.state_name) || stateNameMap[stateAbbr.toUpperCase()] || stateAbbr;

        countyDataLookup[pId] = county
            ? { ...county, region, state_name: resolvedStateName, state_abbr: county.state_abbr || stateAbbr }
            : { name: name, state: stateAbbr, state_abbr: stateAbbr, state_name: resolvedStateName, region: region };

        let val = null;
        if (county && county[activeMetric] !== undefined && county[activeMetric] !== null) {
            val = county[activeMetric];
        }

        mapData.push({
            id: pId,
            value: val,
            name: name,
            state: stateAbbr,
            region: region,
            countyData: county || null
        });
    });

    mapPolygonSeries.data.setAll(mapData);
    updateChart();
}

// =========================================
// MAP RENDERING (amCharts 5)
// =========================================

function initMap() {
    mapRoot = am5.Root.new("chartdiv");
    mapRoot.setThemes([am5themes_Animated.new(mapRoot)]);

    // Add export menu
    let exporting = am5plugins_exporting.Exporting.new(mapRoot, {
        menu: am5plugins_exporting.ExportingMenu.new(mapRoot, {
            align: "right",
            valign: "top"
        })
    });

    const mapChart = mapRoot.container.children.push(am5map.MapChart.new(mapRoot, {
        panX: "translateX",
        panY: "translateY",
        wheelY: "zoom",
        projection: am5map.geoAlbersUsa()
    }));

    // Hook into global custom map controls
    addCustomMapControls("chartdiv", mapChart, true);

    mapPolygonSeries = mapChart.series.push(am5map.MapPolygonSeries.new(mapRoot, {
        geoJSON: am5geodata_region_usa_usaCountiesLow,
        valueField: "value",
        calculateAggregates: true
    }));

    mapPolygonSeries.set("heatRules", [{
        target: mapPolygonSeries.mapPolygons.template,
        dataField: "value",
        min: am5.color(0xF1EEF6),
        max: am5.color(0x500007),
        key: "fill"
    }]);

    mapPolygonSeries.mapPolygons.template.setAll({
        fill: am5.color(0xd9cec8),
        tooltipText: "{name}: [bold]{value}[/]",
        stroke: am5.color(0xffffff),
        strokeWidth: 0.5,
        interactive: true,
        cursorOverStyle: "pointer"
    });

    mapPolygonSeries.mapPolygons.template.adapters.add("fill", function (fill, target) {
        if (!target.dataItem) {
            return am5.color(0xe0e0e0);
        }
        let value = target.dataItem.get("value");
        if (heatmapMode && (value === null || value === undefined)) {
            return am5.color(0xe0e0e0); // Gray for missing data
        }
        return fill;
    });

    // Adapters for tooltip formatting 
    mapPolygonSeries.mapPolygons.template.adapters.add("tooltipText", function (text, target) {
        const dataItem = target.dataItem;
        if (dataItem) {
            const val = dataItem.get("value");
            if (val === null || val === undefined) return "{name}: N/A";
            const isPercent = activeMetric.startsWith("pct_") || activeMetric.includes("prevalence");
            return "{name}: [bold]{value}" + (isPercent ? "%" : "") + "[/]";
        }
        return text;
    });

    mapPolygonSeries.mapPolygons.template.states.create("hover", {
        fill: am5.color(0xd3a29f),
        stroke: am5.color(0x333333),
        strokeWidth: 1
    });

    activeState = mapPolygonSeries.mapPolygons.template.states.create("active", {
        stroke: am5.color(0x000000),
        strokeWidth: 2
    });



    mapPolygonSeries.mapPolygons.template.adapters.add("fill", function (fill, target) {
        if (!target.dataItem) {
            return am5.color(0xe0e0e0);
        }
        if (target.get("active")) {
            const dataContext = target.dataItem.dataContext;
            if (regionMode && dataContext && dataContext.region && regionColors[dataContext.region]) {
                return am5.color(regionColors[dataContext.region]);
            }
            return am5.color(0xc83830);
        }
        let value = target.dataItem.get("value");
        if (heatmapMode && (value === null || value === undefined)) {
            return am5.color(0xe0e0e0); // Gray for missing data
        }
        return fill;
    });

    mapPolygonSeries.mapPolygons.template.events.on("click", function (ev) {
        const polygon = ev.target;
        const dataItem = polygon.dataItem;
        if (!dataItem) return;

        const id = dataItem.get("id");
        if (!id) return;

        console.log("Clicked county:", id, dataItem.dataContext);

        if (ev.originalEvent.ctrlKey || ev.originalEvent.metaKey || window.innerWidth <= 768) {
            if (selectedCounties.has(id)) {
                selectedCounties.delete(id);
                polygon.set("active", false);
            } else {
                selectedCounties.add(id);
                polygon.set("active", true);
            }
        } else {
            selectedCounties.clear();
            mapPolygonSeries.mapPolygons.each(p => p.set("active", false));

            selectedCounties.add(id);
            polygon.set("active", true);
        }

        console.log("Selected counties:", [...selectedCounties]);
        updateChart();
    });

    // Set initial bounds to US to avoid errors before first state load
    mapChart.appear(1000, 100);
}

// =========================================
// BAR CHART (amCharts 5)
// =========================================

let currentChartDiv = "compChartDiv";

function initChart() {
    if (chartRoot) {
        chartRoot.dispose();
    }
    chartRoot = am5.Root.new(currentChartDiv);
    chartRoot.setThemes([am5themes_Animated.new(chartRoot)]);

    // Add export menu
    let exporting = am5plugins_exporting.Exporting.new(chartRoot, {
        menu: am5plugins_exporting.ExportingMenu.new(chartRoot, {
            align: "right",
            valign: "bottom"
        })
    });

    const isVert = verticalChartMode;
    const isMobileChart = window.innerWidth <= 768;

    const chart = chartRoot.container.children.push(am5xy.XYChart.new(chartRoot, {
        panX: false,
        panY: false,
        wheelX: "none",
        wheelY: "none",
        layout: chartRoot.verticalLayout,
        paddingLeft: isVert ? 0 : (isMobileChart ? 40 : 160),
        paddingTop: isVert ? (isMobileChart ? 10 : 70) : 30,
        paddingBottom: isVert ? (isMobileChart ? 40 : 100) : 0
    }));

    // On mobile, ensure the chart div is tall enough for vertical bars
    if (isMobileChart && isVert) {
        const el = document.getElementById("compChartDiv");
        if (el) el.style.minHeight = "550px";
    } else if (isMobileChart) {
        const el = document.getElementById("compChartDiv");
        if (el) el.style.minHeight = "";
    }

    // Add Label for Metric
    chart.children.unshift(am5.Label.new(chartRoot, {
        text: "Selected Counties Comparison",
        fontSize: 14,
        fontWeight: "bold",
        paddingBottom: 20,
        x: am5.percent(50),
        centerX: am5.percent(50)
    }));

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
        xAxis.get("renderer").labels.template.setAll({
            rotation: -45,
            centerY: am5.p50,
            centerX: am5.p100,
            paddingRight: 15,
            fontSize: isMobileChart ? 9 : 11,
            fontWeight: isMobileChart ? "bold" : "normal"
        });

        yAxis = chart.yAxes.push(am5xy.ValueAxis.new(chartRoot, {
            renderer: am5xy.AxisRendererY.new(chartRoot, {}),
            tooltip: am5.Tooltip.new(chartRoot, {})
        }));
    } else {
        yAxis = chart.yAxes.push(am5xy.CategoryAxis.new(chartRoot, {
            categoryField: "name",
            renderer: am5xy.AxisRendererY.new(chartRoot, { minGridDistance: 10 }),
            tooltip: am5.Tooltip.new(chartRoot, {})
        }));
        yAxis.get("renderer").labels.template.setAll({ fontSize: isMobileChart ? 9 : 11, fontWeight: isMobileChart ? "bold" : "normal" });

        xAxis = chart.xAxes.push(am5xy.ValueAxis.new(chartRoot, {
            renderer: am5xy.AxisRendererX.new(chartRoot, {}),
            tooltip: am5.Tooltip.new(chartRoot, {})
        }));
    }

    barSeries = chart.series.push(am5xy.ColumnSeries.new(chartRoot, {
        name: "Series",
        xAxis: xAxis,
        yAxis: yAxis,
        valueXField: isVert ? undefined : "value",
        valueYField: isVert ? "value" : undefined,
        categoryXField: isVert ? "name" : undefined,
        categoryYField: isVert ? undefined : "name",
        tooltip: am5.Tooltip.new(chartRoot, {
            pointerOrientation: isVert ? "vertical" : "horizontal"
        })
    }));

    barSeries.columns.template.setAll({
        height: isVert ? undefined : am5.percent(80),
        width: isVert ? am5.percent(80) : undefined,
        strokeOpacity: 0,
        cornerRadiusTR: 4,
        cornerRadiusBR: isVert ? 0 : 4,
        cornerRadiusTL: isVert ? 4 : 0
    });

    barSeries.columns.template.adapters.add("fill", function (fill, target) {
        if (!regionMode) return am5.color(0xc83830);
        const dataContext = target.dataItem.dataContext;
        if (dataContext && dataContext.region && regionColors[dataContext.region]) {
            return am5.color(regionColors[dataContext.region]);
        }
        return fill;
    });

    barSeries.columns.template.adapters.add("tooltipText", function () {
        const isPercent = activeMetric.startsWith("pct_") || activeMetric.includes("prevalence");
        if (isVert) return "{categoryX}: [bold]{valueY}" + (isPercent ? "%" : "") + "[/]";
        return "{categoryY}: [bold]{valueX}" + (isPercent ? "%" : "") + "[/]";
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
                    fontSize: 12,
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
    if (!barSeries) return;

    const data = [];
    const regionOrder = ["Central", "East", "South", "West"];
    const selectedByRegion = { "Central": [], "East": [], "South": [], "West": [] };

    selectedCounties.forEach(id => {
        const countyData = countyDataLookup[id];

        if (countyData) {
            let val = countyData[activeMetric];
            if (val === undefined || val === null) val = 0;
            let shortName = (countyData.name || id)
                .replace(/ County$/i, "")
                .replace(/ Parish$/i, "");
            if (countyData.state_abbr || countyData.state) {
                shortName += ", " + (countyData.state_abbr || countyData.state);
            }
            selectedByRegion[countyData.region].push({ name: shortName, value: val, region: countyData.region });
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
            if (selectedByRegion[region]) {
                selectedByRegion[region].forEach(item => allItems.push(item));
            }
        });
        allItems.sort((a, b) => a.value - b.value);
        allItems.forEach(item => data.push(item));
    }

    // Update title
    const label = metricLabels[activeMetric] || activeMetric;
    const chart = chartRoot.container.children.getIndex(0);
    if (chart && chart.children) {
        const chartTitle = chart.children.getIndex(0);
        if (chartTitle && chartTitle.set) {
            if (data.length > 0) {
                chartTitle.set("text", label + " \u2014 Selected Counties (" + data.length + ")");
            } else {
                chartTitle.set("text", "Selected Counties Comparison");
            }
        }
    }

    const compChartDiv = document.getElementById("compChartDiv");
    if (verticalChartMode) {
        compChartDiv.style.height = "500px";
    } else {
        const minHeight = 250;
        const heightPerItem = 30;
        let newHeight = data.length * heightPerItem + 60;
        if (newHeight < minHeight) newHeight = minHeight;
        compChartDiv.style.height = newHeight + "px";
    }

    chartRoot.resize();

    xAxis.data.setAll(data);
    yAxis.data.setAll(data);
    barSeries.data.setAll(data);

    updateChartExtras(selectedByRegion);

    // Keep table in sync whenever the chart updates
    if (typeof currentView !== 'undefined' && currentView === 'table') refreshTable();
}

function updateChartExtras(selectedByRegion) {
    const catAxis = verticalChartMode ? xAxis : yAxis;
    catAxis.axisRanges.clear();
    const legendData = [];

    if (!regionMode) {
        legend.data.setAll([]);
        return;
    }

    const regionOrder = ["Central", "East", "South", "West"];
    regionOrder.forEach(region => {
        const counties = selectedByRegion[region];
        if (counties && counties.length > 0) {
            const lastCounty = counties[counties.length - 1].name;
            const color = am5.color(regionColors[region]);

            const rangeDataItem = catAxis.makeDataItem({ category: lastCounty });
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
    });

    legend.data.setAll(legendData);
}


// =========================================
// METRIC CARD LISTENERS
// =========================================

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

            // Sync mobile dropdown if it exists
            const dd = document.getElementById("mobileMetricSelect");
            if (dd) dd.value = m;

            // Re-evaluate map data points logic
            const savedSelections = new Set(selectedCounties);
            updateMapData();

            // Re-apply selections
            selectedCounties = savedSelections;
            mapPolygonSeries.mapPolygons.each(p => {
                const di = p.dataItem;
                if (di) {
                    const pid = di.get("id");
                    if (selectedCounties.has(pid)) {
                        p.set("active", true);
                    }
                }
            });
            updateChart();
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
        document.querySelectorAll(".metric-card").forEach(el => el.classList.remove("active"));
        const activeCard = document.querySelector(`.metric-card[data-metric="${activeMetric}"]`);
        if (activeCard) activeCard.classList.add("active");

        const savedSelections = new Set(selectedCounties);
        updateMapData();
        selectedCounties = savedSelections;
        mapPolygonSeries.mapPolygons.each(p => {
            const di = p.dataItem;
            if (di) {
                const pid = di.get("id");
                if (selectedCounties.has(pid)) {
                    p.set("active", true);
                }
            }
        });
        updateChart();
    });

    header.appendChild(select);
}

// =========================================
// BOOT
// =========================================
am5.ready(function () {
    init();
});

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
        if (chartSection) chartSection.style.display = '';
        if (tableSection) tableSection.style.display = 'none';
        btnChart && btnChart.classList.add('active');
        btnTable && btnTable.classList.remove('active');
    } else {
        if (chartSection) chartSection.style.display = 'none';
        if (tableSection) tableSection.style.display = 'flex';
        btnChart && btnChart.classList.remove('active');
        btnTable && btnTable.classList.add('active');
        refreshTable();
    }
}

function switchChartType(type) {
    verticalChartMode = type === 'bar_vertical';

    const btnHBar = document.getElementById('btnHBarChart');
    const btnVBar = document.getElementById('btnVBarChart');

    btnHBar && btnHBar.classList.remove('active');
    btnVBar && btnVBar.classList.remove('active');

    if (type === 'bar_vertical') {
        btnVBar && btnVBar.classList.add('active');
    } else {
        btnHBar && btnHBar.classList.add('active');
    }

    initChart();
    updateChart();
}

function refreshTable() {
    const rows = [];
    selectedCounties.forEach(id => {
        const data = countyDataLookup[id];
        if (data) {
            let shortName = (data.name || id)
                .replace(/ County$/i, '')
                .replace(/ Parish$/i, '');
            if (data.state_abbr || data.state) {
                shortName += ', ' + (data.state_abbr || data.state);
            }
            rows.push({ ...data, name: shortName });
        }
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
