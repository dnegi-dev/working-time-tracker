import { migrate, SCHEMA_VERSION, type Dataset } from '../domain/index.ts';

interface BackupFile {
  app: 'working-time-tracker';
  schemaVersion: number;
  createdAt: string;
  checksum: string;
  data: Dataset;
}

export interface BackupPreview {
  createdAt: string;
  entries: number;
  projects: number;
  notes: number;
  from?: string;
  to?: string;
}

/** FNV-1a — detects truncated or hand-edited files, not tampering. */
export function checksum(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function createBackup(ds: Dataset, now: Date): string {
  const file: BackupFile = {
    app: 'working-time-tracker',
    schemaVersion: SCHEMA_VERSION,
    createdAt: now.toISOString(),
    checksum: checksum(JSON.stringify(ds)),
    data: ds,
  };
  return JSON.stringify(file, null, 2);
}

export type ReadResult =
  { ok: true; ds: Dataset; preview: BackupPreview } | { ok: false; error: string };

export function readBackup(text: string): ReadResult {
  let file: Partial<BackupFile>;
  try {
    file = JSON.parse(text) as Partial<BackupFile>;
  } catch {
    return { ok: false, error: 'backup.invalidJson' };
  }
  if (file.app !== 'working-time-tracker' || !file.data)
    return { ok: false, error: 'backup.notBackup' };
  if (file.checksum !== checksum(JSON.stringify(file.data)))
    return { ok: false, error: 'backup.checksum' };
  const ds = migrate(file.data);
  const starts = ds.entries.map((e) => e.start).sort();
  return {
    ok: true,
    ds,
    preview: {
      createdAt: file.createdAt ?? '',
      entries: ds.entries.length,
      projects: ds.projects.length,
      notes: ds.notes.length,
      from: starts[0]?.slice(0, 10),
      to: starts.at(-1)?.slice(0, 10),
    },
  };
}

function unionById<T extends { id: string }>(a: T[], b: T[]): T[] {
  const map = new Map(a.map((x) => [x.id, x]));
  for (const x of b) map.set(x.id, x);
  return [...map.values()];
}

/** Merge keeps current settings and adds/overwrites records from the backup by id. */
export function mergeDatasets(current: Dataset, incoming: Dataset): Dataset {
  const marks = new Map(current.dayMarks.map((m) => [m.date, m]));
  for (const m of incoming.dayMarks) marks.set(m.date, m);
  return {
    ...current,
    entries: unionById(current.entries, incoming.entries),
    projects: unionById(current.projects, incoming.projects),
    places: unionById(current.places, incoming.places),
    notes: unionById(current.notes, incoming.notes),
    dayMarks: [...marks.values()],
  };
}
