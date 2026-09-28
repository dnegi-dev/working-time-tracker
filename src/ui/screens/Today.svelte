<script lang="ts">
  import { dateOf } from '../../domain/index.ts';
  import { formatDate } from '../../i18n/index.ts';
  import ProjectBubbles from '../bubbles/ProjectBubbles.svelte';
  import WorkdayBar from '../components/WorkdayBar.svelte';
  import { useUi } from '../state/context.svelte.ts';

  const ui = useUi();
  const today = $derived(dateOf(ui.s.now.toISOString()));
  const holiday = $derived(ui.s.holidayNames.get(today));

  async function toggle() {
    const r = await ui.app.run('toggle', {}, 'manual');
    if (!r.ok) ui.notify(r.error);
  }

  function onKey(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement).tagName;
    if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tag)) {
      e.preventDefault();
      void toggle();
    }
  }
</script>

<svelte:window onkeydown={onKey} />

<div class="today">
  <header>
    <h1>{formatDate(today, ui.locale, { weekday: 'long', day: 'numeric', month: 'long' })}</h1>
    {#if holiday}<p class="muted" data-testid="holiday">{holiday}</p>{/if}
  </header>
  <WorkdayBar ontoggle={toggle} />
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
