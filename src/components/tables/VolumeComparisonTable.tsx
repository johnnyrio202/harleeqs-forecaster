'use client';

import type { Scenario } from '@/types/forecast';
import { computeScenarioRollup } from '@/lib/forecast';

const VOLUME_LEVELS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

function fmt$(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
}

type Props = {
  scenario: Scenario;
  currentVolumeMultiplier: number;
  firstBowlPrice: number;
  refillPrice: number;
  forceSplit?: 'A' | 'B';
};

export function VolumeComparisonTable({ scenario, currentVolumeMultiplier, firstBowlPrice, refillPrice, forceSplit }: Props) {
  const rows = VOLUME_LEVELS.map((vol) => {
    const rollup = computeScenarioRollup(scenario, { firstBowlPrice, refillPrice, volumeMultiplier: vol }, forceSplit);
    const y1 = rollup.years[0];
    const totalBowls = rollup.months.slice(0, 12).reduce((s, m) => s + m.firstBowls + m.refills, 0);
    const avgMonthlyBowls = Math.round(totalBowls / 12);
    const avgMonthlyRev = (y1?.grossRevenue ?? 0) / 12;
    const isCurrent = Math.abs(vol - currentVolumeMultiplier) < 0.01;

    return { vol, avgMonthlyBowls, avgMonthlyRev, y1, isCurrent };
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm tabular-nums">
        <thead>
          <tr className="bg-slate-800 text-white text-xs">
            <th className="px-4 py-3 text-left font-medium">Volume Level</th>
            <th className="px-4 py-3 text-right font-medium">Avg Monthly Bowls</th>
            <th className="px-4 py-3 text-right font-medium">Avg Monthly Rev</th>
            <th className="px-4 py-3 text-right font-medium">Y1 Annual Revenue</th>
            <th className="px-4 py-3 text-right font-medium">Y1 HQ Net</th>
            <th className="px-4 py-3 text-right font-medium">Y1 Venue Share</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ vol, avgMonthlyBowls, avgMonthlyRev, y1, isCurrent }) => (
            <tr
              key={vol}
              className={`border-t ${isCurrent ? 'bg-slate-50 border-l-4 border-l-slate-900 font-semibold' : 'hover:bg-slate-50'}`}
            >
              <td className="px-4 py-3 text-slate-700">
                {Math.round(vol * 100)}% Volume
                {isCurrent && <span className="ml-2 text-xs text-slate-400">(current)</span>}
              </td>
              <td className="px-4 py-3 text-right text-slate-600">{avgMonthlyBowls.toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-slate-600">{fmt$(avgMonthlyRev)}</td>
              <td className="px-4 py-3 text-right text-slate-700">{fmt$(y1?.grossRevenue ?? 0)}</td>
              <td className="px-4 py-3 text-right text-slate-900">{fmt$(y1?.hqNet ?? 0)}</td>
              <td className="px-4 py-3 text-right text-slate-600">{fmt$(y1?.venueGross ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
