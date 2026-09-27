import { dateOf, migrate, type Dataset } from '../../domain/index.ts';

export type Granularity = 'month' | 'year' | 'single';
type Part = Pick<Dataset, 'entries' | 'notes' | 'dayMarks'>;

const keyOf = (date: string, g: Granularity) =>
  g === 'single' ? 'all' : g === 'year' ? date.slice(0, 4) : date.slice(0, 7);

/** Split dated records into buckets; everything else goes into `meta`. */
export function partition(ds: Dataset, g: Granularity) {
  const parts: Record<string, Part> = {};
  const bucket = (k: string) => (parts[k] ??= { entries: [], notes: [], dayMarks: [] });
  for (const e of ds.entries) bucket(keyOf(dateOf(e.start), g)).entries.push(e);
  for (const n of ds.notes) bucket(keyOf(n.date, g)).notes.push(n);
  for (const m of ds.dayMarks) bucket(keyOf(m.date, g)).dayMarks.push(m);
  const { entries: _e, notes: _n, dayMarks: _m, ...meta } = ds;
  return { meta, parts };
}

export function join(meta: unknown, parts: Partial<Part>[]): Dataset {
  return migrate({
    ...(meta as object),
    entries: parts.flatMap((p) => p.entries ?? []),
    notes: parts.flatMap((p) => p.notes ?? []),
    dayMarks: parts.flatMap((p) => p.dayMarks ?? []),
  });
}
