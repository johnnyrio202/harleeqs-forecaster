'use client';

import { Slider } from '@/components/ui/slider';
import type { VolumePreset } from '@/types/forecast';

const PRESETS: { value: VolumePreset; label: string; mult: number }[] = [
  { value: 'conservative', label: 'Conservative', mult: 0.7 },
  { value: 'medium', label: 'Medium', mult: 1.0 },
  { value: 'high', label: 'High', mult: 1.4 },
];

type Props = {
  volumeMultiplier: number;
  volumePreset: VolumePreset;
  onMultiplierChange: (v: number, preset: VolumePreset) => void;
};

export function VolumeControls({ volumeMultiplier, volumePreset, onMultiplierChange }: Props) {
  function handleSlider(pct: number) {
    const mult = pct / 100;
    const matched = PRESETS.find((p) => Math.abs(p.mult - mult) < 0.01);
    onMultiplierChange(mult, matched?.value ?? 'custom');
  }

  function handlePreset(preset: (typeof PRESETS)[number]) {
    onMultiplierChange(preset.mult, preset.value);
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <span className="text-sm text-slate-500 whitespace-nowrap">Volume</span>
      <div className="flex gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePreset(p)}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              volumePreset === p.value
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <Slider
        min={50}
        max={200}
        step={10}
        value={[Math.round(volumeMultiplier * 100)]}
        onValueChange={(vals) => handleSlider((vals as number[])[0])}
        className="w-28"
      />
      <span className="text-sm font-semibold tabular-nums text-slate-900 w-10 text-right">
        {Math.round(volumeMultiplier * 100)}%
      </span>
    </div>
  );
}
