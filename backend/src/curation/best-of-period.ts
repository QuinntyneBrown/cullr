import { localDate, ownerTimeZone, startOfLocalDay } from '../ideas/time-zone';

export const PERIODS = ['today', 'week', 'month', 'year'] as const;
export type BestOfPeriod = (typeof PERIODS)[number];

export const PERIOD_CAPACITY = 5;

// The instant the period containing `now` began; an entry curated before it has lapsed.
export function periodStart(period: BestOfPeriod, now: number): number {
  const zone = ownerTimeZone();
  const { year, month, day } = localDate(zone, now);
  switch (period) {
    case 'today':
      return startOfLocalDay(zone, year, month, day);
    case 'week': {
      const weekday = new Date(Date.UTC(year, month, day)).getUTCDay();
      return startOfLocalDay(zone, year, month, day - ((weekday + 6) % 7));
    }
    case 'month':
      return startOfLocalDay(zone, year, month, 1);
    case 'year':
      return startOfLocalDay(zone, year, 0, 1);
  }
}

export const isPeriod = (value: unknown): value is BestOfPeriod => PERIODS.includes(value as BestOfPeriod);
