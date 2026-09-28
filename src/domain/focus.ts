import { runningEntry } from './entries.ts';
import { minutesBetween } from './time.ts';
import type { Dataset, Instant } from './types.ts';

export interface Focus {
  start: Instant;
  elapsed: number;
  /** Share of the focus round done, capped at 1. */
  ratio: number;
  full: boolean;
}

/** Start of the unbroken run of entries (back to back, no gap) that ends in the running one. */
export function streakStart(ds: Dataset): Instant | undefined {
  const run = runningEntry(ds);
  if (!run) return undefined;
  const byEnd = new Map(ds.entries.filter((e) => e.end).map((e) => [e.end, e]));
  let start = run.start;
  for (let prev = byEnd.get(start); prev && prev.start < start; prev = byEnd.get(start)) {
    start = prev.start;
  }
  return start;
}

/** Progress of the current focus round; a break taken after the streak began restarts it. */
export function focusProgress(
  ds: Dataset,
  now: Instant,
  lastBreakEnd?: Instant,
): Focus | undefined {
  const streak = streakStart(ds);
  if (!streak) return undefined;
  const start =
    lastBreakEnd && lastBreakEnd > streak && lastBreakEnd <= now ? lastBreakEnd : streak;
  const elapsed = minutesBetween(start, now);
  const total = ds.settings.focusMinutes;
  const ratio = total > 0 ? Math.min(1, elapsed / total) : 0;
  return { start, elapsed, ratio, full: total > 0 && elapsed >= total };
}
