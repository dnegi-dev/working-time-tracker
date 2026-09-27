import { dateOf, minutesBetween } from './time.ts';
import type { BreakRule, Dataset, ISODate, Instant, TimeEntry } from './types.ts';

export function runningEntry(ds: Dataset): TimeEntry | undefined {
  return ds.entries.find((e) => !e.end);
}

export function entriesOn(ds: Dataset, date: ISODate): TimeEntry[] {
  return ds.entries
    .filter((e) => dateOf(e.start) === date)
    .sort((a, b) => a.start.localeCompare(b.start));
}

export function entryMinutes(e: TimeEntry, now: Instant): number {
  return minutesBetween(e.start, e.end ?? now);
}

/** Sum of gaps between consecutive entries that are long enough to count as a break. */
export function gapBreakMinutes(sorted: TimeEntry[], now: Instant, minGap = 15): number {
  let total = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (!prev || !cur) continue;
    const gap = minutesBetween(prev.end ?? now, cur.start);
    if (gap >= minGap) total += gap;
  }
  return total;
}

/** Break still to deduct, given the rule and breaks already taken as gaps. */
export function breakDeduction(gross: number, taken: number, rule: BreakRule): number {
  if (!rule.enabled) return 0;
  const required = gross > 9 * 60 ? rule.after9h : gross > 6 * 60 ? rule.after6h : 0;
  return Math.min(gross, Math.max(0, required - taken));
}

export function netMinutes(sorted: TimeEntry[], rule: BreakRule, now: Instant): number {
  const gross = sorted.reduce((sum, e) => sum + entryMinutes(e, now), 0);
  return gross - breakDeduction(gross, gapBreakMinutes(sorted, now), rule);
}

export function workedOn(ds: Dataset, date: ISODate, now: Instant): number {
  return netMinutes(entriesOn(ds, date), ds.settings.breakRule, now);
}
