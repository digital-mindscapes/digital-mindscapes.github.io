// =========================================
// COMPARISON TABLE MODULE
// Shared by comparison.html & county_comparison.html
// =========================================

// ── Unit / format metadata for every metric ──────────────────────────────────
const tableMetricMeta = {
    // Economic
    "pct_unemployment_rate": { label: "Unemployment Rate", unit: "%", fmt: "pct", higherIsBad: true },
    "pct_in_labor_force": { label: "Labor Force Participation", unit: "%", fmt: "pct", higherIsBad: false },
    "pct_natural_resources_construction": { label: "Construction Jobs", unit: "%", fmt: "pct", higherIsBad: false },
    // Education
    "pct_graduate_professional_degree": { label: "Graduate Degree", unit: "%", fmt: "pct", higherIsBad: false },
    // Health Outcomes
    "depression_prevalence": { label: "Depression", unit: "%", fmt: "pct", higherIsBad: true },
    "obesity_prevalence": { label: "Obesity", unit: "%", fmt: "pct", higherIsBad: true },
    "diabetes_prevalence": { label: "Diabetes", unit: "%", fmt: "pct", higherIsBad: true },
    "arthritis_prevalence": { label: "Arthritis", unit: "%", fmt: "pct", higherIsBad: true },
    "asthma_prevalence": { label: "Asthma", unit: "%", fmt: "pct", higherIsBad: true },
    "high_blood_pressure_prevalence": { label: "High Blood Pressure", unit: "%", fmt: "pct", higherIsBad: true },
    "high_cholesterol_prevalence": { label: "High Cholesterol", unit: "%", fmt: "pct", higherIsBad: true },
    "coronary_heart_disease_prevalence": { label: "Heart Disease", unit: "%", fmt: "pct", higherIsBad: true },
    "stroke_prevalence": { label: "Stroke", unit: "%", fmt: "pct", higherIsBad: true },
    "cancer_prevalence": { label: "Cancer", unit: "%", fmt: "pct", higherIsBad: true },
    "copd_prevalence": { label: "COPD", unit: "%", fmt: "pct", higherIsBad: true },
    // Health Status
    "mental_health_issues_prevalence": { label: "Mental Distress", unit: "%", fmt: "pct", higherIsBad: true },
    "physical_health_issues_prevalence": { label: "Physical Distress", unit: "%", fmt: "pct", higherIsBad: true },
    "general_health_prevalence": { label: "Fair/Poor Health", unit: "%", fmt: "pct", higherIsBad: true },
    // Risk Behaviors
    "smoking_prevalence": { label: "Smoking", unit: "%", fmt: "pct", higherIsBad: true },
    "binge_drinking_prevalence": { label: "Binge Drinking", unit: "%", fmt: "pct", higherIsBad: true },
    "physical_inactivity_prevalence": { label: "Physical Inactivity", unit: "%", fmt: "pct", higherIsBad: true },
    // Prevention
    "checkup_prevalence": { label: "Annual Checkup", unit: "%", fmt: "pct", higherIsBad: false },
    "cholesterol_screening_prevalence": { label: "Cholesterol Screen", unit: "%", fmt: "pct", higherIsBad: false },
    "bp_medication_prevalence": { label: "BP Medication", unit: "%", fmt: "pct", higherIsBad: false },
    "access2_prevalence": { label: "Uninsured (18-64)", unit: "%", fmt: "pct", higherIsBad: true },
    // Disability
    "disability_prevalence": { label: "Any Disability", unit: "%", fmt: "pct", higherIsBad: true },
    "cognitive_difficulties_prevalence": { label: "Cognitive Difficulty", unit: "%", fmt: "pct", higherIsBad: true },
    "mobility_difficulty_prevalence": { label: "Mobility Difficulty", unit: "%", fmt: "pct", higherIsBad: true },
    "hearing_disability_prevalence": { label: "Hearing Disability", unit: "%", fmt: "pct", higherIsBad: true },
    "vision_difficulty_prevalence": { label: "Vision Difficulty", unit: "%", fmt: "pct", higherIsBad: true },
    "self_care_difficulty_prevalence": { label: "Self-Care Difficulty", unit: "%", fmt: "pct", higherIsBad: true },
    "independent_living_difficulty_prevalence": { label: "Indep. Living Diff.", unit: "%", fmt: "pct", higherIsBad: true },
    // Social Needs
    "loneliness_prevalence": { label: "Social Isolation", unit: "%", fmt: "pct", higherIsBad: true },
    "emotional_support_prevalence": { label: "Lack Emotional Support", unit: "%", fmt: "pct", higherIsBad: true },
    "food_insecurity_prevalence": { label: "Food Insecurity", unit: "%", fmt: "pct", higherIsBad: true },
    "food_stamp_prevalence": { label: "Food Stamps (SNAP)", unit: "%", fmt: "pct", higherIsBad: true },
    "housing_insecurity_prevalence": { label: "Housing Insecurity", unit: "%", fmt: "pct", higherIsBad: true },
    "utility_shutoff_prevalence": { label: "Utility Shutoff Threat", unit: "%", fmt: "pct", higherIsBad: true },
    "lack_transportation_prevalence": { label: "Transport Barriers", unit: "%", fmt: "pct", higherIsBad: true },
    // Demographics
    "total_population_sum": { label: "Total Population", unit: "", fmt: "num", higherIsBad: null },
    "average_household_size": { label: "Avg. Household Size", unit: "persons", fmt: "dec", higherIsBad: null },
    "average_family_size": { label: "Avg. Family Size", unit: "persons", fmt: "dec", higherIsBad: null },
    "pct_speak_english_less_than_very_well": { label: "Limited English", unit: "%", fmt: "pct", higherIsBad: true },
    "pct_households_1plus_people_65plus": { label: "HH w/ Seniors", unit: "%", fmt: "pct", higherIsBad: null },
    "households_with_broadband_sum": { label: "Broadband Households", unit: "", fmt: "num", higherIsBad: false },
};

// All metric keys in display order (by section)
const tableMetricSections = [
    {
        section: "Economic Factors",
        metrics: ["pct_unemployment_rate", "pct_in_labor_force", "pct_natural_resources_construction"]
    },
    {
        section: "Education",
        metrics: ["pct_graduate_professional_degree"]
    },
    {
        section: "Health Outcomes",
        metrics: ["depression_prevalence", "obesity_prevalence", "diabetes_prevalence", "arthritis_prevalence",
            "asthma_prevalence", "high_blood_pressure_prevalence", "high_cholesterol_prevalence",
            "coronary_heart_disease_prevalence", "stroke_prevalence", "cancer_prevalence", "copd_prevalence"]
    },
    {
        section: "Health Status",
        metrics: ["mental_health_issues_prevalence", "physical_health_issues_prevalence", "general_health_prevalence"]
    },
    {
        section: "Health Risk Behaviors",
        metrics: ["smoking_prevalence", "binge_drinking_prevalence", "physical_inactivity_prevalence"]
    },
    {
        section: "Prevention",
        metrics: ["checkup_prevalence", "cholesterol_screening_prevalence", "bp_medication_prevalence", "access2_prevalence"]
    },
    {
        section: "Disability",
        metrics: ["disability_prevalence", "cognitive_difficulties_prevalence", "mobility_difficulty_prevalence",
            "hearing_disability_prevalence", "vision_difficulty_prevalence", "self_care_difficulty_prevalence",
            "independent_living_difficulty_prevalence"]
    },
    {
        section: "Social Needs",
        metrics: ["loneliness_prevalence", "emotional_support_prevalence", "food_insecurity_prevalence",
            "food_stamp_prevalence", "housing_insecurity_prevalence", "utility_shutoff_prevalence",
            "lack_transportation_prevalence"]
    },
    {
        section: "Demographics & Housing",
        metrics: ["total_population_sum", "average_household_size", "average_family_size",
            "pct_speak_english_less_than_very_well", "pct_households_1plus_people_65plus",
            "households_with_broadband_sum"]
    }
];

// ── Formatting helpers ────────────────────────────────────────────────────────
function formatValue(val, fmt) {
    if (val === null || val === undefined || val === "") return "—";
    const n = parseFloat(val);
    if (isNaN(n)) return "—";
    switch (fmt) {
        case "pct": return n.toFixed(1) + "%";
        case "dec": return n.toFixed(2);
        case "num": return n.toLocaleString();
        default: return n.toFixed(1);
    }
}

// ── Color scale: green → yellow → red ────────────────────────────────────────
function heatColor(normalised, higherIsBad) {
    if (higherIsBad === null) {
        return `rgba(14, 165, 233, ${0.08 + normalised * 0.22})`;
    }
    const t = higherIsBad ? normalised : 1 - normalised;
    let r, g, b;
    if (t < 0.5) {
        r = Math.round(2 * t * 245);
        g = Math.round(167 + (1 - 2 * t) * 20);
        b = Math.round(66 * (1 - 2 * t));
    } else {
        r = Math.round(245 - (2 * t - 1) * 45);
        g = Math.round((1 - (2 * t - 1)) * 167);
        b = 0;
    }
    return `rgba(${r},${g},${b},0.22)`;
}

// ── Main render — shows ONLY the active metric ────────────────────────────────
/**
 * @param {string}  containerId  – id of the <div> to render into
 * @param {Array}   rows         – [{name, region, ...metricValues}]
 * @param {string}  activeMetric – the single metric key to display
 */
function renderComparisonTable(containerId, rows, activeMetric) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!rows || rows.length === 0) {
        container.innerHTML = `
            <div class="ct-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none"
                     stroke="#c83830" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <p>Select locations on the map to compare them here.</p>
            </div>`;
        return;
    }

    const meta = tableMetricMeta[activeMetric] || { label: activeMetric, unit: "", fmt: "dec", higherIsBad: null };

    // Compute values and min/max for heat coloring
    const withVals = rows.map(r => ({ ...r, _val: parseFloat(r[activeMetric]) }));
    const nums = withVals.map(r => r._val).filter(v => !isNaN(v));
    const minVal = Math.min(...nums);
    const maxVal = Math.max(...nums);
    const range = maxVal - minVal;

    // grouping state
    if (window.tableGroupMode === undefined) window.tableGroupMode = false;
    const isGrouped = window.tableGroupMode;

    // Detect if we are in Urban-Rural mode (if rucc_class exists in data)
    const isUrbanRural = rows.length > 0 && ('rucc_class' in rows[0]);
    const groupField = isUrbanRural ? "rucc_class" : "region";
    const groupLabel = isUrbanRural ? "Group Urban/Rural" : "Group Regions";

    // Sort logic
    if (isGrouped) {
        const groupOrderMap = isUrbanRural
            ? { "Metro": 0, "Nonmetro": 1 }
            : { "Central": 0, "East": 1, "South": 2, "West": 3 };

        withVals.sort((a, b) => {
            const ra = groupOrderMap[a[groupField]] ?? 99;
            const rb = groupOrderMap[b[groupField]] ?? 99;
            if (ra !== rb) return ra - rb;
            // secondary: value desc
            if (isNaN(a._val) && isNaN(b._val)) return 0;
            if (isNaN(a._val)) return 1;
            if (isNaN(b._val)) return -1;
            return b._val - a._val;
        });
    } else {
        // Just sort highest → lowest by value (NaN to bottom)
        withVals.sort((a, b) => {
            if (isNaN(a._val) && isNaN(b._val)) return 0;
            if (isNaN(a._val)) return 1;
            if (isNaN(b._val)) return -1;
            return b._val - a._val;
        });
    }

    const regionColorMap = {
        "Central": "#0ea5e9", "East": "#10b981", "South": "#f59e0b", "West": "#a855f7"
    };
    const ruccColorMap = {
        "Metro": "#3b82f6", "Nonmetro": "#eab308"
    };

    const unitLabel = meta.unit ? ` (${meta.unit})` : "";
    const dirLabel = meta.higherIsBad === true ? " ↑ worse"
        : meta.higherIsBad === false ? " ↑ better"
            : "";

    let html = `
    <div class="ct-single-header">
        <div style="display:flex; align-items:center; gap:12px;">
            <div class="ct-metric-pill">
                <span class="ct-metric-name">${meta.label}</span>
                ${meta.unit ? `<span class="ct-metric-unit">${meta.unit}</span>` : ""}
                ${dirLabel ? `<span class="ct-metric-dir">${dirLabel}</span>` : ""}
            </div>
            <button class="ct-group-toggle ${isGrouped ? 'active' : ''}" 
                    onclick="window.tableGroupMode = !window.tableGroupMode; if(typeof refreshTable==='function') refreshTable();">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" 
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18M3 12h18M3 18h18"/>
                </svg>
                ${groupLabel}
            </button>
        </div>
        <span class="ct-row-count">${withVals.length} location${withVals.length !== 1 ? "s" : ""}</span>
    </div>
    <div class="ct-scroll">
    <table class="ct-table">
        <thead>
            <tr>
                <th class="ct-th ct-th-rank">#</th>
                <th class="ct-th ct-th-name">Location</th>
                <th class="ct-th ct-th-region">${isUrbanRural ? 'Classification' : 'Region'}</th>
                <th class="ct-th ct-th-value">${meta.label}${unitLabel}</th>
                <th class="ct-th ct-th-bar">Relative</th>
            </tr>
        </thead>
        <tbody>`;

    withVals.forEach((row, i) => {
        const isValid = !isNaN(row._val);
        const norm = isValid && range > 0 ? (row._val - minVal) / range : 0.5;
        const bg = isValid ? heatColor(norm, meta.higherIsBad) : "transparent";
        const barPct = isValid && range > 0 ? Math.round(norm * 100) : 0;
        const barColor = isValid ? heatColor(norm, meta.higherIsBad).replace("0.22", "0.65") : "#eee";

        const groupVal = row[groupField] || "—";
        const badgeColor = isUrbanRural
            ? (ruccColorMap[groupVal] || "#888")
            : (regionColorMap[groupVal] || "#888");

        const valDisplay = formatValue(row._val, meta.fmt);

        html += `
        <tr class="ct-row">
            <td class="ct-td ct-td-rank">${i + 1}</td>
            <td class="ct-td ct-td-name" title="${row.name}">${row.name}</td>
            <td class="ct-td ct-td-region">
                <span class="ct-region-badge"
                      style="background:${badgeColor}20;color:${badgeColor};border:1px solid ${badgeColor}40">
                    ${groupVal}
                </span>
            </td>
            <td class="ct-td ct-td-value" style="background:${bg}">${valDisplay}</td>
            <td class="ct-td ct-td-bar">
                <div class="ct-bar-track">
                    <div class="ct-bar-fill" style="width:${barPct}%;background:${barColor}"></div>
                </div>
            </td>
        </tr>`;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

