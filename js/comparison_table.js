// =========================================
// COMPARISON TABLE MODULE
// Shared by comparison.html & county_comparison.html
// =========================================

// ── Unit / format metadata for every metric ──────────────────────────────────
const tableMetricMeta = {
    // Economic
    "pct_unemployment_rate": { label: "Unemployment Rate", shortLabel: "Unemployment", unit: "%", fmt: "pct", higherIsBad: true },
    "pct_in_labor_force": { label: "Labor Force Participation", shortLabel: "Labor Force %", unit: "%", fmt: "pct", higherIsBad: false },
    "pct_natural_resources_construction": { label: "Construction Jobs", shortLabel: "Construction", unit: "%", fmt: "pct", higherIsBad: false },
    // Education
    "pct_graduate_professional_degree": { label: "Graduate Degree", shortLabel: "Grad. Degree", unit: "%", fmt: "pct", higherIsBad: false },
    // Health Outcomes
    "depression_prevalence": { label: "Depression", shortLabel: "Depression", unit: "%", fmt: "pct", higherIsBad: true },
    "obesity_prevalence": { label: "Obesity", shortLabel: "Obesity", unit: "%", fmt: "pct", higherIsBad: true },
    "diabetes_prevalence": { label: "Diabetes", shortLabel: "Diabetes", unit: "%", fmt: "pct", higherIsBad: true },
    "arthritis_prevalence": { label: "Arthritis", shortLabel: "Arthritis", unit: "%", fmt: "pct", higherIsBad: true },
    "asthma_prevalence": { label: "Asthma", shortLabel: "Asthma", unit: "%", fmt: "pct", higherIsBad: true },
    "high_blood_pressure_prevalence": { label: "High Blood Pressure", shortLabel: "High BP", unit: "%", fmt: "pct", higherIsBad: true },
    "high_cholesterol_prevalence": { label: "High Cholesterol", shortLabel: "High Cholest.", unit: "%", fmt: "pct", higherIsBad: true },
    "coronary_heart_disease_prevalence": { label: "Heart Disease", shortLabel: "Heart Disease", unit: "%", fmt: "pct", higherIsBad: true },
    "stroke_prevalence": { label: "Stroke", shortLabel: "Stroke", unit: "%", fmt: "pct", higherIsBad: true },
    "cancer_prevalence": { label: "Cancer", shortLabel: "Cancer", unit: "%", fmt: "pct", higherIsBad: true },
    "copd_prevalence": { label: "COPD", shortLabel: "COPD", unit: "%", fmt: "pct", higherIsBad: true },
    // Health Status
    "mental_health_issues_prevalence": { label: "Mental Distress", shortLabel: "Mental Distress", unit: "%", fmt: "pct", higherIsBad: true },
    "physical_health_issues_prevalence": { label: "Physical Distress", shortLabel: "Phys. Distress", unit: "%", fmt: "pct", higherIsBad: true },
    "general_health_prevalence": { label: "Fair/Poor Health", shortLabel: "Fair/Poor Health", unit: "%", fmt: "pct", higherIsBad: true },
    // Risk Behaviors
    "smoking_prevalence": { label: "Smoking", shortLabel: "Smoking", unit: "%", fmt: "pct", higherIsBad: true },
    "binge_drinking_prevalence": { label: "Binge Drinking", shortLabel: "Binge Drinking", unit: "%", fmt: "pct", higherIsBad: true },
    "physical_inactivity_prevalence": { label: "Physical Inactivity", shortLabel: "Inactive", unit: "%", fmt: "pct", higherIsBad: true },
    // Prevention
    "checkup_prevalence": { label: "Annual Checkup", shortLabel: "Checkup", unit: "%", fmt: "pct", higherIsBad: false },
    "cholesterol_screening_prevalence": { label: "Cholesterol Screen", shortLabel: "Chol. Screen", unit: "%", fmt: "pct", higherIsBad: false },
    "bp_medication_prevalence": { label: "BP Medication", shortLabel: "BP Meds", unit: "%", fmt: "pct", higherIsBad: false },
    "access2_prevalence": { label: "Uninsured (18-64)", shortLabel: "Uninsured", unit: "%", fmt: "pct", higherIsBad: true },
    // Disability
    "disability_prevalence": { label: "Any Disability", shortLabel: "Disability", unit: "%", fmt: "pct", higherIsBad: true },
    "cognitive_difficulties_prevalence": { label: "Cognitive Difficulty", shortLabel: "Cognitive Diff.", unit: "%", fmt: "pct", higherIsBad: true },
    "mobility_difficulty_prevalence": { label: "Mobility Difficulty", shortLabel: "Mobility Diff.", unit: "%", fmt: "pct", higherIsBad: true },
    "hearing_disability_prevalence": { label: "Hearing Disability", shortLabel: "Hearing Diff.", unit: "%", fmt: "pct", higherIsBad: true },
    "vision_difficulty_prevalence": { label: "Vision Difficulty", shortLabel: "Vision Diff.", unit: "%", fmt: "pct", higherIsBad: true },
    "self_care_difficulty_prevalence": { label: "Self-Care Difficulty", shortLabel: "Self-Care Diff.", unit: "%", fmt: "pct", higherIsBad: true },
    "independent_living_difficulty_prevalence": { label: "Indep. Living Diff.", shortLabel: "Indep. Living", unit: "%", fmt: "pct", higherIsBad: true },
    // Social Needs
    "loneliness_prevalence": { label: "Social Isolation", shortLabel: "Isolation", unit: "%", fmt: "pct", higherIsBad: true },
    "emotional_support_prevalence": { label: "Lack Emotional Support", shortLabel: "Emot. Support", unit: "%", fmt: "pct", higherIsBad: true },
    "food_insecurity_prevalence": { label: "Food Insecurity", shortLabel: "Food Insec.", unit: "%", fmt: "pct", higherIsBad: true },
    "food_stamp_prevalence": { label: "Food Stamps (SNAP)", shortLabel: "Food Stamps", unit: "%", fmt: "pct", higherIsBad: true },
    "housing_insecurity_prevalence": { label: "Housing Insecurity", shortLabel: "Housing Insec.", unit: "%", fmt: "pct", higherIsBad: true },
    "utility_shutoff_prevalence": { label: "Utility Shutoff Threat", shortLabel: "Utility Threat", unit: "%", fmt: "pct", higherIsBad: true },
    "lack_transportation_prevalence": { label: "Transport Barriers", shortLabel: "Transport", unit: "%", fmt: "pct", higherIsBad: true },
    // Demographics
    "total_population_sum": { label: "Total Population", shortLabel: "Population", unit: "", fmt: "num", higherIsBad: null },
    "average_household_size": { label: "Avg. Household Size", shortLabel: "HH Size", unit: "persons", fmt: "dec", higherIsBad: null },
    "average_family_size": { label: "Avg. Family Size", shortLabel: "Family Size", unit: "persons", fmt: "dec", higherIsBad: null },
    "pct_speak_english_less_than_very_well": { label: "Limited English", shortLabel: "English Prof.", unit: "%", fmt: "pct", higherIsBad: true },
    "pct_households_1plus_people_65plus": { label: "HH w/ Seniors", shortLabel: "Seniors in HH", unit: "%", fmt: "pct", higherIsBad: null },
    "households_with_broadband_sum": { label: "Broadband Households", shortLabel: "Broadband", unit: "", fmt: "num", higherIsBad: false },
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

// ── Export and Search State ────────────────────────────────────────────────
if (window.tableSearchQuery === undefined) window.tableSearchQuery = "";

function exportTableToCSV(rows, activeMetric) {
    const meta = tableMetricMeta[activeMetric] || { label: activeMetric, unit: "" };
    const unitLabel = meta.unit ? ` (${meta.unit})` : "";
    const headers = ["Rank", "Location", "Classification/Region", `${meta.label}${unitLabel}`];

    let csvContent = headers.join(",") + "\n";

    rows.forEach((row, i) => {
        const val = formatValue(row[activeMetric], meta.fmt).replace(/,/g, '');
        const line = [
            i + 1,
            `"${row.name}"`,
            `"${row.rucc_class || row.region || ''}"`,
            val
        ];
        csvContent += line.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `comparison_data_${activeMetric}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function copyTableHTML(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clone the container to manipulate it
    const clone = container.cloneNode(true);

    // Remove UI elements we don't want in the export
    const toolbar = clone.querySelector('.ct-toolbar');
    if (toolbar) toolbar.remove();

    const existingWatermark = clone.querySelector('.ct-watermark');
    if (existingWatermark) existingWatermark.remove();

    // Collect relevant CSS rules
    let cssText = "";
    const sheets = document.styleSheets;
    for (let i = 0; i < sheets.length; i++) {
        try {
            const rules = sheets[i].cssRules || sheets[i].rules;
            for (let j = 0; j < rules.length; j++) {
                const rule = rules[j];
                // Keep .ct- styles, root variables, and specific animations
                if (rule.selectorText && (
                    rule.selectorText.includes('.ct-') ||
                    rule.selectorText.includes(':root') ||
                    rule.selectorText.includes('var(--')
                )) {
                    cssText += rule.cssText + "\n";
                }
            }
        } catch (e) { /* Skip CORS restricted sheets */ }
    }

    // Build self-sufficient HTML snippet
    const finalHTML = `
<!-- Comparison Table Export -->
<div class="ct-export-context" style="background:white; padding:15px; border-radius:12px; font-family: system-ui, -apple-system, sans-serif;">
    <style>
        ${cssText}
        .ct-scroll { max-height: none !important; overflow: visible !important; border: none !important; }
        .ct-single-header { margin-top: 0 !important; }
        .ct-table { width: 100% !important; border: 1px solid #f1f5f9; border-radius: 8px; border-collapse: separate; border-spacing: 0; }
        .ct-watermark { 
            margin-top: 15px; 
            padding-top: 10px; 
            border-top: 1px solid #eee; 
            text-align: right; 
            font-size: 11px; 
            color: #94a3b8;
            font-style: italic;
        }
    </style>
    ${clone.innerHTML}
    <div class="ct-watermark" style="text-align: right; margin-top: 15px; padding-top: 12px; border-top: 1px solid #eee; font-size: 11px; color: #64748b; font-family: system-ui, sans-serif; line-height: 1.6;">
        <strong>Digital Mindscapes: An Interactive Public Health & Socioeconomic Data Visualization Platform</strong><br>
        Datta, A., Rubiya, S., Chakrabarti, A., & Banerjee, A. (2026)
    </div>
</div>
<!-- End Export -->`;

    navigator.clipboard.writeText(finalHTML).then(() => {
        const btn = document.querySelector('.ct-action-btn[title="Copy HTML"]');
        showCopyFeedback(btn);
    }).catch(err => {
        console.error('Failed to copy HTML:', err);
    });
}

function copyTableLaTeX(activeMetric) {
    const rows = window.selectedTableRows || [];
    if (rows.length === 0) return;

    const meta = tableMetricMeta[activeMetric] || { label: activeMetric, unit: "", fmt: "dec", higherIsBad: null };
    const cleanLabel = meta.label.replace(/_/g, '\\_').replace(/%/g, '\\%').replace(/&/g, '\\&');
    const unitText = meta.unit ? ` (${meta.unit.replace(/%/g, '\\%')})` : "";

    // Calculate range for heat coloring
    const nums = rows.map(r => parseFloat(r[activeMetric])).filter(v => !isNaN(v));
    const minVal = Math.min(...nums);
    const maxVal = Math.max(...nums);
    const range = maxVal - minVal;

    const getLaTeXColor = (val) => {
        if (isNaN(val)) return "";
        const norm = range > 0 ? (val - minVal) / range : 0.5;
        let r, g, b, a = 0.22;

        if (meta.higherIsBad === null) {
            r = 14; g = 165; b = 233;
            a = 0.08 + norm * 0.22;
        } else {
            const t = meta.higherIsBad ? norm : 1 - norm;
            if (t < 0.5) {
                r = Math.round(2 * t * 245);
                g = Math.round(167 + (1 - 2 * t) * 20);
                b = Math.round(66 * (1 - 2 * t));
            } else {
                r = Math.round(245 - (2 * t - 1) * 45);
                g = Math.round((1 - (2 * t - 1)) * 167);
                b = 0;
            }
        }
        // Mix with white background
        const fR = Math.round(r * a + 255 * (1 - a));
        const fG = Math.round(g * a + 255 * (1 - a));
        const fB = Math.round(b * a + 255 * (1 - a));
        const hex = (fR << 16 | fG << 8 | fB).toString(16).padStart(6, '0').toUpperCase();
        return `\\cellcolor[HTML]{${hex}}`;
    };

    let latex = "% --- LaTeX Table Setup ---\n";
    latex += "% Add these to your preamble:\n";
    latex += "% \\usepackage{booktabs}\n";
    latex += "% \\usepackage{caption}\n";
    latex += "% \\usepackage[table]{xcolor}\n";
    latex += "% \\def\\mybar#1{{\\color{gray}\\rule{#1cm}{8pt}}}\n\n";
    latex += "\\begin{table}[htbp]\n";
    latex += "  \\centering\n";
    latex += `  \\caption{Geographic Comparison: ${cleanLabel}}\n`;
    latex += "  \\begin{tabular}{rllll}\n";
    latex += "    \\toprule\n";
    latex += `    Rank & Location & Region/Class & ${cleanLabel}${unitText} & Distribution \\\\\n`;
    latex += "    \\midrule\n";

    rows.forEach((row, i) => {
        const name = row.name.replace(/&/g, '\\&').replace(/_/g, '\\_').replace(/%/g, '\\%');
        const reg = (row.rucc_class || row.region || "").replace(/&/g, '\\&').replace(/_/g, '\\_').replace(/%/g, '\\%');
        const valNum = parseFloat(row[activeMetric]);
        const valStr = formatValue(valNum, meta.fmt).replace(/%/g, '\\%').replace(/&/g, '\\&');
        const cellColor = getLaTeXColor(valNum);

        // Normalized value for \mybar (max 2cm)
        const norm = !isNaN(valNum) && range > 0 ? (valNum - minVal) / range : 0;
        const normVal = (!isNaN(valNum) && range > 0 ? (norm * 2.0).toFixed(2) : "0.00");

        latex += `    ${i + 1} & ${name} & ${reg} & ${cellColor} ${valStr} & \\mybar{${normVal}} \\\\\n`;
    });

    latex += "    \\bottomrule\n";
    latex += "  \\end{tabular}\n";
    latex += "  \\par\\smallskip\n";
    latex += "  \\tiny\\itshape Source: Datta, A., Rubiya, S., Chakrabarti, A., \\& Banerjee, A. (2026). Digital Mindscapes Project.\n";
    latex += "\\end{table}";

    navigator.clipboard.writeText(latex).then(() => {
        const btn = document.querySelector('.ct-action-btn[title="Copy LaTeX"]');
        showCopyFeedback(btn);
    }).catch(err => {
        console.error('Failed to copy LaTeX:', err);
    });
}


function showCopyFeedback(btn) {
    if (!btn) return;
    const originalHTML = btn.innerHTML;
    const originalBorder = btn.style.borderColor;
    const originalColor = btn.style.color;

    btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Copied!
    `;
    btn.style.borderColor = "#10b981";
    btn.style.color = "#10b981";
    setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.borderColor = originalBorder;
        btn.style.color = originalColor;
    }, 2000);
}

// ── Main render — shows ONLY the active metric ────────────────────────────────
/**
 * @param {string}  containerId  – id of the <div> to render into
 * @param {Array}   rows         – [{name, region, ...metricValues}]
 * @param {string}  activeMetric – the single metric key to display
 */
function syncTableToggles() {
    const sGroup = document.getElementById("stateGroupToggle");
    const rGroup = document.getElementById("regionToggle");
    const ruGroup = document.getElementById("ruccGroupToggle");

    if (sGroup) sGroup.checked = !!window.tableGroupStateMode;
    if (rGroup) rGroup.checked = !!window.tableGroupMode;
    if (ruGroup) ruGroup.checked = !!window.tableGroupMode;
}

function renderComparisonTable(containerId, rows, activeMetric) {
    syncTableToggles();
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
    let withVals = rows.map(r => ({ ...r, _val: parseFloat(r[activeMetric]) }));

    // Apply Global Search Filter
    if (window.tableSearchQuery) {
        const q = window.tableSearchQuery.toLowerCase();
        withVals = withVals.filter(r =>
            (r.name && r.name.toLowerCase().includes(q)) ||
            (r.region && r.region.toLowerCase().includes(q)) ||
            (r.rucc_class && r.rucc_class.toLowerCase().includes(q)) ||
            (r.state_name && r.state_name.toLowerCase().includes(q))
        );
    }

    const nums = withVals.map(r => r._val).filter(v => !isNaN(v));
    const minVal = Math.min(...nums);
    const maxVal = Math.max(...nums);
    const range = maxVal - minVal;

    // Calculate Summary Stats
    const sum = nums.reduce((a, b) => a + b, 0);
    const mean = nums.length > 0 ? sum / nums.length : 0;
    const sortedNums = [...nums].sort((a, b) => a - b);
    const median = sortedNums.length > 0
        ? (sortedNums.length % 2 === 0
            ? (sortedNums[sortedNums.length / 2 - 1] + sortedNums[sortedNums.length / 2]) / 2
            : sortedNums[Math.floor(sortedNums.length / 2)])
        : 0;


    // grouping state
    if (window.tableGroupMode === undefined) window.tableGroupMode = false;
    if (window.tableGroupStateMode === undefined) window.tableGroupStateMode = false;

    const isGrouped = window.tableGroupMode;
    const isStateGrouped = window.tableGroupStateMode;

    // Detect if we are in Urban-Rural mode (if rucc_class exists in data)
    const isUrbanRural = rows.length > 0 && ('rucc_class' in rows[0]);
    const groupField = isUrbanRural ? "rucc_class" : "region";
    const groupLabel = isUrbanRural ? "Group Urban/Rural" : "Group Regions";

    // Sort logic
    if (isStateGrouped) {
        // Group by State (State Name Alpha, then Value Desc)
        withVals.sort((a, b) => {
            const sa = a.state_name || a.state || "";
            const sb = b.state_name || b.state || "";
            if (sa !== sb) return sa.localeCompare(sb);

            if (isNaN(a._val) && isNaN(b._val)) return 0;
            if (isNaN(a._val)) return 1;
            if (isNaN(b._val)) return -1;
            return b._val - a._val;
        });
    } else if (isGrouped) {
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

    const hasStateData = rows.length > 0 && (rows[0].state_name || rows[0].state);

    let html = `
    <div class="ct-toolbar">
        <div class="ct-search-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Search locations..." id="ctSearchInput" value="${window.tableSearchQuery}"
                   oninput="window.tableSearchQuery = this.value; if(typeof refreshTable==='function') refreshTable();">
        </div>
        <div class="ct-actions">
            <button class="ct-action-btn" onclick="exportTableToCSV(selectedTableRows, '${activeMetric}')" title="Export CSV">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                CSV
            </button>
            <button class="ct-action-btn" onclick="copyTableHTML('${containerId}')" title="Copy HTML">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                HTML
            </button>
            <button class="ct-action-btn" onclick="copyTableLaTeX('${activeMetric}')" title="Copy LaTeX">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                LaTeX
            </button>
        </div>
    </div>

    <div class="ct-summary-stats">
        <div class="ct-stat-card">
            <span class="label">Average</span>
            <span class="value">${formatValue(mean, meta.fmt)}</span>
        </div>
        <div class="ct-stat-card">
            <span class="label">Median</span>
            <span class="value">${formatValue(median, meta.fmt)}</span>
        </div>
        <div class="ct-stat-card">
            <span class="label">Range (Min - Max)</span>
            <span class="value">${formatValue(minVal, meta.fmt)} - ${formatValue(maxVal, meta.fmt)}</span>
        </div>
        <div class="ct-stat-card">
            <span class="label">Selected</span>
            <span class="value">${nums.length}</span>
        </div>
    </div>


    <div class="ct-single-header">
        <div style="display:flex; align-items:center; gap:12px;">
            <div class="ct-metric-pill">
                <span class="ct-metric-name">${meta.label}</span>
                ${meta.unit ? `<span class="ct-metric-unit">${meta.unit}</span>` : ""}
                ${dirLabel ? `<span class="ct-metric-dir">${dirLabel}</span>` : ""}
            </div>
            <button class="ct-group-toggle ${isGrouped ? 'active' : ''}" 
                    onclick="window.tableGroupStateMode = false; window.tableGroupMode = !window.tableGroupMode; syncTableToggles(); if(typeof refreshTable==='function') refreshTable();">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" 
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18M3 12h18M3 18h18"/>
                </svg>
                ${groupLabel}
            </button>
            ${hasStateData ? `
            <button class="ct-group-toggle ${isStateGrouped ? 'active' : ''}" 
                    onclick="window.tableGroupMode = false; window.tableGroupStateMode = !window.tableGroupStateMode; syncTableToggles(); if(typeof refreshTable==='function') refreshTable();">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" 
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Group by State
            </button>` : ''}
        </div>
        <span class="ct-row-count">${withVals.length} matching location${withVals.length !== 1 ? "s" : ""}</span>
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

    const groupIcons = {
        "Metro": `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.8;"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="2"></line><line x1="15" y1="22" x2="15" y2="2"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="10" x2="20" y2="10"></line><line x1="4" y1="14" x2="20" y2="14"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>`,
        "Nonmetro": `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.8;"><path d="M12 3l8 11h-16l8-11z"></path><path d="M12 17v4"></path></svg>`,
        "Default": `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.8;"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>`
    };

    let lastGroup = null;
    withVals.forEach((row, i) => {
        const currentGroup = isStateGrouped
            ? (row.state_name || row.state || "Unknown State")
            : (isGrouped ? (row[groupField] || "Unknown") : null);

        if (currentGroup && currentGroup !== lastGroup) {
            // Calculate Group Average
            const groupRows = withVals.filter(r =>
                isStateGrouped ? (r.state_name || r.state) === currentGroup : r[groupField] === currentGroup
            );
            const gNums = groupRows.map(r => r._val).filter(v => !isNaN(v));
            const gAvg = gNums.length > 0 ? (gNums.reduce((a, b) => a + b, 0) / gNums.length) : 0;
            const gAvgDisplay = gNums.length > 0 ? `Avg: ${formatValue(gAvg, meta.fmt)}` : "";

            if (isStateGrouped) {
                const stateAbbr = (row.state_abbr || "").toLowerCase();
                const flagUrl = stateAbbr ? `https://flagcdn.com/w40/us-${stateAbbr}.png` : "";

                html += `
                <tr class="ct-group-header">
                    <td colspan="5" style="background: #f8fafc; padding: 10px 15px; border-bottom: 2px solid #e2e8f0; font-weight: 800; color: var(--main-color); font-size: 0.9rem; letter-spacing: 0.5px;">
                        <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
                            <div style="display:flex; align-items:center; gap:10px;">
                                ${flagUrl ? `<img src="${flagUrl}" alt="${currentGroup}" 
                                     style="width: 22px; height: auto; border-radius: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #ddd;"
                                     onerror="this.style.visibility='hidden'">` : ""}
                                ${currentGroup.toUpperCase()}
                            </div>
                            <span style="font-size:0.75rem; font-weight:600; color:#64748b;">${gAvgDisplay}</span>
                        </div>
                    </td>
                </tr>`;
            } else if (isGrouped) {
                const icon = groupIcons[currentGroup] || groupIcons["Default"];
                const badgeColor = isUrbanRural
                    ? (ruccColorMap[currentGroup] || "#64748b")
                    : (regionColorMap[currentGroup] || "#64748b");

                html += `
                <tr class="ct-group-header">
                    <td colspan="5" style="background: #f8fafc; padding: 10px 15px; border-bottom: 2px solid ${badgeColor}40; font-weight: 800; color: ${badgeColor}; font-size: 0.9rem; letter-spacing: 0.5px;">
                        <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
                            <div style="display:flex; align-items:center; gap:10px;">
                                ${icon}
                                ${currentGroup.toUpperCase()}
                            </div>
                            <span style="font-size:0.75rem; font-weight:600; opacity:0.8;">${gAvgDisplay}</span>
                        </div>
                    </td>
                </tr>`;
            }
            lastGroup = currentGroup;
        }

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
        const displayName = isStateGrouped ? row.name.split(',')[0].trim() : row.name;

        html += `
        <tr class="ct-row">
            <td class="ct-td ct-td-rank">${i + 1}</td>
            <td class="ct-td ct-td-name" title="${row.name}">${displayName}</td>
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

    html += `</tbody></table></div>
    <div class="ct-watermark">
        <strong>Digital Mindscapes</strong> | Datta, A., Rubiya, S., Chakrabarti, A., & Banerjee, A. (2026)
    </div>`;
    container.innerHTML = html;

    // Auto-focus search if it was active
    const searchInput = document.getElementById('ctSearchInput');
    if (searchInput && window.tableSearchQuery) {
        searchInput.focus();
        searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
    }

    // Store rows globally for export
    window.selectedTableRows = withVals;
}
