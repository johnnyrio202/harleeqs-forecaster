'use client';

import type { ScenarioRollup } from '@/types/forecast';

type Props = {
  rollup: ScenarioRollup;
  showMonths?: number;
};

function fmt$(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
}

function fmtN(v: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v);
}

export function MonthlyProjectionTable({ rollup, showMonths = 24 }: Props) {
  const months = rollup.months.slice(0, showMonths);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm tabular-nums">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500 uppercase tracking-wide">
            <th className="pb-2 pr-4 font-medium">Month</th>
            <th className="pb-2 pr-4 font-medium text-right">First Bowls</th>
            <th className="pb-2 pr-4 font-medium text-right">Refills</th>
            <th className="pb-2 pr-4 font-medium text-right">Gross Revenue</th>
            <th className="pb-2 pr-4 font-medium text-right">COGS</th>
            <th className="pb-2 font-medium text-right">HQ Net</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.month} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="py-2 pr-4 font-medium text-slate-700">M{m.month}</td>
              <td className="py-2 pr-4 text-right text-slate-600">{fmtN(m.firstBowls)}</td>
              <td className="py-2 pr-4 text-right text-slate-600">{fmtN(m.refills)}</td>
              <td className="py-2 pr-4 text-right text-slate-700">{fmt$(m.grossRevenue)}</td>
              <td className="py-2 pr-4 text-right text-rose-600">{fmt$(m.cogs)}</td>
              <td className="py-2 text-right font-semibold text-slate-900">{fmt$(m.hqNet)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-300 font-semibold">
            <td className="pt-2 pr-4 text-slate-900">Total</td>
            <td className="pt-2 pr-4 text-right">{fmtN(months.reduce((s, m) => s + m.firstBowls, 0))}</td>
            <td className="pt-2 pr-4 text-right">{fmtN(months.reduce((s, m) => s + m.refills, 0))}</td>
            <td className="pt-2 pr-4 text-right">{fmt$(months.reduce((s, m) => s + m.grossRevenue, 0))}</td>
            <td className="pt-2 pr-4 text-right text-rose-600">{fmt$(months.reduce((s, m) => s + m.cogs, 0))}</td>
            <td className="pt-2 text-right text-slate-900">{fmt$(months.reduce((s, m) => s + m.hqNet, 0))}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
