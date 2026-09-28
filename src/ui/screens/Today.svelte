<script lang="ts">
  import {
    dateOf,
    endLunch,
    startLunch,
    stopWithLegalBreak,
    upcomingHoliday,
    type Mode,
  } from '../../domain/index.ts';
  import { formatDate } from '../../i18n/index.ts';
  import ProjectBubbles from '../bubbles/ProjectBubbles.svelte';
  import WorkdayBar from '../components/WorkdayBar.svelte';
  import { useUi } from '../state/context.svelte.ts';

  const ui = useUi();
  const today = $derived(dateOf(ui.s.now.toISOString()));
  const holiday = $derived(upcomingHoliday(ui.s.holidayNames, today, 3));
  const holidayText = $derived.by(() => {
    if (!holiday) return '';
    const { name, inDays: days } = holiday;
    if (days === 0) return ui.t('today.holidayToday', { name });
    if (days === 1) return ui.t('today.holidayTomorrow', { name });
    return ui.t('today.holidayIn', { name, days });
  });

  async function run(cmd: string, params: Record<string, string> = {}) {
    const r = await ui.app.run(cmd, params, 'manual');
    if (!r.ok) ui.notify(r.error);
  }

  const start = (mode: Mode) => run('clock-in', { mode });
  const stop = (legal: boolean) =>
    legal ? ui.app.update((ds, now) => stopWithLegalBreak(ds, now)) : run('clock-out');
  const lunch = () => ui.app.update((ds, now) => startLunch(ds, now));
  const resume = () => ui.app.update((ds, now, id) => endLunch(ds, now, id(), 'manual'));

  function onKey(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement).tagName;
    if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tag)) {
      e.preventDefault();
      void run('toggle');
    }
  }
</script>

<svelte:window onkeydown={onKey} />

<div class="today">
  <header>
    <h1>{formatDate(today, ui.locale, { weekday: 'long', day: 'numeric', month: 'long' })}</h1>
    {#if holiday}<p class="muted" data-testid="holiday">{holidayText}</p>{/if}
  </header>
  <WorkdayBar onstart={start} onstop={stop} onlunch={lunch} onresume={resume} />
  <ProjectBubbles />
</div>

<style>
  .today {
    display: flex;
    flex-direction: column;
    /* fill the screen between the top padding and the tab bar */
    min-height: calc(100dvh - 112px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  }
  @media (min-width: 768px) {
    .today {
      min-height: calc(100dvh - 64px);
    }
  }
</style>
