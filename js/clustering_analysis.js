/**
 * Clustering Analysis Engine
 * Performs K-means, DBSCAN, and Hierarchical clustering using Web Workers and ml.js.
 */

document.addEventListener('DOMContentLoaded', () => {
    initClusteringSandbox();
});

let dataset = [];
let allStates = [];
let currentWorker = null;
let currentResults = null;

const clusterColorScale = d3.scaleOrdinal(d3.schemeCategory10);

function getClusterColor(clusterId) {
    if (clusterId === -1 || clusterId === "-1") return "#94a3b8";
    return clusterColorScale(clusterId);
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

async function initClusteringSandbox() {
    try {
        await loadData();
        populateFilters();

        if (document.getElementById('initLoader')) document.getElementById('initLoader').style.display = 'none';

        // Method Selector
        const methodSelect = document.getElementById('clusterMethod');
        methodSelect.addEventListener('change', (e) => {
            const method = e.target.value;
            document.getElementById('kmeansParams').style.display = method === 'kmeans' ? 'block' : 'none';
            document.getElementById('dbscanParams').style.display = method === 'dbscan' ? 'block' : 'none';
            document.getElementById('hierarchicalParams').style.display = method === 'hierarchical' ? 'block' : 'none';
            
            // Reset Results
            document.getElementById('resultsDisplay').style.display = 'none';
            document.querySelectorAll('.visualize-map-btn').forEach(btn => btn.style.display = 'none');
            
            const tbody = document.getElementById('clusterResultsTableBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:30px; color:#64748b; font-size:0.85rem;"><i class="fas fa-magic" style="font-size:1.2rem; margin-bottom:8px; opacity:0.5; display:block;"></i>Run analysis to view assignments</td></tr>';
            const filterSelect = document.getElementById('sidebarClusterFilter');
            if (filterSelect) filterSelect.innerHTML = '<option value="all">All Clusters</option>';
            const searchInput = document.getElementById('sidebarCountySearch');
            if (searchInput) searchInput.value = '';
            
            if (document.getElementById('pcaEmptyState')) document.getElementById('pcaEmptyState').style.display = 'flex';
        });

        // Slider Value Displays
        const sliders = [
            { id: 'kmeansK', valId: 'kVal' },
            { id: 'dbscanEpsilon', valId: 'epsilonVal' },
            { id: 'dbscanMinPoints', valId: 'minPointsVal' },
            { id: 'hierarchicalK', valId: 'hKVal' }
        ];
        sliders.forEach(s => {
            const slider = document.getElementById(s.id);
            const val = document.getElementById(s.valId);
            if (slider && val) {
                slider.oninput = () => val.textContent = slider.value;
            }
        });

        const infoBtn = document.getElementById('infoBtn');
        const infoModal = document.getElementById('infoModal');
        const closeModalBtn = document.getElementById('closeModalBtn');

        if (infoBtn && infoModal) {
            infoBtn.addEventListener('click', () => {
                infoModal.classList.add('active');
            });
        }

        if (closeModalBtn && infoModal) {
            closeModalBtn.addEventListener('click', () => {
                infoModal.classList.remove('active');
            });
        }

        // Close modal when clicking outside content
        window.addEventListener('click', (event) => {
            if (event.target === infoModal) {
                infoModal.classList.remove('active');
            }
        });

        document.getElementById('runAnalysisBtn').addEventListener('click', runAnalysis);
        document.querySelectorAll('.visualize-map-btn').forEach(btn => btn.addEventListener('click', showMapModal));
        document.getElementById('closeMapModalBtn').addEventListener('click', () => {
            document.getElementById('mapModal').classList.remove('active');
        });

    } catch (e) {
        console.error('Failed to initialize clustering sandbox', e);
    }
}

async function loadData() {
    const loader = document.getElementById('initLoader');
    if (loader) loader.style.display = 'flex';

    const [acsRes, placesRes] = await Promise.all([
        fetch("data/ACS Data/county_acs_flat.json"),
        fetch("data/PLACES Data/county_places_flat.json")
    ]);

    const acsData = await acsRes.json();
    const placesData = await placesRes.json();

    const placesCountyLookup = {};
    placesData.forEach(d => {
        if (d.id) placesCountyLookup[d.id.toLowerCase()] = d;
    });

    const stateSet = new Set();

    dataset = acsData.map(acs => {
        const stateAbbr = (acs.state_abbr || "").toLowerCase();
        const baseName = acs.name ? acs.name.replace(/_/g, " ").trim() : "";
        const strippedName = baseName.replace(/\s+County$/i, "").replace(/\s+Parish$/i, "").replace(/\s+Borough$/i, "").trim();
        const compactName = strippedName.replace(/\s+/g, "");
        
        // Extract 5-digit FIPS from acs.id (e.g., 0500000US01001 -> 01001)
        const fips = acs.id && acs.id.includes('US') ? acs.id.split('US')[1] : null;

        const candidate = `us.${stateAbbr}.${compactName}`.toLowerCase();
        let places = placesCountyLookup[candidate] || placesCountyLookup[acs.id?.toLowerCase()] || {};

        if(acs.state_name) stateSet.add(acs.state_name);
        return { 
            ...acs, 
            ...places, 
            fips: fips,
            state_name: acs.state_name || 'Unknown', 
            state_abbr: acs.state_abbr || '??' 
        };
    });

    allStates = Array.from(stateSet).sort();
    if (loader) loader.style.display = 'none';
}

function populateFilters() {
    const sFilter = document.getElementById('stateFilter');
    allStates.forEach(s => {
        const o = document.createElement('option');
        o.value = s; o.textContent = s;
        sFilter.appendChild(o);
    });

    const xContainer = document.getElementById('xVarList');
    
    // Health Metrics
    const healthHeader = document.createElement('div');
    healthHeader.innerHTML = '<strong>Health Outcomes</strong>';
    healthHeader.style.cssText = 'margin: 10px 0 5px; font-size: 0.75rem; color: #c83830; text-transform: uppercase;';
    xContainer.appendChild(healthHeader);

    HEALTH_METRICS.forEach(m => {
        const row = document.createElement('div');
        row.className = 'checkbox-row';
        row.innerHTML = `<input type="checkbox" id="chk_${m.id}" value="${m.id}"><label for="chk_${m.id}">${m.label}</label>`;
        xContainer.appendChild(row);
    });

    // Econ Metrics
    const econHeader = document.createElement('div');
    econHeader.innerHTML = '<strong>Socioeconomic</strong>';
    econHeader.style.cssText = 'margin: 15px 0 5px; font-size: 0.75rem; color: #0f172a; text-transform: uppercase;';
    xContainer.appendChild(econHeader);

    ECON_METRICS.forEach(m => {
        const row = document.createElement('div');
        row.className = 'checkbox-row';
        row.innerHTML = `<input type="checkbox" id="chk_${m.id}" value="${m.id}"><label for="chk_${m.id}">${m.label}</label>`;
        xContainer.appendChild(row);
    });

    // Defaults
    HEALTH_METRICS.slice(0, 5).forEach(m => document.getElementById(`chk_${m.id}`).checked = true);
}

function runAnalysis() {
    const method = document.getElementById('clusterMethod').value;
    const loader = document.getElementById('initLoader');
    const loaderText = document.getElementById('loaderText');

    if (loader) {
        loader.style.display = 'flex';
        loaderText.textContent = "Running clustering... ";
    }

    const xCheckboxes = document.querySelectorAll('#xVarList input:checked');
    const xIds = Array.from(xCheckboxes).map(c => c.value);

    // Dynamic UI error handler
    const showErrorCard = (msgText) => {
        if (loader) loader.style.display = 'none';
        document.getElementById('pcaEmptyState').style.display = 'none';
        document.getElementById('resultsDisplay').style.display = 'none';
        
        const tbody = document.getElementById('clusterResultsTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:30px; color:#64748b; font-size:0.85rem;"><i class="fas fa-exclamation-triangle" style="font-size:1.2rem; margin-bottom:8px; opacity:0.5; display:block; color:#c83830;"></i>Analysis error. Check parameters.</td></tr>';
        
        let errCard = document.getElementById('errorWarningCard');
        if (!errCard) {
            errCard = document.createElement('div');
            errCard.id = 'errorWarningCard';
            errCard.className = 'chart-card full-width-card';
            errCard.style.cssText = 'border-left: 4px solid #c83830; background: #fff0f0; margin-top: 20px;';
            document.querySelector('.results-container-wrapper').insertBefore(errCard, document.getElementById('resultsDisplay'));
        }
        errCard.style.display = 'block';
        errCard.innerHTML = `
            <div class="chart-header" style="margin-bottom: 10px;">
                <h3 class="chart-title" style="color: #c83830;">
                    <i class="fas fa-exclamation-triangle"></i>
                    Analysis Warning
                </h3>
            </div>
            <p style="color: #0f172a; margin: 0; font-size: 0.95rem;">${msgText}</p>
            <p style="color: #64748b; margin: 10px 0 0 0; font-size: 0.85rem;">Please review your parameters or inputs and try again.</p>
        `;
    };
    
    if (xIds.length < 2) {
        showErrorCard("Please select at least 2 variables to perform clustering.");
        return;
    }

    const filtered = getFilteredData();
    const { data, meta } = prepareMatrix(filtered, xIds);

    if (data.length < 3) {
        showErrorCard("Not enough valid data points for clustering out of the selected features.");
        return;
    }

    if (method === 'hierarchical' && data.length > 1500) {
        showErrorCard("Hierarchical clustering is computationally complex (O(N^3)) and would lock up the browser calculating all US counties. Please use the Region or State dropdown filters to reduce the dataset size below 1,500 counties, or switch to K-Means.");
        return;
    }

    const params = getParams(method);

    if (currentWorker) currentWorker.terminate();
    currentWorker = new Worker('js/clustering_worker.js?v=' + Date.now());

    currentWorker.onmessage = (e) => {
        const msg = e.data;
        if (msg.type === 'complete') {
            currentResults = { ...msg.results, data, meta, xLabels: xIds.map(id => ALL_METRICS.find(m => m.id === id).label) };
            if (loader) loader.style.display = 'none';
            displayResults(currentResults, method);
        } else if (msg.type === 'error') {
            showErrorCard(msg.message);
        }
    };

    currentWorker.postMessage({ method, data, params });
}

function getFilteredData() {
    const rFilter = document.getElementById('regionFilter').value;
    const sFilter = document.getElementById('stateFilter').value;

    return dataset.filter(d => {
        if (sFilter !== 'All' && d.state_name !== sFilter) return false;
        if (rFilter !== 'All' && !REGION_STATES[rFilter].includes(d.state_name)) return false;
        return true;
    });
}

function prepareMatrix(rows, ids) {
    const data = [];
    const meta = [];

    rows.forEach(d => {
        const row = [];
        let valid = true;
        ids.forEach(id => {
            const val = parseFloat(d[id]);
            if (isNaN(val)) valid = false;
            row.push(val);
        });
        if (valid) {
            data.push(row);
            meta.push({ 
                id: d.id, 
                name: d.name, 
                fips: d.fips,
                state: d.state_abbr, 
                state_abbr: d.state_abbr,
                state_name: d.state_name 
            });
        }
    });

    // Standardization
    if (data.length === 0) return { data: [], meta: [] };
    
    const transposed = math.transpose(data);
    const standardized = transposed.map(col => {
        const mean = math.mean(col);
        const std = math.std(col);
        if (std === 0 || isNaN(std)) return col.map(v => 0); // All same values
        return col.map(v => (v - mean) / std);
    });

    const result = math.transpose(standardized);
    console.log(`[Clustering] Prepared matrix: ${result.length}x${result[0]?.length}`);
    return { data: result, meta };
}

function getParams(method) {
    if (method === 'kmeans') return { k: parseInt(document.getElementById('kmeansK').value), runElbow: true };
    if (method === 'dbscan') return { epsilon: parseFloat(document.getElementById('dbscanEpsilon').value), minPoints: parseInt(document.getElementById('dbscanMinPoints').value) };
    if (method === 'hierarchical') return { k: parseInt(document.getElementById('hierarchicalK').value), linkage: document.getElementById('linkage').value };
    return {};
}

function displayResults(results, method) {
    const errCard = document.getElementById('errorWarningCard');
    if (errCard) errCard.style.display = 'none';

    document.getElementById('pcaEmptyState').style.display = 'none';
    document.getElementById('resultsDisplay').style.display = 'block';
    document.querySelectorAll('.visualize-map-btn').forEach(btn => btn.style.display = 'flex');

    // Elbow Plot
    const elbowCard = document.getElementById('elbowPlotCard');
    if (method === 'kmeans' && results.elbowData) {
        elbowCard.style.display = 'block';
        renderElbowPlot(results.elbowData);
    } else {
        elbowCard.style.display = 'none';
    }

    // Cluster Summary Table
    renderSummaryTable(results.clusters);

    // Initial 2D Plot
    update2DPlot();

    // Populate Right Sidebar with County List
    renderCountyClusterTable(results.data, results.clusters, results.meta);
    
    // Add event listener for viz basis change
    document.getElementById('vizBasis').onchange = update2DPlot;
}

async function update2DPlot() {
    const basis = document.getElementById('vizBasis').value;
    const { data, clusters, meta } = currentResults;

    if (basis === 'pca') {
        const projections = performLocalPCA(data);
        renderClusterPlot(projections, clusters, meta);
        return;
    }

    // Worker-based projection
    const container = d3.select("#clusterPlotContainer");
    container.html("");
    container.append("div")
        .attr("id", "projLoader")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("align-items", "center")
        .style("justify-content", "center")
        .style("height", "100%")
        .html(`
            <div class="loader-small" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #c83830; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 15px; color: #64748b;">Computing ${basis.toUpperCase()} projection...</p>
            <div style="width: 200px; height: 4px; background: #e2e8f0; border-radius: 2px; margin-top: 10px; overflow: hidden;">
                <div id="projProgressBar" style="width: 0%; height: 100%; background: #c83830; transition: width 0.2s;"></div>
            </div>
        `);

    if (currentWorker) currentWorker.terminate();
    currentWorker = new Worker('js/clustering_worker.js?v=' + Date.now());

    currentWorker.onmessage = (e) => {
        const msg = e.data;
        if (msg.type === 'projection_complete') {
            renderClusterPlot(msg.projections, clusters, meta);
        } else if (msg.type === 'progress') {
            const bar = document.getElementById('projProgressBar');
            if (bar) bar.style.width = msg.progress + '%';
        } else if (msg.type === 'error') {
            container.append("div").text("Projection Error: " + msg.message).style("padding", "20px");
        }
    };

    const params = basis === 'tsne' ? { iterations: 200, perplexity: 30 } : { nNeighbors: 15, minDist: 0.1 };
    currentWorker.postMessage({ method: 'project', data, params: { basis, params } });
}

function performLocalPCA(matrix) {
    if (!matrix || matrix.length < 2) return [];
    try {
        const Z = math.matrix(matrix);
        const Zt = math.transpose(Z);
        const n = matrix.length;
        
        // Covariance
        const Cov = math.multiply(math.multiply(Zt, Z), 1 / (n - 1));
        const eig = math.eigs(Cov);
        
        // Sort eigenvectors by eigenvalue
        const eigenData = eig.values.toArray().map((v, i) => ({ 
            value: v, 
            vector: eig.eigenvectors[i].vector.toArray() 
        })).sort((a, b) => b.value - a.value);

        if (eigenData.length < 2) {
             console.warn("[Clustering] Only 1 eigenvalue found, returning 1D projection with constant Y.");
             return matrix.map(row => [row[0] * eigenData[0].vector[0], 0]);
        }

        const topVectors = math.transpose(math.matrix([eigenData[0].vector, eigenData[1].vector]));
        const projected = math.multiply(Z, topVectors).toArray();
        
        console.log("[Clustering] PCA Projections (first 2):", projected.slice(0, 2));
        return projected;
    } catch (e) {
        console.error("[Clustering] PCA Error:", e);
        return matrix.map(row => [row[0] || 0, row[1] || 0]);
    }
}

function renderClusterPlot(projections, clusters, meta) {
    const container = d3.select("#clusterPlotContainer");
    container.html("");

    if (!projections || projections.length === 0) {
        container.append("div").text("No projection data available").style("padding", "20px");
        return;
    }

    const margin = { top: 20, right: 120, bottom: 50, left: 60 };
    const width = container.node().clientWidth - margin.left - margin.right;
    const height = container.node().clientHeight - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", "100%")
        .style("height", "auto")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain(d3.extent(projections, d => d[0])).nice().range([0, width]);
    const y = d3.scaleLinear().domain(d3.extent(projections, d => d[1])).nice().range([height, 0]);

    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
    svg.append("g").call(d3.axisLeft(y));

    // Tooltip Cleanup
    d3.selectAll('.cluster-tooltip').remove();

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "cluster-tooltip")
        .style("position", "absolute")
        .style("background", "white")
        .style("padding", "10px")
        .style("border", "1px solid #ddd")
        .style("border-radius", "8px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("z-index", 2000);

    svg.selectAll("circle")
        .data(projections)
        .enter().append("circle")
        .attr("cx", d => x(d[0]))
        .attr("cy", d => y(d[1]))
        .attr("r", 5)
        .attr("fill", (d, i) => getClusterColor(clusters[i]))
        .attr("opacity", 0.7)
        .on("mouseenter", (event, d) => {
            const idx = projections.indexOf(d);
            tooltip.style("opacity", 1)
                .html(`<strong>${meta[idx].name}, ${meta[idx].state}</strong><br>Cluster: ${clusters[idx] === -1 ? "Noise" : clusters[idx]}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseleave", () => tooltip.style("opacity", 0));

    // Legend
    const uniqueClusters = [...new Set(clusters)].sort((a,b) => a-b);
    const legend = svg.append("g").attr("transform", `translate(${width + 10}, 0)`);
    uniqueClusters.forEach((c, i) => {
        const row = legend.append("g").attr("transform", `translate(0, ${i * 25})`);
        row.append("rect").attr("width", 15).attr("height", 15).attr("fill", getClusterColor(c));
        row.append("text").attr("x", 20).attr("y", 12).text(c === -1 ? "Noise (Outliers)" : `Cluster ${c}`).style("font-size", "0.8rem");
    });
}

function renderElbowPlot(data) {
    const container = d3.select("#elbowPlotContainer");
    container.html("");

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = container.node().clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", "100%")
        .style("height", "auto")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([1, 10]).range([0, width]);
    const y = d3.scaleLinear().domain([0, d3.max(data)]).nice().range([height, 0]);

    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).ticks(10));
    svg.append("g").call(d3.axisLeft(y).tickFormat(d3.format(".2s")));

    const line = d3.line().x((d, i) => x(i + 1)).y(d => y(d));
    svg.append("path").datum(data).attr("fill", "none").attr("stroke", "#c83830").attr("stroke-width", 3).attr("d", line);

    svg.selectAll("circle").data(data).enter().append("circle")
        .attr("cx", (d, i) => x(i + 1))
        .attr("cy", d => y(d))
        .attr("r", 5)
        .attr("fill", "#c83830");
}

function renderSummaryTable(clusters) {
    const body = document.getElementById('clusterSummaryBody');
    const counts = {};
    clusters.forEach(c => counts[c] = (counts[c] || 0) + 1);

    const sortedIds = Object.keys(counts).sort((a,b) => parseInt(a) - parseInt(b));
    const total = clusters.length;

    body.innerHTML = sortedIds.map(id => {
        const count = counts[id];
        const pct = ((count / total) * 100).toFixed(1);
        const label = id == "-1" ? "Outliers" : `Cluster ${id}`;
        return `<tr><td>${label}</td><td>${count}</td><td>${pct}%</td></tr>`;
    }).join('');
}

function renderCountyClusterTable(data, clusters, meta) {
    const sidebar = document.getElementById('clusterResultsSidebar');
    if (!sidebar) return;
    
    const filterSelect = document.getElementById('sidebarClusterFilter');
    const uniqueClusters = [...new Set(clusters)].sort((a,b) => a - b);
    
    let optionsHtml = `<option value="all">All Clusters</option>`;
    uniqueClusters.forEach(c => {
        const label = (c === -1 || c === "-1") ? "Noise (Outliers)" : `Cluster ${c}`;
        optionsHtml += `<option value="${c}">${label}</option>`;
    });
    filterSelect.innerHTML = optionsHtml;
    
    const tbody = document.getElementById('clusterResultsTableBody');
    const searchInput = document.getElementById('sidebarCountySearch');
    
    let allRows = [];
    let html = '';
    
    meta.forEach((m, i) => {
        const clusterId = clusters[i];
        const clusterLabel = (clusterId === -1 || clusterId === "-1") ? "Noise" : `C${clusterId}`;
        const color = getClusterColor(clusterId);
        const countyName = m.name || m.label || "Unknown";
        const stateName = m.state_name || m.state || (m.tooltip ? m.tooltip.split(',')[1]?.trim() || '' : '');
        
        const rowHtml = `
            <tr>
                <td style="padding: 10px 6px; border-bottom: 1px solid #f1f5f9;">
                    <div style="font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;" title="${countyName}">${countyName}</div>
                    <div style="font-size: 0.75rem; color: #64748b;">${stateName}</div>
                </td>
                <td style="padding: 10px 6px; border-bottom: 1px solid #f1f5f9; text-align: center;">
                    <span style="background: ${color}15; color: ${color}; padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 0.75rem; border: 1px solid ${color}30; white-space: nowrap;">
                        ${clusterLabel}
                    </span>
                </td>
            </tr>
        `;
        html += rowHtml;
        allRows.push({ 
            html: rowHtml, 
            cluster: String(clusterId), 
            text: `${countyName.toLowerCase()} ${stateName.toLowerCase()}` 
        });
    });
    
    tbody.innerHTML = html;
    
    const applyFilters = () => {
        const query = searchInput.value.toLowerCase().trim();
        const selectedCluster = filterSelect.value;
        
        let filteredHtml = '';
        let matchCount = 0;
        allRows.forEach(row => {
            const matchesSearch = query === '' || row.text.includes(query);
            const matchesCluster = selectedCluster === 'all' || row.cluster === selectedCluster;
            if (matchesSearch && matchesCluster) {
                filteredHtml += row.html;
                matchCount++;
            }
        });
        
        tbody.innerHTML = matchCount === 0 
            ? `<tr><td colspan="2" style="text-align:center; padding:25px; color:#64748b; font-size:0.85rem;"><i class="fas fa-search" style="font-size:1.2rem; margin-bottom:8px; opacity:0.5; display:block;"></i>No counties match your filters</td></tr>` 
            : filteredHtml;
    };
    
    searchInput.oninput = applyFilters;
    filterSelect.onchange = applyFilters;
}

// Map Logic
let amRoot = null;
function showMapModal() {
    document.getElementById('mapModal').classList.add('active');
    if (!amRoot) initMap();
    else updateMap();
}

function initMap() {
    am5.ready(() => {
        const root = am5.Root.new("mapContainer");
        amRoot = root;
        root.setThemes([am5themes_Animated.new(root)]);

        const chart = root.container.children.push(am5map.MapChart.new(root, {
            panX: "translateX",
            panY: "translateY",
            projection: am5map.geoAlbersUsa()
        }));

        const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
            geoJSON: am5geodata_region_usa_usaCountiesLow,
            valueField: "cluster"
        }));

        polygonSeries.mapPolygons.template.setAll({
            tooltipText: "{name}: Cluster {cluster}",
            strokeWidth: 0.2,
            stroke: am5.color(0xffffff)
        });

        polygonSeries.mapPolygons.template.adapters.add("tooltipText", (text, target) => {
            const data = target.dataItem.dataContext;
            if (data) {
                if (data.missing) {
                    return "{name}: [bold]No Data[/] (Missing feature values)";
                }
                if (data.cluster !== undefined) {
                    const c = data.cluster === "Noise" || data.cluster === -1 ? "Noise (Outlier)" : `Cluster ${data.cluster}`;
                    return `${data.name || target.get("name") || "Area"}: ${c}`;
                }
            }
            return text;
        });

        polygonSeries.mapPolygons.template.adapters.add("fill", (fill, target) => {
            if (target.dataItem && target.dataItem.dataContext && target.dataItem.dataContext.fill) {
                return target.dataItem.dataContext.fill;
            }
            return fill;
        });

        chart.set("zoomControl", am5map.ZoomControl.new(root, {}));
        updateMap();
    });
}

// Helper to safely convert d3 hex string to am5 color number
function getAm5ColorFromHex(hexString) {
    if (!hexString) return am5.color(0xe2e8f0);
    return am5.color(Number("0x" + hexString.replace("#", "")));
}

function updateMap() {
    if (!amRoot || !currentResults) return;
    const series = amRoot.container.children.getIndex(0).series.getIndex(0);
    
    // Create quick lookup from currentResults matching map naming (State_NormalizedName)
    const lookup = {};
    currentResults.meta.forEach((m, i) => {
        if (m.name && m.state_abbr) {
            lookup[m.state_abbr.toUpperCase() + "_" + normalizeCountyNameMap(m.name)] = {
                cluster: currentResults.clusters[i]
            };
        }
    });

    const geoJSON = series.get("geoJSON");
    if (!geoJSON) return;
    const geoFeatures = geoJSON.features || [];

    const mapData = [];
    geoFeatures.forEach(feature => {
        const pId = feature.id || "";
        if (!pId) return;

        let stateAbbr = "";
        if (feature.properties && feature.properties.STATE) {
            stateAbbr = feature.properties.STATE;
        } else {
            const parts = pId.split("-");
            if (parts.length >= 3) stateAbbr = parts[1];
        }

        const name = feature.properties.NAME || feature.properties.name || "";
        const dataObj = lookup[stateAbbr + "_" + normalizeCountyNameMap(name)];

        if (dataObj) {
            const cId = dataObj.cluster;
            const hexColor = d3.color(getClusterColor(cId)).formatHex();
            mapData.push({
                id: pId,
                cluster: cId === -1 ? "Noise" : cId,
                name: name || pId,
                missing: false,
                fill: getAm5ColorFromHex(hexColor)
            });
        } else {
            mapData.push({
                id: pId,
                cluster: "N/A",
                name: name || pId,
                missing: true,
                fill: am5.color(0xe2e8f0)
            });
        }
    });

    series.data.setAll(mapData);

    // Legend
    const legendBody = document.getElementById('mapLegendItems');
    const unique = [...new Set(currentResults.clusters)].sort((a,b) => a-b);
    legendBody.innerHTML = unique.map(c => {
        const color = getClusterColor(c);
        const name = c === -1 ? "Noise" : `Cluster ${c}`;
        return `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
            <div style="width: 12px; height: 12px; border-radius: 2px; background: ${color};"></div>
            <span style="font-size: 0.8rem; color: #475569;">${name}</span>
        </div>`;
    }).join('');
}
