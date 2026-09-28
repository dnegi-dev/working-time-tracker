import { runningEntry } from './entries.ts';
import { streakStart } from './focus.ts';
import { startEntry, stopEntry, switchProject } from './tracking.ts';
import type { Dataset, Instant, Source, TimeEntry } from './types.ts';

/** Where the time of a bubble break goes: project before, project after, or nowhere (a real pause). */
export type BreakCounts = 'before' | 'after' | 'pause';

/** A regular pause stops the workday; otherwise the project simply keeps running. */
export function startBreak(ds: Dataset, now: Instant): Dataset {
  return ds.settings.breakCounts === 'pause' ? stopEntry(ds, now) : ds;
}

/** End a break taken at `since` by continuing with `projectId`, attributing the break per setting. */
export function endBreak(
  ds: Dataset,
  since: Instant,
  projectId: string,
  now: Instant,
  id: string,
  source: Source,
): Dataset {
  const run = runningEntry(ds);
  if (!run) return startEntry(ds, { projectId, source }, now, id);
  if (run.projectId === projectId) return ds;
  const at = ds.settings.breakCounts === 'after' ? (run.start > since ? run.start : since) : now;
  return switchProject(ds, projectId, at, id, source);
}

/** Whether a break taken at `since` is still going (not ended by a restart or a stop). */
export function breakActive(ds: Dataset, since: Instant | undefined): boolean {
  if (!since) return false;
  const streak = streakStart(ds);
  if (streak) return since >= streak;
  const last = ds.entries.reduce<TimeEntry | undefined>(
    (a, e) => (!a || e.start > a.start ? e : a),
    undefined,
  );
  return last?.end === since;
}

/** During a regular pause, make the queued project the one the workday resumes with. */
export function queueNext(ds: Dataset, projectId: string): Dataset {
  return runningEntry(ds) ? ds : { ...ds, current: { ...ds.current, projectId } };
}
