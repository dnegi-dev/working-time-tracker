import { describe, expect, it } from 'vitest';
import { previousProjectId, projectMinutesOn, switchProject } from '../../src/domain/index.ts';
import { at, dataset, entry } from './helpers.ts';

const d = '2026-09-28';
const projects = ['a', 'b', 'c'].map((id) => ({ id, name: id, archived: id === 'c' }));

describe('projects today', () => {
  it('sums minutes per project, including the running entry', () => {
    const ds = dataset({
      entries: [
        entry(d, '08:00', '09:00', { projectId: 'a' }),
        entry(d, '09:00', '10:00', { projectId: 'b' }),
        entry(d, '10:00', undefined, { projectId: 'a' }),
      ],
    });
    expect(projectMinutesOn(ds, d, 'a', at(d, '10:30'))).toBe(90);
    expect(projectMinutesOn(ds, d, 'b', at(d, '10:30'))).toBe(60);
    expect(projectMinutesOn(ds, d, undefined, at(d, '10:30'))).toBe(0);
  });

  it('finds the project worked on before the current one', () => {
    let ds = dataset({ projects, entries: [entry(d, '08:00', undefined, { projectId: 'a' })] });
    ds = { ...ds, current: { ...ds.current, projectId: 'a' } };
    expect(previousProjectId(ds)).toBeUndefined();
    ds = switchProject(ds, 'b', at(d, '09:00'), 'x', 'manual');
    expect(previousProjectId(ds)).toBe('a');
    ds = switchProject(ds, 'a', at(d, '10:00'), 'y', 'manual');
    expect(previousProjectId(ds)).toBe('b');
  });

  it('skips archived projects', () => {
    const ds = dataset({
      projects,
      entries: [entry(d, '08:00', '09:00', { projectId: 'c' })],
    });
    expect(previousProjectId(ds)).toBeUndefined();
  });
});
