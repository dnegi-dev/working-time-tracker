<script lang="ts">
  import { untrack } from 'svelte';
  import {
    dateOf,
    focusProgress,
    formatMinutes,
    minutesBetween,
    projectMinutesOn,
    recentProjectIds,
    runningEntry,
    streakStart,
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
  const streak = $derived(streakStart(ds));
  // A break only counts while the streak it was taken in is still running.
  const onBreak = $derived(!!(streak && brk.since && brk.since >= streak));
  const mode = $derived(onBreak ? 'break' : running ? 'running' : 'stopped');
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

  /** Break keeps the project running; the next pick ends it and starts a fresh focus round. */
  function pick(key: string) {
    const t = new Date().toISOString();
    if (key === 'break') {
      if (running && !onBreak) setBreak({ since: t, lastEnd: brk.lastEnd });
    } else {
      if (onBreak) setBreak({ lastEnd: t });
      if (key !== current) {
        void ui.app.update((d, at, newId) => switchProject(d, key, at, newId(), 'manual'));
      }
    }
    ui.app.tick();
  }
</script>

<BubbleField
  center={{
    name: name(current),
    minutes: minutes(current),
    focus,
    total: ds.settings.focusMinutes,
    mode,
    breakMinutes: onBreak && brk.since ? minutesBetween(brk.since, now) : 0,
  }}
  {items}
  showBreak={running && !onBreak}
  onpick={pick}
/>
