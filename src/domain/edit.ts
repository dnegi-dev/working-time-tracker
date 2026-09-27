import type {
  DayType,
  Dataset,
  ISODate,
  Note,
  Place,
  Project,
  Settings,
  TimeEntry,
} from './types.ts';

/** Small immutable edits used by the UI. Every function returns a new Dataset. */

export function addEntry(ds: Dataset, entry: TimeEntry): Dataset {
  return { ...ds, entries: [...ds.entries, entry] };
}

export function updateEntry(ds: Dataset, id: string, patch: Partial<TimeEntry>): Dataset {
  return { ...ds, entries: ds.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) };
}

export function removeEntry(ds: Dataset, id: string): Dataset {
  return { ...ds, entries: ds.entries.filter((e) => e.id !== id) };
}

export function upsertProject(ds: Dataset, p: Project): Dataset {
  const exists = ds.projects.some((x) => x.id === p.id);
  return {
    ...ds,
    projects: exists ? ds.projects.map((x) => (x.id === p.id ? p : x)) : [...ds.projects, p],
  };
}

export function upsertPlace(ds: Dataset, p: Place): Dataset {
  const exists = ds.places.some((x) => x.id === p.id);
  return {
    ...ds,
    places: exists ? ds.places.map((x) => (x.id === p.id ? p : x)) : [...ds.places, p],
  };
}

export function removePlace(ds: Dataset, id: string): Dataset {
  const current = ds.current.placeId === id ? { ...ds.current, placeId: undefined } : ds.current;
  return { ...ds, current, places: ds.places.filter((p) => p.id !== id) };
}

export function addNote(ds: Dataset, note: Note): Dataset {
  return { ...ds, notes: [...ds.notes, note] };
}

export function removeNote(ds: Dataset, id: string): Dataset {
  return { ...ds, notes: ds.notes.filter((n) => n.id !== id) };
}

export function setDayMark(ds: Dataset, date: ISODate, type: DayType | undefined): Dataset {
  const dayMarks = ds.dayMarks.filter((m) => m.date !== date);
  if (type) dayMarks.push({ date, type });
  return { ...ds, dayMarks };
}

export function updateSettings(ds: Dataset, patch: Partial<Settings>): Dataset {
  return { ...ds, settings: { ...ds.settings, ...patch } };
}

/** Combine a local date and `HH:MM` into an instant. */
export function atTime(date: ISODate, hm: string): string {
  return new Date(`${date}T${hm}:00`).toISOString();
}
