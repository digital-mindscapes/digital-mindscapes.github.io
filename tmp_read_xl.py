import pandas as pd
import json

df = pd.read_excel('data/Rural_Urban_Comparison/rural_urban_classification.xlsx', header=None)
print("FIRST 10 ROWS:")
print(df.head(10))

# Try reading from sheet name 'RUCC_2023' or similar
xl = pd.ExcelFile('data/Rural_Urban_Comparison/rural_urban_classification.xlsx')
print("\nSHEET NAMES:", xl.sheet_names)

df2 = pd.read_excel('data/Rural_Urban_Comparison/rural_urban_classification.xlsx', sheet_name=xl.sheet_names[0])
print("\nCOLUMNS IF FIRST SHEET HAS HEADER:")
print(df2.columns.tolist())
print(df2.head())
