/**
 * Bivariate Analysis Script
 * Handles 3x3 bivariate map rendering for US Counties
 * Inspired by county_comparison_amcharts.js for robust mapping
 */

// =========================================
// CONFIGURATION & METRICS
// =========================================

const colorSchemes = {
    "teal_purple": [
        ["#fcf8e3", "#ace4e4", "#5ac8c8"], // Low-Low is light cream
        ["#dfb0d6", "#a5add3", "#5698b9"],
        ["#be64ac", "#8c62aa", "#3b4994"]
    ],
    "brown_blue": [
        ["#fcf8e3", "#e4acac", "#c85a5a"],
        ["#b0d6df", "#adb3a5", "#98b956"],
        ["#64acbe", "#62aa8c", "#49943b"]
    ],
    "pink_yellow": [
        ["#fcf8e3", "#f3e0d7", "#e1b4a1"],
        ["#d3d6f3", "#c0c4e1", "#a299c8"],
        ["#7b87d3", "#6b74c1", "#3b2b94"]
    ],
    "blue_orange": [
        ["#fcf8e3", "#b2d5e5", "#6ea6cd"],
        ["#eeadad", "#ad9ea5", "#6773a5"],
        ["#df5e5e", "#a35555", "#4a4c5a"]
    ]
};

let bivariateColors = colorSchemes["teal_purple"];

const metricLabels = {
    "pct_unemployment_rate": "Unemployment Rate",
    "pct_in_labor_force": "Labor Force %",
    "pct_natural_resources_construction": "Construction Jobs",
    "pct_graduate_professional_degree": "Graduate Degree",
    "depression_prevalence": "Depression",
    "obesity_prevalence": "Obesity",
    "diabetes_prevalence": "Diabetes",
    "arthritis_prevalence": "Arthritis",
    "asthma_prevalence": "Asthma",
    "high_blood_pressure_prevalence": "High Blood Pressure",
    "high_cholesterol_prevalence": "High Cholesterol",
    "coronary_heart_disease_prevalence": "Heart Disease",
    "stroke_prevalence": "Stroke",
    "cancer_prevalence": "Cancer",
    "copd_prevalence": "COPD",
    "mental_health_issues_prevalence": "Mental Distress",
    "physical_health_issues_prevalence": "Physical Distress",
    "general_health_prevalence": "Fair/Poor Health",
    "smoking_prevalence": "Smoking",
    "binge_drinking_prevalence": "Binge Drinking",
    "physical_inactivity_prevalence": "Physical Inactivity",
    "checkup_prevalence": "Annual Checkup",
    "cholesterol_screening_prevalence": "Cholesterol Screen",
    "bp_medication_prevalence": "BP Medication",
    "access2_prevalence": "Lack Ins. (18-64)",
    "disability_prevalence": "Any Disability",
    "cognitive_difficulties_prevalence": "Cognitive",
    "mobility_difficulty_prevalence": "Mobility",
    "hearing_disability_prevalence": "Hearing",
    "vision_difficulty_prevalence": "Vision",
    "self_care_difficulty_prevalence": "Self-Care",
    "independent_living_difficulty_prevalence": "Indep. Living",
    "loneliness_prevalence": "Social Isolation",
    "emotional_support_prevalence": "Lack Emot. Support",
    "food_insecurity_prevalence": "Food Insecurity",
    "food_stamp_prevalence": "Food Stamps",
    "housing_insecurity_prevalence": "Housing Insecurity",
    "utility_shutoff_prevalence": "Utility Threat",
    "lack_transportation_prevalence": "Transport Barriers",
    "total_population_sum": "Population",
    "average_household_size": "Household Size",
    "average_family_size": "Family Size",
    "pct_speak_english_less_than_very_well": "Limited English",
    "pct_households_1plus_people_65plus": "HH w/ Seniors",
    "households_with_broadband_sum": "Broadband HH"
};

const metricsList = Object.keys(metricLabels);

// =========================================
// DATA HANDLING
// =========================================

let countyData = [];
let root, chart, polygonSeries;

async function loadAndMergeData() {
    try {
        const [acsRes, placesRes] = await Promise.all([
            fetch("data/ACS Data/county_acs_flat.json"),
            fetch("data/PLACES Data/county_places_flat.json")
        ]);
        const acsData = await acsRes.json();
        const placesData = await placesRes.json();

        const placesLookup = {};
        placesData.forEach(d => {
            if (d.state_abbr && d.name) {
                const norm = normalizeName(d.name);
                placesLookup[d.state_abbr.toUpperCase() + "_" + norm] = d;
            } else if (d.id) {
                placesLookup[d.id] = d;
            }
        });

        return acsData.map(acs => {
            let places = {};
            if (acs.state_abbr && acs.name) {
                const norm = normalizeName(acs.name);
                places = placesLookup[acs.state_abbr.toUpperCase() + "_" + norm] || placesLookup[acs.id] || {};
            } else {
                places = placesLookup[acs.id] || {};
            }
            return { ...acs, ...places };
        });
    } catch (e) {
        console.error("Data load failed:", e);
        return [];
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

// =========================================
// INITIALIZATION
// =========================================

async function init() {
    showLoading(true);
    countyData = await loadAndMergeData();
    console.log("Data merged:", countyData.length, "counties");
    
    populateSelectors();
    initMap();
    initModal();
    renderBivariate();
    renderLegend();
    updateModalContent();
    showLoading(false);
}

function initModal() {
    const infoBtn = document.getElementById("infoBtn");
    const modal = document.getElementById("infoModal");
    const closeBtns = document.querySelectorAll(".close-modal");

    if (infoBtn && modal) {
        infoBtn.addEventListener("click", () => {
            modal.classList.add("active");
        });
    }

    closeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            modal.classList.remove("active");
        });
    });

    // Close on click outside
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.remove("active");
        }
    });
}

function showLoading(show) {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.classList.toggle("active", show);
}

function populateSelectors() {
    const selX = document.getElementById("metricX");
    const selY = document.getElementById("metricY");
    
    metricsList.forEach(m => {
        selX.add(new Option(metricLabels[m], m));
        selY.add(new Option(metricLabels[m], m));
    });

    selX.value = "pct_unemployment_rate";
    selY.value = "obesity_prevalence";

    selX.addEventListener("change", renderBivariate);
    selY.addEventListener("change", renderBivariate);

    const selScheme = document.getElementById("colorScheme");
    if (selScheme) {
        Object.keys(colorSchemes).forEach(s => {
            const label = s.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
            selScheme.add(new Option(label, s));
        });

        selScheme.addEventListener("change", () => {
            bivariateColors = colorSchemes[selScheme.value];
            renderBivariate();
            renderLegend();
            updateModalContent();
        });
    }
}

// =========================================
// MAP (amCharts 5)
// =========================================

function initMap() {
    root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    chart = root.container.children.push(am5map.MapChart.new(root, {
        panX: "rotateX",
        panY: "none",
        projection: am5map.geoAlbersUsa()
    }));

    polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
        geoJSON: am5geodata_region_usa_usaCountiesLow,
        calculateAggregates: true
    }));

    polygonSeries.mapPolygons.template.setAll({
        tooltipText: "{name}, {state}: {labelX}: {valueX}% | {labelY}: {valueY}%",
        strokeWidth: 0.1,
        stroke: am5.color(0xffffff)
    });

    polygonSeries.mapPolygons.template.adapters.add("fill", (fill, target) => {
        if (target.dataItem && target.dataItem.dataContext) {
            return target.dataItem.dataContext.fill;
        }
        return fill;
    });

    polygonSeries.mapPolygons.template.states.create("hover", {
        strokeWidth: 1,
        stroke: am5.color(0x000000)
    });
}

// =========================================
// BIVARIATE LOGIC
// =========================================

function getTertiles(values) {
    const sorted = values.filter(v => typeof v === "number" && !isNaN(v)).sort((a,b) => a-b);
    if (sorted.length === 0) return [0, 0];
    const n = sorted.length;
    return [
        sorted[Math.floor(n / 3)],
        sorted[Math.floor(2 * n / 3)]
    ];
}

function getClass(val, tertiles) {
    if (val <= tertiles[0]) return 0;
    if (val <= tertiles[1]) return 1;
    return 2;
}

function renderBivariate() {
    if (!polygonSeries) return;
    
    const mX = document.getElementById("metricX").value;
    const mY = document.getElementById("metricY").value;
    
    document.getElementById("labelX").textContent = metricLabels[mX];
    document.getElementById("labelY").textContent = metricLabels[mY];

    const valsX = countyData.map(d => d[mX]).filter(v => typeof v === "number" && !isNaN(v));
    const valsY = countyData.map(d => d[mY]).filter(v => typeof v === "number" && !isNaN(v));
    
    const tertX = getTertiles(valsX);
    const tertY = getTertiles(valsY);

    // Build lookup
    const lookup = {};
    countyData.forEach(d => {
        if (d.state_abbr && d.name) {
            const norm = normalizeName(d.name);
            lookup[d.state_abbr.toUpperCase() + "_" + norm] = d;
        }
    });

    const mapData = am5geodata_region_usa_usaCountiesLow.features.map(f => {
        const pId = f.id;
        const name = f.properties.name;
        
        let stateAbbr = "";
        if (f.properties && f.properties.STATE) {
            stateAbbr = f.properties.STATE;
        } else {
            const parts = pId.split("-");
            if (parts.length >= 3) stateAbbr = parts[1];
        }

        const norm = normalizeName(name);
        const d = lookup[stateAbbr.toUpperCase() + "_" + norm];

        let color = "#b0b0b0"; // Default: Medium Grey for Missing Data
        let valX = "N/A", valY = "N/A";

        if (d && typeof d[mX] === "number" && typeof d[mY] === "number") {
            const cX = getClass(d[mX], tertX);
            const cY = getClass(d[mY], tertY);
            color = bivariateColors[cY][cX];
            valX = d[mX].toFixed(1);
            valY = d[mY].toFixed(1);
        }

        return {
            id: pId,
            name: name,
            state: stateAbbr,
            fill: am5.color(color),
            valueX: valX,
            valueY: valY,
            labelX: metricLabels[mX].toUpperCase(),
            labelY: metricLabels[mY].toUpperCase()
        };
    });

    polygonSeries.data.setAll(mapData);
}

function renderLegend() {
    const legend = document.getElementById("bivariateLegend");
    legend.innerHTML = "";
    // Top-to-bottom: Y=2, Y=1, Y=0
    for (let y = 2; y >= 0; y--) {
        for (let x = 0; x < 3; x++) {
            const cell = document.createElement("div");
            cell.className = "legend-cell";
            cell.style.backgroundColor = bivariateColors[y][x];
            legend.appendChild(cell);
        }
    }
}

/**
 * Update the info modal to reflect the current color scheme
 */
function updateModalContent() {
    const container = document.getElementById("modalColorInterpret");
    if (!container) return;

    // Corner colors for the 3x3 grid
    const corners = [
        { title: "Lowest Shared Values", color: bivariateColors[0][0], desc: "Low Metric X & Low Metric Y" },
        { title: "Highest Shared Values", color: bivariateColors[2][2], desc: "High Metric X & High Metric Y" },
        { title: "High Y, Low X", color: bivariateColors[2][0], desc: "The metric increasing vertically." },
        { title: "Low Y, High X", color: bivariateColors[0][2], desc: "The metric increasing horizontally." }
    ];

    let html = '';
    corners.forEach(corner => {
        html += `
            <div class="modal-interpret-item">
                <div class="modal-swatch" style="background-color: ${corner.color}"></div>
                <div class="modal-interpret-text">
                    <strong>${corner.title} <span class="modal-hex">${corner.color}</span></strong>
                    ${corner.desc}
                </div>
            </div>
        `;
    });

    // Add Missing Data static entry
    html += `
        <div class="modal-interpret-item">
            <div class="modal-swatch" style="background-color: #b0b0b0"></div>
            <div class="modal-interpret-text">
                <strong>Missing Data <span class="modal-hex">#B0B0B0</span></strong>
                Data not available for this county.
            </div>
        </div>
    `;

    container.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", init);
