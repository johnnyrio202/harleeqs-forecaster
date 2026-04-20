import { SEED_VENUES } from '@/data/seed-venues';
import { DEFAULT_SEASONALITY } from '@/data/default-seasonality';
import type { Scenario, DashboardViewState } from '@/types/forecast';

export function makeDefaultScenario(overrides?: Partial<Scenario>): Scenario {
  return {
    id: crypto.randomUUID(),
    name: 'Base Case',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    venues: SEED_VENUES,
    seasonality: DEFAULT_SEASONALITY,
    podCostPerBowl: 8.50,
    consumablesPerBowl: 2.00,
    annualGrowthRate: 0.12,
    annualPriceInflation: 0.03,
    forecastHorizonMonths: 24,
    ...overrides,
  };
}

export const DEFAULT_VIEW_STATE: DashboardViewState = {
  splitMode: 'A',
  firstBowlPrice: 75,
  refillPrice: 52.50,
  volumeMultiplier: 1.0,
  volumePreset: 'medium',
};
