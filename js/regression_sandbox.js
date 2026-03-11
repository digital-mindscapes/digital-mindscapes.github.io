/**
 * Multivariate Regression Sandbox Engine
 * Calculates OLS Regression, ANOVA Table stats, and generates residual plots using math.js, jStat, and D3.
 */

document.addEventListener('DOMContentLoaded', () => {
    initRegressionSandbox();
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

async function initRegressionSandbox() {
    try {
        await loadData();
        populateFilters();
        
        document.getElementById('runModelBtn').addEventListener('click', runRegressionModel);
        
        // Modal Logic
        const infoBtn = document.getElementById('infoBtn');
        const infoModal = document.getElementById('infoModal');
        const closeModalBtn = document.getElementById('closeModalBtn');
        
        if (infoBtn && infoModal) {
            infoBtn.addEventListener('click', () => infoModal.classList.add('active'));
            closeModalBtn.addEventListener('click', () => infoModal.classList.remove('active'));
            infoModal.addEventListener('click', (e) => {
                if (e.target === infoModal) infoModal.classList.remove('active');
            });
        }
        
    } catch (e) {
        console.error('Failed to initialize regression sandbox', e);
    }
}

async function loadData() {
    const loader = document.getElementById('initLoader');
    if(loader) loader.style.display = 'flex';
    
    // Ensure data fetches use the correct localized paths matching the repo
    const [acsRes, placesRes] = await Promise.all([
        fetch("data/ACS Data/county_acs_flat.json"),
        fetch("data/PLACES Data/county_places_flat.json")
    ]);

    const acsData = await acsRes.json();
    const placesData = await placesRes.json();

    const placesCountyLookup = {};
    placesData.forEach(d => {
        if(d.id) {
            let parts = d.id.split('.'); // US.AL.Autauga
            placesCountyLookup[d.id.toLowerCase()] = d;
        }
    });

    const stateSet = new Set();
    
    dataset = acsData.map(acs => {
        let cleanName = acs.name ? acs.name.replace(/_/g, '').replace(/\s+County$/i, '').replace(/\s+Parish$/i, '').trim() : '';
        let placesKey = `us.${acs.state_abbr}.${cleanName}`.toLowerCase();
        
        let places = placesCountyLookup[placesKey] || {};
        
        if(acs.state_name) stateSet.add(acs.state_name);

        return {
            ...acs,
            ...places,
            state_name: acs.state_name || 'Unknown'
        };
    });

    allStates = Array.from(stateSet).sort();
    
    if(loader) loader.style.display = 'none';
}

function populateFilters() {
    const sFilter = document.getElementById('stateFilter');
    allStates.forEach(s => {
        const o = document.createElement('option');
        o.value = s;
        o.textContent = s;
        sFilter.appendChild(o);
    });
    
    const yVar = document.getElementById('yVar');
    ALL_METRICS.forEach(m => {
        let o = document.createElement('option');
        o.value = m.id;
        o.textContent = m.label;
        if(m.id === 'coronary_heart_disease_prevalence') o.selected = true;
        yVar.appendChild(o);
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
    
    // Default checked X vars
    document.getElementById('chk_pct_uninsured').checked = true;
    document.getElementById('chk_median_household_income').checked = true;
    document.getElementById('chk_obesity_prevalence').checked = true;
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

function getSignificanceStars(p) {
    if (p < 0.001) return '***';
    if (p < 0.01) return '**';
    if (p < 0.05) return '*';
    if (p < 0.1) return '.';
    return '';
}

function runRegressionModel() {
    const loader = document.getElementById('initLoader');
    if(loader) loader.style.display = 'flex';
    
    setTimeout(() => {
        try {
            const yId = document.getElementById('yVar').value;
            const yLabel = ALL_METRICS.find(m => m.id === yId).label;
            
            const xCheckboxes = document.querySelectorAll('#xVarList input:checked');
            const xIds = Array.from(xCheckboxes).map(c => c.value);
            
            if(xIds.includes(yId)) {
                showModelError("The dependent variable cannot also be an independent predictor.");
                if(loader) loader.style.display = 'none';
                return;
            }
            if(xIds.length === 0) {
                showModelError("Please select at least one independent variable.");
                if(loader) loader.style.display = 'none';
                return;
            }

            // Hide previous errors before and show loader
            document.getElementById('errorDisplay').style.display = 'none';
            document.getElementById('resultsDisplay').style.display = 'none';
            if(document.getElementById('regressionEmptyState')) {
                document.getElementById('regressionEmptyState').style.display = 'none';
            }

            const rawData = getFilteredData();
            
            // Clean & Filter valid pairs
            let Y_vec = [];
            let X_mat_arr = [];
            let metaData = [];
            
            rawData.forEach(d => {
                let valid = true;
                let yVal = parseFloat(d[yId]);
                if(isNaN(yVal)) valid = false;
                
                let xVals = [];
                xIds.forEach(x => {
                    let v = parseFloat(d[x]);
                    if(isNaN(v)) valid = false;
                    xVals.push(v);
                });
                
                if(valid) {
                    Y_vec.push([yVal]);
                    X_mat_arr.push([1, ...xVals]); // 1 for intercept
                    metaData.push({ name: d.name, state: d.state_abbr, y: yVal });
                }
            });
            
            if(Y_vec.length < xIds.length + 2) {
                showModelError(`Not enough valid data points (${Y_vec.length}) to estimate a model with ${xIds.length} predictors. Need at least ${xIds.length + 2} points.`);
                if(loader) loader.style.display = 'none';
                return;
            }

            // --- Estimation (OLS or Ridge) ---
            const n = Y_vec.length;
            const k = xIds.length + 1; // including intercept
            
            const Y = math.matrix(Y_vec);
            const X = math.matrix(X_mat_arr);
            const Xt = math.transpose(X);
            let XtX = math.multiply(Xt, X);
            
            const regType = document.getElementById('regType').value;
            if (regType === 'ridge') {
                const lambda = parseFloat(document.getElementById('regPenalty').value) || 0.1;
                // Add lambda to diagonal of XtX, but usually skip intercept (index 0)
                const I = math.identity(k);
                // Set intercept penalty to 0
                I.set([0, 0], 0);
                const penalty = math.multiply(lambda, I);
                XtX = math.add(XtX, penalty);
            }
            
            const XtX_inv = math.inv(XtX);
            const XtY = math.multiply(Xt, Y);
            const B = math.multiply(XtX_inv, XtY); // Coefficients matrix
            
            // Expected / Predicted Y
            const Y_hat = math.multiply(X, B);
            
            // Residuals
            const residualsMatrix = math.subtract(Y, Y_hat);
            const residualsArr = residualsMatrix.valueOf().map(r => r[0]);
            
            // SS Total & SS Res
            const Y_arr = Y_vec.map(y => y[0]);
            const y_mean = jStat.mean(Y_arr);
            
            let ss_tot = 0;
            let ss_res = 0;
            for(let i=0; i<n; i++) {
                ss_tot += Math.pow(Y_arr[i] - y_mean, 2);
                ss_res += Math.pow(residualsArr[i], 2);
            }
            
            const df_total = n - 1;
            const df_model = k - 1;
            const df_res = n - k;
            
            const r_squared = 1 - (ss_res / ss_tot);
            const adj_r_squared = 1 - ((1 - r_squared) * df_total / df_res);
            
            const var_res = ss_res / df_res;
            const XtX_inv_arr = XtX_inv.valueOf();
            
            const se_b = [];
            for(let i=0; i<k; i++) {
                se_b.push(Math.sqrt(XtX_inv_arr[i][i] * var_res));
            }
            
            const coefficients = B.valueOf().map(b => b[0]);
            const t_stats = [];
            const p_values = [];
            
            for(let i=0; i<k; i++) {
                let t = coefficients[i] / se_b[i];
                t_stats.push(t);
                // Two-tailed T-test
                let p = (1 - jStat.studentt.cdf(Math.abs(t), df_res)) * 2;
                p_values.push(p);
            }
            
            const f_stat = ( (ss_tot - ss_res) / df_model ) / var_res;
            const f_p_value = 1 - jStat.centralF.cdf(f_stat, df_model, df_res);
            
            // --- Update UI ---
            document.getElementById('m_r2').textContent = r_squared.toFixed(4);
            document.getElementById('m_adj_r2').textContent = adj_r_squared.toFixed(4);
            document.getElementById('m_f_stat').textContent = isNaN(f_stat) ? 'N/A' : f_stat.toFixed(2);
            document.getElementById('m_p_val').textContent = f_p_value < 0.001 ? '< 0.001' : f_p_value.toFixed(4);
            document.getElementById('m_obs').textContent = n.toLocaleString();
            
            // Populate Table
            const tbody = document.getElementById('coefTableBody');
            tbody.innerHTML = '';
            
            const varNames = ['(Intercept)', ...xIds.map(id => ALL_METRICS.find(m => m.id === id).label)];
            
            for(let i=0; i<k; i++) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: 600;">${varNames[i]}</td>
                    <td>${coefficients[i].toFixed(4)}</td>
                    <td>${se_b[i].toFixed(4)}</td>
                    <td>${t_stats[i].toFixed(3)}</td>
                    <td>${p_values[i] < 0.001 ? '<0.001' : p_values[i].toFixed(4)}</td>
                    <td class="sig-stars">${getSignificanceStars(p_values[i])}</td>
                `;
                tbody.appendChild(tr);
            }
            
            document.getElementById('resultsDisplay').style.display = 'flex';
            
            // --- D3 Ploting (Predicted vs Residuals) ---
            const plotData = [];
            const Y_hat_arr = Y_hat.valueOf().map(y => y[0]);
            for(let i=0; i<n; i++) {
                plotData.push({
                    actual: Y_vec[i][0],
                    pred: Y_hat_arr[i],
                    res: residualsArr[i],
                    name: metaData[i].name,
                    state: metaData[i].state,
                    id: metaData[i].id
                });
            }
            
            // global map cache
            window.regMapData = plotData;
            document.getElementById('visualizeMapBtn').style.display = 'flex';
            
            // Populate County Side Table
            document.getElementById('countyResultsSidebar').style.display = 'block';
            const countyTbody = document.getElementById('countyResultsTableBody');
            countyTbody.innerHTML = '';
            
            // Sort county data by residual magnitude descending to surface most anomalous counties
            const sortedCountyData = [...plotData].sort((a,b) => Math.abs(b.res) - Math.abs(a.res));
            
            sortedCountyData.forEach(d => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="padding: 8px 6px; border-bottom: 1px solid #e2e8f0; text-align: left;">
                        <div style="font-weight: 600; color: #1e293b; max-width: 130px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${d.name}, ${d.state}">${d.name}</div>
                        <div style="font-size: 0.75rem; color: #64748b;">${d.state}</div>
                    </td>
                    <td style="padding: 8px 6px; border-bottom: 1px solid #e2e8f0; color: #475569;">${d.actual.toFixed(2)}</td>
                    <td style="padding: 8px 6px; border-bottom: 1px solid #e2e8f0; color: #475569;">${d.pred.toFixed(2)}</td>
                    <td style="padding: 8px 6px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: ${d.res > 0 ? '#c83830' : '#10b981'};">${d.res > 0 ? '+' : ''}${d.res.toFixed(2)}</td>
                `;
                countyTbody.appendChild(tr);
            });

            
            renderResidualPlot(plotData, yLabel);

        } catch (err) {
            console.error("Regression failed:", err);
            showModelError("Model failed to compute. This is typically due to perfectly collinear variables (a singular matrix) or lack of variance in your filtered data. Try removing redundant variables.");
        }
        
        if(loader) loader.style.display = 'none';
        
    }, 100);
}

function renderResidualPlot(data, yLabel) {
    const container = document.getElementById('residualPlotContainer');
    container.innerHTML = '';
    
    // Setup D3
    const width = container.clientWidth;
    const height = container.clientHeight;
    const margin = {top: 20, right: 30, bottom: 50, left: 60};
    
    const svg = d3.select(container)
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${width} ${height}`);
        
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
        
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xExtent = d3.extent(data, d => d.pred);
    const xPad = (xExtent[1] - xExtent[0]) * 0.05;
    const x = d3.scaleLinear()
        .domain([xExtent[0] - xPad, xExtent[1] + xPad])
        .range([0, innerWidth]);

    const resMax = d3.max(data, d => Math.abs(d.res));
    const y = d3.scaleLinear()
        .domain([-resMax * 1.1, resMax * 1.1])
        .range([innerHeight, 0]);

    // Axes
    g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).ticks(8))
        .selectAll("text").style("fill", "#64748b");
        
    g.append("g")
        .call(d3.axisLeft(y).ticks(8))
        .selectAll("text").style("fill", "#64748b");

    // Zero Line
    g.append("line")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", y(0))
        .attr("y2", y(0))
        .attr("stroke", "#94a3b8")
        .attr("stroke-dasharray", "4,4")
        .attr("stroke-width", 1.5);

    // Labels
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .style("font-size", "0.9rem")
        .style("fill", "#334155")
        .style("font-weight", "600")
        .text(`Predicted ${yLabel}`);

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 20)
        .style("font-size", "0.9rem")
        .style("fill", "#334155")
        .style("font-weight", "600")
        .text("Residuals (Error)");

    const tooltip = document.getElementById('regTooltip');

    // Dots
    g.append('g')
        .selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", d => x(d.pred))
        .attr("cy", d => y(d.res))
        .attr("r", 0)
        .style("fill", "#c83830")
        .style("opacity", 0)
        .style("stroke", "#fff")
        .style("stroke-width", 0.5)
        .transition()
        .duration(400)
        .delay((d, i) => i * (300 / Math.max(1, data.length)))
        .attr("r", 4)
        .style("opacity", 0.6);

    g.selectAll("circle")
        .on("mouseover", function(event, d) {
            d3.select(this)
              .style("opacity", 1)
              .attr("r", 6)
              .style("stroke", "#1e293b")
              .style("stroke-width", 2);
              
            tooltip.innerHTML = `
                <div style="font-weight:600; margin-bottom:4px; padding-bottom:4px; border-bottom:1px solid rgba(255,255,255,0.2)">
                    ${d.name}, ${d.state}
                </div>
                <div style="display:flex; justify-content:space-between; gap:16px;">
                    <span style="color:#cbd5e1">Predicted:</span>
                    <strong>${d.pred.toFixed(2)}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; gap:16px; margin-top:4px;">
                    <span style="color:#cbd5e1">Residual:</span>
                    <strong>${d.res.toFixed(2)}</strong>
                </div>
            `;
            tooltip.style.opacity = 1;
        })
        .on("mousemove", function(event) {
            tooltip.style.left = (event.pageX + 15) + "px";
            tooltip.style.top = (event.pageY - 15) + "px";
        })
        .on("mouseleave", function() {
            d3.select(this)
              .style("opacity", 0.6)
              .attr("r", 4)
              .style("stroke", "#fff")
              .style("stroke-width", 0.5);
            tooltip.style.opacity = 0;
        });
}

// ─── Model Summary Info Modal ───────────────────────────────────────────────

function openModelSummaryModal() {
    const modal = document.getElementById('modelSummaryModal');
    if (!modal) return;
    modal.style.display = 'flex';
    // Reset to first tab on open
    switchMsmTab(document.querySelector('.msm-tab.active') || document.querySelector('.msm-tab'), 'msm-goodnessOfFit');
    // Backdrop click to close
    modal.addEventListener('click', function handler(e) {
        if (e.target === modal) {
            closeModelSummaryModal();
            modal.removeEventListener('click', handler);
        }
    });
    // Escape key to close
    function escHandler(e) {
        if (e.key === 'Escape') { closeModelSummaryModal(); document.removeEventListener('keydown', escHandler); }
    }
    document.addEventListener('keydown', escHandler);
}

function closeModelSummaryModal() {
    const modal = document.getElementById('modelSummaryModal');
    if (modal) modal.style.display = 'none';
}

function switchMsmTab(btnEl, panelId) {
    // Deactivate all tabs
    document.querySelectorAll('.msm-tab').forEach(b => b.classList.remove('active'));
    // Hide all panels
    document.querySelectorAll('.msm-tab-panel').forEach(p => p.style.display = 'none');
    // Activate selected
    if (btnEl) btnEl.classList.add('active');
    const panel = document.getElementById(panelId);
    if (panel) panel.style.display = '';
}

function showModelError(msg) {
    const errContainer = document.getElementById('errorDisplay');
    const errText = document.getElementById('errorMessageText');
    if (errContainer && errText) {
        errText.textContent = msg;
        errContainer.style.display = 'block';
        // Scroll to error if not in view
        errContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function toggleRegPenalty(val) {
    const container = document.getElementById('penaltyContainer');
    if (container) {
        container.style.display = (val === 'ridge') ? 'block' : 'none';
    }
}

// MAP VISUALIZATION (amCharts)
// =========================================

let amMapRoot = null;
let mapPolygonSeries = null;
let currentSelectedMapVal = "actual";
let lastProcessedMapState = null;

document.getElementById('visualizeMapBtn').addEventListener('click', () => {
    document.getElementById('mapModal').style.display = 'flex';
    initRegMapModal();
});

document.getElementById('closeMapModalBtn').addEventListener('click', () => {
    document.getElementById('mapModal').style.display = 'none';
});

function handleMapToggle(val, btnEl) {
    currentSelectedMapVal = val;
    if (btnEl) {
        document.querySelectorAll('#mapModal .view-toggle-btn').forEach(b => b.classList.remove('active'));
        btnEl.classList.add('active');
    }
    updateRegMapData();
}

function initRegMapModal() {
    // Current value is maintained via currentSelectedMapVal variable

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
                    renderRegMapCore(window[geoKey], am5map.geoMercator());
                } else {
                    const script = document.createElement("script");
                    script.src = `https://cdn.amcharts.com/lib/5/geodata/region/usa/${targetAbbr}Low.js`;
                    script.onload = () => {
                        if (window[geoKey]) {
                            renderRegMapCore(window[geoKey], am5map.geoMercator());
                        } else {
                            renderRegMapCore(am5geodata_region_usa_usaCountiesLow, am5map.geoAlbersUsa());
                        }
                    };
                    script.onerror = () => {
                        renderRegMapCore(am5geodata_region_usa_usaCountiesLow, am5map.geoAlbersUsa());
                    };
                    document.head.appendChild(script);
                }
                return; 
            }
        }
        renderRegMapCore(am5geodata_region_usa_usaCountiesLow, am5map.geoAlbersUsa());
    } else {
        updateRegMapData();
    }
}

function renderRegMapCore(activeGeoJSON, projectionAlg) {
    amMapRoot = am5.Root.new("regMapChartDiv");
    amMapRoot.setThemes([am5themes_Animated.new(amMapRoot)]);

    const mapChart = amMapRoot.container.children.push(am5map.MapChart.new(amMapRoot, {
        panX: "translateX",
        panY: "translateY",
        wheelY: "zoom",
        projection: projectionAlg,
        paddingTop: 40,
        paddingBottom: 100 
    }));

    mapPolygonSeries = mapChart.series.push(am5map.MapPolygonSeries.new(amMapRoot, {
        geoJSON: activeGeoJSON,
        valueField: "value",
        calculateAggregates: true
    }));

    mapPolygonSeries.mapPolygons.template.setAll({
        tooltipText: "{name}: [bold]{value}[/] ({customLabel})",
        stroke: am5.color(0xffffff),
        strokeWidth: 0.5,
        interactive: true,
        cursorOverStyle: "pointer"
    });

    mapPolygonSeries.mapPolygons.template.adapters.add("fill", function(fill, target) {
        if (target.dataItem && (target.dataItem.get("value") === null || target.dataItem.get("value") === undefined)) {
            return am5.color(0xe2e8f0); 
        }
        return fill;
    });

    mapPolygonSeries.mapPolygons.template.adapters.add("tooltipText", function (text, target) {
        const dataItem = target.dataItem;
        if (dataItem) {
            const val = dataItem.get("value");
            let label = "Actual Value";
            if (currentSelectedMapVal === "predicted") label = "Predicted Value";
            if (currentSelectedMapVal === "residual") label = "Residual Error";
            dataItem.set("customLabel", label);
            
            if (val === null || val === undefined) return "{name}: N/A";
            return "{name}: [bold]{value}[/] (" + label + ")";
        }
        return text;
    });

    const heatLegend = amMapRoot.container.children.push(am5.HeatLegend.new(amMapRoot, {
        orientation: "horizontal",
        startColor: am5.color(0x3b82f6), 
        endColor: am5.color(0xef4444),   
        startText: "Low",
        endText: "High",
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
        
        // Dynamic labels for legend based on map mode
        if(currentSelectedMapVal === "residual") {
            heatLegend.set("startText", "Negative Error");
            heatLegend.set("endText", "Positive Error");
        } else if (currentSelectedMapVal === "predicted") {
            heatLegend.set("startText", "Low Prediction");
            heatLegend.set("endText", "High Prediction");
        } else {
            heatLegend.set("startText", "Low Target");
            heatLegend.set("endText", "High Target");
        }
    });

    window.regHeatLegend = heatLegend;

    mapChart.appear(1000, 100);
    
    updateRegMapData();
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

function updateRegMapData() {
    if(!amMapRoot || !mapPolygonSeries || !window.regMapData) return;

    const mapData = [];
    const geoJSON = mapPolygonSeries.get("geoJSON");
    const geoFeatures = geoJSON ? geoJSON.features : [];
    
    // Create lookup
    const lookup = {};
    window.regMapData.forEach(d => {
        if(d.name && d.state) {
            lookup[d.state.toUpperCase() + "_" + normalizeCountyNameMap(d.name)] = d;
        }
    });

    let minVal = Infinity;
    let maxVal = -Infinity;

    geoFeatures.forEach(feature => {
        const pId = feature.id; 
        if (!pId) return;

        let stateAbbr = "";
        if (feature.properties && feature.properties.STATE) {
            stateAbbr = feature.properties.STATE;
        } else {
            const parts = pId.split("-");
            if (parts.length >= 3) stateAbbr = parts[1];
        }

        const name = feature.properties.name || "";
        const lookupKey = stateAbbr.toUpperCase() + "_" + normalizeCountyNameMap(name);
        const dataObj = lookup[lookupKey];

        let val = null;
        if(dataObj) {
            if(currentSelectedMapVal === "actual") val = dataObj.actual;
            else if(currentSelectedMapVal === "predicted") val = dataObj.pred;
            else if(currentSelectedMapVal === "residual") val = dataObj.res;
        }

        if (val !== null) {
            val = Number(val.toFixed(3));
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

    let startCol = am5.color(0x3b82f6);
    let endCol = am5.color(0xef4444);
    
    // diverging blue to red for residuals
    mapPolygonSeries.set("heatRules", [{
        target: mapPolygonSeries.mapPolygons.template,
        dataField: "value",
        min: startCol, 
        max: endCol, 
        key: "fill"
    }]);
}
