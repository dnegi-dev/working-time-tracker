/** Local calendar date, `YYYY-MM-DD`. */
export type ISODate = string;
/** Instant, `Date.toISOString()` format. */
export type Instant = string;

export type Mode = 'office' | 'home';
export type Source = 'manual' | 'nfc' | 'qr' | 'geofence' | 'shortcut' | 'api';
export type DayType = 'vacation' | 'sick' | 'holiday';
export type Period = 'day' | 'week' | 'month' | 'year';

export interface TimeEntry {
  id: string;
  start: Instant;
  end?: Instant;
  projectId?: string;
  placeId?: string;
  mode: Mode;
  source: Source;
}

export interface Project {
  id: string;
  name: string;
  archived: boolean;
}

/** A building and optional room, e.g. "HQ" / "3.14". */
export interface Place {
  id: string;
  building: string;
  room?: string;
  mode: Mode;
}

export type NoteTarget = { kind: 'day' } | { kind: 'project'; projectId: string };

export interface Note {
  id: string;
  date: ISODate;
  target: NoteTarget;
  text: string;
}

export interface DayMark {
  date: ISODate;
  type: DayType;
}

export interface Holiday {
  date: ISODate;
  name: string;
}

export type QuotaRule =
  { kind: 'officeDaysPerWeek'; value: number } | { kind: 'maxHomePercent'; value: number };

export interface BreakRule {
  enabled: boolean;
  after6h: number;
  after9h: number;
}

export type StorageSetting =
  { kind: 'local' } | { kind: 'file'; granularity: 'month' | 'year' | 'single' };

export interface Settings {
  /** Minutes per weekday, index 0 = Monday. */
  targetMinutesPerWeekday: number[];
  breakRule: BreakRule;
  quota: QuotaRule;
  region: string;
  holidaySource: { kind: 'bundled' } | { kind: 'ical'; url: string };
  multiPlacePerDay: boolean;
  locale: 'de' | 'en';
  openLinksIn: 'browser' | 'app';
  storage: StorageSetting;
  /** Length of one focus round (pomodoro) in minutes. */
  focusMinutes: number;
}

export interface Current {
  projectId?: string;
  placeId?: string;
  mode: Mode;
}

export interface Dataset {
  schemaVersion: number;
  entries: TimeEntry[];
  projects: Project[];
  places: Place[];
  notes: Note[];
  dayMarks: DayMark[];
  settings: Settings;
  current: Current;
  /** Last automated trigger, used to ignore duplicates (NFC/geofence can fire twice). */
  lastTrigger?: { cmd: string; at: Instant };
}
