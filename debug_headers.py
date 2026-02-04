import openpyxl

wb = openpyxl.load_workbook('backdata.xlsx', data_only=True)
sheet = wb['매장별스타일판매']
headers = [cell.value for cell in sheet[1]]
print(f"Full Headers: {headers}")

for h in headers:
    if h:
        print(f"Header: '{h}', Length: {len(str(h))}, Hex: {str(h).encode('utf-8').hex()}")
