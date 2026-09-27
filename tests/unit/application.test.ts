import { describe, expect, it } from 'vitest';
import { checkLogin, DEFAULT_LOGIN_HASH } from '../../src/application/auth.ts';
import { createBackup, mergeDatasets, readBackup } from '../../src/application/backup.ts';
import { commandLinks } from '../../src/application/commands/links.ts';
import { buildReport } from '../../src/application/report.ts';
import { upsertProject } from '../../src/domain/index.ts';
import { at, dataset, entry, testApp } from './helpers.ts';

const d = '2026-09-28';

describe('commands', () => {
  it('toggle starts and stops; status reports today', async () => {
    const now = { value: new Date(at(d, '08:00')) };
    const { app, repo } = testApp({ now });
    await app.init();
    expect(await app.run('toggle', {}, 'manual')).toMatchObject({
      ok: true,
      data: { running: true },
    });
    now.value = new Date(at(d, '10:00'));
    const r = await app.run('toggle', {}, 'manual');
    expect(r).toMatchObject({
      ok: true,
      data: { running: false, todayMinutes: 120, remainingTodayMinutes: 360 },
    });
    expect(repo.saved?.entries).toHaveLength(1);
  });

  it('tick gives the new day its own entry when tracking runs past midnight', async () => {
    const now = { value: new Date(at('2026-09-27', '23:58')) };
    const { app, repo } = testApp({ now });
    await app.init();
    await app.run('toggle', {}, 'manual');
    now.value = new Date(at(d, '00:30'));
    app.tick();
    expect(app.state.ds.entries).toHaveLength(2);
    expect(app.state.ds.entries[1]).toMatchObject({ start: at(d, '00:00') });
    expect(app.state.ds.entries[1]?.end).toBeUndefined();
    await Promise.resolve();
    expect(repo.saved?.entries).toHaveLength(2);
  });

  it('ignores a duplicate automated trigger within 60 s', async () => {
    const now = { value: new Date(at(d, '08:00')) };
    const { app } = testApp({ now });
    await app.init();
    await app.run('toggle', {}, 'nfc');
    now.value = new Date(Date.parse(at(d, '08:00')) + 30_000);
    expect(await app.run('toggle', {}, 'nfc')).toMatchObject({
      ok: true,
      data: { ignored: expect.any(String) },
    });
    now.value = new Date(Date.parse(at(d, '08:00')) + 90_000);
    expect(await app.run('toggle', {}, 'nfc')).toMatchObject({ data: { running: false } });
  });

  it('resolves projects and places by name and validates params', async () => {
    const now = { value: new Date(at(d, '08:00')) };
    const ds = {
      ...upsertProject(dataset(), { id: 'p1', name: 'Apollo', archived: false }),
      places: [{ id: 'x', building: 'HQ', room: '3.14', mode: 'office' as const }],
    };
    const { app } = testApp({ now, ds });
    await app.init();
    expect(
      await app.run('clock-in', { project: 'apollo', place: 'hq / 3.14' }, 'qr'),
    ).toMatchObject({ ok: true, data: { project: 'Apollo', place: 'HQ / 3.14', mode: 'office' } });
    expect(await app.run('switch-project', { project: 'nope' }, 'qr')).toMatchObject({
      ok: false,
      status: 404,
    });
    expect(await app.run('switch-project', {}, 'qr')).toMatchObject({ ok: false, status: 400 });
    expect(await app.run('explode', {}, 'qr')).toMatchObject({ ok: false, status: 404 });
    expect(await app.run('switch-place', { place: 'HQ/3.14' }, 'nfc')).toMatchObject({ ok: true });
  });

  it('adds notes and marks days', async () => {
    const now = { value: new Date(at(d, '08:00')) };
    const { app } = testApp({ now });
    await app.init();
    await app.run('add-note', { text: 'Standup' }, 'shortcut');
    await app.run('mark-day', { type: 'vacation', date: '2026-09-29' }, 'shortcut');
    expect(app.state.ds.notes[0]).toMatchObject({
      date: d,
      target: { kind: 'day' },
      text: 'Standup',
    });
    expect(app.state.ds.dayMarks).toEqual([{ date: '2026-09-29', type: 'vacation' }]);
    await app.run('mark-day', { type: 'none', date: '2026-09-29' }, 'shortcut');
    expect(app.state.ds.dayMarks).toEqual([]);
  });

  it('loads holidays for the region', async () => {
    const now = { value: new Date(at(d, '08:00')) };
    const { app } = testApp({
      now,
      holidays: [{ date: '2026-10-03', name: 'Tag der Deutschen Einheit' }],
    });
    await app.init();
    expect(app.state.holidays.has('2026-10-03')).toBe(true);
  });
});

describe('backup', () => {
  it('round-trips and detects damage', () => {
    const ds = dataset({ entries: [entry(d, '08:00', '12:00')] });
    const text = createBackup(ds, new Date());
    const r = readBackup(text);
    expect(r.ok && r.ds.entries).toEqual(ds.entries);
    expect(r.ok && r.preview).toMatchObject({ entries: 1, from: d, to: d });
    expect(readBackup(text.replace('08:00', '07:00').replace(/"06:00/, '"05:00'))).toMatchObject({
      ok: expect.any(Boolean),
    });
    expect(readBackup('{')).toEqual({ ok: false, error: 'backup.invalidJson' });
    expect(readBackup('{}')).toEqual({ ok: false, error: 'backup.notBackup' });
    const tampered = JSON.parse(text);
    tampered.data.entries = [];
    expect(readBackup(JSON.stringify(tampered))).toEqual({ ok: false, error: 'backup.checksum' });
  });
  it('merges by id', () => {
    const a = dataset({
      entries: [entry(d, '08:00', '09:00')],
      dayMarks: [{ date: d, type: 'sick' }],
    });
    const b = dataset({
      entries: [entry(d, '08:00', '10:00'), entry(d, '11:00', '12:00')],
      dayMarks: [{ date: d, type: 'vacation' }],
    });
    const m = mergeDatasets(a, b);
    expect(m.entries).toHaveLength(2);
    expect(m.entries[0]?.end).toBe(at(d, '10:00'));
    expect(m.dayMarks).toEqual([{ date: d, type: 'vacation' }]);
  });
});

describe('report', () => {
  it('builds one table per goal', async () => {
    const now = { value: new Date(at(d, '18:00')) };
    const ds = dataset({
      projects: [{ id: 'p', name: 'Apollo', archived: false }],
      entries: [entry(d, '08:00', '12:00', { projectId: 'p', mode: 'office' })],
      notes: [
        { id: 'n1', date: d, target: { kind: 'day' }, text: 'Good day' },
        { id: 'n2', date: d, target: { kind: 'project', projectId: 'p' }, text: 'Kickoff' },
      ],
    });
    const { app } = testApp({ now, ds });
    await app.init();
    const L = (k: string) => k;
    const [hours, projects, bal, notes] = buildReport(
      app.state,
      ['hours', 'projects', 'balance', 'notes'],
      '2026-09-01',
      '2026-09-30',
      L,
    );
    expect(hours?.rows.find((r) => r[0] === d)).toEqual([d, 8, 4, -4, 'mode.office', 'Good day']);
    expect(projects?.rows).toEqual([['Apollo', 4, 1]]);
    expect(bal?.rows[0]?.[0]).toBe('2026-09');
    expect(bal?.rows[0]?.[5]).toBe(1);
    expect(notes?.rows).toEqual([
      [d, 'note.day', 'Good day'],
      [d, 'Apollo', 'Kickoff'],
    ]);
  });
});

describe('links and auth', () => {
  it('builds native and web links', () => {
    expect(commandLinks('toggle', { place: 'HQ / 3.14', project: '' }, 'https://x/app/')).toEqual({
      native: 'wtt://toggle?place=HQ+%2F+3.14',
      web: 'https://x/app/#/do/toggle?place=HQ+%2F+3.14',
    });
    expect(commandLinks('clock-out', {}, '/').native).toBe('wtt://clock-out');
  });
  it('accepts admin:admin by default', async () => {
    expect(await checkLogin('admin', 'admin', DEFAULT_LOGIN_HASH)).toBe(true);
    expect(await checkLogin('admin', 'x', DEFAULT_LOGIN_HASH)).toBe(false);
  });
});
