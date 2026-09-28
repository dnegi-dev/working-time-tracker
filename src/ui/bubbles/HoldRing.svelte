<script lang="ts">
  import { HOLD_MS } from './gesture.ts';

  /** Ring around a bubble that closes while something is held over it. */
  let { active }: { active: boolean } = $props();
</script>

<svg class="ring" class:active viewBox="0 0 100 100" aria-hidden="true" style:--hold="{HOLD_MS}ms">
  <circle cx="50" cy="50" r="48" pathLength="1" vector-effect="non-scaling-stroke" />
</svg>

<style>
  .ring {
    position: absolute;
    inset: -7px;
    width: calc(100% + 14px);
    height: calc(100% + 14px);
    fill: none;
    stroke: var(--tone);
    stroke-width: 4;
    stroke-linecap: round;
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    opacity: 0;
    transform: rotate(-90deg);
    pointer-events: none;
  }
  .active {
    opacity: 1;
    stroke-dashoffset: 0;
    transition: stroke-dashoffset var(--hold) linear;
  }
</style>
