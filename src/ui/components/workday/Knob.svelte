<script lang="ts">
  import { ICONS, type Icon } from './icons.ts';

  /** The workday slider's knob: icon, hold ring and a hidden state label. */
  let {
    icon,
    label,
    aria,
    x,
    y,
    dragging,
    ready,
    holding,
    active,
    onpointerdown,
    onpointermove,
    onpointerup,
  }: {
    icon: Icon;
    label: string;
    aria: string;
    x: number;
    y: number;
    dragging: boolean;
    /** Animate moves only once the first position is known. */
    ready: boolean;
    holding: boolean;
    active: boolean;
    onpointerdown: (e: PointerEvent) => void;
    onpointermove: (e: PointerEvent) => void;
    onpointerup: () => void;
  } = $props();
</script>

<button
  class="knob"
  class:dragging
  class:ready
  class:holding
  class:active
  style:transform="translate({x}px, {y}px)"
  {onpointerdown}
  {onpointermove}
  {onpointerup}
  onpointercancel={onpointerup}
  data-testid="toggle"
  aria-label={aria}
>
  <svg viewBox="0 0 56 56" aria-hidden="true">
    <circle class="ring" cx="28" cy="28" r="25" pathLength="1" />
    <path class:solid={icon === 'play'} transform="translate(16 16)" d={ICONS[icon]} />
  </svg>
  <span class="state">{label}</span>
</button>

<style>
  .knob {
    position: absolute;
    top: 4px;
    left: 4px;
    z-index: 2;
    width: 56px;
    height: 56px;
    min-height: 0;
    padding: 0;
    border-radius: 50%;
    border: none;
    background: var(--t);
    color: var(--accent-text);
    box-shadow: 0 2px 8px color-mix(in srgb, var(--t) 40%, transparent);
    cursor: grab;
  }
  .knob.ready {
    transition:
      transform 0.45s var(--spring),
      background-color 0.3s,
      color 0.3s;
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
  path.solid {
    fill: currentColor;
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
    transition: stroke-dashoffset var(--hold) linear;
  }
  .state {
    position: absolute;
    clip-path: inset(50%);
  }
  .knob.active {
    background: var(--surface);
    color: var(--t);
    border: 2px solid var(--t);
  }
  @media (prefers-reduced-motion: reduce) {
    .knob.ready {
      transition: none;
    }
  }
</style>
