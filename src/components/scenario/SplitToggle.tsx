'use client';

import type { SplitMode } from '@/types/forecast';

type Props = {
  value: SplitMode;
  onChange: (v: SplitMode) => void;
};

const OPTIONS: { value: SplitMode; label: string }[] = [
  { value: 'A', label: 'Split A (80/20)' },
  { value: 'B', label: 'Split B (50/25/25)' },
  { value: 'compare', label: 'Compare both' },
];

export function SplitToggle({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            value === o.value
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
