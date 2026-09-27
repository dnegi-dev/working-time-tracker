import type { ISODate, Instant, Period } from './types.ts';

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISODate(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function dateOf(instant: Instant): ISODate {
  return toISODate(new Date(instant));
}

export function addDays(s: ISODate, n: number): ISODate {
  const d = parseISODate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** 0 = Monday … 6 = Sunday. */
export function weekday(s: ISODate): number {
  return (parseISODate(s).getDay() + 6) % 7;
}

export function minutesBetween(a: Instant, b: Instant): number {
  return Math.max(0, Math.round((Date.parse(b) - Date.parse(a)) / 60_000));
}

export function periodRange(period: Period, ref: ISODate): { from: ISODate; to: ISODate } {
  const d = parseISODate(ref);
  switch (period) {
    case 'day':
      return { from: ref, to: ref };
    case 'week': {
      const from = addDays(ref, -weekday(ref));
      return { from, to: addDays(from, 6) };
    }
    case 'month':
      return {
        from: toISODate(new Date(d.getFullYear(), d.getMonth(), 1)),
        to: toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
      };
    case 'year':
      return { from: `${d.getFullYear()}-01-01`, to: `${d.getFullYear()}-12-31` };
  }
}

export function eachDay(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

export function formatMinutes(min: number): string {
  const sign = min < 0 ? '-' : '';
  const abs = Math.abs(Math.round(min));
  return `${sign}${Math.floor(abs / 60)}:${pad(abs % 60)}`;
}
