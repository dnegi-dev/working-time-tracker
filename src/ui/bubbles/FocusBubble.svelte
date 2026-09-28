<script lang="ts">
  import type { Focus } from '../../domain/index.ts';
  import FocusLabel from './FocusLabel.svelte';
  import HoldRing from './HoldRing.svelte';
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
    next,
    dragging,
    targeted,
  }: {
    at: Point;
    r: number;
    name: string;
    minutes: number;
    focus: Focus | undefined;
    total: number;
    mode: FocusState;
    breakMinutes: number;
    next?: string;
    dragging: boolean;
    targeted: boolean;
  } = $props();

  const full = $derived(mode === 'running' && !!focus?.full);
  const level = $derived(mode === 'break' ? 0 : (focus?.ratio ?? 0));
</script>

<div
  class="focus {mode}"
  class:full
  class:dragging
  class:targeted
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
    <FocusLabel
      onBreak={mode === 'break'}
      stopped={mode === 'stopped'}
      {full}
      {name}
      {minutes}
      {focus}
      {total}
      {breakMinutes}
      {next}
    />
    <HoldRing active={targeted} />
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
