import type { Seasonality } from '@/types/forecast';

// Cold season (Nov–Feb) set to 0.50 per business requirement.
// Palms Pool uses closedMonths=[11,12,1,2] so these multipliers only affect Ghostbar in those months.
export const DEFAULT_SEASONALITY: Seasonality[] = [
  { month: 1,  multiplier: 0.50 }, // Jan — cold season
  { month: 2,  multiplier: 0.50 }, // Feb — cold season
  { month: 3,  multiplier: 1.00 }, // Mar
  { month: 4,  multiplier: 1.05 }, // Apr
  { month: 5,  multiplier: 1.10 }, // May — peak
  { month: 6,  multiplier: 1.10 }, // Jun — peak
  { month: 7,  multiplier: 1.00 }, // Jul
  { month: 8,  multiplier: 0.95 }, // Aug
  { month: 9,  multiplier: 0.95 }, // Sep
  { month: 10, multiplier: 1.00 }, // Oct — full ramp complete
  { month: 11, multiplier: 0.50 }, // Nov — cold season
  { month: 12, multiplier: 0.50 }, // Dec — cold season
];
