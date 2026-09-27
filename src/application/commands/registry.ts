import { z } from 'zod';
import {
  addNote,
  dateOf,
  setDayMark,
  runningEntry,
  startEntry,
  stopEntry,
  switchPlace,
  switchProject,
  type Dataset,
  type DayType,
  type ISODate,
  type Source,
} from '../../domain/index.ts';
import { findPlace, findProject, status } from '../status.ts';

export interface CommandContext {
  ds: Dataset;
  now: Date;
  newId: () => string;
  holidays: ReadonlySet<ISODate>;
  source: Source;
}

export type CommandResult =
  { ok: true; data: unknown } | { ok: false; status: 400 | 404 | 409; error: string };

export interface CommandDef {
  summary: string;
  params: z.ZodObject;
  /** Ignore a repeated automated trigger within 60 s (NFC/geofence can fire twice). */
  debounce?: boolean;
  run(
    ctx: CommandContext,
    p: Record<string, string | undefined>,
  ): { ds?: Dataset; result: CommandResult };
}

const ref = (what: string) => z.string().min(1).optional().describe(`${what} id or name`);
const startParams = z.object({
  project: ref('Project'),
  place: ref('Place ("Building / Room")'),
  mode: z.enum(['office', 'home']).optional().describe('Used when no place is given'),
});

const ok = (ctx: CommandContext, ds: Dataset) => ({
  ds,
  result: { ok: true as const, data: status(ds, ctx.now, ctx.holidays) },
});
const notFound = (error: string) => ({
  result: { ok: false as const, status: 404 as const, error },
});

function clockIn(ctx: CommandContext, p: Record<string, string | undefined>) {
  const project = findProject(ctx.ds, p.project);
  const place = findPlace(ctx.ds, p.place);
  if (p.project && !project) return notFound(`Unknown project: ${p.project}`);
  if (p.place && !place) return notFound(`Unknown place: ${p.place}`);
  const opts = {
    projectId: project?.id,
    placeId: place?.id,
    mode: p.mode as 'office' | 'home' | undefined,
    source: ctx.source,
  };
  return ok(ctx, startEntry(ctx.ds, opts, ctx.now.toISOString(), ctx.newId()));
}

export const commands = {
  'clock-in': {
    summary: 'Start working (no-op if already running)',
    params: startParams,
    debounce: true,
    run: clockIn,
  },
  'clock-out': {
    summary: 'Stop working (no-op if not running)',
    params: z.object({}),
    debounce: true,
    run: (ctx) => ok(ctx, stopEntry(ctx.ds, ctx.now.toISOString())),
  },
  toggle: {
    summary: 'Start if stopped, stop if running — ideal for one NFC tag',
    params: startParams,
    debounce: true,
    run: (ctx, p) =>
      runningEntry(ctx.ds) ? ok(ctx, stopEntry(ctx.ds, ctx.now.toISOString())) : clockIn(ctx, p),
  },
  'switch-project': {
    summary: 'Continue working on another project',
    params: z.object({ project: z.string().min(1).describe('Project id or name') }),
    run: (ctx, p) => {
      const project = findProject(ctx.ds, p.project);
      if (!project) return notFound(`Unknown project: ${p.project}`);
      const now = ctx.now.toISOString();
      return ok(ctx, switchProject(ctx.ds, project.id, now, ctx.newId(), ctx.source));
    },
  },
  'switch-place': {
    summary: 'Change building/room (office or home follows the place)',
    params: z.object({ place: z.string().min(1).describe('Place id or "Building / Room"') }),
    run: (ctx, p) => {
      const place = findPlace(ctx.ds, p.place);
      if (!place) return notFound(`Unknown place: ${p.place}`);
      const now = ctx.now.toISOString();
      return ok(ctx, switchPlace(ctx.ds, place.id, now, ctx.newId(), ctx.source));
    },
  },
  'add-note': {
    summary: 'Add a note to a day, or to a project if given',
    params: z.object({
      text: z.string().min(1),
      project: ref('Project'),
      date: z.iso.date().optional().describe('Defaults to today'),
    }),
    run: (ctx, p) => {
      const project = findProject(ctx.ds, p.project);
      if (p.project && !project) return notFound(`Unknown project: ${p.project}`);
      const note = {
        id: ctx.newId(),
        date: p.date ?? dateOf(ctx.now.toISOString()),
        target: project
          ? { kind: 'project' as const, projectId: project.id }
          : { kind: 'day' as const },
        text: p.text ?? '',
      };
      return ok(ctx, addNote(ctx.ds, note));
    },
  },
  'mark-day': {
    summary: 'Mark a day as vacation, sick or holiday (none removes the mark)',
    params: z.object({
      type: z.enum(['vacation', 'sick', 'holiday', 'none']),
      date: z.iso.date().optional().describe('Defaults to today'),
    }),
    run: (ctx, p) => {
      const date = p.date ?? dateOf(ctx.now.toISOString());
      const type = p.type === 'none' ? undefined : (p.type as DayType);
      return ok(ctx, setDayMark(ctx.ds, date, type));
    },
  },
  status: {
    summary: 'Current state and today’s hours (read-only)',
    params: z.object({}),
    run: (ctx) => ({ result: { ok: true, data: status(ctx.ds, ctx.now, ctx.holidays) } }),
  },
} satisfies Record<string, CommandDef>;

export type CommandName = keyof typeof commands;

export function isCommand(name: string): name is CommandName {
  return Object.hasOwn(commands, name);
}
