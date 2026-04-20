import type { Seasonality } from '@/types/forecast';

export const DEFAULT_SEASONALITY: Seasonality[] = [
  { month: 1, multiplier: 0.88 },
  { month: 2, multiplier: 0.92 },
  { month: 3, multiplier: 1.00 },
  { month: 4, multiplier: 1.05 },
  { month: 5, multiplier: 1.10 },
  { month: 6, multiplier: 1.10 },
  { month: 7, multiplier: 1.00 },
  { month: 8, multiplier: 0.95 },
  { month: 9, multiplier: 0.95 },
  { month: 10, multiplier: 1.00 },
  { month: 11, multiplier: 0.85 },
  { month: 12, multiplier: 0.90 },
];
