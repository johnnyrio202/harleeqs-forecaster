'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const RATES = [
  { label: '10% Growth', rate: 0.10, color: '#059669' },
  { label: '15% Growth', rate: 0.15, color: '#2563eb' },
  { label: '20% Growth', rate: 0.20, color: '#7c3aed' },
];

function fmt$(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  return `$${(v / 1_000).toFixed(0)}K`;
}

type Props = {
  year1HqNet: number;
};

export function GrowthProjectionChart({ year1HqNet: y1 }: Props) {
  const [showChart, setShowChart] = useState(false);

  const projections = RATES.map(({ label, rate, color }) => {
    const years = Array.from({ length: 5 }, (_, i) => y1 * Math.pow(1 + rate, i));
    const total = years.reduce((s, v) => s + v, 0);
    return { label, rate, color, years, total };
  });

  const chartData = Array.from({ length: 5 }, (_, i) => {
    const point: Record<string, string | number> = { year: `Year ${i + 1}` };
    projections.forEach((p) => { point[p.label] = Math.round(p.years[i]); });
    return point;
  });

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-slate-700">Growth Scenarios (Years 1–5, HQ Net)</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowChart((v) => !v)}>
            {showChart ? 'Hide chart' : 'Show chart'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {projections.map((p) => (
            <div key={p.label} className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-1">{p.label}</p>
              <p className="text-xl font-semibold tabular-nums" style={{ color: p.color }}>{fmt$(p.total)}</p>
              <p className="text-xs text-slate-400 mt-0.5">5-year HQ total</p>
            </div>
          ))}
        </div>

        {showChart && (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tickFormatter={fmt$} tick={{ fontSize: 11, fill: '#64748b' }} width={60} />
              <Tooltip formatter={(v) => fmt$(Number(v))} />
              <Legend />
              {projections.map((p) => (
                <Line
                  key={p.label}
                  type="monotone"
                  dataKey={p.label}
                  stroke={p.color}
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
