/**
 * Semi-Structured Query Engine
 * Loads real ACS + PLACES data, provides dependent dropdowns,
 * validates queries, and renders data-backed results.
 */

document.addEventListener('DOMContentLoaded', () => {
    initQueryEngine();
});

/* ── State ─────────────────────────────────────────────────── */

const QueryState = {
    activeCategory: 'all',
    activeTemplate: null,
    placeholders: {},
    currentChartRoot: null,
    currentMapRoot: null,
    currentRadarRoot: null,
    // Real data
    countyData: [],
    stateData: [],
    stateCountyMap: {},   // { "Wisconsin": ["Milwaukee", "Dane", ...] }
    allStates: [],
    allMetrics: [],
    history: [] // Last 10 queries
};

/* ── Region → State mapping ────────────────────────────────── */

const REGION_STATES = {
    "Northeast": ["Connecticut", "Maine", "Massachusetts", "New Hampshire", "Rhode Island", "Vermont", "New Jersey", "New York", "Pennsylvania"],
    "Midwest": ["Illinois", "Indiana", "Iowa", "Kansas", "Michigan", "Minnesota", "Missouri", "Nebraska", "North Dakota", "Ohio", "South Dakota", "Wisconsin"],
    "South": ["Alabama", "Arkansas", "Delaware", "Florida", "Georgia", "Kentucky", "Louisiana", "Maryland", "Mississippi", "North Carolina", "Oklahoma", "South Carolina", "Tennessee", "Texas", "Virginia", "West Virginia", "District of Columbia"],
    "West": ["Alaska", "Arizona", "California", "Colorado", "Hawaii", "Idaho", "Montana", "Nevada", "New Mexico", "Oregon", "Utah", "Washington", "Wyoming"]
};

/* ── Constants ────────────────────────────────────────────── */

const COMPOSITE_HEALTH_METRICS = [
    'depression', 'obesity', 'diabetes', 'arthritis', 'asthma', 
    'blood_pressure', 'cholesterol', 'coronary', 'stroke', 'cancer', 'copd'
];

const COMPOSITE_DISABILITY_METRICS = [
    'disability', 'hearing', 'vision', 'cognitive', 'ambulatory', 'selfcare', 'independent'
];

/* ── Template Library ──────────────────────────────────────── */

const TEMPLATES = [
    // Top / Bottom K
    {
        id: 'top_counties',
        category: 'topk',
        text: 'Show the top {count} counties in {state} with the highest {metric}.',
        placeholders: ['count', 'state', 'metric'],
        resultType: 'top'
    },
    {
        id: 'bottom_counties',
        category: 'topk',
        text: 'Identify the bottom {count} counties with the lowest {metric} in {state}.',
        placeholders: ['count', 'metric', 'state'],
        resultType: 'bottom'
    },
    {
        id: 'top_states_metric',
        category: 'topk',
        text: 'Rank the top {count} states based on {metric}.',
        placeholders: ['count', 'metric'],
        resultType: 'top_states'
    },
    {
        id: 'bottom_states_metric',
        category: 'topk',
        text: 'Which {count} states have the lowest {metric}?',
        placeholders: ['count', 'metric'],
        resultType: 'bottom_states'
    },

    // County Level
    {
        id: 'county_compare_metric',
        category: 'county',
        text: 'Compare {county1} and {county2} in {state} for {metric}.',
        placeholders: ['state', 'county1', 'county2', 'metric'],
        resultType: 'county_compare'
    },
    {
        id: 'county_within_state',
        category: 'county',
        text: 'How does {county1} compare to the {state} average for {metric}?',
        placeholders: ['state', 'county1', 'metric'],
        resultType: 'county_vs_avg'
    },
    {
        id: 'urban_rural_split',
        category: 'county',
        text: 'List all counties in {state} sorted by {metric}.',
        placeholders: ['state', 'metric'],
        resultType: 'state_counties_sorted'
    },

    // State Level
    {
        id: 'state_performance',
        category: 'state',
        text: 'Which state in the {region} region has the best {metric} outcomes?',
        placeholders: ['region', 'metric'],
        resultType: 'region_states'
    },
    {
        id: 'state_vs_national',
        category: 'state',
        text: 'How does {state} compare to the national average in {metric}?',
        placeholders: ['state', 'metric'],
        resultType: 'state_vs_national'
    },
    {
        id: 'state_neighbor_compare',
        category: 'state',
        text: 'Compare all states in the {region} region for {metric}.',
        placeholders: ['region', 'metric'],
        resultType: 'region_compare'
    },

    // National Level
    {
        id: 'national_overview',
        category: 'national',
        text: 'What is the average {metric} for each region in the USA?',
        placeholders: ['metric'],
        resultType: 'national_regions'
    },
    {
        id: 'regional_disparity',
        category: 'national',
        text: 'Show the {metric} disparity across all four US regions.',
        placeholders: ['metric'],
        resultType: 'national_regions'
    },
    {
        id: 'national_extremes',
        category: 'national',
        text: 'Which {count} states have the highest and lowest {metric}?',
        placeholders: ['count', 'metric'],
        resultType: 'national_extremes'
    },

    // Correlation
    {
        id: 'metric_correlation',
        category: 'correlation',
        text: 'How does {metric} compare with {metric2} across each region?',
        placeholders: ['metric', 'metric2'],
        resultType: 'correlation_regions'
    },
    {
        id: 'economic_health_link',
        category: 'correlation',
        text: 'Compare {metric} and {metric2} across the top {count} states.',
        placeholders: ['metric', 'metric2', 'count'],
        resultType: 'correlation_top_states'
    },
    {
        id: 'county_scatter_correlation',
        category: 'correlation',
        text: 'Show me the correlation between {metric} and {metric2} across all counties in {state}.',
        placeholders: ['state', 'metric', 'metric2'],
        resultType: 'correlation_scatter_county'
    },

    // Multi-Metric
    {
        id: 'state_multi_profile',
        category: 'multiMetric',
        text: 'Show the profile of {state} across {metrics}.',
        placeholders: ['state', 'metrics'],
        resultType: 'multi_state_profile'
    },
    {
        id: 'county_multi_snapshot',
        category: 'multiMetric',
        text: 'Health snapshot of {county1} in {state} for {metrics}.',
        placeholders: ['state', 'county1', 'metrics'],
        resultType: 'multi_county_snapshot'
    },
    {
        id: 'regional_multi_compare',
        category: 'multiMetric',
        text: 'Compare all US regions across {metrics}.',
        placeholders: ['metrics'],
        resultType: 'multi_region_compare'
    },
    {
        id: 'state_multi_rank',
        category: 'multiMetric',
        text: 'Rank the top {count} states by {metrics}.',
        placeholders: ['count', 'metrics'],
        resultType: 'multi_state_rank'
    },

    // Range Queries
    {
        id: 'states_in_range',
        category: 'range',
        text: 'Show all states where {metric} is between {range}.',
        placeholders: ['metric', 'range'],
        resultType: 'range_states'
    },
    {
        id: 'counties_in_range',
        category: 'range',
        text: 'List counties in {state} where {metric} is between {range}.',
        placeholders: ['state', 'metric', 'range'],
        resultType: 'range_counties'
    },
    {
        id: 'states_above_threshold',
        category: 'range',
        text: 'Which states have {metric} above {threshold}?',
        placeholders: ['metric', 'threshold'],
        resultType: 'range_above_states'
    },
    {
        id: 'counties_below_threshold',
        category: 'range',
        text: 'Counties in {state} with {metric} below {threshold}.',
        placeholders: ['state', 'metric', 'threshold'],
        resultType: 'range_below_counties'
    },

    // Composite Index / Wellness
    {
        id: 'wellness_state_rank',
        category: 'composite',
        text: 'Rank states by a Wellness Index calculated from {metrics}.',
        placeholders: ['metrics'],
        resultType: 'composite_state_rank'
    },
    {
        id: 'wellness_county_profile',
        category: 'composite',
        text: 'Detailed wellness breakdown for {county1} in {state} using {metrics}.',
        placeholders: ['state', 'county1', 'metrics'],
        resultType: 'composite_county_profile'
    },
    {
        id: 'wellness_state_compare',
        category: 'composite',
        text: 'Compare the wellness profile of {state} and {state2} across {metrics}.',
        placeholders: ['state', 'state2', 'metrics'],
        resultType: 'composite_state_compare'
    },
    {
        id: 'disability_state_rank',
        category: 'composite',
        text: 'Rank states by a Disability Index calculated from {metrics}.',
        placeholders: ['metrics'],
        resultType: 'composite_state_rank'
    },
    {
        id: 'disability_county_profile',
        category: 'composite',
        text: 'Detailed disability breakdown for {county1} in {state} using {metrics}.',
        placeholders: ['state', 'county1', 'metrics'],
        resultType: 'composite_county_profile'
    },
    {
        id: 'disability_state_compare',
        category: 'composite',
        text: 'Compare the disability profile of {state} and {state2} across {metrics}.',
        placeholders: ['state', 'state2', 'metrics'],
        resultType: 'composite_state_compare'
    }
];

/* ── Placeholder metadata ──────────────────────────────────── */

const PLACEHOLDER_LABELS = {
    metric: 'Metric',
    metric2: 'Metric 2',
    metric3: 'Metric 3',
    metrics: 'Metrics',
    state: 'State',
    state2: 'State 2',
    county1: 'County',
    county2: 'County 2',
    region: 'Region',
    range: 'Range',
    threshold: 'Threshold'
};

const CATEGORY_META = {
    all: { label: 'All Templates', color: '#c83830' },
    topk: { label: 'Top / Bottom K', color: '#6366f1' },
    county: { label: 'County Level', color: '#0891b2' },
    state: { label: 'State Level', color: '#16a34a' },
    national: { label: 'National Level', color: '#f59e0b' },
    correlation: { label: 'Correlations', color: '#8b5cf6' },
    multiMetric: { label: 'Multi-Metric', color: '#ec4899' },
    composite: { label: 'Composite Index', color: '#e11d48' },
    range: { label: 'Range Queries', color: '#64748b' }
};

const MULTI_METRIC_COLORS = [
    '#c83830', '#6366f1', '#0891b2', '#16a34a', '#d97706', '#9333ea'
];

const MAX_MULTI_METRICS = 6;

/* ── Initialize ────────────────────────────────────────────── */

async function initQueryEngine() {
    try {
        await loadRealData();
    } catch (e) {
        console.error('Failed to load data for query engine:', e);
    }

    renderTemplates();
    updateCategoryCounts();

    document.getElementById('runQueryBtn').addEventListener('click', executeQuery);
    document.getElementById('resetQueryBtn').addEventListener('click', resetQuery);

    // Viz toggle bindings
    document.getElementById('showChartBtn').addEventListener('click', () => switchViz('chart'));
    document.getElementById('showMapBtn').addEventListener('click', () => switchViz('map'));
    document.getElementById('showRadarBtn').addEventListener('click', () => switchViz('radar'));

    // History
    document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
    loadHistory();
}

function switchViz(type) {
    const chartBox = document.getElementById('chartContainer');
    const mapBox = document.getElementById('mapContainer');
    const radarBox = document.getElementById('radarContainer');
    const chartBtn = document.getElementById('showChartBtn');
    const mapBtn = document.getElementById('showMapBtn');
    const radarBtn = document.getElementById('showRadarBtn');

    if (type === 'map') {
        chartBox.style.display = 'none';
        if (radarBox) radarBox.style.display = 'none';
        mapBox.style.display = 'block';
        chartBtn.classList.remove('active');
        if (radarBtn) radarBtn.classList.remove('active');
        mapBtn.classList.add('active');
        // If map hasn't been rendered yet or needs update
        renderMapResults();
    } else if (type === 'radar') {
        chartBox.style.display = 'none';
        mapBox.style.display = 'none';
        if (radarBox) radarBox.style.display = 'block';
        chartBtn.classList.remove('active');
        mapBtn.classList.remove('active');
        if (radarBtn) radarBtn.classList.add('active');
        
        renderRadarResults();
    } else {
        if (radarBox) radarBox.style.display = 'none';
        mapBox.style.display = 'none';
        chartBox.style.display = 'block';
        mapBtn.classList.remove('active');
        if (radarBtn) radarBtn.classList.remove('active');
        chartBtn.classList.add('active');
    }
}

async function loadRealData() {
    const [acsRes, placesRes, acsCountyRes, placesCountyRes] = await Promise.all([
        fetch("data/ACS Data/state_acs_flat.json"),
        fetch("data/PLACES Data/state_places_flat.json"),
        fetch("data/ACS Data/county_acs_flat.json"),
        fetch("data/PLACES Data/county_places_flat.json")
    ]);

    const acsData = await acsRes.json();
    const placesData = await placesRes.json();
    const acsCountyData = await acsCountyRes.json();
    const placesCountyData = await placesCountyRes.json();

    // Merge state data
    const placesLookup = {};
    placesData.forEach(d => { placesLookup[d.id] = d; });
    QueryState.stateData = acsData.map(acs => {
        const places = placesLookup[acs.id] || {};
        return { ...acs, ...places, id: acs.id, name: acs.name, state_abbr: acs.state_abbr };
    });

    // Merge county data — IDs differ between ACS and PLACES
    // ACS: "US.AL.Autauga_County", PLACES: "US.AL.Autauga"
    // We normalize both to a common key for matching
    function normalizeCountyId(id) {
        if (!id) return '';
        return id
            .replace(/_/g, '')
            .replace(/County$/i, '')
            .replace(/Parish$/i, '')
            .replace(/Borough$/i, '')
            .replace(/CensusArea$/i, '')
            .replace(/Municipality$/i, '')
            .replace(/City$/i, '')
            .trim()
            .toLowerCase();
    }

    // Build PLACES county lookup with normalized keys
    const placesCountyLookup = {};
    placesCountyData.forEach(d => {
        const normId = normalizeCountyId(d.id);
        placesCountyLookup[normId] = d;
    });

    // Also build a name+state fallback lookup
    const placesNameLookup = {};
    placesCountyData.forEach(d => {
        if (d.name && d.state_abbr) {
            const key = (d.name + '|' + d.state_abbr).toLowerCase();
            placesNameLookup[key] = d;
        }
    });

    QueryState.countyData = acsCountyData.map(acs => {
        // Try normalized ID lookup first
        const normId = normalizeCountyId(acs.id);
        let places = placesCountyLookup[normId] || {};

        // Fallback: name-based lookup (strip " County" etc. from ACS name)
        if (!places.id && acs.name && acs.state_abbr) {
            const cleanName = acs.name
                .replace(/\s+County$/i, '')
                .replace(/\s+Parish$/i, '')
                .replace(/\s+Borough$/i, '')
                .replace(/\s+Census Area$/i, '')
                .replace(/\s+Municipality$/i, '');
            const key = (cleanName + '|' + acs.state_abbr).toLowerCase();
            places = placesNameLookup[key] || {};
        }

        return { ...acs, ...places, id: acs.id, name: acs.name, state_abbr: acs.state_abbr, state_name: acs.state_name };
    });

    // Build state → county map
    const map = {};
    QueryState.countyData.forEach(c => {
        if (!c.state_name) return;
        if (!map[c.state_name]) map[c.state_name] = [];
        map[c.state_name].push(c.name);
    });
    // Sort county names
    Object.keys(map).forEach(s => map[s].sort());
    QueryState.stateCountyMap = map;

    // Unique sorted state list
    QueryState.allStates = Object.keys(map).sort();

    // Build metric options from metricLabels if available, otherwise fallback
    const labels = typeof metricLabels !== 'undefined' ? metricLabels : {};
    const metricKeys = typeof metrics !== 'undefined' ? metrics : Object.keys(labels);

    QueryState.allMetrics = metricKeys
        .filter(k => labels[k])  // Only include if we have a label
        .map(k => ({ id: k, label: labels[k] }));
}

/* ── Counts ────────────────────────────────────────────────── */

function updateCategoryCounts() {
    document.querySelectorAll('.cat-item').forEach(item => {
        const cat = item.getAttribute('data-category');
        if (!cat) return;
        const meta = CATEGORY_META[cat] || { color: '#64748b' };
        const count = cat === 'all'
            ? TEMPLATES.length
            : TEMPLATES.filter(t => t.category === cat).length;
        
        const badge = item.querySelector('.cat-count');
        if (badge) badge.textContent = count;

        // Apply color
        item.style.setProperty('--item-color', meta.color);
    });
}

/* ── Template Rendering ────────────────────────────────────── */

function renderTemplates() {
    const grid = document.getElementById('templateGrid');
    grid.innerHTML = '';

    const filtered = QueryState.activeCategory === 'all'
        ? TEMPLATES
        : TEMPLATES.filter(t => t.category === QueryState.activeCategory);

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <p>No templates in this category.</p>
            </div>`;
        return;
    }

    let currentSubGroup = null;

    filtered.forEach((tpl, i) => {
        if (QueryState.activeCategory === 'composite' || QueryState.activeCategory === 'all') {
            if (tpl.category === 'composite') {
                const subGroup = tpl.id.startsWith('wellness') ? 'Wellness Index Options' : 'Disability Index Options';
                if (subGroup !== currentSubGroup) {
                    currentSubGroup = subGroup;
                    const subHeader = document.createElement('div');
                    subHeader.style.cssText = 'grid-column: 1 / -1; margin-top: 15px; margin-bottom: 5px; font-weight: 700; color: var(--q-primary); font-size: 1.05rem; border-bottom: 2px solid #e11d48; padding-bottom: 5px; display: inline-block; width: max-content;';
                    if (subGroup === 'Disability Index Options') {
                        subHeader.style.borderBottomColor = '#6366f1';
                        subHeader.style.color = '#6366f1';
                    }
                    subHeader.textContent = subGroup;
                    grid.appendChild(subHeader);
                }
            } else {
                currentSubGroup = null; // reset if not composite
            }
        }

        const card = document.createElement('div');
        card.className = 'template-card';
        card.style.animationDelay = `${i * 0.04}s`;

        const meta = CATEGORY_META[tpl.category] || { label: tpl.category, color: '#64748b' };
        card.style.setProperty('--tag-color', meta.color);

        card.innerHTML = `
            <div class="template-tag">${meta.label}</div>
            <div class="template-text">${tpl.text.replace(/{(\w+)}/g, '<span class="ph-static" data-key="$1">$1</span>')}</div>
        `;
        card.onclick = (e) => selectTemplate(tpl, e.currentTarget);
        grid.appendChild(card);
    });
}

function setCategory(cat, el) {
    QueryState.activeCategory = cat;
    QueryState.activeTemplate = null;
    QueryState.placeholders = {};

    document.querySelectorAll('.cat-item').forEach(item => {
        item.classList.toggle('active', item.dataset.category === cat);
    });
    renderTemplates();

    document.getElementById('queryEditor').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
}

/* ── Template Selection ────────────────────────────────────── */

function selectTemplate(tpl, cardEl) {
    QueryState.activeTemplate = tpl;
    QueryState.placeholders = {};

    document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
    cardEl.classList.add('active');

    const editor = document.getElementById('queryEditor');
    editor.style.display = 'block';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('placeholderControls').innerHTML = '';

    renderActiveQuery();
    renderAllPlaceholderControls();

    // Add Health Outcomes restriction notice for composite category
    if (tpl.category === 'composite') {
        const notice = document.createElement('div');
        notice.className = 'composite-restriction-notice';
        notice.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <span>
                Note: This index is restricted to <strong>Health Outcomes</strong> for clinical relevance. 
                <a href="#" class="calc-info-link" onclick="showIndexCalculationInfo(); return false;">How is this calculated?</a>
            </span>
        `;
        document.getElementById('placeholderControls').prepend(notice);
    }

    editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderActiveQuery() {
    const display = document.getElementById('queryDisplay');
    let html = QueryState.activeTemplate.text;

    QueryState.activeTemplate.placeholders.forEach(key => {
        const val = QueryState.placeholders[key];
        if (key === 'metrics') {
            // Multi-select: show comma-separated labels or placeholder
            const selected = Array.isArray(val) ? val : [];
            const displayVal = selected.length > 0
                ? selected.map(m => m.label).join(', ')
                : 'Metrics';
            const filledClass = selected.length > 0 ? ' filled' : '';
            html = html.replace(
                `{${key}}`,
                `<span class="placeholder${filledClass}" data-key="${key}" onclick="focusPlaceholder('${key}')">${displayVal}</span>`
            );
        } else if (key === 'range') {
            const rangeVal = QueryState.placeholders['range'];
            const displayVal = rangeVal ? `${rangeVal.min} – ${rangeVal.max}` : 'Range';
            const filledClass = rangeVal ? ' filled' : '';
            html = html.replace(
                `{${key}}`,
                `<span class="placeholder${filledClass}" data-key="${key}" onclick="focusPlaceholder('${key}')">${displayVal}</span>`
            );
        } else if (key === 'threshold') {
            const thVal = QueryState.placeholders['threshold'];
            const displayVal = thVal != null ? thVal : 'Threshold';
            const filledClass = thVal != null ? ' filled' : '';
            html = html.replace(
                `{${key}}`,
                `<span class="placeholder${filledClass}" data-key="${key}" onclick="focusPlaceholder('${key}')">${displayVal}</span>`
            );
        } else {
            const displayVal = val ? (typeof val === 'object' ? val.label : val) : (PLACEHOLDER_LABELS[key] || key);
            const filledClass = val ? ' filled' : '';
            html = html.replace(
                `{${key}}`,
                `<span class="placeholder${filledClass}" data-key="${key}" onclick="focusPlaceholder('${key}')">${displayVal}</span>`
            );
        }
    });

    display.innerHTML = html;
}

/* ── Build Controls with Dependencies ──────────────────────── */

function renderAllPlaceholderControls() {
    const controls = document.getElementById('placeholderControls');
    controls.innerHTML = '';

    QueryState.activeTemplate.placeholders.forEach(key => {
        if (key === 'metrics') {
            renderMultiMetricControl(controls);
            return;
        }
        if (key === 'range') {
            renderRangeSliderControl(controls);
            return;
        }
        if (key === 'threshold') {
            renderThresholdControl(controls);
            return;
        }

        const group = document.createElement('div');
        group.className = 'control-group';
        group.id = `control-${key}`;
        group.setAttribute('data-key', key);

        const label = document.createElement('label');
        label.textContent = PLACEHOLDER_LABELS[key] || key;
        label.setAttribute('for', `select-${key}`);

        const select = document.createElement('select');
        select.className = 'placeholder-select';
        select.id = `select-${key}`;

        populateSelectOptions(select, key);

        select.onchange = (e) => {
            handleSelectionChange(key, e.target.value);
        };

        group.appendChild(label);
        group.appendChild(select);
        controls.appendChild(group);
    });
}

function renderMultiMetricControl(container) {
    const group = document.createElement('div');
    group.className = 'control-group multi-metric-control';
    group.id = 'control-metrics';
    group.style.flexDirection = 'column';
    group.style.alignItems = 'stretch';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;';
    header.innerHTML = `
        <label style="margin:0">Metrics <span style="font-weight:400;color:var(--q-text-muted);font-size:0.8rem">(select 2–${MAX_MULTI_METRICS})</span></label>
        <span id="multiMetricCount" style="font-size:0.78rem;font-weight:600;color:var(--q-text-muted)">0 / ${MAX_MULTI_METRICS}</span>
    `;
    group.appendChild(header);

    // Selected tags area
    const tagsArea = document.createElement('div');
    tagsArea.id = 'multiMetricTags';
    tagsArea.className = 'multi-metric-tags';
    group.appendChild(tagsArea);

    // Search box
    const searchBox = document.createElement('input');
    searchBox.type = 'text';
    searchBox.placeholder = 'Search metrics...';
    searchBox.className = 'multi-metric-search';
    searchBox.oninput = (e) => filterMultiMetricOptions(e.target.value);
    group.appendChild(searchBox);

    // Checkbox list
    const listWrap = document.createElement('div');
    listWrap.className = 'multi-metric-list';
    listWrap.id = 'multiMetricList';

    let allMetrics = QueryState.allMetrics.length > 0 ? QueryState.allMetrics : [
        { id: 'obesity_prevalence', label: 'Obesity' },
        { id: 'diabetes_prevalence', label: 'Diabetes' },
        { id: 'smoking_prevalence', label: 'Smoking' }
    ];

    if (QueryState.activeTemplate?.category === 'composite') {
        const isDis = QueryState.activeTemplate.id.startsWith('disability');
        const allowed = isDis ? COMPOSITE_DISABILITY_METRICS : COMPOSITE_HEALTH_METRICS;
        allMetrics = allMetrics.filter(m => 
            allowed.some(term => m.id.includes(term))
        );
    }

    allMetrics.forEach((m, i) => {
        const item = document.createElement('label');
        item.className = 'multi-metric-item';
        item.setAttribute('data-label', m.label.toLowerCase());
        const colorDot = MULTI_METRIC_COLORS[i % MULTI_METRIC_COLORS.length];
        item.innerHTML = `
            <input type="checkbox" value="${m.id}" data-label="${m.label}" />
            <span class="multi-metric-dot" style="background:${colorDot}"></span>
            <span class="multi-metric-label">${m.label}</span>
        `;
        const cb = item.querySelector('input');
        cb.onchange = () => handleMultiMetricChange();
        listWrap.appendChild(item);
    });

    group.appendChild(listWrap);
    container.appendChild(group);

    // Restore previous selection if any
    const prev = QueryState.placeholders['metrics'];
    if (Array.isArray(prev) && prev.length > 0) {
        prev.forEach(m => {
            const cb = listWrap.querySelector(`input[value="${m.id}"]`);
            if (cb) cb.checked = true;
        });
        updateMultiMetricUI();
    }
}

function handleMultiMetricChange() {
    const checkboxes = document.querySelectorAll('#multiMetricList input[type="checkbox"]');
    const selected = [];
    checkboxes.forEach(cb => {
        if (cb.checked) {
            selected.push({ id: cb.value, label: cb.getAttribute('data-label') });
        }
    });

    // Enforce max limit
    if (selected.length > MAX_MULTI_METRICS) {
        showToast(`You can select up to ${MAX_MULTI_METRICS} metrics.`, 'warning');
        // Uncheck the last one
        const allCBs = [...checkboxes].filter(cb => cb.checked);
        allCBs[allCBs.length - 1].checked = false;
        return handleMultiMetricChange();
    }

    QueryState.placeholders['metrics'] = selected.length > 0 ? selected : null;
    updateMultiMetricUI();
    renderActiveQuery();
}

function updateMultiMetricUI() {
    const selected = QueryState.placeholders['metrics'] || [];
    const countEl = document.getElementById('multiMetricCount');
    if (countEl) countEl.textContent = `${selected.length} / ${MAX_MULTI_METRICS}`;

    // Render tag pills
    const tagsArea = document.getElementById('multiMetricTags');
    if (tagsArea) {
        tagsArea.innerHTML = selected.map((m, i) => {
            const color = MULTI_METRIC_COLORS[i % MULTI_METRIC_COLORS.length];
            return `<span class="multi-metric-tag" style="--tag-color:${color}" data-id="${m.id}">
                ${m.label}
                <button onclick="removeMultiMetric('${m.id}')" title="Remove">&times;</button>
            </span>`;
        }).join('');
    }

    // Disable unchecked checkboxes if at limit
    const checkboxes = document.querySelectorAll('#multiMetricList input[type="checkbox"]');
    checkboxes.forEach(cb => {
        if (!cb.checked && selected.length >= MAX_MULTI_METRICS) {
            cb.disabled = true;
            cb.closest('.multi-metric-item').classList.add('disabled');
        } else {
            cb.disabled = false;
            cb.closest('.multi-metric-item').classList.remove('disabled');
        }
    });
}

function removeMultiMetric(metricId) {
    const cb = document.querySelector(`#multiMetricList input[value="${metricId}"]`);
    if (cb) {
        cb.checked = false;
        handleMultiMetricChange();
    }
}

function filterMultiMetricOptions(query) {
    const q = query.toLowerCase().trim();
    document.querySelectorAll('#multiMetricList .multi-metric-item').forEach(item => {
        const label = item.getAttribute('data-label');
        item.style.display = label.includes(q) ? '' : 'none';
    });
}

/* ── Range Slider Control ─────────────────────────────────── */

function getRangeForMetric() {
    const metricId = QueryState.placeholders['metric'];
    if (!metricId) return { min: 0, max: 100 };
    const id = typeof metricId === 'object' ? metricId.id : metricId;
    const resultType = QueryState.activeTemplate.resultType;
    const dataset = (resultType === 'range_counties' || resultType === 'range_below_counties')
        ? QueryState.countyData
        : QueryState.stateData;
    const vals = dataset.filter(d => d[id] != null).map(d => d[id]);
    if (vals.length === 0) return { min: 0, max: 100 };
    return {
        min: Math.floor(Math.min(...vals)),
        max: Math.ceil(Math.max(...vals))
    };
}

function renderRangeSliderControl(container) {
    const group = document.createElement('div');
    group.className = 'control-group range-slider-control';
    group.id = 'control-range';
    group.style.flexDirection = 'column';
    group.style.alignItems = 'stretch';

    const bounds = getRangeForMetric();
    const prev = QueryState.placeholders['range'];
    const initialMin = prev ? prev.min : bounds.min;
    const initialMax = prev ? prev.max : bounds.max;

    group.innerHTML = `
        <div class="slider-header" data-key="range">
            <span class="slider-label">Range</span>
            <div class="slider-value-pills">
                <span class="slider-pill ph-range" id="rangeMinBadge">${initialMin}</span>
                <span class="slider-pill-sep">–</span>
                <span class="slider-pill ph-range" id="rangeMaxBadge">${initialMax}</span>
            </div>
        </div>
        <div class="slider-track-area">
            <div class="dual-range-wrap">
                <div class="range-track" id="rangeTrack">
                    <div class="range-fill" id="rangeFill"></div>
                </div>
                <input type="range" class="range-input range-input-min" id="rangeMin"
                    min="${bounds.min}" max="${bounds.max}" value="${initialMin}" step="1" />
                <input type="range" class="range-input range-input-max" id="rangeMax"
                    min="${bounds.min}" max="${bounds.max}" value="${initialMax}" step="1" />
            </div>
            <div class="range-bounds">
                <span>${bounds.min}</span>
                <span>${bounds.max}</span>
            </div>
        </div>
    `;

    container.appendChild(group);

    // Set initial state
    QueryState.placeholders['range'] = { min: initialMin, max: initialMax };
    renderActiveQuery();

    // Bind events after DOM insertion
    requestAnimationFrame(() => {
        const minInput = document.getElementById('rangeMin');
        const maxInput = document.getElementById('rangeMax');
        if (!minInput || !maxInput) return;

        const update = () => {
            let lo = parseInt(minInput.value);
            let hi = parseInt(maxInput.value);
            if (lo > hi) {
                // Swap if crossed
                [lo, hi] = [hi, lo];
                minInput.value = lo;
                maxInput.value = hi;
            }
            document.getElementById('rangeMinBadge').textContent = lo;
            document.getElementById('rangeMaxBadge').textContent = hi;
            QueryState.placeholders['range'] = { min: lo, max: hi };
            updateRangeFill(bounds.min, bounds.max, lo, hi);
            renderActiveQuery();
        };

        minInput.oninput = update;
        maxInput.oninput = update;
        updateRangeFill(bounds.min, bounds.max, initialMin, initialMax);
    });
}

function updateRangeFill(absMin, absMax, lo, hi) {
    const fill = document.getElementById('rangeFill');
    if (!fill) return;
    const range = absMax - absMin || 1;
    const left = ((lo - absMin) / range) * 100;
    const right = ((hi - absMin) / range) * 100;
    fill.style.left = left + '%';
    fill.style.width = (right - left) + '%';
}

function renderThresholdControl(container) {
    const group = document.createElement('div');
    group.className = 'control-group range-slider-control';
    group.id = 'control-threshold';
    group.style.flexDirection = 'column';
    group.style.alignItems = 'stretch';

    const bounds = getRangeForMetric();
    const resultType = QueryState.activeTemplate.resultType;
    const isAbove = resultType.includes('above');
    const initialVal = QueryState.placeholders['threshold']
        ?? (isAbove ? Math.round(bounds.min + (bounds.max - bounds.min) * 0.7)
            : Math.round(bounds.min + (bounds.max - bounds.min) * 0.3));

    group.innerHTML = `
        <div class="slider-header" data-key="threshold">
            <span class="slider-label">Threshold</span>
            <div class="slider-value-pills">
                <span class="slider-pill threshold-pill" id="thresholdBadge">${initialVal}</span>
            </div>
        </div>
        <div class="slider-track-area">
            <div class="threshold-slider-wrap">
                <div class="range-track" id="thresholdTrack">
                    <div class="range-fill threshold-fill" id="thresholdFill"></div>
                </div>
                <input type="range" class="range-input threshold-input" id="thresholdSlider"
                    min="${bounds.min}" max="${bounds.max}" value="${initialVal}" step="1" />
            </div>
            <div class="range-bounds">
                <span>${bounds.min}</span>
                <span>${bounds.max}</span>
            </div>
        </div>
    `;

    container.appendChild(group);

    QueryState.placeholders['threshold'] = initialVal;
    renderActiveQuery();

    requestAnimationFrame(() => {
        const slider = document.getElementById('thresholdSlider');
        if (!slider) return;

        const update = () => {
            const val = parseInt(slider.value);
            document.getElementById('thresholdBadge').textContent = val;
            QueryState.placeholders['threshold'] = val;
            updateThresholdFill(bounds.min, bounds.max, val);
            renderActiveQuery();
        };

        slider.oninput = update;
        updateThresholdFill(bounds.min, bounds.max, initialVal);
    });
}

function updateThresholdFill(absMin, absMax, val) {
    const fill = document.getElementById('thresholdFill');
    if (!fill) return;
    const range = absMax - absMin || 1;
    const pct = ((val - absMin) / range) * 100;
    fill.style.left = '0';
    fill.style.width = pct + '%';
}

function populateSelectOptions(select, key) {
    select.innerHTML = '';

    const options = getOptionsForKey(key);
    const needsState = (key === 'county1' || key === 'county2') && !QueryState.placeholders['state'];

    // Default option
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.disabled = true;
    defaultOpt.selected = true;
    if (needsState) {
        defaultOpt.textContent = '← Select a state first';
    } else {
        defaultOpt.textContent = `Choose ${PLACEHOLDER_LABELS[key] || key}...`;
    }
    select.appendChild(defaultOpt);

    if (needsState) {
        select.disabled = true;
        return;
    }
    select.disabled = false;

    options.forEach(opt => {
        const o = document.createElement('option');
        if (typeof opt === 'object') {
            o.value = opt.id;
            o.textContent = opt.label;
        } else {
            o.value = opt;
            o.textContent = opt;
        }
        select.appendChild(o);
    });
}

function getOptionsForKey(key) {
    switch (key) {
        case 'count':
            return ["3", "5", "10", "15", "20"];
        case 'state':
            return QueryState.allStates.length > 0 ? QueryState.allStates : ["Wisconsin", "Illinois", "California"];
        case 'county1': {
            const selectedState = QueryState.placeholders['state'];
            if (selectedState && QueryState.stateCountyMap[selectedState]) {
                // Filter out county2 if already selected
                const c2 = QueryState.placeholders['county2'];
                return QueryState.stateCountyMap[selectedState].filter(c => c !== c2);
            }
            return [];  // Empty — state must be selected first
        }
        case 'county2': {
            const selectedState = QueryState.placeholders['state'];
            if (selectedState && QueryState.stateCountyMap[selectedState]) {
                // Filter out county1 if already selected
                const c1 = QueryState.placeholders['county1'];
                return QueryState.stateCountyMap[selectedState].filter(c => c !== c1);
            }
            return [];  // Empty — state must be selected first
        }
        case 'metric': {
            const isComp = QueryState.activeTemplate?.category === 'composite';
            let list = QueryState.allMetrics.length > 0 ? QueryState.allMetrics : [
                { id: 'obesity_prevalence', label: 'Obesity' },
                { id: 'diabetes_prevalence', label: 'Diabetes' },
                { id: 'smoking_prevalence', label: 'Smoking' }
            ];
            if (isComp) {
                const isDis = QueryState.activeTemplate.id.startsWith('disability');
                const allowed = isDis ? COMPOSITE_DISABILITY_METRICS : COMPOSITE_HEALTH_METRICS;
                list = list.filter(m => allowed.some(term => m.id.includes(term)));
            }
            return list;
        }
        case 'metric2': {
            const isComp = QueryState.activeTemplate?.category === 'composite';
            const m1 = QueryState.placeholders['metric'];
            const m1Id = m1 ? (typeof m1 === 'object' ? m1.id : m1) : null;
            let allM = QueryState.allMetrics.length > 0 ? QueryState.allMetrics : [
                { id: 'obesity_prevalence', label: 'Obesity' },
                { id: 'diabetes_prevalence', label: 'Diabetes' },
                { id: 'smoking_prevalence', label: 'Smoking' }
            ];
            if (isComp) {
                const isDis = QueryState.activeTemplate.id.startsWith('disability');
                const allowed = isDis ? COMPOSITE_DISABILITY_METRICS : COMPOSITE_HEALTH_METRICS;
                allM = allM.filter(m => allowed.some(term => m.id.includes(term)));
            }
            return m1Id ? allM.filter(m => m.id !== m1Id) : allM;
        }
        case 'metric3': {
            const isComp = QueryState.activeTemplate?.category === 'composite';
            const m1 = QueryState.placeholders['metric'];
            const m1Id = m1 ? (typeof m1 === 'object' ? m1.id : m1) : null;
            const m2 = QueryState.placeholders['metric2'];
            const m2Id = m2 ? (typeof m2 === 'object' ? m2.id : m2) : null;
            let allM = QueryState.allMetrics.length > 0 ? QueryState.allMetrics : [
                { id: 'obesity_prevalence', label: 'Obesity' },
                { id: 'diabetes_prevalence', label: 'Diabetes' },
                { id: 'smoking_prevalence', label: 'Smoking' }
            ];
            if (isComp) {
                allM = allM.filter(m => COMPOSITE_HEALTH_METRICS.some(term => m.id.includes(term)));
            }
            return allM.filter(m => m.id !== m1Id && m.id !== m2Id);
        }
        case 'state2': {
            const s1 = QueryState.placeholders['state'];
            return QueryState.allStates.filter(s => s !== s1);
        }
        case 'region':
            return ["Northeast", "Midwest", "South", "West"];
        default:
            return [];
    }
}

function handleSelectionChange(key, value) {
    // Find the matching option object
    const options = getOptionsForKey(key);
    const selectedOpt = options.find(o => (typeof o === 'object' ? o.id : o) === value);
    QueryState.placeholders[key] = selectedOpt || value;

    const phs = QueryState.activeTemplate.placeholders;

    // If state changed, refresh county dropdowns
    if (key === 'state') {
        if (phs.includes('county1')) {
            QueryState.placeholders['county1'] = null;
            const sel1 = document.getElementById('select-county1');
            if (sel1) populateSelectOptions(sel1, 'county1');
        }
        if (phs.includes('county2')) {
            QueryState.placeholders['county2'] = null;
            const sel2 = document.getElementById('select-county2');
            if (sel2) populateSelectOptions(sel2, 'county2');
        }
        if (phs.includes('state2')) {
            const selS2 = document.getElementById('select-state2');
            if (selS2) populateSelectOptions(selS2, 'state2');
        }
    }

    if (key === 'metric') {
        if (phs.includes('metric2')) {
            const selM2 = document.getElementById('select-metric2');
            if (selM2) populateSelectOptions(selM2, 'metric2');
        }
        if (phs.includes('metric3')) {
            const selM3 = document.getElementById('select-metric3');
            if (selM3) populateSelectOptions(selM3, 'metric3');
        }
    }
    
    if (key === 'metric2') {
        if (phs.includes('metric3')) {
            const selM3 = document.getElementById('select-metric3');
            if (selM3) populateSelectOptions(selM3, 'metric3');
        }
    }

    // Refresh the other county dropdown to exclude the selected value
    if (key === 'county1' && phs.includes('county2')) {
        const sel2 = document.getElementById('select-county2');
        const prev2 = QueryState.placeholders['county2'];
        if (sel2) {
            populateSelectOptions(sel2, 'county2');
            // Restore previous selection if still valid
            if (prev2) sel2.value = prev2;
        }
    }
    if (key === 'county2' && phs.includes('county1')) {
        const sel1 = document.getElementById('select-county1');
        const prev1 = QueryState.placeholders['county1'];
        if (sel1) {
            populateSelectOptions(sel1, 'county1');
            if (prev1) sel1.value = prev1;
        }
    }

    // Refresh metric2 dropdown to exclude selected metric1
    if (key === 'metric' && phs.includes('metric2')) {
        const sel2 = document.getElementById('select-metric2');
        const prev2 = QueryState.placeholders['metric2'];
        if (sel2) {
            populateSelectOptions(sel2, 'metric2');
            if (prev2 && typeof prev2 === 'object') sel2.value = prev2.id;
        }
    }

    // When metric changes in a range query, rebuild the range/threshold slider with new bounds
    if (key === 'metric' || key === 'state') {
        if (phs.includes('range')) {
            QueryState.placeholders['range'] = null;
            const existingRange = document.getElementById('control-range');
            if (existingRange) {
                const parent = existingRange.parentNode;
                existingRange.remove();
                renderRangeSliderControl(parent);
            }
        }
        if (phs.includes('threshold')) {
            QueryState.placeholders['threshold'] = null;
            const existingThreshold = document.getElementById('control-threshold');
            if (existingThreshold) {
                const parent = existingThreshold.parentNode;
                existingThreshold.remove();
                renderThresholdControl(parent);
            }
        }
    }

    renderActiveQuery();
}

// Validation is now handled by filtering options — county2 excludes county1 and vice versa

function focusPlaceholder(key) {
    document.querySelectorAll('.placeholder').forEach(p => p.classList.remove('active'));
    const ph = document.querySelector(`.placeholder[data-key="${key}"]`);
    if (ph) ph.classList.add('active');

    const sel = document.getElementById(`select-${key}`);
    if (sel) {
        sel.focus();
        const group = document.getElementById(`control-${key}`);
        if (group) group.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/* ── Query Execution ───────────────────────────────────────── */

function executeQuery() {
    if (!QueryState.activeTemplate) return;

    // Check for missing placeholders
    const missing = QueryState.activeTemplate.placeholders.filter(p => {
        if (p === 'metrics') {
            const sel = QueryState.placeholders['metrics'];
            return !Array.isArray(sel) || sel.length < 2;
        }
        // Range and threshold are auto-populated by slider controls
        if (p === 'range' || p === 'threshold') return false;
        return !QueryState.placeholders[p];
    });
    if (missing.length > 0) {
        if (missing.includes('metrics')) {
            showToast('Please select at least 2 metrics.', 'warning');
        } else {
            showToast(`Please select: ${missing.map(m => PLACEHOLDER_LABELS[m] || m).join(', ')}`, 'warning');
        }
        return;
    }

    // Extra validation for county templates
    if (QueryState.activeTemplate.placeholders.includes('county1') &&
        QueryState.activeTemplate.placeholders.includes('county2')) {
        if (QueryState.placeholders['county1'] === QueryState.placeholders['county2']) {
            showToast('Please select two different counties.', 'warning');
            return;
        }
    }

    const resultsSection = document.getElementById('resultsSection');
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Build human-readable query
    let queryString = QueryState.activeTemplate.text;
    QueryState.activeTemplate.placeholders.forEach(key => {
        const val = QueryState.placeholders[key];
        if (key === 'metrics') {
            const labels = Array.isArray(val) ? val.map(m => m.label).join(', ') : '';
            queryString = queryString.replace(`{${key}}`, labels);
        } else if (key === 'range') {
            const rng = val || { min: '?', max: '?' };
            queryString = queryString.replace(`{${key}}`, `${rng.min} – ${rng.max}`);
        } else if (key === 'threshold') {
            queryString = queryString.replace(`{${key}}`, val != null ? val : '?');
        } else {
            const displayVal = typeof val === 'object' ? val.label : val;
            queryString = queryString.replace(`{${key}}`, displayVal);
        }
    });

    document.getElementById('resultSummary').textContent = queryString;

    // Save to history
    addToHistory({
        templateId: QueryState.activeTemplate.id,
        placeholders: { ...QueryState.placeholders },
        queryString: queryString,
        date: new Date().toISOString()
    });

    const canShowMap = [
        'top_states', 'bottom_states', 'state_vs_national', 'range_states', 'range_above_states', 'national_extremes'
    ].includes(QueryState.activeTemplate.resultType);
    
    const canShowRadar = ['composite_state_compare', 'composite_county_profile'].includes(QueryState.activeTemplate.resultType);
    
    const toggleGroup = document.getElementById('vizToggleGroup');
    const mapBtn = document.getElementById('showMapBtn');
    const radarBtn = document.getElementById('showRadarBtn');

    if (canShowMap || canShowRadar) {
        toggleGroup.style.display = 'flex';
        
        if (canShowMap) {
            mapBtn.style.display = 'flex';
            if (radarBtn) radarBtn.style.display = 'none';
        } else if (canShowRadar) {
            mapBtn.style.display = 'none';
            if (radarBtn) radarBtn.style.display = 'flex';
        }

        // Reset to chart view by default
        switchViz('chart');
    } else {
        toggleGroup.style.display = 'none';
        switchViz('chart'); // Ensure chart is visible
    }

    renderRealResults();
}

/* ── Real Data Results ─────────────────────────────────────── */

function renderRealResults(targetId = "amChartResults") {
    const isModal = targetId === "modalAmRoot";
    const container = isModal ? document.getElementById('modalVizContainer') : document.getElementById('chartContainer');

    if (!isModal && QueryState.currentChartRoot) {
        QueryState.currentChartRoot.dispose();
        QueryState.currentChartRoot = null;
    }

    container.innerHTML = `<div id="${targetId}" style="width: 100%; height: ${isModal ? '500px' : '420px'};"></div>`;

    const data = computeResultData();
    const resultType = QueryState.activeTemplate.resultType;

    if (!data || data.length === 0) {
        // Descriptive error message
        const p = QueryState.placeholders;
        const metricLabel = p.metric ? (typeof p.metric === 'object' ? p.metric.label : p.metric) : 'the selected metric';
        const stateName = p.state || p.region || 'the selected area';
        container.innerHTML = `
            <div class="empty-state" style="padding: 60px 20px; text-align: center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c83830" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:16px;opacity:0.6">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p style="font-size:1.05rem;font-weight:700;color:#1e293b;margin-bottom:8px;">Something went wrong</p>
                <p style="font-size:0.9rem;color:#64748b;max-width:500px;margin:0 auto;line-height:1.5;">
                    Data may be missing for <strong>${metricLabel}</strong> in <strong>${stateName}</strong>.
                    This metric might not be available in the ACS or PLACES dataset for the selected counties/states.
                    Try a different metric or location.
                </p>
            </div>`;
        return;
    }

    const root = am5.Root.new(targetId);
    if (isModal) {
        if (!window.modalRoots) window.modalRoots = [];
        window.modalRoots.push(root);
    } else {
        QueryState.currentChartRoot = root;
    }
    root.setThemes([am5themes_Animated.new(root)]);

    // Note: Radar charts reverted to standard bar charts per request

    const chart = root.container.children.push(am5xy.XYChart.new(root, {
        panX: true,
        panY: false,
        wheelX: "panX",
        wheelY: "zoomX",
        pinchZoomX: true,
        paddingLeft: 0,
        layout: root.verticalLayout
    }));

    // Interactive cursor
    chart.set("cursor", am5xy.XYCursor.new(root, {
        behavior: "none"
    }));

    const templateType = QueryState.activeTemplate.resultType;

    // --- Special handling for Scatter Plot ---
    if (templateType === 'correlation_scatter_county') {
        chart.setAll({
            paddingBottom: 40,
            cursor: am5xy.XYCursor.new(root, { behavior: "zoomXY" })
        });

        const m1 = QueryState.placeholders['metric'];
        const m1Label = m1 ? (typeof m1 === 'object' ? m1.label : m1) : 'Metric 1';
        const m2 = QueryState.placeholders['metric2'];
        const m2Label = m2 ? (typeof m2 === 'object' ? m2.label : m2) : 'Metric 2';

        const xAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, {
            renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 50 }),
            tooltip: am5.Tooltip.new(root, {})
        }));
        
        // Add X-Axis Title
        xAxis.children.push(am5.Label.new(root, {
            text: m1Label,
            x: am5.p50,
            centerX: am5.p50,
            y: am5.p100,
            paddingTop: 10,
            fontWeight: "bold",
            fill: am5.color(0x475569)
        }));

        const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
            renderer: am5xy.AxisRendererY.new(root, { minGridDistance: 40 }),
            tooltip: am5.Tooltip.new(root, {})
        }));

        // Add Y-Axis Title
        yAxis.children.unshift(am5.Label.new(root, {
            text: m2Label,
            rotation: -90,
            y: am5.p50,
            centerX: am5.p50,
            x: am5.p0,
            paddingBottom: 10,
            fontWeight: "bold",
            fill: am5.color(0x475569)
        }));

        const series = chart.series.push(am5xy.LineSeries.new(root, {
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: "value2",
            valueXField: "value1",
            tooltip: am5.Tooltip.new(root, {
                labelText: "{name}\n" + m1Label + ": {valueX}\n" + m2Label + ": {valueY}"
            })
        }));

        series.strokes.template.set("strokeOpacity", 0);
        series.bullets.push(function() {
            return am5.Bullet.new(root, {
                sprite: am5.Circle.new(root, {
                    radius: 6,
                    fill: am5.color(0xc83830),
                    fillOpacity: 0.6,
                    stroke: am5.color(0xc83830),
                    strokeWidth: 1
                })
            });
        });

        series.data.setAll(data);
        series.appear(1000);
        chart.appear(1000, 100);

        generateSmartInsight(data);
        return;
    }
    // -----------------------------------------

    const xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 30 });
    xRenderer.labels.template.setAll({
        rotation: data.length > 8 ? -45 : 0,
        centerY: am5.p50,
        centerX: data.length > 8 ? am5.p100 : am5.p50,
        fontSize: 11,
        fill: am5.color(0x475569),
        oversizedBehavior: "truncate",
        maxWidth: 140
    });

    const isMultiSeries = templateType.startsWith('multi_region') || templateType.startsWith('multi_state_rank') ||
        templateType === 'correlation_regions' || templateType === 'correlation_top_states' ||
        templateType === 'composite_state_compare';
    const catField = isMultiSeries || templateType === 'composite_county_profile' ? 'category' : 'name';

    const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
        categoryField: catField,
        renderer: xRenderer,
        tooltip: am5.Tooltip.new(root, {})
    }));

    // Scrollbar for large datasets
    if (data.length > 10) {
        chart.set("scrollbarX", am5.Scrollbar.new(root, { orientation: "horizontal" }));
    }

    const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {}),
        min: 0
    }));
    yAxis.get("renderer").labels.template.setAll({ fontSize: 11, fill: am5.color(0x64748b) });

    // Check if we need dual series (correlation templates)
    const isMultiMetric = resultType.startsWith('multi_');

    if (isMultiMetric) {
        // Multi-metric grouped bar chart
        const selectedMetrics = QueryState.placeholders['metrics'] || [];

        if (resultType === 'multi_state_profile' || resultType === 'multi_county_snapshot') {
            // Single series — each metric is a category (bar)
            const series = chart.series.push(am5xy.ColumnSeries.new(root, {
                name: 'Value',
                xAxis, yAxis,
                valueYField: 'value',
                categoryXField: 'name',
                tooltip: am5.Tooltip.new(root, {
                    pointerOrientation: 'horizontal',
                    labelText: '{categoryX}: {valueY}'
                })
            }));

            series.columns.template.setAll({
                cornerRadiusTL: 6, cornerRadiusTR: 6,
                strokeOpacity: 0, width: am5.percent(65),
                tooltipText: '{categoryX}: {valueY}'
            });

            // Color each bar by metric index
            series.columns.template.adapters.add('fill', (fill, target) => {
                const idx = target.dataItem?.index ?? 0;
                return am5.Color.fromString(MULTI_METRIC_COLORS[idx % MULTI_METRIC_COLORS.length]);
            });
            series.columns.template.adapters.add('stroke', (stroke, target) => {
                const idx = target.dataItem?.index ?? 0;
                return am5.Color.fromString(MULTI_METRIC_COLORS[idx % MULTI_METRIC_COLORS.length]);
            });

            xAxis.data.setAll(data);
            series.data.setAll(data);
            series.appear(800);

        } else {
            // Grouped: each metric is a separate series
            selectedMetrics.forEach((m, i) => {
                const s = chart.series.push(am5xy.ColumnSeries.new(root, {
                    name: m.label,
                    xAxis, yAxis,
                    valueYField: `m${i}`,
                    categoryXField: 'category',
                    clustered: true
                }));

                const color = MULTI_METRIC_COLORS[i % MULTI_METRIC_COLORS.length];
                s.set('fill', am5.Color.fromString(color));
                s.set('stroke', am5.Color.fromString(color));
                s.columns.template.setAll({
                    cornerRadiusTL: 5, cornerRadiusTR: 5,
                    strokeOpacity: 0,
                    width: am5.percent(Math.max(20, 80 / selectedMetrics.length)),
                    tooltipText: '{categoryX}\n' + m.label + ': {valueY}'
                });

                s.data.setAll(data);
                s.appear(800);
            });

            xAxis.data.setAll(data);

            // Legend — use fixed labels so hover doesn't override metric names
            const legend = chart.children.push(am5.Legend.new(root, {
                centerX: am5.p50, x: am5.p50,
                marginTop: 15
            }));
            legend.data.setAll(chart.series.values);
        }

    } else if (resultType === 'correlation_regions' || resultType === 'correlation_top_states' || resultType === 'composite_state_compare') {
        // Dual bar chart
        let name1, name2;
        if (resultType === 'composite_state_compare') {
            name1 = QueryState.placeholders['state'];
            name2 = QueryState.placeholders['state2'];
        } else {
            const m1 = QueryState.placeholders['metric'];
            const m2 = QueryState.placeholders['metric2'];
            name1 = typeof m1 === 'object' ? m1.label : m1;
            name2 = typeof m2 === 'object' ? m2.label : m2;
        }

        const s1 = chart.series.push(am5xy.ColumnSeries.new(root, {
            name: name1,
            xAxis, yAxis,
            valueYField: "value1",
            categoryXField: "category",
            tooltip: am5.Tooltip.new(root, {
                pointerOrientation: "horizontal",
                labelText: "{categoryX}\n{name}: {valueY}"
            })
        }));
        s1.columns.template.setAll({
            cornerRadiusTL: 5, cornerRadiusTR: 5,
            strokeOpacity: 0, width: am5.percent(40),
            tooltipText: "{categoryX}\n" + name1 + ": {valueY}"
        });
        s1.set("fill", am5.color(0xc83830));
        s1.set("stroke", am5.color(0xc83830));

        const s2 = chart.series.push(am5xy.ColumnSeries.new(root, {
            name: name2,
            xAxis, yAxis,
            valueYField: "value2",
            categoryXField: "category",
            tooltip: am5.Tooltip.new(root, {
                pointerOrientation: "horizontal",
                labelText: "{categoryX}\n{name}: {valueY}"
            })
        }));
        s2.columns.template.setAll({
            cornerRadiusTL: 5, cornerRadiusTR: 5,
            strokeOpacity: 0, width: am5.percent(40),
            tooltipText: "{categoryX}\n" + name2 + ": {valueY}"
        });
        s2.set("fill", am5.color(0x6366f1));
        s2.set("stroke", am5.color(0x6366f1));

        // Legend
        const legend = chart.children.push(am5.Legend.new(root, {
            centerX: am5.p50, x: am5.p50,
            marginTop: 15
        }));
        legend.data.setAll(chart.series.values);

        xAxis.data.setAll(data);
        s1.data.setAll(data);
        s2.data.setAll(data);
        s1.appear(800);
        s2.appear(800);
    } else {
        // Single series
        let metricLabel = QueryState.placeholders['metric']
            ? (typeof QueryState.placeholders['metric'] === 'object' ? QueryState.placeholders['metric'].label : QueryState.placeholders['metric'])
            : 'Value';
        
        if (resultType === 'composite_county_profile') {
            metricLabel = 'Wellness Score';
        }

        const series = chart.series.push(am5xy.ColumnSeries.new(root, {
            name: metricLabel,
            xAxis, yAxis,
            valueYField: "value",
            categoryXField: catField,
            tooltip: am5.Tooltip.new(root, {
                pointerOrientation: "horizontal",
                labelText: "{categoryX}: {valueY}"
            })
        }));

        series.columns.template.setAll({
            cornerRadiusTL: 6,
            cornerRadiusTR: 6,
            strokeOpacity: 0,
            width: am5.percent(70),
            tooltipText: "{categoryX}: {valueY}"
        });

        // Color: highlight special bars (e.g., averages)
        series.columns.template.adapters.add("fill", (fill, target) => {
            const d = target.dataItem?.dataContext;
            if (d && d.highlight) return am5.Color.fromString("#6366f1");
            return am5.Color.fromString(resultType.startsWith('composite') ? "#e11d48" : "#c83830");
        });
        series.columns.template.adapters.add("stroke", (stroke, target) => {
            const d = target.dataItem?.dataContext;
            if (d && d.highlight) return am5.Color.fromString("#6366f1");
            return am5.Color.fromString(resultType.startsWith('composite') ? "#e11d48" : "#c83830");
        });

        xAxis.data.setAll(data);
        series.data.setAll(data);
        series.appear(800);
    }

    chart.appear(800, 100);

    // ── Generate Smart Insight ──
    if (!isModal) {
        generateSmartInsight(data);
    }
}

/**
 * Normalizes a value between 0 and 1 based on dataset bounds
 * and whether the metric is "positive" or "negative".
 */
function normalizeMetric(value, min, max, isNegative) {
    if (max === min) return 0.5;
    let normalized = (value - min) / (max - min);
    return isNegative ? (1 - normalized) : normalized;
}

const NEGATIVE_METRICS = [
    'unemployment', 'prevalence', 'insecurity', 'isolation', 'barrier', 'english', 'lack'
];

function isMetricNegative(id) {
    id = id.toLowerCase();
    return NEGATIVE_METRICS.some(term => id.includes(term));
}

function generateSmartInsight(data) {
    const container = document.getElementById('smartInsightContainer');
    const textEl = document.getElementById('insightText');
    if (!container || !textEl || !data || data.length === 0) {
        if (container) container.style.display = 'none';
        return;
    }

    if (data[0].value === undefined && data[0].value1 === undefined && data[0].m0 === undefined) {
        if (container) container.style.display = 'none';
        return;
    }

    let insight = "";
    const p = QueryState.placeholders;
    const template = QueryState.activeTemplate;
    
    // Sort logic to find true top/bottom if not already sorted
    const sorted = [...data].sort((a,b) => (b.value ?? b.value1 ?? b.m0 ?? 0) - (a.value ?? a.value1 ?? a.m0 ?? 0));
    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];
    const metricLabel = p.metric ? (typeof p.metric === 'object' ? p.metric.label : p.metric) : 'this metric';

    const getVal = (d) => d.value ?? d.value1 ?? d.m0 ?? 0;
    const topVal = getVal(top);
    const bottomVal = getVal(bottom);

    // Different insight strategies based on query type
    if (template.resultType.includes('top')) {
        insight = `<strong>${top.name || top.state || top.category}</strong> ranks at the top with a value of <strong>${topVal.toFixed(1)}</strong>. This is significantly higher than the rest of the group.`;
    } else if (template.resultType.includes('bottom')) {
        insight = `<strong>${bottom.name || bottom.state || bottom.category}</strong> has the lowest recorded value of <strong>${bottomVal.toFixed(1)}</strong> for ${metricLabel}.`;
    } else if (template.resultType.includes('national')) {
        const nat = data.find(d => d.name === 'National Average' || d.category === 'National');
        const state = data.find(d => d.name !== 'National Average' && d.category !== 'National');
        if (nat && state) {
            const diff = ((getVal(state) - getVal(nat)) / (getVal(nat) || 1) * 100).toFixed(1);
            const relative = getVal(state) > getVal(nat) ? "above" : "below";
            insight = `Compared to the national average of <strong>${getVal(nat).toFixed(1)}</strong>, this location is <strong>${Math.abs(diff)}% ${relative}</strong> the benchmark.`;
        }
    } else {
        // Generic spread insight
        const spread = (topVal - bottomVal).toFixed(1);
        insight = `The analysis shows a spread of <strong>${spread}</strong> between the highest and lowest points, with ${top.name || top.state || top.category} leading the group.`;
    }

    if (!insight) {
        if (container) container.style.display = 'none';
        return;
    }

    textEl.innerHTML = insight;
    container.style.display = 'flex';
}


/* ── Data Computation per Template ─────────────────────────── */

function computeResultData() {
    const p = QueryState.placeholders;
    const type = QueryState.activeTemplate.resultType;
    const metricId = p.metric ? (typeof p.metric === 'object' ? p.metric.id : p.metric) : null;
    const metricLabel = p.metric ? (typeof p.metric === 'object' ? p.metric.label : p.metric) : '';
    const countNum = parseInt(p.count) || 5;

    switch (type) {
        case 'top': {
            // Top N counties in a state
            const stateName = p.state;
            const counties = QueryState.countyData
                .filter(c => c.state_name === stateName && c[metricId] != null)
                .sort((a, b) => b[metricId] - a[metricId])
                .slice(0, countNum);
            return counties.map(c => ({ name: c.name, value: +c[metricId]?.toFixed(2), state_abbr: c.state_abbr }));
        }

        case 'bottom': {
            const stateName = p.state;
            const counties = QueryState.countyData
                .filter(c => c.state_name === stateName && c[metricId] != null)
                .sort((a, b) => a[metricId] - b[metricId])
                .slice(0, countNum);
            return counties.map(c => ({ name: c.name, value: +c[metricId]?.toFixed(2), state_abbr: c.state_abbr }));
        }

        case 'top_states': {
            const states = QueryState.stateData
                .filter(s => s[metricId] != null)
                .sort((a, b) => b[metricId] - a[metricId])
                .slice(0, countNum);
            return states.map(s => ({ name: s.name, value: +s[metricId]?.toFixed(2) }));
        }

        case 'bottom_states': {
            const states = QueryState.stateData
                .filter(s => s[metricId] != null)
                .sort((a, b) => a[metricId] - b[metricId])
                .slice(0, countNum);
            return states.map(s => ({ name: s.name, value: +s[metricId]?.toFixed(2) }));
        }

        case 'county_compare': {
            const stateName = p.state;
            const c1Name = p.county1;
            const c2Name = p.county2;
            const county1 = QueryState.countyData.find(c => c.name === c1Name && c.state_name === stateName);
            const county2 = QueryState.countyData.find(c => c.name === c2Name && c.state_name === stateName);

            const stateCounties = QueryState.countyData.filter(c => c.state_name === stateName && c[metricId] != null);
            const stateAvg = stateCounties.length > 0
                ? stateCounties.reduce((s, c) => s + c[metricId], 0) / stateCounties.length
                : 0;

            const result = [];
            if (county1 && county1[metricId] != null) result.push({ name: c1Name, value: +county1[metricId].toFixed(2), state_abbr: county1.state_abbr });
            if (county2 && county2[metricId] != null) result.push({ name: c2Name, value: +county2[metricId].toFixed(2), state_abbr: county2.state_abbr });
            result.push({ name: `${stateName} Avg`, value: +stateAvg.toFixed(2), highlight: true });
            return result;
        }

        case 'county_vs_avg': {
            const stateName = p.state;
            const cName = p.county1;
            const county = QueryState.countyData.find(c => c.name === cName && c.state_name === stateName);
            const stateCounties = QueryState.countyData.filter(c => c.state_name === stateName && c[metricId] != null);
            const stateAvg = stateCounties.length > 0
                ? stateCounties.reduce((s, c) => s + c[metricId], 0) / stateCounties.length : 0;
            const allCounties = QueryState.countyData.filter(c => c[metricId] != null);
            const natAvg = allCounties.length > 0
                ? allCounties.reduce((s, c) => s + c[metricId], 0) / allCounties.length : 0;

            const result = [];
            if (county && county[metricId] != null) result.push({ name: cName, value: +county[metricId].toFixed(2), state_abbr: county.state_abbr });
            result.push({ name: `${stateName} Avg`, value: +stateAvg.toFixed(2), highlight: true });
            result.push({ name: 'National Avg', value: +natAvg.toFixed(2), highlight: true });
            return result;
        }

        case 'state_counties_sorted': {
            const stateName = p.state;
            const counties = QueryState.countyData
                .filter(c => c.state_name === stateName && c[metricId] != null)
                .sort((a, b) => b[metricId] - a[metricId])
                .slice(0, 20); // Limit to top 20 for readability
            return counties.map(c => ({ name: c.name, value: +c[metricId]?.toFixed(2), state_abbr: c.state_abbr }));
        }

        case 'region_states': {
            const region = p.region;
            const regionStates = REGION_STATES[region] || [];
            const states = QueryState.stateData
                .filter(s => regionStates.includes(s.name) && s[metricId] != null)
                .sort((a, b) => b[metricId] - a[metricId]);
            return states.map(s => ({ name: s.name, value: +s[metricId]?.toFixed(2) }));
        }

        case 'state_vs_national': {
            const stateName = p.state;
            const stateObj = QueryState.stateData.find(s => s.name === stateName);
            const allStates = QueryState.stateData.filter(s => s[metricId] != null);
            const natAvg = allStates.length > 0
                ? allStates.reduce((s, d) => s + d[metricId], 0) / allStates.length : 0;

            const result = [];
            if (stateObj && stateObj[metricId] != null) result.push({ name: stateName, value: +stateObj[metricId].toFixed(2) });
            result.push({ name: 'National Avg', value: +natAvg.toFixed(2), highlight: true });
            return result;
        }

        case 'region_compare': {
            const region = p.region;
            const regionStates = REGION_STATES[region] || [];
            const states = QueryState.stateData
                .filter(s => regionStates.includes(s.name) && s[metricId] != null)
                .sort((a, b) => b[metricId] - a[metricId]);
            return states.map(s => ({ name: s.name, value: +s[metricId]?.toFixed(2) }));
        }

        case 'national_regions': {
            return Object.keys(REGION_STATES).map(region => {
                const regionStates = REGION_STATES[region];
                const states = QueryState.stateData.filter(s => regionStates.includes(s.name) && s[metricId] != null);
                const avg = states.length > 0
                    ? states.reduce((s, d) => s + d[metricId], 0) / states.length : 0;
                return { name: region, value: +avg.toFixed(2) };
            });
        }

        case 'national_extremes': {
            const sorted = QueryState.stateData
                .filter(s => s[metricId] != null)
                .sort((a, b) => b[metricId] - a[metricId]);
            const top = sorted.slice(0, countNum);
            const bottom = sorted.slice(-countNum).reverse();
            const result = [];
            top.forEach(s => result.push({ name: s.name + ' ↑', value: +s[metricId].toFixed(2) }));
            bottom.forEach(s => result.push({ name: s.name + ' ↓', value: +s[metricId].toFixed(2), highlight: true }));
            return result;
        }

        case 'correlation_regions': {
            const metric2Id = p.metric2 ? (typeof p.metric2 === 'object' ? p.metric2.id : p.metric2) : null;
            return Object.keys(REGION_STATES).map(region => {
                const regionStates = REGION_STATES[region];
                const states = QueryState.stateData.filter(s => regionStates.includes(s.name));
                const avg1 = states.filter(s => s[metricId] != null).reduce((s, d) => s + d[metricId], 0) / (states.filter(s => s[metricId] != null).length || 1);
                const avg2 = states.filter(s => s[metric2Id] != null).reduce((s, d) => s + d[metric2Id], 0) / (states.filter(s => s[metric2Id] != null).length || 1);
                return { category: region, value1: +avg1.toFixed(2), value2: +avg2.toFixed(2) };
            });
        }

        case 'correlation_top_states': {
            const metric2Id = p.metric2 ? (typeof p.metric2 === 'object' ? p.metric2.id : p.metric2) : null;
            const sorted = QueryState.stateData
                .filter(s => s[metricId] != null)
                .sort((a, b) => b[metricId] - a[metricId])
                .slice(0, countNum);
            return sorted.map(s => ({
                category: s.name,
                value1: +(s[metricId] || 0).toFixed(2),
                value2: +(s[metric2Id] || 0).toFixed(2)
            }));
        }

        case 'correlation_scatter_county': {
            const stateName = p.state;
            const metric2Id = p.metric2 ? (typeof p.metric2 === 'object' ? p.metric2.id : p.metric2) : null;
            if (!stateName || !metricId || !metric2Id) return [];

            const counties = QueryState.countyData.filter(c => 
                c.state_name === stateName && c[metricId] != null && c[metric2Id] != null
            );

            return counties.map(c => ({
                name: c.name,
                value1: +(c[metricId]).toFixed(2),
                value2: +(c[metric2Id]).toFixed(2)
            }));
        }

        // ── Multi-Metric Templates ──

        case 'multi_state_profile': {
            const stateName = p.state;
            const stateObj = QueryState.stateData.find(s => s.name === stateName);
            const selectedMetrics = p.metrics || [];
            if (!stateObj || selectedMetrics.length === 0) return [];

            // Each metric becomes a bar; the state's value is the data
            return selectedMetrics.map(m => {
                const val = stateObj[m.id];
                return { name: m.label, value: val != null ? +val.toFixed(2) : 0 };
            }).filter(d => d.value > 0);
        }

        case 'multi_county_snapshot': {
            const stateName = p.state;
            const cName = p.county1;
            const selectedMetrics = p.metrics || [];
            const county = QueryState.countyData.find(c => c.name === cName && c.state_name === stateName);
            if (!county || selectedMetrics.length === 0) return [];

            return selectedMetrics.map(m => {
                const val = county[m.id];
                return { name: m.label, value: val != null ? +val.toFixed(2) : 0 };
            }).filter(d => d.value > 0);
        }

        case 'multi_region_compare': {
            // Grouped: each region is a category, each metric is a series
            const selectedMetrics = p.metrics || [];
            if (selectedMetrics.length === 0) return [];

            return Object.keys(REGION_STATES).map(region => {
                const regionStates = REGION_STATES[region];
                const row = { category: region };
                selectedMetrics.forEach((m, i) => {
                    const vals = QueryState.stateData
                        .filter(s => regionStates.includes(s.name) && s[m.id] != null);
                    const avg = vals.length > 0
                        ? vals.reduce((sum, s) => sum + s[m.id], 0) / vals.length : 0;
                    row[`m${i}`] = +avg.toFixed(2);
                });
                return row;
            });
        }

        case 'multi_state_rank': {
            // Show top N states for the first metric, include all selected metrics as series
            const selectedMetrics = p.metrics || [];
            if (selectedMetrics.length === 0) return [];

            // Sort by first selected metric
            const sortMetric = selectedMetrics[0].id;
            const sorted = QueryState.stateData
                .filter(s => s[sortMetric] != null)
                .sort((a, b) => b[sortMetric] - a[sortMetric])
                .slice(0, countNum);

            return sorted.map(s => {
                const row = { category: s.name };
                selectedMetrics.forEach((m, i) => {
                    row[`m${i}`] = +(s[m.id] || 0).toFixed(2);
                });
                return row;
            });
        }

        // ── Range Queries ──

        case 'range_states': {
            const rng = p.range || { min: 0, max: 100 };
            const inRange = QueryState.stateData
                .filter(s => s[metricId] != null && s[metricId] >= rng.min && s[metricId] <= rng.max)
                .sort((a, b) => b[metricId] - a[metricId]);
            return inRange.map(s => ({ name: s.name, value: +s[metricId].toFixed(2) }));
        }

        case 'range_counties': {
            const stateName = p.state;
            const rng = p.range || { min: 0, max: 100 };
            const inRange = QueryState.countyData
                .filter(c => c.state_name === stateName && c[metricId] != null
                    && c[metricId] >= rng.min && c[metricId] <= rng.max)
                .sort((a, b) => b[metricId] - a[metricId]);
            return inRange.map(c => ({ name: c.name, value: +c[metricId].toFixed(2), state_abbr: c.state_abbr }));
        }

        case 'range_above_states': {
            const thresh = p.threshold ?? 50;
            const above = QueryState.stateData
                .filter(s => s[metricId] != null && s[metricId] >= thresh)
                .sort((a, b) => b[metricId] - a[metricId]);
            return above.map(s => ({ name: s.name, value: +s[metricId].toFixed(2) }));
        }

        case 'range_below_counties': {
            const stateName = p.state;
            const thresh = p.threshold ?? 50;
            const below = QueryState.countyData
                .filter(c => c.state_name === stateName && c[metricId] != null
                    && c[metricId] <= thresh)
                .sort((a, b) => a[metricId] - b[metricId]);
            return below.map(c => ({ name: c.name, value: +c[metricId].toFixed(2), state_abbr: c.state_abbr }));
        }

        case 'composite_state_rank': {
            const metrics = (p.metrics || []).map(m => m.id || m).filter(Boolean);
            
            // Pre-calculate min/max for normalization
            const bounds = {};
            metrics.forEach(mId => {
                const vals = QueryState.stateData.map(s => s[mId]).filter(v => v != null);
                bounds[mId] = { min: Math.min(...vals), max: Math.max(...vals) };
            });

            return QueryState.stateData.map(s => {
                let totalScore = 0;
                let count = 0;
                metrics.forEach(mId => {
                    if (s[mId] != null) {
                        const score = normalizeMetric(s[mId], bounds[mId].min, bounds[mId].max, isMetricNegative(mId));
                        totalScore += score;
                        count++;
                    }
                });
                return { name: s.name, value: count > 0 ? +((totalScore / count) * 100).toFixed(1) : 0 };
            }).sort((a,b) => b.value - a.value).slice(0, 15);
        }

        case 'composite_county_profile': {
            const stateName = p.state;
            const cName = p.county1;
            const selected = p.metrics || [];
            const county = QueryState.countyData.find(c => c.name === cName && c.state_name === stateName);
            if (!county) return [];

            // Radar format: { category: "Metric Name", value: 0-100 }
            return selected.map(m => {
                const mId = m.id || m;
                const mLabel = m.label || m;
                // Normalize against ALL counties in the same state for context
                const stateVals = QueryState.countyData.filter(c => c.state_name === stateName && c[mId] != null).map(c => c[mId]);
                const min = Math.min(...stateVals);
                const max = Math.max(...stateVals);
                const score = normalizeMetric(county[mId] || 0, min, max, isMetricNegative(mId));
                return { category: mLabel, value: +(score * 100).toFixed(1) };
            });
        }

        case 'composite_state_compare': {
            const s1Name = p.state;
            const s2Name = p.state2;
            const selectedMetrics = p.metrics || [];
            const s1 = QueryState.stateData.find(s => s.name === s1Name);
            const s2 = QueryState.stateData.find(s => s.name === s2Name);
            if (!s1 || !s2) return [];

            return selectedMetrics.map(m => {
                const mId = m.id;
                const allVals = QueryState.stateData.map(s => s[mId]).filter(v => v != null);
                const min = Math.min(...allVals);
                const max = Math.max(...allVals);
                const score1 = normalizeMetric(s1[mId] || 0, min, max, isMetricNegative(mId));
                const score2 = normalizeMetric(s2[mId] || 0, min, max, isMetricNegative(mId));
                return { 
                    category: m.label, 
                    value1: +(score1 * 100).toFixed(1), 
                    value2: +(score2 * 100).toFixed(1) 
                };
            });
        }

        default:
            return [];
    }
}

/* ── Toast ─────────────────────────────────────────────────── */

function showToast(message, type = 'info') {
    document.querySelectorAll('.query-toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = 'query-toast';

    const iconSvg = type === 'success'
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s var(--q-transition) forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

/* ── Reset ─────────────────────────────────────────────────── */

function resetQuery() {
    QueryState.activeTemplate = null;
    QueryState.placeholders = {};

    if (QueryState.currentChartRoot) {
        QueryState.currentChartRoot.dispose();
        QueryState.currentChartRoot = null;
    }
    if (QueryState.currentMapRoot) {
        QueryState.currentMapRoot.dispose();
        QueryState.currentMapRoot = null;
    }
    if (QueryState.currentRadarRoot) {
        QueryState.currentRadarRoot.dispose();
        QueryState.currentRadarRoot = null;
    }

    document.getElementById('queryEditor').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
}

function normalizeCountyName(name) {
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

/* ── Map Results ───────────────────────────────────────────── */

function renderMapResults(targetId = "amMapResults") {
    const isModal = targetId === "modalAmRoot";
    const container = isModal ? document.getElementById('modalVizContainer') : document.getElementById('mapContainer');
    if (!isModal && container.style.display === 'none') return; 

    if (!isModal && QueryState.currentMapRoot) {
        QueryState.currentMapRoot.dispose();
        QueryState.currentMapRoot = null;
    }

    const data = computeResultData();
    if (!data || data.length === 0) return;

    const resultType = QueryState.activeTemplate.resultType;
    const isCountyRes = [
        'top', 'bottom', 'county_compare', 'county_vs_avg', 'state_counties_sorted', 
        'range_counties', 'range_below_counties', 'multi_county_snapshot'
    ].includes(resultType);

    const useGeoData = (isCountyRes && typeof am5geodata_region_usa_usaCountiesLow !== 'undefined')
        ? am5geodata_region_usa_usaCountiesLow
        : am5geodata_usaLow;

    container.innerHTML = `<div id="${targetId}" style="width: 100%; height: 500px; background: #fff;"></div>`;

    const root = am5.Root.new(targetId);
    if (isModal) {
        if (!window.modalRoots) window.modalRoots = [];
        window.modalRoots.push(root);
    } else {
        QueryState.currentMapRoot = root;
    }
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(am5map.MapChart.new(root, {
        panX: "translateX",
        panY: "translateY",
        projection: am5map.geoAlbersUsa(),
        wheelY: "zoom",
        paddingBottom: 20
    }));

    const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
        geoJSON: useGeoData,
        valueField: "value",
        calculateAggregates: true
    }));

    // State abbreviation for filtering/matching
    const stateName = QueryState.placeholders.state;
    const stateObj = stateName ? QueryState.stateData.find(s => s.name === stateName) : null;
    const stateAbbr = stateObj ? stateObj.state_abbr?.toUpperCase() : null;

    if (isCountyRes && stateAbbr && useGeoData && useGeoData.features) {
        const includeIds = useGeoData.features
            .filter(f => f.properties && (f.properties.STATE === stateAbbr || f.id.startsWith("US-" + stateAbbr)))
            .map(f => f.id);
        if (includeIds.length > 0) {
            polygonSeries.set("include", includeIds);
        }
    }

    // Map Tooltip
    const tooltip = am5.Tooltip.new(root, {
        getFillFromSprite: false,
        getStrokeFromSprite: false,
        autoTextColor: false,
        pointerOrientation: "horizontal",
        labelText: "{name}: [bold]{value}[/]"
    });

    tooltip.get("background").setAll({
        fill: am5.color(0xffffff),
        fillOpacity: 0.95,
        stroke: am5.color(0xe0e0e0),
        strokeWidth: 1,
        shadowColor: am5.color(0x000000),
        shadowBlur: 10,
        shadowOpacity: 0.1,
        cornerRadius: 4
    });

    tooltip.label.setAll({
        fill: am5.color(0x333333),
        fontSize: "0.85rem"
    });

    polygonSeries.mapPolygons.template.setAll({
        tooltip: tooltip,
        tooltipText: "{name}: [bold]{value}[/]",
        fill: am5.color(0xf5f5f5),
        stroke: am5.color(0xffffff),
        strokeWidth: isCountyRes ? 0.5 : 1,
        interactive: true,
        templateField: "polygonSettings"
    });

    polygonSeries.mapPolygons.template.states.create("hover", {
        strokeWidth: 2,
        stroke: am5.color(0x000000),
        strokeOpacity: 1
    });

    // Heat rules
    polygonSeries.set("heatRules", [{
        target: polygonSeries.mapPolygons.template,
        dataField: "value",
        min: am5.color(0xfff1f0),
        max: am5.color(0xc83830),
        key: "fill"
    }]);

    const nameToId = {};
    if (useGeoData && useGeoData.features) {
        useGeoData.features.forEach(f => {
            if (f.properties && f.properties.name) {
                const norm = normalizeCountyName(f.properties.name);
                const sAbbr = f.properties.STATE || (f.id ? f.id.split('-')[1] : null);
                if (sAbbr) {
                    nameToId[norm + "|" + sAbbr.toUpperCase()] = f.id;
                }
            }
        });
    }

    const mapData = data.map(d => {
        let id = null;
        const norm = normalizeCountyName(d.name);
        const dStateAbbr = (d.state_abbr || stateAbbr || "").toUpperCase();
        
        if (isCountyRes) {
            id = nameToId[norm + "|" + dStateAbbr];
        } else {
            // State match
            const sObj = QueryState.stateData.find(s => s.name === d.name);
            id = sObj ? sObj.id.replace('.', '-') : d.id;
        }

        return {
            id: id,
            value: d.value,
            name: d.name,
            polygonSettings: {
                stroke: am5.color(0xc83830),
                strokeWidth: isCountyRes ? 1 : 1.5,
                strokeOpacity: 1
            }
        };
    }).filter(d => d.id);

    polygonSeries.data.setAll(mapData);

    // Zoom
    polygonSeries.events.on("datavalidated", () => {
        if (isCountyRes && stateAbbr) {
            chart.zoomToSeries(polygonSeries);
        } else if (!isCountyRes && data.length === 1) {
            chart.zoomToDataItem(polygonSeries.dataItems[0]);
        }
    });
}

/* ── Radar Results ───────────────────────────────────────────── */

function renderRadarResults(targetId = "amRadarResults") {
    const isModal = targetId === "modalAmRoot";
    const container = isModal ? document.getElementById('modalVizContainer') : document.getElementById('radarContainer');
    if (!isModal && container.style.display === 'none') return; 

    if (!isModal && QueryState.currentRadarRoot) {
        QueryState.currentRadarRoot.dispose();
        QueryState.currentRadarRoot = null;
    }

    const data = computeResultData();
    if (!data || data.length === 0) return;

    container.innerHTML = `<div id="${targetId}" style="width: 100%; height: 500px; background: #fff;"></div>`;

    const root = am5.Root.new(targetId);
    if (isModal) {
        if (!window.modalRoots) window.modalRoots = [];
        window.modalRoots.push(root);
    } else {
        QueryState.currentRadarRoot = root;
    }
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(am5radar.RadarChart.new(root, {
        panX: false,
        panY: false,
        wheelX: "none",
        wheelY: "none"
    }));

    chart.set("cursor", am5radar.RadarCursor.new(root, {
        behavior: "zoomX"
    }));

    const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
        maxDeviation: 0,
        categoryField: "category",
        renderer: am5radar.AxisRendererCircular.new(root, {})
    }));
    xAxis.get("renderer").labels.template.setAll({
        fontSize: 12,
        fill: am5.color(0x475569)
    });

    const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
        min: 0,
        max: 100,
        renderer: am5radar.AxisRendererRadial.new(root, {
            minGridDistance: 20
        })
    }));

    // Series Config
    const p = QueryState.placeholders;
    const resultType = QueryState.activeTemplate.resultType;
    const isSingle = resultType === 'composite_county_profile';

    if (isSingle) {
        const name1 = p.county1 || "County";
        const series1 = chart.series.push(am5radar.RadarLineSeries.new(root, {
            name: name1,
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: "value",
            categoryXField: "category",
            tooltip: am5.Tooltip.new(root, {
                labelText: "{name}: {valueY}"
            })
        }));
        series1.set("fill", am5.color(0xc83830));
        series1.set("stroke", am5.color(0xc83830));
        series1.strokes.template.setAll({ strokeWidth: 3 });
        series1.fills.template.setAll({ fillOpacity: 0.2, visible: true });
        series1.bullets.push(() => am5.Bullet.new(root, {
            sprite: am5.Circle.new(root, { radius: 5, fill: am5.color(0xc83830) })
        }));

        xAxis.data.setAll(data);
        series1.data.setAll(data);
        series1.appear(1000);
    } else {
        const name1 = p.state || "State 1";
        const name2 = p.state2 || "State 2";

        const series1 = chart.series.push(am5radar.RadarLineSeries.new(root, {
            name: name1,
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: "value1",
            categoryXField: "category",
            tooltip: am5.Tooltip.new(root, {
                labelText: "{name}: {valueY}"
            })
        }));
        series1.set("fill", am5.color(0xc83830));
        series1.set("stroke", am5.color(0xc83830));
        series1.strokes.template.setAll({ strokeWidth: 3 });
        series1.fills.template.setAll({ fillOpacity: 0.2, visible: true });
        series1.bullets.push(() => am5.Bullet.new(root, {
            sprite: am5.Circle.new(root, { radius: 5, fill: am5.color(0xc83830) })
        }));

        const series2 = chart.series.push(am5radar.RadarLineSeries.new(root, {
            name: name2,
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: "value2",
            categoryXField: "category",
            tooltip: am5.Tooltip.new(root, {
                labelText: "{name}: {valueY}"
            })
        }));
        series2.set("fill", am5.color(0x6366f1));
        series2.set("stroke", am5.color(0x6366f1));
        series2.strokes.template.setAll({ strokeWidth: 3 });
        series2.fills.template.setAll({ fillOpacity: 0.2, visible: true });
        series2.bullets.push(() => am5.Bullet.new(root, {
            sprite: am5.Circle.new(root, { radius: 5, fill: am5.color(0x6366f1) })
        }));

        xAxis.data.setAll(data);
        series1.data.setAll(data);
        series2.data.setAll(data);
        series1.appear(1000);
        series2.appear(1000);
    }

    // Legend
    const legend = chart.children.push(am5.Legend.new(root, {
        centerX: am5.p50,
        x: am5.p50,
        marginTop: 15
    }));
    legend.data.setAll(chart.series.values);

    chart.appear(1000, 100);
}

/* ── History Management ────────────────────────────────────── */

function addToHistory(queryObj) {
    // Avoid exact duplicates in a row
    if (QueryState.history.length > 0 && 
        QueryState.history[0].queryString === queryObj.queryString) {
        return;
    }

    QueryState.history.unshift(queryObj);
    if (QueryState.history.length > 20) {
        QueryState.history.pop();
    }

    localStorage.setItem('query_history', JSON.stringify(QueryState.history));
    renderHistory();
}

function loadHistory() {
    const saved = localStorage.getItem('query_history');
    if (saved) {
        try {
            QueryState.history = JSON.parse(saved);
        } catch (e) {
            QueryState.history = [];
        }
    }
    renderHistory();
}

function renderHistory(filteredItems = null) {
    const listEl = document.getElementById('historyList');
    if (!listEl) return;

    const itemsToRender = filteredItems || QueryState.history;

    if (itemsToRender.length === 0) {
        listEl.innerHTML = `
            <div class="history-empty">
                <p>${filteredItems ? 'No matching items found.' : 'No recent queries yet.'}</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = '';

    // Only show warning if not searching and at limit
    if (!filteredItems && QueryState.history.length === 20) {
        const warning = document.createElement('div');
        warning.className = 'history-warning';
        warning.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            Limit reached. Older history will be deleted.
        `;
        listEl.appendChild(warning);
    }

    itemsToRender.forEach((q, idx) => {
        // Find real index in QueryState.history if we are using filtered list
        const realIdx = filteredItems ? QueryState.history.indexOf(q) : idx;
        
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const template = TEMPLATES.find(t => t.id === q.templateId);
        const meta = template ? (CATEGORY_META[template.category] || { label: template.category, color: '#64748b' }) : { label: 'Query', color: '#64748b' };
        item.style.setProperty('--tag-color', meta.color);

        item.innerHTML = `
            <div class="history-item-tpl">${meta.label}</div>
            <div class="history-item-summary">${q.queryString}</div>
        `;

        item.onclick = () => rerunQuery(realIdx);
        listEl.appendChild(item);
    });
}

function filterHistory(value) {
    const term = value.toLowerCase().trim();
    if (!term) {
        renderHistory();
        return;
    }

    const filtered = QueryState.history.filter(q => {
        return q.queryString.toLowerCase().includes(term);
    });

    renderHistory(filtered);
}


function rerunQuery(index) {
    const q = QueryState.history[index];
    if (!q) return;

    const template = TEMPLATES.find(t => t.id === q.templateId);
    if (!template) return;

    // 1. Prepare Modal UI
    const modal = document.getElementById('analysisModal');
    const modalTag = document.getElementById('modalTag');
    const modalQuery = document.getElementById('modalQuery');
    const modalViz = document.getElementById('modalVizContainer');

    const meta = CATEGORY_META[template.category] || { label: template.category, color: '#c83830' };
    modalTag.innerText = meta.label;
    modalTag.style.setProperty('--tag-color', meta.color);
    modalTag.style.background = meta.color;
    modalQuery.innerText = q.queryString;
    
    modal.classList.add('active');
    
    // 2. Clear previous modal viz
    if (window.modalRoots) {
        window.modalRoots.forEach(r => r.dispose());
        window.modalRoots = [];
    }
    modalViz.innerHTML = '';

    // 3. Temporarily swap QueryState to re-run
    const oldPlaceholders = { ...QueryState.placeholders };
    const oldTemplate = QueryState.activeTemplate;
    
    QueryState.activeTemplate = template;
    QueryState.placeholders = { ...q.placeholders };

    // 4. Render to modal
    modalViz.innerHTML = '<div id="modalAmRoot" style="width: 100%; height: 500px;"></div>';
    
    // Determine if we need to wait for DOM or if innerHTML is enough
    setTimeout(() => {
        renderRealResults("modalAmRoot");
        
        // 5. Restore QueryState
        QueryState.activeTemplate = oldTemplate;
        QueryState.placeholders = oldPlaceholders;
    }, 50);
}

function closeModal() {
    const modal = document.getElementById('analysisModal');
    modal.classList.remove('active');
    if (window.modalRoots) {
        window.modalRoots.forEach(r => r.dispose());
        window.modalRoots = [];
    }
}

function clearHistory() {
    QueryState.history = [];
    localStorage.removeItem('query_history');
    renderHistory();
}

function showIndexCalculationInfo() {
    // Check if an info box already exists
    if (document.getElementById('calcInfoBox')) return;

    const overlay = document.createElement('div');
    overlay.id = 'calcInfoOverlay';
    overlay.className = 'calc-info-overlay';
    
    const infoBox = document.createElement('div');
    infoBox.id = 'calcInfoBox';
    infoBox.className = 'calc-info-box';
    
    infoBox.innerHTML = `
        <div class="info-box-header">
            <h3>Wellness Index Calculation</h3>
            <button onclick="closeCalcInfo()" class="info-close-btn">&times;</button>
        </div>
        <div class="info-box-body">
            <p>The Wellness Index (0-100) is a weighted score that allows fair comparison across different health outcomes. It is calculated in 4 steps:</p>
            <div class="info-step">
                <div class="step-num">1</div>
                <div><strong>Normalization:</strong> Each value is scaled between 0.0 and 1.0 based on the min/max of the selected dataset.</div>
            </div>
            <div class="info-step">
                <div class="step-num">2</div>
                <div><strong>Directional Adjustment:</strong> For metrics where lower is better (like Obesity), the score is inverted so a lower raw value yields a higher index.</div>
            </div>
            <div class="info-step">
                <div class="step-num">3</div>
                <div><strong>Aggregation:</strong> We take the average of the normalized scores for all selected metrics to create a single "Unified Grade".</div>
            </div>
            <div class="info-step">
                <div class="step-num">4</div>
                <div><strong>Scaling:</strong> The final average is multiplied by 100. A score of <strong>100</strong> represents the best performer in the current group.</div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(infoBox);

    overlay.onclick = closeCalcInfo;
}

function closeCalcInfo() {
    const overlay = document.getElementById('calcInfoOverlay');
    const infoBox = document.getElementById('calcInfoBox');
    if (overlay) overlay.remove();
    if (infoBox) infoBox.remove();
}
