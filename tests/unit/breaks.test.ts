import { describe, expect, it } from 'vitest';
import {
  breakActive,
  endBreak,
  projectMinutesOn,
  queueNext,
  startBreak,
  startEntry,
  workedOn,
  type Dataset,
} from '../../src/domain/index.ts';
import { at, dataset, entry } from './helpers.ts';

const d = '2026-09-28';
const since = at(d, '09:00');
const end = at(d, '09:15');

function day(breakCounts: Dataset['settings']['breakCounts']) {
  const ds = dataset({ entries: [entry(d, '08:00', undefined, { projectId: 'a' })] });
  return { ...ds, settings: { ...ds.settings, breakCounts } };
}
const mins = (ds: Dataset, p: string) => projectMinutesOn(ds, d, p, at(d, '10:00'));

describe('bubble breaks', () => {
  it('counts the break for the project before it by default', () => {
    let ds = startBreak(day('before'), since);
    expect(breakActive(ds, since)).toBe(true);
    ds = endBreak(ds, since, 'b', end, 'x', 'manual');
    expect([mins(ds, 'a'), mins(ds, 'b')]).toEqual([75, 45]);
  });

  it('can give the break to the project after it', () => {
    const ds = endBreak(startBreak(day('after'), since), since, 'b', end, 'x', 'manual');
    expect([mins(ds, 'a'), mins(ds, 'b')]).toEqual([60, 60]);
    expect(workedOn(ds, d, at(d, '10:00'))).toBe(120);
  });

  it('can be a regular pause that is not worked time', () => {
    let ds = startBreak(day('pause'), since);
    expect(breakActive(ds, since)).toBe(true);
    ds = queueNext(ds, 'b');
    expect(ds.current.projectId).toBe('b');
    ds = endBreak(ds, since, 'b', end, 'x', 'manual');
    expect([mins(ds, 'a'), mins(ds, 'b')]).toEqual([60, 45]);
    expect(breakActive(ds, since)).toBe(false);
  });

  it('ends when the workday restarts or stops some other way', () => {
    const paused = startBreak(day('pause'), since);
    const restarted = startEntry(paused, { source: 'nfc' }, end, 'y');
    expect(breakActive(restarted, since)).toBe(false);
    expect(breakActive(day('before'), undefined)).toBe(false);
    expect(breakActive(day('before'), at(d, '07:00'))).toBe(false);
  });

  it('only queues into the dataset while the workday is stopped', () => {
    expect(queueNext(day('before'), 'b').current.projectId).toBeUndefined();
  });
});
