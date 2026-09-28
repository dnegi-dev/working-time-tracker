<script lang="ts">
  import { dateOf, entriesOn } from '../../domain/index.ts';
  import { formatDate } from '../../i18n/index.ts';
  import ContextBar from '../components/ContextBar.svelte';
  import DayMarkSelect from '../components/DayMarkSelect.svelte';
  import EntryList from '../components/EntryList.svelte';
  import NoteList from '../components/NoteList.svelte';
  import ProjectTimer from '../components/ProjectTimer.svelte';
  import WorkdayTimer from '../components/WorkdayTimer.svelte';
  import { useUi } from '../state/context.svelte.ts';

  const ui = useUi();
  const s = $derived(ui.s);
  const now = $derived(s.now.toISOString());
  const today = $derived(dateOf(now));
  const holiday = $derived(s.holidayNames.get(today));

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

<header>
  <h1>{formatDate(today, ui.locale, { weekday: 'long', day: 'numeric', month: 'long' })}</h1>
  {#if holiday}<p class="muted" data-testid="holiday">{holiday}</p>{/if}
</header>

<section class="timers">
  <WorkdayTimer ontoggle={toggle} />
  <ProjectTimer />
</section>

<ContextBar />
<EntryList date={today} entries={entriesOn(s.ds, today)} />

<h2>{ui.t('today.note')}</h2>
<NoteList
  date={today}
  target={{ kind: 'day' }}
  filter={(n) => n.date === today && n.target.kind === 'day'}
/>

<h2>{ui.t('today.dayType')}</h2>
<DayMarkSelect date={today} />

<style>
  .timers {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 16px 0;
  }
</style>
