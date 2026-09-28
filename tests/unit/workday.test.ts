import { describe, expect, it } from 'vitest';
import {
  endLunch,
  lunchActive,
  missingBreak,
  projectMinutesOn,
  runningEntry,
  startLunch,
  stopEntry,
  stopWithLegalBreak,
  workedOn,
  type Dataset,
} from '../../src/domain/index.ts';
import { at, dataset, entry } from './helpers.ts';

const d = '2026-09-28';
const later = at(d, '23:00');

function running(from: string, extra: Partial<Dataset> = {}): Dataset {
  const entries = [entry(d, from, undefined, { projectId: 'a' })];
  return dataset({ entries, current: { mode: 'home', projectId: 'a' }, ...extra });
}
const endOf = (ds: Dataset) => ds.entries.at(-1)?.end;

describe('lunch', () => {
  it('stops for lunch and resumes with the same project, place and mode', () => {
    const base = running('08:00', { current: { mode: 'office', projectId: 'a', placeId: 'hq' } });
    expect(startLunch(stopEntry(base, at(d, '12:00')), at(d, '12:00')).current.lunchSince).toBe(
      undefined,
    );
    let ds = startLunch(base, at(d, '12:00'));
    expect(runningEntry(ds)).toBeUndefined();
    expect(lunchActive(ds, at(d, '12:10'))).toBe(true);
    expect(lunchActive(ds, at('2026-09-29', '08:00'))).toBe(false);
    ds = endLunch(ds, at(d, '12:30'), 'b', 'manual');
    expect(ds.current.lunchSince).toBeUndefined();
    expect(lunchActive(ds, at(d, '12:40'))).toBe(false);
    expect(runningEntry(ds)).toMatchObject({ projectId: 'a', placeId: 'hq', mode: 'office' });
  });

  it('counts the lunch gap as a taken break without project time', () => {
    let ds = startLunch(running('08:00'), at(d, '12:00'));
    ds = endLunch(ds, at(d, '12:30'), 'b', 'manual');
    const now = at(d, '16:00');
    expect(projectMinutesOn(ds, d, 'a', now)).toBe(450);
    expect(workedOn(ds, d, now)).toBe(450);
  });
});

describe('stop with legal break', () => {
  it('appends 30 minutes after 7 hours', () => {
    const ds = stopWithLegalBreak(running('08:00'), at(d, '15:00'));
    expect(endOf(ds)).toBe(at(d, '15:30'));
    expect(workedOn(ds, d, later)).toBe(420);
  });

  it('appends 45 minutes when the break would cross 9 hours', () => {
    const ds = stopWithLegalBreak(running('08:00'), at(d, '16:50'));
    expect(endOf(ds)).toBe(at(d, '17:35'));
    expect(workedOn(ds, d, later)).toBe(530);
  });

  it('stops plainly when the rule is off or nothing runs', () => {
    const base = running('08:00');
    const off = {
      ...base,
      settings: { ...base.settings, breakRule: { ...base.settings.breakRule, enabled: false } },
    };
    expect(endOf(stopWithLegalBreak(off, at(d, '15:00')))).toBe(at(d, '15:00'));
    const idle = dataset({ entries: [entry(d, '08:00', '12:00')] });
    expect(stopWithLegalBreak(idle, at(d, '15:00'))).toBe(idle);
  });

  it('tells how many minutes the legal stop adds', () => {
    expect(missingBreak(running('08:00'), at(d, '13:00'))).toBe(0);
    expect(missingBreak(running('08:00'), at(d, '15:00'))).toBe(30);
    expect(missingBreak(dataset(), at(d, '15:00'))).toBe(0);
  });

  it('adds nothing when the break was already taken', () => {
    const ds = dataset({ entries: [entry(d, '08:00', '12:00'), entry(d, '12:30', undefined)] });
    const out = stopWithLegalBreak(ds, at(d, '16:00'));
    expect(endOf(out)).toBe(at(d, '16:00'));
    expect(workedOn(out, d, later)).toBe(450);
  });

  it('never ends after midnight', () => {
    const ds = stopWithLegalBreak(running('15:00'), at(d, '23:50'));
    expect(endOf(ds)).toBe(at('2026-09-29', '00:00'));
  });
});
