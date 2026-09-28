<script lang="ts">
  import { scale } from 'svelte/transition';
  import { ICONS } from './icons.ts';
  import type { PocketKind } from './sliderGesture.ts';

  /** A slot under one end of the workday track that the knob can dip into. */
  let {
    kind,
    active = false,
    label,
  }: { kind: PocketKind; active?: boolean; label?: string } = $props();
</script>

<div
  class="pocket"
  class:left={kind === 'legal'}
  class:active
  data-testid="slot-{kind}"
  aria-hidden="true"
  transition:scale={{ start: 0.5, duration: 180 }}
>
  {#if kind === 'legal'}
    <span class="num">{label}</span>
  {:else}
    <svg viewBox="0 0 24 24"><path d={ICONS[kind]} /></svg>
  {/if}
</div>

<style>
  .pocket {
    position: absolute;
    top: 66px;
    right: 2px;
    z-index: 1;
    width: 60px;
    height: 60px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    border: 2px dashed color-mix(in srgb, var(--t) 70%, transparent);
    background: var(--surface);
    color: var(--t);
    box-shadow: 0 4px 14px color-mix(in srgb, var(--t) 18%, transparent);
    pointer-events: none;
    transition:
      background-color 0.25s,
      border-color 0.25s;
  }
  .left {
    right: auto;
    left: 2px;
  }
  .active {
    border-style: solid;
    border-color: var(--t);
    background: color-mix(in srgb, var(--t) 22%, var(--surface));
  }
  svg {
    width: 24px;
    height: 24px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .num {
    font-size: 0.95rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
</style>
