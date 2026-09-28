<script lang="ts">
  import { untrack } from 'svelte';
  import {
    breakActive,
    dateOf,
    endBreak,
    focusProgress,
    formatMinutes,
    minutesBetween,
    projectMinutesOn,
    queueNext,
    recentProjectIds,
    runningEntry,
    startBreak,
    switchProject,
  } from '../../domain/index.ts';
  import { useUi } from '../state/context.svelte.ts';
  import BubbleField, { type OrbitItem } from './BubbleField.svelte';
  import { loadBreak, saveBreak, type BreakState } from './breakState.ts';

  const MAX = 6;
  const ui = useUi();
  const ds = $derived(ui.s.ds);
  const now = $derived(ui.s.now.toISOString());
  const today = $derived(dateOf(now));
  const running = $derived(!!runningEntry(ds));
  let brk = $state<BreakState>(loadBreak());
  const onBreak = $derived(breakActive(ds, brk.since));
  const mode = $derived(onBreak ? 'break' : running ? 'running' : 'stopped');
  const breakMinutes = $derived(onBreak && brk.since ? minutesBetween(brk.since, now) : 0);
  // During a break the centre speaks for the project the break was taken from.
  const shownId = $derived(onBreak ? (brk.from ?? ds.current.projectId) : ds.current.projectId);
  const focus = $derived(focusProgress(ds, now, brk.lastEnd));
  const current = $derived(ds.current.projectId);
  const others = $derived(recentProjectIds(ds).filter((id) => onBreak || id !== current));
  const shown = $derived(others.length > MAX ? others.slice(0, MAX - 1) : others);
  const rest = $derived(others.slice(shown.length));

  const name = (id: string | undefined) =>
    ds.projects.find((p) => p.id === id)?.name ?? ui.t('project.none');
  const minutes = (id: string | undefined) => projectMinutesOn(ds, today, id, now);

  const items: OrbitItem[] = $derived([
    ...shown.map((id) => ({
      key: id,
      kind: 'project' as const,
      label: name(id),
      sub: formatMinutes(minutes(id)),
    })),
    ...(rest.length
      ? [
          {
            key: 'more',
            kind: 'more' as const,
            label: `+${rest.length}`,
            options: rest.map((id) => ({ id, name: name(id) })),
          },
        ]
      : []),
  ]);

  const full = $derived(mode === 'running' && !!focus?.full);
  let wasFull = untrack(() => full);
  $effect(() => {
    if (full && !wasFull) ui.platform.haptic('success');
    wasFull = full;
  });

  function setBreak(s: BreakState) {
    brk = s;
    saveBreak(s);
  }

  /** A break ends with the next pick, which also starts a fresh focus round. */
  function pick(key: string) {
    const t = new Date().toISOString();
    const since = brk.since;
    if (key === 'break') {
      if (!running || onBreak) return;
      setBreak({ since: t, from: current, lastEnd: brk.lastEnd });
      void ui.app.update((d) => startBreak(d, t));
    } else if (onBreak && since) {
      setBreak({ lastEnd: t });
      void ui.app.update((d, at, newId) => endBreak(d, since, key, at, newId(), 'manual'));
    } else if (key !== current) {
      void ui.app.update((d, at, newId) => switchProject(d, key, at, newId(), 'manual'));
    }
    ui.app.tick();
  }

  /** During a break: remember which project comes next. */
  function queue(key: string) {
    setBreak({ ...brk, next: key });
    void ui.app.update((d) => queueNext(d, key));
  }
</script>

<BubbleField
  center={{
    name: name(shownId),
    minutes: minutes(shownId) - (ds.settings.breakCounts === 'after' ? breakMinutes : 0),
    focus,
    total: ds.settings.focusMinutes,
    mode,
    breakMinutes,
    next: onBreak && brk.next ? name(brk.next) : undefined,
  }}
  {items}
  showBreak={running && !onBreak}
  queued={onBreak ? brk.next : undefined}
  onpick={pick}
  onqueue={queue}
/>
