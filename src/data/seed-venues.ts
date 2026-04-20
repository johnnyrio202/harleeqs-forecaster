import type { Venue } from '@/types/forecast';

// Month 1 = May 2026 (forecastStartDate: '2026-05')
export const SEED_VENUES: Venue[] = [
  {
    id: 'ghostbar',
    name: 'Ghostbar at the Palms',
    status: 'operating',
    startMonth: 1,          // May 2026
    rampMonths: 6,          // linear ramp May→Oct 2026, full capacity from Nov
    operatingDaysPerWeek: 4,
    unitsDeployed: 8,
    baselineBowlsPerMonth: 380,
    revenueModel: { firstBowlPrice: 75, refillPrice: 52.50, refillAttachmentRate: 0.086 },
    splitStructure: 'A',
    priceMultiplier: 1.00,
    notes: 'Rooftop venue; first HaaS deployment; T&Cs signed. Cold season (Nov–Feb) at 50% via seasonality.',
  },
  {
    id: 'palms-pool',
    name: 'Palms Pool',
    status: 'launching',
    startMonth: 11,         // March 2027
    rampMonths: 2,
    operatingDaysPerWeek: 6,
    unitsDeployed: 6,
    baselineBowlsPerMonth: 300,
    revenueModel: { firstBowlPrice: 75, refillPrice: 52.50, refillAttachmentRate: 0.086 },
    splitStructure: 'A',
    priceMultiplier: 1.00,
    closedMonths: [11, 12, 1, 2], // Pool closed Nov–Feb every year
    notes: 'Outdoor pool venue; seasonal operation Mar–Oct only.',
  },
  {
    id: 'venue-3',
    name: 'Venue 3 (TBD)',
    status: 'pipeline',
    startMonth: 25,         // Beyond 24-month horizon — no revenue in forecast
    rampMonths: 2,
    operatingDaysPerWeek: 5,
    unitsDeployed: 6,
    baselineBowlsPerMonth: 350,
    revenueModel: { firstBowlPrice: 75, refillPrice: 52.50, refillAttachmentRate: 0.086 },
    splitStructure: 'A',
    priceMultiplier: 1.00,
  },
  {
    id: 'venue-4',
    name: 'Venue 4 (TBD)',
    status: 'pipeline',
    startMonth: 25,
    rampMonths: 2,
    operatingDaysPerWeek: 5,
    unitsDeployed: 8,
    baselineBowlsPerMonth: 400,
    revenueModel: { firstBowlPrice: 75, refillPrice: 52.50, refillAttachmentRate: 0.086 },
    splitStructure: 'A',
    priceMultiplier: 1.00,
  },
];
