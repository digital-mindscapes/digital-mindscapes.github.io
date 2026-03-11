/**
 * Dimensionality Reduction (PCA) Engine
 * Calculates Principal Component Analysis via SVD/Eigen decomposition using Math.js and D3.
 */

document.addEventListener('DOMContentLoaded', () => {
    initPCASandbox();
});

let dataset = [];
let allStates = [];

const REGION_STATES = {
    "Northeast": ["Connecticut", "Maine", "Massachusetts", "New Hampshire", "Rhode Island", "Vermont", "New Jersey", "New York", "Pennsylvania"],
    "Midwest": ["Illinois", "Indiana", "Iowa", "Kansas", "Michigan", "Minnesota", "Missouri", "Nebraska", "North Dakota", "Ohio", "South Dakota", "Wisconsin"],
    "South": ["Alabama", "Arkansas", "Delaware", "Florida", "Georgia", "Kentucky", "Louisiana", "Maryland", "Mississippi", "North Carolina", "Oklahoma", "South Carolina", "Tennessee", "Texas", "Virginia", "West Virginia", "District of Columbia"],
    "West": ["Alaska", "Arizona", "California", "Colorado", "Hawaii", "Idaho", "Montana", "Nevada", "New Mexico", "Oregon", "Utah", "Washington", "Wyoming"]
};

const HEALTH_METRICS = [
    { id: 'depression_prevalence', label: 'Depression' },
    { id: 'obesity_prevalence', label: 'Obesity' },
    { id: 'diabetes_prevalence', label: 'Diabetes' },
    { id: 'arthritis_prevalence', label: 'Arthritis' },
    { id: 'asthma_prevalence', label: 'Asthma' },
    { id: 'high_blood_pressure_prevalence', label: 'High BP' },
    { id: 'coronary_heart_disease_prevalence', label: 'Heart Disease' },
    { id: 'stroke_prevalence', label: 'Stroke' },
    { id: 'cancer_prevalence', label: 'Cancer' },
    { id: 'smoking_prevalence', label: 'Smoking' },
    { id: 'binge_drinking_prevalence', label: 'Binge Drinking' },
    { id: 'physical_inactivity_prevalence', label: 'Physical Inact.' },
    { id: 'checkup_prevalence', label: 'Annual Checkup' }
];

const ECON_METRICS = [
    { id: 'median_household_income', label: 'Median Income' },
    { id: 'pct_unemployment_rate', label: 'Unemployment %' },
    { id: 'pct_uninsured', label: 'Uninsured %' },
    { id: 'pct_graduate_professional_degree', label: 'Graduate Degree %' },
    { id: 'pct_speak_english_less_than_very_well', label: 'Limited English' },
    { id: 'average_household_size', label: 'Household Size' },
    { id: 'pct_households_1plus_people_65plus', label: 'HH w/ Seniors %' }
];

const ALL_METRICS = [...HEALTH_METRICS, ...ECON_METRICS];

async function initPCASandbox() {
    try {
        await loadData();
        populateFilters();
        
        document.getElementById('runPCABtn').addEventListener('click', runPCAAnalysis);

        // Modal Logic
        const infoBtn = document.getElementById('infoBtn');
        const infoModal = document.getElementById('infoModal');
        const closeBtn = document.getElementById('closeModalBtn');

        if(infoBtn && infoModal) {
            infoBtn.addEventListener('click', () => infoModal.classList.add('active'));
        }
        if(closeBtn && infoModal) {
            closeBtn.addEventListener('click', () => infoModal.classList.remove('active'));
        }
        window.addEventListener('click', (e) => {
            if (e.target === infoModal) infoModal.classList.remove('active');
        });
        
    } catch (e) {
        console.error('Failed to initialize PCA sandbox', e);
    }
}

async function loadData() {
    const loader = document.getElementById('initLoader');
    if(loader) loader.style.display = 'flex';
    
    const [acsRes, placesRes] = await Promise.all([
        fetch("data/ACS Data/county_acs_flat.json"),
        fetch("data/PLACES Data/county_places_flat.json")
    ]);

    const acsData = await acsRes.json();
    const placesData = await placesRes.json();

    const placesCountyLookup = {};
    placesData.forEach(d => {
        if(d.id) {
            placesCountyLookup[d.id.toLowerCase()] = d;
        }
    });

    const stateSet = new Set();
    
    dataset = acsData.map(acs => {
        let cleanName = acs.name ? acs.name.replace(/_/g, '').replace(/\s+County$/i, '').replace(/\s+Parish$/i, '').trim() : '';
        let placesKey = `us.${acs.state_abbr}.${cleanName}`.toLowerCase();
        let places = placesCountyLookup[placesKey] || {};
        if(acs.state_name) stateSet.add(acs.state_name);
        return { ...acs, ...places, state_name: acs.state_name || 'Unknown' };
    });

    allStates = Array.from(stateSet).sort();
    if(loader) loader.style.display = 'none';
}

function populateFilters() {
    const sFilter = document.getElementById('stateFilter');
    allStates.forEach(s => {
        const o = document.createElement('option');
        o.value = s; o.textContent = s;
        sFilter.appendChild(o);
    });
    
    const xContainer = document.getElementById('xVarList');
    
    // Health Metrics Category
    const healthHeader = document.createElement('div');
    healthHeader.innerHTML = '<strong>Health Status & Outcomes</strong>';
    healthHeader.style.marginTop = '4px';
    healthHeader.style.marginBottom = '6px';
    healthHeader.style.fontSize = '0.85rem';
    healthHeader.style.color = '#c83830';
    healthHeader.style.textTransform = 'uppercase';
    healthHeader.style.letterSpacing = '0.5px';
    xContainer.appendChild(healthHeader);

    HEALTH_METRICS.forEach(m => {
        const wrapper = document.createElement('div');
        wrapper.className = 'checkbox-row';
        wrapper.innerHTML = `
            <input type="checkbox" id="chk_${m.id}" value="${m.id}">
            <label for="chk_${m.id}">${m.label}</label>
        `;
        xContainer.appendChild(wrapper);
    });

    // Socioeconomic Metrics Category
    const econHeader = document.createElement('div');
    econHeader.innerHTML = '<strong>Socioeconomic Factors</strong>';
    econHeader.style.marginTop = '16px';
    econHeader.style.marginBottom = '6px';
    econHeader.style.fontSize = '0.85rem';
    econHeader.style.color = '#0f172a';
    econHeader.style.textTransform = 'uppercase';
    econHeader.style.letterSpacing = '0.5px';
    xContainer.appendChild(econHeader);

    ECON_METRICS.forEach(m => {
        const wrapper = document.createElement('div');
        wrapper.className = 'checkbox-row';
        wrapper.innerHTML = `
            <input type="checkbox" id="chk_${m.id}" value="${m.id}">
            <label for="chk_${m.id}">${m.label}</label>
        `;
        xContainer.appendChild(wrapper);
    });
    
    // Default checked vars for PCA
    HEALTH_METRICS.slice(0, 8).forEach(m => {
        const chk = document.getElementById(`chk_${m.id}`);
        if(chk) chk.checked = true;
    });
}

function getFilteredData() {
    const rFilter = document.getElementById('regionFilter').value;
    const sFilter = document.getElementById('stateFilter').value;

    return dataset.filter(d => {
        if (sFilter !== 'All' && d.state_name !== sFilter) return false;
        if (rFilter !== 'All') {
            const statesInRegion = REGION_STATES[rFilter] || [];
            if (!statesInRegion.includes(d.state_name)) return false;
        }
        return true;
    });
}

function runPCAAnalysis() {
    const loader = document.getElementById('initLoader');
    if(loader) loader.style.display = 'flex';
    
    // Clear previous
    document.getElementById('errorDisplay').style.display = 'none';
    document.getElementById('resultsDisplay').style.display = 'none';
    if(document.getElementById('pcaEmptyState')) {
        document.getElementById('pcaEmptyState').style.display = 'none';
    }

    setTimeout(() => {
        try {
            const xCheckboxes = document.querySelectorAll('#xVarList input:checked');
            const xIds = Array.from(xCheckboxes).map(c => c.value);
            const xLabels = xIds.map(id => ALL_METRICS.find(m => m.id === id).label);
            
            if(xIds.length < 2) {
                showModelError("Please select at least 2 variables for PCA.");
                if(loader) loader.style.display = 'none';
                return;
            }

            const rawData = getFilteredData();
            let matrix_rows = [];
            let validMeta = [];

            rawData.forEach(d => {
                let row = [];
                let valid = true;
                xIds.forEach(id => {
                    let val = parseFloat(d[id]);
                    if(isNaN(val)) valid = false;
                    row.push(val);
                });
                if(valid) {
                    matrix_rows.push(row);
                    validMeta.push({ name: d.name, state: d.state_abbr, id: d.id });
                }
            });

            if(matrix_rows.length < 5) {
                showModelError("Not enough valid data points for analysis.");
                if(loader) loader.style.display = 'none';
                return;
            }

            // --- PCA MATH (Math.js) ---
            // 1. Standardize (Center and Scale)
            const n = matrix_rows.length;
            const p = xIds.length;
            
            // Transpose to work with variables as rows
            let X = math.transpose(math.matrix(matrix_rows));
            let standardizedRows = [];

            for(let j=0; j<p; j++) {
                let variableValues = X.subset(math.index(j, math.range(0, n))).toArray()[0];
                let mean = math.mean(variableValues);
                let std = math.std(variableValues);
                standardizedRows.push(variableValues.map(v => (v - mean) / (std || 1)));
            }

            const Z = math.matrix(standardizedRows); // p x n
            
            // 2. Covariance Matrix (Z * Z^T / (n-1))
            const Zt = math.transpose(Z);
            const Cov = math.multiply(math.multiply(Z, Zt), 1/(n-1));

            // 3. Eigen Decomposition
            // Math.js doesn't have a direct eig() for non-symmetric matrices in some versions, 
            // but Cov is symmetric. For simplicity and robustness, we use a power iteration or 
            // SVD if available. Here we'll use math.eigs() which is available in newer math.js.
            const eigResult = math.eigs(Cov);
            const values = eigResult.values;
            const eigenvectors = eigResult.eigenvectors;
            
            // math.eigs returns values/vectors in ascending order usually, or depends on version.
            // Let's sort them descending.
            let eigenData = values.toArray().map((v, i) => ({
                value: v,
                vector: eigenvectors[i].vector.toArray()
            })).sort((a, b) => b.value - a.value);

            const totalVariance = eigenData.reduce((sum, e) => sum + e.value, 0);
            eigenData = eigenData.map(e => ({
                ...e,
                varianceExplained: e.value / totalVariance
            }));

            // 4. Project Data onto Top PCs (max 5)
            const numComponentsToProject = Math.min(5, p);
            const topVectors = math.transpose(math.matrix(eigenData.slice(0, numComponentsToProject).map(e => e.vector)));
            const projections = math.multiply(Zt, topVectors).toArray();

            // Prepare Global Map Data
            window.pcaVariables = xLabels;
            window.pcaEigenData = eigenData;
            
            window.pcaMapData = projections.map((proj, idx) => {
                const mapObj = {
                    id: validMeta[idx].id,
                    name: validMeta[idx].name,
                    state: validMeta[idx].state,
                    standardizedValues: standardizedRows.map(row => row[idx])
                };
                proj.forEach((val, i) => {
                    mapObj[`PC${i+1}`] = val;
                });
                return mapObj;
            });
            window.pcaMapAvailableComponents = numComponentsToProject;

            // --- VISUALIZATION ---
            document.getElementById('resultsDisplay').style.display = 'block';
            document.getElementById('visualizeMapBtn').style.display = 'flex';
            
            renderScreePlot(eigenData);
            renderCumulativePlot(eigenData);
            renderBiplot(projections, eigenData, xLabels, validMeta);
            renderLoadingsTable(eigenData, xLabels);

        } catch (err) {
            console.error("PCA failed:", err);
            showModelError("Something went wrong ......");
        }
        if(loader) loader.style.display = 'none';
    }, 100);
}

function renderScreePlot(eigenData) {
    const container = d3.select("#screePlotContainer");
    container.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = container.node().clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .range([0, width])
        .domain(eigenData.map((d, i) => `PC${i+1}`))
        .padding(0.2);

    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(eigenData, d => d.varianceExplained) * 1.1]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y).tickFormat(d3.format(".0%")));

    const tooltip = d3.select("#regTooltip");

    svg.selectAll(".bar")
        .data(eigenData.slice(0, 10)) // show top 10
        .enter().append("rect")
        .attr("class", "bar")
        .attr("fill", "#c83830")
        .attr("x", d => x(`PC${eigenData.indexOf(d)+1}`))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d.varianceExplained))
        .attr("height", d => height - y(d.varianceExplained))
        .attr("rx", 4)
        .on("mouseover", function(event, d) {
            const pcIdx = eigenData.indexOf(d) + 1;
            d3.select(this).attr("fill", "#a02820");
            tooltip.style("opacity", 1)
                   .html(`<strong>Principal Component ${pcIdx}</strong><br/>Variance Explained: ${(d.varianceExplained * 100).toFixed(2)}%`)
                   .style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("fill", "#c83830");
            tooltip.style("opacity", 0);
        });
}

function renderCumulativePlot(eigenData) {
    const container = d3.select("#cumulPlotContainer");
    container.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = container.node().clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    let cumul = 0;
    const cumulData = eigenData.map((d, i) => {
        cumul += d.varianceExplained;
        return { pc: i + 1, value: cumul };
    });

    const x = d3.scaleLinear()
        .range([0, width])
        .domain([1, Math.min(eigenData.length, 10)]);

    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, 1]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(Math.min(eigenData.length, 10)));

    svg.append("g")
        .call(d3.axisLeft(y).tickFormat(d3.format(".0%")));

    const line = d3.line()
        .x(d => x(d.pc))
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX);

    svg.append("path")
        .datum(cumulData.slice(0, 10))
        .attr("fill", "none")
        .attr("stroke", "#0f172a")
        .attr("stroke-width", 3)
        .attr("d", line);

    const tooltip = d3.select("#regTooltip");

    svg.selectAll(".dot")
        .data(cumulData.slice(0, 10))
        .enter().append("circle")
        .attr("class", "dot")
        .attr("fill", "#c83830")
        .attr("cx", d => x(d.pc))
        .attr("cy", d => y(d.value))
        .attr("r", 5)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            d3.select(this).attr("r", 8).attr("fill", "#a02820");
            tooltip.style("opacity", 1)
                   .html(`<strong>Top ${d.pc} Components</strong><br/>Total Variance: ${(d.value * 100).toFixed(2)}%`)
                   .style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("r", 5).attr("fill", "#c83830");
            tooltip.style("opacity", 0);
        });
}

function renderBiplot(projections, eigenData, xLabels, meta) {
    const container = d3.select("#biplotContainer");
    container.selectAll("*").remove();

    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const width = container.node().clientWidth - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .range([0, width])
        .domain(d3.extent(projections, d => d[0])).nice();

    const y = d3.scaleLinear()
        .range([height, 0])
        .domain(d3.extent(projections, d => d[1])).nice();

    // Axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));
    svg.append("g")
        .call(d3.axisLeft(y));

    // Axis Labels
    svg.append("text")
        .attr("x", width/2)
        .attr("y", height + 45)
        .attr("text-anchor", "middle")
        .text(`Principal Component 1 (${(eigenData[0].varianceExplained*100).toFixed(1)}%)`);

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -45)
        .attr("x", -height/2)
        .attr("text-anchor", "middle")
        .text(`Principal Component 2 (${(eigenData[1].varianceExplained*100).toFixed(1)}%)`);

    // Zero lines
    svg.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", 0).attr("y2", height).attr("stroke", "#e2e8f0").attr("stroke-dasharray", "4");
    svg.append("line").attr("x1", 0).attr("x2", width).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", "#e2e8f0").attr("stroke-dasharray", "4");

    const tooltip = d3.select("#regTooltip");

    // Points
    svg.selectAll(".point")
        .data(projections)
        .enter().append("circle")
        .attr("class", "point")
        .attr("cx", d => x(d[0]))
        .attr("cy", d => y(d[1]))
        .attr("r", 3.5)
        .attr("fill", "#c83830")
        .attr("opacity", 0.6)
        .on("mouseover", function(event, d) {
            const i = projections.indexOf(d);
            const m = meta[i];
            d3.select(this).attr("r", 6).attr("opacity", 1);
            tooltip.style("opacity", 1)
                   .html(`<strong>${m.name}, ${m.state}</strong><br/>PC1: ${d[0].toFixed(2)}<br/>PC2: ${d[1].toFixed(2)}`)
                   .style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("r", 3.5).attr("opacity", 0.6);
            tooltip.style("opacity", 0);
        });

    // Loading Vectors (Arrows)
    const pc1_vectors = eigenData[0].vector;
    const pc2_vectors = eigenData[1].vector;
    
    // Scale vectors for visibility
    const vectorScale = Math.min(width, height) / 3;

    const vectorGroup = svg.append("g");

    xLabels.forEach((label, i) => {
        const vx = pc1_vectors[i] * vectorScale;
        const vy = pc2_vectors[i] * vectorScale;
        
        vectorGroup.append("line")
            .attr("x1", x(0))
            .attr("y1", y(0))
            .attr("x2", x(0) + vx)
            .attr("y2", y(0) - vy) // Y is inverted in SVG
            .attr("stroke", "#0f172a")
            .attr("stroke-width", 2)
            .attr("marker-end", "url(#arrowhead)");

        vectorGroup.append("text")
            .attr("x", x(0) + vx * 1.1)
            .attr("y", y(0) - vy * 1.1)
            .attr("font-size", "10px")
            .attr("font-weight", "bold")
            .attr("text-anchor", vx > 0 ? "start" : "end")
            .text(label);
    });

    // Arrowhead marker
    svg.append("defs").append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 8)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#0f172a");
}

function renderLoadingsTable(eigenData, xLabels) {
    const header = document.getElementById('loadingsHeader');
    header.innerHTML = '<th>Variable</th><th>PC1</th><th>PC2</th><th>PC3</th>';
    
    const body = document.getElementById('loadingsBody');
    body.innerHTML = '';

    xLabels.forEach((label, i) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="font-weight:600;">${label}</td>
            <td style="color:${eigenData[0].vector[i] > 0 ? '#15803d' : '#b91c1c'}">${eigenData[0].vector[i].toFixed(3)}</td>
            <td style="color:${eigenData[1].vector[i] > 0 ? '#15803d' : '#b91c1c'}">${eigenData[1].vector[i].toFixed(2)}</td>
            <td style="color:${eigenData[2] ? (eigenData[2].vector[i] > 0 ? '#15803d' : '#b91c1c') : '#ccc'}">${eigenData[2] ? eigenData[2].vector[i].toFixed(3) : '-'}</td>
        `;
        body.appendChild(row);
    });
}

function showModelError(msg) {
    const errContainer = document.getElementById('errorDisplay');
    const errText = document.getElementById('errorMessageText');
    if (errContainer && errText) {
        errText.textContent = msg;
        errContainer.style.display = 'block';
        errContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// =========================================
// MAP VISUALIZATION (amCharts)
// =========================================

let amMapRoot = null;
let mapPolygonSeries = null;
let currentSelectedPC = "PC1";
let lastProcessedMapState = null;

document.getElementById('visualizeMapBtn').addEventListener('click', () => {
    document.getElementById('mapModal').style.display = 'flex';
    document.getElementById('pcaCountyBreakdownContainer').style.display = 'none'; // reset table on open
    if(mapPolygonSeries) {
        mapPolygonSeries.mapPolygons.each(p => p.set("active", false)); // remove any clicks
    }
    initPCAMapModal();
});

document.getElementById('closeMapModalBtn').addEventListener('click', () => {
    document.getElementById('mapModal').style.display = 'none';
});

document.getElementById('pcaToggle').addEventListener('change', (e) => {
    currentSelectedPC = e.target.value;
    updatePCAMapData();
});

function initPCAMapModal() {
    const toggle = document.getElementById('pcaToggle');
    toggle.innerHTML = '';
    
    // Populate dropdown based on available components
    for(let i=1; i<=window.pcaMapAvailableComponents; i++) {
        const option = document.createElement('option');
        option.value = `PC${i}`;
        option.textContent = `Principal Component ${i}`;
        toggle.appendChild(option);
    }
    
    currentSelectedPC = "PC1";
    toggle.value = currentSelectedPC;

    const currentStateFilter = document.getElementById('stateFilter').value;

    if (amMapRoot && lastProcessedMapState !== currentStateFilter) {
        amMapRoot.dispose();
        amMapRoot = null;
    }
    lastProcessedMapState = currentStateFilter;

    // Initialize amCharts if not already done
    if(!amMapRoot) {
        if (currentStateFilter !== "All") {
            const match = dataset.find(d => d.state_name === currentStateFilter);
            if (match && match.state_abbr) {
                const targetAbbr = match.state_abbr.toLowerCase(); // must be lowercase for amCharts
                const geoKey = "am5geodata_region_usa_" + targetAbbr + "Low";

                if (window[geoKey]) {
                    renderPCAMapCore(window[geoKey], am5map.geoMercator());
                } else {
                    const script = document.createElement("script");
                    script.src = `https://cdn.amcharts.com/lib/5/geodata/region/usa/${targetAbbr}Low.js`;
                    script.onload = () => {
                        if (window[geoKey]) {
                            renderPCAMapCore(window[geoKey], am5map.geoMercator());
                        } else {
                            console.warn("Geodata not found for " + targetAbbr + ", showing US map");
                            renderPCAMapCore(am5geodata_region_usa_usaCountiesLow, am5map.geoAlbersUsa());
                        }
                    };
                    script.onerror = () => {
                        console.warn("Could not load county geodata for " + targetAbbr + ", showing US map");
                        renderPCAMapCore(am5geodata_region_usa_usaCountiesLow, am5map.geoAlbersUsa());
                    };
                    document.head.appendChild(script);
                }
                return; // Exit here, renderPCAMapCore handles the rest asynchronously
            }
        }
        
        // Default to all US
        renderPCAMapCore(am5geodata_region_usa_usaCountiesLow, am5map.geoAlbersUsa());
    } else {
        updatePCAMapData();
    }
}

function renderPCAMapCore(activeGeoJSON, projectionAlg) {
    amMapRoot = am5.Root.new("pcaMapChartDiv");
    amMapRoot.setThemes([am5themes_Animated.new(amMapRoot)]);

    const mapChart = amMapRoot.container.children.push(am5map.MapChart.new(amMapRoot, {
        panX: "translateX",
        panY: "translateY",
        wheelY: "zoom",
        projection: projectionAlg,
        paddingTop: 40,
        paddingBottom: 100 // Increased padding to force the map polygons upward
    }));

    mapPolygonSeries = mapChart.series.push(am5map.MapPolygonSeries.new(amMapRoot, {
        geoJSON: activeGeoJSON,
        valueField: "value",
        calculateAggregates: true
    }));

    // Dynamic heat rules setup when data updates
    mapPolygonSeries.mapPolygons.template.setAll({
        tooltipText: "{name}: [bold]{value}[/] (Score)",
        stroke: am5.color(0xffffff),
        strokeWidth: 0.5,
        interactive: true,
        cursorOverStyle: "pointer"
    });

    mapPolygonSeries.mapPolygons.template.adapters.add("fill", function(fill, target) {
        if (target.dataItem && (target.dataItem.get("value") === null || target.dataItem.get("value") === undefined)) {
            return am5.color(0xe2e8f0); // Ash grey for missing data
        }
        return fill;
    });

    mapPolygonSeries.mapPolygons.template.adapters.add("tooltipText", function (text, target) {
        const dataItem = target.dataItem;
        if (dataItem) {
            const val = dataItem.get("value");
            if (val === null || val === undefined) return "{name}: N/A";
            return "{name}: [bold]{value}[/] (" + currentSelectedPC + ")";
        }
        return text;
    });

    // Click handler for county breakdown
    mapPolygonSeries.mapPolygons.template.events.on("click", function(ev) {
        const dataItem = ev.target.dataItem;
        if(!dataItem) return;

        // Manage active state
        mapPolygonSeries.mapPolygons.each(p => p.set("active", false));
        ev.target.set("active", true);

        const pId = dataItem.get("id");
        const cName = dataItem.dataContext ? dataItem.dataContext.name : dataItem.get("name");
        renderCountyPCABreakdown(pId, cName);
    });

    mapPolygonSeries.mapPolygons.template.states.create("active", {
        stroke: am5.color(0x000000),
        strokeWidth: 2
    });

    const heatLegend = amMapRoot.container.children.push(am5.HeatLegend.new(amMapRoot, {
        orientation: "horizontal",
        startColor: am5.color(0x3b82f6), // Blue 
        endColor: am5.color(0xef4444),   // Red
        startText: "Negative Component Score",
        endText: "Positive Component Score",
        stepCount: 5,
        paddingTop: 10,
        paddingBottom: 15
    }));

    heatLegend.setAll({
        y: am5.percent(100),
        centerY: am5.percent(100),
        x: am5.percent(50),
        centerX: am5.percent(50),
        width: am5.percent(70),
        layer: 30
    });

    if(window.innerWidth <= 768) {
        heatLegend.set("forceHidden", true);
    } else {
        // Hover logic to show value on legend
        mapPolygonSeries.mapPolygons.template.events.on("pointerover", function(ev) {
            const val = ev.target.dataItem.get("value");
            if (val !== null && val !== undefined) {
                heatLegend.showValue(val);
            }
        });
        mapPolygonSeries.mapPolygons.template.events.on("pointerout", function(ev) {
            heatLegend.hideTooltip();
        });
    }

    mapPolygonSeries.events.on("datavalidated", function () {
        heatLegend.set("startValue", mapPolygonSeries.getPrivate("valueLow"));
        heatLegend.set("endValue", mapPolygonSeries.getPrivate("valueHigh"));
    });

    // Store globally to manipulate easily later if needed
    window.pcaHeatLegend = heatLegend;

    mapChart.appear(1000, 100);
    
    updatePCAMapData();
}

function normalizeCountyNameMap(name) {
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
    return n.replace(/[^a-z0-9]/g, "");
}

function updatePCAMapData() {
    if(!amMapRoot || !mapPolygonSeries || !window.pcaMapData) return;

    const mapData = [];
    const geoJSON = mapPolygonSeries.get("geoJSON");
    const geoFeatures = geoJSON ? geoJSON.features : [];
    
    // Create quick lookup from mapData
    const lookup = {};
    window.pcaMapData.forEach(d => {
        if(d.name && d.state) {
            lookup[d.state.toUpperCase() + "_" + normalizeCountyNameMap(d.name)] = d;
        }
    });

    let minVal = Infinity;
    let maxVal = -Infinity;

    geoFeatures.forEach(feature => {
        const pId = feature.id; // e.g., US-AL-001
        if (!pId) return;

        let stateAbbr = "";
        if (feature.properties && feature.properties.STATE) {
            stateAbbr = feature.properties.STATE;
        } else {
            const parts = pId.split("-");
            if (parts.length >= 3) stateAbbr = parts[1];
        }

        const name = feature.properties.name || "";
        const dataObj = lookup[stateAbbr + "_" + normalizeCountyNameMap(name)];
        
        let val = null;
        if(dataObj && dataObj[currentSelectedPC] !== undefined && dataObj[currentSelectedPC] !== null) {
            val = Number(dataObj[currentSelectedPC].toFixed(3));
            if(val < minVal) minVal = val;
            if(val > maxVal) maxVal = val;
        }

        mapData.push({
            id: pId,
            value: val,
            name: name || dataObj?.name,
            countyData: dataObj
        });
    });

    mapPolygonSeries.data.setAll(mapData);

    // Update Heat Rules based on current min/max to differentiate positive/negative scores
    mapPolygonSeries.set("heatRules", [{
        target: mapPolygonSeries.mapPolygons.template,
        dataField: "value",
        min: am5.color(0x3b82f6), // Blue for negative PC scores
        max: am5.color(0xef4444), // Red for positive PC scores
        key: "fill"
    }]);

    // Update table if it's open
    const activeCounty = mapPolygonSeries.mapPolygons.values.find(p => p.get("active"));
    if(activeCounty && activeCounty.dataItem) {
        const cName = activeCounty.dataItem.dataContext ? activeCounty.dataItem.dataContext.name : activeCounty.dataItem.get("name");
        renderCountyPCABreakdown(activeCounty.dataItem.get("id"), cName);
    }
}

function renderCountyPCABreakdown(geoId, printName) {
    const container = document.getElementById('pcaCountyBreakdownContainer');
    const tableBody = document.getElementById('pcaCountyBreakdownBody');
    const titleEl = document.getElementById('pcaCountyBreakdownTitle');
    
    if(!container || !tableBody || !titleEl) return;
    
    // Find the specific item directly from map series data to easily get countyData attached
    let dataItemObj = null;
    mapPolygonSeries.data.each(d => {
        if(d.id === geoId) dataItemObj = d;
    });

    if(!dataItemObj || !dataItemObj.countyData) {
        container.style.display = 'none';
        return;
    }

    const cData = dataItemObj.countyData;
    
    // Get the index of the selected component (e.g. "PC1" -> 0)
    const pcIndex = parseInt(currentSelectedPC.replace("PC", "")) - 1;
    const pcEigen = window.pcaEigenData[pcIndex];
    if(!pcEigen) return;
    let pNameStr = printName || (dataItemObj.name) || "Selected Area";
    titleEl.textContent = `Variable Contributions for ${pNameStr} (${currentSelectedPC})`;
    tableBody.innerHTML = '';

    const vars = window.pcaVariables;
    const stdVals = cData.standardizedValues; // Length is same as vars
    const weights = pcEigen.vector;

    // Build contributions array for sorting
    let contributions = [];
    for(let i=0; i<vars.length; i++) {
        let weight = weights[i];
        let stdVal = stdVals[i];
        let contrib = weight * stdVal;

        contributions.push({
            variable: vars[i],
            weight: weight,
            standardized: stdVal,
            contribution: contrib
        });
    }

    // Sort by absolute contribution descending to show biggest drivers
    contributions.sort((a,b) => Math.abs(b.contribution) - Math.abs(a.contribution));

    let totalScore = 0;
    contributions.forEach((item, index) => {
        totalScore += item.contribution;
        const row = document.createElement('tr');
        
        // Add alternating row colors for better visibility
        row.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        row.style.borderBottom = '1px solid #e2e8f0';
        
        const isPosC = item.contribution > 0;
        
        row.innerHTML = `
            <td style="padding: 12px; font-weight:600; color: #334155;">${item.variable}</td>
            <td style="padding: 12px; color: #64748b;">${item.weight.toFixed(3)}</td>
            <td style="padding: 12px; color: #64748b;">${item.standardized.toFixed(3)}</td>
            <td style="padding: 12px; color:${isPosC ? '#15803d' : '#b91c1c'}; font-weight:700;">
                ${isPosC ? '+' : ''}${item.contribution.toFixed(3)}
            </td>
        `;

        // Slight hover effect on table rows
        row.addEventListener('mouseenter', () => row.style.backgroundColor = '#f1f5f9');
        row.addEventListener('mouseleave', () => row.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8fafc');

        tableBody.appendChild(row);
    });

    // Append total row
    const totRow = document.createElement('tr');
    totRow.style.background = "#e2e8f0";
    totRow.style.borderTop = "2px solid #cbd5e1";
    const isPosT = totalScore > 0;
    totRow.innerHTML = `
        <td colspan="3" style="text-align:right; font-weight:800; color: #1e293b; padding:16px 12px; font-size: 1.05rem;">Total Calculated Component Score:</td>
        <td style="color:${isPosT ? '#15803d' : '#b91c1c'}; font-weight:800; padding:16px 12px; font-size: 1.1rem;">
            ${isPosT ? '+' : ''}${totalScore.toFixed(3)}
        </td>
    `;
    tableBody.appendChild(totRow);

    container.style.display = 'block';
    
    // Scroll container into view securely within the modal
    container.scrollIntoView({ behavior: 'smooth', block: 'end' });
}
