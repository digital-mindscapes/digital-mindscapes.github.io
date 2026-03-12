/**
 * Dimensionality Reduction (PCA) Engine
 * Calculates Principal Component Analysis via SVD/Eigen decomposition using Math.js and D3.
 */

document.addEventListener('DOMContentLoaded', () => {
    initPCASandbox();
});

let dataset = [];
let allStates = [];
let currentWorker = null;
let currentSelectedPC = "PC1";

const REGION_STATES = {
    "Northeast": ["Connecticut", "Maine", "Massachusetts", "New Hampshire", "Rhode Island", "Vermont", "New Jersey", "New York", "Pennsylvania"],
    "Midwest": ["Illinois", "Indiana", "Iowa", "Kansas", "Michigan", "Minnesota", "Missouri", "Nebraska", "North Dakota", "Ohio", "South Dakota", "Wisconsin"],
    "South": ["Alabama", "Arkansas", "Delaware", "Florida", "Georgia", "Kentucky", "Louisiana", "Maryland", "Mississippi", "North Carolina", "Oklahoma", "South Carolina", "Tennessee", "Texas", "Virginia", "West Virginia", "District of Columbia"],
    "West": ["Alaska", "Arizona", "California", "Colorado", "Hawaii", "Idaho", "Montana", "Nevada", "New Mexico", "Oregon", "Utah", "Washington", "Wyoming"]
};

/**
 * AI Clustering - K-Means Implementation
 */
function performKMeans(data, k = 4) {
    if (!data || data.length === 0) return [];
    if (k > data.length) k = data.length;

    const dimensions = data[0].length;
    let centroids = data.slice(0, k).map(d => [...d]);
    let clusters = new Array(data.length).fill(0);
    let changed = true;
    let maxIter = 50;

    while (changed && maxIter-- > 0) {
        changed = false;
        // Assign
        for (let i = 0; i < data.length; i++) {
            let minDist = Infinity, clusterIdx = 0;
            for (let j = 0; j < k; j++) {
                let d = 0;
                for (let dim = 0; dim < dimensions; dim++) d += Math.pow(data[i][dim] - centroids[j][dim], 2);
                if (d < minDist) { minDist = d; clusterIdx = j; }
            }
            if (clusters[i] !== clusterIdx) { clusters[i] = clusterIdx; changed = true; }
        }
        // Update
        centroids = centroids.map((c, j) => {
            const pts = data.filter((_, i) => clusters[i] === j);
            if (pts.length === 0) return c;
            const mean = new Array(dimensions).fill(0);
            pts.forEach(p => p.forEach((v, dim) => mean[dim] += v));
            return mean.map(v => v / pts.length);
        });
    }
    return clusters;
}

function updateInfoModal() {
    const method = document.getElementById('drMethod').value;
    const title = document.getElementById('infoModalTitle');
    const body = document.getElementById('infoModalBody');
    if (!title || !body) return;

    if (method === 'pca') {
        title.textContent = "PCA Methodology & Interpretation";
        body.innerHTML = `
            <h4 style="color: #0f172a; margin-top: 0;">What is PCA?</h4>
            <p>Principal Component Analysis (PCA) is a linear technique used to reduce dimensionality. It uses <strong>Math.js</strong> for Eigendecomposition of the covariance matrix.</p>
            <div style="margin-top:15px; background:#f8fafc; padding:12px; border-radius:8px; border-left:4px solid #c83830;">
                <strong>Library used:</strong> Math.js (Linear Algebra Engine)
            </div>
            <h4 style="color: #0f172a;">Key Concepts</h4>
            <ul>
                <li><strong>Scree Plot:</strong> Shows the importance of each component.</li>
                <li><strong>Biplot:</strong> Shows both counties (points) and variables (arrows).</li>
            </ul>
        `;
    } else if (method === 'tsne') {
        title.textContent = "t-SNE Methodology & Interpretation";
        body.innerHTML = `
            <h4 style="color: #0f172a; margin-top: 0;">What is t-SNE?</h4>
            <p>t-Distributed Stochastic Neighbor Embedding (t-SNE) is a non-linear technique for visualizing high-dimensional data by giving each datapoint a location in a 2D map.</p>
            <div style="margin-top:15px; background:#f8fafc; padding:12px; border-radius:8px; border-left:4px solid #c83830;">
                <strong>Library used:</strong> t-SNE-JS (Manifold Learning)
            </div>
            <h4 style="color: #0f172a;">Key Parameters</h4>
            <ul>
                <li><strong>Perplexity:</strong> Balances local vs global aspects of the data.</li>
                <li><strong>Iterations:</strong> Number of optimization steps.</li>
            </ul>
        `;
    } else {
        title.textContent = "UMAP Methodology & Interpretation";
        body.innerHTML = `
            <h4 style="color: #0f172a; margin-top: 0;">What is UMAP?</h4>
            <p>Uniform Manifold Approximation and Projection (UMAP) is a dimension reduction technique that is particularly well-suited for visualizing large datasets and preserving global structure.</p>
            <div style="margin-top:15px; background:#f8fafc; padding:12px; border-radius:8px; border-left:4px solid #c83830;">
                <strong>Library used:</strong> UMAP-JS (Topological Data Analysis)
            </div>
            <h4 style="color: #0f172a;">Key Parameters</h4>
            <ul>
                <li><strong>Neighbors:</strong> Effectively balances local versus global structure.</li>
                <li><strong>Min Distance:</strong> Controls how tightly UMAP is allowed to pack points together.</li>
            </ul>
        `;
    }
}

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

        if (document.getElementById('initLoader')) document.getElementById('initLoader').style.display = 'none';

        // Modal Logic
        const infoBtn = document.getElementById('infoBtn');
        const infoModal = document.getElementById('infoModal');
        const closeBtn = document.getElementById('closeModalBtn');

        if (infoBtn && infoModal) {
            infoBtn.addEventListener('click', () => {
                updateInfoModal();
                infoModal.classList.add('active');
            });
        }
        if (closeBtn && infoModal) {
            closeBtn.addEventListener('click', () => infoModal.classList.remove('active'));
        }
        window.addEventListener('click', (e) => {
            if (e.target === infoModal) infoModal.classList.remove('active');
        });

        // Method Selector & Parameter Sliders
        const methodSelect = document.getElementById('drMethod');
        methodSelect.addEventListener('change', (e) => {
            const method = e.target.value;
            document.getElementById('tsneParams').style.display = method === 'tsne' ? 'block' : 'none';
            document.getElementById('umapParams').style.display = method === 'umap' ? 'block' : 'none';

            // Reset Results when switching methods
            document.getElementById('resultsDisplay').style.display = 'none';
            document.getElementById('visualizeMapBtn').style.display = 'none';
            
            // Terminate background worker if running
            if (currentWorker) {
                currentWorker.terminate();
                currentWorker = null;
            }

            // Dispose of Map if method is changing significantly (clean memory)
            if (amMapRoot) {
                amMapRoot.dispose();
                amMapRoot = null;
            }

            const sidebar = document.getElementById('countyResultsSidebar');
            if (sidebar) {
                sidebar.style.display = 'none';
                const summary = document.getElementById('countySelectionSummary');
                const tbody = document.getElementById('countyResultsTableBody');
                if (summary) summary.style.display = 'none';
                if (tbody) tbody.innerHTML = '';
            }
            if (document.getElementById('pcaEmptyState')) {
                document.getElementById('pcaEmptyState').style.display = 'flex';
            }

            // Update button text
            const btn = document.getElementById('runAnalysisBtn');
            btn.innerHTML = method === 'pca' ? 'Run PCA Decomposition' : `Run ${method.toUpperCase()} Analysis`;
        });

        // Color and Algorithm Switchers
        document.getElementById('colorMethod').addEventListener('change', () => {
            if (window.currentResults) {
                const { method, projections, results } = window.currentResults;
                finishAnalysis(method, projections, results);
            }
        });
        // Slider value displays
        const sliders = [
            { id: 'tsnePerplexity', valId: 'perplexityVal' },
            { id: 'tsneIterations', valId: 'iterationsVal' },
            { id: 'umapNeighbors', valId: 'neighborsVal' },
            { id: 'umapMinDist', valId: 'minDistVal' }
        ];
        sliders.forEach(s => {
            const slider = document.getElementById(s.id);
            const val = document.getElementById(s.valId);
            if (slider && val) {
                slider.oninput = () => val.textContent = slider.value;
            }
        });

        document.getElementById('runAnalysisBtn').addEventListener('click', runAnalysis);

        document.getElementById('visualizeMapBtn').addEventListener('click', () => {
            const modal = document.getElementById('mapModal');
            if (modal) {
                modal.classList.add('active');
                if (!amMapRoot) initPCAMapModal();
                else updatePCAMapData();
            }
        });

        const closeMapBtn = document.getElementById('closeMapModalBtn');
        if (closeMapBtn) {
            closeMapBtn.addEventListener('click', () => {
                document.getElementById('mapModal').classList.remove('active');
            });
        }

        document.getElementById('pcaToggle').addEventListener('change', (e) => {
            currentSelectedPC = e.target.value;
            updatePCAMapData();
        });

        document.getElementById('cancelAnalysisBtn').addEventListener('click', () => {
            if (currentWorker) {
                currentWorker.terminate();
                currentWorker = null;
                document.getElementById('progressContainer').style.display = 'none';
                if (document.getElementById('pcaEmptyState')) {
                    document.getElementById('pcaEmptyState').style.display = 'flex';
                }
            }
        });
    } catch (e) {
        console.error('Failed to initialize PCA sandbox', e);
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
        if (d.id) {
            placesCountyLookup[d.id.toLowerCase()] = d;
        }
    });

    const stateSet = new Set();

    dataset = acsData.map(acs => {
        // Robust matching logic
        const stateAbbr = (acs.state_abbr || "").toLowerCase();
        const baseName = acs.name ? acs.name.replace(/_/g, " ").trim() : "";
        
        // Version 1: Strip "County/Parish" and remove spaces
        const strippedName = baseName.replace(/\s+County$/i, "").replace(/\s+Parish$/i, "").replace(/\s+Borough$/i, "").trim();
        const compactName = strippedName.replace(/\s+/g, "");
        
        // Version 2: Just the compact version of original name
        const compactOriginal = baseName.replace(/\s+/g, "");

        const candidates = [
            `us.${stateAbbr}.${compactName}`.toLowerCase(),
            `us.${stateAbbr}.${compactOriginal}`.toLowerCase(),
            acs.id ? acs.id.toLowerCase() : null
        ];

        let places = {};
        for(const cand of candidates) {
            if(cand && placesCountyLookup[cand]) {
                places = placesCountyLookup[cand];
                break;
            }
        }

        if(acs.state_name) stateSet.add(acs.state_name);
        return { ...acs, ...places, state_name: acs.state_name || 'Unknown', state_abbr: acs.state_abbr || '??' };
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
        if (chk) chk.checked = true;
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

function runAnalysis() {
    const loader = document.getElementById('initLoader');
    const loaderText = document.getElementById('loaderText');
    const method = document.getElementById('drMethod').value;

    if (loader) {
        loader.style.display = 'flex';
        loaderText.textContent = method === 'pca' ? 'Computing Eigenvectors...' : 'Preparing Data...';
    }

    // Clear previous
    document.getElementById('errorDisplay').style.display = 'none';
    document.getElementById('resultsDisplay').style.display = 'none';
    const sidebar = document.getElementById('countyResultsSidebar');
    if (sidebar) {
        sidebar.style.display = 'none';
        const summary = document.getElementById('countySelectionSummary');
        const tbody = document.getElementById('countyResultsTableBody');
        if (summary) summary.style.display = 'none';
        if (tbody) tbody.innerHTML = '';
    }
    document.getElementById('progressContainer').style.display = 'none';
    if (document.getElementById('pcaEmptyState')) {
        document.getElementById('pcaEmptyState').style.display = 'none';
    }

    // Explicitly clear references to large data objects to help Garbage Collection
    window.currentResults = null;
    window.currentMeta = null;
    window.pcaMapData = null;
    
    if (currentWorker) {
        currentWorker.terminate();
        currentWorker = null;
    }

    setTimeout(() => {
        try {
            const xCheckboxes = document.querySelectorAll('#xVarList input:checked');
            const xIds = Array.from(xCheckboxes).map(c => c.value);
            const xLabels = xIds.map(id => ALL_METRICS.find(m => m.id === id).label);

            if (xIds.length < 2) {
                showModelError("Please select at least 2 variables for analysis.");
                if (loader) loader.style.display = 'none';
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
                    if (isNaN(val)) valid = false;
                    row.push(val);
                });
                if (valid) {
                    matrix_rows.push(row);
                    validMeta.push({ name: d.name, state: d.state_abbr, id: d.id, ...d });
                }
            });

            if (matrix_rows.length < 5) {
                showModelError("Not enough valid data points for analysis.");
                if (loader) loader.style.display = 'none';
                return;
            }

            // 1. Standardize (Center and Scale) - Required for all methods
            const n = matrix_rows.length;
            const p = xIds.length;
            let X = math.transpose(math.matrix(matrix_rows));
            let standardizedRows = [];

            for (let j = 0; j < p; j++) {
                let variableValues = X.subset(math.index(j, math.range(0, n))).toArray()[0];
                let mean = math.mean(variableValues);
                let std = math.std(variableValues);
                standardizedRows.push(variableValues.map(v => (v - mean) / (std || 1)));
            }
            const Z = math.matrix(standardizedRows);

            if (method === 'pca') {
                performPCA(Z, standardizedRows, xLabels, validMeta);
            } else {
                // Iterative/Worker based methods
                const params = method === 'tsne' ? {
                    perplexity: parseFloat(document.getElementById('tsnePerplexity').value),
                    iterations: parseInt(document.getElementById('tsneIterations').value)
                } : {
                    nNeighbors: parseInt(document.getElementById('umapNeighbors').value),
                    minDist: parseFloat(document.getElementById('umapMinDist').value)
                };

                runWorkerAnalysis(method, math.transpose(Z).toArray(), params, standardizedRows, xLabels, validMeta);
            }

        } catch (err) {
            console.error("Analysis failed:", err);
            showModelError("Dimensionality reduction failed. Check console for details.");
            if (loader) loader.style.display = 'none';
        }
    }, 100);
}

function performPCA(Z, standardizedRows, xLabels, validMeta) {
    const n = validMeta.length;
    const Zt = math.transpose(Z);
    const Cov = math.multiply(math.multiply(Z, Zt), 1 / (n - 1));

    const eigResult = math.eigs(Cov);
    const values = eigResult.values;
    const eigenvectors = eigResult.eigenvectors;

    let eigenData = values.toArray().map((v, i) => ({
        value: v,
        vector: eigenvectors[i].vector.toArray()
    })).sort((a, b) => b.value - a.value);

    const totalVariance = eigenData.reduce((sum, e) => sum + e.value, 0);
    eigenData = eigenData.map(e => ({
        ...e,
        varianceExplained: e.value / totalVariance
    }));

    const numComponentsToProject = Math.min(5, xLabels.length);
    const topVectors = math.transpose(math.matrix(eigenData.slice(0, numComponentsToProject).map(e => e.vector)));
    const projections = math.multiply(Zt, topVectors).toArray();

    finishAnalysis('pca', projections, { eigenData, xLabels, validMeta, standardizedRows });
}
function runWorkerAnalysis(method, data, params, standardizedRows, xLabels, validMeta) {
    const loader = document.getElementById('initLoader');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    if (loader) loader.style.display = 'none';
    if (progressContainer) {
        progressContainer.style.display = 'flex';
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
    }

    if (currentWorker) currentWorker.terminate();
    currentWorker = new Worker('js/dr_worker.js');

    currentWorker.onmessage = function (e) {
        const msg = e.data;
        if (msg.type === 'progress') {
            const p = msg.progress;
            progressBar.style.width = p + '%';
            progressText.textContent = Math.round(p) + '%';

            // Sync SVG ring (Circumference ~339.29)
            const circle = document.getElementById('svgProgressCircle');
            if (circle) {
                const offset = 339.29 * (1 - p / 100);
                circle.style.strokeDashoffset = offset;
            }
        } else if (msg.type === 'complete') {
            if (progressContainer) progressContainer.style.display = 'none';
            finishAnalysis(method, msg.projections, { xLabels, validMeta, standardizedRows });
            currentWorker.terminate();
            currentWorker = null;
        } else if (msg.type === 'error') {
            if (progressContainer) progressContainer.style.display = 'none';
            showModelError(`Worker Error: ${msg.message}`);
            currentWorker.terminate();
            currentWorker = null;
        }
    };

    currentWorker.onerror = function (err) {
        if (progressContainer) progressContainer.style.display = 'none';
        showModelError("Worker failed to start. Ensure js/dr_worker.js is accessible.");
        console.error(err);
        currentWorker.terminate();
        currentWorker = null;
    };

    currentWorker.postMessage({ method, data, params });
}



function finishAnalysis(method, projections, results) {
    if (document.getElementById('initLoader')) document.getElementById('initLoader').style.display = 'none';
    const { eigenData, xLabels, validMeta, standardizedRows } = results;

    // Map Regions
    const metaWithRegion = validMeta.map(m => {
        let region = "Other";
        const stateToLookup = m.state_name || m.state; // Use full name if available
        for (const [r, states] of Object.entries(REGION_STATES)) {
            if (states.includes(stateToLookup)) { region = r; break; }
        }
        return { ...m, region };
    });

    // Handle Clustering
    const colorMode = document.getElementById('colorMethod').value;
    if (colorMode === 'cluster') {
        const clusters = performKMeans(projections.map(p => p.slice(0, 2)), 4); // Use first 2 components for clustering
        metaWithRegion.forEach((m, i) => m.cluster = `Cluster ${clusters[i] + 1}`);
    }

    // Prepare Global Map Data
    window.pcaVariables = xLabels;
    window.pcaEigenData = eigenData || [];

    // Use consistent method-based keys for Map selection
    const mappingPrefix = method === 'pca' ? 'PC' : (method === 'tsne' ? 'tSNE-' : 'UMAP-');

    window.pcaMapData = projections.map((proj, idx) => {
        const mapObj = {
            id: metaWithRegion[idx].id,
            name: metaWithRegion[idx].name,
            state: metaWithRegion[idx].state,
            region: metaWithRegion[idx].region,
            cluster: metaWithRegion[idx].cluster || null,
            standardizedValues: standardizedRows.map(row => row[idx])
        };
        proj.forEach((val, i) => {
            mapObj[`${mappingPrefix}${i + 1}`] = val;
        });
        return mapObj;
    });
    window.pcaMapAvailableComponents = projections[0].length;

    // Attach projection and std_values to meta for selection logic
    const enrichedMeta = metaWithRegion.map((m, idx) => ({
        ...m,
        p: projections[idx],
        std_values: standardizedRows.map(row => row[idx])
    }));

    // Store current results for re-rendering biplot on color method change
    window.currentProjections = projections;
    window.currentMethod = method;
    window.currentEigenData = eigenData;
    window.currentXLabels = xLabels;
    window.currentMeta = enrichedMeta;

    // Store for reactive coloring
    window.currentResults = { method, projections, results };

    // UI Updates
    document.getElementById('resultsDisplay').style.display = 'block';
    const sidebar = document.getElementById('countyResultsSidebar');
    if (sidebar) sidebar.style.display = 'block';
    document.getElementById('visualizeMapBtn').style.display = 'flex';

    // Toggle diagnostics
    const isPCA = method === 'pca';
    document.getElementById('pcaDiagnostics').style.display = isPCA ? 'contents' : 'none';
    document.getElementById('loadingsContainer').style.display = isPCA ? 'block' : 'none';

    const projTitle = document.getElementById('projectionTitle');
    if (projTitle) {
        const mName = method === 'pca' ? 'PCA' : (method === 'tsne' ? 't-SNE' : 'UMAP');
        const axisLabels = isPCA ? 'PC1 vs PC2' : 'Dimension 1 vs Dimension 2';
        projTitle.textContent = `2D Projection (${mName}: ${axisLabels})`;
    }

    // Now render plots (after sidebar/layout is stable)
    if (isPCA) {
        renderScreePlot(eigenData || []);
        renderCumulativePlot(eigenData || []);
        renderLoadingsTable(eigenData || [], xLabels);
        document.getElementById('iterativeSummaryContainer').style.display = 'none';
    } else {
        renderIterativeSummary(method, results);
    }

    renderBiplot(projections, method, eigenData, xLabels, enrichedMeta);
    renderCountySidebarTable(projections, method, enrichedMeta);

    // Scroll to results
    setTimeout(() => {
        document.getElementById('resultsDisplay').scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

function renderIterativeSummary(method, results) {
    const container = document.getElementById('iterativeSummaryContainer');
    const body = document.getElementById('iterativeSummaryBody');
    if (!container || !body) return;

    container.style.display = 'block';
    
    const count = results.validMeta.length;
    const varCount = results.xLabels.length;
    
    let html = '';

    if (method === 'tsne') {
        const perp = document.getElementById('tsnePerplexity').value;
        const iter = document.getElementById('tsneIterations').value;
        
        html = `
            <tr><td>Method</td><td><strong>t-SNE</strong></td></tr>
            <tr><td>Sample Size (N)</td><td>${count} Counties</td></tr>
            <tr><td>Features (P)</td><td>${varCount} Variables</td></tr>
            <tr><td>Perplexity</td><td>${perp}</td></tr>
            <tr><td>Iterations</td><td>${iter}</td></tr>
            <tr><td>Output Dimensions</td><td>2D</td></tr>
        `;
    } else if (method === 'umap') {
        const neighbors = document.getElementById('umapNeighbors').value;
        const minDist = document.getElementById('umapMinDist').value;
        
        html = `
            <tr><td>Method</td><td><strong>UMAP</strong></td></tr>
            <tr><td>Sample Size (N)</td><td>${count} Counties</td></tr>
            <tr><td>Features (P)</td><td>${varCount} Variables</td></tr>
            <tr><td>N-Neighbors</td><td>${neighbors}</td></tr>
            <tr><td>Min Distance</td><td>${minDist}</td></tr>
            <tr><td>Output Dimensions</td><td>2D</td></tr>
        `;
    }

    body.innerHTML = html;
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
        .domain(eigenData.map((d, i) => `PC${i + 1}`))
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
        .attr("x", d => x(`PC${eigenData.indexOf(d) + 1}`))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d.varianceExplained))
        .attr("height", d => height - y(d.varianceExplained))
        .attr("rx", 4)
        .on("mouseover", function (event, d) {
            const pcIdx = eigenData.indexOf(d) + 1;
            d3.select(this).attr("fill", "#a02820");
            tooltip.style("opacity", 1)
                .html(`<strong>Principal Component ${pcIdx}</strong><br/>Variance Explained: ${(d.varianceExplained * 100).toFixed(2)}%`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
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
        .on("mouseover", function (event, d) {
            d3.select(this).attr("r", 8).attr("fill", "#a02820");
            tooltip.style("opacity", 1)
                .html(`<strong>Top ${d.pc} Components</strong><br/>Total Variance: ${(d.value * 100).toFixed(2)}%`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            d3.select(this).attr("r", 5).attr("fill", "#c83830");
            tooltip.style("opacity", 0);
        });
}

function renderBiplot(projections, method, eigenData, xLabels, meta) {
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
    if (method === 'pca') {
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 45)
            .attr("text-anchor", "middle")
            .text(`Principal Component 1 (${(eigenData[0].varianceExplained * 100).toFixed(1)}%)`);

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -45)
            .attr("x", -height / 2)
            .attr("text-anchor", "middle")
            .text(`Principal Component 2 (${(eigenData[1].varianceExplained * 100).toFixed(1)}%)`);
    } else {
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 45)
            .attr("text-anchor", "middle")
            .text("Dimension 1");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -45)
            .attr("x", -height / 2)
            .attr("text-anchor", "middle")
            .text("Dimension 2");
    }

    // Zero lines
    svg.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", 0).attr("y2", height).attr("stroke", "#e2e8f0").attr("stroke-dasharray", "4");
    svg.append("line").attr("x1", 0).attr("x2", width).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", "#e2e8f0").attr("stroke-dasharray", "4");

    const tooltip = d3.select("#regTooltip");
    const colorMode = document.getElementById('colorMethod').value;
    const colorScale = d3.scaleOrdinal();
    let colorField = null;

    if (colorMode === 'region') {
        colorField = 'region';
        colorScale.domain(["Northeast", "Midwest", "South", "West", "Other"]).range(["#3b82f6", "#10b981", "#f59e0b", "#c83830", "#94a3b8"]);
    } else if (colorMode === 'cluster') {
        colorField = 'cluster';
        // Assuming 4 clusters for now, can be dynamic
        colorScale.domain(["Cluster 1", "Cluster 2", "Cluster 3", "Cluster 4"]).range(["#8b5cf6", "#ec4899", "#f97316", "#06b6d4"]);
    }

    // Points
    svg.selectAll(".point")
        .data(projections)
        .enter().append("circle")
        .attr("class", "point")
        .attr("cx", d => x(d[0]))
        .attr("cy", d => y(d[1]))
        .attr("r", colorField ? 4 : 3.5)
        .attr("fill", (d, i) => colorField ? colorScale(meta[i][colorField]) : "#c83830")
        .attr("stroke", "#fff")
        .attr("stroke-width", colorField ? 1 : 0.5)
        .attr("opacity", 1)
        .on("mouseenter", function (event, d) {
            const i = projections.indexOf(d);
            const m = meta[i];
            d3.select(this).raise().attr("r", 7).attr("stroke-width", 2);

            const label1 = method === 'pca' ? 'PC1' : 'Dim 1';
            const label2 = method === 'pca' ? 'PC2' : 'Dim 2';
            const extra = colorField ? `<br/><span style="color:${colorScale(m[colorField])}">●</span> ${m[colorField]}` : "";

            tooltip.style("opacity", 1)
                .html(`<strong>${m.name}, ${m.state}</strong>${extra}<br/>${label1}: ${d[0].toFixed(2)}<br/>${label2}: ${d[1].toFixed(2)}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseleave", function () {
            d3.select(this).attr("r", colorField ? 4 : 3.5).attr("stroke-width", colorField ? 1 : 0.5);
            tooltip.style("opacity", 0);
        })
        .on("click", function(event, d) {
            const i = projections.indexOf(d);
            selectCountyForSummary(meta[i], method, projections);
        });

    // Legend
    if (colorField) {
        const legend = svg.append("g").attr("transform", `translate(${width - 100}, 0)`);
        legend.append("rect").attr("width", 110).attr("height", colorScale.domain().length * 20 + 10).attr("fill", "rgba(255,255,255,0.8)").attr("stroke", "#e2e8f0").attr("rx", 6);
        const lg = legend.selectAll(".lg").data(colorScale.domain()).enter().append("g").attr("transform", (d, i) => `translate(10, ${i * 20 + 15})`);
        lg.append("circle").attr("r", 5).attr("fill", d => colorScale(d));
        lg.append("text").attr("x", 12).attr("y", 4).attr("font-size", "10px").attr("font-weight", "700").text(d => d);
    }

    // Loading Vectors (Arrows) - Only for PCA biplot
    if (method === 'pca') {
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

function renderCountySidebarTable(projections, method, meta) {
    const sidebar = document.getElementById('countyResultsSidebar');
    if (!sidebar) return;
    sidebar.style.display = 'flex';

    const headRow = document.getElementById('countyTableHeadRow');
    const tbody = document.getElementById('countyResultsTableBody');
    if (!headRow || !tbody) return;

    // Update Header
    const isPCA = method === 'pca';
    const compHeaders = isPCA ? '<th style="padding: 10px 6px; font-weight: 600; color: #475569; border-bottom: 2px solid #cbd5e1;">PC1</th><th style="padding: 10px 6px; font-weight: 600; color: #475569; border-bottom: 2px solid #cbd5e1; border-top-right-radius: 6px;">PC2</th>' : '<th style="padding: 10px 6px; font-weight: 600; color: #475569; border-bottom: 2px solid #cbd5e1;">Dim 1</th><th style="padding: 10px 6px; font-weight: 600; color: #475569; border-bottom: 2px solid #cbd5e1; border-top-right-radius: 6px;">Dim 2</th>';
    headRow.innerHTML = `<th style="padding: 10px 6px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #cbd5e1; border-top-left-radius: 6px;">County</th>` + compHeaders;

    // Show spinner and hide table
    const loader = document.getElementById('sidebarTableLoading');
    const table = document.getElementById('countyResultsTable');
    if (loader) loader.style.display = 'flex';
    if (table) table.style.display = 'none';

    tbody.innerHTML = '';
    
    // Store globally for search filtering
    window.lastSidebarData = { projections, method, meta };

    // Prep sorted data (alpha)
    const tableData = [...meta];
    tableData.sort((a,b) => a.name.localeCompare(b.name));

    // Optimized Render function for body using chunking
    const populateBody = (data) => {
        tbody.innerHTML = '';
        if (data.length === 0) {
            if (loader) loader.style.display = 'none';
            if (table) table.style.display = 'table';
            return;
        }

        const chunkSize = 100;
        let index = 0;

        const renderChunk = () => {
            const fragment = document.createDocumentFragment();
            const end = Math.min(index + chunkSize, data.length);
            
            for (; index < end; index++) {
                const d = data[index];
                const tr = document.createElement('tr');
                tr.style.cursor = 'pointer';
                tr.dataset.fips = d.id; // Unique ID
                tr.onclick = () => selectCountyForSummary(d, method, projections);
                tr.innerHTML = `
                    <td style="padding: 8px 6px; border-bottom: 1px solid #e2e8f0; text-align: left;">
                        <div style="font-weight: 600; color: #1e293b; max-width: 130px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${d.name}">${d.name}</div>
                        <div style="font-size: 0.75rem; color: #64748b;">${d.state}</div>
                    </td>
                    <td style="padding: 8px 6px; border-bottom: 1px solid #e2e8f0; color: #475569;">${d.p[0].toFixed(2)}</td>
                    <td style="padding: 8px 6px; border-bottom: 1px solid #e2e8f0; color: #475569;">${d.p[1].toFixed(2)}</td>
                `;
                fragment.appendChild(tr);
            }

            tbody.appendChild(fragment);

            if (index < data.length) {
                requestAnimationFrame(renderChunk);
            } else {
                if (loader) loader.style.display = 'none';
                if (table) table.style.display = 'table';
            }
        };

        requestAnimationFrame(renderChunk);
    };

    populateBody(tableData);

    // Setup Search Listener if not already done
    const searchInput = document.getElementById('sidebarCountySearch');
    if (searchInput) {
        // Clear any previous listener to ensure we use current projections/method
        const newSearchHandler = (e) => {
            const term = e.target.value.toLowerCase();
            const { meta } = window.lastSidebarData;
            const filtered = meta.filter(item => 
                item.name.toLowerCase().includes(term) || 
                item.state.toLowerCase().includes(term)
            );
            populateBody(filtered);
        };

        // If we have an old listener, we need to replace it. 
        // Best practice here is to replace the element or use a named function we can remove.
        // For simplicity and to ensure no memory leaks, we'll clone and replace if it was already initialized.
        if (searchInput.dataset.hasListener === "true") {
            const newSearchInput = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newSearchInput, searchInput);
            newSearchInput.addEventListener('input', newSearchHandler);
            newSearchInput.dataset.hasListener = "true";
            newSearchInput.value = ''; // Reset on new analysis
        } else {
            searchInput.addEventListener('input', newSearchHandler);
            searchInput.dataset.hasListener = "true";
        }
    }

    // Auto-select first one after a short delay
    if (tableData.length > 0) {
        setTimeout(() => selectCountyForSummary(tableData[0], method, projections), 500);
    }
}

function selectCountyForSummary(d, method, projections) {
    // Clear previous row highlights
    document.querySelectorAll('#countyResultsTableBody tr').forEach(r => r.style.background = 'transparent');
    
    // Find and highlight current row using FIPS for unique match
    const allRows = document.querySelectorAll('#countyResultsTableBody tr');
    allRows.forEach(row => {
        if (row.dataset.fips === String(d.id)) {
            row.style.background = '#f1f5f9';
        }
    });

    const summaryCard = document.getElementById('countySelectionSummary');
    if (!summaryCard) return;

    summaryCard.style.display = 'block';
    document.getElementById('summaryCountyName').textContent = d.name;
    document.getElementById('summaryStateName').querySelector('span').textContent = d.state;
    
    // Grid values
    const grid = document.getElementById('componentValuesGrid');
    const isPCA = method === 'pca';
    const mLabel = method === 'tsne' ? 't-SNE' : (method === 'umap' ? 'UMAP' : 'PC');
    
    let gridHTML = '';
    const getScoreColor = (val) => val > 0 ? '#ef4444' : '#3b82f6'; // Diverging Red/Blue

    // Standard Grid for Dim 1 & Dim 2
    const scoreVal1 = d.p[0] !== undefined ? d.p[0] : 0;
    const scoreVal2 = d.p[1] !== undefined ? d.p[1] : 0;

    gridHTML = `
        <div style="background: white; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <span style="display: block; font-size: 0.65rem; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em;">${mLabel} 1</span>
            <span style="font-size: 1.25rem; font-weight: 800; color: ${getScoreColor(scoreVal1)};">${scoreVal1 > 0 ? '+' : ''}${scoreVal1.toFixed(2)}</span>
        </div>
        <div style="background: white; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <span style="display: block; font-size: 0.65rem; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em;">${mLabel} 2</span>
            <span style="font-size: 1.25rem; font-weight: 800; color: ${getScoreColor(scoreVal2)};">${scoreVal2 > 0 ? '+' : ''}${scoreVal2.toFixed(2)}</span>
        </div>
    `;

    // Only show 3rd component if in PCA mode AND it's available
    if (isPCA && d.p[2] !== undefined) {
        gridHTML += `
            <div style="background: white; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; grid-column: span 2; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <span style="display: block; font-size: 0.65rem; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em;">PC 3 Score</span>
                <span style="font-size: 1.25rem; font-weight: 800; color: ${getScoreColor(d.p[2])};">${d.p[2] > 0 ? '+' : ''}${d.p[2].toFixed(2)}</span>
            </div>
        `;
    }
    
    grid.innerHTML = gridHTML;

    // Contribution/Metric Profile Section
    const contribSection = document.getElementById('pcaContributionSection');
    const breakdown = document.getElementById('predictorBreakdown');
    const contribTitle = contribSection.querySelector('div:first-child');
    const contribInfo = contribSection.querySelector('p:last-child');
    
    contribSection.style.display = 'block';
    breakdown.innerHTML = '';
    
    if (isPCA && window.currentEigenData && d.std_values) {
        contribTitle.textContent = "PC1 Top Drivers";
        contribInfo.textContent = "These metrics most strongly influenced this county's PC1 score.";
        
        const pc1_loadings = window.currentEigenData[0].vector;
        const xLabels = window.currentXLabels;
        
        const contributions = xLabels.map((label, i) => {
            const val = d.std_values[i] || 0;
            const weight = pc1_loadings[i];
            const contribution = val * weight;
            return { label, contribution };
        });
        
        contributions.sort((a,b) => Math.abs(b.contribution) - Math.abs(a.contribution));
        
        contributions.slice(0, 5).forEach(c => {
            const row = document.createElement('div');
            row.className = 'contribution-row';
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.fontSize = '0.8rem';
            row.style.alignItems = 'center';
            row.style.padding = '4px 0';
            
            const labelSpan = document.createElement('span');
            labelSpan.style.color = '#334155';
            labelSpan.textContent = c.label;
            
            const valSpan = document.createElement('span');
            valSpan.style.fontWeight = '700';
            const isPos = c.contribution > 0;
            valSpan.style.color = isPos ? '#dc2626' : '#2563eb';
            valSpan.textContent = (isPos ? '+' : '') + c.contribution.toFixed(2);
            
            row.appendChild(labelSpan);
            row.appendChild(valSpan);
            breakdown.appendChild(row);
        });
    } else if (!isPCA && d.std_values) {
        // Feature Profile for t-SNE/UMAP
        contribTitle.textContent = "Metric Deviations (Z-Scores)";
        contribInfo.textContent = "How this county compares to the US national average (0). Red = High, Blue = Low.";
        
        const xLabels = window.currentXLabels;
        const deviations = xLabels.map((label, i) => ({
            label,
            z: d.std_values[i] || 0
        }));
        
        // Sort by absolute deviation from mean
        deviations.sort((a,b) => Math.abs(b.z) - Math.abs(a.z));
        
        deviations.slice(0, 5).forEach(m => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.fontSize = '0.8rem';
            row.style.alignItems = 'center';
            row.style.padding = '4px 0';
            
            const labelSpan = document.createElement('span');
            labelSpan.style.color = '#334155';
            labelSpan.textContent = m.label;
            
            const valSpan = document.createElement('span');
            valSpan.style.fontWeight = '700';
            const isHigh = m.z > 0;
            valSpan.style.color = m.z > 1.5 ? '#dc2626' : (m.z < -1.5 ? '#2563eb' : '#64748b');
            valSpan.textContent = (isHigh ? '+' : '') + m.z.toFixed(2);
            
            row.appendChild(labelSpan);
            row.appendChild(valSpan);
            breakdown.appendChild(row);
        });
    } else {
        contribSection.style.display = 'none';
    }

    // Move scroll in sidebar to top
    document.getElementById('countyResultsSidebar').scrollTo({ top: 0, behavior: 'smooth' });

    // Highlight dot in D3
    d3.selectAll('.chart-area circle.point')
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .attr('r', 4);
        
    d3.selectAll('.chart-area circle.point')
        .filter(dot => {
            const i = window.currentProjections.indexOf(dot);
            const m = window.currentMeta[i];
            return m.name === d.name && m.state === d.state;
        })
        .attr('stroke', '#000')
        .attr('stroke-width', 2)
        .attr('r', 8)
        .raise();
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
let lastProcessedMapState = null;

// visualization specific logic is handled in initPCASandbox event listeners


document.getElementById('pcaToggle').addEventListener('change', (e) => {
    currentSelectedPC = e.target.value;
    updatePCAMapData();
});

function initPCAMapModal() {
    const toggle = document.getElementById('pcaToggle');
    toggle.innerHTML = '';

    const method = document.getElementById('drMethod').value;
    const prefix = method === 'pca' ? 'PC' : (method === 'tsne' ? 'tSNE-' : 'UMAP-');
    const labelPrefix = method === 'pca' ? 'Principal Component' : (method === 'tsne' ? 't-SNE Dimension' : 'UMAP Dimension');

    const methodDisplay = method === 'pca' ? 'Principal Components' : (method === 'tsne' ? 't-SNE' : 'UMAP');
    document.getElementById('mapModalTitle').textContent = `Geographic Distribution: ${methodDisplay}`;

    // Populate dropdown based on available dimensions
    for (let i = 1; i <= window.pcaMapAvailableComponents; i++) {
        const option = document.createElement('option');
        option.value = `${prefix}${i}`;
        option.textContent = `${labelPrefix} ${i}`;
        toggle.appendChild(option);
    }

    currentSelectedPC = `${prefix}1`;
    toggle.value = currentSelectedPC;

    const currentStateFilter = document.getElementById('stateFilter').value;

    if (amMapRoot && lastProcessedMapState !== currentStateFilter) {
        amMapRoot.dispose();
        amMapRoot = null;
    }
    lastProcessedMapState = currentStateFilter;

    // Initialize amCharts if not already done
    if (!amMapRoot) {
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

    mapPolygonSeries.mapPolygons.template.adapters.add("fill", function (fill, target) {
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

            const method = document.getElementById('drMethod').value;
            let displayLabel = currentSelectedPC;
            if (method === 'pca') displayLabel = 'PC ' + currentSelectedPC.replace('PC', '');
            else if (method === 'tsne') displayLabel = 't-SNE ' + currentSelectedPC.replace('tSNE-', '');
            else if (method === 'umap') displayLabel = 'UMAP ' + currentSelectedPC.replace('UMAP-', '');

            return "{name}: [bold]{value}[/] (" + displayLabel + ")";
        }
        return text;
    });

    // Click handler for county breakdown
    mapPolygonSeries.mapPolygons.template.events.on("click", function (ev) {
        const dataItem = ev.target.dataItem;
        if (!dataItem) return;

        const method = document.getElementById('drMethod').value;

        // Only show breakdown table for PCA
        if (method !== 'pca') {
            document.getElementById('pcaCountyBreakdownContainer').style.display = 'none';
            return;
        }

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

    const method = document.getElementById('drMethod').value;
    const legendLabel = method === 'pca' ? 'Component' : 'Dimension';

    const heatLegend = amMapRoot.container.children.push(am5.HeatLegend.new(amMapRoot, {
        orientation: "horizontal",
        startColor: am5.color(0x3b82f6), // Blue 
        endColor: am5.color(0xef4444),   // Red
        startText: `Negative ${legendLabel} Score`,
        endText: `Positive ${legendLabel} Score`,
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

    if (window.innerWidth <= 768) {
        heatLegend.set("forceHidden", true);
    } else {
        // Hover logic to show value on legend
        mapPolygonSeries.mapPolygons.template.events.on("pointerover", function (ev) {
            const val = ev.target.dataItem.get("value");
            if (val !== null && val !== undefined) {
                heatLegend.showValue(val);
            }
        });
        mapPolygonSeries.mapPolygons.template.events.on("pointerout", function (ev) {
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
    if (!amMapRoot || !mapPolygonSeries || !window.pcaMapData) return;

    const mapData = [];
    const geoJSON = mapPolygonSeries.get("geoJSON");
    const geoFeatures = geoJSON ? geoJSON.features : [];

    // Create quick lookup from mapData
    const lookup = {};
    window.pcaMapData.forEach(d => {
        if (d.name && d.state) {
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
        if (dataObj && dataObj[currentSelectedPC] !== undefined && dataObj[currentSelectedPC] !== null) {
            val = Number(dataObj[currentSelectedPC].toFixed(3));
            if (val < minVal) minVal = val;
            if (val > maxVal) maxVal = val;
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
    if (activeCounty && activeCounty.dataItem) {
        const cName = activeCounty.dataItem.dataContext ? activeCounty.dataItem.dataContext.name : activeCounty.dataItem.get("name");
        renderCountyPCABreakdown(activeCounty.dataItem.get("id"), cName);
    }
}

function renderCountyPCABreakdown(geoId, printName) {
    const container = document.getElementById('pcaCountyBreakdownContainer');
    const tableBody = document.getElementById('pcaCountyBreakdownBody');
    const titleEl = document.getElementById('pcaCountyBreakdownTitle');

    if (!container || !tableBody || !titleEl) return;

    // Find the specific item directly from map series data to easily get countyData attached
    let dataItemObj = null;
    mapPolygonSeries.data.each(d => {
        if (d.id === geoId) dataItemObj = d;
    });

    if (!dataItemObj || !dataItemObj.countyData) {
        container.style.display = 'none';
        return;
    }

    const cData = dataItemObj.countyData;
    const method = document.getElementById('drMethod').value;

    // Only show this breakdown for PCA - non-linear methods don't have direct contributions
    if (method !== 'pca') {
        container.style.display = 'none';
        return;
    }

    // Get the index of the selected component (e.g. "PC1" -> 0)
    const pcIndex = parseInt(currentSelectedPC.replace("PC", "")) - 1;
    const pcEigen = window.pcaEigenData ? window.pcaEigenData[pcIndex] : null;

    const labelPrefix = method === 'pca' ? 'Principal Component' : 'Dimension';
    let pNameStr = printName || (dataItemObj.name) || "Selected Area";
    titleEl.textContent = `${pNameStr} Details (${labelPrefix} ${pcIndex + 1})`;
    tableBody.innerHTML = '';

    const vars = window.pcaVariables;
    const stdVals = cData.standardizedValues;

    const weights = pcEigen.vector;
    // Build contributions array for sorting
    let contributions = [];
    for (let i = 0; i < vars.length; i++) {
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
    contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

    let totalScore = 0;
    contributions.forEach((item, index) => {
        totalScore += item.contribution;
        const row = document.createElement('tr');
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

function toggleCountyHelp() {
    const panel = document.getElementById('countyHelpPanel');
    if (!panel) return;

    if (panel.style.display === 'none') {
        const method = document.getElementById('drMethod').value;
        const isPCA = method === 'pca';
        const mLabel = method === 'tsne' ? 't-SNE' : (method === 'umap' ? 'UMAP' : 'PCA');
        
        // Define Library Links
        const libLinks = {
            'pca': '<a href="https://mathjs.org/" target="_blank" style="color: #c83830; text-decoration: underline;">Math.js</a> (Linear Algebra)',
            'tsne': '<a href="https://github.com/karpathy/tsnejs" target="_blank" style="color: #c83830; text-decoration: underline;">t-SNE-JS</a> (Manifold Learning)',
            'umap': '<a href="https://github.com/scienceai/umap-js" target="_blank" style="color: #c83830; text-decoration: underline;">UMAP-JS</a> (Topological Data Analysis)'
        };

        panel.innerHTML = `
            <div style="margin-bottom: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
                <strong style="color: #0f172a; font-size: 0.9rem;">Analysis Workflow (${mLabel})</strong>
            </div>

            <div style="margin-bottom: 12px;">
                <strong style="color: #c83830; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">Steps:</strong>
                <ol style="padding-left: 20px; margin: 5px 0; font-weight: 500;">
                    <li><strong>Standardization:</strong> Scale variables to Z-scores (Mean=0, SD=1).</li>
                    <li><strong>Reduction:</strong> Compress high-dimensional patterns into 2D space using ${mLabel}.</li>
                    <li><strong>Clustering:</strong> Apply K-Means to identify counties with similar profiles.</li>
                </ol>
            </div>

            <div style="margin-bottom: 12px;">
                <strong style="color: #c83830; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">Interpretation:</strong>
                <ul style="padding-left: 18px; margin: 5px 0;">
                    <li><strong style="color: #ef4444;">Score (+):</strong> Higher relative value in the projected dimension.</li>
                    <li><strong style="color: #3b82f6;">Score (-):</strong> Lower relative value in the projected dimension.</li>
                    ${isPCA ? 
                        '<li><strong>Top Drivers:</strong> Percentage loadings showing which metrics (e.g., Obesity, Income) have the strongest mathematical pull on this county\'s position.</li>' : 
                        '<li><strong>Clusters:</strong> Geometric proximity indicates that these counties have nearly identical health/economic characteristics across all selected features.</li>'
                    }
                </ul>
            </div>

            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 0.75rem;">
                <strong>Engine:</strong> ${libLinks[method]}
            </div>
        `;
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
}
