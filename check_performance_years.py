# -*- coding: utf-8 -*-
import json

with open('performance_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 판매시점 분포 확인
sales_points = [item.get('판매시점', '') for item in data.get('data', [])]

from collections import Counter
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

# 특정 매장의 데이터 샘플 (롯데본점)
print("\n롯데본점 데이터 샘플 (2024년, 2025년 각 3개씩):")
lotte_2024 = []
lotte_2025 = []
for item in data.get('data', []):
    if item.get('매장명', '') == '롯데본점':
        sp = item.get('판매시점', '')
        if sp and len(sp) >= 4:
            year = sp[:4]
            if year == '2024' and len(lotte_2024) < 3:
                lotte_2024.append(item)
            elif year == '2025' and len(lotte_2025) < 3:
                lotte_2025.append(item)

print("\n2024년 데이터:")
for item in lotte_2024:
    print(f"  판매시점: {item.get('판매시점')}, 판매액: {item.get('판매액')}")

print("\n2025년 데이터:")
for item in lotte_2025:
    print(f"  판매시점: {item.get('판매시점')}, 판매액: {item.get('판매액')}")
