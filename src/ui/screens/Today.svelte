<script lang="ts">
  import { balance, dateOf, entriesOn, formatMinutes, runningEntry } from '../../domain/index.ts';
  import { formatDate } from '../../i18n/index.ts';
  import ContextBar from '../components/ContextBar.svelte';
  import DayMarkSelect from '../components/DayMarkSelect.svelte';
  import EntryList from '../components/EntryList.svelte';
  import NoteList from '../components/NoteList.svelte';
  import { useUi } from '../state/context.svelte.ts';

  const ui = useUi();
  const s = $derived(ui.s);
  const now = $derived(s.now.toISOString());
  const today = $derived(dateOf(now));
  const running = $derived(!!runningEntry(s.ds));
  const bal = $derived(balance(s.ds, 'day', today, s.holidays, now));
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

<section class="hero">
  <button class="big" class:running onclick={toggle} data-testid="toggle">
    {running ? ui.t('today.stop') : ui.t('today.start')}
  </button>
  <div class="total num" data-testid="today-total">{formatMinutes(bal.worked)}</div>
  <div class="muted num" data-testid="today-remaining">
    {bal.remaining >= 0
      ? ui.t('today.left', { time: formatMinutes(bal.remaining) })
      : ui.t('today.over', { time: formatMinutes(-bal.remaining) })}
  </div>
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
  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    margin: 24px 0;
  }
  .big {
    width: 160px;
    height: 160px;
    border-radius: 50%;
    font-size: 1.3rem;
    font-weight: 600;
    background: var(--accent);
    color: var(--accent-text);
    border: none;
    box-shadow: 0 6px 24px color-mix(in srgb, var(--accent) 30%, transparent);
  }
  .big.running {
    background: var(--surface);
    color: var(--accent);
    border: 3px solid var(--accent);
  }
  .total {
    font-size: 2.4rem;
    font-weight: 600;
    margin-top: 12px;
  }
</style>
