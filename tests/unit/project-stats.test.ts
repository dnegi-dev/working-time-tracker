import { describe, expect, it } from 'vitest';
import { migrate, projectMinutesBetween, setArchived } from '../../src/domain/index.ts';
import { at, dataset, entry } from './helpers.ts';

const projects = [
  { id: 'a', name: 'A', archived: false },
  { id: 'b', name: 'B', archived: false },
];

describe('projectMinutesBetween', () => {
  it('sums finished and running entries per project inside the range', () => {
    const ds = dataset({
      projects,
      entries: [
        entry('2026-08-31', '09:00', '10:00', { projectId: 'a' }),
        entry('2026-09-01', '09:00', '10:30', { projectId: 'a' }),
        entry('2026-09-02', '09:00', '09:45', { projectId: 'b' }),
        entry('2026-09-03', '09:00', undefined, { projectId: 'b' }),
        entry('2026-09-03', '07:00', '08:00'),
      ],
    });
    const sums = projectMinutesBetween(ds, '2026-09-01', '2026-09-30', at('2026-09-03', '09:30'));
    expect(Object.fromEntries(sums)).toEqual({ a: 90, b: 75 });
  });
});

describe('setArchived', () => {
  it('archives and restores, clearing the current project', () => {
    const ds = dataset({ projects, current: { mode: 'home', projectId: 'a' } });
    const gone = setArchived(ds, 'a', true);
    expect(gone.projects[0]!.archived).toBe(true);
    expect(gone.current.projectId).toBeUndefined();
    const back = setArchived(gone, 'a', false);
    expect(back.projects[0]!.archived).toBe(false);
    expect(setArchived(ds, 'b', true).current.projectId).toBe('a');
  });

  it('keeps a project whose time is running', () => {
    const ds = dataset({
      projects,
      entries: [entry('2026-09-03', '09:00', undefined, { projectId: 'a' })],
      current: { mode: 'home', projectId: 'a' },
    });
    expect(setArchived(ds, 'a', true)).toBe(ds);
  });
});

it('migrate fills in the resting place theme', () => {
  expect(migrate({ settings: { locale: 'en' } }).settings.restTheme).toBe('seabed');
});
