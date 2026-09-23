
import React from 'react';
import { MonthlyPerformance } from '../types';

interface Props {
  monthlyPerformance: MonthlyPerformance[];
}

const CARDS = [
  { label: '12월 마감', month: '12월', field: 'target' as const },
  { label: '1월 마감',  month: '1월',  field: 'revenue' as const },
  { label: '2월 MTD',  month: '2월',  field: 'revenue' as const },
];

const MonthlyKPICards: React.FC<Props> = ({ monthlyPerformance }) => {
  const getValue = (month: string, field: 'revenue' | 'target'): number => {
    const m = monthlyPerformance.find(p => p.month === month);
    return m ? (m[field] ?? 0) : 0;
  };

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {CARDS.map(({ label, month, field }) => {
        const valueMan = getValue(month, field); // 만원 단위
        const display = valueMan > 0
          ? Math.round(valueMan / 100).toLocaleString()
          : '-';

        return (
          <div
            key={label}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 flex flex-col items-center justify-center"
          >
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              {label}
            </p>
            <p className="text-sm font-bold text-slate-900 leading-none">
              {display}
            </p>
            {valueMan > 0 && (
              <p className="text-[9px] text-slate-400 mt-1">백만원</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MonthlyKPICards;
