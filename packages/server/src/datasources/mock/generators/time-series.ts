/**
 * Time-Series Mock Data Generator
 *
 * Generates realistic daily metrics that:
 * 1. Follow a ramp-up curve (days 1-3 lower, then steady state)
 * 2. Have weekday/weekend variation (weekdays +15%)
 * 3. Include random noise (+/- 10-15%)
 * 4. Cumulative totals hit campaign targets (+/- 5%)
 */

export interface TimeSeriesConfig {
  startDate: string;
  endDate: string;
  targetTotal: number;
  avgCTR: number;
  avgCPC: number;
  conversionRate?: number;
}

export interface GeneratedDayData {
  date: string;
  impressions: number;
  clicks: number;
  visits: number;
  conversions: number;
  cost: number;
  ctr: number;
  cpc: number;
  conversionRate: number;
}

// Seeded random for reproducibility
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Gaussian noise using Box-Muller transform
function gaussianNoise(rand: () => number, mean: number, stddev: number): number {
  const u1 = rand();
  const u2 = rand();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stddev;
}

function getDaysBetween(start: string, end: string): string[] {
  const days: string[] = [];
  const current = new Date(start);
  const endDate = new Date(end);

  while (current <= endDate) {
    days.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr).getDay(); // 0=Sun, 6=Sat
}

function getRampMultiplier(dayIndex: number): number {
  if (dayIndex === 0) return 0.4;
  if (dayIndex === 1) return 0.7;
  if (dayIndex === 2) return 0.9;
  return 1.0;
}

function getWeekdayMultiplier(dayOfWeek: number): number {
  // Weekend = lower traffic
  if (dayOfWeek === 0 || dayOfWeek === 6) return 0.75;
  // Friday slightly lower
  if (dayOfWeek === 5) return 0.9;
  // Mon-Thu normal
  return 1.0;
}

export function generateTimeSeries(config: TimeSeriesConfig, seed = 42): GeneratedDayData[] {
  const { startDate, endDate, targetTotal, avgCTR, avgCPC, conversionRate = 0.025 } = config;
  const rand = seededRandom(seed);
  const days = getDaysBetween(startDate, endDate);
  const numDays = days.length;

  if (numDays === 0) return [];

  // Calculate base daily target (before adjustments)
  // First pass: compute raw weights for each day
  const rawWeights = days.map((day, i) => {
    const ramp = getRampMultiplier(i);
    const weekday = getWeekdayMultiplier(getDayOfWeek(day));
    return ramp * weekday;
  });

  const totalWeight = rawWeights.reduce((a, b) => a + b, 0);

  // Second pass: distribute target across days proportionally
  const dailyTargets = rawWeights.map(w => (w / totalWeight) * targetTotal);

  // Third pass: add noise and generate full metrics
  const result: GeneratedDayData[] = days.map((day, i) => {
    // Add gaussian noise (+/- 12%)
    const noiseFactor = gaussianNoise(rand, 1.0, 0.12);
    const clicks = Math.max(1, Math.round(dailyTargets[i] * Math.max(0.5, noiseFactor)));

    // Derive other metrics from clicks
    const ctr = avgCTR * gaussianNoise(rand, 1.0, 0.08);
    const actualCTR = Math.max(0.005, Math.min(0.15, ctr));
    const impressions = Math.round(clicks / actualCTR);

    const cpc = avgCPC * gaussianNoise(rand, 1.0, 0.1);
    const actualCPC = Math.max(100, cpc);
    const cost = Math.round(clicks * actualCPC);

    const actualConvRate = conversionRate * gaussianNoise(rand, 1.0, 0.15);
    const conversions = Math.max(0, Math.round(clicks * Math.max(0.005, actualConvRate)));

    // Visits = clicks for search ads, slightly different for other channels
    const visits = Math.round(clicks * gaussianNoise(rand, 0.92, 0.03));

    return {
      date: day,
      impressions,
      clicks,
      visits: Math.max(0, visits),
      conversions,
      cost,
      ctr: parseFloat(actualCTR.toFixed(4)),
      cpc: Math.round(actualCPC),
      conversionRate: parseFloat(Math.max(0, actualConvRate).toFixed(4)),
    };
  });

  // Normalize: adjust clicks so total matches target (+/- 3%)
  const actualTotal = result.reduce((sum, d) => sum + d.clicks, 0);
  const adjustmentFactor = targetTotal / actualTotal;

  if (Math.abs(adjustmentFactor - 1) > 0.03) {
    for (const day of result) {
      day.clicks = Math.max(1, Math.round(day.clicks * adjustmentFactor));
      day.impressions = Math.round(day.clicks / day.ctr);
      day.cost = Math.round(day.clicks * day.cpc);
      day.visits = Math.round(day.clicks * 0.92);
      day.conversions = Math.max(0, Math.round(day.clicks * day.conversionRate));
    }
  }

  return result;
}

/**
 * Generate time series up to "today" (simulating live campaign)
 * Future dates return null (data not yet available)
 */
export function generateTimeSeriesUpToToday(config: TimeSeriesConfig, seed = 42): GeneratedDayData[] {
  const allData = generateTimeSeries(config, seed);
  const today = new Date().toISOString().split('T')[0];
  return allData.filter(d => d.date <= today);
}
