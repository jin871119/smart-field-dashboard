# -*- coding: utf-8 -*-
import json

print("=== 실적 데이터 확인 ===")
try:
    with open('performance_data.json', 'r', encoding='utf-8') as f:
        perf_data = json.load(f)
    print(f"실적 데이터: {perf_data.get('total_rows', len(perf_data.get('data', [])))}개")
    
    from collections import Counter
    years = Counter()
    for item in perf_data.get('data', []):
        sp = item.get('판매시점', '')
        if sp and len(sp) >= 4:
            years[sp[:4]] += 1
    print(f"연도별 분포: {dict(years)}")
except Exception as e:
    print(f"실적 데이터 오류: {e}")

print("\n=== 경쟁사 데이터 확인 ===")
try:
    with open('competitor_data_v2.json', 'r', encoding='utf-8') as f:
        comp_data = json.load(f)
    print(f"경쟁사 점포 수: {comp_data.get('total_stores', 0)}개")
    print(f"브랜드 수: {len(comp_data.get('brands', []))}개")
    if comp_data.get('stores'):
        print(f"첫 번째 점포 샘플: {comp_data['stores'][0].get('백화점', 'N/A')}")
except Exception as e:
    print(f"경쟁사 데이터 오류: {e}")

print("\n=== 단체 데이터 확인 ===")
try:
    with open('group_sales_data.json', 'r', encoding='utf-8') as f:
        group_data = json.load(f)
    print(f"단체 매장 수: {group_data.get('total_stores', 0)}개")
    if group_data.get('stores'):
        sample = group_data['stores'][0]
        print(f"첫 번째 매장 샘플: {sample.get('매장명', 'N/A')}, 소량단체판매액: {sample.get('소량단체판매액', 0):,.0f}원")
except Exception as e:
    print(f"단체 데이터 오류: {e}")
