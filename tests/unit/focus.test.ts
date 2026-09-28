import { describe, expect, it } from 'vitest';
import { focusProgress, streakStart, switchProject } from '../../src/domain/index.ts';
import { at, dataset, entry } from './helpers.ts';

const d = '2026-09-28';

describe('focus rounds', () => {
  it('has no round while the workday is stopped', () => {
    const ds = dataset({ entries: [entry(d, '08:00', '09:00')] });
    expect(streakStart(ds)).toBeUndefined();
    expect(focusProgress(ds, at(d, '09:30'))).toBeUndefined();
  });

  it('keeps one streak across back-to-back project switches', () => {
    let ds = dataset({ entries: [entry(d, '08:00', undefined, { projectId: 'a' })] });
    ds = switchProject(ds, 'b', at(d, '08:10'), 'x', 'manual');
    ds = switchProject(ds, 'a', at(d, '08:20'), 'y', 'manual');
    expect(streakStart(ds)).toBe(at(d, '08:00'));
    expect(focusProgress(ds, at(d, '08:15'))).toMatchObject({
      elapsed: 15,
      ratio: 0.6,
      full: false,
    });
    expect(focusProgress(ds, at(d, '08:40'))).toMatchObject({ elapsed: 40, ratio: 1, full: true });
  });

  it('starts over after a gap or a break', () => {
    const ds = dataset({
      entries: [entry(d, '08:00', '09:00'), entry(d, '09:20', undefined)],
    });
    expect(streakStart(ds)).toBe(at(d, '09:20'));
    const later = focusProgress(ds, at(d, '10:00'), at(d, '09:50'));
    expect(later).toMatchObject({ start: at(d, '09:50'), elapsed: 10 });
    expect(focusProgress(ds, at(d, '10:00'), at(d, '08:30'))?.start).toBe(at(d, '09:20'));
  });

  it('uses the configured round length', () => {
    const base = dataset({ entries: [entry(d, '08:00', undefined)] });
    const ds = { ...base, settings: { ...base.settings, focusMinutes: 50 } };
    expect(focusProgress(ds, at(d, '08:25'))?.ratio).toBe(0.5);
  });
});
