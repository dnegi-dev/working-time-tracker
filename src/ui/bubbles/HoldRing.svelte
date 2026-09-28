<script lang="ts">
  import { HOLD_MS } from './gesture.ts';

  /** Progress bar along the inner edge of a target; fills while something is held over it. */
  let { active }: { active: boolean } = $props();
</script>

<svg class="ring" class:active viewBox="0 0 100 100" aria-hidden="true" style:--hold="{HOLD_MS}ms">
  <circle class="track" cx="50" cy="50" r="46" vector-effect="non-scaling-stroke" />
  <circle class="bar" cx="50" cy="50" r="46" pathLength="1" vector-effect="non-scaling-stroke" />
</svg>

<style>
  .ring {
    position: absolute;
    inset: 3px;
    z-index: 2;
    width: calc(100% - 6px);
    height: calc(100% - 6px);
    fill: none;
    stroke-width: 4;
    stroke-linecap: round;
    opacity: 0;
    transform: rotate(-90deg);
    pointer-events: none;
    transition: opacity 0.15s;
  }
  .track {
    stroke: color-mix(in srgb, var(--tone) 20%, transparent);
  }
  .bar {
    stroke: var(--tone);
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
  }
  .active {
    opacity: 1;
  }
  .active .bar {
    stroke-dashoffset: 0;
    transition: stroke-dashoffset var(--hold) linear;
  }
</style>
