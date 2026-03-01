# ACS Socioeconomic Data Dictionary (33 Variables)

This data dictionary outlines the 33 socioeconomic variables present in `acs_33var_socioeconomic.csv` (county-level) and `acs_33var_STATE_AGGREGATED.csv` (state-level), derived from the 2023 American Community Survey (ACS) 5-Year Estimates.


## Identifiers
| Variable Name | Description | Detailed Explanation (ACS Context) | Type / Unit |
|---|---|---|---|
| `state` | 2-digit State FIPS Code | Federal Information Processing Standard code identifying the US State. | Identifier |
| `county` | 3-digit County FIPS Code | Federal Information Processing Standard code identifying the County. | Identifier |
| `State_Name` | Full State Name | The geographic string name for the state (e.g., "Alabama"). | Identifier |
| `State_Abbrev` | 2-Letter State Abbreviation | Standard 2-letter postal abbreviation mapping for the state. | Identifier |
| `County_Name` | Full County Name | The geographic string name for the county (e.g., "Autauga County"). | Identifier |

## Active Variables (33)

| Variable Name | Description | Detailed Explanation (ACS Context) | Type / Unit |
|---|---|---|---|
| `Total_Population` | Total estimated population | The total number of all individuals (all ages) residing within the defined geographic area. | Count |
| `Median_Household_Income` | Median household income | The middle point of the income distribution of all households, accounting for the past 12 months. | Dollars |
| `Per_Capita_Income` | Per capita income | The mean income computed for every man, woman, and child in a geographic area. derived by dividing total income by total population. | Dollars |
| `Gini_Index_of_Income_Inequality_Gini_Index_B19083_001E` | Gini index of income inequality | Statistical measure of wealth distribution. 0 represents perfect equality, 1 represents maximal inequality. | Index (0.0 to 1.0) |
| `Pct_Unemployment_Rate` | Unemployment rate | The percentage of the Civilian Labor Force (population 16+) that is currently unemployed but actively seeking work. | Percentage |
| `Pct_Management_Professional` | Management/Professional Jobs | Percentage of the employed civilian labor force working in management, business, science, and arts occupations. | Percentage |
| `Pct_Service_Occupations` | Service Jobs | Percentage of the employed civilian labor force working in service-oriented occupations (healthcare support, food service, cleaning, etc.). | Percentage |
| `Pct_Sales_Office` | Sales/Office Jobs | Percentage of the employed civilian labor force working in sales, office, or administrative support roles. | Percentage |
| `Pct_Natural_Resources_Construction`| Natural Resources/Construction Jobs | Percentage of the employed civilian labor force working in farming, fishing, forestry, construction, or maintenance. | Percentage |
| `Pct_Production_Transportation` | Production/Transportation Jobs | Percentage of the employed civilian labor force working in production, assembly, transportation, or material moving. | Percentage |
| `Pct_In_Labor_Force` | Labor Force Participation | The percentage of the total population aged 16 and older who are either employed or actively seeking employment. | Percentage |
| `Pct_High_School_Grad_or_Higher` | High School Graduate+ | Percentage of the adult population (25 years and older) who hold at least a high school diploma or equivalent. | Percentage |
| `Pct_Some_College_or_Associates` | Some College/Associate's | Percentage of the adult population (25 years and older) who attended some college or hold a 2-year Associate's degree. | Percentage |
| `Pct_Bachelors_or_Higher` | Bachelor's Degree+ | Percentage of the adult population (25 years and older) who hold at least a 4-year Bachelor's degree. | Percentage |
| `Pct_Graduate_Professional_Degree`| Graduate/Professional Degree | Percentage of the adult population (25 years and older) who hold a Master's, PhD, MD, JD, or other advanced degree. | Percentage |
| `Pct_Uninsured` | Lacking Health Insurance | Percentage of the civilian noninstitutionalized population with absolutely no health insurance coverage. | Percentage |
| `Pct_Public_Insurance` | Public Health Insurance | Percentage of the population covered by Medicare, Medicaid, VA care, or other government health programs. | Percentage |
| `Pct_Private_Insurance` | Private Health Insurance | Percentage of the population covered by employer-sponsored or directly purchased private health plans. | Percentage |
| `Pct_With_Disability` | Living with a Disability | Percentage of the civilian noninstitutionalized population reporting serious difficulty with hearing, vision, cognition, or mobility. | Percentage |
| `Median_Value_Owner_Occupied` | Median Home Value | The midpoint estimated property value of all owner-occupied housing units. | Dollars |
| `Median_Gross_Rent` | Median Gross Rent | The midpoint value of contract rent plus the estimated average monthly cost of utilities. | Dollars |
| `Pct_Occupied_Housing_Units` | Occupied Housing Units | The percentage of all existing physical housing units that are currently inhabited by a household. | Percentage |
| `Pct_Vacant` | Vacant Housing Units | The percentage of all existing physical housing units that are completely empty/uninhabited. | Percentage |
| `Pct_With_Mortgage` | Units With Mortgage | Percentage of owner-occupied housing units that have an active mortgage, deed of trust, or similar debt. | Percentage |
| `Pct_Without_Mortgage` | Units Without Mortgage | Percentage of owner-occupied housing units owned free and clear (no mortgage loans). | Percentage |
| `Average_Household_Size` | Average Household Size | The mean number of individuals living together in single inhabited housing units (including non-relatives). | Headcount |
| `Average_Family_Size` | Average Family Size | The mean number of related individuals living together (minimum 2 individuals related by birth, marriage, or adoption). | Headcount |
| `Pct_Households_With_Children_Under_18`| Households with Minors | Percentage of distinct households that contain at least one child under the age of 18. | Percentage |
| `Pct_Households_1Plus_People_65Plus`| Households with Seniors | Percentage of distinct households that contain at least one senior aged 65 or older. | Percentage |
| `Pct_Female_Householder_No_Spouse`| Single Female Householder | Percentage of family households maintained by a female with no spouse present. | Percentage |
| `Households_With_Broadband` | Households with Broadband | Estimated raw count of distinct households paying for high-speed internet service. | Count |
| `Pct_Foreign_born` | Immigrant Population | Percentage of the population that are not US citizens at birth (naturalized citizens or non-citizens). | Percentage |
| `Pct_Speak_English_less_than_very_well`| Limited English Proficiency | Percentage of the population aged 5 and older reporting they speak a language other than English at home AND speak English less than "very well". | Percentage |
