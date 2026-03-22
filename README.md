<div align="center">
  <img src="assets/app_logo.png" alt="Digital Mindscapes Logo" width="160"/>
  <h1>Digital Mindscapes</h1>
  <p><em>An Interactive Public Health &amp; Socioeconomic Data Visualization Platform</em></p>

  <img src="https://img.shields.io/badge/Status-Live-brightgreen?style=flat-square"/>
  <img src="https://img.shields.io/badge/Built%20With-HTML%20%7C%20CSS%20%7C%20JavaScript-blue?style=flat-square"/>
  <img src="https://img.shields.io/badge/Charts-amCharts%205-orange?style=flat-square"/>
  <img src="https://img.shields.io/badge/Data-CDC%20PLACES%20%7C%20ACS-red?style=flat-square"/>
  <br/><br/>

  <a href="https://digital-mindscapes.github.io"><strong>🌐 View Live Site »</strong></a>
</div>

---

## 📖 Overview

**Digital Mindscapes** is an advanced interactive public health and socioeconomic data visualization platform. It explores the intersection of community wellbeing, healthcare access, and economic conditions across the United States. Providing a suite of analytical tools—ranging from simple choropleth mapping to complex spatial autocorrelation and machine learning-driven clustering—the platform supports academic research, policy analysis, and data-driven storytelling.

Originally built as part of research at **Marquette University**, in collaboration with **UW-Milwaukee** and the **Medical College of Wisconsin (MCW)**.

<div align="center">
  <img src="assets/marquette_logo.png" alt="Marquette University" height="50"/>
  &nbsp;&nbsp;&nbsp;
  <img src="assets/uwm_logo.png" alt="UW-Milwaukee" height="50"/>
  &nbsp;&nbsp;&nbsp;
  <img src="assets/mcw_logo.png" alt="Medical College of Wisconsin" height="50"/>
</div>

---

## 🗂️ Navigation & Tools

The platform is organized into thematic modules for data exploration and analysis:

### 🌐 Core Visualization & Exploration
| Page | Tool | Description |
|------|------|-------------|
| [`index.html`](index.html) | **State Explorer** | National choropleth map across 50+ health & socioeconomic metrics. |
| [`comparison.html`](comparison.html) | **State Comparison** | Side-by-side bar chart comparison of U.S. states with table indicators. |
| [`county_comparison.html`](county_comparison.html) | **County Comparison** | Multi-county selection with bar chart & table perspectives. |
| [`multi_metric.html`](multi_metric.html) | **Multi-Metric View** | Simultaneous exploration of multiple metrics across state maps. |
| [`county_multi_metric.html`](county_multi_metric.html) | **County Multi-Map** | High-resolution county maps comparing multiple variables side-by-side. |
| [`metric_visualization.html`](metric_visualization.html) | **Metric Insights** | Detailed deep-dives into specific health and economic indicators. |

### 🛰️ Socio-Spatial Analysis
| Page | Tool | Description |
|------|------|-------------|
| [`spatial_autocorrelation.html`](spatial_autocorrelation.html) | **Moran's I Analysis** | Identify hotspots/coldspots with Global & Local Moran's I (LISA). |
| [`bivariate_analysis.html`](bivariate_analysis.html) | **Bivariate Analysis** | Analyze spatial relationships between two different variables. |
| [`urban_rural_comparison.html`](urban_rural_comparison.html) | **RUCC Analysis** | Filter and compare counties by USDA Rural-Urban classification. |

### 🤖 Advanced Analysis & Machine Learning
| Page | Tool | Description |
|------|------|-------------|
| [`clustering_analysis.html`](clustering_analysis.html) | **Clustering Sandbox** | Group counties using DBSCAN, K-Means, and Hierarchical methods. |
| [`dimensionality_reduction.html`](dimensionality_reduction.html) | **Manifold Learning** | Visualizing high-dimensional relationships via t-SNE, PCA, and UMAP. |
| [`predictive_analysis.html`](predictive_analysis.html) | **Predictive Modeling** | Forecast health outcomes based on socioeconomic predictors. |
| [`regression_sandbox.html`](regression_sandbox.html) | **Regression Model** | Interactive OLS and Multi-variable regression modeling tools. |

### 🧪 Statistical Research Tools
| Page | Tool | Description |
|------|------|-------------|
| [`query.html`](query.html) | **Advanced Query** | Structured filtering of national datasets with multi-metric logic. |
| [`correlation_matrix.html`](correlation_matrix.html) | **Correlation Matrix** | Interactive heatmaps displaying relationships between all variables. |
| [`statistical_tests.html`](statistical_tests.html) | **Statistical Lab** | Run T-Tests, ANOVA, and other academic statistical validations. |
| [`county_distribution.html`](county_distribution.html) | **Distributions** | Analyze metric spreadsheets with histograms and density plots. |

---

## 📊 Data Sources

| Dataset | Source | Coverage |
|---------|--------|----------|
| **CDC PLACES** | [CDC PLACES 2023](https://www.cdc.gov/places/) | County-level health prevalence data |
| **American Community Survey (ACS)** | [U.S. Census Bureau](https://www.census.gov/programs-surveys/acs) | Socioeconomic indicators per county |
| **USDA RUCC Codes** | [USDA ERS](https://www.ers.usda.gov/data-products/rural-urban-continuum-codes/) | Rural-Urban Continuum Classification (2013) |

---

## 🚀 Key Features

- 🗺️ **Multi-Engine Maps** — Native amCharts 4 & 5 integration for responsive, high-fidelity choropleth visualizations.
- ⚡ **Background Processing** — Web Worker architecture (Clustering, ML, Spatial workers) for smooth UI during heavy computation.
- 📉 **Statistical Depth** — Built-in correlation, regression, and significance testing for academic-grade analysis.
- 🧠 **ML Integration** — Client-side unsupervised learning (DBSCAN, K-Means) and supervised regression models.
- 🏙️ **RUCC Sensitivity** — Native support for Rural-Urban metadata, allowing for urbanicity-adjusted comparisons.
- 📑 **Research Export** — Comprehensive export system for tables to CSV, HTML, and LaTeX (with heatmap preserved).
- 📱 **Adaptive UI** — Modern, glassmorphism-inspired interface optimized for both desktop research and mobile viewing.

---

## 🗃️ Project Structure

```
digital-mindscapes.github.io/
├── assets/                  # Platform logos and static media (Marquette, UWM, MCW)
├── css/                     # Module-specific styling (vulnerability.css, clustering.css, etc.)
├── data/                    # Processed JSON archives for national datasets
│   ├── ACS Data/            # Socioeconomic indicators per county (flat JSON)
│   ├── PLACES Data/         # CDC Health prevalence data per county (flat JSON)
│   └── Rural_Urban_Comparison/  # USDA RUCC classifications and metadata
├── js/                      # Core logic and research analytical engines
│   ├── lib/                 # External scientific bundles (ml.min.js, xgboost.min.js)
│   ├── clustering_worker.js # DBSCAN, K-Means & Hierarchical clustering background engine
│   ├── ml_worker.js         # Machine learning, regression & prediction background engine
│   ├── spatial_worker.js    # Spatial autocorrelation (Global/Local Moran's I) engine
│   ├── dr_worker.js         # Dimensionality reduction (t-SNE/UMAP) background engine
│   ├── query_engine.js      # Global data filtering and multi-metric query logic
│   ├── comparison_table.js  # Refined table renderer for research exports (CSV/HTML/LaTeX)
│   ├── map_controls.js      # Shared map navigation and state/county zoom logic
│   └── *_analysis.js        # Module controllers (regression, spatial, clustering, etc.)
├── *.html                   # Analytical entry points (30+ research modules)
└── README.md
```

---

## 🛠️ Tech Stack

- **Graphics & Visualization**: 
  - [amCharts 4 & 5](https://www.amcharts.com/) for high-fidelity geographic mapping.
  - **[D3.js (v7)](https://d3js.org/)** for custom scientific plots (Moran Scatterplots, Elbow plots, Manifold projections).
  - **[KaTeX](https://katex.org/)** for high-performance LaTeX mathematical typesetting.
- **Scientific Compute**: 
  - **Native Web Workers** for multi-threaded, non-blocking statistical calculation.
  - **[Math.js](https://mathjs.org/)** for advanced matrix algebra and spatial connectivity logic.
  - **[jStat](https://jstat.github.io/)** for statistical distributions and probability modeling.
  - **[ml.js](https://github.com/mljs/ml)** and **[XGBoost.js](https://github.com/bmurray/xgboost.js)** for clustering and predictive modeling.
  - **t-SNE & UMAP** for non-linear dimensionality reduction.
- **Core Languages**: Vanilla JavaScript (ES6+), HTML5, CSS3 with modern Custom Properties.
- **Assets**: `flagcdn.com` for geographic branding; Custom SVG iconography.

---

## 👥 Team

| Name | Affiliation | Role |
|------|-------------|------|
| **Arpita Datta** | Marquette University | PhD Student, Lead Researcher |
| **Dr. Sabirat Rubiya** | Marquette University | Research Collaborator |
| **Dr. Avik Chakrabarti** | University of Wisconsin-Milwaukee (UWM) | Research Collaborator |
| **Dr. Anjishnu Banerjee** | Medical College of Wisconsin (MCW) | Research Collaborator |

---

## 📜 Citation

If you use this platform in your research, please cite:

> Datta, A., Rubiya, S., Chakrabarti, A., & Banerjee, A. (2026). *Digital Mindscapes: An Interactive Public Health & Socioeconomic Data Visualization Platform.*

---

## 📜 License

This project is for academic and research purposes. Data is sourced from publicly available U.S. government datasets (CDC, U.S. Census Bureau, USDA).

