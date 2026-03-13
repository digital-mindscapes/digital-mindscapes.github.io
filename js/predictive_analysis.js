/**
 * Predictive Analysis Engine V4
 * Adapted for Ultra Premium UI Overhaul
 */

let rawData = [];
let currentStep = 1;
let mlWorker = null;
let lastResults = null;

// Configuration state
const config = {
    analysisType: 'classification',
    targetVar: '',
    inputVars: [],
    normalization: 'none',
    imputation: 'drop',
    numClasses: 3,
    thresholds: [],
    splitRatio: 0.8,
    shuffle: true,
    algorithm: '',
    hyperparams: {}
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

/**
 * Initialization function
 */
async function initPredictiveAnalysis() {
    // We remove the blocking loader for initial data load to make the page feel instant
    try {
        await loadDatasets();
    } catch (error) {
        showError("Data Sync Failed: " + error.message);
    }

    setupStepper();
    setupEventListeners();
    populateStep1();
}

/**
 * Load datasets
 */
async function loadDatasets() {
    const acsUrl = 'data/ACS Data/county_acs_flat.json';
    const placesUrl = 'data/PLACES Data/county_places_flat.json';

    const [acsRes, placesRes] = await Promise.all([
        fetch(acsUrl),
        fetch(placesUrl)
    ]);

    const acsData = await acsRes.json();
    const placesData = await placesRes.json();

    const placesCountyLookup = {};
    placesData.forEach(d => {
        if (d.id) placesCountyLookup[d.id.toLowerCase()] = d;
    });

    rawData = acsData.map(acs => {
        let cleanName = acs.name ? acs.name.replace(/_/g, '').replace(/\s+County$/i, '').replace(/\s+Parish$/i, '').trim() : '';
        let placesKey = `us.${acs.state_abbr}.${cleanName}`.toLowerCase();
        let places = placesCountyLookup[placesKey] || {};
        return { ...acs, ...places };
    }).filter(d => d.depression_prevalence != null);
}

/**
 * UI Navigation
 */
function setupStepper() {
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');

    nextBtn.addEventListener('click', () => {
        if (validateStep(currentStep) && currentStep < 5) {
            currentStep++;
            updateStepUI();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateStepUI();
        }
    });

    document.querySelectorAll('.pr-step').forEach(item => {
        item.addEventListener('click', () => {
            const requestedStep = parseInt(item.dataset.step);
            if (requestedStep < currentStep || validateStep(currentStep)) {
                currentStep = requestedStep;
                updateStepUI();
            }
        });
    });
}

function updateStepUI() {
    document.querySelectorAll('.pr-step').forEach(item => {
        const s = parseInt(item.dataset.step);
        item.classList.toggle('active', s === currentStep);
        item.classList.toggle('completed', s < currentStep);
    });

    document.querySelectorAll('.pr-card').forEach(card => {
        card.classList.toggle('active', card.id === `step-${currentStep}-content`);
    });

    const bottomNav = document.getElementById('bottomNav');
    if (currentStep === 5) {
        bottomNav.style.display = 'none';
        updateSummary();
    } else {
        bottomNav.style.display = 'flex';
        document.getElementById('prevBtn').disabled = currentStep === 1;
        document.getElementById('nextBtn').textContent = currentStep === 4 ? 'Review Configuration' : 'Next Phase';
    }
}

/**
 * Step 1 population
 */
function populateStep1() {
    const yVarSelect = document.getElementById('yVar');
    const xVarContainer = document.getElementById('xVarList');

    const yOptions = [...HEALTH_METRICS, ...ECON_METRICS];
    yVarSelect.innerHTML = yOptions.map(m => `<option value="${m.id}">${m.label}</option>`).join('');

    let xHtml = '<div class="pr-group-title">Health Outcomes</div>';
    HEALTH_METRICS.forEach(m => xHtml += renderCheckbox(m));

    xHtml += '<div class="pr-group-title">Socioeconomics</div>';
    ECON_METRICS.forEach(m => xHtml += renderCheckbox(m));

    xVarContainer.innerHTML = xHtml;

    xVarContainer.addEventListener('change', (e) => {
        if (e.target.name === 'xVar') {
            e.target.closest('.pr-checkbox').classList.toggle('checked', e.target.checked);
        }
    });

    updateThresholds();

    yVarSelect.addEventListener('change', () => {
        config.targetVar = yVarSelect.value;
        updateThresholds();
    });
}

function renderCheckbox(m) {
    return `
        <label class="pr-checkbox">
            <input type="checkbox" name="xVar" value="${m.id}">
            <div class="pr-chk-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg></div>
            <div class="pr-chk-text">
                <strong>${m.label}</strong>
                <span>${m.id.split('_')[0]}</span>
            </div>
        </label>
    `;
}

/**
 * Global Event Listeners
 */
function setupEventListeners() {
    document.querySelectorAll('input[name="analysisType"]').forEach(input => {
        input.addEventListener('change', (e) => {
            config.analysisType = e.target.value;
            config.algorithm = ''; // Reset algo on type change
            document.getElementById('classificationOptions').style.display =
                config.analysisType === 'classification' ? 'block' : 'none';
            updateAlgorithmGallery();
            updateHyperparamsUI(); // Also clear hyperparams
        });
    });

    const classSlide = document.getElementById('numClasses');
    if (classSlide) classSlide.addEventListener('input', (e) => {
        document.getElementById('numClassesVal').textContent = e.target.value;
        updateThresholds();
    });

    const ratioSlide = document.getElementById('splitRatio');
    if (ratioSlide) ratioSlide.addEventListener('input', (e) => {
        const val = e.target.value;
        document.getElementById('splitRatioVal').textContent = `${val}%`;
        document.getElementById('vizTrain').textContent = `Training (${val}%)`;
        document.getElementById('vizTest').textContent = `Test (${100 - val}%)`;
        document.getElementById('vizTrain').style.flex = val;
        document.getElementById('vizTest').style.flex = 100 - val;
    });

    const shufChk = document.getElementById('shuffleData');
    if (shufChk) shufChk.addEventListener('change', function () {
        this.closest('.pr-checkbox').classList.toggle('checked', this.checked);
    });

    document.getElementById('runPipelineBtn').addEventListener('click', runPipeline);

    document.getElementById('cancelSimulationBtn').addEventListener('click', cancelSimulation);

    // XAI Modal Listeners
    const explainBtn = document.getElementById('explainModelBtn');
    const xaiModal = document.getElementById('xaiModal');
    const closeXai = document.getElementById('closeXaiBtn');

    if (explainBtn && xaiModal) {
        explainBtn.addEventListener('click', () => {
            if (lastResults) {
                xaiModal.classList.add('active');
                renderFeatureImportanceChart(lastResults);
            }
        });
    }
    if (closeXai && xaiModal) {
        closeXai.addEventListener('click', () => {
            xaiModal.classList.remove('active');
        });
    }
    window.addEventListener('click', (e) => {
        if (e.target === xaiModal) xaiModal.classList.remove('active');
    });

    const autoBtn = document.getElementById('autoSplitBtn');
    if(autoBtn) autoBtn.addEventListener('click', runAutoSplit);

    updateAlgorithmGallery();
}

/**
 * Automatically set thresholds based on Quantiles (even sample distribution)
 */
function runAutoSplit() {
    const yVar = document.getElementById('yVar').value;
    const num = parseInt(document.getElementById('numClasses').value);
    
    if (!rawData.length || !yVar) return;

    // Get sorted data
    const vals = rawData.map(d => d[yVar]).filter(v => v != null && !isNaN(v)).sort((a, b) => a - b);
    if (!vals.length) return;

    for (let i = 1; i < num; i++) {
        const p = i / num;
        const idx = Math.floor(p * (vals.length - 1));
        const quantileValue = vals[idx];
        
        const input = document.getElementById(`thresh-${i}`);
        if (input) {
            input.value = quantileValue.toFixed(quantileValue > 10 ? 0 : 2);
            // Visual feedback
            input.style.backgroundColor = '#fffbeb';
            setTimeout(() => { input.style.backgroundColor = '#fff'; }, 1000);
        }
    }
    updateClassCounts();
}

function cancelSimulation() {
    if (mlWorker) {
        mlWorker.terminate();
        mlWorker = null;
    }
    hideLoader();
    showWarningDialog("Simulation Cancelled", "The background ML process was safely terminated. You can adjust your configuration and try again.");
}

function updateThresholds() {
    const yVar = document.getElementById('yVar').value;
    const num = parseInt(document.getElementById('numClasses').value);
    const container = document.getElementById('thresholdInputs');
    
    if (!rawData.length || !yVar) return;

    // Calculate data range for smart defaults
    const vals = rawData.map(d => d[yVar]).filter(v => v != null && !isNaN(v));
    const min = d3.min(vals) || 0;
    const max = d3.max(vals) || 100;
    const range = max - min;
    
    // Determine precision based on range
    const step = range > 10 ? 1 : (range > 1 ? 0.1 : 0.01);
    
    let html = `
        <div style="margin-bottom: 15px; padding: 10px; background: #fff; border-radius: 10px; border: 1px dashed var(--pr-border);">
            <div style="display:flex; justify-content:space-between; font-size: 0.75rem; color: var(--pr-text-muted); font-weight: 700;">
                <span>RANGE MIN: ${min.toFixed(2)}</span>
                <span>RANGE MAX: ${max.toFixed(2)}</span>
            </div>
        </div>
    `;

    for (let i = 1; i < num; i++) {
        // Default to equidistant splits
        const defaultVal = min + (range * (i / num));
        html += `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
                <div style="display:flex; flex-direction:column;">
                    <span style="font-size: 0.85rem; font-weight: 700; color: var(--pr-dark)">Split ${i} Bound</span>
                    <span style="font-size: 0.7rem; color: var(--pr-text-muted)">Boundary value for Class ${i}</span>
                </div>
                <input type="number" class="pr-input threshold-input" 
                       style="width: 100px; padding: 8px 12px; text-align: center; font-weight: 800; border-color: var(--pr-primary);" 
                       id="thresh-${i}" 
                       data-idx="${i}"
                       step="${step}" 
                       value="${defaultVal.toFixed(range > 10 ? 0 : 2)}">
            </div>
        `;
    }
    
    html += `<div id="classFrequencies" style="margin-top:20px; border-top: 1px solid var(--pr-border); padding-top: 15px;"></div>`;
    
    container.innerHTML = html;
    
    // Add real-time counting logic
    const inputs = container.querySelectorAll('.threshold-input');
    inputs.forEach(input => {
        input.addEventListener('input', updateClassCounts);
    });
    
    updateClassCounts();
}

/**
 * Calculate and display frequency of counties in each class
 */
function updateClassCounts() {
    const yVar = document.getElementById('yVar').value;
    const num = parseInt(document.getElementById('numClasses').value);
    const freqContainer = document.getElementById('classFrequencies');
    if (!freqContainer || !rawData.length) return;

    // Collect current thresholds
    const thresh = [];
    for (let i = 1; i < num; i++) {
        const val = parseFloat(document.getElementById(`thresh-${i}`).value);
        if (!isNaN(val)) thresh.push(val);
    }
    thresh.sort((a, b) => a - b);

    // Count occurrences
    const counts = Array(num).fill(0);
    rawData.forEach(r => {
        const val = r[yVar];
        if (val == null || isNaN(val)) return;
        
        let classIdx = 0;
        for (let i = 0; i < thresh.length; i++) {
            if (val > thresh[i]) classIdx = i + 1;
        }
        counts[classIdx]++;
    });

    // Render count badges
    freqContainer.innerHTML = `
        <label style="font-size: 0.75rem; color: var(--pr-text-muted); margin-bottom: 8px; display: block;">Sample Distribution (Class Size)</label>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${counts.map((c, i) => `
                <div style="flex: 1; min-width: 60px; background: var(--pr-surface-alt); padding: 8px; border-radius: 10px; text-align: center; border: 1px solid var(--pr-border);">
                    <div style="font-size: 0.65rem; font-weight: 800; color: var(--pr-text-muted);">Class ${i}</div>
                    <div style="font-size: 1rem; font-weight: 800; color: var(--pr-primary);">${c}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function updateAlgorithmGallery() {
    const gallery = document.getElementById('algorithmGallery');
    const type = config.analysisType;

    const algos = type === 'classification' ? [
        { id: 'rf', name: 'Random Forest', desc: 'Powerful ensemble bagging tree.' },
        { id: 'nn', name: 'Neural Network', desc: 'Multi-layer perceptron (Deep Learning).' },
        { id: 'gbm', name: 'Gradient Boosting', desc: 'Sequential error correction ensemble.' },
        { id: 'xgb', name: 'XGBoost (JS)', desc: 'High-performance gradient boosting.' },
        { id: 'knn', name: 'K-NN', desc: 'Proximity-based instance learning.' }
    ] : [
        { id: 'rf', name: 'Random Forest', desc: 'Powerful bagging ensemble.' },
        { id: 'nn', name: 'Neural Network', desc: 'Multi-layer perceptron for regression.' },
        { id: 'gbm', name: 'Gradient Boosting', desc: 'Sequential error correction (Regression).' },
        { id: 'xgb', name: 'XGBoost (JS)', desc: 'Optimized gradient boosted trees.' },
        { id: 'linear', name: 'Multivariate OLS', desc: 'Standard linear regression.' }
    ];

    gallery.innerHTML = algos.map(a => `
        <div class="pr-algo-card ${config.algorithm === a.id ? 'selected' : ''}" onclick="selectAlgo('${a.id}')">
            <h4>${a.name}</h4>
            <p>${a.desc}</p>
        </div>
    `).join('');
}

window.selectAlgo = (id) => {
    config.algorithm = id;
    updateAlgorithmGallery();
    updateHyperparamsUI();
};

function updateHyperparamsUI() {
    const container = document.getElementById('hyperparamsContainer');
    const algo = config.algorithm;
    if (!algo) return;

    let html = `<h4 style="margin:0 0 15px 0;">${algo.toUpperCase()} Controls</h4>`;
    if (algo === 'rf') {
        html += renderSliderParam('numTrees', 'Estimators', 10, 150, 50, 10);
        html += renderSliderParam('maxDepth', 'Max Depth', 2, 20, 10, 1);
    } else if (algo === 'nn') {
        html += renderSliderParam('hiddenLayers', 'Hidden Layers', 1, 5, 2, 1);
        html += renderSliderParam('neuronsPerLayer', 'Neurons per Layer', 2, 32, 12, 1);
        html += renderSliderParam('iterations', 'Training Epochs', 50, 1000, 200, 50);
        html += renderSliderParam('learningRate', 'Learning Rate', 0.001, 0.5, 0.1, 0.005);
        html += `
            <div style="margin-top:15px; padding:12px; background:#fff7ed; border:1px solid #fed7aa; border-radius:10px; font-size:0.85rem; color:#9a3412;">
                <div style="font-weight:700; display:flex; align-items:center; gap:5px; margin-bottom:4px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    Overfitting Tip
                </div>
                If training performance is much higher than testing, try reducing the number of neurons or layers.
            </div>
            <div id="nnArchitectureContainer" style="margin-top:20px; padding:15px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0; text-align:center;">
                <h5 style="margin:0 0 10px 0; font-size:0.75rem; color:#64748b; text-transform:uppercase;">Architecture Diagram</h5>
                <div id="nnSvgWrapper" style="width:100%; height:180px; display:flex; align-items:center; justify-content:center;"></div>
            </div>
        `;
        // Defer initial SVG render
        setTimeout(() => renderNNSVG(), 50);
    } else if (algo === 'gbm' || algo === 'xgb') {
        html += renderSliderParam('nEstimators', 'Estimators', 10, 200, 100, 10);
        html += renderSliderParam('learningRate', 'Learning Rate', 0.01, 1, 0.1, 0.01);
        html += renderSliderParam('maxDepth', 'Max Depth', 1, 15, 3, 1);
    } else if (algo === 'knn') {
        html += renderSliderParam('k', 'K-Neighbors', 1, 21, 5, 2);
        html += `<div style="margin-top:10px; font-size:0.85rem; color:var(--pr-text-muted);">Ensure distance metrics are scaled in Step 2.</div>`;
    } else {
        html += '<p style="margin:0; color:var(--pr-text-muted);">This model computes using standardized framework defaults.</p>';
    }
    container.innerHTML = html;
}

function renderSliderParam(id, label, min, max, val, step) {
    return `
        <div style="margin-bottom: 20px;">
            <div class="pr-slider-header">
                <span class="pr-slider-label">${label}</span>
                <span class="pr-slider-value" id="${id}-badge">${val}</span>
            </div>
            <input type="range" id="param-${id}" min="${min}" max="${max}" value="${val}" step="${step}" 
                   class="pr-slider" oninput="updateSliderBadge('${id}', this.value)">
        </div>
    `;
}

function updateSliderBadge(id, val) {
    document.getElementById(id + '-badge').textContent = val;
    if (config.algorithm === 'nn' && (id === 'hiddenLayers' || id === 'neuronsPerLayer')) {
        renderNNSVG();
    }
}

function renderNNSVG() {
    const wrapper = document.getElementById('nnSvgWrapper');
    if (!wrapper) return;

    const layers = parseInt(document.getElementById('param-hiddenLayers')?.value || 2);
    const neurons = parseInt(document.getElementById('param-neuronsPerLayer')?.value || 12);
    
    // Virtual nodes for Input and Output
    const inputCount = 5; 
    const outputCount = 1;

    const width = wrapper.clientWidth || 300;
    const height = 180;
    const padding = 25;

    const totalLayers = layers + 2; 
    const layerSpacing = (width - padding * 2) / (totalLayers - 1);
    
    let svgHtml = `
        <svg width="${width}" height="${height}" style="overflow:visible;" viewBox="0 0 ${width} ${height}">
            <defs>
                <filter id="nnGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <linearGradient id="connGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#94a3b8;stop-opacity:0.2" />
                    <stop offset="50%" style="stop-color:#6366f1;stop-opacity:0.6" />
                    <stop offset="100%" style="stop-color:#94a3b8;stop-opacity:0.2" />
                </linearGradient>
            </defs>
    `;

    // Calculate node positions
    const nodeCoords = [];
    for (let l = 0; l < totalLayers; l++) {
        let nNodes = neurons;
        if (l === 0) nNodes = inputCount;
        if (l === totalLayers - 1) nNodes = outputCount;

        const displayNodes = Math.min(nNodes, 8);
        const ySpacing = (height - padding * 2) / (displayNodes + 1);
        
        const layerX = padding + l * layerSpacing;
        const layerCoords = [];

        for (let n = 0; n < displayNodes; n++) {
            const nodeY = padding + (n + 1) * ySpacing;
            layerCoords.push({ x: layerX, y: nodeY });
        }
        nodeCoords.push(layerCoords);
    }

    // Draw Connections
    for (let l = 0; l < totalLayers - 1; l++) {
        nodeCoords[l].forEach(start => {
            nodeCoords[l+1].forEach(end => {
                // Background connection
                svgHtml += `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" 
                                 stroke="#cbd5e1" stroke-width="1.2" opacity="0.5" />`;
                
                // Highlighted path (if random or representative)
                if (Math.random() > 0.8) {
                    svgHtml += `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" 
                                     stroke="url(#connGrad)" stroke-width="1.5" class="nn-flow-line" />`;
                }
            });
        });
    }

    // Draw Nodes
    nodeCoords.forEach((layer, l) => {
        let color = "#c83830"; // Hidden
        let label = "H";
        if (l === 0) { color = "#64748b"; label = "I"; }
        if (l === totalLayers - 1) { color = "#10b981"; label = "O"; }

        layer.forEach(node => {
            // Shadow circle for depth
            svgHtml += `<circle cx="${node.x}" cy="${node.y + 1}" r="6" fill="rgba(0,0,0,0.1)" />`;
            // Primary node
            svgHtml += `<circle cx="${node.x}" cy="${node.y}" r="5.5" fill="${color}" stroke="white" stroke-width="1.5" filter="url(#nnGlow)" />`;
        });
    });

    svgHtml += `</svg>`;
    wrapper.innerHTML = svgHtml;
}

/**
 * Global Warning Dialog Handlers
 */
function showWarningDialog(title, message) {
    document.getElementById('prWarningTitle').textContent = title;
    document.getElementById('prWarningMessage').textContent = message;
    document.getElementById('prWarningDialog').style.display = 'flex';
}

window.closeWarningDialog = function () {
    document.getElementById('prWarningDialog').style.display = 'none';
};

/**
 * Step 5 Validation and Summary
 */
function updateSummary() {
    document.getElementById('sumTarget').textContent = document.getElementById('yVar').selectedOptions[0].text;
    document.getElementById('sumType').textContent = config.analysisType.charAt(0).toUpperCase() + config.analysisType.slice(1);
    document.getElementById('sumAlgo').textContent = config.algorithm ? config.algorithm.toUpperCase() : 'None Selected';
    document.getElementById('sumX').textContent = `${getSelectedXVars().length} Selected`;
}

function validateStep(step) {
    if (step === 1) {
        config.targetVar = document.getElementById('yVar').value;
        config.inputVars = getSelectedXVars();
        if (config.inputVars.length === 0) {
            showWarningDialog("Missing Predictors", "To build a robust model, please select at least one predictor feature (X) from the list before proceeding.");
            return false;
        }
    } else if (step === 4 && !config.algorithm) {
        showWarningDialog("Algorithm Required", "Please select a training algorithm from the model gallery to evaluate your data.");
        return false;
    }
    return true;
}

function getSelectedXVars() {
    return Array.from(document.querySelectorAll('input[name="xVar"]:checked')).map(cb => cb.value);
}

/**
 * Core ML Pipeline trigger
 */
async function runPipeline() {
    config.normalization = document.querySelector('input[name="normalization"]:checked').value;
    config.imputation = document.getElementById('imputationMethod').value;
    config.splitRatio = parseInt(document.getElementById('splitRatio').value) / 100;
    config.shuffle = document.getElementById('shuffleData').checked;

    showLoader("Vectorizing Data Matrices...");

    // Collect hyperparameters
    const hyperInputs = document.querySelectorAll('#hyperparamsContainer input[type="range"]');
    config.hyperparams = {};
    hyperInputs.forEach(input => {
        const key = input.id.replace('param-', '');
        config.hyperparams[key] = parseFloat(input.value);
    });

    // Practitioner Check: Target Leakage
    const features = getSelectedXVars();
    if (features.includes(config.targetVar)) {
        showError(`Circular Reasoning Detected: The target variable "${config.targetVar}" is currently included in your predictor list. This will lead to 100% accuracy but zero real-world insight. Please deselect it.`);
        return;
    }
    config.inputVars = features;

    try {
        const { df, droppedCount } = runDataProcessing(rawData);
        const dataForWorker = prepareSplit(df);

        showLoader(`Dispatching to ML Worker [${config.algorithm.toUpperCase()}]...`);

        mlWorker = new Worker('js/ml_worker.js');

        mlWorker.onerror = function (err) {
            hideLoader();
            showError("Worker Crash: " + err.message);
            if (mlWorker) mlWorker.terminate();
            mlWorker = null;
        };

        mlWorker.onmessage = function (e) {
            if (e.data.type === 'progress') {
                showLoader(e.data.status);
                const progressFill = document.getElementById('loaderProgress');
                const progressText = document.getElementById('progressPercent');
                if (progressFill) progressFill.style.width = e.data.percent + '%';
                if (progressText) progressText.textContent = Math.round(e.data.percent) + '%';
                return;
            }

            hideLoader();
            if (e.data.success) {
                const finalResults = e.data.results;
                finalResults.metadata.droppedCount = droppedCount;
                finalResults.metadata.rawCount = rawData.length;
                renderResults(finalResults, dataForWorker.test);
            } else {
                showError("Worker Exception: " + (e.data.error || "Unknown Model Error"));
            }
            
            if (mlWorker) {
                mlWorker.terminate();
                mlWorker = null;
            }
        };

        mlWorker.postMessage({ data: dataForWorker, config });

    } catch (e) {
        showError(e.message);
        hideLoader();
    }
}

function runDataProcessing(data) {
    const rawCount = data.length;
    let df = JSON.parse(JSON.stringify(data));
    const target = config.targetVar;
    const features = config.inputVars;
    const all = [target, ...features];

    // Impute Missing
    if (config.imputation === 'drop') {
        df = df.filter(r => all.every(v => r[v] != null && !isNaN(r[v])));
    } else {
        all.forEach(v => {
            const vals = df.map(r => r[v]).filter(val => val != null && !isNaN(val));
            let fill = config.imputation === 'mean' ? d3.mean(vals) : d3.median(vals);
            if (fill == null || isNaN(fill)) fill = 0; // Absolute fallback if all records are NaN for this feature
            df.forEach(r => { if (r[v] == null || isNaN(r[v])) r[v] = fill; });
        });
    }

    const droppedCount = rawCount - df.length;

    // Practitioner Check: Constant Features
    const constantFeatures = [];
    features.forEach(v => {
        const vals = df.map(r => r[v]);
        const unique = new Set(vals);
        if (unique.size <= 1) constantFeatures.push(v);
    });

    if (constantFeatures.length > 0) {
        throw new Error(`Critical Error: Features [${constantFeatures.join(', ')}] have zero variance (all values are identical). Please remove them from the input list.`);
    }


    // Label Binning for Classification
    if (config.analysisType === 'classification') {
        const els = Array.from(document.querySelectorAll('[id^=thresh-]'));
        const thresh = els.map(i => parseFloat(i.value)).sort((a, b) => a - b);
        df.forEach(r => {
            let label = 0;
            for (let i = 0; i < thresh.length; i++) if (r[target] > thresh[i]) label = i + 1;
            r._target_class = label;
        });
    }

    return { df, droppedCount };
}

function prepareSplit(df) {
    let shuffled = [...df];
    if (config.shuffle) {
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
    }
    const idx = Math.floor(shuffled.length * config.splitRatio);
    const data = { train: shuffled.slice(0, idx), test: shuffled.slice(idx) };

    // Practitioner Best Practice: Scale train/test separately using train statistics (Avoid Data Leakage)
    if (config.normalization !== 'none') {
        const features = config.inputVars;
        features.forEach(v => {
            const trainVals = data.train.map(r => r[v]);
            
            if (config.normalization === 'minmax') {
                const min = d3.min(trainVals);
                const max = d3.max(trainVals);
                const range = (max - min) || 1;
                data.train.forEach(r => r[v] = (r[v] - min) / range);
                data.test.forEach(r => r[v] = (r[v] - min) / range);
            } else {
                const mean = d3.mean(trainVals);
                const std = d3.deviation(trainVals) || 1;
                data.train.forEach(r => r[v] = (r[v] - mean) / std);
                data.test.forEach(r => r[v] = (r[v] - mean) / std);
            }
        });
    }

    return data;
}

function renderResults(results, testData) {
    document.getElementById('step-5-content').classList.remove('active');
    document.querySelector('.pr-sidebar').style.opacity = '0.4';

    const display = document.getElementById('resultsDisplay');
    display.classList.add('active'); // show card

    lastResults = results; // Store for Explainability

    const metricsContainer = document.getElementById('metricsSummary');

    // Icon Mapping
    const metricIcons = {
        "Accuracy": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        "Precision": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>',
        "Recall": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
        "F1-Score": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>',
        "AUC": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20v-6M6 20V10M18 20V4"></path></svg>',
        "MSE": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>',
        "RMSE": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>',
        "MAE": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
        "R\u00b2 Score": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>'
    };

    metricsContainer.innerHTML = Object.entries(results.metrics).map(([k, v]) => {
        const trainVal = results.trainMetrics[k];
        const gap = Math.abs(parseFloat(v) - parseFloat(trainVal));
        const isOverfitting = gap > 0.15; // Simple heuristic

        return `
            <div class="pr-metric-card" style="position:relative;">
                <div class="pr-metric-icon">
                    ${metricIcons[k] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'}
                </div>
                <div class="pr-metric-info">
                    <label>${k}</label>
                    <div style="font-size:1.4rem; font-weight:800; color:#0f172a;">${v}</div>
                    <div style="font-size:0.75rem; color:#64748b; margin-top:2px;">Train: ${trainVal}</div>
                </div>
                ${isOverfitting ? '<div style="position:absolute; top:8px; right:8px; width:18px; height:18px; background:#f59e0b; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:bold;" title="Possible Overfitting: Significant gap between Training and Testing performance.">!</div>' : ''}
            </div>
        `;
    }).join('');

    // Populate Metadata Cards
    const metaContainer = document.getElementById('metadataCards');
    if (metaContainer && results.metadata) {
        const raw = results.metadata.rawCount;
        const cleaned = results.metadata.trainCount + results.metadata.testCount;
        const loss = ((results.metadata.droppedCount / raw) * 100).toFixed(1);
        const trainPct = ((results.metadata.trainCount / cleaned) * 100).toFixed(0);
        const testPct = ((results.metadata.testCount / cleaned) * 100).toFixed(0);

        metaContainer.innerHTML = `
            <div class="pr-meta-item">
                <label>Raw Records</label>
                <strong>${raw}</strong>
            </div>
            <div class="pr-meta-item">
                <label>Engineering Loss</label>
                <strong style="color: ${results.metadata.droppedCount > 0 ? '#f59e0b' : 'var(--pr-dark)'}">${loss}% <small style="font-size: 0.7rem; font-weight: 500;">(${results.metadata.droppedCount} dropped)</small></strong>
            </div>
            <div class="pr-meta-item">
                <label>Split Strategy</label>
                <strong>${trainPct}/${testPct} <small style="font-size: 0.7rem; font-weight: 500;">(Train/Test)</small></strong>
            </div>
            <div class="pr-meta-item">
                <label>Test Coverage</label>
                <strong>${results.metadata.testCount} <small style="font-size: 0.7rem; font-weight: 500;">locations</small></strong>
            </div>
        `;
    }

    // Render Distribution Pie Chart
    renderDistributionChart(results);

    // Render Confusion Matrix or Parity Plot
    renderConfusionMatrix(results);

    // NEW: Render Spatial Error Map
    renderSpatialErrorMap(results, testData);

    const header = document.getElementById('resultsHeader');
    header.innerHTML = `<th>Location Profile</th><th>Ground Truth (y)</th><th>Prediction (y\u0302)</th><th>Status</th>`;

    const body = document.getElementById('resultsBody');
    const rows = testData.map((row, i) => {
        const actual = results.actual[i];
        const pred = results.predictions[i];
        const isMatch = config.analysisType === 'classification' ?
            (actual === pred) :
            (Math.abs(actual - pred) < (d3.deviation(results.actual) * 0.1 || 0.1)); // Dynamic epsilon

        if (isMatch) return null; // Only show mismatches

        const color = '#ef4444';
        const txt = 'Mismatch';

        return `
            <tr>
                <td style="font-weight:700; color: var(--pr-dark);">
                    <div>${row.name || 'Unknown Zone'}</div>
                    <div style="font-size: 0.75rem; color: var(--pr-text-muted); font-weight: 500;">${row.state_abbr || ''}</div>
                </td>
                <td><span class="pr-badge" style="background:var(--pr-surface-alt);">${config.analysisType === 'classification' ? actual : actual.toFixed(2)}</span></td>
                <td><span class="pr-badge" style="background: #fff; color: ${color}; border: 1px solid ${color}">${config.analysisType === 'classification' ? pred : pred.toFixed(2)}</span></td>
                <td><strong style="color: ${color}">${txt}</strong></td>
            </tr>
        `;
    }).filter(row => row !== null);

    if (rows.length === 0) {
        body.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 40px; color: var(--pr-text-muted);">Perfect Model Performance: Zero Mismatches Found in Test Set</td></tr>';
    } else {
        body.innerHTML = rows.slice(0, 100).join('');
    }
}

/**
 * Render D3 Multi-Level Pipeline Distribution Chart
 */
function renderDistributionChart(results) {
    const container = document.getElementById('accuracyPie');
    if (!container) return;
    container.innerHTML = '';

    const meta = results.metadata;
    const actual = results.actual;
    const pred = results.predictions;
    const isClass = config.analysisType === 'classification';

    let correctCount = 0;
    actual.forEach((a, i) => {
        if (isClass) {
            if (a === pred[i]) correctCount++;
        } else {
            if (Math.abs(a - pred[i]) < (d3.deviation(actual) * 0.1 || 0.1)) correctCount++;
        }
    });
    const wrongCount = actual.length - correctCount;

    // Hierarchy Data
    // Root: Total (rawCount)
    // L1: Cleaned (trainCount + testCount), Dropped (droppedCount)
    // L2: Under Cleaned -> Train (trainCount), Test (testCount)
    // L3: Under Test -> Correct (correctCount), Wrong (wrongCount)

    const rootData = {
        name: "Total Dataset",
        color: "#94a3b8",
        children: [
            {
                name: "Cleaned Data",
                color: "#3b82f6",
                children: [
                    { name: "Training Set", size: meta.trainCount, color: "#6366f1" },
                    {
                        name: "Test Set",
                        color: "#1e293b",
                        children: [
                            { name: "Correct Predictions", size: correctCount, color: "#10b981" },
                            { name: "Prediction Mismatches", size: wrongCount, color: "#ef4444" }
                        ]
                    }
                ]
            },
            {
                name: "Dropped Rows",
                size: meta.droppedCount || 0,
                color: "#f59e0b"
            }
        ]
    };

    const width = 240, height = 240, radius = Math.min(width, height) / 2;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Create Tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "pr-chart-tooltip")
        .style("opacity", 0);

    const partition = d3.partition()
        .size([2 * Math.PI, radius]);

    const root = d3.hierarchy(rootData)
        .sum(d => d.size)
        .sort((a, b) => b.value - a.value);

    partition(root);

    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .innerRadius(d => d.y0)
        .outerRadius(d => d.y1);

    svg.selectAll('path')
        .data(root.descendants().filter(d => d.depth > 0)) // Hide root node center
        .enter()
        .append('path')
        .attr('d', arc)
        .style('fill', d => d.data.color)
        .attr('stroke', 'white')
        .style('stroke-width', '2px')
        .style('opacity', 0.8)
        .on('mouseover', function (event, d) {
            d3.select(this).style('opacity', 1).style('stroke-width', '3px');
            const pct = ((d.value / root.value) * 100).toFixed(1);
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`
                <strong>${d.data.name}</strong><br/>
                Count: ${d.value}<br/>
                ${pct}% of Total Data
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on('mousemove', (event) => {
            tooltip.style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 28) + "px");
        })
        .on('mouseout', function () {
            d3.select(this).style('opacity', 0.8).style('stroke-width', '2px');
            tooltip.transition().duration(500).style("opacity", 0);
        });
}

/**
 * Render Confusion Matrix or Parity Plot
 */
function renderConfusionMatrix(results) {
    const container = document.getElementById('confusionMatrix');
    if (!container) return;
    container.innerHTML = '';

    const isClass = config.analysisType === 'classification';
    const title = document.getElementById('secondaryChartTitle');
    title.textContent = isClass ? 'Confusion Matrix' : 'Parity Analysis';

    if (isClass) {
        drawClassificationMatrix(container, results);
    } else {
        drawRegressionParity(container, results);
    }
}

function drawClassificationMatrix(container, results) {
    const actual = results.actual;
    const pred = results.predictions;
    const classes = [...new Set([...actual, ...pred])].sort((a, b) => a - b);
    const n = classes.length;

    // Build matrix
    const matrix = Array(n).fill(0).map(() => Array(n).fill(0));
    actual.forEach((a, i) => {
        const aIdx = classes.indexOf(a);
        const pIdx = classes.indexOf(pred[i]);
        if (aIdx !== -1 && pIdx !== -1) matrix[aIdx][pIdx]++;
    });

    const width = 240, height = 240, margin = { top: 30, right: 30, bottom: 40, left: 40 };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    const svg = d3.select(container).append('svg')
        .attr('width', width).attr('height', height)
        .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(classes).range([0, chartW]).padding(0.05);
    const y = d3.scaleBand().domain(classes).range([0, chartH]).padding(0.05);

    const maxVal = d3.max(matrix.flat());
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, maxVal || 1]);

    // Draw cells
    classes.forEach((cActual, i) => {
        classes.forEach((cPred, j) => {
            const val = matrix[i][j];
            const cell = svg.append('g').attr('class', 'cm-cell');

            cell.append('rect')
                .attr('x', x(cPred))
                .attr('y', y(cActual))
                .attr('width', x.bandwidth())
                .attr('height', y.bandwidth())
                .attr('fill', colorScale(val))
                .attr('rx', 4)
                .style('stroke', '#fff')
                .style('stroke-width', '1px');

            cell.append('text')
                .attr('x', x(cPred) + x.bandwidth() / 2)
                .attr('y', y(cActual) + y.bandwidth() / 2)
                .attr('dy', '.35em')
                .attr('text-anchor', 'middle')
                .style('fill', val > maxVal / 2 ? '#fff' : '#1e293b')
                .style('font-size', '10px')
                .style('font-weight', '700')
                .text(val);
        });
    });

    // Labels
    svg.append('text').attr('x', chartW / 2).attr('y', -10).attr('text-anchor', 'middle')
        .style('font-size', '8px').style('font-weight', '800').text('PREDICTED');
    svg.append('text').attr('transform', 'rotate(-90)').attr('x', -chartH / 2).attr('y', -30).attr('text-anchor', 'middle')
        .style('font-size', '8px').style('font-weight', '800').text('ACTUAL');
}

function drawRegressionParity(container, results) {
    const actual = results.actual;
    const pred = results.predictions;

    const width = 240, height = 240, margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    const svg = d3.select(container).append('svg')
        .attr('width', width).attr('height', height)
        .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const min = Math.min(d3.min(actual), d3.min(pred));
    const max = Math.max(d3.max(actual), d3.max(pred));

    const x = d3.scaleLinear().domain([min, max]).range([0, chartW]);
    const y = d3.scaleLinear().domain([min, max]).range([chartH, 0]);

    // Identity line
    svg.append('line')
        .attr('x1', x(min)).attr('y1', y(min))
        .attr('x2', x(max)).attr('y2', y(max))
        .style('stroke', '#cbd5e1').style('stroke-dasharray', '4,4').style('stroke-width', '2px');

    // Color scale for parity dots (matches spatial map)
    const errDev = d3.deviation(actual.map((a, i) => a - pred[i])) || 1;
    const parityColor = d3.scaleDiverging()
        .domain([-errDev * 2, 0, errDev * 2])
        .interpolator(d3.interpolateRdBu);

    // Dots
    svg.selectAll('circle')
        .data(actual)
        .enter().append('circle')
        .attr('cx', (d, i) => x(pred[i]))
        .attr('cy', d => y(d))
        .attr('r', 3)
        .style('fill', (d, i) => parityColor(d - pred[i]))
        .style('opacity', 0.7);

    // Axes
    svg.append('g').attr('transform', `translate(0,${chartH})`).call(d3.axisBottom(x).ticks(5)).style('font-size', '8px');
    svg.append('g').call(d3.axisLeft(y).ticks(5)).style('font-size', '8px');

    svg.append('text').attr('x', chartW / 2).attr('y', chartH + 30).attr('text-anchor', 'middle')
        .style('font-size', '8px').style('font-weight', '800').text('PREDICTED VALUE');
    svg.append('text').attr('transform', 'rotate(-90)').attr('x', -chartH / 2).attr('y', -30).attr('text-anchor', 'middle')
        .style('font-size', '8px').style('font-weight', '800').text('ACTUAL VALUE');
}

function showLoader(text) {
    document.getElementById('loaderText').textContent = text;
    document.getElementById('initLoader').style.display = 'flex';
}

function hideLoader() {
    document.getElementById('initLoader').style.display = 'none';
}

function showError(msg) {
    document.getElementById('errorMessageText').textContent = msg;
    document.getElementById('errorDisplay').style.display = 'block';
}

/**
 * Render amCharts 5 Geographical Error Map
 * Highlights where the model succeeded and failed across the US.
 */
let spatialMapRoot = null;
function renderSpatialErrorMap(results, testData) {
    const container = document.getElementById("spatialErrorMap");
    if (!container || typeof am5 === "undefined") return;

    // Clean up previous instance
    if (spatialMapRoot) {
        spatialMapRoot.dispose();
    }

    spatialMapRoot = am5.Root.new("spatialErrorMap");
    spatialMapRoot.setThemes([am5themes_Animated.new(spatialMapRoot)]);

    const chart = spatialMapRoot.container.children.push(am5map.MapChart.new(spatialMapRoot, {
        panX: "rotateX",
        panY: "none",
        projection: am5map.geoAlbersUsa(),
        wheelY: "none"
    }));

    const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(spatialMapRoot, {
        geoJSON: am5geodata_region_usa_usaCountiesLow
    }));

    const isClass = config.analysisType === 'classification';

    polygonSeries.mapPolygons.template.setAll({
        tooltipText: isClass ? "{name}, {state}: {status}" : "{name}, {state}: Diff: {diffValue}",
        strokeWidth: 0.1,
        stroke: am5.color(0xffffff),
        fill: am5.color(0xe2e8f0)
    });

    polygonSeries.mapPolygons.template.adapters.add("fill", (fill, target) => {
        if (target.dataItem && target.dataItem.dataContext && target.dataItem.dataContext.fill) {
            return target.dataItem.dataContext.fill;
        }
        return fill;
    });

    // Build lookup for test data outcomes
    const outcomeLookup = {};
    const differences = [];
    
    testData.forEach((row, i) => {
        const actual = results.actual[i];
        const pred = results.predictions[i];
        
        if (row.state_abbr && row.name) {
            const key = row.state_abbr.toUpperCase() + "_" + normalizeName(row.name);
            if (isClass) {
                const isMatch = actual === pred;
                outcomeLookup[key] = {
                    status: isMatch ? "Correct Prediction" : "Model Mismatch",
                    color: isMatch ? "#10b981" : "#ef4444"
                };
            } else {
                const diff = actual - pred;
                differences.push(diff);
                outcomeLookup[key] = {
                    diff: diff,
                    actual: actual,
                    pred: pred
                };
            }
        }
    });

    // Color scaling for regression
    let colorScale;
    if (!isClass && differences.length > 0) {
        const maxAbsDiff = d3.max(differences, d => Math.abs(d)) || 1;
        // Diverging scale: Red (High actual, low pred) -> White -> Blue (Low actual, high pred)
        colorScale = d3.scaleDiverging()
            .domain([maxAbsDiff, 0, -maxAbsDiff])
            .interpolator(d3.interpolateRdBu);
        
        updateSpatialLegend('regression', maxAbsDiff);
    } else if (isClass) {
        updateSpatialLegend('classification');
    }

    // Process amCharts features
    const mapData = am5geodata_region_usa_usaCountiesLow.features.map(f => {
        const pId = f.id;
        const name = f.properties.name;
        let stateAbbr = f.properties.STATE || "";
        
        if (!stateAbbr && pId.includes("-")) {
            stateAbbr = pId.split("-")[1];
        }

        const key = stateAbbr.toUpperCase() + "_" + normalizeName(name);
        const outcome = outcomeLookup[key];

        let fillColor = am5.color(0xe2e8f0);
        let statusText = "Included in Training";
        let diffText = "N/A";

        if (outcome) {
            if (isClass) {
                fillColor = am5.color(outcome.color);
                statusText = outcome.status;
            } else {
                fillColor = am5.color(colorScale(outcome.diff));
                statusText = outcome.diff > 0 ? "Under-predicted" : "Over-predicted";
                diffText = outcome.diff.toFixed(2);
            }
        }

        return {
            id: pId,
            name: name,
            state: stateAbbr,
            status: statusText,
            diffValue: diffText,
            fill: fillColor
        };
    });

    polygonSeries.data.setAll(mapData);
}

/**
 * Render Explainable AI: Feature Importance Bar Chart
 * uses D3.js to show which features influenced the model most.
 */
function renderFeatureImportanceChart(results) {
    const container = document.getElementById('featureImportanceChart');
    if (!container) return;

    const importance = results.featureImportance;
    const predictors = config.inputVars;
    const section = document.getElementById('featureImportanceSection');

    if (!importance || !predictors || importance.length === 0) {
        if (section) section.style.display = 'none';
        return;
    }

    if (section) section.style.display = 'block';
    container.innerHTML = '';

    // Update explanation text based on algorithm
    const explP = document.querySelector('.pr-xai-explanation p');
    if (explP) {
        let method = "Gini Importance (Trees)";
        if (config.algorithm === 'linear') method = "Standardized Coefficient Weight";
        if (config.algorithm === 'knn' || config.algorithm === 'nn') method = "Univariate Correlation (Feature-Target Relationship)";
        
        explP.innerHTML = `This chart shows the <strong>${method}</strong> for each input variable. 
                        A longer bar indicates that this specific factor has a stronger statistical relationship with the health outcome. 
                        Factors at the top are the primary drivers in the model's decision-making process.`;
    }

    // Map labels to importance and sort
    const data = predictors.map((name, i) => {
        // Humanize labels if possible
        const cleanName = name.replace(/_/g, ' ')
                             .replace(/\b[a-z]/g, l => l.toUpperCase());
        return {
            label: cleanName,
            value: Math.abs(importance[i] || 0)
        };
    }).sort((a, b) => b.value - a.value);

    const width = container.clientWidth;
    const height = container.clientHeight;
    const margin = { top: 20, right: 40, bottom: 40, left: 140 };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    const svg = d3.select(container).append('svg')
        .attr('width', width).attr('height', height)
        .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value) || 1])
        .range([0, chartW]);

    const y = d3.scaleBand()
        .domain(data.map(d => d.label))
        .range([0, chartH])
        .padding(0.2);

    // Grid lines
    svg.append('g').attr('class', 'grid')
        .attr('transform', `translate(0,${chartH})`)
        .call(d3.axisBottom(x).ticks(5).tickSize(-chartH).tickFormat(''))
        .style('stroke-dasharray', '3,3').style('opacity', 0.2);

    // Bars with gradients
    const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "bar-gradient")
        .attr("x1", "0%").attr("x2", "100%");
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#6366f1");
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#818cf8");

    svg.selectAll('rect')
        .data(data)
        .enter().append('rect')
        .attr('x', 0)
        .attr('y', d => y(d.label))
        .attr('width', 0)
        .attr('height', y.bandwidth())
        .attr('fill', 'url(#bar-gradient)')
        .attr('rx', 6)
        .transition().duration(1000).delay((d, i) => i * 50)
        .attr('width', d => x(d.value));

    // Axes
    svg.append('g').call(d3.axisLeft(y).tickSize(0))
        .selectAll('text')
        .style('font-size', '10px')
        .style('font-weight', '700')
        .style('color', '#475569')
        .text(d => d.length > 20 ? d.substring(0, 18) + '...' : d);

    const xAxis = svg.append('g').attr('transform', `translate(0,${chartH})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".2s")));
    
    xAxis.selectAll('text').style('font-size', '9px').style('font-weight', '600').style('color', '#64748b');
    xAxis.select('.domain').style('stroke', '#e2e8f0');

    // Tooltips
    svg.selectAll('rect')
        .append('title')
        .text(d => `${d.label}: ${d.value.toFixed(4)}`);

    // Suspicious Activity Signal (Practitioner insight)
    const maxImp = d3.max(data, d => d.value);
    const sumImp = d3.sum(data, d => d.value);
    if (maxImp / (sumImp || 1) > 0.99) {
        d3.select(container).append('div')
            .style('margin-top', '15px')
            .style('padding', '10px')
            .style('background', '#fff1f2')
            .style('border', '1px solid #fda4af')
            .style('border-radius', '8px')
            .style('font-size', '0.75rem')
            .style('color', '#be123c')
            .html(`<strong>Potential Data Leakage:</strong> This feature explains ${((maxImp/sumImp)*100).toFixed(1)}% of the model. 
                   Ensure this isn't a proxy for the target (e.g. including a "Death Rate" variable to predict "Life Expectancy").`);
    }
}

function updateSpatialLegend(type, maxVal) {
    const legendContainer = document.querySelector('.pr-map-legend');
    if (!legendContainer) return;

    if (type === 'classification') {
        legendContainer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 700; color: #64748b;">
                <div style="width: 12px; height: 12px; background: #10b981; border-radius: 3px; box-shadow: 0 2px 4px rgba(16,185,129,0.3);"></div> Hit (Correct)
            </div>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 700; color: #64748b;">
                <div style="width: 12px; height: 12px; background: #ef4444; border-radius: 3px; box-shadow: 0 2px 4px rgba(239,68,68,0.3);"></div> Miss (Mismatch)
            </div>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 700; color: #64748b;">
                <div style="width: 12px; height: 12px; background: #e2e8f0; border-radius: 3px;"></div> Training Data
            </div>
        `;
    } else {
        legendContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 5px; width: 100%;">
                <div style="display: flex; justify-content: space-between; width: 250px; font-size: 0.7rem; font-weight: 800; color: #64748b; text-transform: uppercase;">
                    <span>Under-predicted</span>
                    <span>Exact</span>
                    <span>Over-predicted</span>
                </div>
                <div style="width: 250px; height: 10px; border-radius: 5px; background: linear-gradient(to right, #b2182b, #f7f7f7, #2166ac); border: 1px solid #e2e8f0;"></div>
                <div style="display: flex; justify-content: space-between; width: 250px; font-size: 0.65rem; color: #94a3b8; font-weight: 600;">
                    <span>+${maxVal.toFixed(1)}</span>
                    <span>0</span>
                    <span>-${maxVal.toFixed(1)}</span>
                </div>
            </div>
        `;
    }
}


function normalizeName(name) {
    if (!name) return "";
    return name.toLowerCase()
        .replace(/\s+county$/i, "")
        .replace(/\s+parish$/i, "")
        .replace(/\s+borough$/i, "")
        .replace(/\s+census\s+area$/i, "")
        .replace(/\s+municipality$/i, "")
        .replace(/\bcity and borough of\s+/i, "")
        .replace(/\bcity of\s+/i, "")
        .replace(/\s+city$/i, "")
        .replace(/[^a-z0-9]/g, "");
}

window.addEventListener('DOMContentLoaded', initPredictiveAnalysis);
