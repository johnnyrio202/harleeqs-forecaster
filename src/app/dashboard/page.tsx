'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SplitToggle } from '@/components/scenario/SplitToggle';
import { PriceSliders } from '@/components/scenario/PriceSliders';
import { VolumeControls } from '@/components/scenario/VolumeControls';
import { ScenarioSaveBar } from '@/components/scenario/ScenarioSaveBar';
import { MonthlyRevenueChart } from '@/components/charts/MonthlyRevenueChart';
import { GrowthProjectionChart } from '@/components/charts/GrowthProjectionChart';
import { MonthlyProjectionTable } from '@/components/tables/MonthlyProjectionTable';
import { VolumeComparisonTable } from '@/components/tables/VolumeComparisonTable';
import { computeScenarioRollup } from '@/lib/forecast';
import { DEFAULT_VIEW_STATE } from '@/lib/defaults';
import { useScenario } from '@/context/ScenarioContext';
import type { DashboardViewState, SplitMode, ScenarioRollup, VolumePreset } from '@/types/forecast';

function fmtK(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  return `$${(v / 1_000).toFixed(1)}K`;
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { activeScenario, hasActuals } = useScenario();
  const [view, setView] = useState<DashboardViewState>(DEFAULT_VIEW_STATE);

  function setSplit(splitMode: SplitMode) { setView((v) => ({ ...v, splitMode })); }
  function setFirstBowlPrice(p: number) { setView((v) => ({ ...v, firstBowlPrice: p })); }
  function setRefillPrice(p: number) { setView((v) => ({ ...v, refillPrice: p })); }
  function setVolume(volumeMultiplier: number, volumePreset: VolumePreset) {
    setView((v) => ({ ...v, volumeMultiplier, volumePreset }));
  }

  const priceOverrides = {
    firstBowlPrice: view.firstBowlPrice,
    refillPrice: view.refillPrice,
    volumeMultiplier: view.volumeMultiplier,
  };

  const { rollupA, rollupB } = useMemo(() => ({
    rollupA: computeScenarioRollup(activeScenario, priceOverrides, 'A'),
    rollupB: computeScenarioRollup(activeScenario, priceOverrides, 'B'),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [activeScenario, view.firstBowlPrice, view.refillPrice, view.volumeMultiplier]);

  const activeRollup: ScenarioRollup = view.splitMode === 'B' ? rollupB : rollupA;
  const y1A = rollupA.years[0];
  const y1B = rollupB.years[0];
  const y1Active = view.splitMode === 'B' ? y1B : y1A;
  const y1TotalBowls = activeRollup.months.slice(0, 12).reduce((s, m) => s + m.firstBowls, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
            {hasActuals && (
              <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 text-xs">
                Actuals on file
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {activeScenario.name} · {activeScenario.forecastHorizonMonths}-month forecast · {activeScenario.venues.length} venues
          </p>
        </div>
        <ScenarioSaveBar />
      </div>

      {/* View controls */}
      <div className="flex flex-wrap items-center gap-3">
        <SplitToggle value={view.splitMode} onChange={setSplit} />
        <PriceSliders
          firstBowlPrice={view.firstBowlPrice}
          refillPrice={view.refillPrice}
          onFirstBowlChange={setFirstBowlPrice}
          onRefillChange={setRefillPrice}
        />
        <VolumeControls
          volumeMultiplier={view.volumeMultiplier}
          volumePreset={view.volumePreset}
          onMultiplierChange={setVolume}
        />
      </div>

      {/* KPI cards */}
      {view.splitMode === 'compare' ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard label="Y1 Gross Revenue" value={fmtK(y1A?.grossRevenue ?? 0)} sub="both splits same" />
          <KpiCard label="Y1 HQ Net — Split A" value={fmtK(y1A?.hqNet ?? 0)} sub="80/20" />
          <KpiCard label="Y1 HQ Net — Split B" value={fmtK(y1B?.hqNet ?? 0)} sub="50/25/25" />
          <KpiCard label="A vs B delta (Y1)" value={fmtK((y1A?.hqNet ?? 0) - (y1B?.hqNet ?? 0))} sub="Split A advantage" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard label="Y1 Gross Revenue" value={fmtK(y1Active?.grossRevenue ?? 0)} />
          <KpiCard label="Y1 HQ Net" value={fmtK(y1Active?.hqNet ?? 0)} sub={view.splitMode === 'A' ? '80/20 split' : '50/25/25 split'} />
          <KpiCard label="Y1 First Bowls" value={new Intl.NumberFormat('en-US').format(Math.round(y1TotalBowls))} />
          <KpiCard label="24-mo HQ Net" value={fmtK(activeRollup.years.reduce((s, y) => s + y.hqNet, 0))} />
        </div>
      )}

      {/* Revenue chart */}
      {view.splitMode === 'compare' ? (
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Split A (80/20) — HQ Net by Venue</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyRevenueChart rollup={rollupA} venues={activeScenario.venues} />
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Split B (50/25/25) — HQ Net by Venue</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyRevenueChart rollup={rollupB} venues={activeScenario.venues} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Monthly HQ Net by Venue</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyRevenueChart rollup={activeRollup} venues={activeScenario.venues} />
          </CardContent>
        </Card>
      )}

      {/* Growth projections */}
      <GrowthProjectionChart year1HqNet={y1Active?.hqNet ?? 0} />

      {/* Volume comparison */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">Volume Scenario Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <VolumeComparisonTable
            scenario={activeScenario}
            currentVolumeMultiplier={view.volumeMultiplier}
            firstBowlPrice={view.firstBowlPrice}
            refillPrice={view.refillPrice}
            forceSplit={view.splitMode === 'compare' ? 'A' : view.splitMode}
          />
        </CardContent>
      </Card>

      {/* Venue legend */}
      <div className="flex flex-wrap gap-2">
        {activeScenario.venues.map((v) => (
          <div key={v.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5">
            <span className="text-sm font-medium text-slate-700">{v.name}</span>
            <Badge
              variant="outline"
              className={
                v.status === 'operating' ? 'text-emerald-700 border-emerald-200 bg-emerald-50'
                : v.status === 'launching' ? 'text-amber-700 border-amber-200 bg-amber-50'
                : 'text-slate-500 border-slate-200 bg-slate-50'
              }
            >
              {v.status}
            </Badge>
            <span className="text-xs text-slate-400">Split {v.splitStructure}</span>
          </div>
        ))}
      </div>

      {/* Monthly table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">Monthly Projections</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyProjectionTable rollup={activeRollup} forecastStartDate={activeScenario.forecastStartDate} />
        </CardContent>
      </Card>
    </div>
  );
}
