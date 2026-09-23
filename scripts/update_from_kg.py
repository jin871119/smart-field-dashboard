"""
지식그래프(KG) API 로 public/data/*.json 을 갱신한다.

사용법:  python scripts/update_from_kg.py 2026-09-20
  - 기준일(END_DT)까지의 데이터로 실적/아이템×시즌/재고/품번 베스트를 다시 만든다.
  - 기준월은 1일~기준일 MTD, 그 이전 월은 월 마감값.
  - 매장 마스터(store_data.json)는 KG 에 없는 담당자·평수 정보라 건드리지 않는다.
"""
import json
import os
import subprocess
import sys
import tempfile
from collections import defaultdict
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'public', 'data')
BRAND = 'M'  # MLB

EP_MONTH = '/api/v1/hq/sales_analysis/channel/month/channel_sales_month'
EP_DAY = '/api/v1/hq/sales_analysis/channel/day/channel_sales_day'
EP_STOCK = '/api/v1/hq/stock/shop_product_stock'
ROW_CAP = 20000


def kg(endpoint, body):
    fd, out = tempfile.mkstemp(suffix='.json')
    os.close(fd)
    env = dict(os.environ, MSYS_NO_PATHCONV='1')
    r = subprocess.run(
        ['dcs-ai-cli', 'fetch', '--endpoint', endpoint, '--method', 'POST',
         '--body', json.dumps(body, ensure_ascii=False), '-o', out],
        capture_output=True, text=True, encoding='utf-8', env=env)
    if r.returncode != 0:
        raise RuntimeError(r.stderr or r.stdout)
    with open(out, encoding='utf-8') as f:
        res = json.load(f)
    os.remove(out)
    rows = res.get('data') if isinstance(res, dict) else res
    if rows is None:
        raise RuntimeError(f'{endpoint}: {str(res)[:300]}')
    if len(rows) >= ROW_CAP:
        raise RuntimeError(f'{endpoint}: {len(rows)}행 — 상한 도달, 조회를 더 쪼개야 한다')
    return rows


def base(selectors_channel, selectors_product, metrics, periods):
    return {
        'filters_product': [{'system_code': BRAND, 'system_field_name': 'BRD_CD'}],
        'filters_channel': [],
        'selectors_channel': [{'system_field_name': s} for s in selectors_channel],
        'selectors_product': [{'system_field_name': s} for s in selectors_product],
        'metrics': [{'system_field_name': m} for m in metrics],
        'periods': periods,
        'meta_info': {'requested_record_rows': ROW_CAP},
    }


def month_rows(yymm, end_dt, sel_ch, sel_pr, metrics):
    """해당 월 집계. 기준월이면 1일~기준일 기간 조회."""
    if yymm == end_dt.strftime('%Y%m'):
        start = end_dt.replace(day=1).isoformat()
        return kg(EP_DAY, base(sel_ch, sel_pr, metrics,
                               {'start_dt': start, 'end_dt': end_dt.isoformat(), 'is_time_series': False}))
    return kg(EP_MONTH, base(sel_ch, sel_pr, metrics,
                             {'start_yymm': yymm, 'end_yymm': yymm, 'is_time_series': False}))


def months_back(end_dt, n):
    y, m = end_dt.year, end_dt.month
    out = []
    for _ in range(n):
        out.append(f'{y}{m:02d}')
        m -= 1
        if m == 0:
            y, m = y - 1, 12
    return out  # 최신 → 과거


def num(v):
    try:
        return float(v or 0)
    except (TypeError, ValueError):
        return 0.0


def clean_name(name):
    name = (name or '').strip()
    return name[:-5] if name.lower().endswith('close') else name


def load(name):
    with open(os.path.join(DATA, name), encoding='utf-8') as f:
        return json.load(f)


def save(name, obj):
    with open(os.path.join(DATA, name), 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
    print(f'  saved {name}')


def main():
    end_dt = date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else date.today()
    cur = end_dt.strftime('%Y%m')

    # 대상 매장: 매장 마스터 + 기존 실적 파일에 있던 매장
    targets = {r['매장명'] for r in load('store_data.json')['data']}
    targets |= {clean_name(r['매장명']) for r in load('performance_data.json')['data']}
    keep = lambda r: clean_name(r.get('SHOP_NM')) in targets

    # 1) 월별 실적: 전년 1월 ~ 기준월(MTD)
    print('[1/4] performance_data')
    first = f'{end_dt.year - 1}01'
    rows = kg(EP_MONTH, base(['SHOP_ID', 'SHOP_NM'], [], ['SALE_AMT'],
                             {'start_yymm': first, 'end_yymm': months_back(end_dt, 2)[1], 'is_time_series': True}))
    rows = [dict(r, YYMM=r['YYMM']) for r in rows]
    rows += [dict(r, YYMM=cur) for r in month_rows(cur, end_dt, ['SHOP_ID', 'SHOP_NM'], [], ['SALE_AMT'])]
    perf = [{'판매시점': str(r['YYMM']), '매장명': clean_name(r['SHOP_NM']), '판매액': num(r['SALE_AMT'])}
            for r in rows if keep(r)]
    perf.sort(key=lambda r: (r['판매시점'], r['매장명']))
    save('performance_data.json', {'headers': ['판매시점', '매장명', '판매액'], 'data': perf,
                                   'total_rows': len(perf), 'as_of': end_dt.isoformat()})

    # 2) 아이템×시즌 월별 피벗: 최근 13개월 (기준월 MTD 포함)
    print('[2/4] item_season_data')
    months = months_back(end_dt, 13)
    pivot = {}
    for yymm in months:
        for r in month_rows(yymm, end_dt, ['SHOP_ID', 'SHOP_NM'], ['ITEM', 'SESN'], ['SALE_AMT']):
            if not keep(r):
                continue
            k = (r['SHOP_ID'], r['ITEM'], r['SESN'])
            p = pivot.setdefault(k, {'매장코드': r['SHOP_ID'], '매장명': clean_name(r['SHOP_NM']),
                                     'ITEM': r['ITEM'], '시즌': r['SESN'], **{m: 0 for m in months}})
            p[yymm] += num(r['SALE_AMT'])
        print(f'    {yymm} ok')
    items = [p for p in pivot.values() if any(p[m] for m in months)]
    items.sort(key=lambda p: (p['매장코드'], p['ITEM'] or '', p['시즌'] or ''))
    save('item_season_data.json', {'headers': ['매장코드', '매장명', 'ITEM', '시즌', *[int(m) for m in months]],
                                    'data': [{**{k: v for k, v in p.items() if k not in months},
                                              **{m: p[m] for m in months}} for p in items],
                                    'total_rows': len(items), 'as_of': end_dt.isoformat()})

    # 3) 매장 시즌별 재고 (기준일 스냅샷)
    print('[3/4] store_inventory_data')
    body = base(['SHOP_ID', 'SHOP_NM'], ['SESN'], ['SH_STOCK_QTY', 'SH_STOCK_TAG_AMT'], None)
    body.pop('periods')
    body['end_dt'] = end_dt.isoformat()
    inv = [{'시즌': r['SESN'], '매장코드': r['SHOP_ID'], '매장명': clean_name(r['SHOP_NM']),
            '매장재고수량': num(r['SH_STOCK_QTY']), '매장재고택가': num(r['SH_STOCK_TAG_AMT'])}
           for r in kg(EP_STOCK, body) if keep(r) and num(r['SH_STOCK_QTY']) > 0]
    inv.sort(key=lambda r: (r['시즌'] or '', r['매장코드']))
    save('store_inventory_data.json', {'headers': ['시즌', '매장코드', '매장명', '매장재고수량', '매장재고택가'],
                                        'data': inv, 'total_rows': len(inv), 'as_of': end_dt.isoformat()})

    # 4) 매장×품번 판매 (기준월 MTD) — 판매액합계는 만원 단위 (기존 화면 규약)
    print('[4/4] store_style_sales_data')
    # 전 매장 한 번에 조회하면 2만행 상한을 넘으므로 매장별로 나눠 조회
    agg = defaultdict(lambda: {'amt': 0, 'qty': 0, 'nm': ''})
    shop_ids = sorted({r['SHOP_ID'] for r in rows if keep(r)})
    style_rows = []
    for sid in shop_ids:
        body = base(['SHOP_NM'], ['PRDT_CD', 'PRDT_NM'], ['SALE_AMT', 'SALE_QTY'],
                    {'start_dt': end_dt.replace(day=1).isoformat(), 'end_dt': end_dt.isoformat(),
                     'is_time_series': False})
        body['filters_channel'] = [{'system_code': sid, 'system_field_name': 'SHOP_ID'}]
        style_rows += kg(EP_DAY, body)
    for r in style_rows:
        a = agg[(clean_name(r['SHOP_NM']), r['PRDT_CD'])]
        a['amt'] += num(r['SALE_AMT'])
        a['qty'] += num(r['SALE_QTY'])
        a['nm'] = r.get('PRDT_NM') or a['nm']
    style = [{'매장명': s, '품번': p, '제품명': a['nm'], '판매액합계': round(a['amt'] / 10000),
              '판매수량합계': a['qty']} for (s, p), a in agg.items() if a['amt'] > 0]
    style.sort(key=lambda r: (r['매장명'], -r['판매액합계']))
    save('store_style_sales_data.json', {'headers': ['매장명', '품번', '제품명', '판매액합계', '판매수량합계'],
                                          'data': style, 'total_rows': len(style),
                                          'period': f'{end_dt.replace(day=1).isoformat()}~{end_dt.isoformat()}',
                                          'as_of': end_dt.isoformat()})
    print('done')


if __name__ == '__main__':
    main()
