export const ownerTimeZone = () => process.env.CULLR_TIME_ZONE ?? 'America/Toronto';

function offsetAt(timeZone: string, instant: number): number {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const local = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return local - Math.floor(instant / 1000) * 1000;
}

// The instant at which the given calendar day (month is 0-based, overflow rolls over) starts in the zone.
export function startOfLocalDay(timeZone: string, year: number, month: number, day: number): number {
  const naive = Date.UTC(year, month, day);
  const guess = naive - offsetAt(timeZone, naive);
  return naive - offsetAt(timeZone, guess);
}

export function localDate(timeZone: string, instant: number): { year: number; month: number; day: number } {
  const [year, month, day] = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(instant))
    .split('-')
    .map(Number);
  return { year, month: month - 1, day };
}
