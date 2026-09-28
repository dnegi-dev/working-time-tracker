<script lang="ts">
  import { balance, dateOf, dayProgress, formatMinutes, runningEntry } from '../../domain/index.ts';
  import { useUi } from '../state/context.svelte.ts';
  import SlideHold from './SlideHold.svelte';

  let { ontoggle }: { ontoggle: () => void } = $props();
  const ui = useUi();
  const now = $derived(ui.s.now.toISOString());
  const running = $derived(!!runningEntry(ui.s.ds));
  const bal = $derived(balance(ui.s.ds, 'day', dateOf(now), ui.s.holidays, now));
  const progress = $derived(dayProgress(bal));
</script>

<section class="bar" class:over={progress.over} data-testid="workday-bar" data-over={progress.over}>
  <SlideHold
    label={running ? ui.t('today.stop') : ui.t('today.start')}
    hint={running ? ui.t('today.slideStop') : ui.t('today.slideStart')}
    active={running}
    tone={progress.over ? 'var(--warn)' : undefined}
    onconfirm={ontoggle}
    testid="toggle"
  >
    {#snippet children(drag)}
      <div
        class="progress"
        role="progressbar"
        aria-label={ui.t('today.workday')}
        aria-valuemin={0}
        aria-valuenow={bal.worked}
        aria-valuemax={bal.target}
        style:width="{progress.ratio * 100}%"
      ></div>
      <div class="text" style:opacity={1 - drag * 1.6}>
        <span class="numbers">
          <span class="total num" data-testid="today-total">{formatMinutes(bal.worked)}</span>
          <span class="left num" data-testid="today-remaining">
            {bal.remaining >= 0
              ? ui.t('today.left', { time: formatMinutes(bal.remaining) })
              : ui.t('today.over', { time: formatMinutes(-bal.remaining) })}
          </span>
        </span>
        <span class="hint">{running ? ui.t('today.slideStop') : ui.t('today.slideStart')}</span>
      </div>
    {/snippet}
  </SlideHold>
</section>

<style>
  .bar {
    margin: 12px 0 16px;
  }
  .progress {
    position: absolute;
    inset: 0 auto 0 0;
    background: color-mix(in srgb, var(--t) 16%, transparent);
    border-right: 2px solid color-mix(in srgb, var(--t) 60%, transparent);
    transition:
      width 0.6s ease,
      background-color 0.4s,
      border-color 0.4s;
    pointer-events: none;
  }
  .text {
    position: absolute;
    inset: 0 16px 0 74px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    pointer-events: none;
  }
  .numbers {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .total {
    font-size: 1.45rem;
    font-weight: 700;
    line-height: 1.1;
  }
  .left {
    font-size: 0.75rem;
    color: var(--muted);
    white-space: nowrap;
  }
  .over .left {
    color: var(--warn);
    font-weight: 600;
  }
  .hint {
    font-size: 0.8rem;
    font-weight: 600;
    white-space: nowrap;
    color: transparent;
    background: linear-gradient(
        100deg,
        var(--t) 40%,
        color-mix(in srgb, var(--t) 25%, var(--surface)) 50%,
        var(--t) 60%
      )
      0 0 / 250% 100%;
    background-clip: text;
    -webkit-background-clip: text;
    animation: shine 2.8s linear infinite;
  }
  @keyframes shine {
    from {
      background-position: 100% 0;
    }
    to {
      background-position: -150% 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .hint {
      animation: none;
      color: var(--t);
    }
  }
</style>
