/**
 * Spatial Autocorrelation (Moran's I) Logic
 * Handles UI interactions, map rendering (amCharts 5), and D3 scatterplots.
 */

// =========================================
// METRIC DEFINITIONS (Sync with script.js)
// =========================================

const HEALTH_METRICS = [
    { id: 'obesity_prevalence', label: 'Obesity' },
    { id: 'diabetes_prevalence', label: 'Diabetes' },
    { id: 'depression_prevalence', label: 'Depression' },
    { id: 'arthritis_prevalence', label: 'Arthritis' },
    { id: 'asthma_prevalence', label: 'Asthma' },
    { id: 'high_blood_pressure_prevalence', label: 'High Blood Pressure' },
    { id: 'high_cholesterol_prevalence', label: 'High Cholesterol' },
    { id: 'coronary_heart_disease_prevalence', label: 'Heart Disease' },
    { id: 'stroke_prevalence', label: 'Stroke' },
    { id: 'cancer_prevalence', label: 'Cancer' },
    { id: 'copd_prevalence', label: 'COPD' },
    { id: 'mental_health_issues_prevalence', label: 'Mental Distress' },
    { id: 'physical_health_issues_prevalence', label: 'Physical Distress' },
    { id: 'general_health_prevalence', label: 'Fair/Poor Health' },
    { id: 'smoking_prevalence', label: 'Smoking' },
    { id: 'binge_drinking_prevalence', label: 'Binge Drinking' },
    { id: 'physical_inactivity_prevalence', label: 'Physical Inactivity' },
    { id: 'checkup_prevalence', label: 'Annual Checkup' },
    { id: 'cholesterol_screening_prevalence', label: 'Cholesterol Screen' },
    { id: 'bp_medication_prevalence', label: 'BP Medication' },
    { id: 'disability_prevalence', label: 'Any Disability' }
];

const ECON_METRICS = [
    { id: 'pct_unemployment_rate', label: 'Unemployment Rate' },
    { id: 'pct_in_labor_force', label: 'Labor Force %' },
    { id: 'pct_natural_resources_construction', label: 'Construction Jobs' },
    { id: 'pct_graduate_professional_degree', label: 'Graduate Degree' },
    { id: 'access2_prevalence', label: 'Lack Ins. (18-64)' }
];

const stateToAbbr = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA",
    "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
    "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
    "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
    "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY"
};

const metricLabels = {};
[...HEALTH_METRICS, ...ECON_METRICS].forEach(m => metricLabels[m.id] = m.label);

// =========================================
// GLOBAL STATE
// =========================================

let countyData = [];
let am5root, mapChart, polygonSeries;
let scatterplot;
let currentTargetVar = "obesity_prevalence";
let currentScope = "All"; // National or State ID
let neighborsMatrix = null;
let spatialWorker = null;
let analysisResults = null;
let currentHighlight = null; // 'HH', 'LL', 'HL', 'LH' or null
let currentMapMode = "cluster"; // "cluster" or "significance"

// =========================================
// INITIALIZATION
// =========================================

document.addEventListener("DOMContentLoaded", async () => {
    initUI();
    initMap();
    initWorker();
    await loadData();
    populateControls();
    
    // Auto-run removed per user request for manual control
    // runAnalysis();
});

function initUI() {
    const varList = document.getElementById("xVarList");
    
    const categories = [
        { label: "Health Status & Outcomes", metrics: HEALTH_METRICS, color: "#c83830" },
        { label: "Socioeconomic Factors", metrics: ECON_METRICS, color: "#0f172a" }
    ];

    categories.forEach(cat => {
        const header = document.createElement("div");
        header.innerHTML = `<strong>${cat.label}</strong>`;
        header.style.cssText = `margin-top: 12px; margin-bottom: 8px; font-size: 0.8rem; color: ${cat.color}; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;`;
        varList.appendChild(header);

        cat.metrics.forEach(m => {
            const item = document.createElement("div");
            item.className = "checkbox-row";
            item.style.padding = "4px 0";
            item.innerHTML = `
                <input type="radio" name="targetVar" value="${m.id}" id="var-${m.id}" ${m.id === currentTargetVar ? 'checked' : ''}>
                <label for="var-${m.id}" style="font-size: 0.85rem; margin-left: 8px; cursor: pointer;">${m.label}</label>
            `;
            varList.appendChild(item);
        });
    });

    document.getElementById("runAnalysisBtn").addEventListener("click", () => {
        const selected = document.querySelector('input[name="targetVar"]:checked');
        if (selected) {
            currentTargetVar = selected.value;
            currentScope = document.getElementById("stateFilter").value;
            runAnalysis();
        }
    });

    // Info Modal Logic
    const infoBtn = document.getElementById("infoBtn");
    const infoModal = document.getElementById("infoModal");
    const closeBtn = document.getElementById("closeModalBtn");

    if (infoBtn && infoModal) {
        infoBtn.onclick = () => {
            infoModal.classList.add("active");
            // Render math if KaTeX is available
            if (typeof renderMathInElement === 'function') {
                renderMathInElement(infoModal, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false },
                        { left: '\\(', right: '\\)', display: false },
                        { left: '\\[', right: '\\]', display: true }
                    ],
                    throwOnError: false
                });
            }
        };
    }
    if (closeBtn && infoModal) {
        closeBtn.onclick = () => infoModal.classList.remove("active");
    }
    window.onclick = (e) => {
        if (e.target === infoModal) infoModal.classList.remove("active");
    };
    
    // Legend Interaction (Handles both map and scatterplot legends)
    document.querySelectorAll(".quadrant-legend .legend-item").forEach(item => {
        item.addEventListener("click", () => {
            const type = item.getAttribute("data-type");
            
            // Toggle highlight
            currentHighlight = (currentHighlight === type) ? null : type;
            
            // Update all relevant Legend UIs
            document.querySelectorAll(".quadrant-legend .legend-item").forEach(li => {
                li.classList.toggle("active", li.getAttribute("data-type") === currentHighlight);
            });
            
            // Refresh Visuals
            renderScatterplot();
            updateMapColors();
            updateSignificantTable();
        });
    });

    // Map Mode Toggle
    document.querySelectorAll('input[name="mapMode"]').forEach(el => {
        el.addEventListener("change", (e) => {
            currentMapMode = e.target.value;
            updateLegendUI();
            updateMapColors();
        });
    });

    // Handle Window Resize
    window.addEventListener("resize", () => {
        if (scatterplot) renderScatterplot();
    });
}

function initWorker() {
    spatialWorker = new Worker('js/spatial_worker.js');
    spatialWorker.onmessage = function(e) {
        if (e.data.type === 'progress') {
            const { percent, status } = e.data;
            document.getElementById("progressBar").style.width = percent + "%";
            document.getElementById("progressText").textContent = percent + "%";
            document.getElementById("progressStatusText").textContent = status;
            
            // Update SVG circle if it exists
            const circle = document.getElementById("svgProgressCircle");
            if (circle) {
                const r = 54;
                const circumference = 2 * Math.PI * r;
                const offset = circumference - (percent / 100) * circumference;
                circle.style.strokeDashoffset = offset;
            }
        } else if (e.data.success) {
            analysisResults = e.data.results;
            updateUIWithResults();
        } else if (e.data.success === false) {
            showError(e.data.error);
        }
    };
}

// =========================================
// DATA LOADING
// =========================================

async function loadData() {
    try {
        const [acsRes, placesRes] = await Promise.all([
            fetch("data/ACS Data/county_acs_flat.json"),
            fetch("data/PLACES Data/county_places_flat.json")
        ]);
        const acsData = await acsRes.json();
        const placesData = await placesRes.json();

        // Robust matching logic lookup
        const placesLookup = {};
        placesData.forEach(d => {
            if (d.id) {
                // Store by raw ID
                placesLookup[d.id.toLowerCase()] = d;
                
                // Store by normalized key for robust matching
                const stateAbbr = (d.state_abbr || "").toLowerCase();
                const name = d.name || "";
                const normalizedName = normalizeForMatch(name);
                placesLookup[`${stateAbbr}_${normalizedName}`] = d;
            }
        });

        countyData = acsData.map(acs => {
            const stateAbbr = (acs.state_abbr || "").toLowerCase();
            const rawName = acs.name || "";
            const normalizedName = normalizeForMatch(rawName);
            
            // Try matching by ID first, then by normalized Name+State
            const places = placesLookup[acs.id.toLowerCase()] || 
                           placesLookup[`${stateAbbr}_${normalizedName}`] || {};
            
            return { ...acs, ...places, id: acs.id, name: acs.name, state_abbr: acs.state_abbr };
        });

        console.log("Joined data for", countyData.length, "counties.");
    } catch (err) {
        console.error("Data loading error:", err);
        showError("Failed to load data. Please check connection.");
    }
}

function normalizeForMatch(name) {
    if (!name) return "";
    return name.toLowerCase()
        .replace(/_/g, " ")
        .replace(/\s+county$/i, "")
        .replace(/\s+parish$/i, "")
        .replace(/\s+borough$/i, "")
        .replace(/\s+census\s+area$/i, "")
        .replace(/\s+municipality$/i, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();
}

function populateControls() {
    const stateFilter = document.getElementById("stateFilter");
    const states = [...new Set(countyData.map(d => d.state_name))].sort();
    
    states.forEach(state => {
        const opt = document.createElement("option");
        opt.value = state;
        opt.textContent = state;
        stateFilter.appendChild(opt);
    });
}

// =========================================
// MAP RENDERING (amCharts 5)
// =========================================

function initMap() {
    try {
        am5root = am5.Root.new("mapContainer");
        am5root.setThemes([am5themes_Animated.new(am5root)]);

        mapChart = am5root.container.children.push(am5map.MapChart.new(am5root, {
            panX: "rotateX",
            panY: "none",
            projection: am5map.geoAlbersUsa(),
        }));

        polygonSeries = mapChart.series.push(am5map.MapPolygonSeries.new(am5root, {
            geoJSON: am5geodata_region_usa_usaCountiesLow,
            valueField: "value",
            calculateAggregates: true
        }));

        polygonSeries.mapPolygons.template.setAll({
            tooltipText: "{name}",
            fill: am5.color(0xf8fafc), // Premium Light Slate
            stroke: am5.color(0xffffff), // Clean White Stroke
            strokeWidth: 0.5,
            interactive: true
        });

        polygonSeries.mapPolygons.template.states.create("hover", {
            fill: am5.color(0x64748b)
        });

        // Add Adapters ONCE
        polygonSeries.mapPolygons.template.adapters.add("fill", (fill, target) => {
            const d = target.dataItem.dataContext;
            if (!d) return am5.color(0xf8fafc);
            
            // Base color for non-significant
            if (!d.isSignificant) {
                return currentHighlight ? am5.color(0xf8fafc) : am5.color(0xe2e8f0);
            }

            if (currentMapMode === "significance") {
                // Significance Map logic (per Lab 6a)
                const p = d.p || 1;
                if (p < 0.001) return am5.color(0x166534); // Dark Green
                if (p < 0.01) return am5.color(0x22c55e);  // Medium Green
                if (p < 0.05) return am5.color(0x86efac);  // Light Green
                return am5.color(0xe2e8f0);
            }

            // Cluster Map logic
            let color;
            switch(d.type) {
                case 'HH': color = am5.color(0xc83830); break;
                case 'LL': color = am5.color(0x0ea5e9); break;
                case 'HL': color = am5.color(0xfca5a5); break;
                case 'LH': color = am5.color(0x7dd3fc); break;
                default: color = am5.color(0xe2e8f0);
            }

            // Apply dimming if highlighted
            if (currentHighlight && d.type !== currentHighlight) {
                return am5.color(0xf1f5f9); 
            }
            return color;
        });

        polygonSeries.mapPolygons.template.adapters.add("fillOpacity", (opacity, target) => {
            const d = target.dataItem.dataContext;
            if (currentHighlight && d && d.type !== currentHighlight) return 0.4;
            return 1;
        });

        polygonSeries.mapPolygons.template.adapters.add("strokeOpacity", (opacity, target) => {
            return 1; // Always show outlines
        });

        // Add zoom control
        mapChart.set("zoomControl", am5map.ZoomControl.new(am5root, {}));

        // Bind data when available
        polygonSeries.events.on("datavalidated", () => {
            console.log("Map data validated");
        });
    } catch (err) {
        console.error("MAP INITIALIZATION ERROR:", err);
        showError("Map failed to load: " + err.message);
    }
}

function updateMapColors() {
    if (!analysisResults) return;

    // Determine target state abbreviation if scope is specific
    let targetStateAbbr = stateToAbbr[currentScope] || null;
    
    // If state scope changed, handle geodata reload if necessary
    if (targetStateAbbr) {
        const geoKey = "am5geodata_region_usa_" + targetStateAbbr.toLowerCase() + "Low";
        if (window[geoKey]) {
            applyStateGeodata(window[geoKey], targetStateAbbr);
        } else {
            // Dynamically load via script
            const script = document.createElement("script");
            script.src = `https://cdn.amcharts.com/lib/5/geodata/region/usa/${targetStateAbbr.toLowerCase()}Low.js`;
            script.onload = () => {
                if (window[geoKey]) applyStateGeodata(window[geoKey], targetStateAbbr);
            };
            document.head.appendChild(script);
            return; // Exit and wait for onload
        }
    } else {
        // Revert to National if scope is All
        if (polygonSeries.get("geoJSON") !== am5geodata_region_usa_usaCountiesLow) {
            polygonSeries.set("geoJSON", am5geodata_region_usa_usaCountiesLow);
            mapChart.set("projection", am5map.geoAlbersUsa());
            mapChart.goHome();
        }
        applyResultsToMap();
    }
}

function applyStateGeodata(geodata, abbr) {
    polygonSeries.set("geoJSON", geodata);
    // When using state geodata, AlbersUsa is still fine, or let amCharts handle bounds
    mapChart.set("projection", am5map.geoAlbersUsa());
    
    // Zoom to specific state
    setTimeout(() => {
        mapChart.goHome();
    }, 100);
    
    applyResultsToMap();
}

function applyResultsToMap() {
    let targetStateAbbr = stateToAbbr[currentScope] || null;

    // Create a lookup for fast matching using normalized keys
    const lookup = {};
    analysisResults.local.forEach(res => {
        const county = countyData.find(c => c.id === res.id);
        if (county) {
            const key = (county.state_abbr || "").toUpperCase() + "_" + normalizeCountyName(county.name);
            lookup[key] = res;
        }
    });

    const mapData = [];
    const geoJSON = polygonSeries.get("geoJSON");
    const features = geoJSON ? geoJSON.features : [];

    features.forEach(feature => {
        const pId = feature.id;
        const name = feature.properties.name || "";
        let stateAbbr = "";
        
        if (feature.properties && feature.properties.STATE) {
            stateAbbr = feature.properties.STATE;
        } else {
            // In state geodata, it might be just FIPS or ID
            const parts = pId.split("-");
            stateAbbr = targetStateAbbr || (parts.length >= 2 ? parts[1] : "");
        }

        const normalizedState = stateAbbr.toUpperCase();
        const key = normalizedState + "_" + normalizeCountyName(name);
        const res = lookup[key];
        
        // Visibility check: In state-only geodata, all are relevant
        const isVisible = true; 

        if (res) {
            mapData.push({
                id: pId,
                name: name,
                value: res.statistic,
                type: res.type,
                p: res.p,
                isSignificant: res.isSignificant
            });
        } else {
            mapData.push({ 
                id: pId, 
                name: name,
                value: null, 
                p: 1,
                isSignificant: false
            });
        }
    });

    polygonSeries.data.setAll(mapData);
    
    // Force refresh of visible polygons to apply colors
    polygonSeries.mapPolygons.each(polygon => {
        polygon.set("fill", polygon.get("fill")); 
    });
}

function normalizeCountyName(name) {
    if (!name) return "";
    return name.toLowerCase()
        .replace(/\s+county$/i, "")
        .replace(/\s+parish$/i, "")
        .replace(/\s+borough$/i, "")
        .replace(/[^a-z0-9]/g, "");
}

// =========================================
// ANALYSIS ENGINE
// =========================================

function runAnalysis() {
    document.getElementById("emptyState").style.display = "none";
    document.getElementById("resultsDisplay").style.display = "none";
    document.getElementById("progressContainer").style.display = "flex";
    
    // Clear previous results/table
    const tbody = document.getElementById("resultsTableBody");
    if (tbody) tbody.innerHTML = "";

    setTimeout(() => {
        // Data Preparation
        const scopedData = currentScope === "All" ? 
            countyData : 
            countyData.filter(d => d.state_abbr === currentScope || d.state_name === currentScope);

        const validCounties = scopedData.filter(d => {
            const val = parseFloat(d[currentTargetVar]);
            return !isNaN(val);
        });

        if (validCounties.length === 0) {
            showError(`No valid data points for ${metricLabels[currentTargetVar] || currentTargetVar} in the selected scope.`);
            return;
        }

        const values = validCounties.map(d => parseFloat(d[currentTargetVar]));
        const ids = validCounties.map(d => {
            // Ensure ID is stable and unique for mapping
            return d.id;
        });
        
        // Calculate neighbors
        const neighbors = calculateNeighbors(validCounties);
        const correction = document.getElementById("correctionMethod").value;
        const permutations = parseInt(document.getElementById("permutationCount").value) || 499;

        spatialWorker.postMessage({
            action: 'calculate',
            data: {
                values: values,
                ids: ids,
                neighbors: neighbors
            },
            config: { 
                permutations: permutations,
                correction: correction
            }
        });
    }, 100);
}

function calculateNeighbors(data) {
    const n = data.length;
    const neighbors = new Array(n);
    const method = document.getElementById("neighborMethod") ? 
        document.getElementById("neighborMethod").value : 
        (document.getElementById("weightMethod") ? document.getElementById("weightMethod").value : "queen");
    
    // 1. Get geometry data (centroids and bounding boxes)
    const geometries = getGeometriesFromMap(data);

    if (method === 'knn') {
        const K = 8;
        for (let i = 0; i < n; i++) {
            neighbors[i] = [];
            const c_i = geometries[i]?.centroid;
            if (!c_i) continue;

            const distances = [];
            for (let j = 0; j < n; j++) {
                if (i === j) continue;
                const c_j = geometries[j]?.centroid;
                if (!c_j) continue;

                const d_ij = Math.sqrt((c_i.x - c_j.x)**2 + (c_i.y - c_j.y)**2);
                distances.push({ index: j, dist: d_ij });
            }
            distances.sort((a,b) => a.dist - b.dist);
            neighbors[i] = distances.slice(0, Math.min(K, distances.length)).map(d => d.index);
        }
    } else if (method === 'distance') {
        // Fixed radius - roughly 1.5 degrees (~100 miles)
        const radius = 1.5; 
        for (let i = 0; i < n; i++) {
            neighbors[i] = [];
            const c_i = geometries[i]?.centroid;
            if (!c_i) continue;

            for (let j = 0; j < n; j++) {
                if (i === j) continue;
                const c_j = geometries[j]?.centroid;
                if (!c_j) continue;

                const d_ij = Math.sqrt((c_i.x - c_j.x)**2 + (c_i.y - c_j.y)**2);
                if (d_ij <= radius) neighbors[i].push(j);
            }
        }
    } else {
        // Default: Queen Contiguity (Approximated via bounding box intersection with buffer)
        const buffer = 0.05; // ~3 miles buffer to catch touching edges
        for (let i = 0; i < n; i++) {
            neighbors[i] = [];
            const b_i = geometries[i]?.bbox;
            if (!b_i) continue;

            for (let j = 0; j < n; j++) {
                if (i === j) continue;
                const b_j = geometries[j]?.bbox;
                if (!b_j) continue;

                // Check if bounding boxes overlap with small buffer
                const overlap = (b_i.minX - buffer <= b_j.maxX) && (b_i.maxX + buffer >= b_j.minX) &&
                                (b_i.minY - buffer <= b_j.maxY) && (b_i.maxY + buffer >= b_j.minY);
                
                if (overlap) neighbors[i].push(j);
            }
        }
    }
    return neighbors;
}

function getGeometriesFromMap(data) {
    const geoJSON = am5geodata_region_usa_usaCountiesLow;
    if (!geoJSON) return data.map(() => null);

    const featureMap = {};
    geoJSON.features.forEach(f => {
        const state = f.properties.STATE || (f.id ? f.id.split("-")[1] : "");
        const name = normalizeCountyName(f.properties.name);
        featureMap[state + "_" + name] = f;
    });

    return data.map(d => {
        const key = (d.state_abbr || "").toUpperCase() + "_" + normalizeCountyName(d.name);
        const feature = featureMap[key];
        if (!feature || !feature.geometry) return null;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const coords = feature.geometry.coordinates;
        
        function process(c) {
            if (Array.isArray(c[0])) c.forEach(process);
            else {
                minX = Math.min(minX, c[0]); minY = Math.min(minY, c[1]);
                maxX = Math.max(maxX, c[0]); maxY = Math.max(maxY, c[1]);
            }
        }
        process(coords);
        
        return { 
            centroid: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
            bbox: { minX, minY, maxX, maxY }
        };
    });
}

function updateUIWithResults() {
    document.getElementById("progressContainer").style.display = "none";
    document.getElementById("resultsDisplay").style.display = "block";

    // Update Vitals
    document.getElementById("globalMoranValue").textContent = analysisResults.global.i.toFixed(4);
    document.getElementById("zScoreValue").textContent = analysisResults.global.z.toFixed(2);
    document.getElementById("pValue").textContent = analysisResults.global.p.toFixed(4);
    
    const sigCount = analysisResults.local.filter(l => l.isSignificant).length;
    document.getElementById("clusterCount").textContent = sigCount;

    // Render Plots
    renderScatterplot();
    updateMapColors();
    updateSignificantTable();
}

// =========================================
// SCATTERPLOT (D3)
// =========================================

function renderScatterplot() {
    const container = document.getElementById("scatterplotContainer");
    container.innerHTML = "";
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };

    const svg = d3.select("#scatterplotContainer")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const data = analysisResults.local;
    
    const xz = data.map(d => d.z);
    const yl = data.map(d => d.lag);

    const x = d3.scaleLinear()
        .domain([d3.min(xz)-0.5, d3.max(xz)+0.5])
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([d3.min(yl)-0.5, d3.max(yl)+0.5])
        .range([height - margin.bottom, margin.top]);

    // Axes
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    // Quadrant lines
    svg.append("line")
        .attr("x1", x(0)).attr("y1", margin.top)
        .attr("x2", x(0)).attr("y2", height - margin.bottom)
        .attr("stroke", "#cbd5e1").attr("stroke-dasharray", "4");

    svg.append("line")
        .attr("x1", margin.left).attr("y1", y(0))
        .attr("x2", width - margin.right).attr("y2", y(0))
        .attr("stroke", "#cbd5e1").attr("stroke-dasharray", "4");

    // Points
    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.z))
        .attr("cy", d => y(d.lag))
        .attr("r", 5)
        .attr("fill", d => {
            if (!d.isSignificant) return "#e2e8f0";
            switch(d.type) {
                case 'HH': return "#c83830";
                case 'LL': return "#0ea5e9";
                case 'HL': return "#fca5a5";
                case 'LH': return "#7dd3fc";
                default: return "#e2e8f0";
            }
        })
        .attr("opacity", d => {
            if (!currentHighlight) return d.isSignificant ? 0.7 : 0.2;
            return d.type === currentHighlight ? 1.0 : 0.05;
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .on("mouseover", function(event, d) {
            if (currentHighlight && d.type !== currentHighlight) return;
            d3.select(this).attr("r", 8).attr("opacity", 1);
            showTooltip(event, d);
        })
        .on("mouseout", function(event, d) {
            d3.select(this).attr("r", 5).attr("opacity", () => {
                if (!currentHighlight) return d.isSignificant ? 0.7 : 0.2;
                return d.type === currentHighlight ? 1.0 : 0.05;
            });
            hideTooltip();
        });
}

// =========================================
// TABLE & HELPERS
// =========================================

function updateSignificantTable() {
    const tbody = document.getElementById("significantTableBody");
    tbody.innerHTML = "";

    let sigData = analysisResults.local
        .filter(d => d.isSignificant);
    
    if (currentHighlight) {
        sigData = sigData.filter(d => d.type === currentHighlight);
    }

    sigData = sigData.sort((a, b) => a.p - b.p)
        .slice(0, 100);

    sigData.forEach(d => {
        const county = countyData.find(c => c.id === d.id);
        if (!county) return;
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${county.name}</td>
            <td>${county.state_abbr}</td>
            <td>${d.z.toFixed(2)}</td>
            <td>${d.lag.toFixed(2)}</td>
            <td>${d.statistic.toFixed(4)}</td>
            <td><span class="legend-color ${d.type.toLowerCase()}" style="display:inline-block; width:10px; height:10px; margin-right:5px;"></span> ${d.type}</td>
            <td>${d.p < 0.001 ? '< 0.001' : d.p.toFixed(4)}</td>
        `;
        tbody.appendChild(row);
    });
}

function updateLegendUI() {
    const mapClusterLegend = document.getElementById("mapClusterLegend");
    const sigLegend = document.getElementById("significanceLegend");
    
    if (currentMapMode === "cluster") {
        if (mapClusterLegend) mapClusterLegend.style.display = "flex";
        if (sigLegend) sigLegend.style.display = "none";
    } else {
        if (mapClusterLegend) mapClusterLegend.style.display = "none";
        if (sigLegend) sigLegend.style.display = "flex";
    }
}

function showTooltip(event, d) {
    const tooltip = document.getElementById("regTooltip");
    const county = countyData.find(c => c.id === d.id);
    if (!county) return;
    tooltip.innerHTML = `
        <strong>${county.name}, ${county.state_abbr}</strong><br>
        Z-Score: ${d.z.toFixed(2)}<br>
        Spatial Lag: ${d.lag.toFixed(2)}<br>
        Type: ${d.type}<br>
        P-Value: ${d.p.toFixed(4)}
    `;
    tooltip.style.opacity = 1;
    tooltip.style.left = (event.pageX + 10) + "px";
    tooltip.style.top = (event.pageY - 20) + "px";
}

function hideTooltip() {
    document.getElementById("regTooltip").style.opacity = 0;
}

function showError(msg) {
    const display = document.getElementById("errorDisplay");
    document.getElementById("errorMessageText").textContent = msg;
    display.style.display = "block";
    document.getElementById("progressContainer").style.display = "none";
}
