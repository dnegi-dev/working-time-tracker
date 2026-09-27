import { describe, expect, it } from 'vitest';
import {
  addEntry,
  atTime,
  removeEntry,
  removePlace,
  setDayMark,
  updateEntry,
  updateSettings,
  upsertPlace,
  upsertProject,
  addNote,
  removeNote,
} from '../../src/domain/index.ts';
import { at, dataset, entry } from './helpers.ts';

const d = '2026-09-28';

describe('edits', () => {
  it('adds, updates and removes entries', () => {
    let ds = addEntry(dataset(), entry(d, '08:00', '09:00'));
    ds = updateEntry(ds, `${d}-08:00`, { end: atTime(d, '10:00') });
    expect(ds.entries[0]?.end).toBe(at(d, '10:00'));
    expect(removeEntry(ds, `${d}-08:00`).entries).toEqual([]);
  });
  it('upserts projects and places; removing the current place clears it', () => {
    let ds = upsertProject(dataset(), { id: 'p', name: 'A', archived: false });
    ds = upsertProject(ds, { id: 'p', name: 'B', archived: true });
    expect(ds.projects).toEqual([{ id: 'p', name: 'B', archived: true }]);
    ds = upsertPlace(ds, { id: 'x', building: 'HQ', mode: 'office' });
    ds = upsertPlace(ds, { id: 'x', building: 'HQ2', mode: 'office' });
    ds = { ...ds, current: { ...ds.current, placeId: 'x' } };
    ds = removePlace(ds, 'x');
    expect(ds.places).toEqual([]);
    expect(ds.current.placeId).toBeUndefined();
    expect(
      removePlace(upsertPlace(ds, { id: 'y', building: 'B', mode: 'home' }), 'y').current,
    ).toEqual(ds.current);
  });
  it('notes, day marks and settings', () => {
    let ds = addNote(dataset(), { id: 'n', date: d, target: { kind: 'day' }, text: 't' });
    expect(removeNote(ds, 'n').notes).toEqual([]);
    ds = setDayMark(ds, d, 'sick');
    ds = setDayMark(ds, d, 'vacation');
    expect(ds.dayMarks).toEqual([{ date: d, type: 'vacation' }]);
    expect(setDayMark(ds, d, undefined).dayMarks).toEqual([]);
    expect(updateSettings(ds, { locale: 'de' }).settings.locale).toBe('de');
  });
});
