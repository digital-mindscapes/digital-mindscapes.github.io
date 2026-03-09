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
let pinnedCounties = new Set(); // Stores county IDs
let rangeMin = 0, rangeMax = 100;
let metricMin = 0, metricMax = 100;
let currentActiveMetricForRange = "";
let rangeLineMinDataItem = null, rangeLineMaxDataItem = null;
let nationalAvgLineDataItem = null;
let stateAverages = {}; // Stores state_abbr -> average_value
let nationalStdDev = 0;
let nationalAvgValue = 0;
let showDensity = true;
let densitySeries = null;

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
let mapRoot, mapPolygonSeries;

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

        // Build robust lookups: State_NormalizedName -> ID/FIPS
        const geoIdLookup = {};
        const nameToFipsLookup = {};
        if (geoData && geoData.features) {
            geoData.features.forEach(f => {
                const fullId = f.id;
                const stateAbbr = (f.properties.STATE || "").toUpperCase();
                const nameNorm = normalizeCountyName(f.properties.name);
                if (stateAbbr && nameNorm) {
                    const key = (stateAbbr + "_" + nameNorm).toUpperCase();
                    geoIdLookup[key] = fullId;

                    // Extract FIPS: pure 5-digit ID or suffix of hyphenated ID
                    if (fullId.length === 5 && !isNaN(fullId)) {
                        nameToFipsLookup[key] = fullId;
                    } else if (fullId.includes("-")) {
                        const parts = fullId.split("-");
                        const last = parts[parts.length - 1];
                        if (last.length === 5 && !isNaN(last)) nameToFipsLookup[key] = last;
                    }
                }
            });
        }

        const placesLookup = {};
        placesData.forEach(d => {
            if (d.state_abbr && d.name) {
                const norm = normalizeCountyName(d.name);
                const key = (d.state_abbr + "_" + norm).toUpperCase();
                placesLookup[key] = d;
            }
            // Fallback for PLACES: use FIPS or ID
            if (d.fips) placesLookup[d.fips] = d;
            else if (d.id) placesLookup[d.id] = d;
        });

        console.log("Merging data for", acsData.length, "counties...");

        return acsData.map(acs => {
            const state = (acs.state_abbr || "").toUpperCase();
            const normName = normalizeCountyName(acs.name);
            const lookupKey = (state + "_" + normName).toUpperCase();
            const geoId = acs.GEOID || acs.id;

            // Priority: Name Match -> GEOID Match
            const places = placesLookup[lookupKey] || placesLookup[geoId] || {};
            const item = { ...acs, ...places };

            // Vital Metadata
            item.id = geoIdLookup[lookupKey] || item.GEOID || item.id;

            let fips = nameToFipsLookup[lookupKey] || item.GEOID || item.fips || "";
            if (fips && typeof fips === "string" && fips.includes("-")) fips = fips.split("-").pop();
            if (fips && /^\d{1,4}$/.test(fips)) fips = fips.padStart(5, "0");

            if (fips && globalRuccData[fips]) {
                const cls = (globalRuccData[fips].classification || "").trim();
                item.rucc_class = cls.includes("Nonmetro") ? "Nonmetro" : "Metro";
            } else {
                item.rucc_class = "Unknown";
            }

            item.region = stateToRegion[state] || "Unknown";
            item.state_abbr = state;

            return item;
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
    initSearch(); // Initialize intelligent search
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

    const isPinnedInSet = (id, geoid) => {
        return pinnedCounties.has(id) || (geoid && pinnedCounties.has(geoid));
    };

    // 1. Update Dashed Lines (Fast)
    if (rangeLineMinDataItem) rangeLineMinDataItem.set("value", rangeMin);
    if (rangeLineMaxDataItem) rangeLineMaxDataItem.set("value", rangeMax);

    // 2. Loop through points and update highlights (Fast)
    if (!barSeries) return;

    let highlightedCount = 0;
    const nationalAvg = nationalAvgLineDataItem ? nationalAvgLineDataItem.get("value") : 0;

    am5.array.each(barSeries.dataItems, (di) => {
        const val = di.get("valueX") || di.get("valueY");
        const sprite = di.bullets[0].get("sprite");
        if (!sprite) return;

        const dataContext = di.dataContext;
        const isPinned = isPinnedInSet(dataContext.id, dataContext.GEOID);

        let isHighlighted = true;
        if (highlightFilter === "Above") isHighlighted = (val > nationalAvg);
        else if (highlightFilter === "Below") isHighlighted = (val < nationalAvg);

        const inRange = (val >= rangeMin && val <= rangeMax);
        if (!inRange) isHighlighted = false;

        const effectiveVisible = isHighlighted || isPinned;

        // Update opacity and color
        if (isPinned) {
            sprite.setAll({
                fill: am5.color(0x3b82f6),
                fillOpacity: 1,
                stroke: am5.color(0x1e3a8a),
                strokeWidth: 2.5,
                radius: 6,
                scale: 1
            });
        } else if (effectiveVisible) {
            // Restore theme color
            let bColor = am5.color(0xc83830);
            if (colorMode === "rucc") {
                bColor = am5.color(ruccColors[dataContext.rucc_class] || "#94a3b8");
            } else if (colorMode === "region") {
                bColor = am5.color(regionColors[dataContext.region] || "#94a3b8");
            } else if (colorMode === "sigma") {
                const diff = Math.abs(val - nationalAvgValue);
                const sigma = nationalStdDev > 0 ? diff / nationalStdDev : 0;
                if (sigma > 2) bColor = am5.color(0xdc2626); // Red-600
                else if (sigma > 1) bColor = am5.color(0xfbbf24); // Amber-400
                else bColor = am5.color(0x94a3b8); // Slate-400
            }

            sprite.setAll({
                fill: bColor,
                fillOpacity: 0.7,
                stroke: am5.color(0xffffff),
                strokeWidth: 0.5,
                radius: 3.5,
                scale: 1
            });
            highlightedCount++;
        } else {
            sprite.setAll({
                fill: am5.color(0xd1d5db),
                fillOpacity: 0.08,
                stroke: am5.color(0xffffff),
                strokeWidth: 0.5,
                radius: 3.5,
                scale: 1
            });
        }
    });

    // 3. Update Map if visible
    if (document.getElementById("mapPanelOverlay").style.display === "flex") {
        updateMapLayers();
    }

    // 4. Update Title Count (Fast)
    const titleLabel = chart.get("titleLabel");
    if (titleLabel) {
        const totalInView = barSeries.dataItems.length;
        const meta = tableMetricMeta[activeMetric];
        const countText = highlightedCount === totalInView ? `${totalInView} Counties` : `${highlightedCount} of ${totalInView} Counties`;
        titleLabel.set("text", (meta ? meta.label : activeMetric) + " — " + countText);
    }
}

function initSearch() {
    const input = document.getElementById("countySearchInput");
    const results = document.getElementById("searchResults");
    if (!input || !results) return;

    input.oninput = (e) => {
        const term = e.target.value.toLowerCase().trim();
        if (term.length < 2) {
            results.style.display = "none";
            return;
        }

        const matches = allCountyData.filter(c => {
            const name = (c.name || "").toLowerCase();
            const state = (c.state_abbr || "").toLowerCase();
            const fullName = (stateNameMap[c.state_abbr] || "").toLowerCase();
            return name.includes(term) || state.includes(term) || fullName.includes(term);
        }).slice(0, 10);

        if (matches.length > 0) {
            results.innerHTML = matches.map(c => `
                <div class="search-result-item" onclick="togglePin('${c.id}', '${c.name}', '${c.state_abbr}')">
                    <span class="county-name">${c.name}</span>
                    <span class="state-abbr">${c.state_abbr}</span>
                </div>
            `).join("");
            results.style.display = "block";
        } else {
            results.innerHTML = '<div class="search-result-item">No counties found</div>';
            results.style.display = "block";
        }
    };

    document.addEventListener("click", (e) => {
        if (!input.contains(e.target) && !results.contains(e.target)) {
            results.style.display = "none";
        }
    });
}

function togglePin(id, name, state) {
    if (pinnedCounties.has(id)) {
        pinnedCounties.delete(id);
    } else {
        pinnedCounties.add(id);
    }
    updatePinnedUI();
    updateChart();
    if (document.getElementById("searchResults")) {
        document.getElementById("searchResults").style.display = "none";
        document.getElementById("countySearchInput").value = "";
    }
}

function updatePinnedUI() {
    const container = document.getElementById("pinnedCountiesContainer");
    if (!container) return;

    if (pinnedCounties.size === 0) {
        container.innerHTML = "";
        return;
    }

    let html = "";
    pinnedCounties.forEach(id => {
        const county = allCountyData.find(c => c.id === id);
        if (county) {
            html += `
                <div class="pin-tag">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    </svg>
                    ${county.name}, ${county.state_abbr}
                    <span class="remove-pin" onclick="togglePin('${id}')">&times;</span>
                </div>
            `;
        }
    });
    container.innerHTML = html;
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

function showMapPanel() {
    const overlay = document.getElementById("mapPanelOverlay");
    overlay.style.display = "flex";
    if (!mapRoot) {
        initDistributionMap();
    } else {
        updateMapLayers();
    }
}

function hideMapPanel() {
    const overlay = document.getElementById("mapPanelOverlay");
    overlay.style.display = "none";
}

function initDistributionMap() {
    mapRoot = am5.Root.new("distributionMapDiv");
    mapRoot.setThemes([am5themes_Animated.new(mapRoot)]);

    const mapChart = am5map.MapChart.new(mapRoot, {
        panX: "translateX",
        panY: "translateY",
        wheelY: "zoom",
        projection: am5map.geoAlbersUsa()
    });
    mapChart.set("zoomControl", am5map.ZoomControl.new(mapRoot, {}));
    // Add a proper "Home" button with an icon instead of "Reset Zoom" text
    const homeButton = am5.Button.new(mapRoot, {
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: 8,
        paddingRight: 8,
        x: am5.percent(98),
        y: am5.percent(10),
        centerX: am5.percent(100),
        centerY: am5.percent(0),
        icon: am5.Graphics.new(mapRoot, {
            svgPath: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
            fill: am5.color(0x334155),
            scale: 0.7
        })
    });

    homeButton.events.on("click", function () {
        mapChart.goHome();
    });

    mapChart.set("homeButton", homeButton);
    mapChart.children.push(homeButton);
    mapChart.children.push(mapChart.get("zoomControl"));

    mapPolygonSeries = mapChart.series.push(am5map.MapPolygonSeries.new(mapRoot, {
        geoJSON: am5geodata_region_usa_usaCountiesLow
    }));

    mapPolygonSeries.mapPolygons.template.setAll({
        fill: am5.color(0xd9cec8),
        stroke: am5.color(0xffffff),
        strokeWidth: 0.5,
        fillOpacity: 1,
        tooltipText: "{name}: [bold]{value}[/]",
        tooltipY: 0
    });

    // Tooltip Adapter to match beeswarm plot formatting
    mapPolygonSeries.mapPolygons.template.adapters.add("tooltipText", function (text, target) {
        const dataContext = target.dataItem.dataContext;
        if (!dataContext || dataContext.dummy) return "";

        // Find the county record in allCountyData to get extra metadata
        const countyRecord = allCountyData.find(c => c.id === target.dataItem.get("id"));
        if (!countyRecord) return "{name}";

        const val = countyRecord[activeMetric];
        const isPercent = activeMetric.startsWith("pct_") || activeMetric.includes("prevalence");
        const formattedVal = val !== undefined && val !== null ? (parseFloat(val).toFixed(1) + (isPercent ? "%" : "")) : "N/A";

        const name = (countyRecord.name || "").replace(/ County$/i, "") + ", " + countyRecord.state_abbr;
        const region = countyRecord.region || "Unknown";
        const rc = countyRecord.rucc_class || "Unknown";

        return `[bold]${name}: ${formattedVal}[/]\n[font-size: 12px]Region: ${region} | Class: ${rc}[/]`;
    });

    mapPolygonSeries.mapPolygons.template.states.create("hover", {
        stroke: am5.color(0x334155),
        strokeWidth: 1.5,
        fillOpacity: 1
    });

    // Initial load
    mapPolygonSeries.events.once("datavalidated", () => {
        updateMapLayers();
    });

    mapChart.appear(1000, 100);
    mapRoot.container.children.push(mapChart);
}

function updateMapLayers() {
    if (!mapPolygonSeries || !allCountyData.length) return;

    // Build a map of color and status from the existing data logic
    const colorStatusMap = {};

    // We can't always trust barSeries.dataItems bullets if they haven't finished rendering
    // So we use the same filtering logic used in the beeswarm chart
    allCountyData.forEach(item => {
        const rawVal = item[activeMetric];
        if (rawVal === undefined || rawVal === null) return;
        const val = parseFloat(rawVal);

        const isInRange = (!isNaN(val) && val >= rangeMin && val <= rangeMax);
        const matchesRUCC = (ruccFilter === "All" || item.rucc_class === ruccFilter);
        const matchesRegion = (regionFilter === "All" || item.region === regionFilter);
        const matchesState = (stateFilter === "All" || item.state_abbr === stateFilter);

        let highlightMatch = true;
        const nationalAvg = (tableMetricMeta[activeMetric] && tableMetricMeta[activeMetric].avg !== undefined) ? tableMetricMeta[activeMetric].avg : 0;

        if (highlightFilter === "Above") highlightMatch = (val > nationalAvg);
        if (highlightFilter === "Below") highlightMatch = (val < nationalAvg);

        const isHighlighted = (isInRange && matchesRUCC && matchesRegion && matchesState && highlightMatch);

        // Color logic
        let bColor = am5.color(0xc83830); // default
        if (colorMode === "rucc") {
            bColor = am5.color(ruccColors[item.rucc_class] || "#94a3b8");
        } else if (colorMode === "region") {
            bColor = am5.color(regionColors[item.region] || "#94a3b8");
        } else if (colorMode === "sigma") {
            const diff = Math.abs(val - nationalAvgValue);
            const sigmaScore = nationalStdDev > 0 ? diff / nationalStdDev : 0;
            if (sigmaScore > 2) bColor = am5.color(0xdc2626);
            else if (sigmaScore > 1) bColor = am5.color(0xfbbf24);
            else bColor = am5.color(0x94a3b8);
        }

        const isPinned = pinnedCounties.has(item.id) || (item.GEOID && pinnedCounties.has(item.GEOID));
        const finalActive = isHighlighted || isPinned;
        const finalColor = isPinned ? am5.color(0x3b82f6) : bColor;

        const statusObj = {
            active: finalActive,
            color: finalColor,
            isPinned: isPinned
        };

        if (item.id) colorStatusMap[item.id] = statusObj;
        if (item.GEOID) {
            colorStatusMap[item.GEOID] = statusObj;
            // Legacy/fallback for amCharts prefixing
            colorStatusMap["USA-" + item.GEOID] = statusObj;
        }
    });

    mapPolygonSeries.mapPolygons.each((polygon) => {
        const id = polygon.dataItem.get("id");
        const status = colorStatusMap[id];

        if (status && status.active) {
            polygon.set("fill", status.color);
            polygon.set("fillOpacity", status.isPinned ? 1 : 0.95);
            polygon.set("stroke", status.isPinned ? am5.color(0x1e3a8a) : am5.color(0xffffff));
            polygon.set("strokeWidth", status.isPinned ? 2 : 0.5);
        } else {
            polygon.set("fill", am5.color(0x94a3b8));
            polygon.set("fillOpacity", 0.1);
            polygon.set("stroke", am5.color(0xe2e8f0));
            polygon.set("strokeWidth", 0.2);
        }
    });
}

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

    // DENSITY SERIES (Violin Plot Overlay)
    densitySeries = chart.series.push(am5xy.LineSeries.new(chartRoot, {
        xAxis: xAxis,
        yAxis: yAxis,
        valueXField: mobile ? "density" : "value",
        valueYField: mobile ? "value" : "density",
        openValueYField: mobile ? undefined : "densityNegative",
        openValueXField: mobile ? "densityNegative" : undefined,
        stroke: am5.color(0x3b82f6),
        fill: am5.color(0x3b82f6),
        connect: true
    }));

    densitySeries.fills.template.setAll({
        fillOpacity: 0.12,
        visible: true,
        fillGradient: am5.LinearGradient.new(chartRoot, {
            stops: [
                { color: am5.color(0x3b82f6) },
                { color: am5.color(0x94a3b8) }
            ]
        })
    });

    densitySeries.strokes.template.setAll({
        strokeWidth: 1.5,
        strokeOpacity: 0.3
    });

    if (!showDensity) densitySeries.hide();

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
            tooltipText: "{name}: [bold]{value}[/]\n[font-size: 11px]Click for State & National Comparison[/]",
            tooltipY: 0,
            cursorOverStyle: "pointer"
        });

        circle.states.create("hover", { radius: 7, fillOpacity: 1 });

        circle.events.on("click", (e) => {
            const di = e.target.dataItem;
            if (di) {
                showRichComparisonCard(di.dataContext);
            }
        });

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

    // 1. Calculate National & State Averages + Sigma
    let total = 0, count = 0;
    let vals = [];
    let stateStat = {};
    allCountyData.forEach(c => {
        let v = parseFloat(c[activeMetric]);
        if (!isNaN(v) && v !== 0) {
            total += v;
            count++;
            vals.push(v);

            let s = c.state_abbr;
            if (s) {
                if (!stateStat[s]) stateStat[s] = { t: 0, c: 0 };
                stateStat[s].t += v;
                stateStat[s].c++;
            }
        }
    });

    const nationalAvg = count > 0 ? total / count : 0;
    nationalAvgValue = nationalAvg;

    // Calculate Standard Deviation
    nationalStdDev = 0;
    if (count > 1) {
        const sumSq = vals.reduce((sum, v) => sum + Math.pow(v - nationalAvg, 2), 0);
        nationalStdDev = Math.sqrt(sumSq / count);
    }
    stateAverages = {};
    for (let s in stateStat) {
        stateAverages[s] = stateStat[s].t / stateStat[s].c;
    }
    // Store back in meta for map synchronization
    if (tableMetricMeta[activeMetric]) {
        tableMetricMeta[activeMetric].avg = nationalAvg;
    }

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
            const rc_cls = (rc === "Unknown" || !ruccColors[rc]) ? "Unknown" : rc;
            bColor = am5.color(ruccColors[rc_cls] || "#7f8c8d");
        } else if (colorMode === "region") {
            const reg_cls = (reg === "Unknown" || !regionColors[reg]) ? "Unknown" : reg;
            bColor = am5.color(regionColors[reg_cls] || "#7f8c8d");
        } else if (colorMode === "sigma") {
            const diff = Math.abs(val - nationalAvg);
            const score = nationalStdDev > 0 ? diff / nationalStdDev : 0;
            if (score > 2) bColor = am5.color(0xdc2626); // Red
            else if (score > 1) bColor = am5.color(0xfbbf24); // Amber
            else bColor = am5.color(0x94a3b8); // Slate/Typical
        }

        // Apply Highlight Logic
        let isHighlighted = true;
        if (highlightFilter === "Above") {
            isHighlighted = (val > nationalAvg);
        } else if (highlightFilter === "Below") {
            isHighlighted = (val < nationalAvg);
        }

        const isPinned = pinnedCounties.has(c.id) || (c.GEOID && pinnedCounties.has(c.GEOID));

        // Apply Range Filter Logic
        const inRange = (val >= rangeMin && val <= rangeMax);
        if (!inRange) isHighlighted = false;

        const bulletSettings = {
            fill: isPinned ? am5.color(0x3b82f6) : bColor,
            fillOpacity: (isHighlighted || isPinned) ? 1.0 : 0.08
        };

        // If not highlighted and not pinned, gray it out
        if (!isHighlighted && !isPinned) {
            bulletSettings.fill = am5.color(0xd1d5db);
            bulletSettings.fillOpacity = 0.08;
        }

        if (isPinned) {
            bulletSettings.stroke = am5.color(0x1e3a8a);
            bulletSettings.strokeWidth = 2.5;
            bulletSettings.radius = 6;
        } else if (val === 0) {
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
            id: c.id,
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

    // UPDATE DENSITY (KDE)
    const activeValues = data.filter(d => d.bulletSettings.fillOpacity > 0.1).map(d => d.value);
    if (densitySeries && showDensity && activeValues.length > 5) {
        const kdeData = calculateKDE(activeValues);
        densitySeries.data.setAll(kdeData);
        densitySeries.show();
    } else if (densitySeries) {
        densitySeries.hide();
    }

    const highlightedCount = data.filter(d => d.bulletSettings.fillOpacity > 0.1).length;

    // Sync Map if visible
    if (document.getElementById("mapPanelOverlay").style.display === "flex") {
        // Full update needs a small delay to ensure bullet sprites are updated
        setTimeout(updateMapLayers, 50);
    }

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
    } else if (colorMode === "sigma") {
        legend.data.setAll([
            { name: "Extreme Outlier (>2σ)", fill: am5.color(0xdc2626) },
            { name: "Significant Deviation (1-2σ)", fill: am5.color(0xfbbf24) },
            { name: "Typical Performers (<1σ)", fill: am5.color(0x94a3b8) }
        ]);
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
                if (!di.bullets || !di.bullets[0]) return;
                const sprite = di.bullets[0].get("sprite");
                if (!sprite) return;
                const dataContext = di.dataContext;
                const isPinned = pinnedCounties.has(dataContext.id) || (dataContext.GEOID && pinnedCounties.has(dataContext.GEOID));

                if (isPinned) {
                    sprite.set("scale", 1); // Ensure reset if it was animating
                } else {
                    sprite.set("scale", 1);
                }

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

    barSeries.data.setAll(data);
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

// =========================================
// RICH COMPARISON CARD CONTROLLERS
// =========================================

function showRichComparisonCard(dataContext) {
    const card = document.getElementById("richComparisonCard");
    const meta = tableMetricMeta[activeMetric] || { label: activeMetric, unit: "", fmt: "dec" };
    const stateAbbr = dataContext.state_abbr;
    const stateAvg = stateAverages[stateAbbr] || 0;
    const nationalAvg = meta.avg || 0;
    const val = dataContext.value;

    // Set Text
    document.getElementById("compCountyName").textContent = dataContext.name.split(",")[0] + " County";
    document.getElementById("compStateName").textContent = dataContext.state_name || stateAbbr;
    document.getElementById("compMetricName").textContent = meta.label;
    document.getElementById("compStateLabel").textContent = (stateAbbr || "State") + " Average";

    // Format Values
    const unitFmt = meta.fmt === "pct" ? "pct" : "dec";
    document.getElementById("compCountyVal").textContent = formatValue(val, unitFmt);
    document.getElementById("compStateVal").textContent = formatValue(stateAvg, unitFmt);
    document.getElementById("compNationalVal").textContent = formatValue(nationalAvg, unitFmt);

    // Calculate Bar Widths (normalize against the highest of the three)
    const maxVal = Math.max(val, stateAvg, nationalAvg, 0.0001);

    // Animate Bars
    const setBar = (id, v) => {
        const bar = document.getElementById(id);
        const w = (v / maxVal) * 100;
        bar.style.width = w + "%";
    };

    // Show card first so layout is active
    card.classList.add("active");

    // Small delay to trigger width transition
    setTimeout(() => {
        setBar("compCountyBar", val);
        setBar("compStateBar", stateAvg);
        setBar("compNationalBar", nationalAvg);
    }, 50);
}

function hideRichComparisonCard() {
    const card = document.getElementById("richComparisonCard");
    card.classList.remove("active");
}

function toggleDensity() {
    showDensity = !showDensity;
    const btn = document.getElementById("densityToggleBtn");
    if (showDensity) {
        btn.classList.add("active");
        updateChart();
    } else {
        btn.classList.remove("active");
        if (densitySeries) densitySeries.hide();
    }
}

// Silverman's rule of thumb for KDE bandwidth
function calculateKDE(values, samples = 100) {
    if (values.length === 0) return [];

    // Adaptive grid based on metric range
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const pad = range * 0.1;
    const start = min - pad;
    const end = max + pad;
    const step = (end - start) / (samples - 1);

    // Bandwidth calculation (Silverman's rule)
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sq, v) => sq + Math.pow(v - mean, 2), 0) / values.length) || 1;
    const bandwidth = 0.9 * Math.min(stdDev, (range / 1.34)) * Math.pow(values.length, -0.2) || 1;

    const kde = [];
    for (let i = 0; i < samples; i++) {
        const x = start + i * step;
        let density = 0;
        for (let j = 0; j < values.length; j++) {
            const z = (x - values[j]) / bandwidth;
            density += Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
        }
        const d = density / (values.length * bandwidth);
        kde.push({
            value: x,
            density: d,
            densityNegative: -d
        });
    }

    // Scale density to fit the chart's +/- 100 coordinate space
    const maxD = Math.max(...kde.map(k => k.density));
    if (maxD > 0) {
        kde.forEach(k => {
            k.density = (k.density / maxD) * 85;
            k.densityNegative = -k.density;
        });
    }

    return kde;
}

