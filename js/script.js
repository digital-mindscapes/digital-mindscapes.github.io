/**
 * Main Dashboard Script
 * Loads ACS + PLACES data, renders state/county maps, and metric sidebar.
 */

// =========================================
// METRIC DEFINITIONS — ALL ACS + PLACES
// =========================================

const metrics = [
  // Economic Factors (ACS)
  "pct_unemployment_rate", "pct_in_labor_force",
  "pct_natural_resources_construction",
  // Education (ACS)
  "pct_graduate_professional_degree",
  // Health Outcomes (PLACES)
  "depression_prevalence", "obesity_prevalence", "diabetes_prevalence",
  "arthritis_prevalence", "asthma_prevalence", "high_blood_pressure_prevalence",
  "high_cholesterol_prevalence", "coronary_heart_disease_prevalence",
  "stroke_prevalence", "cancer_prevalence", "copd_prevalence",
  // Health Status (PLACES)
  "mental_health_issues_prevalence", "physical_health_issues_prevalence",
  "general_health_prevalence",
  // Health Risk Behaviors (PLACES)
  "smoking_prevalence", "binge_drinking_prevalence", "physical_inactivity_prevalence",
  // Prevention (PLACES)
  "checkup_prevalence", "cholesterol_screening_prevalence",
  "bp_medication_prevalence", "access2_prevalence",
  // Disability (PLACES)
  "disability_prevalence", "cognitive_difficulties_prevalence",
  "mobility_difficulty_prevalence", "hearing_disability_prevalence",
  "vision_difficulty_prevalence", "self_care_difficulty_prevalence",
  "independent_living_difficulty_prevalence",
  // Social Needs (PLACES)
  "loneliness_prevalence", "emotional_support_prevalence",
  "food_insecurity_prevalence", "food_stamp_prevalence",
  "housing_insecurity_prevalence", "utility_shutoff_prevalence",
  "lack_transportation_prevalence",
  // Demographics & Housing (ACS)
  "total_population_sum", "average_household_size", "average_family_size",
  "pct_speak_english_less_than_very_well",
  "pct_households_1plus_people_65plus",
  "households_with_broadband_sum"
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

const metricExplanations = {

  "pct_unemployment_rate": "Percentage of the Civilian Labor Force (16+) that is unemployed but seeking work.",
  "pct_in_labor_force": "Percentage of population 16+ who are employed or actively seeking employment.",

  "pct_natural_resources_construction": "Employed in farming, fishing, forestry, construction, or maintenance.",

  "pct_graduate_professional_degree": "Adults 25+ with a Master's, PhD, MD, JD, or advanced degree.",
  "depression_prevalence": "Adults diagnosed with or reporting symptoms of clinical depression (PLACES/BRFSS).",
  "obesity_prevalence": "Adults with a BMI of 30 or higher (PLACES/BRFSS).",
  "diabetes_prevalence": "Adults diagnosed with diabetes (PLACES/BRFSS).",
  "arthritis_prevalence": "Adults diagnosed with arthritis (PLACES/BRFSS).",
  "asthma_prevalence": "Adults with current asthma (PLACES/BRFSS).",
  "high_blood_pressure_prevalence": "Adults diagnosed with high blood pressure (PLACES/BRFSS).",
  "high_cholesterol_prevalence": "Adults who have been screened and found to have high cholesterol (PLACES/BRFSS).",
  "coronary_heart_disease_prevalence": "Adults diagnosed with coronary heart disease (PLACES/BRFSS).",
  "stroke_prevalence": "Adults who have had a stroke (PLACES/BRFSS).",
  "cancer_prevalence": "Adults diagnosed with cancer (non-skin) or melanoma (PLACES/BRFSS).",
  "copd_prevalence": "Adults diagnosed with chronic obstructive pulmonary disease (PLACES/BRFSS).",
  "mental_health_issues_prevalence": "Adults reporting frequent mental distress (≥14 days) (PLACES/BRFSS).",
  "physical_health_issues_prevalence": "Adults reporting frequent physical distress (≥14 days) (PLACES/BRFSS).",
  "general_health_prevalence": "Adults reporting fair or poor self-rated health status (PLACES/BRFSS).",
  "smoking_prevalence": "Adults who currently smoke cigarettes (PLACES/BRFSS).",
  "binge_drinking_prevalence": "Adults who report binge drinking (PLACES/BRFSS).",
  "physical_inactivity_prevalence": "Adults reporting no leisure-time physical activity (PLACES/BRFSS).",
  "checkup_prevalence": "Adults with a routine checkup within the past year (PLACES/BRFSS).",
  "cholesterol_screening_prevalence": "Adults screened for cholesterol in the past 5 years (PLACES/BRFSS).",
  "bp_medication_prevalence": "Adults taking medicine to control high blood pressure (PLACES/BRFSS).",
  "access2_prevalence": "Adults aged 18-64 currently lacking health insurance (PLACES/BRFSS).",
  "disability_prevalence": "Adults with any disability (PLACES/BRFSS).",
  "cognitive_difficulties_prevalence": "Adults with cognitive disability (PLACES/BRFSS).",
  "mobility_difficulty_prevalence": "Adults with mobility disability (PLACES/BRFSS).",
  "hearing_disability_prevalence": "Adults with hearing disability (PLACES/BRFSS).",
  "vision_difficulty_prevalence": "Adults with vision disability (PLACES/BRFSS).",
  "self_care_difficulty_prevalence": "Adults with self-care disability (PLACES/BRFSS).",
  "independent_living_difficulty_prevalence": "Adults with independent living disability (PLACES/BRFSS).",
  "loneliness_prevalence": "Adults feeling socially isolated (PLACES/BRFSS).",
  "emotional_support_prevalence": "Adults lacking social and emotional support (PLACES/BRFSS).",
  "food_insecurity_prevalence": "Adults experiencing food insecurity in past 12 months (PLACES/BRFSS).",
  "food_stamp_prevalence": "Adults who received food stamps in past 12 months (PLACES/BRFSS).",
  "housing_insecurity_prevalence": "Adults experiencing housing insecurity in past 12 months (PLACES/BRFSS).",
  "utility_shutoff_prevalence": "Adults threatened with utility shutoff in past 12 months (PLACES/BRFSS).",
  "lack_transportation_prevalence": "Adults lacking reliable transportation in past 12 months (PLACES/BRFSS).",

  "total_population_sum": "Total estimated population (ACS 5-Year Estimates).",
  "average_household_size": "Mean number of individuals per household.",
  "average_family_size": "Mean number of related individuals per family household.",

  "pct_speak_english_less_than_very_well": "Population 5+ who speak English less than 'very well'.",

  "pct_households_1plus_people_65plus": "Households with at least one person 65+.",

  "households_with_broadband_sum": "Count of households with high-speed internet."
};

// =========================================
// DATA LOADING — merge ACS + PLACES
// =========================================

var originalStateData = [];
var originalCountyData = [];

async function loadAndMergeData() {
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

  const placesLookup = {};
  placesData.forEach(d => { placesLookup[d.id] = d; });

  const placesCountyLookup = {};
  placesCountyData.forEach(d => { placesCountyLookup[d.id] = d; });

  const stateData = acsData.map(acs => {
    const places = placesLookup[acs.id] || {};
    return { ...acs, ...places, id: acs.id, name: acs.name, state_abbr: acs.state_abbr };
  });

  const countyData = acsCountyData.map(acs => {
    const places = placesCountyLookup[acs.id] || {};
    // County IDs often look like US.AL.Autauga_County
    return { ...acs, ...places, id: acs.id, name: acs.name, state_abbr: acs.state_abbr, state_name: acs.state_name };
  });

  return { stateData, countyData };
}

// =========================================
// MAP INITIALIZATION (amCharts 4 — main map)
// =========================================

if (typeof am4core === "undefined") {
  console.error("amCharts libraries not loaded. Map features disabled.");
  throw new Error("amCharts libraries not loaded");
}

if (typeof am4core !== "undefined") {
  am4core.useTheme(am4themes_animated);
}

var chart = am4core.create("chartdiv", am4maps.MapChart);
chart.geodata = am4geodata_usaLow;
chart.projection = new am4maps.projections.AlbersUsa();

var polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());
polygonSeries.useGeodata = true;

var polygonTemplate = polygonSeries.mapPolygons.template;
polygonTemplate.fill = am4core.color("#d9cec8");
polygonTemplate.tooltipText = "{name}";
polygonTemplate.cursorOverStyle = am4core.MouseCursorStyle.pointer;

var hs = polygonTemplate.states.create("hover");
hs.properties.fill = am4core.color("#c83830");

var psActive = polygonTemplate.states.create("active");
psActive.properties.fill = am4core.color("#c83830");

addCustomMapControls("chartdiv", chart, false);

// =========================================
// COUNTY TOGGLE AND MAP CLICK
// =========================================

var countyChart = null;
var countyToggleEnabled = true;

document.getElementById("countyToggle").addEventListener("change", function (e) {
  countyToggleEnabled = e.target.checked;
  if (!countyToggleEnabled) {
    var sidePanel = document.getElementById("sidepanel");
    sidePanel.classList.remove("active");
    if (countyChart) { countyChart.dispose(); countyChart = null; }
  }
});

var activeStateData = null;

polygonTemplate.events.on("hit", function (ev) {
  ev.target.series.mapPolygons.each(function (polygon) {
    polygon.isActive = false;
  });
  ev.target.isActive = true;

  var dataItem = ev.target.dataItem;
  var name = dataItem.dataContext.name;
  var id = dataItem.dataContext.id;
  var stateAbbr = id.split("-").pop().toLowerCase();

  if (countyToggleEnabled) {
    openCountyPanel(name, stateAbbr);
  }

  var stateData = polygonSeries.data.find(d => d.id === id);
  if (stateData) {
    activeStateData = stateData;
    updateMetrics(stateData);
  }
});

// =========================================
// LOAD DATA AND BIND
// =========================================

(async function preloadData() {
  try {
    const data = await loadAndMergeData();
    console.log("State data pre-loaded:", data.stateData.length, "states");
    console.log("County data pre-loaded:", data.countyData.length, "counties");
    originalStateData = data.stateData;
    originalCountyData = data.countyData;

    var mappedData = data.stateData.map(d => ({ ...d, id: d.id.replace(".", "-") }));
    polygonSeries.data = mappedData;

    // Default: Wisconsin
    const defaultStateId = "US.WI";
    const defaultStateData = data.stateData.find(d => d.id === defaultStateId);
    if (defaultStateData) {
      activeStateData = defaultStateData;
      updateMetrics(defaultStateData);
      var stateAbbr = defaultStateId.split(/[\.\-]/).pop().toLowerCase();
      openCountyPanel(defaultStateData.name, stateAbbr);
    }
  } catch (error) {
    console.error("Error pre-loading data:", error);
  }
})();

// =========================================
// UPDATE METRICS SIDEBAR
// =========================================

function updateMetrics(data, countyData = null) {
  if (!data) return;

  metrics.forEach(metric => {
    const valId = "val-" + metric;
    const valEl = document.getElementById(valId);
    if (!valEl) return;

    let value = "---";
    if (data[metric] !== undefined && data[metric] !== null) {
      const raw = data[metric];
      value = formatMetricValue(metric, raw);
    }

    if (countyData) {
      let cValue = "No Data";
      if (countyData[metric] !== undefined && countyData[metric] !== null) {
        cValue = formatMetricValue(metric, countyData[metric]);
      }
      let shortCounty = countyData.name.replace(" County", "").replace(" Parish", "");
      valEl.innerHTML = `
        <span style="display:inline-block; margin-bottom:5px; padding:3px 8px; background-color:#f1f3f5; border:1px solid #dee2e6; border-radius:12px; font-size:0.65em; color:#495057; font-weight:700; line-height:1.2; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          ${data.name || "State"}: ${value}
        </span><br>
        <span style="display:inline-block; padding:3px 8px; background-color:#fae8e7; border:1px solid #f2cfcd; border-radius:12px; font-size:0.65em; color:#c83830; font-weight:700; line-height:1.2; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          ${shortCounty}: ${cValue}
        </span>
      `;
    } else {
      valEl.textContent = value;
    }
  });

  const header = document.querySelector(".metrics-header h2");
  if (header) {
    if (countyData) {
      header.innerHTML = `
        <div style="background: linear-gradient(135deg, #c83830, #a6231c); color: #ffffff; padding: 10px 16px; border-radius: 20px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1); cursor: default; transition: transform 0.2s ease, box-shadow 0.2s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 12px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.1)'">
          <span style="font-size:1.15em; font-weight:700; display:block; margin-bottom:2px;">${countyData.name}</span>
          <span style="font-size:0.8em; font-weight:400; opacity:0.9;">Vs. ${data.name || "State"} Average</span>
        </div>
      `;
    } else {
      header.textContent = (data.name || "State") + " Metrics";
    }
  }
}

function formatMetricValue(metric, raw) {
  if (typeof raw !== "number") return String(raw);
  if (metric.startsWith("pct_") || metric.includes("prevalence")) {
    return raw.toFixed(1) + "%";
  }
  if (metric === "average_household_size" || metric === "average_family_size") {
    return raw.toFixed(2);
  }
  if (raw >= 1000000) return (raw / 1000000).toFixed(1) + "M";
  if (raw >= 1000) return raw.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return raw.toFixed(1);
}


// =========================================
// HEATMAP MODE (amCharts 5)
// =========================================

var heatmapMode = false;
var currentMetric = null;

document.getElementById("heatmapToggle").addEventListener("change", function (e) {
  heatmapMode = e.target.checked;
  const metricsSection = document.querySelector(".metrics-section");
  if (heatmapMode) {
    metricsSection.classList.add("switch-active");
    var header = document.querySelector(".metrics-header h2");
    if (header) header.textContent = "Metrics";
  } else {
    metricsSection.classList.remove("switch-active");
    deactivateHeatmap();
    document.querySelectorAll(".metric-card").forEach(el => el.classList.remove("active"));
  }
});

function initMetricCardListeners() {
  document.querySelectorAll(".metric-card").forEach(card => {
    card.addEventListener("click", function () {
      const valEl = this.querySelector(".metric-value");
      if (!valEl) return;
      const metricName = valEl.id.replace("val-", "");

      if (heatmapMode) {
        document.querySelectorAll(".metric-card").forEach(el => el.classList.remove("active"));
        this.classList.add("active");
        currentMetric = metricName;
        activateHeatmap(metricName);
      } else {
        openMetricModal(metricName);
      }
    });
  });
}

initMetricCardListeners();

function activateHeatmap(metricName) {
  // Dispose of the existing series and any active heatmap legends to avoid overlaps
  chart.series.removeIndex(0).dispose();
  var legends = chart.children.values.filter(c => c instanceof am4maps.HeatLegend);
  legends.forEach(l => l.dispose());

  var heatPolySeries = chart.series.push(new am4maps.MapPolygonSeries());
  heatPolySeries.useGeodata = true;

  var vals = originalStateData.map(d => d[metricName]).filter(v => typeof v === "number");
  var minVal = Math.min(...vals);
  var maxVal = Math.max(...vals);

  heatPolySeries.data = originalStateData.map(d => {
    let raw = d[metricName];
    let val = (typeof raw === "number") ? raw : undefined;
    return {
      ...d,
      id: d.id.replace(".", "-"),
      value: val,
      displayValue: val !== undefined ? formatMetricValue(metricName, raw) : "No Data"
    };
  });

  var isLogScale = minVal > 0 && maxVal > 0 && (maxVal / minVal > 20);

  heatPolySeries.heatRules.push({
    property: "fill",
    target: heatPolySeries.mapPolygons.template,
    min: am4core.color("#fef3e6"),
    max: am4core.color("#c83830"),
    minValue: minVal,
    maxValue: maxVal,
    logarithmic: isLogScale
  });

  var polyHeatTempl = heatPolySeries.mapPolygons.template;
  polyHeatTempl.tooltipText = "{name}: {displayValue}";
  polyHeatTempl.cursorOverStyle = am4core.MouseCursorStyle.pointer;

  polyHeatTempl.adapter.add("fill", function (fill, target) {
    if (target.dataItem && target.dataItem.dataContext && target.dataItem.dataContext.value === undefined) {
      return am4core.color("#e0e0e0");
    }
    return fill;
  });

  var heatActive = polyHeatTempl.states.create("active");
  heatActive.properties.stroke = am4core.color("#000000");
  heatActive.properties.strokeWidth = 2;

  var heatLegend = chart.createChild(am4maps.HeatLegend);
  heatLegend.series = heatPolySeries;
  heatLegend.align = "center";
  heatLegend.valign = "bottom";
  heatLegend.width = am4core.percent(40);
  heatLegend.marginBottom = 20;
  heatLegend.minValue = minVal;
  heatLegend.maxValue = maxVal;
  heatLegend.valueAxis.renderer.labels.template.fontSize = 11;
  heatLegend.valueAxis.renderer.labels.template.fontWeight = "bold";

  // Add unit formatting to the scale labels using our central renderer
  heatLegend.valueAxis.renderer.labels.template.adapter.add("text", function (text, target) {
    if (target.dataItem && target.dataItem.value !== undefined) {
      return formatMetricValue(metricName, target.dataItem.value);
    }
    return text;
  });

  // Set up heat legend tooltips with proper units
  polyHeatTempl.events.on("over", function (ev) {
    if (ev.target.dataItem.value !== undefined && !isNaN(ev.target.dataItem.value)) {
      heatLegend.valueAxis.showTooltipAt(ev.target.dataItem.value);
      // Ensure tooltip itself uses formatted text
      heatLegend.valueAxis.tooltip.label.text = formatMetricValue(metricName, ev.target.dataItem.value);
    } else {
      heatLegend.valueAxis.hideTooltip();
    }
  });

  polyHeatTempl.events.on("out", function (ev) {
    heatLegend.valueAxis.hideTooltip();
  });

  polygonSeries = heatPolySeries;
  polygonSeries.mapPolygons.template.events.on("hit", function (ev) {
    ev.target.series.mapPolygons.each(function (polygon) {
      polygon.isActive = false;
    });
    ev.target.isActive = true;

    var dataItem = ev.target.dataItem;
    var name = dataItem.dataContext.name;
    var id = dataItem.dataContext.id;
    var stateAbbr = id.split("-").pop().toLowerCase();
    if (countyToggleEnabled) openCountyPanel(name, stateAbbr);
    var stateData = polygonSeries.data.find(d => d.id === id);
    if (stateData) {
      activeStateData = stateData;
      updateMetrics(stateData);
    }
  });

  if (countyChart && countyChart.geodata) {
    renderCountyMap(countyChart.geodata);
  }
}

function deactivateHeatmap() {
  chart.series.removeIndex(0).dispose();
  var newPolySeries = chart.series.push(new am4maps.MapPolygonSeries());
  newPolySeries.useGeodata = true;
  var pt = newPolySeries.mapPolygons.template;
  pt.fill = am4core.color("#d9cec8");
  pt.tooltipText = "{name}";
  pt.cursorOverStyle = am4core.MouseCursorStyle.pointer;
  var hs2 = pt.states.create("hover");
  hs2.properties.fill = am4core.color("#c83830");

  var as2 = pt.states.create("active");
  as2.properties.fill = am4core.color("#c83830");

  newPolySeries.data = originalStateData.map(d => ({ ...d, id: d.id.replace(".", "-") }));
  polygonSeries = newPolySeries;

  pt.events.on("hit", function (ev) {
    ev.target.series.mapPolygons.each(function (polygon) {
      polygon.isActive = false;
    });
    ev.target.isActive = true;

    var dataItem = ev.target.dataItem;
    var name = dataItem.dataContext.name;
    var id = dataItem.dataContext.id;
    var stateAbbr = id.split("-").pop().toLowerCase();
    if (countyToggleEnabled) openCountyPanel(name, stateAbbr);
    var stateData = polygonSeries.data.find(d => d.id === id);
    if (stateData) {
      activeStateData = stateData;
      updateMetrics(stateData);
    }
  });

  var legends = chart.children.values.filter(c => c instanceof am4maps.HeatLegend);
  legends.forEach(l => l.dispose());

  if (countyChart && countyChart.geodata) {
    renderCountyMap(countyChart.geodata);
  }
}

// =========================================
// MODAL (metric info)
// =========================================

function openMetricModal(metricName) {
  var overlay = document.getElementById("metricModal");
  var title = document.getElementById("modalTitle");
  var desc = document.getElementById("modalDescription");
  if (!overlay || !title || !desc) return;

  title.textContent = metricLabels[metricName] || metricName;
  desc.textContent = metricExplanations[metricName] || "No description available.";
  overlay.classList.add("active");
}

function closeMetricModal() {
  var overlay = document.getElementById("metricModal");
  if (overlay) overlay.classList.remove("active");
}

// Close modal button
var closeModalBtn = document.getElementById("closeModal");
if (closeModalBtn) {
  closeModalBtn.addEventListener("click", closeMetricModal);
}
// Close modal on overlay click
var modalOverlay = document.getElementById("metricModal");
if (modalOverlay) {
  modalOverlay.addEventListener("click", function (e) {
    if (e.target === modalOverlay) closeMetricModal();
  });
}

// =========================================
// COUNTY SIDE PANEL
// =========================================

function openCountyPanel(stateName, stateAbbr) {
  var sidePanel = document.getElementById("sidepanel");
  var stateTitle = document.getElementById("panelTitle");

  sidePanel.classList.add("active");
  if (stateTitle) stateTitle.textContent = stateName;

  // Auto-scroll on mobile so user sees the county map unblocked
  if (window.innerWidth <= 1024) {
    setTimeout(() => {
      sidePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  if (countyChart) { countyChart.dispose(); countyChart = null; }

  var geoKey = "am4geodata_region_usa_" + stateAbbr + "Low";

  // If geodata already loaded, render immediately
  if (window[geoKey]) {
    renderCountyMap(window[geoKey]);
    return;
  }

  // Otherwise, dynamically load the state geodata script from amCharts CDN
  var script = document.createElement("script");
  script.src = "https://www.amcharts.com/lib/4/geodata/region/usa/" + stateAbbr + "Low.js";
  script.onload = function () {
    if (window[geoKey]) {
      renderCountyMap(window[geoKey]);
    } else {
      console.warn("Geodata not found for " + stateAbbr + ", showing US map");
      renderCountyMap(am4geodata_usaLow);
    }
  };
  script.onerror = function () {
    console.warn("Could not load county geodata for " + stateAbbr + ", showing US map");
    renderCountyMap(am4geodata_usaLow);
  };
  document.head.appendChild(script);
}

function renderCountyMap(geodata) {
  if (countyChart) { countyChart.dispose(); countyChart = null; }

  countyChart = am4core.create("countychartdiv", am4maps.MapChart);
  countyChart.projection = new am4maps.projections.AlbersUsa();
  countyChart.geodata = geodata;

  var countySeries = countyChart.series.push(new am4maps.MapPolygonSeries());
  countySeries.useGeodata = true;

  var countyPoly = countySeries.mapPolygons.template;

  var stateTitle = document.getElementById("panelTitle");
  if (stateTitle && stateTitle.textContent) {
    var stateName = stateTitle.textContent;
    var stateCountyData = originalCountyData.filter(d => d.state_name === stateName);

    var boundData = [];
    var vals = [];

    stateCountyData.forEach(countyData => {
      const feature = geodata.features.find(f => {
        return countyData.name.startsWith(f.properties.name);
      });
      if (feature) {
        let raw = (heatmapMode && currentMetric) ? countyData[currentMetric] : undefined;
        let val = (typeof raw === "number") ? raw : undefined;
        if (typeof raw === "number") vals.push(val);
        boundData.push({
          ...countyData,
          id: feature.id,
          value: val,
          displayValue: val !== undefined ? formatMetricValue(currentMetric, raw) : "No Data"
        });
      }
    });

    countySeries.data = boundData;

    if (heatmapMode && currentMetric) {
      var minVal = vals.length > 0 ? Math.min(...vals) : 0;
      var maxVal = vals.length > 0 ? Math.max(...vals) : 0;
      var isLogScale = minVal > 0 && maxVal > 0 && (maxVal / minVal > 20);

      countySeries.heatRules.push({
        property: "fill",
        target: countyPoly,
        min: am4core.color("#fef3e6"),
        max: am4core.color("#c83830"),
        minValue: minVal,
        maxValue: maxVal,
        logarithmic: isLogScale
      });

      countyPoly.tooltipText = "{name}: {displayValue}";
      countyPoly.cursorOverStyle = am4core.MouseCursorStyle.pointer;

      countyPoly.adapter.add("fill", function (fill, target) {
        if (target.dataItem && target.dataItem.dataContext && target.dataItem.dataContext.value === undefined) {
          return am4core.color("#e0e0e0");
        }
        return fill;
      });

      var chHeatActive = countyPoly.states.create("active");
      chHeatActive.properties.stroke = am4core.color("#000000");
      chHeatActive.properties.strokeWidth = 2;

      var heatLegend = countyChart.createChild(am4maps.HeatLegend);
      heatLegend.series = countySeries;
      heatLegend.align = "center";
      heatLegend.valign = "bottom";
      heatLegend.width = am4core.percent(80);
      heatLegend.marginBottom = 20;
      heatLegend.minValue = minVal;
      heatLegend.maxValue = maxVal;
      heatLegend.valueAxis.renderer.labels.template.fontSize = 11;
      heatLegend.valueAxis.renderer.labels.template.fontWeight = "bold";

      // Add unit formatting to county scale labels
      heatLegend.valueAxis.renderer.labels.template.adapter.add("text", function (text, target) {
        if (target.dataItem && target.dataItem.value !== undefined) {
          return formatMetricValue(currentMetric, target.dataItem.value);
        }
        return text;
      });

      // Set up heat legend tooltips for counties with units
      countyPoly.events.on("over", function (ev) {
        if (ev.target.dataItem.value !== undefined && !isNaN(ev.target.dataItem.value)) {
          heatLegend.valueAxis.showTooltipAt(ev.target.dataItem.value);
          heatLegend.valueAxis.tooltip.label.text = formatMetricValue(currentMetric, ev.target.dataItem.value);
        } else {
          heatLegend.valueAxis.hideTooltip();
        }
      });

      countyPoly.events.on("out", function (ev) {
        heatLegend.valueAxis.hideTooltip();
      });
    } else {
      countyPoly.fill = am4core.color("#e8ddd6");
      countyPoly.stroke = am4core.color("#ffffff");
      countyPoly.strokeWidth = 0.5;
      countyPoly.tooltipText = "{name}";

      var chsh = countyPoly.states.create("hover");
      chsh.properties.fill = am4core.color("#d3a29f");

      var countyAs = countyPoly.states.create("active");
      countyAs.properties.fill = am4core.color("#c83830");
    }

    countyPoly.events.on("hit", function (ev) {
      ev.target.series.mapPolygons.each(function (polygon) {
        polygon.isActive = false;
      });
      ev.target.isActive = true;

      if (activeStateData && ev.target.dataItem && ev.target.dataItem.dataContext) {
        updateMetrics(activeStateData, ev.target.dataItem.dataContext);
      }
    });
  }

  addCustomMapControls("countychartdiv", countyChart, false);
}

function closeCountyPanel() {
  var sidePanel = document.getElementById("sidepanel");
  sidePanel.classList.remove("active");
  if (countyChart) { countyChart.dispose(); countyChart = null; }
}

// Close panel button
var closePanelBtn = document.getElementById("closePanel");
if (closePanelBtn) {
  closePanelBtn.addEventListener("click", closeCountyPanel);
}