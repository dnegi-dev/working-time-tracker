import { runningEntry, entryMinutes } from './entries.ts';
import { dateOf } from './time.ts';
import type { Dataset, ISODate, Instant } from './types.ts';

/** Minutes per project for entries starting between `from` and `to` (inclusive). */
export function projectMinutesBetween(
  ds: Dataset,
  from: ISODate,
  to: ISODate,
  now: Instant,
): Map<string, number> {
  const sums = new Map<string, number>();
  for (const e of ds.entries) {
    const d = dateOf(e.start);
    if (e.projectId && d >= from && d <= to)
      sums.set(e.projectId, (sums.get(e.projectId) ?? 0) + entryMinutes(e, now));
  }
  return sums;
}

/** Whether a project can be archived right now: not while its time is running. */
export function canArchive(ds: Dataset, id: string): boolean {
  return runningEntry(ds)?.projectId !== id;
}

/**
 * Archive or restore a project. Archiving the current project clears it;
 * a project whose time is running stays untouched.
 */
export function setArchived(ds: Dataset, id: string, archived: boolean): Dataset {
  if (archived && !canArchive(ds, id)) return ds;
  const projects = ds.projects.map((p) => (p.id === id ? { ...p, archived } : p));
  const clear = archived && ds.current.projectId === id;
  return { ...ds, projects, current: clear ? { ...ds.current, projectId: undefined } : ds.current };
}
