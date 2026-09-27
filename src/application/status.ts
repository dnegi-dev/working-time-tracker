import {
  balance,
  dateOf,
  runningEntry,
  type Dataset,
  type ISODate,
  type Place,
  type Project,
} from '../domain/index.ts';

export function findProject(ds: Dataset, ref: string | undefined): Project | undefined {
  if (!ref) return undefined;
  const r = ref.trim().toLowerCase();
  return ds.projects.find((p) => p.id === ref || p.name.toLowerCase() === r);
}

export function placeLabel(p: Place): string {
  return p.room ? `${p.building} / ${p.room}` : p.building;
}

export function findPlace(ds: Dataset, ref: string | undefined): Place | undefined {
  if (!ref) return undefined;
  const r = ref
    .trim()
    .toLowerCase()
    .replace(/\s*\/\s*/g, '/');
  return ds.places.find(
    (p) =>
      p.id === ref ||
      placeLabel(p)
        .toLowerCase()
        .replace(/\s*\/\s*/g, '/') === r,
  );
}

export interface Status {
  running: boolean;
  since?: string;
  project?: string;
  place?: string;
  mode: string;
  todayMinutes: number;
  remainingTodayMinutes: number;
}

export function status(ds: Dataset, now: Date, holidays: ReadonlySet<ISODate>): Status {
  const iso = now.toISOString();
  const run = runningEntry(ds);
  const today = balance(ds, 'day', dateOf(iso), holidays, iso);
  const place = ds.places.find((p) => p.id === ds.current.placeId);
  return {
    running: !!run,
    since: run?.start,
    project: findProject(ds, ds.current.projectId)?.name,
    place: place ? placeLabel(place) : undefined,
    mode: ds.current.mode,
    todayMinutes: today.worked,
    remainingTodayMinutes: today.remaining,
  };
}
