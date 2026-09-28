<script lang="ts">
  import type { Snippet } from 'svelte';
  import { HOLD_MS, dragHold } from '../../bubbles/gesture.ts';
  import { useUi } from '../../state/context.svelte.ts';
  import Knob from './Knob.svelte';
  import SliderPreview from './SliderPreview.svelte';
  import {
    DIP,
    resolve,
    rest,
    turnAt,
    type SliderState,
    type Target,
    type Turn,
  } from './sliderGesture.ts';

  let {
    phase,
    label,
    aria,
    legal = 0,
    tone,
    onconfirm,
    children,
  }: {
    phase: SliderState;
    /** Hidden knob text (Start / Stop / Resume). */
    label: string;
    aria: string;
    /** Minutes the left dip adds as legal break; 0 hides that pocket. */
    legal?: number;
    /** Colour for track, knob and fill; defaults to the accent. */
    tone?: string;
    onconfirm: (target: Target) => void;
    /** Content inside the track, behind the knob; gets how far the knob is dragged (0–1). */
    children?: Snippet<[number]>;
  } = $props();

  const KNOB = 56;
  const ICON = { idle: 'arrow', running: 'play', lunch: 'lunch' } as const;
  const ui = useUi();
  let width = $state(0);
  let ready = $state(false);
  let dx = $state(0);
  let dy = $state(0);
  let dragging = $state(false);
  let target = $state<Target>();
  /** After a confirm the knob stays put until the phase changes. */
  let heldIn = $state<SliderState>();
  let done = $state(false);
  let turn = $state<Turn>();
  /** The phase whose options are previewed: while pressed and a moment after a tap. */
  let shown = $state<SliderState>();
  let hide: ReturnType<typeof setTimeout> | undefined;
  let start = { x: 0, y: 0 };

  const max = $derived(Math.max(0, width - KNOB - 4));
  const home = $derived(rest(phase, max));
  const r = $derived(resolve(phase, dx, dy, max, legal > 0, turn));
  const live = $derived(dragging || heldIn === phase);
  const pos = $derived(live ? r : home);
  const drag = $derived(max ? Math.abs(pos.x - home.x) / max : 0);
  const hold = dragHold({
    enter: (key) => (target = key as Target | undefined),
    confirm: (key) => finish(key as Target),
    haptic: ui.platform.haptic,
  });

  $effect(() => {
    if (width > 0 && !ready) requestAnimationFrame(() => (ready = true));
  });

  function down(e: PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    start = { x: e.clientX, y: e.clientY };
    dx = dy = 0;
    turn = turnAt(phase, 0, 0, max, legal > 0);
    heldIn = undefined;
    dragging = true;
    clearTimeout(hide);
    shown = phase;
    ui.platform.haptic('grab');
  }

  function move(e: PointerEvent) {
    if (!dragging) return;
    dx = e.clientX - start.x;
    dy = e.clientY - start.y;
    turn = turnAt(phase, dx, dy, max, legal > 0, turn);
    hold.over(r.target);
  }

  /** Letting go of a tap keeps the options on screen for a moment. */
  function up() {
    const tap = dragging && Math.hypot(dx, dy) < 6;
    release();
    if (!tap) return;
    shown = phase;
    hide = setTimeout(() => (shown = undefined), 2500);
  }

  function finish(t: Target) {
    heldIn = phase;
    release();
    ui.platform.haptic('success');
    done = true;
    setTimeout(() => (done = false), 500);
    setTimeout(() => (heldIn = undefined), 1500);
    onconfirm(t);
  }

  function release() {
    hold.end();
    dragging = false;
    shown = undefined;
  }
</script>

<div class="slider" class:done style:--tone={tone} style:--hold="{HOLD_MS}ms">
  <div class="track" bind:clientWidth={width}>
    {@render children?.(shown === phase ? 1 : drag)}
    <div
      class="fill"
      class:dragging
      class:holding={!!target}
      style:left="{Math.min(pos.x, home.x)}px"
      style:width="{Math.abs(pos.x - home.x) + KNOB + 4}px"
    ></div>
  </div>
  <SliderPreview
    {phase}
    {legal}
    show={shown === phase}
    pocket={phase === 'lunch' ? 'lunch' : live ? r.pocket : undefined}
    dipped={pos.y >= DIP}
  />
  <Knob
    icon={ICON[phase]}
    {label}
    {aria}
    x={pos.x}
    y={pos.y}
    {dragging}
    {ready}
    holding={!!target}
    active={phase !== 'idle'}
    onpointerdown={down}
    onpointermove={move}
    onpointerup={up}
  />
</div>

<style>
  .slider {
    --t: var(--tone, var(--accent));
    position: relative;
    z-index: 3;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }
  .track {
    position: relative;
    height: 64px;
    border-radius: 32px;
    background: var(--surface);
    border: 2px solid var(--t);
    overflow: hidden;
    transition:
      box-shadow 0.3s,
      border-color 0.4s;
  }
  .done .track {
    box-shadow: 0 0 0 6px color-mix(in srgb, var(--t) 25%, transparent);
  }
  .fill {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: 32px;
    opacity: 0;
    background: color-mix(in srgb, var(--t) 22%, transparent);
    transition:
      left 0.45s var(--spring),
      width 0.45s var(--spring),
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
  @media (prefers-reduced-motion: reduce) {
    .fill {
      transition: none;
    }
  }
</style>
