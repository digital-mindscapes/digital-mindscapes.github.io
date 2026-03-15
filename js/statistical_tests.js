/**
 * Statistical Tests Engine
 * Digital Mindscapes - Premium Research Overhaul
 */

// =========================================
// METRIC DEFINITIONS
// =========================================

const metrics = [
    "pct_unemployment_rate", "pct_in_labor_force", "pct_natural_resources_construction",
    "pct_graduate_professional_degree", "depression_prevalence", "obesity_prevalence",
    "diabetes_prevalence", "arthritis_prevalence", "asthma_prevalence",
    "high_blood_pressure_prevalence", "high_cholesterol_prevalence", "coronary_heart_disease_prevalence",
    "stroke_prevalence", "cancer_prevalence", "copd_prevalence", "mental_health_issues_prevalence",
    "physical_health_issues_prevalence", "general_health_prevalence", "smoking_prevalence",
    "binge_drinking_prevalence", "physical_inactivity_prevalence", "checkup_prevalence",
    "cholesterol_screening_prevalence", "bp_medication_prevalence", "access2_prevalence",
    "disability_prevalence", "cognitive_difficulties_prevalence", "mobility_difficulty_prevalence",
    "hearing_disability_prevalence", "vision_difficulty_prevalence", "self_care_difficulty_prevalence",
    "independent_living_difficulty_prevalence", "loneliness_prevalence", "emotional_support_prevalence",
    "food_insecurity_prevalence", "food_stamp_prevalence", "housing_insecurity_prevalence",
    "utility_shutoff_prevalence", "lack_transportation_prevalence", "total_population_sum",
    "average_household_size", "average_family_size", "pct_speak_english_less_than_very_well",
    "pct_households_1plus_people_65plus", "households_with_broadband_sum"
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

// =========================================
// ICONS (Rich SVG)
// =========================================

const SVG_ICONS = {
    info: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    alert: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    database: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
    calculator: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="14"/><line x1="16" y1="18" x2="16" y2="18"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="12" y1="18" x2="12" y2="18"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="8" y1="18" x2="8" y2="18"/></svg>`
};

// =========================================
// TEST DEFINITIONS
// =========================================

const TEST_CONFIG = {
    ttest: {
        title: "Mean Comparison Analysis",
        steps: 4,
        type: "compare",
        subtests: [
            { 
                id: "student_t", 
                label: "Student's T-Test", 
                math: "$$t = \\frac{\\bar{X}_1 - \\bar{X}_2}{s_p \\sqrt{\\frac{1}{n_1} + \\frac{1}{n_2}}}$$",
                story: "The classic test for comparing two groups. It assumes both groups have equal variances. Use this when comparing similar populations (e.g., income in two adjacent zip codes).",
                lib: "simple-statistics",
                libUrl: "https://simplestatistics.org/docs/#samplecorrelation"
            },
            { 
                id: "welch_t", 
                label: "Welch's T-Test", 
                math: "$$t = \\frac{\\bar{X}_1 - \\bar{X}_2}{\\sqrt{\\frac{s_1^2}{n_1} + \\frac{s_2^2}{n_2}}}$$",
                story: "A robust version of the T-Test that doesn't assume equal variances. It's safer for real-world socioeconomic data where distribution widths often differ significantly.",
                lib: "simple-statistics / jStat",
                libUrl: "https://jstat.github.io/all.html#jStat.studentt.cdf"
            },
            { 
                id: "paired_t", 
                label: "Paired T-Test", 
                math: "$$t = \\frac{\\bar{D}}{s_D / \\sqrt{n}}$$",
                story: "Compares two different metrics for the same location. It looks at the mean difference (e.g., Obesity rate vs. Lack of Insurance in the same set of counties).",
                lib: "simple-statistics",
                libUrl: "https://simplestatistics.org/"
            }
        ],
        theory: {
            summary: "Compare mean values between groups or conditions to determine if differences are statistically significant.",
            math: "$$t = \\frac{\\bar{X}_1 - \\bar{X}_2}{SE}$$",
            assumptions: ["Independence or Pairing", "Normality of differences/means", "Homogeneity of variance (Student's)"],
            wrongAssums: "Significance is not effect size. A small p-value doesn't always imply a practically important difference."
        }
    },
    multi_group: {
        title: "Multi-Group Comparison",
        steps: 4,
        type: "multi",
        subtests: [
            { 
                id: "anova_one", 
                label: "One-Way ANOVA", 
                math: "$$F = \\frac{MS_{between}}{MS_{within}}$$",
                story: "Tests if at least one group mean is different from the others. We use tertile-based grouping to compare 'Low', 'Mid', and 'High' regions.",
                lib: "Custom Implementation (StatHelpers)",
                libUrl: "https://en.wikipedia.org/wiki/Analysis_of_variance"
            },
            { 
                id: "anova_two", 
                label: "Two-Way ANOVA", 
                math: "$$F = \\frac{MS_{factor}}{MS_{error}}$$",
                story: "Analyzes the effect of two independent variables simultaneously. For example, how both Income Level and Urban/Rural status impact Health Outcomes.",
                lib: "Custom Implementation (StatHelpers)",
                libUrl: "https://en.wikipedia.org/wiki/Two-way_analysis_of_variance"
            },
            { 
                id: "anova_rm", label: "Repeated Measures ANOVA", 
                math: "$$F = \\frac{MS_{Treatment}}{MS_{Error}} \\quad df = (k-1), \\, (n-1)(k-1)$$",
                story: "Used when multiple observations are taken from the same subjects. Here, we compare three related health metrics across the same counties.",
                lib: "Custom Logic via ANOVA One-way Expansion",
                libUrl: "https://jstat.github.io/"
            }
        ],
        theory: {
            summary: "Compare means across three or more groups simultaneously to detect overall differences.",
            math: "$$F = \\frac{\\text{Between-group variance}}{\\text{Within-group variance}}$$",
            assumptions: ["Independence", "Normality", "Homogeneity of variance"],
            wrongAssums: "A significant ANOVA only tells you *one* pair is different, not *which* ones."
        }
    },
    correlation: {
        title: "Correlation Analysis",
        steps: 4,
        type: "relate",
        subtests: [
            { 
                id: "pearson", 
                label: "Pearson (Linear)", 
                math: "$$r = \\frac{\\sum(x_i - \\bar{x})(y_i - \\bar{y})}{\\sqrt{\\sum(x_i - \\bar{x})^2 \\sum(y_i - \\bar{y})^2}}$$",
                story: "Measures the linear relationship between two variables. Best for data that follows a straight-line trend (e.g., as Income rises, Health tends to improve linearly).",
                lib: "simple-statistics",
                libUrl: "https://simplestatistics.org/docs/#samplecorrelation"
            },
            { 
                id: "spearman", 
                label: "Spearman (Rank)", 
                math: "$$\\rho = 1 - \\frac{6 \\sum d_i^2}{n(n^2 - 1)}$$",
                story: "A rank-based correlation that captures monotonic relationships. It doesn't require linearity, making it great for skewed socioeconomic data.",
                lib: "Custom (StatHelpers) + simple-statistics",
                libUrl: "https://simplestatistics.org/"
            },
            { 
                id: "kendall", 
                label: "Kendall's Tau", 
                math: "$$\\tau = \\frac{C - D}{\\frac{1}{2}n(n-1)}$$",
                story: "Measures the strength of association between two ranked variables. It is more robust to outliers and small sample variations than Spearman.",
                lib: "Custom Implementation (StatHelpers)",
                libUrl: "https://en.wikipedia.org/wiki/Kendall_rank_correlation_coefficient"
            },
            { 
                id: "partial", 
                label: "Partial Correlation", 
                math: "$$r_{xy.z} = \\frac{r_{xy} - r_{xz}r_{yz}}{\\sqrt{(1-r_{xz}^2)(1-r_{yz}^2)}}$$",
                story: "Computes the relationship between two primary metrics while mathematically removing the confounding 'size effect' of Total Population. This ensures that observed correlations aren't merely driven by larger counties having larger numbers across all variables.",
                lib: "Custom Implementation (StatHelpers)",
                libUrl: "https://en.wikipedia.org/wiki/Partial_correlation"
            },
            { 
                id: "distance", 
                label: "Distance Correlation", 
                math: "$$dCor(X,Y) = \\frac{dCov(X,Y)}{\\sqrt{dVar(X)dVar(Y)}}$$",
                story: "A powerful modern correlation wrapper that captures *any* dependence—linear or non-linear. If there is a pattern, Distance Correlation will find it.",
                lib: "Custom Implementation (StatHelpers)",
                libUrl: "https://en.wikipedia.org/wiki/Distance_correlation"
            }
        ],
        theory: {
            summary: "Quantify the strength and direction of relationships between continuous variables.",
            math: "$$r \\in [-1, 1]$$",
            assumptions: ["Linearity (Pearson)", "Monotonicity (Spearman)", "Bivariate Normality"],
            wrongAssums: "Correlation does not imply causation. Hidden 'lurking' variables often drive strong correlations."
        }
    },
    normality: {
        title: "Distribution Tests",
        steps: 4,
        type: "dist",
        subtests: [
            { 
                id: "shapiro", 
                label: "Shapiro-Wilk", 
                math: "$$W = \\frac{(\\sum a_i x_{(i)})^2}{\\sum (x_i - \\bar{x})^2}$$",
                story: "The most powerful test for normality in many situations. It checks if your data sample could reasonably have come from a normal distribution.",
                lib: "Custom Logic Wrapper",
                libUrl: "https://en.wikipedia.org/wiki/Shapiro%E2%80%93Wilk_test"
            },
            { 
                id: "ks", 
                label: "Kolmogorov-Smirnov", 
                math: "$$D = \\sup_x |F_n(x) - F(x)|$$",
                story: "Compares the empirical distribution of your sample to a theoretical normal distribution. It is sensitive to both location and shape of the distribution.",
                lib: "Custom Logic Wrapper",
                libUrl: "https://en.wikipedia.org/wiki/Kolmogorov%E2%80%93Smirnov_test"
            },
            { 
                id: "anderson", 
                label: "Anderson-Darling", 
                math: "$$A^2 = -n - \\sum \\frac{2i-1}{n} [\\ln F(x_i) + \\ln(1 - F(x_{n-i+1}))]$$",
                story: "A modification of the K-S test that gives more weight to the tails of the distribution. Essential for socioeconomic data where 'outliers' often occur.",
                lib: "Custom Logic Wrapper",
                libUrl: "https://en.wikipedia.org/wiki/Anderson%E2%80%93Darling_test"
            },
            { 
                id: "jarque_bera", 
                label: "Jarque-Bera", 
                math: "$$JB = \\frac{n}{6}(S^2 + \\frac{1}{4}(K-3)^2)$$",
                story: "Focuses on skewness and kurtosis. If the data is too 'lopsided' or has 'fat tails', the Jarque-Bera test will reject the null hypothesis of normality.",
                lib: "Custom Implementation (StatHelpers)",
                libUrl: "https://en.wikipedia.org/wiki/Jarque%E2%80%93Bera_test"
            }
        ],
        theory: {
            summary: "Determine if sample data follows a specific distribution, usually the Normal distribution.",
            math: "$$H_0: \\text{Data follows normal distribution}$$",
            assumptions: ["Independence", "Continuous data", "Random sampling"],
            wrongAssums: "Normality tests are sensitive to sample size. In very large samples, even tiny deviations are 'significant'."
        }
    },
    non_parametric: {
        title: "Non-Parametric Analysis",
        steps: 4,
        type: "nonparam",
        subtests: [
            { 
                id: "mann_whitney", 
                label: "Mann-Whitney U", 
                math: "$$U = n_1 n_2 + \\frac{n_1(n_1+1)}{2} - R_1$$",
                story: "A rank-based alternative to the T-test. It doesn't assume normality, making it perfect for comparing distributions like 'Median Income' which are often skewed.",
                lib: "Custom Implementation (StatHelpers)",
                libUrl: "https://en.wikipedia.org/wiki/Mann%E2%80%93Whitney_U_test"
            },
            { 
                id: "wilcoxon", 
                label: "Wilcoxon Signed-Rank", 
                math: "$$W = \\sum_{i=1}^{n} [sgn(x_{2,i}-x_{1,i}) R_i]$$",
                story: "The non-parametric version of the paired T-test. It compares ranks of differences between two related variables (e.g., Obesity vs. Inactivity).",
                lib: "Custom Implementation (StatHelpers)",
                libUrl: "https://en.wikipedia.org/wiki/Wilcoxon_signed-rank_test"
            },
            { 
                id: "kruskal", 
                label: "Kruskal-Wallis", 
                math: "$$H = \\frac{12}{n(n+1)} \\sum \\frac{R_j^2}{n_j} - 3(n+1)$$",
                story: "The non-parametric version of One-Way ANOVA. It tests whether multiple independent samples come from the same distribution.",
                lib: "Custom Implementation (StatHelpers)",
                libUrl: "https://en.wikipedia.org/wiki/Kruskal%E2%80%93Wallis_one-way_analysis_of_variance"
            },
            { 
                id: "friedman", 
                label: "Friedman Test", 
                math: "$$Q = \\frac{12n}{k(k+1)} \\sum_{j=1}^k (\\bar{R}_j - \\frac{k+1}{2})^2$$",
                story: "A non-parametric test for repeated measures. It is used to detect differences in treatments across multiple test attempts or related variables.",
                lib: "Custom Implementation (StatHelpers)",
                libUrl: "https://en.wikipedia.org/wiki/Friedman_test"
            }
        ],
        theory: {
            summary: "Alternative methods for when data is skewed, ordinal, or violates parametric assumptions.",
            math: "$$R = \\sum \\text{Rank}(x_i) \\quad Z = \\frac{W - \\mu_W}{\\sigma_W}$$",
            assumptions: ["Independence", "Ordinal or continuous data", "Similar distribution shapes"],
            wrongAssums: "Non-parametric tests are generally less powerful than parametric tests if assumptions are met."
        }
    }
};

// =========================================
// STATE MANAGEMENT
// =========================================

let currentTest = null;
let currentStep = 1;
let appData = { states: [], counties: [] };
let testState = { selectedSubtest: null, metricX: null, metricY: null, groupVar: null, groupThreshold: null, results: null };
let statsHistory = [];

// =========================================
// INITIALIZATION
// =========================================

async function init() {
    try {
        const paths = [
            "data/ACS Data/state_acs_flat.json", "data/PLACES Data/state_places_flat.json",
            "data/ACS Data/county_acs_flat.json", "data/PLACES Data/county_places_flat.json"
        ];
        const res = await Promise.all(paths.map(p => fetch(p)));
        const [as, ps, ac, pc] = await Promise.all(res.map(r => r.json()));

        appData.states = mergeData(as, ps, false);
        appData.counties = mergeData(ac, pc, true);

        console.log("Statistical Engine Initialized");
        loadHistory(); 
    } catch (e) {
        console.error("Critical error:", e);
    }
}

function mergeData(acs, plc, isCounty = true) {
    const lookup = {};
    plc.forEach(p => {
        if (isCounty && p.state_abbr && p.name) {
            const key = p.state_abbr.toUpperCase() + "_" + normalizeName(p.name);
            lookup[key] = p;
        } else {
            lookup[p.id] = p;
        }
    });

    return acs.map(a => {
        let pData = {};
        if (isCounty && a.state_abbr && a.name) {
            const key = a.state_abbr.toUpperCase() + "_" + normalizeName(a.name);
            pData = lookup[key] || lookup[a.id] || {};
        } else {
            pData = lookup[a.id] || {};
        }
        return { ...a, ...pData };
    });
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
// STEPPER LOGIC
// =========================================

function startTest(testId) {
    currentTest = testId;
    currentStep = 1;
    const config = TEST_CONFIG[testId];
    testState = { 
        selectedSubtest: config.subtests ? config.subtests[0].id : null, 
        metricX: null, 
        metricY: null, 
        groupVar: null, 
        groupThreshold: null,
        results: null 
    };

    document.querySelectorAll('.framework-item').forEach(item => {
        item.classList.toggle('active', item.dataset.test === testId);
    });

    document.getElementById("landingView").style.display = "none";
    document.getElementById("technicalDetailView").style.display = "none";
    document.getElementById("stepperView").style.display = "block";
    document.getElementById("activeTestTitle").textContent = config.title;

    renderStep();
}

function nextStep() {
    if (currentStep === 2 && !validateStep2()) return;

    if (currentStep < TEST_CONFIG[currentTest].steps) {
        currentStep++;
        renderStep();
        if (currentStep === 3) performCalculations();
        if (currentStep === 4) saveToHistory();
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        renderStep();
    }
}

function renderStep() {
    const config = TEST_CONFIG[currentTest];
    updateProgressBar();

    // Update Step Indicator (e.g., "Step 1 of 4")
    const stepInd = document.getElementById("stepIndicator");
    if (stepInd) {
        stepInd.textContent = `Step ${currentStep} of ${config.steps}`;
    }

    document.getElementById("prevBtn").disabled = currentStep === 1;
    const nextBtn = document.getElementById("nextBtn");
    nextBtn.textContent = currentStep === config.steps ? "Reset Test" : "Continue to Phase " + (currentStep + 1);

    if (currentStep === 3) {
        nextBtn.disabled = true;
        nextBtn.textContent = "Computing...";
    } else {
        nextBtn.disabled = false;
    }

    if (currentStep === config.steps) {
        nextBtn.onclick = () => startTest(currentTest);
    } else {
        nextBtn.onclick = nextStep;
    }

    switch (currentStep) {
        case 1: renderTheoryStep(config); break;
        case 2: renderConfigStep(config); break;
        case 3: renderCalculationStep(config); break;
        case 4: renderResultsStep(config); break;
    }

    renderMath(document.getElementById("stepContent"));
}

function showToast(message, type = 'warning') {
    const container = document.getElementById("statsToastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `stats-toast ${type}`;
    toast.innerHTML = `
        <div class="stats-toast-icon">
            ${type === 'error' ? SVG_ICONS.alert : SVG_ICONS.info}
        </div>
        <div class="stats-toast-message">${message}</div>
    `;

    container.appendChild(toast);

    // Auto-remove
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

function updateProgressBar() {
    const steps = document.querySelectorAll(".step-pill");
    steps.forEach(s => {
        const stepNum = parseInt(s.dataset.step);
        s.classList.toggle("active", stepNum === currentStep);
        s.classList.toggle("completed", stepNum < currentStep);
    });
}

function renderMath(element = document.body) {
    if (typeof renderMathInElement === 'function') {
        renderMathInElement(element, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', inline: true },
                { left: '\\(', right: '\\)', inline: true },
                { left: '\\[', right: '\\]', display: true }
            ],
            throwOnError: false
        });
    }
}

function saveToHistory() {
    if (!testState.results) return;

    const historyObj = {
        testId: currentTest,
        state: JSON.parse(JSON.stringify(testState)),
        timestamp: new Date().toISOString()
    };

    // Prevent duplicates (simple check by result values)
    if (statsHistory.length > 0) {
        const last = statsHistory[0];
        if (last.testId === historyObj.testId && last.state.metricX === historyObj.state.metricX && last.state.results.stat === historyObj.state.results.stat) {
            return;
        }
    }

    statsHistory.unshift(historyObj);
    if (statsHistory.length > 20) statsHistory.pop();

    localStorage.setItem("stats_history", JSON.stringify(statsHistory));
    renderHistory();
}

function loadHistory() {
    const saved = localStorage.getItem("stats_history");
    if (saved) {
        try {
            statsHistory = JSON.parse(saved);
        } catch (e) {
            statsHistory = [];
        }
    }
    renderHistory();
}

function renderHistory() {
    const historyList = document.getElementById("statsHistory");
    if (!historyList) return;

    if (statsHistory.length === 0) {
        historyList.innerHTML = `
            <div class="history-empty">
                <p>No recent tests run in this session.</p>
            </div>
        `;
        return;
    }

    historyList.innerHTML = '';
    statsHistory.forEach((item, idx) => {
        const res = item.state.results;
        
        let isSig = false;
        if (res.hasOwnProperty('isSignificant')) {
            isSig = res.isSignificant;
        } else {
            const pValNumeric = res.p.startsWith("<") ? 0.000001 : parseFloat(res.p);
            isSig = pValNumeric < 0.05;
        }

        const historyItem = document.createElement("div");
        historyItem.className = "history-item animate-in";
        historyItem.style.animationDelay = `${idx * 0.05}s`;
        historyItem.innerHTML = `
            <span class="test-name">${TEST_CONFIG[item.testId].title}</span>
            <div class="test-outcome">
                <span>P-Value: ${res.p}</span> • 
                <span style="color: ${isSig ? '#10b981' : '#ef4444'}">${isSig ? 'Significant' : 'No Effect'}</span>
            </div>
        `;
        historyItem.onclick = () => loadResultFromHistory(idx);
        historyList.appendChild(historyItem);
    });
}

function loadResultFromHistory(idx) {
    const item = statsHistory[idx];
    if (!item) return;

    currentTest = item.testId;
    testState = JSON.parse(JSON.stringify(item.state));
    currentStep = 4; // Jump to results

    // Update UI
    const stepperBox = document.getElementById("stepperView");
    const landingView = document.getElementById("landingView");
    if (stepperBox) stepperBox.style.display = "block";
    if (landingView) landingView.style.display = "none";

    renderStep();
    renderResultsStep();
}

function clearHistory() {
    statsHistory = [];
    localStorage.removeItem("stats_history");
    renderHistory();
}

// =========================================
// STEP RENDERERS
// =========================================

function renderTheoryStep(config) {
    const subtest = config.subtests ? config.subtests.find(s => s.id === testState.selectedSubtest) : null;
    const math = subtest ? subtest.math : config.theory.math;
    const label = subtest ? subtest.label : config.title;

    document.getElementById("stepContent").innerHTML = `
        <div class="step-view animate-in">
            <div class="step-section">
                <h3 class="section-title-sm">Methodological Framework: ${label} <button class="info-btn" onclick="showInterpretationModal('theory')">i</button></h3>
                <p class="theory-info">${config.theory.summary}</p>
            </div>
            
            <div class="step-section">
                <h3 class="section-title-sm">Mathematical Formulation <button class="info-btn" onclick="showInterpretationModal('math')">i</button></h3>
                <div class="math-box">${math}</div>
            </div>

            <div class="step-section">
                <h3 class="section-title-sm">Technical Prerequisites</h3>
                <div class="prereq-grid">
                    <div class="prereq-card">
                        <h5>${SVG_ICONS.check} Core Assumptions</h5>
                        <div class="theory-list-container">
                            ${config.theory.assumptions.map(a => `
                                <div class="theory-item-row">
                                    <div class="theory-bullet">${SVG_ICONS.check}</div>
                                    <div>${a}</div>
                                </div>
                            `).join("")}
                        </div>
                    </div>
                    <div class="prereq-card warning">
                        <h5>${SVG_ICONS.alert} Critical Precautions</h5>
                        <p style="font-size: 0.95rem; color: #475569; line-height: 1.6;">${config.theory.wrongAssums}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderConfigStep(config) {
    let subtestSelector = "";
    if (config.subtests && config.subtests.length > 1) {
        subtestSelector = `
            <div class="selector-container">
                <label>Specific Methodology Selection</label>
                <div class="subtest-card-grid">
                    ${config.subtests.map(s => `
                        <div class="subtest-card ${testState.selectedSubtest === s.id ? 'active' : ''}" onclick="selectSubtest('${s.id}')">
                            <div class="subtest-card-header">
                                <span class="subtest-label">${s.label}</span>
                                <button class="info-btn" onclick="event.stopPropagation(); showInterpretationModal('subtest_info', '${s.id}')">
                                    ${SVG_ICONS.info}
                                </button>
                            </div>
                            <div class="subtest-story-preview">${s.story}</div>
                            <div class="subtest-math-preview">${s.math}</div>
                        </div>
                    `).join("")}
                </div>
            </div>
        `;
    }

    let controls = "";
    const isPaired = ['paired_t', 'wilcoxon', 'friedman', 'repeated_anova'].includes(testState.selectedSubtest);

    if (config.type === "dist") {
        controls = `
            ${subtestSelector}
            ${createMetricSelector("Target Variable for Analysis", "metricX")}
        `;
    } else if (config.type === "relate") {
        controls = `
            ${subtestSelector}
            ${createMetricSelector("Independent Variable (X-Axis)", "metricX")}
            ${createMetricSelector("Dependent Variable (Y-Axis)", "metricY")}
        `;
    } else if (config.type === "compare" || config.type === "multi" || config.type === "nonparam") {
        if (isPaired) {
             controls = `
                ${subtestSelector}
                ${createMetricSelector("First Observation Metric", "metricX")}
                ${createMetricSelector("Second Observation Metric", "metricY")}
                ${testState.selectedSubtest === 'friedman' || testState.selectedSubtest === 'repeated_anova' ? createMetricSelector("Third Observation Metric (Optional)", "groupVar") : ''}
            `;
        } else {
            controls = `
                ${subtestSelector}
                ${createMetricSelector("Outcome Metric (Dependent)", "metricX")}
                ${createMetricSelector("Grouping Metric (Independent)", "groupVar")}
                ${config.type === 'compare' ? `
                    <div id="thresholdValueDisplay" style="margin-top: 10px; font-size: 0.85rem; font-weight: 700; color: var(--stats-primary); display: none;">
                        Current Split Threshold: <span id="threshVal">--</span>
                    </div>
                ` : ''}
            `;
        }
    }

    document.getElementById("stepContent").innerHTML = `
        <div class="step-view animate-in">
            <div class="step-section">
                <h3 class="section-title-sm">Study Configuration <button class="info-btn" onclick="showInterpretationModal('config')">i</button></h3>
                <div class="config-container">
                    ${controls}
                </div>
            </div>
            
            <div class="step-section">
                <h3 class="section-title-sm">Sample Insight Preview</h3>
                <div class="data-preview-card" id="dataPreview" style="background:#fafbfc; border: 1.5px dashed var(--stats-border);">
                    <p style="text-align:center; color:#94a3b8; padding: 20px;">Awaiting variable selection to generate profile...</p>
                </div>
            </div>
        </div>
    `;

    // Event Listeners for subtest clicks are handled via onclick in the string template for simplicity and performance in this architecture

    ["metricX", "metricY", "groupVar"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", (e) => {
            testState[id] = e.target.value;
            if (id === "groupVar") testState.groupThreshold = null; // Reset threshold for new variable
            updateDataPreview();
        });
    });
}

function createMetricSelector(label, id) {
    return `
        <div class="selector-container">
            <label>${label}</label>
            <select id="${id}" class="stat-select">
                <option value="">-- Select Diagnostic Metric --</option>
                ${metrics.sort((a, b) => metricLabels[a].localeCompare(metricLabels[b]))
            .map(m => `<option value="${m}" ${testState[id] === m ? 'selected' : ''}>${metricLabels[m]}</option>`).join("")}
            </select>
        </div>
    `;
}

function updateDataPreview() {
    const preview = document.getElementById("dataPreview");

    // Choose which metric to profile based on context
    let targetMetric = testState.metricX;
    let isIndependentVar = false;

    if (currentTest === "ttest" && testState.groupVar) {
        targetMetric = testState.groupVar;
        isIndependentVar = true;
    }

    if (!targetMetric) {
        preview.innerHTML = `<p style="text-align:center; color:#94a3b8; padding: 20px;">Awaiting variable selection to generate profile...</p>`;
        return;
    }

    const vals = appData.counties.map(c => c[targetMetric]).filter(v => typeof v === "number" && !isNaN(v));
    if (vals.length === 0) return;

    const mean = ss.mean(vals).toFixed(2);
    const median = ss.median(vals).toFixed(2);
    const sd = ss.standardDeviation(vals).toFixed(2);

    // Initial threshold is median if not set
    if (isIndependentVar && testState.groupThreshold === null) {
        testState.groupThreshold = parseFloat(median);
    }

    preview.innerHTML = `
        <div class="preview-header-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; padding: 0 10px;">
            <div class="preview-title" style="font-size: 0.85rem; font-weight: 800; color: #1e293b; display:flex; align-items:center; gap:8px;">
                ${SVG_ICONS.database} ${isIndependentVar ? 'Grouping Variable' : 'Population Profile'}: ${metricLabels[targetMetric]}
            </div>
            <div class="preview-stats-bubble" style="display:flex; gap:15px; align-items:center;">
                <div class="bubble-item" style="font-size:0.75rem; color:#64748b;">N: <strong style="color:#1e293b">${vals.length}</strong></div>
                <div class="bubble-item" style="font-size:0.75rem; color:#64748b;">μ: <strong style="color:#1e293b">${mean}</strong></div>
                <div class="bubble-item" style="font-size:0.75rem; color:#64748b;">M: <strong style="color:#1e293b">${median}</strong></div>
            </div>
        </div>
        ${isIndependentVar ? `<div style="font-size:0.72rem; color:var(--stats-primary); font-weight:700; background:var(--stats-primary-soft); padding:6px 12px; border-radius:6px; margin-bottom:10px; display:flex; align-items:center; gap:8px;">${SVG_ICONS.info} Drag the dashed line to set the comparison threshold</div>` : ''}
        <div id="configDistPlot" style="height: 140px; width: 100%; min-height: 140px; margin-top: 10px;"></div>
    `;

    // Wait for DOM
    setTimeout(() => drawConfigDistributionPlot(vals, targetMetric, isIndependentVar), 50);
}

function drawConfigDistributionPlot(values, metric, isInteractive = false) {
    const container = document.getElementById("configDistPlot");
    if (!container) return;

    const width = container.offsetWidth;
    const height = 140;
    const margin = { top: 5, right: 15, bottom: 20, left: 15 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    container.innerHTML = "";

    const svg = d3.select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain(d3.extent(values))
        .range([0, chartWidth]);

    const bins = d3.bin()
        .domain(x.domain())
        .thresholds(x.ticks(40))(values);

    const y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .range([chartHeight, 0]);

    // Gradient & Area
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
        .attr("id", "config-area-gradient")
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "0%").attr("y2", "100%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "var(--stats-primary)").attr("stop-opacity", 0.3);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "var(--stats-primary)").attr("stop-opacity", 0);

    const area = d3.area()
        .x(d => x(d.x0))
        .y0(chartHeight)
        .y1(d => y(d.length))
        .curve(d3.curveBasis);

    svg.append("path")
        .datum(bins)
        .attr("fill", "url(#config-area-gradient)")
        .attr("d", area);

    const line = d3.line()
        .x(d => x(d.x0))
        .y(d => y(d.length))
        .curve(d3.curveBasis);

    svg.append("path")
        .datum(bins)
        .attr("fill", "none")
        .attr("stroke", "var(--stats-primary)")
        .attr("stroke-width", 2)
        .attr("d", line);

    // Axis
    svg.append("g")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(x).ticks(5).tickSize(5))
        .call(g => g.select(".domain").attr("stroke", "#e2e8f0"))
        .call(g => g.selectAll(".tick line").attr("stroke", "#e2e8f0"))
        .call(g => g.selectAll(".tick text").attr("fill", "#94a3b8").style("font-size", "10px").style("font-weight", "600"));

    if (isInteractive) {
        const initialVal = testState.groupThreshold !== null ? testState.groupThreshold : d3.mean(values);
        const threshValSpan = document.getElementById("threshVal");
        const threshDisplay = document.getElementById("thresholdValueDisplay");
        if (threshDisplay) threshDisplay.style.display = "block";
        if (threshValSpan) threshValSpan.textContent = initialVal.toFixed(2);

        // Interactive Threshold Line
        const dragLine = svg.append("g")
            .attr("class", "drag-line")
            .style("cursor", "ew-resize");

        const lineMark = dragLine.append("line")
            .attr("x1", x(initialVal))
            .attr("x2", x(initialVal))
            .attr("y1", 0)
            .attr("y2", chartHeight)
            .attr("stroke", "var(--stats-primary)")
            .attr("stroke-width", 3)
            .attr("stroke-dasharray", "5,3");

        const handle = dragLine.append("circle")
            .attr("cx", x(initialVal))
            .attr("cy", chartHeight / 2)
            .attr("r", 6)
            .attr("fill", "var(--stats-primary)")
            .attr("stroke", "#fff")
            .attr("stroke-width", 2);

        const drag = d3.drag()
            .on("drag", function (event) {
                let newX = Math.max(0, Math.min(chartWidth, event.x));
                let newVal = x.invert(newX);
                lineMark.attr("x1", newX).attr("x2", newX);
                handle.attr("cx", newX);
                testState.groupThreshold = parseFloat(newVal.toFixed(2));
                if (threshValSpan) threshValSpan.textContent = testState.groupThreshold.toFixed(2);
            });

        dragLine.call(drag);
    } else {
        // Mean indicator (static)
        const mean = d3.mean(values);
        svg.append("line")
            .attr("x1", x(mean))
            .attr("x2", x(mean))
            .attr("y1", 0)
            .attr("y2", chartHeight)
            .attr("stroke", "#1e293b")
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", "4,2");
    }
}

function validateStep2() {
    if (!testState.metricX) {
        showToast("Selection Required: Please choose a valid metric to proceed.");
        return false;
    }
    if (TEST_CONFIG[currentTest].type === "relate" && !testState.metricY) {
        showToast("Selection Required: Please choose a second metric for correlation.");
        return false;
    }
    if (TEST_CONFIG[currentTest].type === "compare" && !testState.groupVar) {
        showToast("Selection Required: Please choose a grouping variable for comparison.");
        return false;
    }
    return true;
}

// =========================================
// COMPUTATION
// =========================================

function renderCalculationStep(config) {
    document.getElementById("stepContent").innerHTML = `
        <div class="step-view animate-in">
            <div class="step-section" style="border-bottom: none;">
                <h3 class="section-title-sm">Hypothesis Testing Pipeline</h3>
                <div class="pipeline-stepper">
                    <div class="pipeline-step active" id="step_parse">
                        <div class="step-indicator-v">1</div>
                        <div class="step-info-v">
                            <h4>Data Engineering & Signal Extraction <button class="info-btn" onclick="showInterpretationModal('parse')">i</button></h4>
                            <div class="step-details-v" id="details_parse">
                                Isolating target variables and partitioning sample groups...
                            </div>
                        </div>
                    </div>
                    
                    <div class="pipeline-step" id="step_verify">
                        <div class="step-indicator-v">2</div>
                        <div class="step-info-v">
                            <h4>Parametric Assumption Validation <button class="info-btn" onclick="showInterpretationModal('verify')">i</button></h4>
                            <div class="step-details-v" id="details_verify">
                                <span class="pulse-dot-v"></span> Awaiting data parsing completion...
                            </div>
                        </div>
                    </div>
                    
                    <div class="pipeline-step" id="step_compute">
                        <div class="step-indicator-v">3</div>
                        <div class="step-info-v">
                            <h4>Hypothesis Synthesis & Probability Estimation <button class="info-btn" onclick="showInterpretationModal('compute')">i</button></h4>
                            <div class="step-details-v" id="details_compute">
                                Calculating test statistics and refining confidence thresholds...
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function performCalculations() {
    const steps = {
        parse: document.getElementById("step_parse"),
        verify: document.getElementById("step_verify"),
        compute: document.getElementById("step_compute")
    };

    try {
        const mX = testState.metricX, mY = testState.metricY, gV = testState.groupVar, sub = testState.selectedSubtest;
        const config = TEST_CONFIG[currentTest];
        const isPaired = ['paired_t', 'wilcoxon', 'friedman', 'repeated_anova', 'anova_rm'].includes(sub);

        // 1. Data Parsing & Filtering
        let data;
        if (isPaired) {
             data = appData.counties.filter(c => 
                typeof c[mX] === "number" && !isNaN(c[mX]) && 
                typeof c[mY] === "number" && !isNaN(c[mY]));
        } else {
             data = appData.counties.filter(c => 
                typeof c[mX] === "number" && !isNaN(c[mX]) && 
                (gV ? typeof c[gV] === "number" && !isNaN(c[gV]) : true));
        }

        if (data.length < 5) throw new Error("Insufficient data points for robust analysis.");

        steps.parse.classList.remove("active");
        steps.parse.classList.add("completed");
        steps.parse.querySelector(".step-indicator-v").innerHTML = SVG_ICONS.check;
        document.getElementById("details_parse").innerHTML = `Parsed <strong>${data.length}</strong> records for analysis.`;

        // 2. Assumption Verification (Formal Normality)
        steps.verify.classList.add("active");
        await delay(1000);
        
        // Use user-selected normality test if configured, or the global preference
        const normSub = testState.normalityPreference || 'jarque_bera';
        let normCheck;
        const vX = data.map(c => c[mX]);
        if (normSub === "shapiro") normCheck = StatHelpers.shapiroWilk(vX);
        else if (normSub === "ks") normCheck = StatHelpers.kolmogorovSmirnov(vX);
        else if (normSub === "anderson") normCheck = StatHelpers.andersonDarling(vX);
        else normCheck = StatHelpers.jarqueBera(vX);

        testState.violation = normCheck.p < 0.05;
        
        steps.verify.classList.remove("active");
        steps.verify.classList.add("completed");
        steps.verify.querySelector(".step-indicator-v").innerHTML = SVG_ICONS.check;
        document.getElementById("details_verify").innerHTML = `Verification complete (Assumption: ${normSub} p=${normCheck.p.toFixed(4)}).`;

        // 3. Main Computation
        steps.compute.classList.add("active");
        await delay(1000);

        let res = { type: currentTest, subtest: sub, sampleSize: data.length, testName: config.subtests.find(s=>s.id===sub).label };

        if (currentTest === "ttest") {
            if (sub === "paired_t") {
                const x = data.map(c => c[mX]), y = data.map(c => c[mY]);
                const diffs = x.map((v, i) => v - y[i]);
                const t = ss.mean(diffs) / (ss.sampleStandardDeviation(diffs) / Math.sqrt(diffs.length));
                const p = 2 * (jStat.studentt.cdf(-Math.abs(t), diffs.length - 1));
                res = { ...res, stat: t.toFixed(4), p: formatPValue(p), df: diffs.length - 1, statLabel: "t", rawData: { diffs, lx: metricLabels[mX], ly: metricLabels[mY] } };
            } else {
                const threshold = testState.groupThreshold || ss.median(data.map(c => c[gV]));
                const g1 = data.filter(c => c[gV] >= threshold).map(c => c[mX]);
                const g2 = data.filter(c => c[gV] < threshold).map(c => c[mX]);
                const m1 = ss.mean(g1), m2 = ss.mean(g2);
                const v1 = ss.sampleVariance(g1), v2 = ss.sampleVariance(g2);
                const n1 = g1.length, n2 = g2.length;
                let t, df;
                if (sub === "welch_t") {
                    t = (m1 - m2) / Math.sqrt((v1 / n1) + (v2 / n2));
                    df = Math.pow((v1 / n1) + (v2 / n2), 2) / (Math.pow(v1 / n1, 2) / (n1 - 1) + Math.pow(v2 / n2, 2) / (n2 - 1));
                } else {
                    const sp = Math.sqrt(((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2));
                    t = (m1 - m2) / (sp * Math.sqrt(1 / n1 + 1 / n2));
                    df = n1 + n2 - 2;
                }
                const p = 2 * (jStat.studentt.cdf(-Math.abs(t), df));
                res = { ...res, stat: t.toFixed(4), p: formatPValue(p), df: df.toFixed(1), statLabel: "t", rawData: { g1, g2, m1, m2, l1: `High ${metricLabels[gV]}`, l2: `Low ${metricLabels[gV]}` } };
            }
        } else if (currentTest === "multi") {
            if (sub === "anova_rm" || sub === "repeated_anova") {
                const x = data.map(c => c[mX]), y = data.map(c => c[mY]), z = data.map(c => c[gV] || (c[mX] + c[mY])/2);
                const matrix = x.map((_, i) => [x[i], y[i], z[i]]);
                const anova = StatHelpers.anovaRepeatedMeasures(matrix);
                res = { ...res, stat: anova.f.toFixed(4), p: formatPValue(anova.p), df: anova.df, statLabel: "F", rawData: { groups: [x, y, z], labels: [metricLabels[mX], metricLabels[mY], metricLabels[gV] || "Metric 3"] } };
            } else if (sub === "anova_two") {
                const thresholdA = ss.median(data.map(c => c[gV]));
                const thresholdB = ss.median(data.map(c => c["total_population_sum"]));
                const fA = data.map(c => c[gV] >= thresholdA ? 'HighV' : 'LowV');
                const fB = data.map(c => c["total_population_sum"] >= thresholdB ? 'HighP' : 'LowP');
                const anova = StatHelpers.anovaTwoWay(data.map(c => c[mX]), fA, fB);
                res = { ...res, stat: anova.fA.toFixed(4), p: formatPValue(anova.pA), df: `${anova.dfA}, ${anova.dfError}`, statLabel: "F", rawData: { groups: [data.filter(c=>c[gV]>=thresholdA).map(c=>c[mX]), data.filter(c=>c[gV]<thresholdA).map(c=>c[mX])], labels: ["HighV", "LowV"] } };
            } else {
                const vals = data.map(c => c[gV]).sort((a,b) => a - b);
                const q1 = vals[Math.floor(vals.length / 3)];
                const q2 = vals[Math.floor(vals.length * 2 / 3)];
                const g1 = data.filter(c => c[gV] < q1).map(c => c[mX]);
                const g2 = data.filter(c => c[gV] >= q1 && c[gV] < q2).map(c => c[mX]);
                const g3 = data.filter(c => c[gV] >= q2).map(c => c[mX]);
                const anova = StatHelpers.anovaOneWay([g1, g2, g3]);
                res = { ...res, stat: anova.f.toFixed(4), p: formatPValue(anova.p), df: `${anova.dfB}, ${anova.dfW}`, statLabel: "F", rawData: { groups: [g1, g2, g3], labels: ["Low Group", "Mid Group", "High Group"] } };
            }
        } else if (currentTest === "correlation") {
            // Data Cleaning: Filter out counties with non-numeric values for selected metrics
            const cleanedData = data.filter(c => {
                const v1 = c[mX];
                const v2 = c[mY];
                return typeof v1 === 'number' && typeof v2 === 'number' && !isNaN(v1) && !isNaN(v2) && isFinite(v1) && isFinite(v2);
            });

            if (cleanedData.length < 3) {
                res = { ...res, stat: "N/A", p: "N/A", df: 0, statLabel: "r", rawData: { x: [], y: [], lx: metricLabels[mX], ly: metricLabels[mY] } };
                return res;
            }

            const x = cleanedData.map(c => c[mX]), y = cleanedData.map(c => c[mY]);
            let r, p, df = x.length - 2;
            if (sub === "spearman") {
                r = StatHelpers.spearman(x, y);
                const t = r * Math.sqrt((x.length - 2) / (1 - r * r));
                p = 2 * (jStat.studentt.cdf(-Math.abs(t), x.length - 2));
            } else if (sub === "kendall") {
                const resK = StatHelpers.kendallTau(x, y);
                r = resK.tau;
                p = resK.p;
            } else if (sub === "distance") {
                const resD = StatHelpers.distanceCorr(x, y);
                r = resD.r;
                p = resD.p;
            } else if (sub === "partial") {
                r = StatHelpers.partialCorr(x, y, cleanedData.map(c => c["total_population_sum"]));
                df = x.length - 3; // Account for control variable
                const t = r * Math.sqrt(df / (1 - r * r));
                p = 2 * (jStat.studentt.cdf(-Math.abs(t), df));
            } else {
                r = ss.sampleCorrelation(x, y);
                const t = r * Math.sqrt((x.length - 2) / (1 - r * r));
                p = 2 * (jStat.studentt.cdf(-Math.abs(t), x.length - 2));
            }
            
            res = { ...res, stat: r.toFixed(4), p: formatPValue(p), df: df, statLabel: "r", rawData: { x, y, lx: metricLabels[mX], ly: metricLabels[mY] } };
        } else if (currentTest === "normality") {
            const v = data.map(c => c[mX]);
            let resNorm;
            if (sub === "shapiro") resNorm = StatHelpers.shapiroWilk(v);
            else if (sub === "ks") resNorm = StatHelpers.kolmogorovSmirnov(v);
            else if (sub === "anderson") resNorm = StatHelpers.andersonDarling(v);
            else resNorm = StatHelpers.jarqueBera(v);
            
            res = { 
                ...res, 
                stat: (resNorm.w || resNorm.d || resNorm.a2 || resNorm.jb).toFixed(4), 
                p: formatPValue(resNorm.p), 
                df: sub === "jarque_bera" ? 2 : data.length,
                statLabel: sub === "shapiro" ? "W" : sub === "ks" ? "D" : sub === "anderson" ? "A²" : "JB", 
                rawData: { v, l: metricLabels[mX] } 
            };
        } else if (currentTest === "non_parametric") {
            if (isPaired) {
                const x = data.map(c => c[mX]), y = data.map(c => c[mY]);
                if (sub === "wilcoxon") {
                    const ws = StatHelpers.wilcoxonSignedRank(x, y);
                    res = { ...res, stat: ws.w.toFixed(2), p: formatPValue(ws.p), statLabel: "W", rawData: { groups: [x, y], labels: [metricLabels[mX], metricLabels[mY]] } };
                } else if (sub === "friedman") {
                    const z = data.map(c => c[gV] || (c[mX] + c[mY])/2); // Fallback metric Z
                    const matrix = x.map((_, i) => [x[i], y[i], z[i]]);
                    const fr = StatHelpers.friedman(matrix);
                    res = { ...res, stat: fr.q.toFixed(4), p: formatPValue(fr.p), df: fr.df, statLabel: "Q", rawData: { groups: [x, y, z], labels: [metricLabels[mX], metricLabels[mY], "Control"] } };
                }
            } else {
                const threshold = testState.groupThreshold || ss.median(data.map(c => c[gV]));
                const g1 = data.filter(c => c[gV] >= threshold).map(c => c[mX]);
                const g2 = data.filter(c => c[gV] < threshold).map(c => c[mX]);
                if (sub === "mann_whitney") {
                    const mw = StatHelpers.mannWhitney(g1, g2);
                    res = { ...res, stat: mw.u.toFixed(2), p: formatPValue(mw.p), statLabel: "U", rawData: { groups:[g1, g2], labels: ["High Group", "Low Group"] } };
                } else if (sub === "kruskal") {
                    const vals = data.map(c => c[gV]).sort((a,b) => a - b);
                    const q1 = vals[Math.floor(vals.length / 3)];
                    const q2 = vals[Math.floor(vals.length * 2 / 3)];
                    const grp1 = data.filter(c => c[gV] < q1).map(c => c[mX]);
                    const grp2 = data.filter(c => c[gV] >= q1 && c[gV] < q2).map(c => c[mX]);
                    const grp3 = data.filter(c => c[gV] >= q2).map(c => c[mX]);
                    const kw = StatHelpers.kruskalWallis([grp1, grp2, grp3]);
                    res = { ...res, stat: kw.h.toFixed(4), p: formatPValue(kw.p), df: kw.df, statLabel: "H", rawData: { groups: [grp1, grp2, grp3], labels: ["Low", "Mid", "High"] } };
                }
            }
        }

        res.isSignificant = parseFloat(res.p.replace("<", "")) < 0.05;
        testState.results = res;
        
        steps.compute.classList.remove("active");
        steps.compute.classList.add("completed");
        steps.compute.querySelector(".step-indicator-v").innerHTML = SVG_ICONS.check;
        document.getElementById("details_compute").innerHTML = `Synthesis complete for <strong>${res.testName}</strong>.`;

        const nextBtn = document.getElementById("nextBtn");
        nextBtn.disabled = false;
        nextBtn.textContent = "Synthesize Findings";

    } catch (e) {
        console.error("Statistical Calculation Error:", e);
        showToast(e.message, "error");
        renderStep(); // Reset to current step
    }
}

function checkNormali(v, label) {
    const mean = ss.mean(v), sd = ss.standardDeviation(v);
    const ratio = v.filter(x => Math.abs(x - mean) <= 2 * sd).length / v.length;
    return { passed: ratio > 0.9, score: ratio.toFixed(3), label };
}

function formatPValue(p) {
    if (p < 0.00001) return "< 0.00001";
    return p.toFixed(5);
}

// =========================================
// STATISTICAL HELPERS
// =========================================

const StatHelpers = {
    // Rank data for non-parametric tests
    rank: (arr) => {
        const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
        const ranks = Array(arr.length);
        for (let i = 0; i < sorted.length; i++) {
            let j = i;
            while (j + 1 < sorted.length && sorted[j + 1].v === sorted[i].v) j++;
            const avgRank = (i + j) / 2 + 1;
            for (let k = i; k <= j; k++) ranks[sorted[k].i] = avgRank;
            i = j;
        }
        return ranks;
    },

    getTiesAdjustment: (arr) => {
        const counts = {};
        arr.forEach(v => counts[v] = (counts[v] || 0) + 1);
        let adjustment = 0;
        Object.values(counts).forEach(t => {
            if (t > 1) adjustment += (Math.pow(t, 3) - t);
        });
        return adjustment;
    },

    getKendallTies: (arr) => {
        const counts = {};
        arr.forEach(v => counts[v] = (counts[v] || 0) + 1);
        let ties = 0;
        Object.values(counts).forEach(t => {
            if (t > 1) ties += t * (t - 1) / 2;
        });
        return ties;
    },

    // Spearman Rank Correlation
    spearman: (x, y) => {
        const rx = StatHelpers.rank(x);
        const ry = StatHelpers.rank(y);
        return ss.sampleCorrelation(rx, ry);
    },

    // Kendall's Tau-b (Handles ties correctly)
    kendallTau: (x, y) => {
        let n = x.length;
        let concordant = 0, discordant = 0;
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const xDiff = x[i] - x[j];
                const yDiff = y[i] - y[j];
                const prod = xDiff * yDiff;
                if (prod > 0) concordant++;
                else if (prod < 0) discordant++;
            }
        }
        const totalPairs = n * (n - 1) / 2;
        const tx = StatHelpers.getKendallTies(x);
        const ty = StatHelpers.getKendallTies(y);
        const denom = Math.sqrt((totalPairs - tx) * (totalPairs - ty));
        const tau = denom === 0 ? 0 : (concordant - discordant) / denom;
        
        // Z-approximation for p-value (standard for large n)
        const z = tau * Math.sqrt((9 * n * (n + 1)) / (2 * (2 * n + 5)));
        const p = 2 * jStat.normal.cdf(-Math.abs(z), 0, 1);
        return { tau, p, z };
    },

    // Partial Correlation r(xy.z)
    partialCorr: (x, y, z) => {
        const rxy = ss.sampleCorrelation(x, y);
        const rxz = ss.sampleCorrelation(x, z);
        const ryz = ss.sampleCorrelation(y, z);
        const denom = Math.sqrt((1 - rxz * rxz) * (1 - ryz * ryz));
        if (denom === 0) return 0;
        return (rxy - rxz * ryz) / denom;
    },

    // Distance Correlation (dCor) with O(n^2) optimization and Gamma P-value
    distanceCorr: (x, y) => {
        const n = x.length;
        if (n < 2) return { r: 0, p: 1 };
        
        // Fast Double Centering without O(n^3) or heavy memory overhead
        const getCentered = (arr) => {
            const mat = new Float64Array(n * n);
            const rowMeans = new Float64Array(n);
            let grandTotal = 0;
            
            for (let i = 0; i < n; i++) {
                let rowSum = 0;
                for (let j = 0; j < n; j++) {
                    const d = Math.abs(arr[i] - arr[j]);
                    mat[i * n + j] = d;
                    rowSum += d;
                }
                rowMeans[i] = rowSum / n;
                grandTotal += rowSum;
            }
            const grandMean = grandTotal / (n * n);
            
            for (let i = 0; i < n; i++) {
                const rowOffset = i * n;
                const rm = rowMeans[i];
                for (let j = 0; j < n; j++) {
                    mat[rowOffset + j] -= (rm + rowMeans[j] - grandMean);
                }
            }
            return mat;
        };

        const A = getCentered(x);
        const B = getCentered(y);
        
        let dCov2 = 0, dVarX2 = 0, dVarY2 = 0;
        const totalSize = n * n;
        for (let i = 0; i < totalSize; i++) {
            const aVal = A[i], bVal = B[i];
            dCov2 += aVal * bVal;
            dVarX2 += aVal * aVal;
            dVarY2 += bVal * bVal;
        }
        
        const dCov = Math.sqrt(Math.max(0, dCov2 / totalSize));
        const dVarX = Math.sqrt(Math.max(0, dVarX2 / totalSize));
        const dVarY = Math.sqrt(Math.max(0, dVarY2 / totalSize));
        
        const dCor = (dVarX * dVarY === 0) ? 0 : dCov / (dVarX * dVarY);
        
        // Gamma Approximation for P-value (approximate null distribution of n*dCov)
        const stat = n * dCov;
        const alpha = 0.5 * (n - 1); 
        const theta = 2.0 / (n - 1);
        const p = 1 - jStat.gamma.cdf(stat, alpha, theta);
        
        return { r: dCor, p: Math.max(0, Math.min(1, p)) };
    },

    // ANOVA One-Way
    anovaOneWay: (groups) => {
        const k = groups.length;
        const flat = groups.flat();
        const n = flat.length;
        const grandMean = ss.mean(flat);
        
        let ssBetween = 0;
        let ssWithin = 0;
        
        groups.forEach(g => {
            const m = ss.mean(g);
            ssBetween += g.length * Math.pow(m - grandMean, 2);
            g.forEach(v => {
                ssWithin += Math.pow(v - m, 2);
            });
        });
        
        const dfB = k - 1;
        const dfW = n - k;
        const msB = ssBetween / dfB;
        const msW = ssWithin / dfW;
        const f = msB / msW;
        const p = 1 - jStat.centralF.cdf(f, dfB, dfW);
        
        return { f, p, dfB, dfW, ssB: ssBetween, ssW: ssWithin };
    },

    // Mann-Whitney U
    mannWhitney: (g1, g2) => {
        const n1 = g1.length;
        const n2 = g2.length;
        const combined = [...g1.map(v => ({v, g:1})), ...g2.map(v => ({v, g:2}))];
        combined.sort((a, b) => a.v - b.v);
        
        const ranks = StatHelpers.rank(combined.map(d => d.v));
        let r1 = 0;
        combined.forEach((d, i) => { if (d.g === 1) r1 += ranks[i]; });
        
        const u1 = n1 * n2 + (n1 * (n1 + 1) / 2) - r1;
        const u2 = n1 * n2 - u1;
        const u = Math.min(u1, u2);
        
        const ties = StatHelpers.getTiesAdjustment(combined.map(d => d.v));
        const mu = (n1 * n2) / 2;
        const n = n1 + n2;
        let sigma;
        if (ties === 0) {
            sigma = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
        } else {
            sigma = Math.sqrt((n1 * n2 / (n * (n - 1))) * ((Math.pow(n, 3) - n) / 12 - ties / 12));
        }

        if (sigma === 0) return { u, z: 0, p: 1.0 };

        // Continuity Correction (0.5)
        const diff = u - mu;
        const correctedDiff = diff > 0 ? diff - 0.5 : (diff < 0 ? diff + 0.5 : 0);
        const z = correctedDiff / sigma;
        
        const p = 2 * jStat.normal.cdf(-Math.abs(z), 0, 1);
        
        return { u, z, p };
    },

    // Kruskal-Wallis
    kruskalWallis: (groups) => {
        const k = groups.length;
        const flat = groups.map((g, i) => g.map(v => ({v, g:i}))).flat();
        const n = flat.length;
        flat.sort((a, b) => a.v - b.v);
        
        const ranks = StatHelpers.rank(flat.map(d => d.v));
        const groupRanks = Array(k).fill(0);
        flat.forEach((d, i) => { groupRanks[d.g] += ranks[i]; });
        
        let sumSquaredRanks = 0;
        groupRanks.forEach((r, i) => { sumSquaredRanks += Math.pow(r, 2) / groups[i].length; });
        
        let h = (12 / (n * (n + 1))) * sumSquaredRanks - 3 * (n + 1);
        
        const ties = StatHelpers.getTiesAdjustment(flat.map(d => d.v));
        if (ties > 0) {
            h /= (1 - ties / (Math.pow(n, 3) - n));
        }

        const df = k - 1;
        const p = 1 - jStat.chisquare.cdf(h, df);
        
        return { h, p, df };
    },

    // Jarque-Bera Normality Test (Using Population Moments)
    jarqueBera: (v) => {
        const n = v.length;
        const m = ss.mean(v);
        
        let m2 = 0, m3 = 0, m4 = 0;
        v.forEach(x => {
            const diff = x - m;
            m2 += Math.pow(diff, 2);
            m3 += Math.pow(diff, 3);
            m4 += Math.pow(diff, 4);
        });
        
        m2 /= n; m3 /= n; m4 /= n;
        
        const skewness = m3 / Math.pow(m2, 1.5);
        const kurtosis = m4 / Math.pow(m2, 2);
        
        const jb = (n / 6) * (Math.pow(skewness, 2) + 0.25 * Math.pow(kurtosis - 3, 2));
        const p = 1 - jStat.chisquare.cdf(jb, 2);
        
        return { jb, p, skewness, kurtosis };
    },

    // Wilcoxon Signed-Rank (Paired, with tie correction)
    wilcoxonSignedRank: (x, y) => {
        const diffs = x.map((v, i) => v - y[i]).filter(d => d !== 0);
        const absDiffs = diffs.map(Math.abs);
        const ranks = StatHelpers.rank(absDiffs);
        let wPositive = 0;
        diffs.forEach((d, i) => { if (d > 0) wPositive += ranks[i]; });
        
        const n = diffs.length;
        const wMean = n * (n + 1) / 4;
        const tiesAdjustment = StatHelpers.getTiesAdjustment(absDiffs);
        const wStd = Math.sqrt((n * (n + 1) * (2 * n + 1) / 24) - (tiesAdjustment / 48));
        
        if (wStd === 0) return { w: wPositive, z: 0, p: 1.0 };

        // Continuity Correction (0.5)
        const diff = wPositive - wMean;
        const correctedDiff = diff > 0 ? diff - 0.5 : (diff < 0 ? diff + 0.5 : 0);
        const z = correctedDiff / wStd;

        const p = 2 * jStat.normal.cdf(-Math.abs(z), 0, 1);
        return { w: wPositive, z, p };
    },

    // Friedman Test (with block-level tie correction)
    friedman: (matrix) => {
        const n = matrix.length; 
        const k = matrix[0].length; 
        const ranks = matrix.map(row => StatHelpers.rank(row));
        const colRankSums = Array(k).fill(0);
        
        let tieSum = 0;
        ranks.forEach(row => {
            row.forEach((r, j) => { colRankSums[j] += r; });
            // Calculate ties within this block (row)
            const counts = {};
            row.forEach(r => counts[r] = (counts[r] || 0) + 1);
            Object.values(counts).forEach(c => {
                if (c > 1) tieSum += (Math.pow(c, 3) - c);
            });
        });

        let sumSquaredRanks = 0;
        colRankSums.forEach(s => { sumSquaredRanks += Math.pow(s, 2); });
        
        const qUnadjusted = (12 / (n * k * (k + 1))) * sumSquaredRanks - 3 * n * (k + 1);
        const tcf = 1 - (tieSum / (n * k * (Math.pow(k, 2) - 1)));
        
        const q = tcf > 0 ? qUnadjusted / tcf : qUnadjusted;
        const p = 1 - jStat.chisquare.cdf(q, k - 1);
        return { q, p, df: k - 1 };
    },

    // Repeated Measures ANOVA (Properly partitioned variance)
    anovaRepeatedMeasures: (matrix) => {
        const n = matrix.length; // Number of subjects
        const k = matrix[0].length; // Number of treatments
        const flat = matrix.flat();
        const grandMean = ss.mean(flat);
        const ssTotal = ss.sum(flat.map(v => Math.pow(v - grandMean, 2)));

        const treatMeans = Array(k).fill(0).map((_, j) => ss.mean(matrix.map(row => row[j])));
        const ssTreat = n * ss.sum(treatMeans.map(m => Math.pow(m - grandMean, 2)));

        const subMeans = matrix.map(row => ss.mean(row));
        const ssSub = k * ss.sum(subMeans.map(m => Math.pow(m - grandMean, 2)));

        const ssError = ssTotal - ssTreat - ssSub;
        const dfTreat = k - 1;
        const dfSub = n - 1;
        const dfError = (k - 1) * (n - 1);

        const msTreat = ssTreat / dfTreat;
        const msError = ssError / dfError;
        const f = msTreat / msError;
        const p = 1 - jStat.centralF.cdf(f, dfTreat, dfError);

        return { f, p, df: `${dfTreat}, ${dfError}`, ssTreat, ssSub, ssError, ssTotal };
    },

    // Kolmogorov-Smirnov Test
    kolmogorovSmirnov: (v) => {
        const n = v.length;
        const sorted = [...v].sort((a, b) => a - b);
        const m = ss.mean(v);
        const s = ss.sampleStandardDeviation(v);
        
        let d = 0;
        for (let i = 0; i < n; i++) {
            const sn = (i + 1) / n;
            const snPrev = i / n;
            const fx = jStat.normal.cdf(sorted[i], m, s);
            d = Math.max(d, Math.abs(sn - fx), Math.abs(snPrev - fx));
        }
        
        // Approximate p-value for K-S
        const s_val = (Math.sqrt(n) + 0.12 + 0.11 / Math.sqrt(n)) * d;
        let p = 0;
        if (s_val > 0) {
            let sum = 0;
            for (let k = 1; k <= 10; k++) {
                sum += Math.pow(-1, k - 1) * Math.exp(-2 * k * k * s_val * s_val);
            }
            p = 2 * sum;
        } else { p = 1; }
        p = Math.min(1, Math.max(0, p));
        
        return { d, p };
    },

    // Anderson-Darling Test
    andersonDarling: (v) => {
        const n = v.length;
        const m = ss.mean(v);
        const s = ss.sampleStandardDeviation(v);
        const sorted = [...v].sort((a, b) => a - b);
        
        let sum = 0;
        for (let i = 1; i <= n; i++) {
            const f1 = jStat.normal.cdf(sorted[i-1], m, s);
            const f2 = jStat.normal.cdf(sorted[n-i], m, s);
            sum += (2 * i - 1) * (Math.log(f1) + Math.log(1 - f2));
        }
        
        const a2 = -n - (sum / n);
        const a2Mod = a2 * (1 + 0.75/n + 2.25/(n*n)); // Adjusted A2 for normality
        
        let p;
        if (a2Mod >= 0.6) p = Math.exp(1.2937 - 5.709 * a2Mod + 0.0186 * Math.pow(a2Mod, 2));
        else if (a2Mod >= 0.34) p = Math.exp(0.9177 - 4.279 * a2Mod - 1.38 * Math.pow(a2Mod, 2));
        else if (a2Mod >= 0.2) p = 1 - Math.exp(-8.318 + 42.796 * a2Mod - 59.938 * Math.pow(a2Mod, 2));
        else p = 1 - Math.exp(-13.436 + 101.14 * a2Mod - 223.73 * Math.pow(a2Mod, 2));
        
        return { a2, p };
    },

    // Shapiro-Wilk Implementation (Royston Approximation for p-values)
    shapiroWilk: (v) => {
        const n = v.length;
        if (n < 3) return { w: 0, p: 0 };
        const sorted = [...v].sort((a,b) => a-b);
        const mean = ss.mean(v);
        const s2 = ss.sum(v.map(x => Math.pow(x - mean, 2)));
        if (s2 === 0) return { w: 1, p: 1 };

        // Blom's approximation for expected normal order statistics
        const m = sorted.map((_, i) => jStat.normal.inv((i + 1 - 0.375) / (n + 0.25), 0, 1));
        const mSumSq = ss.sum(m.map(x => x*x));
        const mSqrt = Math.sqrt(mSumSq);
        const a = m.map(x => x / mSqrt);
        
        // Calculate W statistic
        let numerator = 0;
        for (let i = 0; i < n; i++) numerator += a[i] * sorted[i];
        const w = Math.pow(numerator, 2) / s2;
        
        // Royston approximation for p-value (Full Polynomial for N > 50)
        const y = Math.log(1 - w);
        const nl = Math.log(n);
        let mu, sigma;
        
        if (n <= 11) {
            mu = -2.273 + 0.459 * nl;
            sigma = Math.exp(-0.353) * Math.pow(n, -0.15); // Simple approx for small N
        } else {
            // Full Royston Polynomials for N > 11
            mu = 0.0038915 * Math.pow(nl, 3) - 0.083751 * Math.pow(nl, 2) - 0.31082 * nl - 1.5861;
            sigma = Math.exp(0.0030302 * Math.pow(nl, 3) - 0.082676 * Math.pow(nl, 2) - 0.4803 * nl);
        }
        
        const z = (y - mu) / sigma;
        const p = 1 - jStat.normal.cdf(z, 0, 1);
        
        return { w: Math.min(1, w), p: Math.min(1, Math.max(0, p)) };
    },

    // Two-Way ANOVA (Factorial with Interaction)
    anovaTwoWay: (data, factorA, factorB) => {
        const n = data.length;
        const uniqueA = [...new Set(factorA)], uniqueB = [...new Set(factorB)];
        const kA = uniqueA.length, kB = uniqueB.length;
        const grandMean = ss.mean(data);
        const ssTotal = ss.sum(data.map(v => Math.pow(v - grandMean, 2)));

        let ssA = 0;
        uniqueA.forEach(a => {
            const group = data.filter((_, i) => factorA[i] === a);
            ssA += group.length * Math.pow(ss.mean(group) - grandMean, 2);
        });

        let ssB = 0;
        uniqueB.forEach(b => {
            const group = data.filter((_, i) => factorB[i] === b);
            ssB += group.length * Math.pow(ss.mean(group) - grandMean, 2);
        });

        let ssInside = 0;
        uniqueA.forEach(a => {
            uniqueB.forEach(b => {
                const group = data.filter((_, i) => factorA[i] === a && factorB[i] === b);
                if (group.length > 0) {
                    const m = ss.mean(group);
                    ssInside += group.length * Math.pow(m - grandMean, 2);
                }
            });
        });

        const ssInteraction = ssInside - ssA - ssB;
        
        let ssError = 0;
        uniqueA.forEach(a => {
            uniqueB.forEach(b => {
                const group = data.filter((_, i) => factorA[i] === a && factorB[i] === b);
                if (group.length > 0) {
                    const m = ss.mean(group);
                    group.forEach(v => ssError += Math.pow(v - m, 2));
                }
            });
        });

        const dfA = kA - 1, dfB = kB - 1, dfInt = (kA - 1) * (kB - 1);
        const dfError = n - (kA * kB);
        const fA = (ssA / dfA) / (ssError / dfError);
        const fB = (ssB / dfB) / (ssError / dfError);
        const fInt = (ssInteraction / dfInt) / (ssError / dfError);
        
        return { 
            fA, pA: 1 - jStat.centralF.cdf(fA, dfA, dfError), 
            fB, pB: 1 - jStat.centralF.cdf(fB, dfB, dfError),
            fInt, pInt: 1 - jStat.centralF.cdf(fInt, dfInt, dfError),
            dfA, dfB, dfInt, dfError 
        };
    }
};

function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

// =========================================
// RESULTS & VISUALIZATION
// =========================================

function renderResultsStep(config) {
    const res = testState.results || { stat: 0, p: 1.0, testName: "N/A", statLabel: "Stat" };
    const isSig = res.isSignificant;

    document.getElementById("stepContent").innerHTML = `
        <div class="step-view animate-in">
            <div class="analytical-dashboard">
                <div class="dashboard-header ${isSig ? (testState.violation ? 'warning' : 'sig') : 'non-sig'}">
                    <div class="sig-status">
                         <div class="sig-indicator ${isSig ? (testState.violation ? 'warning' : 'sig') : 'non-sig'}"></div>
                        <div class="sig-text ${isSig ? (testState.violation ? 'warning' : 'sig') : 'non-sig'}">
                            ${res.testName}: ${testState.violation ? 'Significant results with assumption caveats' : (isSig ? 'Significant evidence found' : 'No significant evidence detected')}
                        </div>
                    </div>
                    <div class="dashboard-header-actions">
                        ${testState.violation ? `
                            <div class="methodology-alert">
                                ${SVG_ICONS.alert} Assumption Violation: Non-Normal Distribution
                            </div>
                        ` : ''}
                        <button class="stats-btn secondary interpret-btn" onclick="showInterpretationModal()">
                            ${SVG_ICONS.info} Interpret Results
                        </button>
                        <div class="p-value-display">
                            <div class="p-value-label">Probability (p-value) <button class="info-btn" onclick="showInterpretationModal('p-value')">i</button></div>
                            <div class="p-value-val" style="color:${isSig ? (testState.violation ? '#c2410c' : '#059669') : '#1e293b'}">p = ${res.p}</div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-stats-bar">
                    ${res.pA !== undefined ? `
                        <div class="stat-metric">
                            <span class="label">Effect A (Main) <button class="info-btn" onclick="showInterpretationModal('subtest_info', 'mainA')">i</button></span>
                            <span class="value">F=${res.fA.toFixed(3)}, p=${formatPValue(res.pA)}</span>
                        </div>
                        <div class="stat-metric">
                            <span class="label">Effect B (Main) <button class="info-btn" onclick="showInterpretationModal('subtest_info', 'mainB')">i</button></span>
                            <span class="value">F=${res.fB.toFixed(3)}, p=${formatPValue(res.pB)}</span>
                        </div>
                        <div class="stat-metric">
                            <span class="label">Interaction <button class="info-btn" onclick="showInterpretationModal('subtest_info', 'interaction')">i</button></span>
                            <span class="value">F=${res.fInt.toFixed(3)}, p=${formatPValue(res.pInt)}</span>
                        </div>
                    ` : `
                        <div class="stat-metric">
                            <span class="label">Observed ${res.statLabel} <button class="info-btn" onclick="showInterpretationModal('stat')">i</button></span>
                            <span class="value">${res.stat}</span>
                        </div>
                        <div class="stat-metric">
                            <span class="label">Sample Info <button class="info-btn" onclick="showInterpretationModal('df')">i</button></span>
                            <span class="value">${res.df !== undefined ? 'df=' + res.df : 'N=' + res.sampleSize}</span>
                        </div>
                        <div class="stat-metric">
                            <span class="label">Confidence Level <button class="info-btn" onclick="showInterpretationModal('confidence')">i</button></span>
                            <span class="value">95.0%</span>
                        </div>
                    `}
                </div>

                <div class="dashboard-viz-stack">
                    <div class="viz-panel">
                        <div class="viz-title">
                            <span>Statistical Probability Landscape <button class="info-btn" onclick="showInterpretationModal('landscape')">i</button></span>
                            <div class="chart-legend">
                                <div class="legend-item"><span class="legend-color" style="background:var(--stats-primary)"></span> Theoretical Model</div>
                                <div class="legend-item"><span class="legend-color" style="background:#1e293b; border: 1px dashed #64748b"></span> Observed Statistic</div>
                            </div>
                        </div>
                        <div id="distributionChartArea" style="height: 280px;"></div>
                    </div>

                    <div class="viz-divider"></div>

                    <div class="viz-panel">
                        <div class="viz-title">
                            <span>Observed Empirical Evidence <button class="info-btn" onclick="showInterpretationModal('empirical')">i</button></span>
                            <div class="chart-legend" id="empiricalLegend"></div>
                        </div>
                        <div id="observationChartArea" style="height: 320px;"></div>
                    </div>
                </div>
            </div>

            <div class="hypothesis-context-card" style="margin-top: 24px; padding: 20px; background: white; border: 1px solid #e2e8f0; border-radius: 12px;">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px;">
                    <div>
                        <div style="font-size: 0.7rem; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.05em;">Null Hypothesis ($H_0$)</div>
                        <div id="nullHypo" style="font-size: 0.9rem; color: #1e293b; line-height: 1.5;"></div>
                    </div>
                    <div>
                        <div style="font-size: 0.7rem; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.05em;">Alternative Hypothesis ($H_1$)</div>
                        <div id="altHypo" style="font-size: 0.9rem; color: #1e293b; line-height: 1.5;"></div>
                    </div>
                </div>
            </div>

            <div class="interpretation-card" style="margin-top: 16px; border:none; background:#f8fafc;">
                <h3 class="section-title-sm" style="margin-bottom:12px;">Analytical Conclusion</h3>
                <p class="interpretation-text" id="conclusionText"></p>
            </div>
        </div>
    `;

    // Dynamic Hypothesis & Conclusion
    const nullH = document.getElementById("nullHypo");
    const altH = document.getElementById("altHypo");
    const conc = document.getElementById("conclusionText");

    const raw = res.rawData || {};
    const lx = raw.lx || "Metric X";
    const ly = raw.ly || "Metric Y";
    const l1 = raw.l1 || raw.labels?.[0] || "Group 1";
    const l2 = raw.l2 || raw.labels?.[1] || "Group 2";

    if (res.type === 'normality') {
        const lv = raw.l || "Target Metric";
        nullH.textContent = `The variable ${lv} follows a standard normal distribution pattern.`;
        altH.textContent = `The distribution of ${lv} significantly deviates from normality (skewed or heavy-tailed).`;
    } else if (res.type === 'correlation') {
        const isPartial = testState.selectedSubtest === 'partial';
        nullH.textContent = isPartial 
            ? `There is no significant association between ${lx} and ${ly} after controlling for population size.`
            : `There is no significant association between ${lx} and ${ly} in the analyzed regions.`;
        altH.textContent = isPartial
            ? `A significant association exists between ${lx} and ${ly}, independent of the influence of population density/size.`
            : `A statistically significant relationship exists between ${lx} and ${ly}, suggesting the variables move together.`;
    } else if (res.type === 'ttest' || res.type === 'non_parametric') {
        nullH.textContent = `There is no significant difference in ${lx} levels between the ${l1} and ${l2} cohorts.`;
        altH.textContent = `A statistically significant difference exists, suggesting ${lx} is impacted by ${raw.labels ? 'group membership' : 'threshold levels'}.`;
    } else if (res.type === 'multi') {
        nullH.textContent = `There are no significant differences in ${lx} across the analyzed groups or conditions.`;
        altH.textContent = `At least one group or condition shows a statistically significant deviation in ${lx} levels.`;
    } else {
        nullH.textContent = "The null hypothesis states no effect or no difference exists.";
        altH.textContent = "The alternative hypothesis states a significant effect or difference exists.";
    }

    // Contextual Conclusion Synthesis
    let conclusionHTML = '';
    if (isSig) {
        if (testState.violation) {
            conclusionHTML += `<strong>Methodological Caveat:</strong> While results reach significance, the underlying data significantly violates normality. Consider the non-parametric results for a more robust interpretation. <br><br>`;
        }
        
        if (res.type === 'correlation') {
            const isPartial = testState.selectedSubtest === 'partial';
            const r = parseFloat(res.stat);
            const r2 = (r * r * 100).toFixed(1);
            const direction = r > 0 ? "positive" : "negative";
            const strength = Math.abs(r) > 0.7 ? "strong" : (Math.abs(r) > 0.4 ? "moderate" : "weak");
            
            if (isPartial) {
                conclusionHTML += `Evidence suggests a <strong>${strength} ${direction} partial correlation</strong> between ${lx} and ${ly}. This indicates a direct relationship that persists even when population size is held constant.`;
            } else {
                conclusionHTML += `Evidence suggests a <strong>${strength} ${direction} correlation</strong> between ${lx} and ${ly}. This relationship accounts for approximately <strong>${r2}%</strong> of the shared variance in the dataset.`;
            }
        } else if (res.type === 'ttest' || res.type === 'non_parametric') {
            const diff = raw.m1 - raw.m2;
            const direction = diff > 0 ? "higher" : "lower";
            conclusionHTML += `The data provides strong evidence that <strong>${l1}</strong> has significantly <strong>${direction}</strong> ${lx} levels compared to <strong>${l2}</strong>. The effect is unlikely to be a result of sampling error.`;
        } else if (res.type === 'normality') {
            conclusionHTML += `The data for <strong>${raw.l || 'this metric'}</strong> shows a significant departure from normality. Standard parametric assumptions may not hold, warranting more robust non-parametric analysis.`;
        } else {
            conclusionHTML += `The results provide strong evidence to <strong>reject the null hypothesis</strong>. The observed signals are statistically distinguishable from random variation.`;
        }
        
        if (res.pInt !== undefined && res.pInt < 0.05) {
            conclusionHTML += `<br><br><strong>Interaction Detected:</strong> A significant interaction effect was found, meaning the impact of one factor depends on the level of the other.`;
        }
    } else {
        conclusionHTML = `We <strong>fail to reject the null hypothesis</strong> ($p = ${res.p}$). The observed patterns do not meet the threshold for statistical certainty and may thrive within the boundaries of random chance.`;
    }

    conc.innerHTML = conclusionHTML;

    renderMath(document.getElementById("stepContent"));

    setTimeout(() => {
        drawDistributionPlot(res);
        drawObservationPlot(res);
    }, 100);
}

function drawDistributionPlot(res) {
    const container = document.getElementById("distributionChartArea");
    if (!container) return;

    const w = container.clientWidth, h = 240, padding = 45;
    const df1 = res.df && typeof res.df === 'string' && res.df.includes(',') ? parseFloat(res.df.split(',')[0]) : (parseFloat(res.df) || 100);
    const df2 = res.df && typeof res.df === 'string' && res.df.includes(',') ? parseFloat(res.df.split(',')[1]) : 100;

    // Determine target value for plotting
    let observedX = parseFloat(res.stat.toString().replace(/[^\d.-]/g, ''));
    if (isNaN(observedX)) observedX = 0;

    const getPdf = (x) => {
        if (res.statLabel === 'F') return jStat.centralF.pdf(x, df1, df2);
        if (['H', 'Stat', 'JB', 'Q', 'Stat'].includes(res.statLabel)) return jStat.chisquare.pdf(x, df1 || 2);
        if (res.statLabel === 't' || res.statLabel === 'r') return jStat.studentt.pdf(x, df1);
        return jStat.normal.pdf(x, 0, 1);
    };

    const isOneTailed = ['F', 'H', 'Stat', 'JB', 'U', 'Q'].includes(res.statLabel);
    
    let xMin, xMax;
    if (isOneTailed) {
        xMin = 0;
        xMax = Math.max(10, observedX * 1.5);
    } else {
        const xRangeLimit = Math.max(4, Math.ceil(Math.abs(observedX) * 1.2));
        xMin = -xRangeLimit; xMax = xRangeLimit;
    }

    const xScale = x => padding + (x - xMin) / (xMax - xMin) * (w - 2 * padding);
    const yScale = y => h - padding - (y / 0.5) * (h - 2 * padding);

    let curvePath = `M ${xScale(xMin)} ${yScale(getPdf(xMin))}`;
    const steps = 150;
    for (let i = 1; i <= steps; i++) {
        const x = xMin + (i / steps) * (xMax - xMin);
        curvePath += ` L ${xScale(x)} ${yScale(getPdf(x))}`;
    }

    let svgContent = `<svg class="dist-svg" width="${w}" height="${h}" style="overflow:visible">
        <defs>
            <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:var(--stats-primary);stop-opacity:0.2" />
                <stop offset="100%" style="stop-color:var(--stats-primary);stop-opacity:0" />
            </linearGradient>
        </defs>
        <line x1="${padding}" y1="${h - padding}" x2="${w - padding}" y2="${h - padding}" class="dist-axis" />
    `;

    // Shade P-Value Density
    const buildTailPath = (start, end) => {
        let path = `M ${xScale(start)} ${h - padding}`;
        const s = Math.min(start, end), e = Math.max(start, end);
        const step = (e - s) / 30;
        for (let x = s; x <= e; x += step) {
            path += ` L ${xScale(x)} ${yScale(getPdf(x))}`;
        }
        path += ` L ${xScale(end)} ${h - padding} Z`;
        return path;
    };

    if (isOneTailed) {
        svgContent += `<path d="${buildTailPath(observedX, xMax)}" fill="url(#areaGrad)" />`;
    } else {
        const absX = Math.abs(observedX);
        svgContent += `<path d="${buildTailPath(xMin, -absX)}" fill="url(#areaGrad)" />`;
        svgContent += `<path d="${buildTailPath(absX, xMax)}" fill="url(#areaGrad)" />`;
    }

    // Observed Stat Line
    const obsXPos = xScale(observedX);
    if (obsXPos >= padding && obsXPos <= w - padding) {
        svgContent += `
            <line x1="${obsXPos}" y1="${h - padding}" x2="${obsXPos}" y2="${padding}" class="dist-line-stat" />
            <circle cx="${obsXPos}" cy="${yScale(getPdf(observedX))}" r="4" fill="#1e293b" />
        `;
    }

    svgContent += `<path d="${curvePath}" class="dist-curve" />`;
    svgContent += `</svg>`;
    container.innerHTML = svgContent;
}

function drawObservationPlot(res) {
    const container = document.getElementById("observationChartArea");
    if (!container || !res.rawData) return;
    container.innerHTML = "";

    const legend = document.getElementById("empiricalLegend");
    if (legend) legend.innerHTML = "";

    if (res.type === "correlation") {
        drawCorrelationObs(container, res.rawData);
        if (legend) legend.innerHTML = `
            <div class="legend-item"><span class="legend-color" style="background:var(--stats-primary)"></span> Sample Points</div>
            <div class="legend-item"><span class="legend-color" style="background:#1e293b"></span> Regression Trend</div>
        `;
    } else if (res.type === "ttest" || res.type === "non_parametric" || res.type === "multi") {
        const groups = res.rawData.groups || [res.rawData.g1, res.rawData.g2].filter(Boolean);
        const labels = res.rawData.labels || [res.rawData.l1 || "Group 1", res.rawData.l2 || "Group 2"];
        drawGroupComparisonObs(container, groups, labels);
        if (legend) legend.innerHTML = labels.map((l, i) => `
            <div class="legend-item"><span class="legend-color" style="background:${i === 0 ? 'var(--stats-primary)' : i === 1 ? '#64748b' : '#94a3b8'}"></span> ${l}</div>
        `).join("");
    } else {
        drawNormalityObs(container, res.rawData);
        if (legend) legend.innerHTML = `<div class="legend-item"><span class="legend-color" style="background:var(--stats-primary)"></span> Actual Data</div>`;
    }
}

function drawGroupComparisonObs(container, groups, labels) {
    const w = container.clientWidth, h = container.clientHeight, margin = { t: 40, r: 40, b: 60, l: 150 };
    const svg = d3.select(container).append("svg").attr("width", w).attr("height", h)
        .append("g").attr("transform", `translate(${margin.l},${margin.t})`);

    const combined = groups.flat();
    const xDist = d3.extent(combined);
    const xPadding = (xDist[1] - xDist[0]) * 0.1;
    const x = d3.scaleLinear().domain([xDist[0] - xPadding, xDist[1] + xPadding]).range([0, w - margin.l - margin.r]);
    const y = d3.scaleBand().domain(labels).range([0, h - margin.t - margin.b]).padding(0.5);

    svg.append("g").attr("transform", `translate(0,${h - margin.t - margin.b})`).call(d3.axisBottom(x).ticks(8));

    const colors = ["var(--stats-primary)", "#64748b", "#94a3b8", "#cbd5e1"];

    groups.forEach((data, idx) => {
        const label = labels[idx];
        const color = colors[idx % colors.length];
        const rowY = y(label) + y.bandwidth() / 2;

        svg.selectAll(`.dot-${idx}`).data(data).enter().append("circle")
            .attr("cx", d => x(d)).attr("cy", d => rowY + (Math.random() - 0.5) * y.bandwidth() * 0.8)
            .attr("r", 3.5).attr("fill", color).attr("opacity", 0.15);

        const m = ss.mean(data);
        const s = ss.standardDeviation(data);
        svg.append("line").attr("x1", x(m - s)).attr("x2", x(m + s)).attr("y1", rowY).attr("y2", rowY).attr("stroke", color).attr("stroke-width", 2).attr("opacity", 0.3);
        svg.append("line").attr("x1", x(m)).attr("x2", x(m)).attr("y1", rowY - 15).attr("y2", rowY + 15).attr("stroke", "#1e293b").attr("stroke-width", 3);
        svg.append("text").attr("x", -15).attr("y", rowY + 4).attr("text-anchor", "end").attr("font-size", "0.7rem").attr("font-weight", 800).attr("fill", "#1e293b").text(label);
    });
}

function drawCorrelationObs(container, data) {
    const { x, y, lx, ly } = data;
    const w = container.clientWidth, h = container.clientHeight, margin = { t: 20, r: 25, b: 45, l: 50 };

    const svg = d3.select(container).append("svg").attr("width", w).attr("height", h);

    // Add clipping path
    const clipId = `clip-${Math.random().toString(36).substr(2, 9)}`;
    const plotWidth = w - margin.l - margin.r;
    const plotHeight = h - margin.t - margin.b;

    svg.append("defs").append("clipPath")
        .attr("id", clipId)
        .append("rect")
        .attr("width", plotWidth)
        .attr("height", plotHeight);

    const mainGroup = svg.append("g").attr("transform", `translate(${margin.l},${margin.t})`);

    // Add 5% padding to domains
    const xExtent = d3.extent(x);
    const yExtent = d3.extent(y);
    const xPad = (xExtent[1] - xExtent[0]) * 0.05;
    const yPad = (yExtent[1] - yExtent[0]) * 0.05;

    const xScale = d3.scaleLinear().domain([xExtent[0] - xPad, xExtent[1] + xPad]).range([0, plotWidth]);
    const yScale = d3.scaleLinear().domain([yExtent[0] - yPad, yExtent[1] + yPad]).range([plotHeight, 0]);

    mainGroup.append("g").attr("transform", `translate(0,${plotHeight})`).call(d3.axisBottom(xScale).ticks(6))
        .append("text").attr("x", plotWidth / 2).attr("y", 35).attr("fill", "#64748b").attr("font-weight", 800).attr("font-size", "10px").text(lx);
    mainGroup.append("g").call(d3.axisLeft(yScale).ticks(6))
        .append("text").attr("transform", "rotate(-90)").attr("y", -35).attr("x", -plotHeight / 2).attr("fill", "#64748b").attr("font-weight", 800).attr("font-size", "10px").attr("text-anchor", "middle").text(ly);

    // Group for clipped elements
    const chartBody = mainGroup.append("g").attr("clip-path", `url(#${clipId})`);

    chartBody.selectAll("circle").data(x).enter().append("circle")
        .attr("cx", (d, i) => xScale(d)).attr("cy", (d, i) => yScale(y[i])).attr("r", 3).attr("fill", "var(--stats-primary)").attr("opacity", 0.4);

    // Regression Line
    const lr = ss.linearRegression(x.map((v, i) => [v, y[i]]));
    const line = ss.linearRegressionLine(lr);

    // Draw line across the entire visible xScale range
    const xRange = xScale.domain();
    chartBody.append("line")
        .attr("x1", xScale(xRange[0]))
        .attr("y1", yScale(line(xRange[0])))
        .attr("x2", xScale(xRange[1]))
        .attr("y2", yScale(line(xRange[1])))
        .attr("stroke", "#1e293b").attr("stroke-width", 2).attr("stroke-dasharray", "4,2");
}

function drawTTestObs(container, data) {
    const { g1, g2, l1, l2 } = data;
    const w = container.clientWidth, h = container.clientHeight, margin = { t: 40, r: 40, b: 60, l: 150 };

    const svg = d3.select(container).append("svg").attr("width", w).attr("height", h)
        .append("g").attr("transform", `translate(${margin.l},${margin.t})`);

    const combined = [...g1, ...g2];
    const xDist = d3.extent(combined);
    const xPadding = (xDist[1] - xDist[0]) * 0.1;
    const x = d3.scaleLinear().domain([xDist[0] - xPadding, xDist[1] + xPadding]).range([0, w - margin.l - margin.r]);
    const y = d3.scaleBand().domain([l1, l2]).range([0, h - margin.t - margin.b]).padding(0.5);

    svg.append("g").attr("transform", `translate(0,${h - margin.t - margin.b})`).call(d3.axisBottom(x).ticks(8).tickSizeOuter(0))
        .attr("font-family", "inherit");

    [{ d: g1, l: l1, c: "var(--stats-primary)" }, { d: g2, l: l2, c: "#64748b" }].forEach(group => {
        const rowY = y(group.l) + y.bandwidth() / 2;

        // Premium Jitter (Normal Distribution Jitter)
        svg.selectAll(`circle.${group.l.replace(/\s/g, '_')}`).data(group.d).enter().append("circle")
            .attr("cx", d => x(d)).attr("cy", d => rowY + (Math.random() - 0.5) * y.bandwidth() * 0.8)
            .attr("r", 3.5).attr("fill", group.c).attr("opacity", 0.15);

        // Mean & 1-SD bounds
        const m = ss.mean(group.d), s = ss.standardDeviation(group.d);

        svg.append("line").attr("x1", x(m - s)).attr("x2", x(m + s)).attr("y1", rowY).attr("y2", rowY).attr("stroke", group.c).attr("stroke-width", 2).attr("opacity", 0.3);
        svg.append("line").attr("x1", x(m)).attr("x2", x(m)).attr("y1", rowY - 15).attr("y2", rowY + 15).attr("stroke", "#1e293b").attr("stroke-width", 3);

        svg.append("text").attr("x", -15).attr("y", rowY + 4).attr("text-anchor", "end").attr("font-size", "0.7rem").attr("font-weight", 800).attr("fill", "#1e293b").text(group.l);
    });
}

function drawNormalityObs(container, data) {
    const { v, l } = data;
    const w = container.clientWidth, h = container.clientHeight, margin = { t: 10, r: 10, b: 30, l: 35 };
    const svg = d3.select(container).append("svg").attr("width", w).attr("height", h).append("g").attr("transform", `translate(${margin.l},${margin.t})`);

    const x = d3.scaleLinear().domain(d3.extent(v)).range([0, w - margin.l - margin.r]);
    const bins = d3.bin().domain(x.domain()).thresholds(30)(v);
    const y = d3.scaleLinear().domain([0, d3.max(bins, d => d.length)]).range([h - margin.t - margin.b, 0]);

    svg.append("g").attr("transform", `translate(0,${h - margin.t - margin.b})`).call(d3.axisBottom(x).ticks(5));
    svg.selectAll("rect").data(bins).enter().append("rect")
        .attr("x", d => x(d.x0) + 1).attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1)).attr("y", d => y(d.length)).attr("height", d => y(0) - y(d.length)).attr("fill", "var(--stats-primary)").attr("opacity", 0.6);
}

document.addEventListener("DOMContentLoaded", init);
// =========================================
// TECHNICAL DOCUMENTATION ENGINE
// =========================================

const TECHNICAL_DOCS = [
    {
        id: "parametric_foundations",
        title: "Parametric Foundations",
        icon: "calculator",
        category: "fundamental",
        summary: "Traditional inferential tests that assume a Gaussian (Normal) distribution of means.",
        intuition: "Think of this as the 'standard' way to compare groups. We assume the data follows a bell curve (Normal distribution), which lets us use very precise math to find differences.",
        bottomLine: "Use these if your data is 'well-behaved' and looks like a bell curve. They are powerful and widely accepted.",
        sections: [
            {
                subtitle: "Student's vs. Welch's T-Test",
                math: "$$t_{Welch} = \\frac{\\bar{X}_1 - \\bar{X}_2}{\\sqrt{\\frac{s_1^2}{n_1} + \\frac{s_2^2}{n_2}}} \\quad \\nu \\approx \\frac{(\\frac{s_1^2}{n_1} + \\frac{s_2^2}{n_2})^2}{\\frac{(s_1^2/n_1)^2}{n_1-1} + \\frac{(s_2^2/n_2)^2}{n_2-1}}$$",
                code: `// Welch's SE and Satterthwaite DF\nconst se = Math.sqrt((s1**2 / n1) + (s2**2 / n2));\nconst df = Math.pow(se, 4) / (Math.pow(s1**2/n1, 2)/(n1-1) + Math.pow(s2**2/n2,2)/(n2-1));`,
                description: "Welch's T-test is the engine's default for independent group comparisons, as it avoids the unreliable 'Equal Variance' assumption inherent in Student's T."
            }
        ],
        authority: "Welch (1947), Satterthwaite (1946)"
    },
    {
        id: "non_parametric_suite",
        title: "Robust Non-Parametric Suite",
        icon: "check",
        category: "fundamental",
        summary: "Methods that use rank-order rather than raw values, making them extremely robust against outliers.",
        intuition: "When your data is messy or has extreme 'outliers' (like one super-wealthy county among many poor ones), bell-curve math fails. These tests ignore the exact numbers and just look at the 'order' (ranks) of the data.",
        bottomLine: "Use these if your data is skewed (not a bell curve) or has extreme values that would throw off a standard average.",
        sections: [
            {
                subtitle: "Mann-Whitney U (Continuity Corrected)",
                math: "$$Z = \\frac{U - \\mu_U \\pm 0.5}{\\sigma_U} \\quad \\sigma_U = \\sqrt{\\frac{n_1 n_2}{12}(n_1 + n_2 + 1 - \\sum \\frac{t_i^3-t_i}{(n_1+n_2)(n_1+n_2-1)})}$$",
                code: `// Z-transform with Tie-Correction and Continuity Correction\nconst sigma = Math.sqrt((n1 * n2 / 12) * (n1 + n2 + 1 - TCF));\nconst z = (u - (n1 * n2 / 2) + 0.5) / sigma;`,
                description: "Our implementation applies a ±0.5 continuity correction and a full tie-adjustment factor (TCF) to ensure valid p-values in sparse datasets."
            },
            {
                subtitle: "Kruskal-Wallis (Multi-Group Rank)",
                math: "$$H = \\frac{12}{N(N+1)} \\sum \\frac{R_j^2}{n_j} - 3(N+1)$$",
                code: `// Kruskal-Wallis H Statistic\nconst h = (12 / (n * (n + 1))) * rankSumSquared - 3 * (n + 1);\nconst p = 1 - jStat.chisquare.cdf(h / TCF, k - 1);`,
                description: "The non-parametric alternative to One-Way ANOVA. It tests whether samples originate from the same distribution using omnidirectional rank variance."
            }
        ],
        authority: "Mann & Whitney (1947), Kruskal & Wallis (1952)"
    },
    {
        id: "distribution_normality",
        title: "Distribution & Normality Audit",
        icon: "database",
        category: "rigor",
        summary: "Mathematical checks to see if your data follows a 'bell curve' pattern.",
        intuition: "Before we run a test, we have to check the 'shape' of your data. Is it a perfect bell curve? Or is it leaning to one side? This audit helps choose the right mathematical framework.",
        bottomLine: "This is a 'sanity check'. If it fails, you should probably use a Non-Parametric test.",
        sections: [
            {
                subtitle: "Shapiro-Wilk (Royston Polynomials)",
                math: "$$W = \\frac{(\\sum a_i x_{(i)})^2}{\\sum (x_i - \\bar{x})^2} \\quad \\text{where for } n > 11: \\mu_{\\ln(1-W)} = \\sum_{j=0}^{3} \\gamma_j \\ln(n)^j$$",
                code: `// Royston Polynomial Expansion for N > 11\nmu = 0.0038915 * nl^3 - 0.083751 * nl^2 - 0.31082 * nl - 1.5861;\nsigma = Math.exp(0.0030302 * nl^3 - 0.082676 * nl^2 - 0.4803 * nl);`,
                description: "Checks if data is normally distributed (bell-shaped). Highly accurate for samples up to 5,000 observations."
            },
            {
                subtitle: "Anderson-Darling (Corrected Step)",
                math: "$$A^2 = -n - \\frac{1}{n} \\sum_{i=1}^n (2i-1) [\\ln(F(x_i)) + \\ln(1-F(x_{n-i+1}))]$$",
                code: `// Adjusted P-value for A2 based on Stephens (1974)\nif (a2 >= 0.6) p = Math.exp(1.2937 - 5.709 * a2 + 0.0186 * a2**2);`,
                description: "A precise check for normality that is especially effective at catching outliers in the 'tails' of the data."
            }
        ],
        authority: "Stephens (1974), Royston (1992)"
    },
    {
        id: "correlation_logic",
        title: "Relational Mapping & dCor",
        icon: "calculator",
        category: "rigor",
        summary: "Searching for patterns and connections between different health and income variables.",
        intuition: "Correlation isn't just about straight lines. Sometimes two things are related in a curve or a wave. We use 'Distance Correlation' to find those hidden connections that normal math misses.",
        bottomLine: "Standard correlation (Pearson) only finds straight-line links. Distance Correlation (dCor) finds ANY connection.",
        sections: [
            {
                subtitle: "Distance Correlation (Optimized dCor)",
                math: "$$\\mathcal{R}(X, Y) = \\frac{\\text{dCov}(X, Y)}{\\sqrt{\\text{dVar}(X) \\text{dVar}(Y)}}$$",
                code: `// O(n^2) Fast Double Centering\nconst mat = new Float64Array(n * n);\nfor (let i = 0; i < n; i++) {\n  mat[i * n + j] -= (rm + rowMeans[j] - grandMean);\n}`,
                description: "Distance correlation detects BOTH linear and non-linear dependencies. Our O(n²) implementation uses specialized memory buffers for sub-second execution on large county sets."
            },
            {
                subtitle: "Partial Correlation (DF Adjustment)",
                math: "$$r_{xy \\cdot z} = \\frac{r_{xy} - r_{xz}r_{yz}}{\\sqrt{(1-r_{xz}^2)(1-r_{yz}^2)}} \\quad df = n - k - 2$$",
                code: `// Partial Correlation DF Adjustment\ndf = x.length - 3; // k=1 for population control\nt = r * Math.sqrt(df / (1 - r * r));`,
                description: "Allows analyzing the relationship between two variables while holding population size constant. Mathematically critical for removing density bias in health metrics."
            }
        ],
        authority: "Székely et al (2007), Fisher (1924)"
    },
    {
        id: "anova_suite",
        title: "Multi-Factorial Analysis (ANOVA)",
        icon: "check",
        category: "rigor",
        summary: "Comparing multiple groups at once to see where income or location makes the biggest difference.",
        intuition: "Sometimes a health outcome depends on two things at once—like your Income AND where you live. ANOVA finds the 'interaction' where these two factors overlap to create unique results.",
        bottomLine: "Use this to see if the combined effect of two factors is greater than the sum of their parts.",
        sections: [
            {
                subtitle: "Two-Way Factorial ANOVA",
                math: "$$SS_{Total} = SS_A + SS_B + SS_{AB} + SS_{Error}$$",
                code: `// Interaction Sum of Squares\nssInteraction = ssInside - ssA - ssB;\nfInt = (ssInteraction / dfInt) / (ssError / dfError);`,
                description: "Calculates the main effects of two independent variables (e.g., Urbanicity and State) along with their combined interaction effect."
            }
        ],
        authority: "Yates (1934), jStat Performance Suite"
    }
];

const GLOSSARY = {
    "Alpha": "The significance level (usually 0.05). It is the probability of rejecting the null hypothesis when it is actually true.",
    "p-value": "The probability that the observed results occurred by random chance. A low p-value (under 0.05) suggests the effect is real.",
    "degrees of freedom": "The number of independent values or quantities which can be assigned to a statistical distribution. It controls the 'shape' of the math.",
    "Sample Size": "The total number of observations (counties) used in the test. Larger samples generally lead to more precise results."
};

function openGlossary(term) {
    const definition = GLOSSARY[term];
    if (!definition) return;
    
    // We reuse the interpretation modal for glossary
    const modal = document.getElementById("interpretationModal");
    const body = document.getElementById("modalBody");
    
    body.innerHTML = `
        <div class="interpretation-section">
            <h3 style="color:var(--stats-primary); margin-bottom:12px;">Glossary: ${term}</h3>
            <p style="font-size: 1.1rem; color: #1e293b; line-height: 1.6;">${definition}</p>
        </div>
    `;
    modal.style.display = 'flex';
}

function showTechnicalDetailTab() {
    hideAllViews();
    document.getElementById("technicalDetailView").style.display = "block";

    // Sidebar Active State
    document.querySelectorAll('.framework-item').forEach(item => {
        item.classList.toggle('active', item.dataset.test === 'technical_detail');
    });

    renderTechnicalDocs();
}

function showTestSelectorTab() {
    hideAllViews();
    document.getElementById("testSelectorView").style.display = "block";

    // Sidebar Active State
    document.querySelectorAll('.framework-item').forEach(item => {
        item.classList.toggle('active', item.dataset.test === 'test_selector');
    });

    renderDecisionStepper('start');
}

function hideAllViews() {
    const views = ["landingView", "stepperView", "technicalDetailView", "testSelectorView"];
    views.forEach(v => {
        const el = document.getElementById(v);
        if (el) el.style.display = "none";
    });
}

let currentTechFilter = 'all';

function filterTechDocs(category) {
    currentTechFilter = category;
    document.querySelectorAll('.tech-tab').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('onclick').includes(`'${category}'`));
    });
    renderTechnicalDocs();
}

// ── Test Selector Decision Tree Logic ──
const DECISION_TREE = {
    start: {
        question: "What is your primary research objective?",
        choices: [
            { text: "Compare Groups/Means", next: "compare_type", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>` },
            { text: "Analyze Relationships", next: "relate_type", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>` },
            { text: "Check Data Distribution", next: "dist_type", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>` }
        ]
    },
    compare_type: {
        question: "How many groups are you comparing?",
        choices: [
            { text: "2 Groups (e.g., Urban vs Rural)", next: "compare_2_groups" },
            { text: "3+ Groups (e.g., Low/Mid/High Income)", next: "compare_multi_groups" }
        ]
    },
    compare_2_groups: {
        question: "Is the data paired or independent?",
        hint: "Paired: Same subjects (e.g., Obesity vs Inactivity). Independent: Different subjects (e.g., Income in NY vs CA).",
        choices: [
            { text: "Independent Groups", next: "res_ttest" },
            { text: "Paired/Related Data", next: "res_paired" }
        ]
    },
    compare_multi_groups: {
        question: "Is the data related (repeated measures)?",
        choices: [
            { text: "Independent (ANOVA)", next: "res_anova" },
            { text: "Related (RM-ANOVA)", next: "res_rm_anova" }
        ]
    },
    relate_type: {
        question: "What kind of relationship are you looking for?",
        choices: [
            { text: "Linear (Straight Line)", next: "res_pearson" },
            { text: "Non-Linear/Any Pattern", next: "res_distance" },
            { text: "Influence of a 3rd Variable", next: "res_partial" }
        ]
    },
    dist_type: {
        question: "Which aspect of the distribution matters most?",
        choices: [
            { text: "General Normality (Bell Curve)", next: "res_shapiro" },
            { text: "Outliers & Distribution Tails", next: "res_anderson" }
        ]
    },
    // Result Nodes
    res_ttest: { isResult: true, title: "Student's or Welch's T-Test", desc: "Compares averages between two distinct groups (e.g., Rural vs Urban). For skewed data, use Mann-Whitney U.", testId: "ttest" },
    res_paired: { isResult: true, title: "Paired T-Test", desc: "Compares two different metrics for the same set of locations. Often used for 'Before vs After' effects.", testId: "ttest" },
    res_anova: { isResult: true, title: "One-Way ANOVA", desc: "Tests for differences across 3 or more independent categories. Use Kruskal-Wallis for non-normal data.", testId: "multi_group" },
    res_rm_anova: { isResult: true, title: "Repeated Measures ANOVA", desc: "Tracks how multiple metrics vary across the same population or set of counties.", testId: "multi_group" },
    res_pearson: { isResult: true, title: "Pearson Correlation", desc: "The classic measure for linear trends in socioeconomic data.", testId: "correlation" },
    res_distance: { isResult: true, title: "Distance Correlation", desc: "A robust modern method that finds any pattern, not just lines.", testId: "correlation" },
    res_partial: { isResult: true, title: "Partial Correlation", desc: "Essential for removing the 'size effect' of population.", testId: "correlation" },
    res_shapiro: { isResult: true, title: "Shapiro-Wilk Test", desc: "The gold standard for checking if your data follows a normal distribution.", testId: "normality" },
    res_anderson: { isResult: true, title: "Anderson-Darling Test", desc: "Best for data with extreme outliers or thick tails.", testId: "normality" }
};

let currentDecisionNode = "start";

function renderDecisionStepper(nodeId = "start") {
    const container = document.getElementById("stepperContent");
    if (!container) return;
    
    currentDecisionNode = nodeId;
    const node = DECISION_TREE[nodeId];

    if (node.isResult) {
        container.innerHTML = `
            <div class="decision-result animate-in">
                <div class="result-badge">Recommendation</div>
                <h4>${node.title}</h4>
                <p>${node.desc}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="decision-node">
            <h4 class="decision-question">${node.question}</h4>
            ${node.hint ? `<p class="decision-hint">${node.hint}</p>` : ''}
            <div class="decision-choices">
                ${node.choices.map(choice => `
                    <button class="choice-btn" onclick="renderDecisionStepper('${choice.next}')">
                        ${choice.icon ? `<div class="choice-icon-wrap">${choice.icon}</div>` : ''}
                        <span class="choice-text">${choice.text}</span>
                    </button>
                `).join('')}
            </div>
            ${nodeId !== 'start' ? `
                <button class="back-link btn-link" onclick="renderDecisionStepper('start')">
                    ← Back to Start
                </button>
            ` : ''}
        </div>
    `;
}

function startDecisionTest(testId) {
    // Switch to the analysis view and start the specific test
    const frameworkItems = document.querySelectorAll('.framework-item');
    const target = Array.from(frameworkItems).find(i => i.dataset.test === testId);
    if (target) target.click();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderTOC(docs) {
    const toc = document.getElementById("techTOC");
    if (!toc) return;

    toc.innerHTML = docs.map(doc => `
        <a href="#tech-doc-${doc.id}" class="toc-link">${doc.title}</a>
    `).join('');

    // Smooth scroll event listeners
    toc.querySelectorAll('.toc-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                toc.querySelectorAll('.toc-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });
}

function renderTechnicalDocs() {
    const container = document.getElementById("techDocsContent");
    if (!container) return;

    const filteredDocs = currentTechFilter === 'all' 
        ? TECHNICAL_DOCS 
        : TECHNICAL_DOCS.filter(d => d.category === currentTechFilter);

    renderTOC(filteredDocs);
    renderDecisionStepper();

    container.innerHTML = filteredDocs.map(doc => `
        <div id="tech-doc-${doc.id}" class="tech-doc-section">
            <div class="tech-doc-header">
                <div class="tech-doc-header-top">
                    <div class="tech-icon">${SVG_ICONS[doc.icon] || SVG_ICONS.info}</div>
                    <h3>${doc.title}</h3>
                </div>
                <p style="color: #64748b; font-size: 1.05rem; line-height: 1.6;">${doc.summary}</p>
            </div>
            
            <div class="tech-doc-content">
                <!-- Educational Quick Take -->
                <div class="quick-take-box">
                    <span class="quick-take-badge">Context</span>
                    <p class="quick-take-text">${doc.intuition}</p>
                    <div class="bottom-line-item">
                        <span style="font-weight: 800; color: #0369a1;">RECOMMENDATION:</span>
                        <span>${doc.bottomLine}</span>
                    </div>
                </div>

                ${doc.sections.map(sec => `
                    <div class="tech-doc-subsection">
                        <h4 style="display:flex; align-items:center; gap:12px; margin-bottom: 24px; color: #334155;">
                            <span style="background: var(--stats-primary-soft); color: var(--stats-primary); width: 28px; height: 28px; border-radius: 8px; display:flex; align-items:center; justify-content:center; font-size: 0.8rem;">
                                ${SVG_ICONS.check}
                            </span>
                            ${sec.subtitle}
                        </h4>
                        
                        <div class="tech-doc-math-box">${sec.math}</div>
                        
                        <div class="code-block-premium">
                            <div class="code-block-header" style="font-size: 0.7rem; text-transform:uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 16px;">
                                Implementation Preview
                            </div>
                            <pre><code style="font-family: 'JetBrains Mono', monospace;">${sec.code}</code></pre>
                        </div>
                        
                        <p style="font-size: 0.95rem; color: #475569; margin-top: 24px; line-height: 1.6;">
                            ${sec.description.replace(/\b(Alpha|degrees of freedom|p-value|Sample Size)\b/g, '<span class="glossary-link" onclick="openGlossary(\'$1\')">$1</span>')}
                        </p>
                    </div>
                `).join('')}
            </div>
            
            <div class="tech-doc-footer">
                <div class="authority-badge" style="display:flex; align-items:center; gap:8px; font-size: 0.85rem; color: #64748b;">
                    ${SVG_ICONS.info} <strong>${doc.authority}</strong>
                </div>
            </div>
        </div>
    `).join('');

    renderMath(container);
}

// =========================================
// MODAL LOGIC
// =========================================


function selectSubtest(id) {
    testState.selectedSubtest = id;
    if (currentTest === 'normality') {
        testState.normalityPreference = id;
    }
    renderStep();
}

function renderAnalyticalLifecycle(testId, subtestId) {
    const config = TEST_CONFIG[testId];
    const sub = config.subtests ? config.subtests.find(s => s.id === subtestId) : null;
    const testLabel = sub ? sub.label : config.title;

    let computationCode = `// Computing standard ${testId}\nconst result = performLogic(...);`;
    let probabilityCode = `const p = 1 - jStat.norm.cdf(zVal);`;

    if (subtestId === 'mann_whitney') {
        computationCode = `const mu = (n1 * n2) / 2;\nconst sigma = Math.sqrt((n1 * n2 / 12) * (n1 + n2 + 1 - TCF));\nconst z = (u - mu + 0.5) / sigma; // With Continuity Correction`;
        probabilityCode = `const p = 2 * (1 - jStat.normal.cdf(Math.abs(z), 0, 1));`;
    } else if (subtestId === 'wilcoxon_signed_rank') {
        computationCode = `const wMean = n * (n + 1) / 4;\nconst wStd = Math.sqrt((n * (n + 1) * (2 * n + 1) / 24) - TCF);\nconst z = (w - wMean - 0.5) / wStd; // With Continuity Correction`;
        probabilityCode = `const p = 2 * jStat.normal.cdf(-Math.abs(z), 0, 1);`;
    } else if (subtestId === 'friedman') {
        computationCode = `const qNumerator = 12 * sumSquaredDifference;\nconst qDenominator = n * k * (k + 1) - TCF;\nconst q = qNumerator / qDenominator;`;
        probabilityCode = `const p = 1 - jStat.chisquare.cdf(q, k - 1);`;
    } else if (subtestId === 'shapiro_wilk') {
        computationCode = `const w = numerator**2 / denominator;\nconst mu = calculateExpectation(n);\nconst sigma = calculateVariance(n);`;
        probabilityCode = `const z = (Math.log(1 - w) - mu) / sigma;\nconst p = 1 - jStat.normal.cdf(z, 0, 1);`;
    } else if (testId === 'correlation') {
        computationCode = `const r = (n * sumXY - sumX * sumY) / \n  Math.sqrt((n * sumX2 - sumX**2) * (n * sumY2 - sumY**2));`;
        probabilityCode = `const t = r * Math.sqrt((n - 2) / (1 - r**2));\nconst p = 2 * (1 - jStat.studentt.cdf(Math.abs(t), n - 2));`;
    } else if (testId === 't_test') {
        computationCode = `const se = Math.sqrt((s1**2 / n1) + (s2**2 / n2));\nconst t = (m1 - m2) / se;`;
        probabilityCode = `const p = 2 * (1 - jStat.studentt.cdf(Math.abs(t), df));`;
    } else if (subtestId === 'kruskal_wallis') {
        computationCode = `const h = (12 / (n * (n + 1))) * rankSumSquared - 3 * (n + 1);\nconst hCorrected = h / TCF;`;
        probabilityCode = `const p = 1 - jStat.chisquare.cdf(hCorrected, k - 1);`;
    } else if (testId === 'multi_group' || testId === 'mean_comparison') {
        computationCode = `const msBetween = ssBetween / dfBetween;\nconst msWithin = ssWithin / dfWithin;\nconst f = msBetween / msWithin;`;
        probabilityCode = `const p = 1 - jStat.centralf.cdf(f, dfBetween, dfWithin);`;
    } else if (testId === 'normality') {
        computationCode = `const skew2 = skewness**2;\nconst kurt2 = (kurtosis - 3)**2 * 0.25;\nconst jb = (n / 6) * (skew2 + kurt2);`;
        probabilityCode = `const p = 1 - jStat.chisquare.cdf(jb, 2);`;
    }

    let lifecycleSteps = [
        {
            badge: "Research Design",
            title: "Study Parameter Initialization",
            desc: "The engine initializes the framework, selecting Dependent ($Y$) and Independent ($X$) factors based on your socio-economic inquiry and hypothesis direction.",
            code: `const study = { \n  type: '${testId}', \n  dependent: testState.metricX \n};`
        },
        {
            badge: "Data Engineering",
            title: "Observation Recovery & Cleaning",
            desc: "The engine scans the nationwide database and removes 'NaN' entries, ensuring all records exist in matched cohorts.",
            code: `const data = appData.counties.map(c => c[metric])\n  .filter(v => typeof v === 'number');`
        },
        {
            badge: "Metric Synthesis",
            title: "Variable Cohort Partitioning",
            desc: "Data is grouped or split (e.g., 'High' vs 'Low') based on tertiles, medians, or custom interactive thresholds.",
            code: `const g1 = data.filter(v => v >= threshold);\nconst g2 = data.filter(v => v < threshold);`
        },
        {
            badge: "Assumption Verification",
            title: "Distributional Soundness Test",
            desc: "Formal checks (Normality, Variance) are performed to ensure the selected test is mathematically valid for the dataset.",
            code: `const jb = StatHelpers.jarqueBera(vX);\nif (jb.p < 0.05) raiseCaveat();`
        },
        {
            badge: "Mathematical Computation",
            title: "Final Test Statistic Resolution",
            desc: `Applying the core formula <span class="step-math-inline">${sub ? sub.math : config.theory.math}</span> to isolate the signal-to-noise ratio.`,
            code: computationCode
        },
        {
            badge: "Probability Estimation",
            title: "P-Value Mapping (CDF)",
            desc: "Mapping the observed statistic through the Cumulative Distribution Function to find the exact probability of chance overlap.",
            code: probabilityCode
        },
        {
            badge: "Inferential Decision",
            title: "Null Hypothesis Synthesis",
            desc: "Comparing the p-value against Alpha ($0.05$) to determine if we reject or fail to reject the Null Hypothesis.",
            code: `const isSignificant = result.p < 0.05;\nconst conclusion = isSignificant ? 'REJECT H0' : 'FAIL TO REJECT H0';`
        }
    ];

    return `
        <div class="interpretation-section" style="border-top: 2px solid #f1f5f9; padding-top: 30px; margin-top: 30px;">
            <h4 style="margin-bottom: 24px;">${SVG_ICONS.calculator} Complete Analytical Lifecycle: ${testLabel}</h4>
            <div class="analytical-stepper">
                ${lifecycleSteps.map(step => `
                    <div class="analytical-step">
                        <span class="step-badge">${step.badge}</span>
                        <h5>${step.title}</h5>
                        <p>${step.desc}</p>
                        <div class="step-code-preview">${step.code}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function showInterpretationModal(focus = 'general', subtestId = null) {
    const res = testState.results;
    const modal = document.getElementById("interpretationModal");
    const body = document.getElementById("modalBody");

    let content = '';

    // Step-Specific Contexts
    if (focus === 'subtest_info' && subtestId) {
        const sub = TEST_CONFIG[currentTest].subtests.find(s => s.id === subtestId);
        if (sub) {
            content += `
                <div class="interpretation-section">
                    <h3 style="color:var(--stats-primary); margin-bottom:12px;">${sub.label}</h3>
                    <p style="font-size: 1rem; color: #1e293b; line-height: 1.6;">${sub.story}</p>
                </div>
                <div class="interpretation-section">
                    <h4>${SVG_ICONS.calculator} Mathematical Formulation</h4>
                    <div class="math-box">${sub.math}</div>
                </div>
                <div class="interpretation-section">
                    <h4>${SVG_ICONS.database} Implementation Authority</h4>
                    <p>This test is performed using high-precision logic from the <strong>${sub.lib}</strong> library.</p>
                </div>
            `;
        }
    } else {
        // Standard focus areas
        if (focus === 'theory') {
            content += `
                <div class="interpretation-section">
                    <h4>${SVG_ICONS.info} Methodological Context</h4>
                    <p>The <strong>${TEST_CONFIG[currentTest].title}</strong> is a inferential statistical procedure used to determine if patterns in your sample are likely representative of the broader population.</p>
                </div>
            `;
        } else if (focus === 'math') {
            content += `
                <div class="interpretation-section">
                    <h4>${SVG_ICONS.calculator} Mathematical Framework</h4>
                    <p>We use formalized equations to reduce millions of data points into a single "Test Statistic." This value represents the signal-to-noise ratio in your dataset.</p>
                </div>
            `;
        } else if (focus === 'config') {
            content += `
                <div class="interpretation-section">
                    <h4>${SVG_ICONS.database} Experimental Design</h4>
                    <p>Configuring your study involves selecting accurate Dependent and Independent variables to ensure theoretical validity.</p>
                </div>
            `;
        } else if (focus === 'parse') {
            content += `
                <div class="interpretation-section">
                    <h4>${SVG_ICONS.database} Data Engineering</h4>
                    <p>Datasets are scrubbed for missing values and outliers before being partitioned into analytical cohorts.</p>
                </div>
            `;
        } else if (focus === 'verify') {
            content += `
                <div class="interpretation-section">
                    <h4>${SVG_ICONS.check} Assumption Validation</h4>
                    <p>We verify sample size and distributional shape (normality) to ensure the selected test is mathematically appropriate.</p>
                </div>
            `;
        } else if (focus === 'compute') {
            content += `
                <div class="interpretation-section">
                    <h4>${SVG_ICONS.calculator} Statistical Synthesis</h4>
                    <p>Applying rigorous formulas to map your data's numerical 'vibration' onto a probability landscape.</p>
                </div>
            `;
        } else if (focus === 'landscape') {
            content += `
                <div class="interpretation-section">
                    <h4>${SVG_ICONS.calculator} Probability Landscape</h4>
                    <p>This graph shows the Theoretical Distribution. The dashed line is your "Observed Statistic." Distance from the center determines the p-value.</p>
                </div>
            `;
        } else if (focus === 'empirical') {
            let empiricalDesc = 'This visualization shows your raw data points.';
            if (res) {
                if (res.type === 't-test') empiricalDesc = `Showing Jitter Plots of raw data with mean and standard deviation markings.`;
                else if (res.type === 'correlation') empiricalDesc = `A scatter plot showing the linear relationship and regression trend line.`;
                else if (res.type === 'normality') empiricalDesc = `A histogram grouping data frequency to visualize distributional symmetry.`;
            }
            content += `
                <div class="interpretation-section">
                    <h4>${SVG_ICONS.database} Empirical Evidence</h4>
                    <p>${empiricalDesc}</p>
                </div>
            `;
        }

        // Results-Specific Contexts
        if (res && (focus === 'p-value' || focus === 'general')) {
            const pValNumeric = res.p.startsWith("<") ? 0.000001 : parseFloat(res.p);
            const isSig = pValNumeric < 0.05;
            content += `
                <div class="interpretation-section">
                    <h4>${SVG_ICONS.info} Understanding the P-Value</h4>
                    <p>Your p-value is <strong>${res.p}</strong>. ${isSig ?
                    `Result is "Statistically Significant" (p < 0.05).` :
                    `Result is not significant; patterns may be due to random noise.`}
                    </p>
                </div>
            `;
            if (focus === 'general') {
                content += `
                    <div class="interpretation-section">
                        <h4>${SVG_ICONS.check} Summary Decision</h4>
                        <p>${isSig ?
                        `<span style="color:#059669; font-weight:700;">Significant Effect:</span> The data supports the alternative hypothesis.` :
                        `<span style="color:#ef4444; font-weight:700;">No Significant Effect:</span> The data does not provide enough evidence.`}
                        </p>
                    </div>
                `;
            }
        }
    }

    // Always show lifecycle for focus buttons (except purely visual ones)
    if (focus !== 'empirical' && focus !== 'landscape') {
         content += renderAnalyticalLifecycle(currentTest, subtestId || testState.selectedSubtest);
    }

    body.innerHTML = content;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    renderMath(body);
}

function closeModal() {
    document.getElementById("interpretationModal").style.display = 'none';
    document.body.style.overflow = 'auto';
}

window.onclick = function (event) {
    const modal = document.getElementById("interpretationModal");
    if (event.target == modal) closeModal();
}
