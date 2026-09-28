import { describe, expect, it } from 'vitest';
import {
  addDays,
  balance,
  breakDeduction,
  dayProgress,
  dayTarget,
  eachDay,
  formatMinutes,
  migrate,
  netMinutes,
  periodRange,
  quotaStatus,
  requiredOfficeDays,
  upcomingHoliday,
  weekday,
  workdays,
} from '../../src/domain/index.ts';
import { at, dataset, entry } from './helpers.ts';

describe('time', () => {
  it('computes weekdays and ranges (Mon = 0)', () => {
    expect(weekday('2026-09-28')).toBe(0);
    expect(periodRange('week', '2026-10-01')).toEqual({ from: '2026-09-28', to: '2026-10-04' });
    expect(periodRange('month', '2026-02-10')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(periodRange('year', '2026-06-01')).toEqual({ from: '2026-01-01', to: '2026-12-31' });
    expect(periodRange('day', '2026-06-01')).toEqual({ from: '2026-06-01', to: '2026-06-01' });
    expect(eachDay('2026-12-30', '2027-01-02')).toHaveLength(4);
    expect(addDays('2026-03-31', 1)).toBe('2026-04-01');
  });
  it('formats minutes as h:mm', () => {
    expect(formatMinutes(125)).toBe('2:05');
    expect(formatMinutes(-30)).toBe('-0:30');
  });
});

describe('breaks', () => {
  const rule = { enabled: true, after6h: 30, after9h: 45 };
  it('deducts only the missing part of the legal break', () => {
    expect(breakDeduction(5 * 60, 0, rule)).toBe(0);
    expect(breakDeduction(7 * 60, 0, rule)).toBe(30);
    expect(breakDeduction(7 * 60, 20, rule)).toBe(10);
    expect(breakDeduction(10 * 60, 0, rule)).toBe(45);
    expect(breakDeduction(10 * 60, 0, { ...rule, enabled: false })).toBe(0);
  });
  it('counts gaps of 15+ minutes between entries as breaks', () => {
    const d = '2026-09-28';
    const entries = [entry(d, '08:00', '12:00'), entry(d, '12:30', '16:00')];
    expect(netMinutes(entries, rule, at(d, '18:00'))).toBe(450); // 7.5 h, 30 min gap taken
    const noGap = [entry(d, '08:00', '12:00'), entry(d, '12:05', '16:00')];
    expect(netMinutes(noGap, rule, at(d, '18:00'))).toBe(475 - 30);
  });
  it('counts running entries up to now', () => {
    const d = '2026-09-28';
    expect(netMinutes([entry(d, '08:00', undefined)], rule, at(d, '09:30'))).toBe(90);
  });
  it('deducts the legal break only once the day is stopped', () => {
    const d = '2026-09-28';
    expect(netMinutes([entry(d, '08:00', undefined)], rule, at(d, '15:00'))).toBe(420);
    expect(netMinutes([entry(d, '08:00', '15:00')], rule, at(d, '15:00'))).toBe(390);
  });
});

describe('targets and balance', () => {
  const holidays = new Set(['2026-10-03']);
  it('has no target on weekends, holidays and marked days', () => {
    const ds = dataset({ dayMarks: [{ date: '2026-09-29', type: 'vacation' }] });
    expect(dayTarget(ds, '2026-09-28', holidays)).toBe(480);
    expect(dayTarget(ds, '2026-09-29', holidays)).toBe(0);
    expect(dayTarget(ds, '2026-10-03', holidays)).toBe(0);
    expect(dayTarget(ds, '2026-10-04', holidays)).toBe(0);
  });
  it('computes remaining time per period', () => {
    const d = '2026-09-28';
    const ds = dataset({ entries: [entry(d, '08:00', '12:00')] });
    const now = at(d, '13:00');
    expect(balance(ds, 'day', d, holidays, now)).toEqual({
      target: 480,
      worked: 240,
      remaining: 240,
    });
    expect(balance(ds, 'week', d, holidays, now).target).toBe(5 * 480);
  });
  it('turns worked time into progress and flags overtime', () => {
    const p = (target: number, worked: number) =>
      dayProgress({ target, worked, remaining: target - worked });
    expect(p(480, 240)).toEqual({ ratio: 0.5, over: false });
    expect(p(480, 480)).toEqual({ ratio: 1, over: false });
    expect(p(480, 540)).toEqual({ ratio: 1, over: true });
    expect(p(0, 0)).toEqual({ ratio: 0, over: false });
    expect(p(0, 30)).toEqual({ ratio: 1, over: true });
  });
});

describe('upcoming holiday', () => {
  const names = new Map([['2026-10-03', 'German Unity Day']]);
  it('shows a holiday from today up to three days ahead', () => {
    expect(upcomingHoliday(names, '2026-10-03')).toEqual({
      date: '2026-10-03',
      name: 'German Unity Day',
      inDays: 0,
    });
    expect(upcomingHoliday(names, '2026-09-30')?.inDays).toBe(3);
    expect(upcomingHoliday(names, '2026-09-29')).toBeUndefined();
    expect(upcomingHoliday(names, '2026-10-04')).toBeUndefined();
  });
});

describe('office quota', () => {
  // October 2026 in NRW: 22 weekdays, 3 Oct is a Saturday → 22 workdays
  const month = '2026-10-15';
  it('derives required office days from workdays and days per week', () => {
    const ds = dataset();
    const days = workdays(ds, '2026-10-01', '2026-10-31', new Set());
    expect(days).toHaveLength(22);
    expect(requiredOfficeDays(ds, 22)).toBe(9); // 22 × 2/5 = 8.8 → 9
    expect(
      requiredOfficeDays(
        dataset({ settings: { ...ds.settings, quota: { kind: 'maxHomePercent', value: 60 } } }),
        22,
      ),
    ).toBe(9);
  });
  it('holidays and vacation reduce the required days', () => {
    const ds = dataset({
      dayMarks: ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16'].map(
        (date) => ({ date, type: 'vacation' as const }),
      ),
    });
    expect(quotaStatus(ds, 'month', month, new Set()).required).toBe(7); // 17 × 0.4 = 6.8
  });
  it('tracks done, needed and days left', () => {
    const ds = dataset({
      entries: [
        entry('2026-10-01', '09:00', '17:00', { mode: 'office' }),
        entry('2026-10-02', '09:00', '17:00'),
      ],
    });
    const q = quotaStatus(ds, 'month', '2026-10-05', new Set());
    expect(q).toMatchObject({ workdays: 22, required: 9, done: 1, needed: 8, reachable: true });
    expect(q.daysLeft).toBe(20);
  });
});

describe('migrate', () => {
  it('fills defaults for missing fields', () => {
    const ds = migrate({ entries: [], settings: { locale: 'en' } });
    expect(ds.settings.locale).toBe('en');
    expect(ds.settings.quota.kind).toBe('officeDaysPerWeek');
    expect(ds.projects).toEqual([]);
    expect(migrate(undefined).schemaVersion).toBe(1);
  });
});
