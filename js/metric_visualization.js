/**
 * Metric Visualization Script
 * Renders a grid of cards grouped by Category with Distribution Curves or Boxplots.
 */

// Global State
let allCountyData = [];
let allStateData = [];
let viewMode = 'distribution'; // 'distribution' or 'boxplot'
let compareList = []; // Tracks metrics for correlation
let activeInfoMetric = null; // Tracks current metric highlighted in sidebar

// --- Metric DNA Global State ---
let dnaAnchorMins = {};
let dnaAnchorMaxes = {};
let selectedDnaMetrics = [
    'pct_unemployment_rate',
    'pct_graduate_professional_degree',
    'obesity_prevalence',
    'depression_prevalence',
    'checkup_prevalence',
    'food_insecurity_prevalence'
];
let activeDnaCounty = null;

const higherIsBetter = {
    "pct_in_labor_force": true,
    "pct_natural_resources_construction": true,
    "pct_graduate_professional_degree": true,
    "checkup_prevalence": true,
    "cholesterol_screening_prevalence": true,
    "bp_medication_prevalence": true,
    "total_population_sum": true,
    "households_with_broadband_sum": true,
    "average_household_size": true,
    "average_family_size": true,
    "pct_households_1plus_people_65plus": true
};

const stateFips = {
    "AL": "01", "AK": "02", "AZ": "04", "AR": "05", "CA": "06", "CO": "08", "CT": "09", "DE": "10", "FL": "12", "GA": "13",
    "HI": "15", "ID": "16", "IL": "17", "IN": "18", "IA": "19", "KS": "20", "KY": "21", "LA": "22", "ME": "23", "MD": "24",
    "MA": "25", "MI": "26", "MN": "27", "MS": "28", "MO": "29", "MT": "30", "NE": "31", "NV": "32", "NH": "33", "NJ": "34",
    "NM": "35", "NY": "36", "NC": "37", "ND": "38", "OH": "39", "OK": "40", "OR": "41", "PA": "42", "RI": "44", "SC": "45",
    "SD": "46", "TN": "47", "TX": "48", "UT": "49", "VT": "50", "VA": "51", "WA": "53", "WV": "54", "WI": "55", "WY": "56"
};

function formatValue(val, metric) {
    if (val === undefined || val === null) return "N/A";
    if (metric === "total_population_sum" || metric === "households_with_broadband_sum") {
        return d3.format(",.0f")(val);
    }
    if (metric === "average_household_size" || metric === "average_family_size") {
        return d3.format(".1f")(val);
    }
    return d3.format(".1f")(val) + "%";
}

// Robust normalization for county join
function normalizeCountyName(name) {
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
        .replace(/[^a-z0-9]/g, "")
        .trim();
}

// Global Filters
let activeFilters = {
    region: 'All',
    state: 'All',
    metro: 'All',
    search: ''
};

const regionMapping = {
    "Northeast": ["CT", "ME", "MA", "NH", "RI", "VT", "NJ", "NY", "PA"],
    "Midwest": ["IL", "IN", "IA", "KS", "MI", "MN", "MO", "NE", "ND", "OH", "SD", "WI"],
    "South": ["AL", "AR", "DE", "DC", "FL", "GA", "KY", "LA", "MD", "MS", "NC", "OK", "SC", "TN", "TX", "VA", "WV"],
    "West": ["AK", "AZ", "CA", "CO", "HI", "ID", "MT", "NV", "NM", "OR", "UT", "WA", "WY"]
};

const groupedMetrics = [
    {
        category: "Economic Factors",
        metrics: ["pct_unemployment_rate", "pct_in_labor_force", "pct_natural_resources_construction"]
    },
    {
        category: "Education",
        metrics: ["pct_graduate_professional_degree"]
    },
    {
        category: "Health Outcomes",
        metrics: [
            "depression_prevalence", "obesity_prevalence", "diabetes_prevalence",
            "arthritis_prevalence", "asthma_prevalence", "high_blood_pressure_prevalence",
            "high_cholesterol_prevalence", "coronary_heart_disease_prevalence",
            "stroke_prevalence", "cancer_prevalence", "copd_prevalence"
        ]
    },
    {
        category: "Health Status",
        metrics: ["mental_health_issues_prevalence", "physical_health_issues_prevalence", "general_health_prevalence"]
    },
    {
        category: "Health Risk Behaviors",
        metrics: ["smoking_prevalence", "binge_drinking_prevalence", "physical_inactivity_prevalence"]
    },
    {
        category: "Prevention",
        metrics: ["checkup_prevalence", "cholesterol_screening_prevalence", "bp_medication_prevalence", "access2_prevalence"]
    },
    {
        category: "Disability",
        metrics: [
            "disability_prevalence", "cognitive_difficulties_prevalence", "mobility_difficulty_prevalence",
            "hearing_disability_prevalence", "vision_difficulty_prevalence", "self_care_difficulty_prevalence",
            "independent_living_difficulty_prevalence"
        ]
    },
    {
        category: "Social Needs",
        metrics: [
            "loneliness_prevalence", "emotional_support_prevalence", "food_insecurity_prevalence",
            "food_stamp_prevalence", "housing_insecurity_prevalence", "utility_shutoff_prevalence",
            "lack_transportation_prevalence"
        ]
    },
    {
        category: "Demographics & Housing",
        metrics: [
            "total_population_sum", "average_household_size", "average_family_size",
            "pct_speak_english_less_than_very_well", "pct_households_1plus_people_65plus",
            "households_with_broadband_sum"
        ]
    }
];

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
    "cognitive_difficulties_prevalence": "Cognitive Disability",
    "mobility_difficulty_prevalence": "Mobility Disability",
    "hearing_disability_prevalence": "Hearing Disability",
    "vision_difficulty_prevalence": "Vision Disability",
    "self_care_difficulty_prevalence": "Self-Care Disability",
    "independent_living_difficulty_prevalence": "Independent Living",
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

const metricIcons = {
    "pct_unemployment_rate": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h20"/><path d="M12 20v-5"/><path d="M6 20v-3"/><path d="M18 20v-7"/><path d="M4 4h16v8H4z"/></svg>',
    "pct_in_labor_force": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    "pct_natural_resources_construction": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3 13.3 7.7"/><path d="M12 2a10 10 0 1 0 10 10"/><path d="M15.4 9.1a4.5 4.5 0 1 1-6.3-6.3"/><path d="M9.1 15.4a4.5 4.5 0 1 1 6.3 6.3"/><path d="M9.3 14.7l1.4-1.4"/><path d="M6.3 14.7l1.4-1.4"/><path d="M14.7 9.3l1.4-1.4"/></svg>',
    "pct_graduate_professional_degree": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6"/><path d="m2 10 10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
    "depression_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
    "obesity_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    "diabetes_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>',
    "arthritis_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>',
    "asthma_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5H9a2 2 0 0 0-2 2v3"/><path d="M2 14h20"/><path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/></svg>',
    "high_blood_pressure_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
    "high_cholesterol_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 1 0 2.829 2.828z"/></svg>',
    "coronary_heart_disease_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M8 8.5c0-.82.17-1.55.5-2.2"/></svg>',
    "stroke_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="M16 12h-4l-1.5-1.5.5-2.5"/></svg>',
    "cancer_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/><path d="m8 10 4 4"/></svg>',
    "copd_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20a1.8 1.8 0 0 0 3-1.4V10c0-1.7 1.3-3 3-3a3 3 0 0 1 3 3v2M13 20a1.8 1.8 0 0 1-3-1.4V5a3 3 0 0 0-6 0v11"/></svg>',
    "mental_health_issues_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 15h8"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg>',
    "physical_health_issues_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 1-1-1.5-1.5-1 1a2.121 2.121 0 1 1-3-3l1-1 1.5 1.5 1-1-1.5-1.5-1 1"/><path d="m13.5 3.5-1 1 1.5 1.5 1-1a2.121 2.121 0 1 1 3 3l-1 1-1.5-1.5-1 1 1.5 1.5 1-1"/></svg>',
    "general_health_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 16v-2a4 4 0 0 0-8 0v2"/><circle cx="12" cy="7" r="4"/></svg>',
    "smoking_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 16h3"/><path d="M18 20h3"/><path d="M18 12h3"/><path d="M2 16h12a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H2Z"/></svg>',
    "binge_drinking_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18"/><path d="M5.5 3v8.5a6.5 6.5 0 0 0 13 0V3"/><path d="M12 18v3"/><path d="M9.5 21h5"/></svg>',
    "physical_inactivity_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a4 4 0 0 0 7.33 2.33"/><path d="M20 18a4 4 0 1 1-5.33-4.33"/><path d="M6 13a4 4 0 0 1-2.33-7.33"/><path d="M9.33 4A4 4 0 1 0 14 9"/><circle cx="12" cy="12" r="2"/></svg>',
    "checkup_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>',
    "cholesterol_screening_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>',
    "bp_medication_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 1-1-1.5-1.5-1 1a2.121 2.121 0 1 1-3-3l1-1 1.5 1.5 1-1-1.5-1.5-1 1"/><path d="m13.5 3.5-1 1 1.5 1.5 1-1a2.121 2.121 0 1 1 3 3l-1 1-1.5-1.5-1 1 1.5 1.5 1-1"/></svg>',
    "access2_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h10"/><path d="M9 4v16"/><path d="M15 12h7"/><path d="M18 9v6"/></svg>',
    "disability_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>',
    "cognitive_difficulties_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    "mobility_difficulty_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="6" r="2"/><path d="M5 21v-4L3 13.5"/><path d="M18.8 8A10 10 0 0 1 14 18v3"/><path d="M8 11h6l3.8 2"/><path d="M8 17v-6L6 9l-4-1"/></svg>',
    "hearing_disability_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.8 19c1.9-1.9 3.2-4.5 3.2-7.5C22 5.2 16.8 0 10.5 0 4.3 0-1 4.5-1 10.8c0 3 .8 5.7 2.2 7.7L0 23h20M9 8c0-1.7 1.3-3 3-3s3 1.3 3 3-1.8 2.5-3 5-1.5 5.5-1.5 5.5V19h3"/></svg>',
    "vision_difficulty_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    "self_care_difficulty_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>',
    "independent_living_difficulty_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 9h6v6H9z"/></svg>',
    "loneliness_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
    "emotional_support_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>',
    "food_insecurity_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    "food_stamp_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    "housing_insecurity_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="m15 15-3-3-3 3"/></svg>',
    "utility_shutoff_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
    "lack_transportation_prevalence": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>',
    "total_population_sum": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    "average_household_size": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    "average_family_size": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    "pct_speak_english_less_than_very_well": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>',
    "pct_households_1plus_people_65plus": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
    "households_with_broadband_sum": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>',
    "default": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
};

// (Removed duplicate init function, logic moved to definition at line 713)

async function loadData() {
    // Retry logic for geodata script if it loads slowly on external hosting
    let geoJSONSource = window.am5geodata_region_usa_usaCountiesLow || window.am5geodata_usaCountiesLow;
    let attempts = 0;
    while (!geoJSONSource && attempts < 25) {
        await new Promise(r => setTimeout(r, 200));
        geoJSONSource = window.am5geodata_region_usa_usaCountiesLow || window.am5geodata_usaCountiesLow;
        attempts++;
    }

    const [acsRes, placesRes, acsCountyRes, placesCountyRes, ruccRes] = await Promise.all([
        fetch("data/ACS%20Data/state_acs_flat.json"),
        fetch("data/PLACES%20Data/state_places_flat.json"),
        fetch("data/ACS%20Data/county_acs_flat.json"),
        fetch("data/PLACES%20Data/county_places_flat.json"),
        fetch("data/Rural_Urban_Comparison/county_rucc.json")
    ]);

    const [acsData, placesData, acsCountyData, placesCountyData, ruccData] = await Promise.all([
        acsRes.json(),
        placesRes.json(),
        acsCountyRes.json(),
        placesCountyRes.json(),
        ruccRes.json()
    ]);

    // Robust normalization used to be here, now global

    const placesLookup = {};
    placesData.forEach(d => { placesLookup[d.id] = d; });

    const placesCountyLookup = {};
    placesCountyData.forEach(d => {
        if (d.state_abbr && d.name) {
            const normName = normalizeCountyName(d.name);
            const key = (d.state_abbr + "_" + normName).toUpperCase();
            placesCountyLookup[key] = d;
        }
        if (d.id) placesCountyLookup[d.id] = d;
    });

    const nameToFips = {};
    if (geoJSONSource && geoJSONSource.features) {
        geoJSONSource.features.forEach(f => {
            const state = (f.properties.STATE || "").toUpperCase();
            const norm = normalizeCountyName(f.properties.name);
            const key = (state + "_" + norm).toUpperCase();
            let fId = f.id || f.properties.id;
            if (fId && fId.includes("-")) fId = fId.split("-").pop();
            nameToFips[key] = fId;
        });
    }

    const stateData = acsData.map(acs => {
        const places = placesLookup[acs.id] || {};
        const merged = { ...acs, ...places };
        // Unified keys for state data
        if (merged.total_population !== undefined && merged.total_population_sum === undefined) merged.total_population_sum = merged.total_population;
        if (merged.households_with_broadband !== undefined && merged.households_with_broadband_sum === undefined) merged.households_with_broadband_sum = merged.households_with_broadband;
        return merged;
    });

    const countyData = acsCountyData.map(acs => {
        const stateStr = (acs.state_abbr || "").toUpperCase();
        const normName = normalizeCountyName(acs.name);
        const lookupKey = (stateStr + "_" + normName).toUpperCase();
        const places = placesCountyLookup[lookupKey] || placesCountyLookup[acs.id] || {};

        // Find FIPS for RUCC lookup
        const fips = nameToFips[lookupKey] || (acs.fips) || (places.fips);
        const rucc = ruccData[fips] || {};

        const merged = { ...acs, ...places, ...rucc, fips: fips };
        // UNIFY KEYS: County data uses 'total_population', but state data and metric labels use 'total_population_sum'
        if (merged.total_population !== undefined) merged.total_population_sum = merged.total_population;
        if (merged.households_with_broadband !== undefined) merged.households_with_broadband_sum = merged.households_with_broadband;

        // Assign Region
        merged.region = "Other";
        for (const [rName, states] of Object.entries(regionMapping)) {
            if (states.includes(stateStr)) {
                merged.region = rName;
                break;
            }
        }

        return merged;
    });

    return { stateData, countyData };
}

function getFilteredData() {
    return allCountyData.filter(d => {
        // Region Filter
        if (activeFilters.region !== 'All' && d.region !== activeFilters.region) return false;

        // State Filter
        if (activeFilters.state !== 'All' && d.state_name !== activeFilters.state) return false;

        // Metro Filter
        if (activeFilters.metro !== 'All' && d.classification !== activeFilters.metro) return false;

        return true;
    });
}

function updateFilters(type, value) {
    activeFilters[type] = value;

    // If region changed, reset state filter to 'All'
    if (type === 'region') {
        const stateSelect = document.getElementById('stateFilter');
        stateSelect.value = 'All';
        activeFilters.state = 'All';
        populateStateDropdown();
    }

    refreshAllVisualizations();
}

function refreshAllVisualizations() {
    renderGroupedGrid();

    // Update correlation overlay if active
    if (compareList.length >= 2) {
        runCorrelation();
    }
}

function populateStateDropdown() {
    const stateSelect = document.getElementById('stateFilter');
    const currentState = stateSelect.value;

    let states = [...new Set(allCountyData.map(d => d.state_name))].sort();

    // If region filter is active, only show states in that region
    if (activeFilters.region !== 'All') {
        const allowedAbbrs = regionMapping[activeFilters.region];
        states = [...new Set(allCountyData
            .filter(d => allowedAbbrs.includes(d.state_abbr))
            .map(d => d.state_name))].sort();
    }

    const options = ['<option value="All">All States</option>'];
    states.forEach(s => {
        if (s) options.push(`<option value="${s}">${s}</option>`);
    });

    stateSelect.innerHTML = options.join('');
    stateSelect.value = states.includes(currentState) ? currentState : 'All';
}

function renderGroupedGrid() {
    const content = document.getElementById('metric-viz-content');
    content.innerHTML = '';

    groupedMetrics.forEach((group, gIndex) => {
        const section = document.createElement('div');
        section.className = 'category-section';
        section.id = `section-${group.category.replace(/\s+/g, '-').toLowerCase()}`;

        section.innerHTML = `
            <div class="category-header">
                <h2>${group.category}</h2>
            </div>
            <div class="category-grid" id="grid-${gIndex}"></div>
        `;

        content.appendChild(section);
        const grid = section.querySelector('.category-grid');

        let cardsRendered = 0;
        const filteredData = getFilteredData();

        const isFilteredView = activeFilters.region !== 'All' || activeFilters.state !== 'All' || activeFilters.metro !== 'All';
        const filterLabel = activeFilters.region !== 'All' ? activeFilters.region :
            (activeFilters.state !== 'All' ? activeFilters.state :
                (activeFilters.metro !== 'All' ? activeFilters.metro : 'National'));

        group.metrics.forEach((metric, mIndex) => {
            const values = filteredData.map(c => c[metric]).filter(v => typeof v === 'number' && v !== 0);
            if (values.length === 0) return;

            const label = metricLabels[metric] || metric;
            const searchTerm = activeFilters.search.toLowerCase();
            if (searchTerm && !label.toLowerCase().includes(searchTerm)) return;

            cardsRendered++;
            const card = document.createElement('div');
            card.className = 'metric-viz-card';
            card.id = `card-${metric}`;
            card.setAttribute('data-metric', metric);

            const icon = metricIcons[metric] || metricIcons.default;

            card.innerHTML = `
                <div class="card-header">
                    <div class="card-icon">${icon}</div>
                    <div class="card-title-group">
                        <h3 class="card-title">${label}</h3>
                        <span class="card-meta">${isFilteredView ? filterLabel + ' vs. National' : 'National Distribution'}</span>
                    </div>
                    <div class="card-actions">
                        <button class="info-btn" onclick="toggleInfo('${metric}')" title="Top / Bottom 5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        </button>
                        <button class="compare-btn" onclick="toggleCompare('${metric}')" title="Compare Metric">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M21 16v5h-5"/><path d="M3 21h5v-5"/><path d="m15 15 6 6"/><path d="m9 9-6-6"/><path d="m3 21 6-6"/><path d="m21 3-6 6"/></svg>
                        </button>
                    </div>
                </div>
                <div class="card-viz-container" id="viz-${metric}"></div>
            `;

            grid.appendChild(card);

            // Staggered render for performance
            if (activeInfoMetric === metric) {
                setTimeout(() => toggleInfo(metric, true), 150 + (gIndex * 100) + (mIndex * 30));
            } else {
                setTimeout(() => renderPlot(metric, values), 100 + (gIndex * 100) + (mIndex * 30));
            }
        });

        // Hide section if empty
        if (cardsRendered === 0) {
            section.style.display = 'none';
        }
    });
}

function renderPlot(metric, values, highlights = []) {
    const container = document.getElementById(`viz-${metric}`);
    if (!container) return;

    // Get National values for Benchmark
    const nationalValues = allCountyData.map(c => c[metric]).filter(v => typeof v === 'number' && v !== 0);
    const isFiltered = activeFilters.region !== 'All' || activeFilters.state !== 'All' || activeFilters.metro !== 'All';

    const width = container.offsetWidth;
    const height = 150;
    const margin = { top: 15, right: 10, bottom: 25, left: 10 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    let svg = d3.select(container).select('svg');

    // Create SVG and layers if they don't exist
    if (svg.empty()) {
        svg = d3.select(container)
            .append('svg')
            .attr('width', '100%')
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        g.append('g').attr('class', 'national-layer');
        g.append('g').attr('class', 'dist-layer');
        g.append('g').attr('class', 'boxplot-layer').style('opacity', 0);
        g.append('g').attr('class', 'highlight-layer');
        g.append('g').attr('class', 'axis-layer')
            .attr('transform', `translate(0,${chartHeight})`);
    }

    // Always use National Domain for stable comparison
    const x = d3.scaleLinear()
        .domain(d3.extent(nationalValues))
        .range([0, chartWidth]);

    const nationalLayer = svg.select('.national-layer');
    const distLayer = svg.select('.dist-layer');
    const boxplotLayer = svg.select('.boxplot-layer');
    const highlightLayer = svg.select('.highlight-layer');
    const axisLayer = svg.select('.axis-layer');

    // 1. Update Axis
    axisLayer.transition().duration(600)
        .call(d3.axisBottom(x).ticks(5).tickSizeOuter(0));

    // 2. Prepare National Benchmark (Ghost Curve)
    const nationalHistogram = d3.bin()
        .domain(x.domain())
        .thresholds(x.ticks(40))(nationalValues);

    const nationalY = d3.scaleLinear()
        .domain([0, d3.max(nationalHistogram, d => d.length)])
        .range([chartHeight, 0]);

    const nationalArea = d3.area()
        .x(d => x(d.x0))
        .y0(chartHeight)
        .y1(d => nationalY(d.length))
        .curve(d3.curveBasis);

    let nationalPath = nationalLayer.select('path.benchmark-path');
    if (nationalPath.empty()) {
        nationalPath = nationalLayer.append('path')
            .attr('class', 'benchmark-path')
            .attr('fill', '#e5e7eb')
            .attr('fill-opacity', 0.4)
            .attr('stroke', '#9ca3af')
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '4,2');
    }

    nationalPath.datum(nationalHistogram)
        .transition().duration(600)
        .attr('d', nationalArea);

    // 3. Prepare Distribution (KDE-like Histogram)
    const histogram = d3.bin()
        .domain(x.domain())
        .thresholds(x.ticks(40))(values);

    const activeY = d3.scaleLinear()
        .domain([0, d3.max(isFiltered ? histogram : nationalHistogram, d => d.length)])
        .range([chartHeight, 0]);

    const area = d3.area()
        .x(d => x(d.x0))
        .y0(chartHeight)
        .y1(d => activeY(d.length))
        .curve(d3.curveBasis);

    let path = distLayer.select('path.viz-path');
    if (path.empty()) {
        const defs = svg.select('defs').empty() ? svg.append('defs') : svg.select('defs');
        if (defs.select(`#card-gradient-${metric}`).empty()) {
            const gradient = defs.append("linearGradient")
                .attr("id", "card-gradient-" + metric)
                .attr("x1", "0%").attr("y1", "0%")
                .attr("x2", "0%").attr("y2", "100%");
            gradient.append("stop").attr("offset", "0%").attr("stop-color", "#c83830").attr("stop-opacity", 0.4);
            gradient.append("stop").attr("offset", "100%").attr("stop-color", "#c83830").attr("stop-opacity", 0.05);
        }
        path = distLayer.append('path')
            .attr('class', 'viz-path')
            .attr('fill', `url(#card-gradient-${metric})`)
            .attr('stroke', '#c83830')
            .attr('stroke-width', 2);
    }

    path.datum(histogram)
        .transition().duration(600)
        .attr('d', area);

    // 3. Prepare Boxplot
    const sorted = [...values].sort(d3.ascending);
    const q1 = d3.quantile(sorted, 0.25);
    const median = d3.quantile(sorted, 0.5);
    const q3 = d3.quantile(sorted, 0.75);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const boxHeight = 40;
    const yCenter = chartHeight / 2;

    let bLine = boxplotLayer.select('.boxplot-line');
    if (bLine.empty()) bLine = boxplotLayer.append('line').attr('class', 'boxplot-line');
    bLine.transition().duration(600)
        .attr('x1', x(min)).attr('x2', x(max))
        .attr('y1', yCenter).attr('y2', yCenter);

    let bRect = boxplotLayer.select('.boxplot-rect');
    if (bRect.empty()) bRect = boxplotLayer.append('rect').attr('class', 'boxplot-rect').attr('rx', 4);
    bRect.transition().duration(600)
        .attr('x', x(q1)).attr('y', yCenter - boxHeight / 2)
        .attr('width', x(q3) - x(q1)).attr('height', boxHeight);

    let bMedian = boxplotLayer.select('.boxplot-median');
    if (bMedian.empty()) bMedian = boxplotLayer.append('line').attr('class', 'boxplot-median');
    bMedian.transition().duration(600)
        .attr('x1', x(median)).attr('x2', x(median))
        .attr('y1', yCenter - boxHeight / 2).attr('y2', yCenter + boxHeight / 2);

    // 4. Highlights (Top/Bottom Markers)
    const lines = highlightLayer.selectAll('.highlight-line')
        .data(highlights, d => d.id);
    lines.exit().remove();
    lines.enter().append('line').attr('class', 'highlight-line')
        .merge(lines)
        .attr('stroke-dasharray', '3,3')
        .attr('stroke-width', 1.5)
        .attr('stroke', d => d.isCritical ? '#dc2626' : '#059669')
        .transition().duration(400)
        .attr('x1', d => x(d.value)).attr('x2', d => x(d.value))
        .attr('y1', 0).attr('y2', chartHeight);

    const dots = highlightLayer.selectAll('.highlight-dot')
        .data(highlights, d => d.id);
    dots.exit().remove();
    dots.enter().append('circle').attr('class', 'highlight-dot')
        .merge(dots)
        .attr('r', 3)
        .attr('fill', d => d.isCritical ? '#dc2626' : '#059669')
        .transition().duration(400)
        .attr('cx', d => x(d.value)).attr('cy', chartHeight);

    // 5. ANIMATE TRANSITION (Morph Technique)
    if (viewMode === 'distribution') {
        distLayer.transition().duration(600)
            .style('opacity', 1)
            .attr('transform', 'translate(0,0)');

        boxplotLayer.transition().duration(600)
            .style('opacity', 0)
            .attr('transform', 'translate(0,20)');

        nationalLayer.transition().duration(600)
            .style('opacity', isFiltered ? 1 : 0);

        highlightLayer.transition().duration(600).style('opacity', 1);
    } else {
        distLayer.transition().duration(600)
            .style('opacity', 0)
            .attr('transform', 'translate(0,-20)');

        nationalLayer.transition().duration(600)
            .style('opacity', 0);

        boxplotLayer.transition().duration(600)
            .style('opacity', 1)
            .attr('transform', 'translate(0,0)');

        highlightLayer.transition().duration(600).style('opacity', 0);
    }
}

function setViewMode(mode) {
    viewMode = mode;
    document.getElementById('toggle-dist').classList.toggle('active', mode === 'distribution');
    document.getElementById('toggle-box').classList.toggle('active', mode === 'boxplot');

    // Efficiently update all plots
    const filteredData = getFilteredData();
    groupedMetrics.forEach(group => {
        group.metrics.forEach(metric => {
            const values = filteredData.map(c => c[metric]).filter(v => typeof v === 'number' && v !== 0);
            if (values.length > 0) {
                const label = metricLabels[metric] || metric;
                const searchTerm = activeFilters.search.toLowerCase();
                if (!searchTerm || label.toLowerCase().includes(searchTerm)) {
                    renderPlot(metric, values);
                }
            }
        });
    });

    // Update correlation overlay if active
    if (compareList.length >= 2) {
        runCorrelation();
    }
}

// --- Initialization ---
async function init() {
    try {
        const data = await loadData();
        allCountyData = data.countyData;
        allStateData = data.stateData;

        populateStateDropdown();
        renderGroupedGrid();
    } catch (e) {
        console.error("Initialization failed", e);
    }
}

init();

// --- Metric Correlation Logic ---

function toggleInfo(metric, isUpdate = false) {
    const card = document.getElementById(`card-${metric}`);
    const sidebarContent = document.getElementById('sidebar-content');
    if (!sidebarContent) return;

    const filteredData = getFilteredData();
    const values = filteredData.map(c => c[metric]).filter(v => typeof v === 'number' && v !== 0);

    if (!isUpdate) {
        if (activeInfoMetric === metric) {
            // Already active, just close it
            card.classList.remove('show-info');
            activeInfoMetric = null;
            sidebarContent.innerHTML = `
                <div class="sidebar-empty-state">
                    <div class="empty-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity="0.3"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                    </div>
                    <p>Click the <b>"i"</b> icon on any metric card to reveal the Top 5 and Bottom 5 counties for your current selected region.</p>
                </div>
            `;
            const rightSidebarDynamic = document.getElementById('right-sidebar-dynamic-content');
            if (rightSidebarDynamic) {
                rightSidebarDynamic.innerHTML = `
                    <div class="sidebar-empty-state">
                        <div class="empty-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity="0.3">
                                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                                <line x1="8" y1="2" x2="8" y2="18"></line>
                                <line x1="16" y1="6" x2="16" y2="22"></line>
                            </svg>
                        </div>
                        <p>Select a metric to visualize geographic clustering and spatial outliers across the nation.</p>
                    </div>
                `;
            }
            const compCardContainer = document.getElementById('comparison-card-container');
            if (compCardContainer) compCardContainer.innerHTML = '';

            // Re-render without highlights
            renderPlot(metric, values);
            return;
        } else {
            // Un-highlight previous
            if (activeInfoMetric && activeInfoMetric !== metric) {
                const prevMetric = activeInfoMetric;
                const prevCard = document.getElementById(`card-${prevMetric}`);
                if (prevCard) {
                    prevCard.classList.remove('show-info');
                    // Reset previous visualization to normal (clear highlights)
                    const prevValues = filteredData.map(c => c[prevMetric]).filter(v => typeof v === 'number' && v !== 0);
                    renderPlot(prevMetric, prevValues, []);
                }
            }
            card.classList.add('show-info');
            activeInfoMetric = metric;
        }
    } else {
        card.classList.add('show-info');
        activeInfoMetric = metric;
    }

    // Find top and bottom 5 in filtered set
    const validData = [...filteredData].filter(c => typeof c[metric] === 'number' && c[metric] !== 0);
    validData.sort((a, b) => b[metric] - a[metric]);

    if (validData.length === 0) return;

    const top5 = validData.slice(0, 5);
    const bottom5 = validData.slice(-5).reverse();
    const isHigherBetter = higherIsBetter[metric] || false;
    const successes = isHigherBetter ? top5 : bottom5;
    const criticals = isHigherBetter ? bottom5 : top5;
    const label = metricLabels[metric] || metric;

    // --- Data Snapshot Calculation ---
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const sortedValues = [...values].sort((a, b) => a - b);
    const median = sortedValues.length % 2 !== 0
        ? sortedValues[Math.floor(sortedValues.length / 2)]
        : (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2;
    const stdDev = Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / values.length);

    sidebarContent.innerHTML = `
        <div class="sidebar-section active-metric-header">
            <h2 style="font-size: 1.3rem; margin: 0; color: var(--text-dark); border: none;">${label}</h2>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin: 5px 0 0 0;">Geographic Rankings and positive outliers</p>
        </div>

        <!-- Left Sidebar: Stats & List only -->

        <!-- Data Snapshot Card -->
        <div class="stats-snapshot-card">
            <div class="snapshot-header">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17l-6-6-3 3-4-4"/></svg>
                <span>DATA SNAPSHOT</span>
            </div>
            <div class="stat-grid">
                <div class="stat-item">
                    <span class="stat-label">MEAN</span>
                    <span class="stat-value">${formatValue(mean, metric)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">MEDIAN</span>
                    <span class="stat-value">${formatValue(median, metric)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">STD DEV</span>
                    <span class="stat-value">±${formatValue(stdDev, metric).replace('%', '')}</span>
                </div>
            </div>
        </div>

        <div class="sidebar-section success">
            <h4><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Positive Deviation</h4>
            <div class="insights-list">
                ${successes.map(c => `
                    <div class="insight-item ${activeDnaCounty === c.id ? 'active' : ''}" onclick="showMetricDNA('${c.id}')">
                        <div class="county-info">
                            <span class="c-name">${c.name}</span>
                            <span class="c-state">${c.state_name || c.state_abbr}</span>
                        </div>
                        <span class="c-value">${formatValue(c[metric], metric)}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="sidebar-section critical">
            <h4><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="19"/><path d="M12 8v5"/></svg> Critical Focus</h4>
            <div class="insights-list">
                ${criticals.map(c => `
                    <div class="insight-item ${activeDnaCounty === c.id ? 'active' : ''}" onclick="showMetricDNA('${c.id}')">
                        <div class="county-info">
                            <span class="c-name">${c.name}</span>
                            <span class="c-state">${c.state_name || c.state_abbr}</span>
                        </div>
                        <span class="c-value" style="color: #dc2626;">${formatValue(c[metric], metric)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Highlight in plot
    const highlights = [
        ...successes.map(c => ({ id: c.id, value: c[metric], isCritical: false })),
        ...criticals.map(c => ({ id: c.id, value: c[metric], isCritical: true }))
    ];

    renderPlot(metric, values, highlights);

    // Render Mini-Map Locator on the right side
    const rightSidebarDynamic = document.getElementById('right-sidebar-dynamic-content');
    if (rightSidebarDynamic) {
        rightSidebarDynamic.innerHTML = `
            <div class="mini-map-box">
                <div class="box-header">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    GEOGRAPHIC OUTlier LOCATOR
                </div>
                <div id="mini-map-locator" class="sidebar-mini-map" style="height: 250px;">
                    <div class="map-loader">PROJECTING GEODATA...</div>
                </div>
                <div class="map-overlay-hint">USA ALBERS PROJECTION</div>
            </div>
        `;
    }

    setTimeout(() => {
        renderMiniMap('mini-map-locator', highlights);
    }, 400); // More time to ensure DOM is ready
}

function showMetricDNA(countyId) {
    const county = allCountyData.find(c => c.id === countyId);
    if (!county) return;

    const metric = activeInfoMetric;
    const label = metricLabels[metric] || metric;
    const val = county[metric];

    // Calculate averages for current metric and filtered subset
    const nationalValues = allCountyData.map(c => c[metric]).filter(v => typeof v === 'number' && v !== 0);
    const stateValues = allCountyData.filter(c => c.state_abbr === county.state_abbr).map(c => c[metric]).filter(v => typeof v === 'number' && v !== 0);
    const regionValues = allCountyData.filter(c => c.region === county.region).map(c => c[metric]).filter(v => typeof v === 'number' && v !== 0);

    const nationalAvg = nationalValues.reduce((a, b) => a + b, 0) / nationalValues.length;
    const stateAvg = stateValues.reduce((a, b) => a + b, 0) / stateValues.length;
    const regionAvg = regionValues.reduce((a, b) => a + b, 0) / regionValues.length;

    const container = document.getElementById('comparison-card-container');
    if (!container) return;

    // Check if card for this county already exists
    if (document.getElementById(`comp-card-${countyId}`)) {
        document.getElementById(`comp-card-${countyId}`).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
    }

    // New card element
    const card = document.createElement('div');
    card.id = `comp-card-${countyId}`;
    card.className = 'rich-comparison-card';
    card.style.marginBottom = '15px';

    card.innerHTML = `
        <div class="card-header">
            <div class="comparison-title">
                <h3>${county.name}</h3>
                <p>${county.state_name || county.state_abbr}</p>
            </div>
            <button class="close-card-btn" onclick="removeMetricDNA('${countyId}')" title="Close Card">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>

        <div class="comparison-metric-name">
            ${label}
        </div>

        <div class="comp-bar-wrapper">
            <div class="comp-bar-container">
                <div class="comp-bar-label">
                    <span>County</span>
                    <span>${formatValue(val, metric)}</span>
                </div>
                <div class="comp-bar-bg">
                    <div class="comp-bar-fill bar-county" id="bar-county-${countyId}"></div>
                </div>
            </div>

            <div class="comp-bar-container">
                <div class="comp-bar-label">
                    <span>${county.state_abbr} State Average</span>
                    <span>${formatValue(stateAvg, metric)}</span>
                </div>
                <div class="comp-bar-bg">
                    <div class="comp-bar-fill bar-state" id="bar-state-${countyId}"></div>
                </div>
            </div>

            <div class="comp-bar-container">
                <div class="comp-bar-label">
                    <span>${county.region} Region Average</span>
                    <span>${formatValue(regionAvg, metric)}</span>
                </div>
                <div class="comp-bar-bg">
                    <div class="comp-bar-fill bar-region" id="bar-region-${countyId}"></div>
                </div>
            </div>

            <div class="comp-bar-container">
                <div class="comp-bar-label">
                    <span>National Average</span>
                    <span>${formatValue(nationalAvg, metric)}</span>
                </div>
                <div class="comp-bar-bg">
                    <div class="comp-bar-fill bar-national" id="bar-national-${countyId}"></div>
                </div>
            </div>
        </div>
    `;

    container.appendChild(card);

    // Update active states in sidebar
    updateInsightItemActiveStates();

    // Animate bars
    const maxVal = Math.max(val, stateAvg, regionAvg, nationalAvg, 0.0001);
    setTimeout(() => {
        const setWidth = (selector, v) => {
            const el = document.getElementById(selector);
            if (el) el.style.width = ((v / maxVal) * 100) + '%';
        };
        setWidth(`bar-county-${countyId}`, val);
        setWidth(`bar-state-${countyId}`, stateAvg);
        setWidth(`bar-region-${countyId}`, regionAvg);
        setWidth(`bar-national-${countyId}`, nationalAvg);
    }, 100);
}

function removeMetricDNA(countyId) {
    const card = document.getElementById(`comp-card-${countyId}`);
    if (card) {
        card.classList.add('removing');
        setTimeout(() => {
            card.remove();
            updateInsightItemActiveStates();
        }, 300);
    }
}

function updateInsightItemActiveStates() {
    const activeIds = Array.from(document.querySelectorAll('.rich-comparison-card'))
        .map(card => card.id.replace('comp-card-', ''));

    document.querySelectorAll('.insight-item').forEach(item => {
        const onclick = item.getAttribute('onclick') || '';
        const match = onclick.match(/showMetricDNA\('(.+?)'\)/);
        if (match && activeIds.includes(match[1])) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}


function toggleCompare(metric) {
    const idx = compareList.indexOf(metric);
    if (idx > -1) {
        compareList.splice(idx, 1);
    } else if (compareList.length < 4) {
        compareList.push(metric);
    }

    updateComparisonHud();
    updateCardStates();
}

function updateCardStates() {
    document.querySelectorAll('.metric-viz-card').forEach(card => {
        const m = card.getAttribute('data-metric');
        const btn = card.querySelector('.compare-btn');
        if (compareList.includes(m)) {
            card.classList.add('compare-selected');
            if (btn) btn.classList.add('active');
        } else {
            card.classList.remove('compare-selected');
            if (btn) btn.classList.remove('active');
        }
    });
}

function updateComparisonHud() {
    const hud = document.getElementById('comparison-hud');
    const countSpan = document.getElementById('comp-count');
    const listDiv = document.getElementById('hud-metrics-list');
    const goBtn = document.getElementById('compare-go-btn');

    if (compareList.length > 0) {
        hud.style.display = 'block';
        countSpan.textContent = compareList.length;
        document.getElementById('comparison-hud').querySelector('.hud-text').innerHTML = `<span id="comp-count">${compareList.length}</span>/4 Metrics Selected`;

        listDiv.innerHTML = compareList.map(m => `
            <div class="hud-metric-tag">${metricLabels[m] || m}</div>
        `).join('');

        goBtn.disabled = compareList.length < 2;
    } else {
        hud.style.display = 'none';
    }
}

function clearComparison() {
    compareList = [];
    updateComparisonHud();
    updateCardStates();
    // Remove comparison container if exists
    const container = document.getElementById('correlation-overlay');
    if (container) container.remove();

    const content = document.getElementById('metric-viz-content');
    if (content) content.classList.remove('is-comparing');
}

function runCorrelation() {
    if (compareList.length < 2) return;

    // Create comparison overlay container
    let overlay = document.getElementById('correlation-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'correlation-overlay';
        overlay.className = 'comparison-container';
        const content = document.getElementById('metric-viz-content');
        content.prepend(overlay);
    }

    const m1 = compareList[0];
    const m2 = compareList[1];

    const content = document.getElementById('metric-viz-content');
    if (content) content.classList.add('is-comparing');

    const colors = ["#c83830", "#3b82f6", "#10b981", "#f59e0b"]; // Red, Blue, Green, Orange

    let legendItems = compareList.map((m, i) => `
        <div class="legend-item">
            <div class="legend-dot" style="background:${colors[i]}"></div> 
            ${metricLabels[m] || m}
        </div>
    `).join('');

    overlay.innerHTML = `
        <div class="comparison-header">
            <div>
                <h2>Multi-Metric Correlation</h2>
                <p>Comparing normalized spreads of ${compareList.length} metrics</p>
            </div>
            <div class="comparison-legend">
                <div class="legend-items-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-right: 20px;">
                    ${legendItems}
                </div>
                <button class="close-comparison" onclick="clearComparison()">Close</button>
            </div>
        </div>
        <div id="corr-viz" style="width:100%; height:350px;"></div>
    `;

    renderCorrelationPlot('corr-viz', compareList, colors);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCorrelationPlot(containerId, metrics, colors) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = container.offsetWidth;
    const height = 350;
    const margin = { top: 20, right: 20, bottom: 40, left: 20 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, 100]).range([0, chartWidth]);

    const normalize = (vals) => {
        const extent = d3.extent(vals);
        if (extent[0] === extent[1]) return vals.map(() => 50);
        return vals.map(v => (v - extent[0]) / (extent[1] - extent[0]) * 100);
    };

    const filteredData = getFilteredData();

    if (viewMode === 'distribution') {
        let maxBinCount = 0;
        const allHists = metrics.map(m => {
            const data = filteredData.map(c => c[m]).filter(v => typeof v === 'number');
            const normData = normalize(data);
            const hist = d3.bin().domain([0, 100]).thresholds(40)(normData);
            const maxCount = d3.max(hist, d => d.length);
            if (maxCount > maxBinCount) maxBinCount = maxCount;
            return hist;
        });

        const y = d3.scaleLinear().domain([0, maxBinCount]).range([chartHeight, 0]);
        const area = d3.area().x(d => x(d.x0)).y0(chartHeight).y1(d => y(d.length)).curve(d3.curveBasis);

        allHists.forEach((hist, i) => {
            svg.append("path").datum(hist).attr("d", area).attr("fill", colors[i]).attr("fill-opacity", 0.08).attr("stroke", colors[i]).attr("stroke-width", 2.5);
        });
    } else {
        // Multi-Boxplot
        const boxSpacing = chartHeight / (metrics.length + 1);
        metrics.forEach((m, i) => {
            const data = filteredData.map(c => c[m]).filter(v => typeof v === 'number');
            const normData = normalize(data);
            const sorted = [...normData].sort(d3.ascending);

            const q1 = d3.quantile(sorted, 0.25), median = d3.quantile(sorted, 0.5), q3 = d3.quantile(sorted, 0.75);
            const min = sorted[0], max = sorted[sorted.length - 1];
            const boxHeight = Math.min(30, boxSpacing * 0.6);
            const yPos = boxSpacing * (i + 1);

            const g = svg.append('g').attr('transform', `translate(0, ${yPos})`);
            const color = colors[i];

            g.append('line').attr('x1', x(min)).attr('x2', x(max)).attr('y1', 0).attr('y2', 0).attr('stroke', color).attr('stroke-width', 2);
            g.append('rect').attr('x', x(q1)).attr('y', -boxHeight / 2).attr('width', x(q3) - x(q1)).attr('height', boxHeight).attr('fill', color).attr('fill-opacity', 0.2).attr('stroke', color).attr('stroke-width', 2).attr('rx', 4);
            g.append('line').attr('x1', x(median)).attr('x2', x(median)).attr('y1', -boxHeight / 2).attr('y2', boxHeight / 2).attr('stroke', color).attr('stroke-width', 3);
        });
    }

    svg.append("g").attr("transform", `translate(0,${chartHeight})`).call(d3.axisBottom(x).ticks(10).tickFormat(d => d + "%")).attr("class", "axis-label");
    svg.append("text").attr("x", chartWidth / 2).attr("y", chartHeight + 35).attr("text-anchor", "middle").attr("class", "axis-label").text("Normalized Score (Low to High)");
}

let miniMapRoot = null;

// --- Mini Map Locator Logic ---
function renderMiniMap(containerId, markers) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (miniMapRoot) {
        miniMapRoot.dispose();
    }

    // Secondary check for Geodata script presence
    const geoJSON = window.am5geodata_region_usa_usaCountiesLow || window.am5geodata_usaCountiesLow;
    if (!geoJSON) {
        console.warn("MiniMap: Geodata not found yet. Retrying in 500ms.");
        setTimeout(() => renderMiniMap(containerId, markers), 500);
        return;
    }

    miniMapRoot = am5.Root.new(containerId);

    // Set themes
    miniMapRoot.setThemes([
        am5themes_Animated.new(miniMapRoot)
    ]);

    // Create chart
    const chart = miniMapRoot.container.children.push(
        am5map.MapChart.new(miniMapRoot, {
            panX: "none",
            panY: "none",
            wheelX: "none",
            wheelY: "none",
            projection: am5map.geoAlbersUsa(),
            paddingLeft: 0,
            paddingRight: 0,
            paddingTop: 0,
            paddingBottom: 0
        })
    );

    // Create main polygon series for counties
    const polygonSeries = chart.series.push(
        am5map.MapPolygonSeries.new(miniMapRoot, {
            geoJSON: geoJSON,
            calculateBounds: true
        })
    );

    polygonSeries.mapPolygons.template.setAll({
        fill: am5.color(0xd1d5db), // Clearly visible Slate Gray
        stroke: am5.color(0xffffff),
        strokeWidth: 0.2,
        fillOpacity: 1
    });

    // Create point series for the outliers
    const pointSeries = chart.series.push(
        am5map.MapPointSeries.new(miniMapRoot, {
            polygonSeries: polygonSeries // Link to polygons for ID resolution if needed
        })
    );

    pointSeries.bullets.push(function () {
        const circle = am5.Circle.new(miniMapRoot, {
            radius: 10,
            stroke: am5.color(0xffffff),
            strokeWidth: 3,
            tooltipText: "{name}",
            fill: am5.color(0xef4444)
        });

        circle.adapters.add("fill", function (fill, target) {
            return target.dataItem.dataContext.fill || fill;
        });

        return am5.Bullet.new(miniMapRoot, {
            sprite: circle
        });
    });

    // Plotting Logic (Extracted from event to avoid race condition)
    function plotMarkers() {
        const pointData = [];

        markers.forEach(m => {
            const fullCountyObj = allCountyData.find(c => c.id === m.id);
            if (!fullCountyObj) return;

            const fips = fullCountyObj.fips || "";
            const st = (fullCountyObj.state_abbr || "").toUpperCase();
            const nm = normalizeCountyName(fullCountyObj.name);

            // Match against GeoJSON features
            const feature = geoJSON.features.find(f => {
                const fId = f.id || f.properties.id || "";
                if (fips && (fId === fips || fId.endsWith(fips) || fId.endsWith("-" + fips))) return true;

                // Backup metadata check
                const fSt = (f.properties.STATE || f.properties.state || "").toUpperCase();
                const fNm = normalizeCountyName(f.properties.name || f.properties.NAME || "");
                return fSt === st && fNm === nm;
            });

            if (feature) {
                // Use D3 for absolute coordinate derivation (guaranteed bypass of amCharts ID lag)
                try {
                    const centroid = d3.geoCentroid(feature);
                    if (centroid && !isNaN(centroid[0])) {
                        pointData.push({
                            longitude: centroid[0],
                            latitude: centroid[1],
                            name: fullCountyObj.name,
                            fill: am5.color(m.isCritical ? 0xef4444 : 0x10b981)
                        });
                    }
                } catch (e) {
                    // Fallback to polygonId if D3 fails
                    pointData.push({
                        polygonId: feature.id || feature.properties.id,
                        name: fullCountyObj.name,
                        fill: am5.color(m.isCritical ? 0xef4444 : 0x10b981)
                    });
                }
            }
        });

        pointSeries.data.setAll(pointData);
    }

    // Run plotting immediately and ensure chart appears
    plotMarkers();
    chart.appear(1000, 100);

    // Force Home Zoom after a short delay
    setTimeout(() => {
        chart.goHome();
    }, 300);
}


