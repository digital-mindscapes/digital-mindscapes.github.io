<div align="center">
  <img src="assets/app_logo.png" alt="Digital Mindscapes Logo" width="160"/>
  <h1>Digital Mindscapes</h1>
  <p><em>An Interactive Public Health & Socioeconomic Data Visualization Platform</em></p>

  <img src="https://img.shields.io/badge/Status-Live-brightgreen?style=flat-square"/>
  <img src="https://img.shields.io/badge/Built%20With-HTML%20%7C%20CSS%20%7C%20JavaScript-blue?style=flat-square"/>
  <img src="https://img.shields.io/badge/Charts-amCharts%205-orange?style=flat-square"/>
  <img src="https://img.shields.io/badge/Data-CDC%20PLACES%20%7C%20ACS-red?style=flat-square"/>
  <br/><br/>

  <a href="https://digital-mindscapes.github.io"><strong>🌐 View Live Site »</strong></a>
</div>

---

## 📖 Overview

**Digital Mindscapes** is an academic data visualization project exploring the intersection of public health, socioeconomic conditions, and community wellbeing across the United States. The platform provides interactive choropleth maps, customizable metric comparisons, and county-level filtering to support research-driven storytelling.

Built as part of ongoing research at **Marquette University**, in collaboration with **UW-Milwaukee** and the **Medical College of Wisconsin (MCW)**.

<div align="center">
  <img src="assets/marquette_logo.png" alt="Marquette University" height="50"/>
  &nbsp;&nbsp;&nbsp;
  <img src="assets/uwm_logo.png" alt="UW-Milwaukee" height="50"/>
  &nbsp;&nbsp;&nbsp;
  <img src="assets/mcw_logo.png" alt="Medical College of Wisconsin" height="50"/>
</div>

---

## 🗂️ Pages

| Page | Description |
|------|-------------|
| [`index.html`](index.html) | **State Explorer** — National choropleth map across 50+ health & socioeconomic metrics |
| [`comparison.html`](comparison.html) | **State Comparison** — Side-by-side bar chart comparison of selected U.S. states |
| [`county_comparison.html`](county_comparison.html) | **County Comparison** — County-level map with multi-county bar chart selection |
| [`multi_metric.html`](multi_metric.html) | **Multi-Metric View** — Explore multiple metrics simultaneously across states |
| [`urban_rural_comparison.html`](urban_rural_comparison.html) | **Urban-Rural Comparison** — County map filtered by RUCC Metro/Nonmetro classification |

---

## 📊 Data Sources

| Dataset | Source | Coverage |
|---------|--------|----------|
| **CDC PLACES** | [CDC PLACES 2023](https://www.cdc.gov/places/) | County-level health prevalence data |
| **American Community Survey (ACS)** | [U.S. Census Bureau](https://www.census.gov/programs-surveys/acs) | Socioeconomic indicators per county |
| **USDA RUCC Codes** | [USDA ERS](https://www.ers.usda.gov/data-products/rural-urban-continuum-codes/) | Rural-Urban Continuum Classification (2013) |

---

## 🚀 Features

- 🗺️ **Interactive Choropleth Maps** — powered by [amCharts 5](https://www.amcharts.com/), with zoom, pan, and tooltips
- 📊 **Dynamic Bar Charts** — select counties/states on the map and compare them instantly
- 🏙️ **Urban-Rural Filter** — filter counties by Metro or Nonmetro RUCC classification with visual highlighting
- 🎚️ **RUCC Group Toggle** — group and color-code bar chart bars by Metro vs. Nonmetro category
- 🔥 **Heatmap / Color Mode** — toggle between data heatmap and RUCC classification color mode
- 📐 **Vertical / Horizontal Charts** — switch bar chart orientation as needed
- 📋 **Multi-Metric Side Panel** — browse and switch across 50+ metrics instantly
- 🔍 **Drill-Down Navigation** — click any state to zoom into its counties

---

## 🗃️ Project Structure

```
digital-mindscapes.github.io/
├── assets/                  # Logos and static images
├── css/
│   ├── style.css            # Global design system & theme
│   └── comparison_style.css # Comparison page styles
├── data/
│   ├── ACS Data/            # county_acs_flat.json, state_acs_flat.json
│   ├── PLACES Data/         # county_places_flat.json, state_places_flat.json
│   └── Rural_Urban_Comparison/  # county_rucc.json, source xlsx
├── js/
│   ├── script.js                     # State Explorer logic
│   ├── comparison_script.js          # State Comparison logic
│   ├── county_comparison_amcharts.js # County Comparison (amCharts 5)
│   ├── urban_rural_comparison.js     # Urban-Rural Comparison logic
│   ├── multi_metric_script.js        # Multi-Metric logic
│   └── map_controls.js               # Shared zoom/pan map controls
├── index.html
├── comparison.html
├── county_comparison.html
├── multi_metric.html
└── urban_rural_comparison.html
```

---

## 🛠️ Tech Stack

- **HTML5 / CSS3 / Vanilla JavaScript** — no build tools required
- **[amCharts 5](https://www.amcharts.com/)** — interactive maps and charts
- **CDC PLACES + U.S. Census ACS** — pre-processed into flat JSON for fast client-side loading

---

## 👥 Team

| Name | Affiliation | Role |
|------|-------------|------|
| **Anjishnu Banerjee** | Medical College of Wisconsin (MCW) | Research Collaborator |

---

## 📜 License

This project is for academic and research purposes. Data sourced from publicly available U.S. government datasets (CDC, U.S. Census Bureau, USDA).
