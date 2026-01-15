# -*- coding: utf-8 -*-
import openpyxl

excel_file = 'backdata.xlsx'

try:
    workbook = openpyxl.load_workbook(excel_file, data_only=True)
    sheet = workbook['경쟁사']
    
    print("Row 1에서 '월평균' 헤더 찾기:")
    for col_idx in range(1, 20):
        cell = sheet.cell(row=1, column=col_idx)
        if cell.value and '월평균' in str(cell.value):
            print(f"  Col {col_idx}: {cell.value}")
    
except Exception as e:
    print(f"오류 발생: {e}")
    import traceback
    traceback.print_exc()
