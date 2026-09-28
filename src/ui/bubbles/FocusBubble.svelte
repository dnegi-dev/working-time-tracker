<script lang="ts">
  import { formatMinutes, type Focus } from '../../domain/index.ts';
  import { useUi } from '../state/context.svelte.ts';
  import type { Point } from './layout.ts';
  import Water from './Water.svelte';

  export type FocusState = 'stopped' | 'running' | 'break';
  let {
    at,
    r,
    name,
    minutes,
    focus,
    total,
    mode,
    breakMinutes,
    dragging,
  }: {
    at: Point;
    r: number;
    name: string;
    minutes: number;
    focus: Focus | undefined;
    total: number;
    mode: FocusState;
    breakMinutes: number;
    dragging: boolean;
  } = $props();

  const ui = useUi();
  const full = $derived(mode === 'running' && !!focus?.full);
  const level = $derived(mode === 'break' ? 0 : (focus?.ratio ?? 0));
</script>

<div
  class="focus {mode}"
  class:full
  class:dragging
  style:width="{2 * r}px"
  style:height="{2 * r}px"
  style:transform="translate({at.x - r}px, {at.y - r}px)"
  data-testid="focus-bubble"
  data-state={mode}
  data-full={full}
  data-focus={level.toFixed(2)}
>
  <div class="body">
    <Water {level} moving={mode === 'running'} />
    <div class="label">
      {#if mode === 'break'}
        <span class="title">{ui.t('bubbles.break')}</span>
        <span class="big num" data-testid="break-time">{formatMinutes(breakMinutes)}</span>
        <span class="small">
          <span data-testid="project-current">{name}</span>
          <span class="num" data-testid="project-total">{formatMinutes(minutes)}</span>
        </span>
      {:else}
        <span class="name" data-testid="project-current">{name}</span>
        <span class="big num" data-testid="project-total">{formatMinutes(minutes)}</span>
        {#if focus}
          <span class="small">
            {full
              ? ui.t('bubbles.full')
              : ui.t('bubbles.focus', { elapsed: String(focus.elapsed), total: String(total) })}
          </span>
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  .focus {
    --tone: var(--accent);
    position: absolute;
    left: 0;
    top: 0;
    z-index: 2;
    touch-action: none;
    cursor: grab;
    transition: transform 0.45s cubic-bezier(0.3, 1.4, 0.5, 1);
  }
  .focus.dragging {
    transition: none;
    cursor: grabbing;
  }
  .focus.full {
    --tone: var(--warn);
  }
  .focus.break {
    --tone: var(--calm);
  }
  .body {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
    background: var(--surface);
    border: 3px solid var(--tone);
    box-shadow: 0 8px 28px color-mix(in srgb, var(--tone) 28%, transparent);
    transition:
      border-color 0.5s,
      scale 0.2s;
  }
  .stopped .body {
    border-color: var(--line);
    box-shadow: none;
  }
  .dragging .body {
    scale: 0.55;
    opacity: 0.92;
  }
  .running .body {
    animation: bob 5s ease-in-out infinite;
  }
  .break .body {
    animation: bob 8s ease-in-out infinite;
  }
  .full .body {
    animation:
      bob 5s ease-in-out infinite,
      pulse 2.4s ease-out infinite;
  }
  .label {
    position: absolute;
    inset: 0;
    padding: 14%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 2px;
    user-select: none;
    -webkit-user-select: none;
  }
  .name,
  .title {
    font-weight: 600;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .big {
    font-size: 1.8rem;
    font-weight: 700;
    line-height: 1.1;
  }
  .small {
    font-size: 0.72rem;
    color: var(--muted);
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .full .small {
    color: var(--warn);
    font-weight: 600;
  }
  .stopped .label {
    color: var(--muted);
  }
  @keyframes bob {
    0%,
    100% {
      translate: 0 0;
    }
    50% {
      translate: 0 -6px;
    }
  }
  @keyframes pulse {
    from {
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--tone) 45%, transparent);
    }
    to {
      box-shadow: 0 0 0 18px transparent;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .body {
      animation: none !important;
    }
  }
</style>
