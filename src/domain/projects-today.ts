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

/** Active projects, most recently used first; never-used ones keep their order at the end. */
export function recentProjectIds(ds: Dataset): string[] {
  const last = new Map<string, Instant>();
  for (const e of ds.entries) {
    const seen = e.projectId && last.get(e.projectId);
    if (e.projectId && (!seen || e.start > seen)) last.set(e.projectId, e.start);
  }
  return ds.projects
    .filter((p) => !p.archived)
    .map((p) => p.id)
    .sort((a, b) => (last.get(b) ?? '').localeCompare(last.get(a) ?? ''));
}
