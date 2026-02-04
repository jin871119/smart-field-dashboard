# -*- coding: utf-8 -*-
"""
백데이터 엑셀(backdata.xlsx)의 모든 시트를 JSON으로 변환하여 public/data/에 저장합니다.
프로젝트 루트에서 실행: python update_all_data.py
"""
import os
import subprocess

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

scripts = [
    ('read_store.py', '매장'),
    ('read_item_season.py', '아이템시즌별판매'),
    ('read_store_style_sales.py', '매장별스타일판매'),
    ('read_store_inventory.py', '매장별재고'),
    ('read_performance.py', '실적'),
    ('read_group_data_v2.py', '단체 매출'),
    ('read_competitor_v2_fixed.py', '경쟁사'),
    ('read_weekly_meeting_final.py', '주간회의'),
]

if __name__ == '__main__':
    print("=" * 50)
    print("백데이터 엑셀 -> JSON 변환 시작")
    print("=" * 50)

    for script, name in scripts:
        try:
            print(f"\n[{name}] 업데이트 중...")
            result = subprocess.run(
                ['python', script],
                cwd=SCRIPT_DIR,
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace'
            )
            if result.returncode == 0:
                print(f"[{name}] 완료")
                if result.stdout:
                    print(result.stdout[:500])
            else:
                print(f"[{name}] 오류 (exit {result.returncode})")
                if result.stderr:
                    print(result.stderr[:500])
        except Exception as e:
            print(f"[{name}] 오류: {e}")

    print("\n" + "=" * 50)
    print("모든 데이터 업데이트 완료!")
    print("출력 경로: public/data/")
    print("=" * 50)
