/**
 * Correlation Matrix Engine
 * Computes Pearson correlation matrix across selected metrics
 * and renders an interactive heatmap and scatterplot.
 */

document.addEventListener('DOMContentLoaded', () => {
    initCorrelationMatrix();
});

let dataset = [];
let allStates = [];

const REGION_STATES = {
    "Northeast": ["Connecticut", "Maine", "Massachusetts", "New Hampshire", "Rhode Island", "Vermont", "New Jersey", "New York", "Pennsylvania"],
    "Midwest": ["Illinois", "Indiana", "Iowa", "Kansas", "Michigan", "Minnesota", "Missouri", "Nebraska", "North Dakota", "Ohio", "South Dakota", "Wisconsin"],
    "South": ["Alabama", "Arkansas", "Delaware", "Florida", "Georgia", "Kentucky", "Louisiana", "Maryland", "Mississippi", "North Carolina", "Oklahoma", "South Carolina", "Tennessee", "Texas", "Virginia", "West Virginia", "District of Columbia"],
    "West": ["Alaska", "Arizona", "California", "Colorado", "Hawaii", "Idaho", "Montana", "Nevada", "New Mexico", "Oregon", "Utah", "Washington", "Wyoming"]
};

// Define Metric Sets
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

async function initCorrelationMatrix() {
    try {
        await loadData();
        populateFilters();
        
        document.getElementById('calculateBtn').addEventListener('click', calculateAndRenderMatrix);
        document.getElementById('regionFilter').addEventListener('change', handleRegionChange);
        
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
        
        // Initial Calculation
        calculateAndRenderMatrix();
    } catch (e) {
        console.error('Failed to initialize correlation matrix', e);
    }
}

async function loadData() {
    const loader = document.getElementById('initLoader');
    if(loader) loader.style.display = 'flex';
    
    const [acsRes, placesRes, ruccRes] = await Promise.all([
        fetch("data/ACS Data/county_acs_flat.json"),
        fetch("data/PLACES Data/county_places_flat.json"),
        fetch("data/Rural_Urban_Comparison/county_rucc.json")
    ]);

    const acsData = await acsRes.json();
    const placesData = await placesRes.json();
    const ruccData = await ruccRes.json();

    // Map RUCC data
    const ruccLookup = {};
    Object.keys(ruccData).forEach(fips => {
        ruccLookup[String(fips).padStart(5, '0')] = ruccData[fips];
    });

    // Map PLACES
    const placesCountyLookup = {};
    placesData.forEach(d => {
        if(d.id) {
            let parts = d.id.split('.'); // US.AL.Autauga
            placesCountyLookup[d.id.toLowerCase()] = d;
        }
    });

    // Normalize and Merge
    const stateSet = new Set();
    
    dataset = acsData.map(acs => {
        let cleanName = acs.name ? acs.name.replace(/_/g, '').replace(/\s+County$/i, '').replace(/\s+Parish$/i, '').trim() : '';
        let placesKey = `us.${acs.state_abbr}.${cleanName}`.toLowerCase();
        
        let places = placesCountyLookup[placesKey] || {};
        
        let ruccInfo = null;
        if(acs.fips) {
            let fipsZero = String(acs.fips).padStart(5, '0');
            ruccInfo = ruccLookup[fipsZero];
        }

        if(acs.state_name) stateSet.add(acs.state_name);

        return {
            ...acs,
            ...places,
            metro_status: ruccInfo ? ruccInfo.classification : 'Unknown',
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
}

function handleRegionChange() {
    const reg = document.getElementById('regionFilter').value;
    const sFilter = document.getElementById('stateFilter');
    
    // Reset state filter
    sFilter.innerHTML = '<option value="All">All States</option>';
    
    let statesToShow = allStates;
    if (reg !== 'All') {
        statesToShow = REGION_STATES[reg] || [];
        statesToShow = statesToShow.filter(s => allStates.includes(s));
    }
    
    statesToShow.forEach(s => {
        const o = document.createElement('option');
        o.value = s;
        o.textContent = s;
        sFilter.appendChild(o);
    });
}

function getFilteredData() {
    const reg = document.getElementById('regionFilter').value;
    const state = document.getElementById('stateFilter').value;

    return dataset.filter(d => {
        // Region filter
        if (reg !== 'All') {
            const statesInRegion = REGION_STATES[reg] || [];
            if (!statesInRegion.includes(d.state_name)) return false;
        }
        
        // State Filter
        if (state !== 'All' && d.state_name !== state) return false;

        return true;
    });
}

function calculateAndRenderMatrix() {
    document.getElementById('loadingStatus').style.display = 'flex';
    
    // Allow UI to update loading state
    setTimeout(() => {
        const filtered = getFilteredData();
        
        const xGroup = document.getElementById('xAxisGroup').value;
        const yGroup = document.getElementById('yAxisGroup').value;
        
        const xMetrics = xGroup === 'Health' ? HEALTH_METRICS : (xGroup === 'Econ' ? ECON_METRICS : ALL_METRICS);
        const yMetrics = yGroup === 'Health' ? HEALTH_METRICS : (yGroup === 'Econ' ? ECON_METRICS : ALL_METRICS);

        const matrixLayout = document.getElementById('matrixLayout') ? document.getElementById('matrixLayout').value : 'full';
        const matrixStyle = document.getElementById('matrixStyle') ? document.getElementById('matrixStyle').value : 'heatmap';

        const matrixData = [];

        // Build Matrix Data via simple-statistics
        for(let i=0; i < xMetrics.length; i++) {
            let x = xMetrics[i];
            for(let j=0; j < yMetrics.length; j++) {
                let y = yMetrics[j];
                
                if (matrixLayout === 'lower' && i > j) continue;
                if (matrixLayout === 'upper' && j > i) continue;

                // Collect valid pairs
                const pairs = [];
                filtered.forEach(d => {
                    let vx = parseFloat(d[x.id]);
                    let vy = parseFloat(d[y.id]);
                    if(!isNaN(vx) && !isNaN(vy)) {
                        pairs.push([vx, vy]);
                    }
                });

                let r = 0;
                let p = null; // Assuming P calculation is complex, rely on r for styling
                
                if (pairs.length > 2) {
                    const xArr = pairs.map(p => p[0]);
                    const yArr = pairs.map(p => p[1]);
                    // Standard deviation check to prevent division by zero in correlation
                    if (ss.standardDeviation(xArr) > 0 && ss.standardDeviation(yArr) > 0) {
                        try {
                            r = ss.sampleCorrelation(xArr, yArr);
                        } catch(e) { r = 0; }
                    }
                }

                matrixData.push({
                    xId: x.id,
                    xLabel: x.label,
                    yId: y.id,
                    yLabel: y.label,
                    value: r,
                    n: pairs.length,
                    i: i,
                    j: j
                });
            }
        }

        document.getElementById('loadingStatus').style.display = 'none';
        renderD3Heatmap(matrixData, xMetrics, yMetrics, matrixStyle);
        
        // Clear Scatter
        document.getElementById('scatterEmpty').style.display = 'flex';
        document.getElementById('scatterWrapper').style.display = 'none';
        
    }, 50);
}

function renderD3Heatmap(data, xMetrics, yMetrics, style = 'heatmap') {
    const container = document.getElementById('heatmap-container');
    container.innerHTML = '';
    
    // Adaptive sizing
    const margin = {top: 100, right: 30, bottom: 30, left: 140};
    
    // Base cell size
    const minCellSize = 35; 
    let width = Math.max(container.clientWidth - margin.left - margin.right, xMetrics.length * minCellSize);
    let height = Math.max(container.clientHeight - margin.top - margin.bottom, yMetrics.length * minCellSize);

    // Dynamic grid size
    const xGrid = width / xMetrics.length;
    const yGrid = height / yMetrics.length;
    
    width = xGrid * xMetrics.length;
    height = yGrid * yMetrics.length;

    const svg = d3.select(container)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Build X scales and axis
    const x = d3.scaleBand()
        .range([ 0, width ])
        .domain(xMetrics.map(d => d.label))
        .padding(0.05);
        
    svg.append("g")
        .style("font-size", "0.75rem")
        .style("font-family", "Inter, sans-serif")
        .attr("transform", "translate(0,0)") // Move to top
        .call(d3.axisTop(x).tickSize(0))
        .select(".domain").remove();
        
    svg.selectAll("g.tick text")
        .attr("transform", "translate(5,-5) rotate(-45)")
        .style("text-anchor", "start")
        .style("fill", "#475569")
        .style("font-weight", "500");

    // Build Y scales and axis
    const y = d3.scaleBand()
        .range([ 0, height ])
        .domain(yMetrics.map(d => d.label))
        .padding(0.05);
        
    svg.append("g")
        .style("font-size", "0.75rem")
        .style("font-family", "Inter, sans-serif")
        .call(d3.axisLeft(y).tickSize(0))
        .select(".domain").remove();
        
    svg.selectAll("g.tick text")
        .style("fill", "#475569")
        .style("font-weight", "500");

    // Diverging color scale (-1 to 1) RdYlBu standard
    const colorScale = d3.scaleSequential(d3.interpolateRdYlBu).domain([-1, 1]);

    const tooltip = document.getElementById('customTooltip');

    // Draw the heatmap cells
    const cellGroups = svg.selectAll(".matrix-cell-group")
        .data(data, function(d) { return d.xId + ':' + d.yId; })
        .join("g")
            .attr("class", "matrix-cell-group")
            .attr("transform", function(d) { return `translate(${x(d.xLabel)}, ${y(d.yLabel)})`; })
            .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            d3.select(this).select(".hover-box")
                .style("stroke", "#1e293b");
            d3.select(this).select(".shape-visual")
                .style("opacity", 1);
                
            let rStr = d.value ? d.value.toFixed(3) : 'N/A';
            tooltip.innerHTML = `
                <div class="tooltip-header">${d.xLabel} &times; ${d.yLabel}</div>
                <div class="tooltip-row"><span class="lbl">Pearson (r):</span><span class="val">${rStr}</span></div>
                <div class="tooltip-row"><span class="lbl">Counties Included:</span><span class="val">${d.n}</span></div>
            `;
            tooltip.style.opacity = 1;
        })
        .on("mousemove", function(event) {
            tooltip.style.left = (event.pageX + 15) + "px";
            tooltip.style.top = (event.pageY + 15) + "px";
        })
        .on("mouseleave", function(event, d) {
            d3.select(this).select(".hover-box")
                .style("stroke", "none");
            d3.select(this).select(".shape-visual")
                .style("opacity", 0.9);
            tooltip.style.opacity = 0;
        })
        .on("click", function(event, d) {
            if(d.n > 2) {
                renderScatterplot(d.xId, d.xLabel, d.yId, d.yLabel, d.value, d.n);
            }
        });

    // Inner element rendering per group
    cellGroups.each(function(d) {
        const g = d3.select(this);
        const cw = x.bandwidth();
        const ch = y.bandwidth();
        
        // Wipe pre-existing content in case of D3 update transition
        g.selectAll("*").remove();
        
        let actualStyle = style;
        
        if (style === 'mixed' || style === 'mixed_circle') {
            if (d.i > d.j) actualStyle = 'correlogram';
            else if (d.i < d.j) actualStyle = 'text';
            else actualStyle = 'diagonal';
        } else if (style === 'mixed_rect') {
            if (d.i > d.j) actualStyle = 'heatmap';
            else if (d.i < d.j) actualStyle = 'text';
            else actualStyle = 'diagonal';
        } else if (style === 'mixed_ellipse') {
            if (d.i > d.j) actualStyle = 'ellipse';
            else if (d.i < d.j) actualStyle = 'text';
            else actualStyle = 'diagonal';
        }

        if (actualStyle === 'heatmap') {
            g.append("rect")
                .attr("class", "shape-visual")
                .attr("rx", 4)
                .attr("ry", 4)
                .attr("width", cw)
                .attr("height", ch)
                .style("fill", d.value === 0 && d.n < 3 ? '#f1f5f9' : colorScale(d.value))
                .style("opacity", 0.9);
        } else if (actualStyle === 'correlogram') {
            g.append("rect").attr("width", cw).attr("height", ch).style("fill", "transparent"); // Click target
            const maxR = Math.min(cw, ch) / 2;
            g.append("circle")
                .attr("class", "shape-visual")
                .attr("cx", cw / 2)
                .attr("cy", ch / 2)
                .attr("r", Math.max(3, Math.abs(d.value) * maxR * 0.95))
                .style("fill", d.value === 0 && d.n < 3 ? '#e2e8f0' : colorScale(d.value))
                .style("opacity", 0.9);
        } else if (actualStyle === 'ellipse') {
            g.append("rect").attr("width", cw).attr("height", ch).style("fill", "transparent"); // Click target
            
            // At correlation=0, r=cw/2 (almost fits the cell)
            // At correlation=1, line spans to corners
            const maxR = Math.min(cw, ch) * 0.65; 
            const rVal = d.value;
            const a = Math.sqrt(1 + Math.abs(rVal)) / Math.SQRT2;
            const b = Math.sqrt(1 - Math.abs(rVal)) / Math.SQRT2;
            
            g.append("ellipse")
                .attr("class", "shape-visual")
                .attr("cx", cw / 2)
                .attr("cy", ch / 2)
                .attr("rx", Math.max(1, maxR * a)) // ensure minimum width
                .attr("ry", Math.max(1.5, maxR * b)) // give line some thickness at correlation=1
                .attr("transform", `rotate(${rVal >= 0 ? -45 : 45}, ${cw / 2}, ${ch / 2})`)
                .style("fill", d.value === 0 && d.n < 3 ? '#e2e8f0' : colorScale(d.value))
                .style("opacity", 0.9);
        } else if (actualStyle === 'text' || actualStyle === 'diagonal') {
            g.append("rect").attr("width", cw).attr("height", ch).style("fill", "transparent"); // Click target
            g.append("text")
                .attr("class", "shape-visual")
                .attr("x", cw / 2)
                .attr("y", ch / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", "middle")
                .style("font-size", Math.min(cw, ch) * 0.4 + "px")
                .style("font-family", "Inter, sans-serif")
                .style("font-weight", actualStyle === 'diagonal' ? "800" : "700")
                .style("fill", actualStyle === 'diagonal' ? "#cbd5e1" : colorScale(d.value))
                .style("opacity", 0.9)
                .text(actualStyle === 'diagonal' ? "—" : (d.value ? d.value.toFixed(2) : "N/A"));
        }

        // Invisible border box to bind the hover stroke to the bounds of the cell
        g.append("rect")
            .attr("class", "hover-box")
            .attr("width", cw)
            .attr("height", ch)
            .attr("rx", 4)
            .attr("ry", 4)
            .style("fill", "transparent")
            .style("stroke", "none")
            .style("stroke-width", 2);
    });
}

function renderScatterplot(xId, xLabel, yId, yLabel, rValue, count) {
    document.getElementById('scatterEmpty').style.display = 'none';
    document.getElementById('scatterWrapper').style.display = 'flex';
    
    document.getElementById('scatterTitleX').textContent = xLabel;
    document.getElementById('scatterTitleY').textContent = yLabel;
    
    document.getElementById('scatterR').textContent = rValue.toFixed(3);
    document.getElementById('scatterR').style.color = Math.abs(rValue) > 0.5 ? '#16a34a' : 'var(--text-main)';
    document.getElementById('scatterN').textContent = count;
    
    let pValStr = "< 0.05";
    if(Math.abs(rValue) > 0.3 && count > 30) pValStr = "< 0.001";
    if(Math.abs(rValue) < 0.1) pValStr = "Not Sig.";
    document.getElementById('scatterP').textContent = pValStr;
    
    // Description Generation
    let strength = "weak";
    if(Math.abs(rValue) > 0.3) strength = "moderate";
    if(Math.abs(rValue) > 0.6) strength = "strong";
    let dir = rValue > 0 ? "positive" : "negative";
    
    if(Math.abs(rValue) < 0.1) {
        document.getElementById('scatterDesc').textContent = `There is virtually no correlation between ${xLabel} and ${yLabel} within the selected filter.`;
        document.getElementById('scatterDesc').style.borderLeftColor = "#94a3b8";
    } else {
        document.getElementById('scatterDesc').innerHTML = `There is a <strong>${strength} ${dir}</strong> correlation between ${xLabel} and ${yLabel}. As one increases, the other generally ${dir === 'positive' ? 'increases' : 'decreases'}.`;
        document.getElementById('scatterDesc').style.borderLeftColor = dir === 'positive' ? "#0ea5e9" : "#e11d48";
    }

    // Prepare Data for D3 scatter
    let filtered = getFilteredData();
    let scatterData = [];
    filtered.forEach(d => {
        let vx = parseFloat(d[xId]);
        let vy = parseFloat(d[yId]);
        if(!isNaN(vx) && !isNaN(vy)) {
            scatterData.push({
                x: vx, y: vy,
                name: d.name,
                state: d.state_abbr,
                metro: d.metro_status
            });
        }
    });

    const container = document.getElementById('d3-scatter-container');
    container.innerHTML = '';
    
    const margin = {top: 20, right: 30, bottom: 40, left: 50};
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add X axis
    const xRange = d3.extent(scatterData, d => d.x);
    // Pad exactly 5%
    const xPad = (xRange[1] - xRange[0]) * 0.05;
    const x = d3.scaleLinear()
        .domain([xRange[0] - xPad, xRange[1] + xPad])
        .range([ 0, width ]);
        
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).ticks(6))
        .selectAll("text")
        .style("fill", "#64748b");

    // Add Y axis
    const yRange = d3.extent(scatterData, d => d.y);
    const yPad = (yRange[1] - yRange[0]) * 0.05;
    const y = d3.scaleLinear()
        .domain([yRange[0] - yPad, yRange[1] + yPad])
        .range([ height, 0]);
        
    svg.append("g")
        .call(d3.axisLeft(y).ticks(6))
        .selectAll("text")
        .style("fill", "#64748b");

    // Use the primary red brand color for all dots to match platform aesthetic
    const color = "#c83830";

    const tooltip = document.getElementById('customTooltip');

    // Add dots
    svg.append('g')
        .selectAll("circle")
        .data(scatterData)
        .join("circle")
        .attr("cx", d => x(d.x))
        .attr("cy", d => y(d.y))
        .attr("r", 4)
        .style("fill", color)
        .style("opacity", 0.6)
        .style("stroke", "#fff")
        .style("stroke-width", 0.5)
        .on("mouseover", function(event, d) {
            d3.select(this)
              .style("opacity", 1)
              .attr("r", 6)
              .style("stroke", "#1e293b")
              .style("stroke-width", 2);
              
            tooltip.innerHTML = `
                <div class="tooltip-header">${d.name}, ${d.state}</div>
                <div class="tooltip-row"><span class="lbl">${xLabel}:</span><span class="val">${d.x.toFixed(1)}</span></div>
                <div class="tooltip-row"><span class="lbl">${yLabel}:</span><span class="val">${d.y.toFixed(1)}</span></div>
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

    // Add Trendline if enough data and correlation is non-zero
    if (scatterData.length > 5 && Math.abs(rValue) > 0.05) {
        // Simple linear regression y = mx + b
        const xVals = scatterData.map(d => d.x);
        const yVals = scatterData.map(d => d.y);
        
        try {
            const m = ss.sampleCovariance(xVals, yVals) / ss.sampleVariance(xVals);
            const b = ss.mean(yVals) - m * ss.mean(xVals);
            
            const lineX1 = xRange[0];
            const lineY1 = m * lineX1 + b;
            
            const lineX2 = xRange[1];
            const lineY2 = m * lineX2 + b;
            
            svg.append("line")
                .attr("x1", x(lineX1))
                .attr("y1", y(lineY1))
                .attr("x2", x(lineX2))
                .attr("y2", y(lineY2))
                .attr("stroke", "#334155")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "4,4");
        } catch (e) {
            console.log("Covariance failed, skipping trendline");
        }
    }
}
