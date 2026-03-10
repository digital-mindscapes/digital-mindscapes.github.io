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
    ALL_METRICS.forEach(m => {
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
                alert("The dependent variable cannot also be an independent predictor.");
                if(loader) loader.style.display = 'none';
                return;
            }
            if(xIds.length === 0) {
                alert("Please select at least one independent variable.");
                if(loader) loader.style.display = 'none';
                return;
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
                alert("Not enough valid data points for this model.");
                if(loader) loader.style.display = 'none';
                return;
            }

            // --- Math.js Matrix Math OLS Formulation ---
            const n = Y_vec.length;
            const k = xIds.length + 1;
            
            const Y = math.matrix(Y_vec);
            const X = math.matrix(X_mat_arr);
            const Xt = math.transpose(X);
            const XtX = math.multiply(Xt, X);
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
                    pred: Y_hat_arr[i],
                    res: residualsArr[i],
                    name: metaData[i].name,
                    state: metaData[i].state
                });
            }
            
            renderResidualPlot(plotData, yLabel);

        } catch (err) {
            console.error("Regression failed:", err);
            alert("Model failed to compute. This is typically due to perfectly collinear variables (a singular matrix) or lack of variance. Try removing redundant variables.");
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
