import {
  breakDeduction,
  entriesOn,
  entryMinutes,
  gapBreakMinutes,
  runningEntry,
} from './entries.ts';
import { addDays, dateOf, parseISODate } from './time.ts';
import { startEntry, stopEntry } from './tracking.ts';
import type { Dataset, Instant, Source } from './types.ts';

/** Stop for lunch; the gap until `endLunch` counts as a taken break, not project time. */
export function startLunch(ds: Dataset, now: Instant): Dataset {
  if (!runningEntry(ds)) return ds;
  const stopped = stopEntry(ds, now);
  return { ...stopped, current: { ...stopped.current, lunchSince: now } };
}

export function lunchActive(ds: Dataset, now: Instant): boolean {
  const since = ds.current.lunchSince;
  return !!since && !runningEntry(ds) && dateOf(since) === dateOf(now);
}

/** Continue with the current project, place and mode; `startEntry` drops `lunchSince`. */
export function endLunch(ds: Dataset, now: Instant, id: string, source: Source): Dataset {
  return startEntry(ds, { source }, now, id);
}

/** Legal break minutes still missing today if the running entry ended at `now` (0 if rule off). */
export function missingBreak(ds: Dataset, now: Instant): number {
  const rule = ds.settings.breakRule;
  if (!rule.enabled || !runningEntry(ds)) return 0;
  const sorted = entriesOn(ds, dateOf(now));
  const gross = sorted.reduce((sum, e) => sum + entryMinutes(e, now), 0);
  const taken = gapBreakMinutes(sorted, now);
  const m1 = breakDeduction(gross, taken, rule);
  return breakDeduction(gross + m1, taken, rule);
}

/**
 * Stop, but end the running entry after the still-missing legal break, so today's worked
 * time stays what it was at `now`. Clamped to the next local midnight.
 */
export function stopWithLegalBreak(ds: Dataset, now: Instant): Dataset {
  const midnight = parseISODate(addDays(dateOf(now), 1)).getTime();
  const end = Math.min(Date.parse(now) + missingBreak(ds, now) * 60_000, midnight);
  return stopEntry(ds, new Date(end).toISOString());
}
