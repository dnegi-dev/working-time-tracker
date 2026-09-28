import { entriesOn, entryMinutes } from './entries.ts';
import type { Dataset, ISODate, Instant } from './types.ts';

/** Minutes tracked on a project (or no project) on a given day. */
export function projectMinutesOn(
  ds: Dataset,
  date: ISODate,
  projectId: string | undefined,
  now: Instant,
): number {
  return entriesOn(ds, date)
    .filter((e) => e.projectId === projectId)
    .reduce((sum, e) => sum + entryMinutes(e, now), 0);
}

/** The active project worked on most recently before the current one. */
export function previousProjectId(ds: Dataset): string | undefined {
  const active = new Set(ds.projects.filter((p) => !p.archived).map((p) => p.id));
  const latest = [...ds.entries]
    .sort((a, b) => b.start.localeCompare(a.start))
    .find((e) => e.projectId !== ds.current.projectId && active.has(e.projectId ?? ''));
  return latest?.projectId;
}
