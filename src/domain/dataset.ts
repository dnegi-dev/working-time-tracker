import type { Dataset, Settings } from './types.ts';

export const SCHEMA_VERSION = 1;

export function defaultSettings(locale: Settings['locale'] = 'de'): Settings {
  return {
    targetMinutesPerWeekday: [480, 480, 480, 480, 480, 0, 0],
    breakRule: { enabled: true, after6h: 30, after9h: 45 },
    quota: { kind: 'officeDaysPerWeek', value: 2 },
    region: 'DE-NW',
    holidaySource: { kind: 'bundled' },
    multiPlacePerDay: false,
    locale,
    openLinksIn: 'browser',
    storage: { kind: 'local' },
    focusMinutes: 25,
    breakCounts: 'before',
    restTheme: 'seabed',
  };
}

export function emptyDataset(locale: Settings['locale'] = 'de'): Dataset {
  return {
    schemaVersion: SCHEMA_VERSION,
    entries: [],
    projects: [],
    places: [],
    notes: [],
    dayMarks: [],
    settings: defaultSettings(locale),
    current: { mode: 'home' },
  };
}

/** Bring any stored dataset up to the current schema. Add a step per version bump. */
export function migrate(raw: unknown): Dataset {
  const base = emptyDataset();
  const d = (raw ?? {}) as Partial<Dataset>;
  return {
    ...base,
    ...d,
    settings: { ...base.settings, ...d.settings },
    current: { ...base.current, ...d.current },
    schemaVersion: SCHEMA_VERSION,
  };
}
