# -*- coding: utf-8 -*-
import json
from collections import Counter

with open('performance_data.json', 'r', encoding='utf-8') as f:
    performance_data = json.load(f)

# 판매시점 분포 확인
sales_points = [item.get('판매시점', '') for item in performance_data.get('data', [])]
sales_point_counter = Counter(sales_points)

print("판매시점 분포 (상위 20개):")
for sp, count in sales_point_counter.most_common(20):
    print(f"  {sp}: {count}개")

# 연도별 분포
year_counter = Counter()
for sp in sales_points:
    if sp and len(sp) >= 4:
        year = sp[:4]
        year_counter[year] += 1

print("\n연도별 분포:")
for year in sorted(year_counter.keys()):
    print(f"  {year}년: {year_counter[year]}개")

# 특정 매장의 데이터 확인 (롯데본점)
print("\n롯데본점 데이터 샘플:")
lotte_samples = []
for item in performance_data.get('data', []):
    if item.get('매장명', '') == '롯데본점':
        lotte_samples.append(item)
    if len(lotte_samples) >= 5:
        break

for sample in lotte_samples:
    print(f"  판매시점: {sample.get('판매시점')}, 판매액: {sample.get('판매액')}")
