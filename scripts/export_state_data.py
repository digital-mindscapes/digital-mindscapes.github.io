import pandas as pd
import json

# Load the processed state data
df = pd.read_csv('all_submissions_comprehensive_20250830_203910.csv', low_memory=False)

# Drop columns with all NaN values and unnamed columns
df = df.dropna(axis=1, how='all')
df = df.loc[:, ~df.columns.str.contains('^Unnamed')]

# Keep only valid US state abbreviations
valid_states = {'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 
                'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
                'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
                'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
                'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'}
df = df[df['state_abbr'].isin(valid_states)]

# Convert numeric columns
numeric_columns = [
    'ups', 'downs', 'score', 'num_comments', 'city_population', 'population_16plus',
    'employed_count', 'unemployed_count', 'unemployment_rate', 'employment_rate',
    'median_household_income', 'mean_household_income', 'per_capita_income',
    'poverty_rate', 'health_insurance_coverage_rate', 'private_insurance_rate',
    'public_insurance_rate', 'uninsured_rate', 'depression_prevalence',
    'mental_health_issues_prevalence', 'cognitive_difficulties_prevalence',
    'sleep_issues_prevalence', 'high_blood_pressure_prevalence',
    'diabetes_prevalence', 'obesity_prevalence', 'stroke_prevalence',
    'high_cholesterol_prevalence', 'drove_alone_rate', 'public_transit_rate',
    'mean_commute_time', 'employed_private_insurance_rate',
    'employed_public_insurance_rate', 'employed_uninsured_rate',
    'not_in_labor_force_insured_rate', 'is_rural', 'labor_force_participation',
    'healthcare_education_workforce'
]

for col in numeric_columns:
    if col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')

# Group by state and aggregate
agg_dict = {}
for col in numeric_columns:
    if col in df.columns:
        # Sum for counts, mean for rates/percentages
        if any(word in col.lower() for word in ['rate', 'income', 'prevalence', 'percentage']):
            agg_dict[col] = 'mean'
        else:
            agg_dict[col] = 'sum'

state_grouped = df.groupby('state_name').agg(agg_dict)

# Create state abbreviation mapping
state_abbr_map = {}
for state in valid_states:
    state_row = df[df['state_abbr'] == state]
    if not state_row.empty:
        state_abbr_map[state_row['state_name'].iloc[0]] = state

# Convert to JSON format
states_json = []

for state_name in state_grouped.index:
    state_abbr = state_abbr_map.get(state_name, 'XX')
    
    state_obj = {
        "name": state_name,
        "id": f"US.{state_abbr}",
        "state_abbr": state_abbr
    }
    
    # Add all aggregated metrics
    for col in state_grouped.columns:
        value = state_grouped.loc[state_name, col]
        # Skip NaN values
        if pd.notna(value):
            # Convert numpy types to Python native types
            value = value.item() if hasattr(value, 'item') else value
            # Round numeric values for cleaner JSON
            if isinstance(value, (int, float)):
                if isinstance(value, float):
                    state_obj[col] = round(value, 2)
                else:
                    state_obj[col] = int(value)
            else:
                state_obj[col] = value
    
    states_json.append(state_obj)

# Sort by state name for consistency
states_json.sort(key=lambda x: x['name'])

# Write to JSON file
output_file = 'state_data_processed.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(states_json, f, indent=2)

print(f"Data exported to {output_file}")
print(f"Total states: {len(states_json)}")
print(f"Fields per state: {len(states_json[0]) if states_json else 0}")
print(f"\nSample state data:")
print(json.dumps(states_json[0], indent=2))
