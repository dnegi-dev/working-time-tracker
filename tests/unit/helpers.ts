import { createApp } from '../../src/application/app.ts';
import {
  emptyDataset,
  type Dataset,
  type Holiday,
  type TimeEntry,
} from '../../src/domain/index.ts';
import type { Repository } from '../../src/ports/index.ts';

/** Local-time instant for a date and HH:MM. */
export const at = (date: string, hm: string) => new Date(`${date}T${hm}:00`).toISOString();

export function entry(
  date: string,
  from: string,
  to: string | undefined,
  extra: Partial<TimeEntry> = {},
): TimeEntry {
  return {
    id: `${date}-${from}`,
    start: at(date, from),
    ...(to ? { end: at(date, to) } : {}),
    mode: 'home',
    source: 'manual',
    ...extra,
  };
}

export function dataset(patch: Partial<Dataset> = {}): Dataset {
  return { ...emptyDataset('en'), ...patch };
}

export function memoryRepo(initial?: Dataset): Repository & { saved?: Dataset } {
  const repo: Repository & { saved?: Dataset } = {
    saved: initial,
    async load() {
      return repo.saved;
    },
    async save(ds) {
      repo.saved = ds;
    },
  };
  return repo;
}

export function testApp(opts: { ds?: Dataset; now: { value: Date }; holidays?: Holiday[] }) {
  let n = 0;
  const repo = memoryRepo(opts.ds);
  const app = createApp({
    repo,
    clock: { now: () => opts.now.value },
    holidays: { forYear: async () => opts.holidays ?? [] },
    newId: () => `id${++n}`,
    locale: 'en',
  });
  return { app, repo };
}
