import type { Dataset, Holiday, StorageSetting } from '../domain/index.ts';

/** Persists the whole dataset. Adapters decide how to partition it (per month/year/one file). */
export interface Repository {
  load(): Promise<Dataset | undefined>;
  save(ds: Dataset): Promise<void>;
}

export interface Clock {
  now(): Date;
}

export interface HolidayProvider {
  /** Holidays for a region (e.g. `DE-NW`) and year. Must not throw; return [] when unavailable. */
  forYear(region: string, year: number): Promise<Holiday[]>;
}

/** Minimal file access used by the file repository (web directory handle or iOS Documents). */
export interface FileAccess {
  list(): Promise<string[]>;
  read(name: string): Promise<string | undefined>;
  write(name: string, text: string): Promise<void>;
}

export type Cell = string | number;
/** Format-neutral report table; export adapters only serialize this. */
export interface ReportTable {
  title: string;
  columns: string[];
  rows: Cell[][];
}

export type ExportFormat = 'md' | 'json' | 'csv' | 'xlsx';

/** tick: light step · grab: picked something up · success/warning: done or refused. */
export type HapticKind = 'tick' | 'grab' | 'success' | 'warning';

/** Platform services the UI may use; implemented in src/main.ts from adapters. */
export interface Platform {
  isNative: boolean;
  /** Running as iOS app or installed desktop PWA. */
  inApp: boolean;
  webFilesSupported: boolean;
  appBaseUrl: string;
  loginHash: string;
  saveFile(name: string, blob: Blob): Promise<void>;
  formatReport(tables: ReportTable[], format: ExportFormat, title: string): Promise<Blob>;
  redirectToApp(path: string): Promise<boolean>;
  /** Switch persistence; `pick` asks for a folder on the web. Returns false if cancelled. */
  useStorage(setting: StorageSetting, pick?: boolean): Promise<boolean>;
  /** Tactile feedback for gestures. */
  haptic(kind: HapticKind): void;
}
