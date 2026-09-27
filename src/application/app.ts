import { z } from 'zod';
import {
  emptyDataset,
  splitAtMidnight,
  type Dataset,
  type ISODate,
  type Instant,
  type Source,
} from '../domain/index.ts';
import type { Clock, HolidayProvider, Repository } from '../ports/index.ts';
import { commands, isCommand, type CommandDef, type CommandResult } from './commands/registry.ts';

export interface AppDeps {
  repo: Repository;
  clock: Clock;
  holidays: HolidayProvider;
  newId?: () => string;
  locale?: 'de' | 'en';
}

export interface AppState {
  ds: Dataset;
  holidays: ReadonlySet<ISODate>;
  holidayNames: ReadonlyMap<ISODate, string>;
  now: Date;
}

export type Mutation = (ds: Dataset, now: Instant, newId: () => string) => Dataset;
export type App = ReturnType<typeof createApp>;

const DEBOUNCE_MS = 60_000;

export function createApp(deps: AppDeps) {
  const newId = deps.newId ?? (() => crypto.randomUUID());
  const listeners = new Set<(s: AppState) => void>();
  const loadedYears = new Set<string>();
  const names = new Map<ISODate, string>();
  let repo = deps.repo;
  let queue = Promise.resolve();
  let state: AppState = {
    ds: emptyDataset(deps.locale),
    holidays: new Set(),
    holidayNames: names,
    now: deps.clock.now(),
  };

  function emit(patch: Partial<AppState>) {
    state = { ...state, ...patch, now: deps.clock.now() };
    listeners.forEach((fn) => fn(state));
  }

  async function ensureYear(year: number) {
    const key = `${state.ds.settings.region}:${year}`;
    if (loadedYears.has(key)) return;
    loadedYears.add(key);
    for (const h of await deps.holidays.forYear(state.ds.settings.region, year)) {
      names.set(h.date, h.name);
    }
    emit({ holidays: new Set(names.keys()), holidayNames: new Map(names) });
  }

  /** Serialize writes so rapid triggers can't interleave. */
  function commit(ds: Dataset): Promise<void> {
    queue = queue.then(() => repo.save(ds));
    emit({ ds });
    return queue;
  }

  /** Give each day its own time when tracking runs past midnight. */
  function rollover(): Promise<void> {
    const ds = splitAtMidnight(state.ds, deps.clock.now().toISOString(), newId);
    return ds === state.ds ? queue : commit(ds);
  }

  async function run(name: string, raw: Record<string, string>, source: Source) {
    if (!isCommand(name)) {
      return { ok: false, status: 404, error: `Unknown command: ${name}` } as CommandResult;
    }
    const def: CommandDef = commands[name];
    const parsed = def.params.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, status: 400, error: z.prettifyError(parsed.error) } as CommandResult;
    }
    await rollover();
    const now = deps.clock.now();
    const auto = def.debounce && source !== 'manual';
    const last = state.ds.lastTrigger;
    if (auto && last?.cmd === name && now.getTime() - Date.parse(last.at) < DEBOUNCE_MS) {
      return { ok: true, data: { ignored: 'duplicate trigger within 60s' } } as CommandResult;
    }
    const ctx = { ds: state.ds, now, newId, holidays: state.holidays, source };
    const { ds, result } = def.run(ctx, parsed.data as Record<string, string>);
    if (ds && result.ok) {
      await commit(auto ? { ...ds, lastTrigger: { cmd: name, at: now.toISOString() } } : ds);
    }
    return result;
  }

  return {
    subscribe(fn: (s: AppState) => void) {
      listeners.add(fn);
      fn(state);
      return () => void listeners.delete(fn);
    },
    get state() {
      return state;
    },
    async init() {
      emit({ ds: (await repo.load()) ?? state.ds });
      await rollover();
      await ensureYear(state.now.getFullYear());
    },
    run,
    ensureYear,
    update(fn: Mutation) {
      void rollover();
      const before = state.ds.settings;
      const ds = fn(state.ds, deps.clock.now().toISOString(), newId);
      const regionChanged =
        before.region !== ds.settings.region ||
        JSON.stringify(before.holidaySource) !== JSON.stringify(ds.settings.holidaySource);
      if (regionChanged) {
        loadedYears.clear();
        names.clear();
      }
      const saved = commit(ds);
      if (regionChanged) void ensureYear(state.now.getFullYear());
      return saved;
    },
    /** Switch storage backend and write the current data into it. */
    async useRepository(next: Repository) {
      repo = next;
      await commit(state.ds);
    },
    tick() {
      void rollover();
      emit({});
    },
  };
}
