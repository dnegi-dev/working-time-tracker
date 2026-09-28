import { addDays, dateOf, parseISODate } from './time.ts';
import { runningEntry } from './entries.ts';
import type { Current, Dataset, Instant, Mode, Source, TimeEntry } from './types.ts';

export interface StartOptions {
  projectId?: string;
  placeId?: string;
  mode?: Mode;
  source: Source;
}

/** Resolve the mode for a place (a place's mode wins over an explicit mode). */
export function modeFor(ds: Dataset, placeId: string | undefined, fallback: Mode): Mode {
  return ds.places.find((p) => p.id === placeId)?.mode ?? fallback;
}

/** Keep the current place if it fits the mode, else the first place with that mode. */
export function placeForMode(ds: Dataset, mode: Mode): string | undefined {
  const cur = ds.places.find((p) => p.id === ds.current.placeId);
  if (cur?.mode === mode) return cur.id;
  return ds.places.find((p) => p.mode === mode)?.id;
}

export function startEntry(ds: Dataset, opts: StartOptions, now: Instant, id: string): Dataset {
  if (runningEntry(ds)) return ds;
  const placeId = opts.placeId ?? (opts.mode ? placeForMode(ds, opts.mode) : ds.current.placeId);
  const current: Current = {
    projectId: opts.projectId ?? ds.current.projectId,
    placeId,
    mode: modeFor(ds, opts.placeId, opts.mode ?? ds.current.mode),
  };
  const entry: TimeEntry = { id, start: now, ...current, source: opts.source };
  return { ...ds, current, entries: [...ds.entries, entry] };
}

export function stopEntry(ds: Dataset, now: Instant): Dataset {
  const run = runningEntry(ds);
  if (!run) return ds;
  return { ...ds, entries: ds.entries.map((e) => (e === run ? { ...e, end: now } : e)) };
}

/** Close the running entry and continue with changed fields in a new one. */
function splitRunning(
  ds: Dataset,
  patch: Partial<Current>,
  now: Instant,
  id: string,
  source: Source,
): Dataset {
  const run = runningEntry(ds);
  const current = { ...ds.current, ...patch };
  if (!run) return { ...ds, current };
  if (run.start === now) {
    return { ...ds, current, entries: ds.entries.map((e) => (e === run ? { ...e, ...patch } : e)) };
  }
  const stopped = stopEntry(ds, now);
  const next: TimeEntry = { ...run, ...patch, id, start: now, source };
  delete next.end;
  return { ...stopped, current, entries: [...stopped.entries, next] };
}

export function switchProject(
  ds: Dataset,
  projectId: string | undefined,
  now: Instant,
  id: string,
  source: Source,
): Dataset {
  return splitRunning(ds, { projectId }, now, id, source);
}

/**
 * Switch place and/or office-home mode. With `multiPlacePerDay` the running entry is split;
 * otherwise all of today's entries are rewritten to the new location.
 */
export function switchLocation(
  ds: Dataset,
  loc: { placeId?: string; mode: Mode },
  now: Instant,
  id: string,
  source: Source,
): Dataset {
  const patch = { placeId: loc.placeId, mode: loc.mode };
  if (ds.settings.multiPlacePerDay) return splitRunning(ds, patch, now, id, source);
  const today = dateOf(now);
  return {
    ...ds,
    current: { ...ds.current, ...patch },
    entries: ds.entries.map((e) => (dateOf(e.start) === today ? { ...e, ...patch } : e)),
  };
}

export function switchPlace(
  ds: Dataset,
  placeId: string,
  now: Instant,
  id: string,
  source: Source,
) {
  return switchLocation(
    ds,
    { placeId, mode: modeFor(ds, placeId, ds.current.mode) },
    now,
    id,
    source,
  );
}

/** Split a running entry at each local midnight it crossed, so every day gets its own time. */
export function splitAtMidnight(ds: Dataset, now: Instant, newId: () => string): Dataset {
  let out = ds;
  for (
    let run = runningEntry(out);
    run && dateOf(run.start) < dateOf(now);
    run = runningEntry(out)
  ) {
    const midnight = parseISODate(addDays(dateOf(run.start), 1)).toISOString();
    const stopped = stopEntry(out, midnight);
    const next: TimeEntry = { ...run, id: newId(), start: midnight };
    out = { ...stopped, entries: [...stopped.entries, next] };
  }
  return out;
}
