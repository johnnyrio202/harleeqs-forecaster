'use client';

import { Slider } from '@/components/ui/slider';

type Props = {
  firstBowlPrice: number;
  refillPrice: number;
  onFirstBowlChange: (v: number) => void;
  onRefillChange: (v: number) => void;
};

export function PriceSliders({ firstBowlPrice, refillPrice, onFirstBowlChange, onRefillChange }: Props) {
  return (
    <div className="flex items-center gap-6 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3 min-w-[220px]">
        <span className="text-sm text-slate-500 whitespace-nowrap">First Bowl</span>
        <Slider
          min={60}
          max={100}
          step={5}
          value={[firstBowlPrice]}
          onValueChange={(vals) => onFirstBowlChange((vals as number[])[0])}
          className="w-28"
        />
        <span className="text-sm font-semibold tabular-nums text-slate-900 w-10 text-right">
          ${firstBowlPrice}
        </span>
      </div>
      <div className="h-4 w-px bg-slate-200" />
      <div className="flex items-center gap-3 min-w-[220px]">
        <span className="text-sm text-slate-500 whitespace-nowrap">Refill</span>
        <Slider
          min={45}
          max={60}
          step={0.5}
          value={[refillPrice]}
          onValueChange={(vals) => onRefillChange((vals as number[])[0])}
          className="w-28"
        />
        <span className="text-sm font-semibold tabular-nums text-slate-900 w-14 text-right">
          ${refillPrice.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
