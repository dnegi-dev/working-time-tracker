import { addDays, eachDay, weekday } from './time.ts';
import type { Dataset, ISODate } from './types.ts';

/** Target minutes for a date: 0 on holidays and marked days (vacation, sick, holiday). */
export function dayTarget(ds: Dataset, date: ISODate, holidays: ReadonlySet<ISODate>): number {
  if (holidays.has(date) || ds.dayMarks.some((m) => m.date === date)) return 0;
  return ds.settings.targetMinutesPerWeekday[weekday(date)] ?? 0;
}

export function workdays(
  ds: Dataset,
  from: ISODate,
  to: ISODate,
  holidays: ReadonlySet<ISODate>,
): ISODate[] {
  return eachDay(from, to).filter((d) => dayTarget(ds, d, holidays) > 0);
}

/** Weekdays that normally have a target (e.g. 5 for Mon–Fri). */
export function workWeekLength(ds: Dataset): number {
  return ds.settings.targetMinutesPerWeekday.filter((m) => m > 0).length || 5;
}

/** First holiday from today up to `maxDays` ahead. */
export function upcomingHoliday(
  names: ReadonlyMap<ISODate, string>,
  today: ISODate,
  maxDays = 3,
): { date: ISODate; name: string; inDays: number } | undefined {
  for (let inDays = 0; inDays <= maxDays; inDays++) {
    const date = addDays(today, inDays);
    const name = names.get(date);
    if (name !== undefined) return { date, name, inDays };
  }
  return undefined;
}
