import type { ActualMonth, MonthResult } from '@/types/forecast';

export type VarianceStatus = 'good' | 'warn' | 'bad';

export type Variance = {
  forecastRevenue: number;
  actualRevenue: number;
  pct: number;
  status: VarianceStatus;
};

export function computeVariance(forecast: MonthResult, actual: ActualMonth): Variance {
  const pct = forecast.grossRevenue === 0
    ? 0
    : Math.abs((actual.grossRevenue - forecast.grossRevenue) / forecast.grossRevenue);

  const status: VarianceStatus = pct <= 0.10 ? 'good' : pct <= 0.25 ? 'warn' : 'bad';

  return {
    forecastRevenue: forecast.grossRevenue,
    actualRevenue: actual.grossRevenue,
    pct,
    status,
  };
}
