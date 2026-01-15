# -*- coding: utf-8 -*-
import json

with open('performance_data.json', 'r', encoding='utf-8') as f:
    perf_data = json.load(f)

with open('store_data.json', 'r', encoding='utf-8') as f:
    store_data = json.load(f)

# 첫 번째 매장으로 테스트
test_store_name = store_data['data'][0]['매장명']
print(f"테스트 매장명: {test_store_name}")

# 매칭 함수 시뮬레이션
def match_store_name(store_name, perf_store_name):
    match = perf_store_name.find('(')
    if match != -1:
        end = perf_store_name.find(')', match)
        if end != -1:
            name_in_bracket = perf_store_name[match+1:end]
            return name_in_bracket == store_name or perf_store_name.find(store_name) != -1
    return perf_store_name.find(store_name) != -1 or store_name.find(perf_store_name) != -1

# 매칭되는 데이터 찾기
matched_items = []
for item in perf_data['data']:
    perf_store_name = item.get('매장명', '')
    if match_store_name(test_store_name, perf_store_name):
        matched_items.append(item)

print(f"\n매칭된 데이터: {len(matched_items)}개")

if matched_items:
    print(f"\n첫 번째 매칭 데이터 샘플:")
    sample = matched_items[0]
    for key, value in list(sample.items())[:10]:
        print(f"  {key}: {value}")
    
    # 판매시점 분석
    sales_points = [item.get('판매시점', '') for item in matched_items]
    from collections import Counter
    sp_counter = Counter(sales_points)
    print(f"\n판매시점 분포 (상위 5개):")
    for sp, count in sp_counter.most_common(5):
        print(f"  {sp}: {count}개")
    
    # 2025년 데이터 집계
    monthly_total = {}
    for item in matched_items:
        sp = item.get('판매시점', '')
        if sp and len(sp) >= 6:
            year = int(sp[:4])
            month = sp[4:6]
            if year == 2025:
                if month not in monthly_total:
                    monthly_total[month] = 0
                monthly_total[month] += item.get('판매액', 0) or 0
    
    print(f"\n2025년 월별 매출 (만원):")
    for month in sorted(monthly_total.keys()):
        print(f"  {month}월: {monthly_total[month]/10000:,.0f}만원")
    
    ytd = sum([monthly_total[m] for m in monthly_total.keys() if int(m) <= 11])
    print(f"\n연누계 (1~11월): {ytd/10000:,.0f}만원")
else:
    print("\n매칭된 데이터가 없습니다!")
    print("\nperformance_data.json의 매장명 샘플:")
    for item in perf_data['data'][:5]:
        print(f"  - {item.get('매장명', '')}")
