export type RevenueModel = {
  firstBowlPrice: number;
  refillPrice: number;
  refillAttachmentRate: number;
};

export type VenueStatus = 'operating' | 'launching' | 'pipeline' | 'on-hold';

export type SplitId = 'A' | 'B';

export type Venue = {
  id: string;
  name: string;
  status: VenueStatus;
  startMonth: number;
  operatingDaysPerWeek: number;
  unitsDeployed: number;
  baselineBowlsPerMonth: number;
  revenueModel: RevenueModel;
  splitStructure: SplitId;
  priceMultiplier: number;
  notes?: string;
};

export type SplitStructure = {
  id: SplitId;
  label: string;
  hqShare: number;
  venueShare: number;
  ookaShare: number;
  description: string;
};

export type Seasonality = {
  month: number;
  multiplier: number;
};

export type Scenario = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  venues: Venue[];
  seasonality: Seasonality[];
  podCostPerBowl: number;
  consumablesPerBowl: number;
  annualGrowthRate: number;
  annualPriceInflation: number;
  forecastHorizonMonths: number;
  notes?: string;
};

export type ActualMonth = {
  id: string;
  venueId: string;
  month: string;
  firstBowls: number;
  refills: number;
  grossRevenue: number;
  notes?: string;
};

export type MonthResult = {
  month: number;
  venueId: string;
  firstBowls: number;
  refills: number;
  grossRevenue: number;
  cogs: number;
  grossProfit: number;
  hqGross: number;
  venueGross: number;
  ookaGross: number;
  hqNet: number;
};

export type YearResult = {
  year: number;
  venueId: string;
  months: MonthResult[];
  firstBowls: number;
  refills: number;
  grossRevenue: number;
  cogs: number;
  grossProfit: number;
  hqGross: number;
  venueGross: number;
  ookaGross: number;
  hqNet: number;
};

export type ScenarioRollup = {
  months: RollupMonth[];
  years: RollupYear[];
};

export type RollupMonth = {
  month: number;
  byVenue: MonthResult[];
  firstBowls: number;
  refills: number;
  grossRevenue: number;
  cogs: number;
  grossProfit: number;
  hqGross: number;
  venueGross: number;
  ookaGross: number;
  hqNet: number;
};

export type RollupYear = {
  year: number;
  firstBowls: number;
  refills: number;
  grossRevenue: number;
  cogs: number;
  grossProfit: number;
  hqGross: number;
  venueGross: number;
  ookaGross: number;
  hqNet: number;
};

export type SplitComparison = {
  splitA: ScenarioRollup;
  splitB: ScenarioRollup;
  delta: {
    hqNetY1: number;
    hqNetTotal: number;
  };
};

export type SplitMode = 'A' | 'B' | 'compare';

export type DashboardViewState = {
  splitMode: SplitMode;
  firstBowlPrice: number;
  refillPrice: number;
};
