<script lang="ts">
  import { useUi } from '../state/context.svelte.ts';

  let {
    label,
    hint,
    active = false,
    onconfirm,
    testid,
  }: {
    label: string;
    hint: string;
    active?: boolean;
    onconfirm: () => void;
    testid: string;
  } = $props();

  const HOLD_MS = 600;
  const KNOB = 48;
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

<div class="track" class:active class:done bind:this={track}>
  <div class="fill" class:dragging class:holding style:width="{x + KNOB + 4}px"></div>
  <span class="label" style:opacity={1 - (x / max) * 1.4}>{hint}</span>
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
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle class="ring" cx="24" cy="24" r="21" pathLength="1" />
      <path d="M20 16l8 8-8 8" />
    </svg>
    <span class="state">{label}</span>
  </button>
</div>

<style>
  .track {
    position: relative;
    height: 56px;
    border-radius: 28px;
    background: var(--surface);
    border: 2px solid var(--accent);
    overflow: hidden;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    transition: box-shadow 0.3s;
  }
  .track.done {
    box-shadow: 0 0 0 6px color-mix(in srgb, var(--accent) 25%, transparent);
  }
  .fill {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: 28px;
    background: color-mix(in srgb, var(--accent) 22%, transparent);
    transition:
      width 0.45s cubic-bezier(0.3, 1.5, 0.5, 1),
      background-color 0.6s linear;
  }
  .fill.dragging {
    transition: background-color 0.6s linear;
  }
  .fill.holding {
    background: color-mix(in srgb, var(--accent) 55%, transparent);
  }
  .label {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    padding-left: 44px;
    font-size: 0.8rem;
    font-weight: 600;
    pointer-events: none;
    color: transparent;
    background: linear-gradient(
        100deg,
        var(--accent) 40%,
        color-mix(in srgb, var(--accent) 25%, var(--surface)) 50%,
        var(--accent) 60%
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
  .knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 48px;
    height: 48px;
    min-height: 0;
    padding: 0;
    border-radius: 50%;
    border: none;
    background: var(--accent);
    color: var(--accent-text);
    box-shadow: 0 2px 8px color-mix(in srgb, var(--accent) 40%, transparent);
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
    color: var(--accent);
    border: 2px solid var(--accent);
  }
  @media (prefers-reduced-motion: reduce) {
    .label {
      animation: none;
      color: var(--accent);
    }
  }
</style>
