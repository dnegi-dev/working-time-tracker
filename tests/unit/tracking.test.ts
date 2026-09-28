import { describe, expect, it } from 'vitest';
import {
  placeForMode,
  runningEntry,
  splitAtMidnight,
  startEntry,
  stopEntry,
  switchLocation,
  switchPlace,
  switchProject,
} from '../../src/domain/index.ts';
import { at, dataset } from './helpers.ts';

const d = '2026-09-28';
const places = [
  { id: 'hq', building: 'HQ', room: '3.14', mode: 'office' as const },
  { id: 'home', building: 'Home', mode: 'home' as const },
];

describe('tracking', () => {
  it('starts once and stops the running entry', () => {
    let ds = startEntry(dataset(), { source: 'manual' }, at(d, '08:00'), 'a');
    expect(startEntry(ds, { source: 'manual' }, at(d, '08:01'), 'b')).toBe(ds);
    ds = stopEntry(ds, at(d, '12:00'));
    expect(runningEntry(ds)).toBeUndefined();
    expect(ds.entries[0]?.end).toBe(at(d, '12:00'));
    expect(stopEntry(ds, at(d, '13:00'))).toBe(ds);
  });

  it('takes the mode from the place', () => {
    const ds = startEntry(
      dataset({ places }),
      { placeId: 'hq', source: 'nfc' },
      at(d, '08:00'),
      'a',
    );
    expect(ds.entries[0]).toMatchObject({ placeId: 'hq', mode: 'office', source: 'nfc' });
  });

  it('picks a place that fits the mode', () => {
    const ds = dataset({ places, current: { mode: 'home', placeId: 'home' } });
    expect(placeForMode(ds, 'home')).toBe('home');
    expect(placeForMode(ds, 'office')).toBe('hq');
    expect(placeForMode(dataset(), 'office')).toBeUndefined();
    const hq2 = { id: 'hq2', building: 'HQ2', mode: 'office' as const };
    const inHq2 = dataset({
      places: [...places, hq2],
      current: { mode: 'office', placeId: 'hq2' },
    });
    expect(placeForMode(inHq2, 'office')).toBe('hq2');
  });

  it('starting with a mode drops a place of the other mode', () => {
    const base = dataset({ places, current: { mode: 'home', placeId: 'home' } });
    const office = startEntry(base, { mode: 'office', source: 'api' }, at(d, '08:00'), 'a');
    expect(office.entries[0]).toMatchObject({ placeId: 'hq', mode: 'office' });
    const bare = dataset({ places: places.slice(1), current: { mode: 'home', placeId: 'home' } });
    const noPlace = startEntry(bare, { mode: 'office', source: 'api' }, at(d, '08:00'), 'a');
    expect(noPlace.current).toMatchObject({ placeId: undefined, mode: 'office' });
  });

  it('splits the running entry on project switch', () => {
    let ds = startEntry(dataset(), { projectId: 'p1', source: 'manual' }, at(d, '08:00'), 'a');
    ds = switchProject(ds, 'p2', at(d, '10:00'), 'b', 'qr');
    expect(ds.entries).toHaveLength(2);
    expect(ds.entries[0]).toMatchObject({ projectId: 'p1', end: at(d, '10:00') });
    expect(ds.entries[1]).toMatchObject({ projectId: 'p2', start: at(d, '10:00'), source: 'qr' });
    expect(ds.current.projectId).toBe('p2');
  });

  it('switching at the start instant patches instead of splitting', () => {
    let ds = startEntry(dataset(), { source: 'manual' }, at(d, '08:00'), 'a');
    ds = switchProject(ds, 'p2', at(d, '08:00'), 'b', 'manual');
    expect(ds.entries).toHaveLength(1);
    expect(ds.entries[0]?.projectId).toBe('p2');
  });

  it('without multi-place, a place switch rewrites the whole day', () => {
    let ds = startEntry(
      dataset({ places }),
      { placeId: 'home', source: 'manual' },
      at(d, '08:00'),
      'a',
    );
    ds = stopEntry(ds, at(d, '09:00'));
    ds = startEntry(ds, { source: 'manual' }, at(d, '10:00'), 'b');
    ds = switchPlace(ds, 'hq', at(d, '11:00'), 'c', 'nfc');
    expect(ds.entries).toHaveLength(2);
    expect(ds.entries.every((e) => e.placeId === 'hq' && e.mode === 'office')).toBe(true);
  });

  it('with multi-place, a place switch splits the running entry', () => {
    const base = dataset({ places });
    let ds = { ...base, settings: { ...base.settings, multiPlacePerDay: true } };
    ds = startEntry(ds, { placeId: 'home', source: 'manual' }, at(d, '08:00'), 'a');
    ds = switchPlace(ds, 'hq', at(d, '11:00'), 'b', 'nfc');
    expect(ds.entries.map((e) => e.mode)).toEqual(['home', 'office']);
  });

  it('switching mode without places when not running only changes current', () => {
    const ds = switchLocation(
      dataset({ settings: { ...dataset().settings, multiPlacePerDay: true } }),
      { mode: 'office' },
      at(d, '08:00'),
      'a',
      'manual',
    );
    expect(ds.current.mode).toBe('office');
    expect(ds.entries).toHaveLength(0);
  });

  it('splits a running entry at each midnight it crossed', () => {
    let n = 0;
    const id = () => `n${++n}`;
    const ds = startEntry(
      dataset(),
      { projectId: 'p1', source: 'nfc' },
      at('2026-09-26', '23:00'),
      'a',
    );
    expect(splitAtMidnight(ds, at('2026-09-26', '23:30'), id)).toBe(ds);
    const out = splitAtMidnight(ds, at(d, '00:10'), id);
    expect(out.entries).toMatchObject([
      { id: 'a', start: at('2026-09-26', '23:00'), end: at('2026-09-27', '00:00') },
      { id: 'n1', start: at('2026-09-27', '00:00'), end: at(d, '00:00'), projectId: 'p1' },
      { id: 'n2', start: at(d, '00:00'), projectId: 'p1', source: 'nfc' },
    ]);
    expect(runningEntry(out)?.id).toBe('n2');
  });
});
