import { describe, it, expect } from 'vitest';
import {
  computeVenueMonth,
  computeVenueYear,
  computeScenarioRollup,
  computeSplitComparison,
} from '../forecast';
import type { Venue, Scenario } from '@/types/forecast';

// Flat seasonality for isolated ramp/split/growth tests
const FLAT_SEASONALITY = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, multiplier: 1.0 }));

const BASE_SCENARIO: Scenario = {
  id: 'test',
  name: 'Test',
  createdAt: '',
  updatedAt: '',
  venues: [],
  seasonality: FLAT_SEASONALITY,
  podCostPerBowl: 8.50,
  consumablesPerBowl: 2.00,
  forecastStartDate: '2026-05',
  annualGrowthRate: 0.12,
  annualPriceInflation: 0.03,
  forecastHorizonMonths: 24,
};

// Default 2-month ramp venue (for split/rollup tests)
const GHOSTBAR: Venue = {
  id: 'ghostbar',
  name: 'Ghostbar',
  status: 'operating',
  startMonth: 1,
  rampMonths: 2,
  operatingDaysPerWeek: 4,
  unitsDeployed: 8,
  baselineBowlsPerMonth: 380,
  revenueModel: { firstBowlPrice: 75, refillPrice: 52.50, refillAttachmentRate: 0.086 },
  splitStructure: 'A',
  priceMultiplier: 1.00,
};

// 6-month ramp venue (matches real Ghostbar config)
const GHOSTBAR_6R: Venue = { ...GHOSTBAR, rampMonths: 6 };

const PALMS_POOL: Venue = {
  id: 'palms-pool',
  name: 'Palms Pool',
  status: 'launching',
  startMonth: 11,
  rampMonths: 2,
  operatingDaysPerWeek: 6,
  unitsDeployed: 6,
  baselineBowlsPerMonth: 300,
  revenueModel: { firstBowlPrice: 75, refillPrice: 52.50, refillAttachmentRate: 0.086 },
  splitStructure: 'A',
  priceMultiplier: 1.00,
  closedMonths: [11, 12, 1, 2],
};

const INTRIGUE: Venue = {
  id: 'intrigue',
  name: 'Intrigue',
  status: 'launching',
  startMonth: 3,
  rampMonths: 2,
  operatingDaysPerWeek: 5,
  unitsDeployed: 6,
  baselineBowlsPerMonth: 320,
  revenueModel: { firstBowlPrice: 75, refillPrice: 52.50, refillAttachmentRate: 0.086 },
  splitStructure: 'B',
  priceMultiplier: 1.15,
};

describe('ramp months', () => {
  it('start month always produces 50% ramp factor', () => {
    const m1 = computeVenueMonth(GHOSTBAR, 1, BASE_SCENARIO);
    const mFull = computeVenueMonth(GHOSTBAR, 3, BASE_SCENARIO); // month 3 = past ramp (rampMonths=2)
    expect(m1.firstBowls / mFull.firstBowls).toBeCloseTo(0.50, 5);
  });

  it('6-month ramp: month 1 = 50%, month 6 = 100%', () => {
    const m1 = computeVenueMonth(GHOSTBAR_6R, 1, BASE_SCENARIO);
    const m6 = computeVenueMonth(GHOSTBAR_6R, 6, BASE_SCENARIO);
    const m7 = computeVenueMonth(GHOSTBAR_6R, 7, BASE_SCENARIO);
    // month 1 = 50% of full
    expect(m1.firstBowls / m7.firstBowls).toBeCloseTo(0.50, 4);
    // month 6 = last ramp month (5/6 * 0.5 + 0.5 = 0.9167)
    expect(m6.firstBowls / m7.firstBowls).toBeCloseTo(0.50 + 0.50 * 5 / 6, 4);
    // month 7 = full ramp
    expect(m7.firstBowls / m7.firstBowls).toBeCloseTo(1.0, 5);
  });

  it('venue before startMonth produces zero revenue', () => {
    const result = computeVenueMonth(INTRIGUE, 1, BASE_SCENARIO);
    expect(result.grossRevenue).toBe(0);
    expect(result.firstBowls).toBe(0);
  });
});

describe('closed months', () => {
  it('Palms Pool produces zero revenue in closed calendar months', () => {
    // forecastStartDate = '2026-05', month 11 = March 2027 (startMonth)
    // month 19 = Nov 2027 → calendar month 11 → closed
    const nov = computeVenueMonth(PALMS_POOL, 19, BASE_SCENARIO);
    expect(nov.grossRevenue).toBe(0);
    expect(nov.firstBowls).toBe(0);
  });

  it('Palms Pool produces zero in Jan and Feb (calendar months 1 and 2)', () => {
    // month 21 = Jan 2028, month 22 = Feb 2028
    const jan = computeVenueMonth(PALMS_POOL, 21, BASE_SCENARIO);
    const feb = computeVenueMonth(PALMS_POOL, 22, BASE_SCENARIO);
    expect(jan.grossRevenue).toBe(0);
    expect(feb.grossRevenue).toBe(0);
  });

  it('Palms Pool generates revenue in open month after startMonth', () => {
    // month 11 = March 2027 (calendar month 3, not closed)
    const mar = computeVenueMonth(PALMS_POOL, 11, BASE_SCENARIO);
    expect(mar.grossRevenue).toBeGreaterThan(0);
  });

  it('Palms Pool generates no revenue before startMonth', () => {
    const m1 = computeVenueMonth(PALMS_POOL, 1, BASE_SCENARIO);
    expect(m1.grossRevenue).toBe(0);
  });
});

describe('seasonality', () => {
  it('higher seasonal multiplier produces more revenue', () => {
    const highSeason = { ...BASE_SCENARIO, seasonality: [
      ...FLAT_SEASONALITY.slice(0, 4),
      { month: 5, multiplier: 1.10 },
      ...FLAT_SEASONALITY.slice(5),
    ]};
    const normal = computeVenueMonth(GHOSTBAR, 3, BASE_SCENARIO);    // month 3 = Jul (mult 1.0)
    const peak   = computeVenueMonth(GHOSTBAR, 1, highSeason);       // month 1 = May (mult 1.10)
    // peak should be 1.10x normal adjusted for ramp
    expect(peak.firstBowls / normal.firstBowls).toBeCloseTo(1.10 * 0.50, 3);
  });
});

describe('split structures', () => {
  it('split A gives 80% to HQ', () => {
    const result = computeVenueMonth(GHOSTBAR, 3, BASE_SCENARIO, undefined, 'A');
    expect(result.hqGross / result.grossRevenue).toBeCloseTo(0.80, 10);
  });

  it('split B payoff period: HQ 50%, venue 25%, ooka 25%', () => {
    const result = computeVenueMonth(INTRIGUE, 3, BASE_SCENARIO, undefined, 'B');
    expect(result.hqGross / result.grossRevenue).toBeCloseTo(0.50, 10);
    expect(result.venueGross / result.grossRevenue).toBeCloseTo(0.25, 10);
    expect(result.ookaGross / result.grossRevenue).toBeCloseTo(0.25, 10);
  });

  it('split B post-payoff: HQ 50%, venue 37.5%, ooka 12.5%', () => {
    const result = computeVenueMonth(INTRIGUE, 5, BASE_SCENARIO, undefined, 'B');
    expect(result.hqGross / result.grossRevenue).toBeCloseTo(0.50, 10);
    expect(result.venueGross / result.grossRevenue).toBeCloseTo(0.375, 10);
    expect(result.ookaGross / result.grossRevenue).toBeCloseTo(0.125, 10);
  });

  it('split A hqNet > split B hqNet for a high-revenue venue', () => {
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
  });
});

describe('year-over-year growth', () => {
  it('year 2 gross revenue exceeds year 1', () => {
    const y1 = computeVenueYear(GHOSTBAR, 1, BASE_SCENARIO);
    const y2 = computeVenueYear(GHOSTBAR, 2, BASE_SCENARIO);
    expect(y2.grossRevenue).toBeGreaterThan(y1.grossRevenue);
  });

  it('same month year 2 vs year 1 reflects growth × price inflation', () => {
    const m6 = computeVenueMonth(GHOSTBAR, 6, BASE_SCENARIO);
    const m18 = computeVenueMonth(GHOSTBAR, 18, BASE_SCENARIO);
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

  it('volume multiplier scales bowls linearly', () => {
    const base = computeVenueMonth(GHOSTBAR, 6, BASE_SCENARIO, { volumeMultiplier: 1.0 });
    const high = computeVenueMonth(GHOSTBAR, 6, BASE_SCENARIO, { volumeMultiplier: 1.4 });
    expect(high.firstBowls / base.firstBowls).toBeCloseTo(1.4, 5);
  });
});
