import openpyxl
from datetime import datetime

wb = openpyxl.load_workbook('backdata.xlsx', data_only=True)
sheet = wb['매장별스타일판매']
headers = [cell.value for cell in sheet[1]]
print(f"Headers: {headers}")

date_idx = headers.index('일자') if '일자' in headers else -1
print(f"Date index: {date_idx}")

counts = {2024: 0, 2025: 0, 2026: 0, 'other': 0}
for i, row in enumerate(sheet.iter_rows(min_row=2, values_only=True)):
    if date_idx >= 0:
        val = row[date_idx]
        if isinstance(val, datetime):
            year = val.year
        else:
            try:
                year = int(str(val)[:4])
            except:
                year = 'other'
        
        if year in counts:
            counts[year] += 1
        else:
            counts['other'] += 1
    
    if i < 5:
        print(f"Sample row {i+2}: {val} (type: {type(val)})")

print(f"Year counts: {counts}")
print(f"Total rows processed: {i+1}")
