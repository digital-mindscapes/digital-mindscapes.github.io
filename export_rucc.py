import pandas as pd
import json

df = pd.read_excel('data/Rural_Urban_Comparison/rural_urban_classification.xlsx')
# Ensure FIPS code is 5 digits string
df['FIPS code'] = df['FIPS code'].astype(str).str.zfill(5)

rucc_dict = {}

# RUCC documentation summary:
# 1-3: Metro (Urban)
# 4-9: Nonmetro (Rural)

def classify_rucc(code):
    try:
        c = int(code)
        if c in [1, 2, 3]:
            return "Metro" # Metropolitan
        elif c in [4, 5, 6, 7, 8, 9]:
            return "Nonmetro" # Nonmetropolitan / Rural
        else:
            return "Unknown"
    except:
        return "Unknown"

for _, row in df.iterrows():
    fips = row['FIPS code']
    code = row['2013 code']
    rucc_dict[fips] = {
        'rucc_code': code,
        'classification': classify_rucc(code)
    }

with open('data/Rural_Urban_Comparison/county_rucc.json', 'w') as f:
    json.dump(rucc_dict, f, indent=2)

print(f"Exported JSON with {len(rucc_dict)} counties.")
