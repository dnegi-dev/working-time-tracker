import { describe, expect, it } from 'vitest';
import { parseCommandUrl } from '../../src/adapters/automation/deeplink.ts';
import { toCsv, toJson, toMarkdown } from '../../src/adapters/export/formatters.ts';
import { parseIcal } from '../../src/adapters/holidays/ical.ts';
import { holidayProvider } from '../../src/adapters/holidays/provider.ts';
import { fileRepo } from '../../src/adapters/storage/fileRepo.ts';
import { localStorageRepo } from '../../src/adapters/storage/localStorageRepo.ts';
import { join, partition } from '../../src/adapters/storage/partition.ts';
import type { FileAccess } from '../../src/ports/index.ts';
import { dataset, entry } from './helpers.ts';

const ICS = `BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20261003\r\nDTEND;VALUE=DATE:20261004\r\nSUMMARY;LANGUAGE=DE:Tag der Deutschen\r\n  Einheit\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20261224\r\nDTEND;VALUE=DATE:20261227\r\nSUMMARY:Weihnachten\\, frei\r\nEND:VEVENT\r\nEND:VCALENDAR`;

describe('ical', () => {
  it('parses all-day events, folded lines and multi-day ranges', () => {
    expect(parseIcal(ICS)).toEqual([
      { date: '2026-10-03', name: 'Tag der Deutschen Einheit' },
      { date: '2026-12-24', name: 'Weihnachten, frei' },
      { date: '2026-12-25', name: 'Weihnachten, frei' },
      { date: '2026-12-26', name: 'Weihnachten, frei' },
    ]);
  });
  it('provider filters by year and falls back to cache', async () => {
    const cache = new Map<string, string>();
    const storage = {
      getItem: (k: string) => cache.get(k) ?? null,
      setItem: (k: string, v: string) => void cache.set(k, v),
    } as Storage;
    let fail = false;
    const p = holidayProvider({
      base: '/',
      source: () => ({ kind: 'ical', url: 'https://x/{region}/{year}.ics' }),
      fetchText: async (url) => {
        if (fail) throw new Error('offline');
        expect(url).toBe('https://x/DE-NW/2026.ics');
        return ICS;
      },
      cache: storage,
    });
    expect(await p.forYear('DE-NW', 2026)).toHaveLength(4);
    fail = true;
    expect(await p.forYear('DE-NW', 2026)).toHaveLength(4);
    expect(await p.forYear('DE-BY', 2026)).toEqual([]);
  });
});

describe('deep links', () => {
  it('parses every transport', () => {
    expect(parseCommandUrl('wtt://toggle?place=HQ&source=nfc')).toEqual({
      cmd: 'toggle',
      params: { place: 'HQ' },
      source: 'nfc',
    });
    expect(parseCommandUrl('https://a.b/app/#/do/clock-in?project=X')).toEqual({
      cmd: 'clock-in',
      params: { project: 'X' },
      source: 'shortcut',
    });
    expect(parseCommandUrl('https://a.b/app/api/v1/status')).toEqual({
      cmd: 'status',
      params: {},
      source: 'api',
    });
    expect(
      parseCommandUrl('https://a.b/app/#/do/web%2Bwtt%3A%2F%2Fclock-out%3Fsource%3Dgeofence'),
    ).toEqual({ cmd: 'clock-out', params: {}, source: 'geofence' });
    expect(parseCommandUrl('wtt://toggle?source=evil')?.source).toBe('shortcut');
    expect(parseCommandUrl('https://a.b/app/#/today')).toBeUndefined();
  });
});

describe('storage', () => {
  const ds = dataset({
    entries: [
      entry('2026-01-05', '08:00', '09:00'),
      entry('2026-02-05', '08:00', '09:00'),
      entry('2027-01-05', '08:00', '09:00'),
    ],
    notes: [{ id: 'n', date: '2026-02-05', target: { kind: 'day' }, text: 'x' }],
  });
  it('partitions by month, year or single', () => {
    expect(Object.keys(partition(ds, 'month').parts).sort()).toEqual([
      '2026-01',
      '2026-02',
      '2027-01',
    ]);
    expect(Object.keys(partition(ds, 'year').parts).sort()).toEqual(['2026', '2027']);
    expect(Object.keys(partition(ds, 'single').parts)).toEqual(['all']);
    const { meta, parts } = partition(ds, 'year');
    expect(join(meta, Object.values(parts)).entries).toHaveLength(3);
  });
  it('localStorage repo round-trips and drops empty months', async () => {
    const map = new Map<string, string>();
    const storage = new Proxy({} as Storage, {
      get: (_t, k) =>
        ({
          getItem: (x: string) => map.get(x) ?? null,
          setItem: (x: string, v: string) => map.set(x, v),
          removeItem: (x: string) => map.delete(x),
        })[k as 'getItem'],
      ownKeys: () => [...map.keys()],
      getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
    });
    const repo = localStorageRepo(storage);
    expect(await repo.load()).toBeUndefined();
    await repo.save(ds);
    expect((await repo.load())?.entries).toHaveLength(3);
    await repo.save({ ...ds, entries: ds.entries.slice(0, 1), notes: [] });
    expect([...map.keys()].sort()).toEqual(['wtt:m:2026-01', 'wtt:meta']);
  });
  it('file repo writes one file per bucket and skips unchanged files', async () => {
    const files = new Map<string, string>();
    let writes = 0;
    const fa: FileAccess = {
      list: async () => [...files.keys()],
      read: async (n) => files.get(n),
      write: async (n, t) => void (writes++, files.set(n, t)),
    };
    const repo = fileRepo(fa, 'year');
    await repo.save(ds);
    expect([...files.keys()].sort()).toEqual([
      'wtt-2026.json',
      'wtt-2027.json',
      'wtt-settings.json',
    ]);
    await repo.save(ds);
    expect(writes).toBe(3);
    expect((await repo.load())?.notes).toHaveLength(1);
  });
});

describe('export formatters', () => {
  const tables = [
    { title: 'Hours', columns: ['Date', 'Note'], rows: [['2026-09-28', 'a|b, "c"']] },
  ];
  it('writes markdown, csv and json', () => {
    expect(toMarkdown(tables, 'Report')).toContain('| 2026-09-28 | a\\|b, "c" |');
    expect(toCsv(tables)).toBe('Hours\nDate,Note\n2026-09-28,"a|b, ""c"""\n');
    expect(JSON.parse(toJson(tables))).toEqual([
      { title: 'Hours', rows: [{ Date: '2026-09-28', Note: 'a|b, "c"' }] },
    ]);
    expect(toMarkdown([{ ...tables[0]!, rows: [] }], 'R')).toContain('—');
  });
});
