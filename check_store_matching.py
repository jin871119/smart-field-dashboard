# -*- coding: utf-8 -*-
import json

# store_data.json과 performance_data.json 매칭 확인
with open('store_data.json', 'r', encoding='utf-8') as f:
    store_data = json.load(f)

with open('performance_data.json', 'r', encoding='utf-8') as f:
    performance_data = json.load(f)

print("store_data.json 매장명 (처음 10개):")
store_names = [item['매장명'] for item in store_data.get('data', [])]
for name in store_names[:10]:
    print(f"  - {name}")

print("\nperformance_data.json 매장명 (처음 20개, 고유값):")
performance_store_names = set()
for item in performance_data.get('data', []):
    store_name = item.get('매장명', '')
    if store_name:
        performance_store_names.add(store_name)
    if len(performance_store_names) >= 20:
        break

for name in sorted(list(performance_store_names))[:20]:
    print(f"  - {name}")

# 매칭 테스트
print("\n매칭 테스트 (store_data의 처음 5개 매장):")
for store_name in store_names[:5]:
    # performance_data에서 매칭되는 데이터 찾기
    matched = []
    for perf_item in performance_data.get('data', []):
        perf_store_name = perf_item.get('매장명', '')
        # 괄호 안의 이름 추출
        match = perf_store_name.find('(')
        if match != -1:
            name_in_bracket = perf_store_name[match+1:perf_store_name.find(')', match)]
            if name_in_bracket == store_name:
                matched.append(perf_store_name)
        elif perf_store_name == store_name or store_name in perf_store_name or perf_store_name in store_name:
            matched.append(perf_store_name)
    
    print(f"  {store_name}: {len(matched)}개 매칭")
    if matched:
        print(f"    예시: {matched[0]}")
