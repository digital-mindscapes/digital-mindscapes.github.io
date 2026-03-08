// =========================================
// COUNTY DISTRIBUTION BEESWARM (amCharts 5 + D3 Force)
// =========================================

let allCountyData = [];
let activeMetric = "pct_unemployment_rate";
let ruccFilter = "All";
let regionFilter = "All";
let stateFilter = "All";
let highlightFilter = "None"; // "None", "Above", "Below"
let colorMode = "none"; // "none", "rucc", "region"
let viewMode = "chart"; // "chart", "table"
let globalRuccData = {};
let rangeMin = 0, rangeMax = 100;
let metricMin = 0, metricMax = 100;
let currentActiveMetricForRange = "";
let rangeLineMinDataItem = null, rangeLineMaxDataItem = null;
let nationalAvgLineDataItem = null;

const ruccColors = {
    "Metro": "#3b82f6",
    "Nonmetro": "#eab308"
};

const regionColors = {
    "Northeast": "#ff7f0e",
    "Midwest": "#2ca02c",
    "South": "#d62728",
    "West": "#9467bd",
    "Unknown": "#7f7f7f"
};

const stateToRegion = {
    "CT": "Northeast", "ME": "Northeast", "MA": "Northeast", "NH": "Northeast", "RI": "Northeast", "VT": "Northeast", "NJ": "Northeast", "NY": "Northeast", "PA": "Northeast",
    "IL": "Midwest", "IN": "Midwest", "MI": "Midwest", "OH": "Midwest", "WI": "Midwest", "IA": "Midwest", "KS": "Midwest", "MN": "Midwest", "MO": "Midwest", "NE": "Midwest", "ND": "Midwest", "SD": "Midwest",
    "DE": "South", "FL": "South", "GA": "South", "MD": "South", "NC": "South", "SC": "South", "VA": "South", "WV": "South", "AL": "South", "KY": "South", "MS": "South", "TN": "South", "AR": "South", "LA": "South", "OK": "South", "TX": "South", "DC": "South",
    "AZ": "West", "CO": "West", "ID": "West", "MT": "West", "NV": "West", "NM": "West", "UT": "West", "WY": "West", "AK": "West", "CA": "West", "HI": "West", "OR": "West", "WA": "West"
};

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

let chartRoot, chart, legend, barSeries, xAxis, yAxis, simulation, nodes;

function isMobile() {
    return window.innerWidth < 768;
}

// =========================================
// DATA LOADING
// =========================================

async function loadAndMergeData() {
    try {
        const [acsRes, placesRes, ruccRes] = await Promise.all([
            fetch("data/ACS Data/county_acs_flat.json"),
            fetch("data/PLACES Data/county_places_flat.json"),
            fetch("data/Rural_Urban_Comparison/county_rucc.json")
        ]);
        const acsData = await acsRes.json();
        const placesData = await placesRes.json();
        globalRuccData = await ruccRes.json();

        // Use the global geodata loaded via script tag in HTML
        let geoData = (typeof am5geodata_region_usa_usaCountiesLow !== "undefined")
            ? am5geodata_region_usa_usaCountiesLow
            : null;

        // Build a mapping from State_NormalizedName -> FIPS from geodata
        const fipsLookup = {};
        if (geoData && geoData.features) {
            geoData.features.forEach(f => {
                const fips = f.id;
                const state = f.properties.STATE;
                const name = normalizeCountyName(f.properties.name);
                if (state && name) {
                    fipsLookup[state + "_" + name] = fips;
                }
            });
        }

        const placesLookup = {};
        placesData.forEach(d => {
            if (d.state_abbr && d.name) {
                const norm = normalizeCountyName(d.name);
                placesLookup[d.state_abbr.toUpperCase() + "_" + norm] = d;
            } else if (d.id) {
                placesLookup[d.id] = d;
            }
        });

        console.log("Merging data for", acsData.length, "counties...");

        return acsData.map(acs => {
            const normName = normalizeCountyName(acs.name);
            const lookupKey = (acs.state_abbr || "").toUpperCase() + "_" + normName;
            const places = placesLookup[lookupKey] || placesLookup[acs.id] || {};
            const merged = { ...acs, ...places, id: acs.id, name: acs.name, state_abbr: acs.state_abbr };

            // Attach RUCC metadata
            let fips = merged.GEOID || merged.fips || fipsLookup[lookupKey];

            if (fips && typeof fips === "string") {
                if (fips.includes("-")) {
                    const parts = fips.split("-");
                    fips = parts[parts.length - 1];
                }
                if (/^\d{1,4}$/.test(fips)) fips = fips.padStart(5, "0");
            }

            if (fips && globalRuccData[fips]) {
                merged.rucc_class = globalRuccData[fips].classification;
            } else {
                merged.rucc_class = "Unknown";
            }

            // Attach Region metadata
            merged.region = stateToRegion[merged.state_abbr] || "Unknown";

            return merged;
        });
    } catch (e) {
        console.error("Error loading or merging data:", e);
        return [];
    }
}

// =========================================
// INITIALIZATION
// =========================================

async function init() {
    allCountyData = await loadAndMergeData();
    populateSidebar();
    populateStateDropdown();
    initChart();
    updateChart();
    attachListeners();
    syncStickyTop();
}

function syncStickyTop() {
    const navBar = document.querySelector(".navigation-bar");
    const controlBar = document.querySelector(".control-bar");
    if (navBar && controlBar) {
        controlBar.style.top = navBar.offsetHeight + "px";
    }
}

function populateStateDropdown() {
    const select = document.getElementById("stateFilterSelect");
    if (!select) return;

    // Get unique sorted state abbreviations
    const states = [...new Set(allCountyData.map(c => c.state_abbr))].filter(Boolean).sort();
    states.forEach(st => {
        const opt = document.createElement("option");
        opt.value = st;
        opt.textContent = st;
        select.appendChild(opt);
    });
}

function populateSidebar() {
    const container = document.getElementById("metricsSidebar");
    if (!container) return;

    tableMetricSections.forEach(sect => {
        const sectDiv = document.createElement("div");
        sectDiv.className = "metrics-sidebar-section";
        sectDiv.innerHTML = `<h3>${sect.section}</h3>`;

        sect.metrics.forEach(mKey => {
            const meta = tableMetricMeta[mKey];
            if (!meta) return;

            const item = document.createElement("div");
            item.className = "metric-sidebar-item" + (mKey === activeMetric ? " active" : "");
            item.setAttribute("data-metric", mKey);
            item.innerHTML = `
                <span class="metric-label">${meta.label}</span>
                <span class="metric-unit">${meta.unit}</span>
            `;
            item.onclick = () => {
                document.querySelectorAll(".metric-sidebar-item").forEach(el => el.classList.remove("active"));
                item.classList.add("active");
                activeMetric = mKey;
                updateChart();
            };
            sectDiv.appendChild(item);
        });
        container.appendChild(sectDiv);
    });

    initMobileMetricDropdownInstance();
}

function initMobileMetricDropdownInstance() {
    const selectorContainer = document.getElementById("mobileMetricSelector");
    if (!selectorContainer) return;

    const select = document.createElement("select");
    select.className = "mobile-metric-dropdown";

    tableMetricSections.forEach(sect => {
        const group = document.createElement("optgroup");
        group.label = sect.section;

        sect.metrics.forEach(mKey => {
            const meta = tableMetricMeta[mKey];
            if (!meta) return;

            const option = document.createElement("option");
            option.value = mKey;
            option.textContent = meta.label;
            if (mKey === activeMetric) option.selected = true;
            group.appendChild(option);
        });

        select.appendChild(group);
    });

    select.onchange = (e) => {
        activeMetric = e.target.value;

        // Sync desktop sidebar
        document.querySelectorAll(".metric-sidebar-item").forEach(el => {
            el.classList.toggle("active", el.getAttribute("data-metric") === activeMetric);
        });

        initChart();
        updateChart();
    };

    selectorContainer.innerHTML = "";
    selectorContainer.appendChild(select);
}

function attachListeners() {
    document.getElementById("ruccFilterSelect").onchange = (e) => {
        ruccFilter = e.target.value;
        updateChart();
    };

    document.getElementById("regionFilterSelect").onchange = (e) => {
        regionFilter = e.target.value;
        updateChart();
    };

    document.getElementById("stateFilterSelect").onchange = (e) => {
        stateFilter = e.target.value;
        updateChart();
    };

    document.getElementById("highlightFilterSelect").onchange = (e) => {
        highlightFilter = e.target.value;
        updateChart();
    };

    document.getElementById("colorModeSelect").onchange = (e) => {
        colorMode = e.target.value;
        updateChart();
    };

    // Range Slider Listeners
    const minInput = document.getElementById("rangeMinInput");
    const maxInput = document.getElementById("rangeMaxInput");

    if (minInput && maxInput) {
        minInput.oninput = (e) => {
            let val = parseFloat(e.target.value);
            if (val > rangeMax) {
                val = rangeMax;
                e.target.value = val;
            }
            rangeMin = val;
            fastUpdatePlotRange();
        };
        minInput.onchange = (e) => {
            updateChart();
        };

        maxInput.oninput = (e) => {
            let val = parseFloat(e.target.value);
            if (val < rangeMin) {
                val = rangeMin;
                e.target.value = val;
            }
            rangeMax = val;
            fastUpdatePlotRange();
        };
        maxInput.onchange = (e) => {
            updateChart();
        };
    }
}

function updateRangeSliderUI() {
    const minInput = document.getElementById("rangeMinInput");
    const maxInput = document.getElementById("rangeMaxInput");
    const fill = document.getElementById("sliderRangeFill");
    const minDisplay = document.getElementById("rangeMinDisplay");
    const maxDisplay = document.getElementById("rangeMaxDisplay");

    if (!minInput || !maxInput || !fill || !minDisplay || !maxDisplay) return;

    const minBound = parseFloat(minInput.min);
    const maxBound = parseFloat(minInput.max);
    const range = maxBound - minBound;

    if (range === 0) return;

    const left = ((rangeMin - minBound) / range) * 100;
    const right = ((rangeMax - minBound) / range) * 100;

    fill.style.left = left + "%";
    fill.style.width = (right - left) + "%";

    const meta = tableMetricMeta[activeMetric] || { unit: "" };
    minDisplay.textContent = formatValue(rangeMin, meta.unit === "%" ? "pct" : "dec");
    maxDisplay.textContent = formatValue(rangeMax, meta.unit === "%" ? "pct" : "dec");
}

function fastUpdatePlotRange() {
    updateRangeSliderUI();

    // 1. Update Dashed Lines (Fast)
    if (rangeLineMinDataItem) rangeLineMinDataItem.set("value", rangeMin);
    if (rangeLineMaxDataItem) rangeLineMaxDataItem.set("value", rangeMax);

    // 2. Loop through points and update highlights (Fast)
    if (!barSeries) return;

    let highlightedCount = 0;
    // We recalculate National Average if needed but usually it's stable
    // Let's get current National Avg from the existing line if it's there
    const nationalAvg = nationalAvgLineDataItem ? nationalAvgLineDataItem.get("value") : 0;

    am5.array.each(barSeries.dataItems, (di) => {
        const val = di.get("valueX") || di.get("valueY"); // Depending on mobile orientation
        const sprite = di.bullets[0].get("sprite");
        if (!sprite) return;

        const dataContext = di.dataContext;
        const rc = dataContext.rucc_class || "Unknown";
        const reg = dataContext.region || "Unknown";

        // Re-apply highlight logic
        let isHighlighted = true;
        if (highlightFilter === "Above") {
            isHighlighted = (val > nationalAvg);
        } else if (highlightFilter === "Below") {
            isHighlighted = (val < nationalAvg);
        }

        // Apply Range Filter Logic
        const inRange = (val >= rangeMin && val <= rangeMax);
        if (!inRange) isHighlighted = false;

        // Base color (consistent with updateChart)
        let bColor = am5.color(0xc83830);
        if (colorMode === "rucc") {
            bColor = am5.color(ruccColors[rc] || "#7f7f7f");
        } else if (colorMode === "region") {
            bColor = am5.color(regionColors[reg] || "#7f7f7f");
        }

        if (isHighlighted) {
            sprite.setAll({ fill: bColor, fillOpacity: 0.7 });
            highlightedCount++;
        } else {
            sprite.setAll({ fill: am5.color(0xd1d5db), fillOpacity: 0.08 });
        }
    });

    // 3. Update Title Count (Fast)
    const meta = tableMetricMeta[activeMetric];
    const titleLabel = chart.get("titleLabel");
    if (titleLabel) {
        const totalInView = barSeries.dataItems.length;
        const countText = highlightedCount === totalInView ? `${totalInView} Counties` : `${highlightedCount} of ${totalInView} Counties`;
        titleLabel.set("text", (meta ? meta.label : activeMetric) + " — " + countText);
    }
}

function toggleView(mode) {
    viewMode = mode;
    const chartWrapper = document.getElementById("chartWrapper");
    const tableWrapper = document.getElementById("tableWrapper");
    const chartBtn = document.getElementById("chartViewBtn");
    const tableBtn = document.getElementById("tableViewBtn");
    const controlBar = document.querySelector(".control-bar");

    if (mode === "chart") {
        chartWrapper.style.display = "block";
        tableWrapper.style.display = "none";
        chartBtn.classList.add("active");
        tableBtn.classList.remove("active");
    } else {
        chartWrapper.style.display = "none";
        tableWrapper.style.display = "block";
        chartBtn.classList.remove("active");
        tableBtn.classList.add("active");

        // Scroll to controls so they are visible and sticky
        if (controlBar) {
            const navBar = document.querySelector(".navigation-bar");
            // Use the actual height of the navigation bar to prevent overlapping
            const navHeight = navBar ? navBar.offsetHeight : 0;

            // Sync the sticky top position in CSS with the actual nav height
            if (navHeight > 0) {
                controlBar.style.top = navHeight + "px";
            }

            const scrollPos = controlBar.offsetTop - Math.max(navHeight, 60);
            window.scrollTo({
                top: scrollPos,
                behavior: "smooth"
            });
        }
    }
    updateChart();
}

function refreshTable() {
    updateChart();
}

// =========================================
// CHARTING
// =========================================

function initChart() {
    if (chartRoot) chartRoot.dispose();
    chartRoot = am5.Root.new("distributionChartDiv");

    simulation = d3.forceSimulation();

    const mobile = isMobile();

    chart = chartRoot.container.children.push(am5xy.XYChart.new(chartRoot, {
        panX: !mobile, panY: mobile, wheelX: mobile ? "none" : "zoomX", wheelY: mobile ? "zoomY" : "none",
        layout: chartRoot.verticalLayout,
        paddingLeft: mobile ? 20 : 80,
        paddingRight: mobile ? 20 : 60,
        paddingBottom: mobile ? 60 : 60,
        paddingTop: 80
    }));

    // Title
    const title = chart.children.unshift(am5.Label.new(chartRoot, {
        text: "National County Distribution",
        fontSize: 18,
        fontWeight: "bold",
        paddingBottom: 25,
        x: am5.percent(50),
        centerX: am5.percent(50)
    }));
    chart.set("titleLabel", title);

    xAxis = chart.xAxes.push(am5xy.ValueAxis.new(chartRoot, {
        renderer: am5xy.AxisRendererX.new(chartRoot, { minGridDistance: 50 }),
        extraMin: 0.05, extraMax: 0.05,
        visible: !mobile
    }));

    yAxis = chart.yAxes.push(am5xy.ValueAxis.new(chartRoot, {
        renderer: am5xy.AxisRendererY.new(chartRoot, { minGridDistance: 50 }),
        extraMin: 0.05, extraMax: 0.05,
        visible: mobile,
        min: mobile ? undefined : -100,
        max: mobile ? undefined : 100,
        strictMinMax: !mobile
    }));

    if (!mobile) {
        yAxis.get("renderer").grid.template.set("forceHidden", true);
    } else {
        xAxis.get("renderer").grid.template.set("forceHidden", true);
        xAxis.setAll({ min: -100, max: 100, strictMinMax: true });
    }

    barSeries = chart.series.push(am5xy.LineSeries.new(chartRoot, {
        xAxis: xAxis, yAxis: yAxis,
        valueXField: mobile ? "x" : "value",
        valueYField: mobile ? "value" : "y"
    }));
    barSeries.strokes.template.set("visible", false);

    barSeries.bullets.push(function () {
        const circle = am5.Circle.new(chartRoot, {
            radius: 3.5,
            fillOpacity: 0.7,
            strokeWidth: 1,
            templateField: "bulletSettings",
            tooltipText: "{name}: [bold]{value}[/]\n[font-size: 12px]Region: {region} | Class: {rucc_class}[/]",
            tooltipY: 0
        });

        circle.states.create("hover", { radius: 7, fillOpacity: 1 });

        return am5.Bullet.new(chartRoot, { sprite: circle });
    });

    const meta = tableMetricMeta[activeMetric] || { fmt: "dec" };



    // Legend (At the bottom)
    legend = chart.children.push(am5.Legend.new(chartRoot, {
        centerX: am5.p50,
        x: am5.p50,
        marginTop: 20,
        marginBottom: 10,
        nameField: "name",
        fillField: "fill"
    }));

    legend.markers.template.setAll({
        width: 15,
        height: 15
    });

    chart.set("legend", legend);
}

function updateChart() {
    if (!barSeries) return;

    // 0. Update Range Bounds if metric changed
    if (currentActiveMetricForRange !== activeMetric) {
        let minObs = Infinity, maxObs = -Infinity;
        allCountyData.forEach(c => {
            let v = parseFloat(c[activeMetric]);
            if (!isNaN(v) && v !== 0) {
                if (v < minObs) minObs = v;
                if (v > maxObs) maxObs = v;
            }
        });

        // If no data found, use defaults
        if (minObs === Infinity) { minObs = 0; maxObs = 100; }

        metricMin = minObs;
        metricMax = maxObs;
        rangeMin = metricMin;
        rangeMax = metricMax;
        currentActiveMetricForRange = activeMetric;

        const minIn = document.getElementById("rangeMinInput");
        const maxIn = document.getElementById("rangeMaxInput");
        if (minIn && maxIn) {
            minIn.min = metricMin;
            minIn.max = metricMax;
            minIn.value = metricMin;
            maxIn.min = metricMin;
            maxIn.max = metricMax;
            maxIn.value = metricMax;
        }
        updateRangeSliderUI();
    }

    // 1. Calculate National Average
    let total = 0, count = 0;
    allCountyData.forEach(c => {
        let v = parseFloat(c[activeMetric]);
        if (!isNaN(v) && v !== 0) {
            total += v;
            count++;
        }
    });
    const nationalAvg = count > 0 ? total / count : 0;

    // 2. Clear existing lines
    xAxis.axisRanges.clear();
    yAxis.axisRanges.clear();
    rangeLineMinDataItem = null;
    rangeLineMaxDataItem = null;
    nationalAvgLineDataItem = null;

    // 3. (Line creation moved to datavalidated below)

    const data = [];
    allCountyData.forEach(c => {
        const rc = c.rucc_class || "Unknown";
        if (ruccFilter !== "All" && rc !== ruccFilter) return;

        const reg = c.region || "Unknown";
        if (regionFilter !== "All" && reg !== regionFilter) return;

        if (stateFilter !== "All" && c.state_abbr !== stateFilter) return;

        let val = c[activeMetric];
        if (val === undefined || val === null || val === "" || val === "N/A") return;
        val = parseFloat(val);
        if (isNaN(val)) return;

        // Determine base Color
        let bColor = am5.color(0xc83830); // Default Red
        if (colorMode === "rucc") {
            bColor = am5.color(ruccColors[rc] || "#7f7f7f");
        } else if (colorMode === "region") {
            const reg = c.region || "Unknown";
            bColor = am5.color(regionColors[reg] || "#7f7f7f");
        }

        // Apply Highlight Logic
        let isHighlighted = true;
        if (highlightFilter === "Above") {
            isHighlighted = (val > nationalAvg);
        } else if (highlightFilter === "Below") {
            isHighlighted = (val < nationalAvg);
        }

        // Apply Range Filter Logic
        const inRange = (val >= rangeMin && val <= rangeMax);
        if (!inRange) isHighlighted = false;

        const bulletSettings = { fill: bColor, fillOpacity: isHighlighted ? 0.7 : 0.08 };

        // If not highlighted, make it a neutral light gray
        if (!isHighlighted) {
            bulletSettings.fill = am5.color(0xd1d5db); // Lighter gray for grayed out points
        }

        if (val === 0) {
            bulletSettings.fill = am5.color(0x64748b); // Darker gray for zero if still visible
            bulletSettings.stroke = am5.color(0x000000);
            bulletSettings.strokeWidth = 2;
            bulletSettings.strokeDasharray = [2, 2];
        } else {
            bulletSettings.stroke = am5.color(0xffffff); // Default white stroke
            bulletSettings.strokeWidth = 0.5;
            bulletSettings.strokeDasharray = [];
        }

        const rowData = {
            name: (c.name || "").replace(/ County$/i, "") + ", " + c.state_abbr,
            value: val,
            x: 0,
            y: 0,
            rucc_class: rc,
            region: c.region || "Unknown",
            bulletSettings: bulletSettings,
            state_abbr: c.state_abbr,
            state_name: stateNameMap[c.state_abbr] || c.state_abbr
        };
        // The table engine expects the metric key as a property
        rowData[activeMetric] = val;
        data.push(rowData);
    });

    const highlightedCount = data.filter(d => d.bulletSettings.fillOpacity > 0.1).length;

    barSeries.data.setAll(data);

    // Sync Table (Filter table rows to only show points in range)
    if (typeof renderComparisonTable === "function") {
        const filteredData = data.filter(d => d.value >= rangeMin && d.value <= rangeMax);
        renderComparisonTable("compTableDiv", filteredData, activeMetric);
    }

    // Update Meta & Title
    const meta = tableMetricMeta[activeMetric];
    const titleLabel = chart.get("titleLabel");
    if (titleLabel) {
        const totalCount = data.length;
        const countText = highlightedCount === totalCount ? `${totalCount} Counties` : `${highlightedCount} of ${totalCount} Counties`;
        titleLabel.set("text", (meta ? meta.label : activeMetric) + " \u2014 " + countText);
    }

    // Update Legend
    if (!legend) return;
    if (colorMode === "rucc") {
        legend.data.setAll([
            { name: "Metro", fill: am5.color(ruccColors.Metro) },
            { name: "Nonmetro", fill: am5.color(ruccColors.Nonmetro) }
        ]);
        legend.show();
    } else if (colorMode === "region") {
        legend.data.setAll(Object.keys(regionColors)
            .filter(k => k !== "Unknown")
            .map(k => ({
                name: k,
                fill: am5.color(regionColors[k])
            })));
        legend.show();
    } else {
        legend.hide();
    }



    barSeries.events.once("datavalidated", () => {
        const mobile = isMobile();
        const activeAxis = mobile ? yAxis : xAxis;

        // Create Average Line now that data is stable
        nationalAvgLineDataItem = activeAxis.makeDataItem({ value: nationalAvg });
        activeAxis.createAxisRange(nationalAvgLineDataItem);
        nationalAvgLineDataItem.get("grid").setAll({
            strokeOpacity: 0.8,
            strokeDasharray: [6, 4],
            strokeWidth: 3,
            stroke: am5.color(0x334155), // Darker Slate Gray
            visible: true
        });

        const labelSettings = {
            text: "National Avg: " + formatValue(nationalAvg, (tableMetricMeta[activeMetric] || {}).unit === "%" ? "pct" : "dec"),
            location: 0,
            fontWeight: "800",
            fontSize: 12,
            fill: am5.color(0xffffff),
            background: am5.RoundedRectangle.new(chartRoot, {
                fill: am5.color(0xdc2626),
                cornerRadiusTL: 20, cornerRadiusTR: 20, cornerRadiusBL: 20, cornerRadiusBR: 20
            }),
            paddingLeft: 12, paddingRight: 12, paddingTop: 6, paddingBottom: 6,
            visible: true
        };

        if (mobile) {
            labelSettings.x = 0;
            labelSettings.dx = 10;
            labelSettings.centerY = am5.p50;
        } else {
            labelSettings.y = am5.p100;
            labelSettings.dy = 35;
            labelSettings.centerX = am5.p50;
        }

        nationalAvgLineDataItem.get("label").setAll(labelSettings);

        // --- Create Range Dashboard Lines (Dashed Lines) ---
        const createRangeLine = (val) => {
            const di = activeAxis.makeDataItem({ value: val });
            activeAxis.createAxisRange(di);
            di.get("grid").setAll({
                strokeOpacity: 0.6,
                strokeDasharray: [4, 4],
                strokeWidth: 2,
                stroke: am5.color(0x64748b),
                visible: true
            });
            return di;
        };

        rangeLineMinDataItem = createRangeLine(rangeMin);
        rangeLineMaxDataItem = createRangeLine(rangeMax);

        // Use a slightly longer delay to ensure the initial amCharts layout is 100% established
        setTimeout(() => {
            nodes = [];
            am5.array.each(barSeries.dataItems, (di) => {
                const sprite = di.bullets[0].get("sprite");
                if (mobile) {
                    // Vertical: Fix Y to value, calculate X
                    nodes.push({ x: 0, fy: sprite.y(), circle: sprite });
                } else {
                    // Horizontal: Fix X to value, calculate Y
                    nodes.push({ fx: sprite.x(), y: 0, circle: sprite });
                }
            });

            simulation.nodes(nodes);
            simulation.force("collision", d3.forceCollide().radius(3.8));

            if (mobile) {
                simulation.force("x", d3.forceX(0).strength(0.08));
                simulation.force("y", null);
            } else {
                simulation.force("y", d3.forceY(0).strength(0.08));
                simulation.force("x", null);
            }

            for (let i = 0; i < 150; i++) simulation.tick();

            am5.array.each(nodes, n => {
                if (mobile) {
                    n.circle.set("dx", n.x);
                } else {
                    n.circle.set("dy", n.y);
                }
            });
            simulation.stop();
        }, 500);
    });
}

let resizeTimeout;
window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        initChart();
        updateChart();
        syncStickyTop();
    }, 500);
});

// Helper: Borrowed from comparison_table.js or similar
function formatValue(val, fmt) {
    if (val === null || val === undefined) return "N/A";
    if (fmt === "pct") return val.toFixed(1) + "%";
    if (fmt === "dec") return val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return val.toLocaleString();
}

am5.ready(init);
