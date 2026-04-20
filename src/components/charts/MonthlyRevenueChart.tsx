'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ScenarioRollup } from '@/types/forecast';
import type { Venue } from '@/types/forecast';

const VENUE_COLORS = ['#0f172a', '#475569', '#94a3b8', '#cbd5e1'];

type Props = {
  rollup: ScenarioRollup;
  venues: Venue[];
};

function fmt(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export function MonthlyRevenueChart({ rollup, venues }: Props) {
  const data = rollup.months.map((m) => {
    const point: Record<string, number | string> = { month: `M${m.month}` };
    venues.forEach((v) => {
      const vr = m.byVenue.find((b) => b.venueId === v.id);
      point[v.name] = Math.round(vr?.hqNet ?? 0);
    });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} interval={1} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#64748b' }} width={56} />
        <Tooltip formatter={(v) => fmt(Number(v))} />
        <Legend />
        {venues.map((v, i) => (
          <Area
            key={v.id}
            type="monotone"
            dataKey={v.name}
            stackId="1"
            stroke={VENUE_COLORS[i % VENUE_COLORS.length]}
            fill={VENUE_COLORS[i % VENUE_COLORS.length]}
            fillOpacity={0.15 + i * 0.1}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
