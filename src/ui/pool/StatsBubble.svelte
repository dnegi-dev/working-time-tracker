<script lang="ts" module>
  import type { Balance, QuotaStatus } from '../../domain/index.ts';

  export type PoolPeriod = 'week' | 'month' | 'year' | 'all';
  export const POOL_PERIODS: PoolPeriod[] = ['week', 'month', 'year', 'all'];
  export interface PoolStats {
    balance: Balance;
    quota?: QuotaStatus;
    since?: string;
  }
</script>

<script lang="ts">
  import { dayProgress, formatMinutes } from '../../domain/index.ts';
  import { useUi } from '../state/context.svelte.ts';
  import Water from '../bubbles/Water.svelte';
  import type { Point } from '../bubbles/layout.ts';

  /** The big bubble in the middle: hours and office days of the chosen period. */
  let {
    at,
    r,
    period,
    stats,
    onnext,
  }: { at: Point; r: number; period: PoolPeriod; stats: PoolStats; onnext: () => void } = $props();

  const ui = useUi();
  const b = $derived(stats.balance);
  const fill = $derived(period === 'all' ? undefined : dayProgress(b));
  const q = $derived(stats.quota);
</script>

<button
  class="stats"
  class:over={fill?.over}
  style:width="{2 * r}px"
  style:height="{2 * r}px"
  style:transform="translate({at.x - r}px, {at.y - r}px)"
  data-testid="stats-bubble"
  data-period={period}
  aria-label={ui.t('pool.period')}
  onclick={() => {
    ui.platform.haptic('tick');
    onnext();
  }}
>
  <span class="body">
    <Water level={fill?.ratio ?? 0} moving={false} />
    <span class="label">
      <span class="title">{period === 'all' ? ui.t('pool.all') : ui.t(`period.${period}`)}</span>
      <span class="big num">{formatMinutes(b.worked)}</span>
      {#if period === 'all'}
        {#if stats.since}<span class="small">{ui.t('pool.since', { date: stats.since })}</span>{/if}
      {:else}
        <span class="small num" data-testid={`balance-${period}`}>
          {b.remaining < 0
            ? ui.t('pool.over', {
                target: formatMinutes(b.target),
                time: formatMinutes(-b.remaining),
              })
            : ui.t('pool.target', {
                target: formatMinutes(b.target),
                left: formatMinutes(b.remaining),
              })}
        </span>
      {/if}
      {#if q}
        <span class="small num" class:warn={!q.reachable} data-testid={`quota-${period}`}>
          {ui.t('pool.office', { done: q.done, required: q.required })}
        </span>
      {/if}
      <span class="dots" aria-hidden="true">
        {#each POOL_PERIODS as p (p)}<i class:on={p === period}></i>{/each}
      </span>
    </span>
  </span>
</button>

<style>
  .stats {
    --tone: var(--accent);
    position: absolute;
    left: 0;
    top: 0;
    z-index: 2;
    padding: 0;
    min-height: 0;
    border: none;
    background: none;
    color: inherit;
    font: inherit;
    transition-property: transform, width, height;
    transition-duration: 0.6s;
    transition-timing-function: var(--spring);
  }
  .over {
    --tone: var(--warn);
  }
  .body {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
    background: var(--surface);
    border: 3px solid var(--tone);
    box-shadow: 0 8px 28px color-mix(in srgb, var(--tone) 28%, transparent);
    animation: bob 7s ease-in-out infinite;
  }
  .stats:active .body {
    scale: 0.96;
  }
  .label {
    position: absolute;
    inset: 0;
    padding: 12%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    text-align: center;
  }
  .title,
  .small {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .title {
    font-weight: 600;
  }
  .big {
    font-size: 1.8rem;
    font-weight: 700;
    line-height: 1.1;
  }
  .small {
    font-size: 0.7rem;
    color: var(--muted);
  }
  .warn {
    color: var(--warn);
    font-weight: 600;
  }
  .dots {
    display: flex;
    gap: 4px;
    margin-top: 4px;
  }
  .dots i {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--line);
  }
  .dots i.on {
    background: var(--tone);
  }
  @keyframes bob {
    0%,
    100% {
      translate: 0 0;
    }
    50% {
      translate: 0 -5px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .stats {
      transition: none;
    }
    .body {
      animation: none;
    }
  }
</style>
