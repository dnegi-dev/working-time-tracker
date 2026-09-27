import { workWeekLength, workdays } from './calendar.ts';
import { dateOf, periodRange } from './time.ts';
import type { Dataset, ISODate, Period } from './types.ts';

export interface QuotaStatus {
  workdays: number;
  required: number;
  done: number;
  /** Office days still needed (never negative). */
  needed: number;
  /** Workdays from today on that are not yet office days. */
  daysLeft: number;
  reachable: boolean;
}

export function officeDays(ds: Dataset, from: ISODate, to: ISODate): Set<ISODate> {
  const out = new Set<ISODate>();
  for (const e of ds.entries) {
    const d = dateOf(e.start);
    if (e.mode === 'office' && d >= from && d <= to) out.add(d);
  }
  return out;
}

export function requiredOfficeDays(ds: Dataset, workdayCount: number): number {
  const q = ds.settings.quota;
  if (q.kind === 'officeDaysPerWeek') {
    return Math.ceil((workdayCount * q.value) / workWeekLength(ds));
  }
  return Math.ceil(workdayCount * (1 - q.value / 100));
}

export function quotaStatus(
  ds: Dataset,
  period: Extract<Period, 'week' | 'month' | 'year'>,
  today: ISODate,
  holidays: ReadonlySet<ISODate>,
): QuotaStatus {
  const { from, to } = periodRange(period, today);
  const days = workdays(ds, from, to, holidays);
  const office = officeDays(ds, from, to);
  const required = requiredOfficeDays(ds, days.length);
  const done = office.size;
  const needed = Math.max(0, required - done);
  const daysLeft = days.filter((d) => d >= today && !office.has(d)).length;
  return { workdays: days.length, required, done, needed, daysLeft, reachable: needed <= daysLeft };
}
