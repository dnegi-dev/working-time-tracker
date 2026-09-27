import {
  balanceBetween,
  dayTarget,
  eachDay,
  entriesOn,
  entryMinutes,
  officeDays,
  periodRange,
  requiredOfficeDays,
  workdays,
  workedOn,
  type ISODate,
} from '../domain/index.ts';
import type { Cell, ExportFormat, ReportTable } from '../ports/index.ts';
import type { AppState } from './app.ts';

export type ReportGoal = 'hours' | 'projects' | 'balance' | 'notes';
export const REPORT_GOALS: ReportGoal[] = ['hours', 'projects', 'balance', 'notes'];
export const EXPORT_FORMATS: ExportFormat[] = ['md', 'csv', 'json', 'xlsx'];

export type Label = (key: string) => string;
const h = (min: number) => Math.round((min / 60) * 100) / 100;

function hours(s: AppState, days: ISODate[], L: Label): ReportTable {
  const now = s.now.toISOString();
  const rows = days
    .map((d) => {
      const entries = entriesOn(s.ds, d);
      const target = dayTarget(s.ds, d, s.holidays);
      if (!entries.length && !target) return undefined;
      const worked = workedOn(s.ds, d, now);
      const mode = [...new Set(entries.map((e) => L(`mode.${e.mode}`)))].join(', ');
      const note = s.ds.notes.filter((n) => n.date === d && n.target.kind === 'day');
      return [
        d,
        h(target),
        h(worked),
        h(worked - target),
        mode,
        note.map((n) => n.text).join(' | '),
      ];
    })
    .filter((r): r is Cell[] => !!r);
  const cols = ['date', 'target', 'worked', 'difference', 'mode', 'note'];
  return { title: L('report.hours'), columns: cols.map((c) => L(`col.${c}`)), rows };
}

function projects(s: AppState, days: ISODate[], L: Label): ReportTable {
  const now = s.now.toISOString();
  const total = new Map<string, { min: number; days: Set<ISODate> }>();
  for (const d of days) {
    for (const e of entriesOn(s.ds, d)) {
      const name = s.ds.projects.find((p) => p.id === e.projectId)?.name ?? L('project.none');
      const t = total.get(name) ?? { min: 0, days: new Set() };
      t.min += entryMinutes(e, now);
      t.days.add(d);
      total.set(name, t);
    }
  }
  const rows = [...total].map(([name, t]) => [name, h(t.min), t.days.size]);
  return {
    title: L('report.projects'),
    columns: ['project', 'hours', 'days'].map((c) => L(`col.${c}`)),
    rows,
  };
}

function balance(s: AppState, from: ISODate, to: ISODate, L: Label): ReportTable {
  const now = s.now.toISOString();
  const rows: Cell[][] = [];
  for (let m = from.slice(0, 7); m <= to.slice(0, 7);) {
    const r = periodRange('month', `${m}-01`);
    const a = r.from < from ? from : r.from;
    const b = r.to > to ? to : r.to;
    const bal = balanceBetween(s.ds, a, b, s.holidays, now);
    const wd = workdays(s.ds, a, b, s.holidays).length;
    rows.push([
      m,
      h(bal.target),
      h(bal.worked),
      h(-bal.remaining),
      wd,
      officeDays(s.ds, a, b).size,
      requiredOfficeDays(s.ds, wd),
    ]);
    const next = new Date(Number(m.slice(0, 4)), Number(m.slice(5)), 1);
    m = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
  }
  const cols = ['month', 'target', 'worked', 'balance', 'workdays', 'officeDays', 'required'];
  return { title: L('report.balance'), columns: cols.map((c) => L(`col.${c}`)), rows };
}

function notes(s: AppState, from: ISODate, to: ISODate, L: Label): ReportTable {
  const rows = s.ds.notes
    .filter((n) => n.date >= from && n.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((n) => {
      const t = n.target;
      const about =
        t.kind === 'day'
          ? L('note.day')
          : (s.ds.projects.find((p) => p.id === t.projectId)?.name ?? '?');
      return [n.date, about, n.text];
    });
  return {
    title: L('report.notes'),
    columns: ['date', 'about', 'text'].map((c) => L(`col.${c}`)),
    rows,
  };
}

export function buildReport(
  s: AppState,
  goals: ReportGoal[],
  from: ISODate,
  to: ISODate,
  L: Label,
): ReportTable[] {
  const days = eachDay(from, to);
  const build: Record<ReportGoal, () => ReportTable> = {
    hours: () => hours(s, days, L),
    projects: () => projects(s, days, L),
    balance: () => balance(s, from, to, L),
    notes: () => notes(s, from, to, L),
  };
  return goals.map((g) => build[g]());
}
