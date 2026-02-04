# -*- coding: utf-8 -*-
import openpyxl
import json
import os
from datetime import datetime

EXCEL_FILE = 'backdata.xlsx'
DATA_DIR = 'public/data'

def format_date(value):
    if isinstance(value, datetime):
        return value.strftime('%Y-%m-%d')
    return value

def process_generic_sheet(workbook, sheet_name, output_filename):
    if sheet_name not in workbook.sheetnames:
        print(f"Skipping: '{sheet_name}' sheet not found.")
        return False
    
    print(f"Processing generic sheet: {sheet_name}...")
    sheet = workbook[sheet_name]
    
    # Read headers
    headers = [cell.value for cell in sheet[1]]
    data = []
    
    # Read data starting from row 2
    for row in sheet.iter_rows(min_row=2, values_only=True):
        row_data = {}
        has_data = False
        for header, value in zip(headers, row):
            val = format_date(value)
            row_data[header] = val
            if val is not None and val != '':
                has_data = True
        
        if has_data:
            data.append(row_data)
    
    output_path = os.path.join(DATA_DIR, output_filename)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            'headers': headers,
            'data': data,
            'total_rows': len(data)
        }, f, ensure_ascii=False, indent=2)
    
    print(f"Saved {len(data)} rows to {output_filename}")
    return True

def process_group_sales(workbook, sheet_name, output_filename):
    if sheet_name not in workbook.sheetnames:
        print(f"Skipping: '{sheet_name}' sheet not found.")
        return False
    
    print(f"Processing group sales (special): {sheet_name}...")
    sheet = workbook[sheet_name]
    store_map = {}
    months_2025 = [f'2025{str(m).zfill(2)}' for m in range(1, 12)]
    
    for row in sheet.iter_rows(min_row=2, values_only=True):
        # Column 2: Store Name, Column 3: Date, Column 20: Sales (T column)
        store_name = row[1]
        date_val = row[2]
        sales_val = row[19] # 0-indexed, so T is 19
        
        if not store_name:
            continue
            
        store_name = str(store_name).strip()
        date_str = str(date_val) if date_val else ''
        
        if date_str not in months_2025:
            continue
            
        try:
            sales = float(sales_val) if sales_val is not None else 0
        except:
            sales = 0
            
        if store_name not in store_map:
            store_map[store_name] = {'매장명': store_name, '소량단체판매액': 0}
        
        store_map[store_name]['소량단체판매액'] += sales
        
    result = {
        'stores': list(store_map.values()),
        'total_stores': len(store_map)
    }
    
    output_path = os.path.join(DATA_DIR, output_filename)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"Saved {len(store_map)} stores to {output_filename}")
    return True

def process_competitor(workbook, sheet_name, output_filename):
    if sheet_name not in workbook.sheetnames:
        print(f"Skipping: '{sheet_name}' sheet not found.")
        return False
        
    print(f"Processing competitor (special): {sheet_name}...")
    sheet = workbook[sheet_name]
    
    # Identify brands from headers
    brands = []
    # Row 1 and 2 are headers
    row1 = [cell.value for cell in sheet[1]]
    row2 = [cell.value for cell in sheet[2]]
    
    for col_idx, (h1, h2) in enumerate(zip(row1, row2)):
        # Check if either Row 1 or Row 2 has "월평균"
        h1_str = str(h1) if h1 else ""
        h2_str = str(h2) if h2 else ""
        
        if '월평균' in h1_str:
            brand_name = str(h2).strip() if h2 else None
            if brand_name:
                brands.append({'col_idx': col_idx, 'name': brand_name})
        elif '월평균' in h2_str:
            brand_name = str(h1).strip() if h1 else None
            if brand_name:
                brands.append({'col_idx': col_idx, 'name': brand_name})
    
    stores_data = []
    # Data starts from row 3 or 4. Let's look for where the store name is.
    # We use column 4 (index 3) for '백화점' store name
    for row in sheet.iter_rows(min_row=3, values_only=True):
        store_name = row[3] # Column 4 (D) is index 3
        
        # Skip empty rows or rows that are just headers
        if not store_name or store_name == '백화점':
            continue
            
        brand_data = {}
        for brand in brands:
            val = row[brand['col_idx']]
            try:
                brand_data[brand['name']] = float(val) if val is not None else 0
            except:
                brand_data[brand['name']] = 0
                
        stores_data.append({
            '백화점': str(store_name).strip(),
            '브랜드별_월평균': brand_data
        })
        
    result = {
        'brands': [b['name'] for b in brands],
        'stores': stores_data,
        'total_stores': len(stores_data)
    }
    
    output_path = os.path.join(DATA_DIR, output_filename)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
        
    print(f"Saved {len(stores_data)} stores to {output_filename}")
    return True

if __name__ == '__main__':
    print("=" * 50)
    print("Starting Optimized Dashboard Data Update")
    print("=" * 50)
    
    start_time = datetime.now()
    
    try:
        print(f"Loading {EXCEL_FILE} (this may take a minute color 64MB)...")
        # data_only=True to get calculated values
        wb = openpyxl.load_workbook(EXCEL_FILE, data_only=True)
        print(f"File loaded in {datetime.now() - start_time}")
        
        # Standard sheets
        process_generic_sheet(wb, '매장', 'store_data.json')
        process_generic_sheet(wb, '아이템시즌별판매', 'item_season_data.json')
        
        # Optimize '매장별스타일판매' to reduce file size (it was 180MB+)
        print("Processing optimized sheet: 매장별스타일판매...")
        style_sheet = wb['매장별스타일판매']
        style_headers = [cell.value for cell in style_sheet[1]]
        
        # Define necessary columns
        keep_columns = ['매장명', '품번', '제품명', '판매액합계', '일자', '시즌']
        col_indices = {col: i for i, col in enumerate(style_headers) if col in keep_columns}
        
        style_data = []
        for row in style_sheet.iter_rows(min_row=2, values_only=True):
            # Only keep data from 2024 onwards
            date_val = str(row[style_headers.index('일자')]) if '일자' in style_headers else ""
            if not date_val.startswith('2024') and not date_val.startswith('2025'):
                continue
                
            row_data = {}
            for col_name, idx in col_indices.items():
                row_data[col_name] = format_date(row[idx])
            style_data.append(row_data)
            
        with open(os.path.join(DATA_DIR, 'store_style_sales_data.json'), 'w', encoding='utf-8') as f:
            json.dump({
                'headers': keep_columns,
                'data': style_data,
                'total_rows': len(style_data)
            }, f, ensure_ascii=False, indent=2)
        print(f"Saved {len(style_data)} optimized rows to store_style_sales_data.json")

        process_generic_sheet(wb, '매장별재고', 'store_inventory_data.json')
        process_generic_sheet(wb, '실적', 'performance_data.json')
        # process_generic_sheet(wb, '주간회의', 'weekly_meeting_data.json') # Removed as it's missing in current file
        
        # Specialized sheets
        process_group_sales(wb, '단체', 'group_sales_data.json')
        process_competitor(wb, '경쟁사', 'competitor_data_v2.json')
        
        print("\n" + "=" * 50)
        print(f"All data updated successfully in {datetime.now() - start_time}")
        print("Output directory: public/data/")
        print("=" * 50)
        
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
