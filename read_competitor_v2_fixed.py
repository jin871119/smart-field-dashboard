import openpyxl
import json

def read_competitor_data(file_path, output_json_path):
    try:
        # data_only=True로 실제 계산된 값을 읽기
        workbook = openpyxl.load_workbook(file_path, data_only=True)
        sheet = workbook['경쟁사']
        
        # Row 1에서 "월평균(1~11월)" 헤더가 있는 모든 컬럼 찾기
        brands = []
        
        for col_idx in range(1, sheet.max_column + 1):
            header_cell = sheet.cell(row=1, column=col_idx)
            if header_cell.value and '월평균' in str(header_cell.value):
                # Row 2에서 브랜드 이름 가져오기
                brand_cell = sheet.cell(row=2, column=col_idx)
                if brand_cell.value and str(brand_cell.value).strip():
                    brand_name = str(brand_cell.value).strip()
                    brands.append({
                        'column': col_idx,
                        'name': brand_name
                    })
        
        print(f"발견된 브랜드 ({len(brands)}개): {[b['name'] for b in brands]}")
        
        # 데이터 읽기 (Row 3부터)
        stores_data = []
        
        for row_idx in range(3, sheet.max_row + 1):
            # 백화점 이름 (K열 = 11번째 컬럼)
            store_name_cell = sheet.cell(row=row_idx, column=11)
            store_name = store_name_cell.value
            
            # 백화점 이름이 없으면 데이터 끝으로 간주
            if not store_name or (isinstance(store_name, str) and store_name.strip() == ''):
                break
            
            store_name = str(store_name).strip()
            
            # 각 브랜드별 월평균 데이터 수집
            brand_data = {}
            for brand in brands:
                cell = sheet.cell(row=row_idx, column=brand['column'])
                value = cell.value
                
                # 숫자 값 처리
                if value is None:
                    brand_data[brand['name']] = 0
                elif isinstance(value, (int, float)):
                    brand_data[brand['name']] = float(value)
                else:
                    # 문자열이면 숫자로 변환 시도
                    try:
                        brand_data[brand['name']] = float(value)
                    except:
                        brand_data[brand['name']] = 0
            
            stores_data.append({
                '백화점': store_name,
                '브랜드별_월평균': brand_data
            })
        
        # 결과 저장
        result = {
            'brands': [b['name'] for b in brands],
            'stores': stores_data,
            'total_stores': len(stores_data)
        }
        
        with open(output_json_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        print(f"\n총 {len(stores_data)}개 점포의 데이터를 {output_json_path}에 저장했습니다.")
        print(f"\n처음 3개 점포 데이터:")
        for store in stores_data[:3]:
            print(f"  {store['백화점']}:")
            for brand, value in store['브랜드별_월평균'].items():
                print(f"    {brand}: {value}")
        
    except Exception as e:
        print(f"오류 발생: {e}")
        import traceback
        traceback.print_exc()

excel_file = 'backdata.xlsx'
output_json_path = 'competitor_data_v2.json'

read_competitor_data(excel_file, output_json_path)



