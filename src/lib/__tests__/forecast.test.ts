import { describe, it, expect } from 'vitest';
import {
  computeVenueMonth,
  computeVenueYear,
  computeScenarioRollup,
  computeSplitComparison,
} from '../forecast';
import type { Venue, Scenario } from '@/types/forecast';
import { DEFAULT_SEASONALITY } from '@/data/default-seasonality';

const BASE_SCENARIO: Scenario = {
  id: 'test',
  name: 'Test',
  createdAt: '',
  updatedAt: '',
  venues: [],
  seasonality: DEFAULT_SEASONALITY,
  podCostPerBowl: 8.50,
  consumablesPerBowl: 2.00,
  annualGrowthRate: 0.12,
  annualPriceInflation: 0.03,
  forecastHorizonMonths: 24,
};

const GHOSTBAR: Venue = {
  id: 'ghostbar',
  name: 'Ghostbar',
  status: 'operating',
  startMonth: 1,
  operatingDaysPerWeek: 4,
  unitsDeployed: 8,
  baselineBowlsPerMonth: 380,
  revenueModel: { firstBowlPrice: 75, refillPrice: 52.50, refillAttachmentRate: 0.086 },
  splitStructure: 'A',
  priceMultiplier: 1.00,
};

const INTRIGUE: Venue = {
  id: 'intrigue',
  name: 'Intrigue',
  status: 'launching',
  startMonth: 3,
  operatingDaysPerWeek: 5,
  unitsDeployed: 6,
  baselineBowlsPerMonth: 320,
  revenueModel: { firstBowlPrice: 75, refillPrice: 52.50, refillAttachmentRate: 0.086 },
  splitStructure: 'B',
  priceMultiplier: 1.15,
};

describe('ramp months', () => {
  it('month 1 produces 50% of full output', () => {
    const full = computeVenueMonth(GHOSTBAR, 3, BASE_SCENARIO); // month 3 = full ramp
    const ramp1 = computeVenueMonth(GHOSTBAR, 1, BASE_SCENARIO);
    expect(ramp1.firstBowls).toBeCloseTo(full.firstBowls * (0.50 / 1.0) * (DEFAULT_SEASONALITY[0].multiplier / DEFAULT_SEASONALITY[2].multiplier), 0);
  });

  it('start month has ramp 0.50', () => {
    const m1 = computeVenueMonth(GHOSTBAR, 1, BASE_SCENARIO);
    const m3 = computeVenueMonth(GHOSTBAR, 3, BASE_SCENARIO);
    // ratio should be 0.50/1.0 adjusted for seasonality
    const expectedRatio = 0.50 * (DEFAULT_SEASONALITY[0].multiplier / DEFAULT_SEASONALITY[2].multiplier);
    expect(m1.firstBowls / m3.firstBowls).toBeCloseTo(expectedRatio, 5);
  });

  it('second month has ramp 0.75', () => {
    const m2 = computeVenueMonth(GHOSTBAR, 2, BASE_SCENARIO);
    const m3 = computeVenueMonth(GHOSTBAR, 3, BASE_SCENARIO);
    const expectedRatio = 0.75 * (DEFAULT_SEASONALITY[1].multiplier / DEFAULT_SEASONALITY[2].multiplier);
    expect(m2.firstBowls / m3.firstBowls).toBeCloseTo(expectedRatio, 5);
  });

  it('venue before startMonth produces zero revenue', () => {
    const result = computeVenueMonth(INTRIGUE, 1, BASE_SCENARIO); // starts month 3
    expect(result.grossRevenue).toBe(0);
    expect(result.firstBowls).toBe(0);
  });
});

describe('seasonality', () => {
  it('Jan multiplier 0.88 vs March 1.00 produces ~88% revenue at equal ramp', () => {
    // Use a venue starting at month 1 that's past ramp by month 13 (jan of year 2)
    // Month 13 = Jan (same year index 2), month 15 = Mar year 2
    const jan = computeVenueMonth(GHOSTBAR, 13, BASE_SCENARIO);
    const mar = computeVenueMonth(GHOSTBAR, 15, BASE_SCENARIO);
    expect(jan.firstBowls / mar.firstBowls).toBeCloseTo(0.88 / 1.00, 5);
  });

  it('May and June at 1.10 produce equal bowls', () => {
    const may = computeVenueMonth(GHOSTBAR, 5, BASE_SCENARIO);
    const jun = computeVenueMonth(GHOSTBAR, 6, BASE_SCENARIO);
    expect(may.firstBowls).toBeCloseTo(jun.firstBowls, 5);
  });
});

describe('split structures', () => {
  it('split A gives 80% to HQ', () => {
    const result = computeVenueMonth(GHOSTBAR, 3, BASE_SCENARIO, undefined, 'A');
    expect(result.hqGross / result.grossRevenue).toBeCloseTo(0.80, 10);
  });

  it('split B payoff period: HQ 50%, venue 25%, ooka 25%', () => {
    // startMonth=3, first 2 months (3,4) are payoff
    const result = computeVenueMonth(INTRIGUE, 3, BASE_SCENARIO, undefined, 'B');
    expect(result.hqGross / result.grossRevenue).toBeCloseTo(0.50, 10);
    expect(result.venueGross / result.grossRevenue).toBeCloseTo(0.25, 10);
    expect(result.ookaGross / result.grossRevenue).toBeCloseTo(0.25, 10);
  });

  it('split B post-payoff: HQ 50%, venue 37.5%, ooka 12.5%', () => {
    // month 5 = 2 months after startMonth 3, so post-payoff
    const result = computeVenueMonth(INTRIGUE, 5, BASE_SCENARIO, undefined, 'B');
    expect(result.hqGross / result.grossRevenue).toBeCloseTo(0.50, 10);
    expect(result.venueGross / result.grossRevenue).toBeCloseTo(0.375, 10);
    expect(result.ookaGross / result.grossRevenue).toBeCloseTo(0.125, 10);
  });

  it('split A hqNet > split B hqNet for a high-revenue venue (Split A is better for HQ)', () => {
    const a = computeVenueMonth(GHOSTBAR, 6, BASE_SCENARIO, undefined, 'A');
    const b = computeVenueMonth(GHOSTBAR, 6, BASE_SCENARIO, undefined, 'B');
    expect(a.hqNet).toBeGreaterThan(b.hqNet);
  });
});

describe('multi-venue rollup', () => {
  it('rollup sums match sum of individual venues', () => {
    const scenario = { ...BASE_SCENARIO, venues: [GHOSTBAR, INTRIGUE], forecastHorizonMonths: 12 };
    const rollup = computeScenarioRollup(scenario);
    const month6 = rollup.months[5];

    const g = computeVenueMonth(GHOSTBAR, 6, scenario);
    const i = computeVenueMonth(INTRIGUE, 6, scenario);

    expect(month6.grossRevenue).toBeCloseTo(g.grossRevenue + i.grossRevenue, 2);
    expect(month6.hqNet).toBeCloseTo(g.hqNet + i.hqNet, 2);
    expect(month6.firstBowls).toBeCloseTo(g.firstBowls + i.firstBowls, 2);
  });
});

describe('year-over-year growth', () => {
  it('year 2 gross revenue exceeds year 1 due to growth factor', () => {
    const scenario = { ...BASE_SCENARIO, venues: [GHOSTBAR], forecastHorizonMonths: 24 };
    const y1 = computeVenueYear(GHOSTBAR, 1, scenario);
    const y2 = computeVenueYear(GHOSTBAR, 2, scenario);
    expect(y2.grossRevenue).toBeGreaterThan(y1.grossRevenue);
  });

  it('same month in year 2 vs year 1 reflects growth × price inflation (no ramp contamination)', () => {
    // Flat seasonality, compare month 6 (Y1, full ramp) vs month 18 (Y2, full ramp)
    const scenario = {
      ...BASE_SCENARIO,
      venues: [GHOSTBAR],
      forecastHorizonMonths: 24,
      seasonality: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, multiplier: 1.0 })),
    };
    const m6 = computeVenueMonth(GHOSTBAR, 6, scenario);
    const m18 = computeVenueMonth(GHOSTBAR, 18, scenario);
    const expectedRatio = (1 + 0.12) * (1 + 0.03);
    expect(m18.grossRevenue / m6.grossRevenue).toBeCloseTo(expectedRatio, 5);
  });
});

describe('split comparison', () => {
  it('returns both splits and a delta', () => {
    const scenario = { ...BASE_SCENARIO, venues: [GHOSTBAR, INTRIGUE], forecastHorizonMonths: 24 };
    const comp = computeSplitComparison(scenario);
    expect(comp.splitA).toBeDefined();
    expect(comp.splitB).toBeDefined();
    expect(typeof comp.delta.hqNetY1).toBe('number');
  });

  it('split A hqNet total > split B hqNet total (80/20 is better for HQ)', () => {
    const scenario = { ...BASE_SCENARIO, venues: [GHOSTBAR], forecastHorizonMonths: 24 };
    const comp = computeSplitComparison(scenario);
    expect(comp.splitA.years.reduce((s, y) => s + y.hqNet, 0)).toBeGreaterThan(
      comp.splitB.years.reduce((s, y) => s + y.hqNet, 0)
    );
  });
});

describe('price overrides', () => {
  it('higher firstBowlPrice produces more gross revenue', () => {
    const base = computeVenueMonth(GHOSTBAR, 6, BASE_SCENARIO, { firstBowlPrice: 75 });
    const high = computeVenueMonth(GHOSTBAR, 6, BASE_SCENARIO, { firstBowlPrice: 100 });
    expect(high.grossRevenue).toBeGreaterThan(base.grossRevenue);
  });

  it('higher refillPrice produces more gross revenue', () => {
    const base = computeVenueMonth(GHOSTBAR, 6, BASE_SCENARIO, { refillPrice: 52.50 });
    const high = computeVenueMonth(GHOSTBAR, 6, BASE_SCENARIO, { refillPrice: 60 });
    expect(high.grossRevenue).toBeGreaterThan(base.grossRevenue);
  });
});
