<script lang="ts">
  import { balance, dateOf, formatMinutes, runningEntry } from '../../domain/index.ts';
  import { useUi } from '../state/context.svelte.ts';
  import SlideHold from './SlideHold.svelte';

  let { ontoggle }: { ontoggle: () => void } = $props();
  const ui = useUi();
  const now = $derived(ui.s.now.toISOString());
  const running = $derived(!!runningEntry(ui.s.ds));
  const bal = $derived(balance(ui.s.ds, 'day', dateOf(now), ui.s.holidays, now));
</script>

<section class="card" class:running>
  <h2>{ui.t('today.workday')}</h2>
  <div class="total num" data-testid="today-total">{formatMinutes(bal.worked)}</div>
  <div class="muted num small" data-testid="today-remaining">
    {bal.remaining >= 0
      ? ui.t('today.left', { time: formatMinutes(bal.remaining) })
      : ui.t('today.over', { time: formatMinutes(-bal.remaining) })}
  </div>
  <SlideHold
    label={running ? ui.t('today.stop') : ui.t('today.start')}
    hint={running ? ui.t('today.slideStop') : ui.t('today.slideStart')}
    active={running}
    onconfirm={ontoggle}
    testid="toggle"
  />
</section>

<style>
  .card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    justify-content: space-between;
  }
  h2 {
    margin: 0;
    font-size: 0.9rem;
  }
  .total {
    font-size: 2rem;
    font-weight: 600;
  }
  .small {
    font-size: 0.8rem;
  }
</style>
