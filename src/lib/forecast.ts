import type {
  Venue,
  Scenario,
  MonthResult,
  YearResult,
  ScenarioRollup,
  RollupMonth,
  RollupYear,
  SplitComparison,
} from '@/types/forecast';

type PriceOverrides = {
  firstBowlPrice?: number;
  refillPrice?: number;
  volumeMultiplier?: number;
};

function getCalendarMonth(scenario: Scenario, absoluteMonth: number): number {
  const [year, month] = scenario.forecastStartDate.split('-').map(Number);
  const totalMonths = (year * 12 + month - 1) + (absoluteMonth - 1);
  return (totalMonths % 12) + 1;
}

function getSeasonalMultiplier(scenario: Scenario, absoluteMonth: number): number {
  const calendarMonth = getCalendarMonth(scenario, absoluteMonth);
  const entry = scenario.seasonality.find((s) => s.month === calendarMonth);
  return entry?.multiplier ?? 1.0;
}

function getRampFactor(venue: Venue, absoluteMonth: number): number {
  const rampMonths = venue.rampMonths ?? 2;
  const monthsActive = absoluteMonth - venue.startMonth;
  if (monthsActive >= rampMonths) return 1.0;
  return 0.50 + (0.50 * monthsActive) / rampMonths;
}

function getYearIndex(absoluteMonth: number): number {
  return Math.floor((absoluteMonth - 1) / 12) + 1;
}

function applySplit(
  venue: Venue,
  grossRevenue: number,
  absoluteMonth: number,
  forceSplit?: 'A' | 'B'
): { hqGross: number; venueGross: number; ookaGross: number } {
  const split = forceSplit ?? venue.splitStructure;
  if (split === 'A') {
    return { hqGross: grossRevenue * 0.80, venueGross: grossRevenue * 0.20, ookaGross: 0 };
  }
  const inPayoff = (absoluteMonth - venue.startMonth) < 2;
  return {
    hqGross: grossRevenue * 0.50,
    venueGross: grossRevenue * (inPayoff ? 0.25 : 0.375),
    ookaGross: grossRevenue * (inPayoff ? 0.25 : 0.125),
  };
}

export function computeVenueMonth(
  venue: Venue,
  absoluteMonth: number,
  scenario: Scenario,
  priceOverrides?: PriceOverrides,
  forceSplit?: 'A' | 'B'
): MonthResult {
  const calendarMonth = getCalendarMonth(scenario, absoluteMonth);
  const isClosed = venue.closedMonths?.includes(calendarMonth) ?? false;

  if (absoluteMonth < venue.startMonth || isClosed) {
    return { month: absoluteMonth, venueId: venue.id, firstBowls: 0, refills: 0, grossRevenue: 0, cogs: 0, grossProfit: 0, hqGross: 0, venueGross: 0, ookaGross: 0, hqNet: 0 };
  }

  const yearIndex = getYearIndex(absoluteMonth);
  const yearFactor = 1 + scenario.annualGrowthRate * (yearIndex - 1);
  const priceFactor = 1 + scenario.annualPriceInflation * (yearIndex - 1);
  const seasonalMult = getSeasonalMultiplier(scenario, absoluteMonth);
  const rampFactor = getRampFactor(venue, absoluteMonth);
  const operatingDaysRatio = venue.operatingDaysPerWeek / 7;
  const volumeMult = priceOverrides?.volumeMultiplier ?? 1.0;

  const firstBowls = venue.baselineBowlsPerMonth * operatingDaysRatio * rampFactor * yearFactor * seasonalMult * volumeMult;
  const refills = firstBowls * venue.revenueModel.refillAttachmentRate;

  const firstBowlPrice = priceOverrides?.firstBowlPrice ?? venue.revenueModel.firstBowlPrice;
  const refillPrice = priceOverrides?.refillPrice ?? venue.revenueModel.refillPrice;

  const grossRevenue = (firstBowls * firstBowlPrice + refills * refillPrice) * venue.priceMultiplier * priceFactor;
  const cogs = (firstBowls + refills) * (scenario.podCostPerBowl + scenario.consumablesPerBowl);
  const grossProfit = grossRevenue - cogs;

  const { hqGross, venueGross, ookaGross } = applySplit(venue, grossRevenue, absoluteMonth, forceSplit);
  const hqNet = hqGross - cogs;

  return { month: absoluteMonth, venueId: venue.id, firstBowls, refills, grossRevenue, cogs, grossProfit, hqGross, venueGross, ookaGross, hqNet };
}

export function computeVenueYear(
  venue: Venue,
  year: number,
  scenario: Scenario,
  priceOverrides?: PriceOverrides,
  forceSplit?: 'A' | 'B'
): YearResult {
  const startMonth = (year - 1) * 12 + 1;
  const endMonth = year * 12;
  const months: MonthResult[] = [];
  for (let m = startMonth; m <= endMonth; m++) {
    months.push(computeVenueMonth(venue, m, scenario, priceOverrides, forceSplit));
  }
  const sum = months.reduce(
    (acc, m) => ({ firstBowls: acc.firstBowls + m.firstBowls, refills: acc.refills + m.refills, grossRevenue: acc.grossRevenue + m.grossRevenue, cogs: acc.cogs + m.cogs, grossProfit: acc.grossProfit + m.grossProfit, hqGross: acc.hqGross + m.hqGross, venueGross: acc.venueGross + m.venueGross, ookaGross: acc.ookaGross + m.ookaGross, hqNet: acc.hqNet + m.hqNet }),
    { firstBowls: 0, refills: 0, grossRevenue: 0, cogs: 0, grossProfit: 0, hqGross: 0, venueGross: 0, ookaGross: 0, hqNet: 0 }
  );
  return { year, venueId: venue.id, months, ...sum };
}

export function computeScenarioRollup(
  scenario: Scenario,
  priceOverrides?: PriceOverrides,
  forceSplit?: 'A' | 'B'
): ScenarioRollup {
  const months: RollupMonth[] = [];
  for (let m = 1; m <= scenario.forecastHorizonMonths; m++) {
    const byVenue = scenario.venues.map((v) => computeVenueMonth(v, m, scenario, priceOverrides, forceSplit));
    const sum = byVenue.reduce(
      (acc, r) => ({ firstBowls: acc.firstBowls + r.firstBowls, refills: acc.refills + r.refills, grossRevenue: acc.grossRevenue + r.grossRevenue, cogs: acc.cogs + r.cogs, grossProfit: acc.grossProfit + r.grossProfit, hqGross: acc.hqGross + r.hqGross, venueGross: acc.venueGross + r.venueGross, ookaGross: acc.ookaGross + r.ookaGross, hqNet: acc.hqNet + r.hqNet }),
      { firstBowls: 0, refills: 0, grossRevenue: 0, cogs: 0, grossProfit: 0, hqGross: 0, venueGross: 0, ookaGross: 0, hqNet: 0 }
    );
    months.push({ month: m, byVenue, ...sum });
  }

  const numYears = Math.ceil(scenario.forecastHorizonMonths / 12);
  const years: RollupYear[] = [];
  for (let y = 1; y <= numYears; y++) {
    const startM = (y - 1) * 12 + 1;
    const endM = Math.min(y * 12, scenario.forecastHorizonMonths);
    const slice = months.filter((m) => m.month >= startM && m.month <= endM);
    const sum = slice.reduce(
      (acc, m) => ({ firstBowls: acc.firstBowls + m.firstBowls, refills: acc.refills + m.refills, grossRevenue: acc.grossRevenue + m.grossRevenue, cogs: acc.cogs + m.cogs, grossProfit: acc.grossProfit + m.grossProfit, hqGross: acc.hqGross + m.hqGross, venueGross: acc.venueGross + m.venueGross, ookaGross: acc.ookaGross + m.ookaGross, hqNet: acc.hqNet + m.hqNet }),
      { firstBowls: 0, refills: 0, grossRevenue: 0, cogs: 0, grossProfit: 0, hqGross: 0, venueGross: 0, ookaGross: 0, hqNet: 0 }
    );
    years.push({ year: y, ...sum });
  }
  return { months, years };
}

export function absoluteMonthToLabel(forecastStartDate: string, absoluteMonth: number): string {
  const [year, month] = forecastStartDate.split('-').map(Number);
  const totalMonths = (year * 12 + month - 1) + (absoluteMonth - 1);
  const y = Math.floor(totalMonths / 12);
  const m = (totalMonths % 12) + 1;
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short', year: '2-digit' });
}

export function computeSplitComparison(
  scenario: Scenario,
  priceOverrides?: PriceOverrides
): SplitComparison {
  const splitA = computeScenarioRollup(scenario, priceOverrides, 'A');
  const splitB = computeScenarioRollup(scenario, priceOverrides, 'B');
  const aY1 = splitA.years[0]?.hqNet ?? 0;
  const bY1 = splitB.years[0]?.hqNet ?? 0;
  const aTotal = splitA.years.reduce((s, y) => s + y.hqNet, 0);
  const bTotal = splitB.years.reduce((s, y) => s + y.hqNet, 0);
  return { splitA, splitB, delta: { hqNetY1: bY1 - aY1, hqNetTotal: bTotal - aTotal } };
}
