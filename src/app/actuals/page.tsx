'use client';

import { useState } from 'react';
import { useScenario } from '@/context/ScenarioContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ActualMonth } from '@/types/forecast';

const MONTH_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const d = new Date(2026, i, 1);
  return {
    value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    label: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
  };
});

function fmt$(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
}

export default function ActualsPage() {
  const { activeScenario, actuals, addOrUpdateActual } = useScenario();
  const [venueId, setVenueId] = useState(activeScenario.venues[0]?.id ?? '');
  const [month, setMonth] = useState(MONTH_OPTIONS[0].value);
  const [firstBowls, setFirstBowls] = useState('');
  const [refills, setRefills] = useState('');
  const [grossRevenue, setGrossRevenue] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!firstBowls || !refills || !grossRevenue) return;
    setSaving(true);
    try {
      const actual: ActualMonth = {
        id: crypto.randomUUID(),
        venueId,
        month,
        firstBowls: Number(firstBowls),
        refills: Number(refills),
        grossRevenue: Number(grossRevenue),
        notes: notes || undefined,
      };
      await addOrUpdateActual(actual);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Actuals</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Enter monthly actuals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Venue</Label>
              <select
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {activeScenario.venues.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Month</Label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstBowls">First Bowls</Label>
                <Input
                  id="firstBowls"
                  type="number"
                  value={firstBowls}
                  onChange={(e) => setFirstBowls(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="refills">Refills</Label>
                <Input
                  id="refills"
                  type="number"
                  value={refills}
                  onChange={(e) => setRefills(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="grossRevenue">Gross Revenue ($)</Label>
              <Input
                id="grossRevenue"
                type="number"
                value={grossRevenue}
                onChange={(e) => setGrossRevenue(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. holiday week, staff shortage"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={!firstBowls || !refills || !grossRevenue || saving}
              className="w-full"
            >
              {saved ? 'Saved!' : saving ? 'Saving…' : 'Save actuals'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">
              Entered actuals
              {actuals.length > 0 && (
                <Badge className="ml-2 bg-slate-100 text-slate-700">{actuals.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {actuals.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No actuals entered yet.</p>
            ) : (
              <div className="space-y-2">
                {actuals.map((a) => {
                  const venue = activeScenario.venues.find((v) => v.id === a.venueId);
                  return (
                    <div key={`${a.venueId}-${a.month}`} className="rounded-lg border border-slate-100 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700">{venue?.name ?? a.venueId}</span>
                        <span className="text-slate-400 text-xs">{a.month}</span>
                      </div>
                      <div className="mt-1 flex gap-4 tabular-nums text-slate-600">
                        <span>{a.firstBowls} bowls</span>
                        <span>{a.refills} refills</span>
                        <span className="font-medium text-slate-900">{fmt$(a.grossRevenue)}</span>
                      </div>
                      {a.notes && <p className="mt-1 text-xs text-slate-400">{a.notes}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
