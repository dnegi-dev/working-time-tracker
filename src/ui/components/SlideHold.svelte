<script lang="ts">
  import type { Snippet } from 'svelte';
  import { HOLD_MS } from '../bubbles/gesture.ts';
  import { useUi } from '../state/context.svelte.ts';

  let {
    label,
    hint,
    active = false,
    onconfirm,
    testid,
    tone,
    children,
  }: {
    label: string;
    hint: string;
    active?: boolean;
    onconfirm: () => void;
    testid: string;
    /** Colour for track, knob and fill; defaults to the accent. */
    tone?: string;
    /** Content inside the track, behind the knob; gets how far the knob is dragged (0–1). */
    children?: Snippet<[number]>;
  } = $props();

  const KNOB = 56;
  const ui = useUi();
  let track: HTMLDivElement;
  let x = $state(0);
  let max = $state(1);
  let dragging = $state(false);
  let holding = $state(false);
  let done = $state(false);
  let startX = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function down(e: PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    max = track.clientWidth - KNOB - 4;
    startX = e.clientX - x;
    dragging = true;
  }

  function move(e: PointerEvent) {
    if (!dragging) return;
    x = Math.min(max, Math.max(0, e.clientX - startX));
    const atEnd = x >= max - 4;
    if (atEnd && !holding) {
      holding = true;
      ui.platform.haptic('tick');
      timer = setTimeout(confirm, HOLD_MS);
    } else if (!atEnd && holding) {
      reset(false);
    }
  }

  function confirm() {
    reset(true);
    ui.platform.haptic('success');
    done = true;
    setTimeout(() => (done = false), 500);
    onconfirm();
  }

  function reset(release: boolean) {
    clearTimeout(timer);
    holding = false;
    if (release) {
      dragging = false;
      x = 0;
    }
  }
</script>

<div class="track" class:active class:done style:--tone={tone} bind:this={track}>
  {@render children?.(x / max)}
  <div class="fill" class:dragging class:holding style:width="{x + KNOB + 4}px"></div>
  <button
    class="knob"
    class:dragging
    class:holding
    style:transform="translateX({x}px)"
    onpointerdown={down}
    onpointermove={move}
    onpointerup={() => reset(true)}
    onpointercancel={() => reset(true)}
    data-testid={testid}
    aria-label={hint}
  >
    <svg viewBox="0 0 56 56" aria-hidden="true">
      <circle class="ring" cx="28" cy="28" r="25" pathLength="1" />
      <path d="M24 19l9 9-9 9" />
    </svg>
    <span class="state">{label}</span>
  </button>
</div>

<style>
  .track {
    --t: var(--tone, var(--accent));
    position: relative;
    height: 64px;
    border-radius: 32px;
    background: var(--surface);
    border: 2px solid var(--t);
    overflow: hidden;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    transition:
      box-shadow 0.3s,
      border-color 0.4s;
  }
  .track.done {
    box-shadow: 0 0 0 6px color-mix(in srgb, var(--t) 25%, transparent);
  }
  .fill {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: 32px;
    opacity: 0;
    background: color-mix(in srgb, var(--t) 22%, transparent);
    transition:
      width 0.45s cubic-bezier(0.3, 1.5, 0.5, 1),
      opacity 0.3s,
      background-color 0.6s linear;
  }
  .fill.dragging {
    opacity: 1;
    transition: background-color 0.6s linear;
  }
  .fill.holding {
    background: color-mix(in srgb, var(--t) 55%, transparent);
  }
  .knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 56px;
    height: 56px;
    min-height: 0;
    padding: 0;
    border-radius: 50%;
    border: none;
    background: var(--t);
    color: var(--accent-text);
    box-shadow: 0 2px 8px color-mix(in srgb, var(--t) 40%, transparent);
    transition: transform 0.45s cubic-bezier(0.3, 1.5, 0.5, 1);
    cursor: grab;
  }
  .knob.dragging {
    transition: none;
    cursor: grabbing;
  }
  .knob svg {
    display: block;
    fill: none;
    stroke: currentColor;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .ring {
    opacity: 0;
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    transform: rotate(-90deg);
    transform-origin: center;
  }
  .holding .ring {
    opacity: 1;
    stroke-dashoffset: 0;
    transition: stroke-dashoffset 0.6s linear;
  }
  .state {
    position: absolute;
    clip-path: inset(50%);
  }
  .active .knob {
    background: var(--surface);
    color: var(--t);
    border: 2px solid var(--t);
  }
</style>
