<script lang="ts">
  import {
    balance,
    dateOf,
    dayProgress,
    formatMinutes,
    lunchActive,
    missingBreak,
    runningEntry,
    type Mode,
  } from '../../domain/index.ts';
  import { useUi } from '../state/context.svelte.ts';
  import type { SliderState, Target } from './workday/sliderGesture.ts';
  import WorkdaySlider from './workday/WorkdaySlider.svelte';

  let {
    onstart,
    onstop,
    onlunch,
    onresume,
  }: {
    onstart: (mode: Mode) => void;
    onstop: (legal: boolean) => void;
    onlunch: () => void;
    onresume: () => void;
  } = $props();

  const LABEL = { idle: 'today.start', running: 'today.stop', lunch: 'today.resume' } as const;
  const HINT = {
    idle: 'today.hintIdle',
    running: 'today.hintRunning',
    lunch: 'today.hintLunch',
  } as const;
  const ARIA = {
    idle: 'today.ariaIdle',
    running: 'today.ariaRunning',
    lunch: 'today.ariaLunch',
  } as const;
  const ui = useUi();
  const now = $derived(ui.s.now.toISOString());
  const run = $derived(runningEntry(ui.s.ds));
  const phase: SliderState = $derived(
    run ? 'running' : lunchActive(ui.s.ds, now) ? 'lunch' : 'idle',
  );
  const mode = $derived(run?.mode ?? ui.s.ds.current.mode);
  const bal = $derived(balance(ui.s.ds, 'day', dateOf(now), ui.s.holidays, now));
  const progress = $derived(dayProgress(bal));

  function confirm(t: Target) {
    if (t === 'home' || t === 'office') onstart(t);
    else if (t === 'stop' || t === 'stopLegal') onstop(t === 'stopLegal');
    else if (t === 'lunch') onlunch();
    else onresume();
  }
</script>

<section
  class="bar"
  class:over={progress.over}
  data-testid="workday-bar"
  data-over={progress.over}
  data-state={phase}
  data-mode={mode}
>
  <WorkdaySlider
    {phase}
    label={ui.t(LABEL[phase])}
    aria={ui.t(ARIA[phase])}
    legal={missingBreak(ui.s.ds, now)}
    tone={progress.over ? 'var(--warn)' : undefined}
    onconfirm={confirm}
  >
    {#snippet children(drag)}
      <div
        class="progress"
        class:empty={!progress.ratio}
        role="progressbar"
        aria-label={ui.t('today.workday')}
        aria-valuemin={0}
        aria-valuenow={bal.worked}
        aria-valuemax={bal.target}
        style:width="{progress.ratio * 100}%"
      ></div>
      <div class="text {phase}" style:opacity={Math.max(0, 1 - drag * 1.6)}>
        <span class="numbers">
          <span class="total num" data-testid="today-total">{formatMinutes(bal.worked)}</span>
          <span class="left num" data-testid="today-remaining">
            {bal.remaining >= 0
              ? ui.t('today.left', { time: formatMinutes(bal.remaining) })
              : ui.t('today.over', { time: formatMinutes(-bal.remaining) })}
          </span>
        </span>
        <span class="side">
          {#if phase === 'running'}
            <span class="mode" data-testid="today-mode">
              {ui.t(mode === 'office' ? 'mode.office' : 'mode.home')}
            </span>
          {/if}
          <span class="hint">{ui.t(HINT[phase])}</span>
        </span>
      </div>
    {/snippet}
  </WorkdaySlider>
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
  .progress.empty {
    border-right-color: transparent;
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
  .text.running {
    inset: 0 74px 0 16px;
  }
  .text.lunch {
    inset: 0 16px;
  }
  .numbers,
  .side {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .side {
    align-items: flex-end;
    text-align: end;
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
  .mode {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .hint {
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.25;
    color: var(--t);
  }
</style>
