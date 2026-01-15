# -*- coding: utf-8 -*-
import json

# performance_data.json 구조 확인
with open('performance_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("performance_data.json 구조:")
print(f"Headers: {data.get('headers', [])}")
print(f"Total rows: {data.get('total_rows', len(data.get('data', [])))}")

print("\n처음 5개 행:")
for i, row in enumerate(data.get('data', [])[:5]):
    print(f"\n행 {i+1}:")
    for key, value in list(row.items())[:10]:
        print(f"  {key}: {value}")

print("\n매장명 종류 (처음 10개):")
store_names = set()
for row in data.get('data', []):
    store_name = row.get('매장명', '')
    if store_name:
        store_names.add(store_name)
    if len(store_names) >= 10:
        break

for name in list(store_names)[:10]:
    print(f"  - {name}")
