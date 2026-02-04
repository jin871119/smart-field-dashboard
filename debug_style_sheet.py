import openpyxl

wb = openpyxl.load_workbook('backdata.xlsx', data_only=True)
sheet = wb['매장별스타일판매']
headers = [cell.value for cell in sheet[1]]
print(f"Headers: {headers}")

for i, row in enumerate(sheet.iter_rows(min_row=2, max_row=10, values_only=True)):
    print(f"Row {i+2}: {row}")
    date_idx = headers.index('일자')
    print(f"Date value: {row[date_idx]}, Type: {type(row[date_idx])}")
