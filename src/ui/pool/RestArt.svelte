<script lang="ts">
  import type { RestTheme } from '../../domain/index.ts';

  /** Loose pieces of the resting place, spread across the row; some rise above the strip. */
  let { theme }: { theme: RestTheme } = $props();

  // [left %, height u, sway phase s]
  const WEEDS = [
    [3, 40, 0],
    [11, 86, -1.4],
    [25, 30, -2.6],
    [46, 54, -0.7],
    [64, 36, -3.3],
    [77, 92, -2],
    [92, 48, -1],
  ] as const;
  const STRANDS = ['M10 60C4 45 16 35 9 20S12 5 10 0', 'M10 60C16 48 4 38 11 24S8 8 10 0'];
  // [centre %, width u]
  const ROCKS = [
    [19, 22],
    [56, 14],
    [86, 26],
  ] as const;
  // [left %, top u, width %, height u, drift phase s]
  const PUFFS = [
    [-6, 2, 38, 40, 0],
    [16, 26, 26, 44, -6],
    [38, 6, 36, 42, -12],
    [60, 34, 24, 48, -3],
    [78, 8, 34, 44, -9],
  ] as const;
  // [centre %, width u, height u, bottom u]: two stacks and a trunk
  const BOXES = [
    [16, 26, 18, 10],
    [16.5, 18, 14, 28],
    [46, 30, 12, 10],
    [78, 22, 20, 10],
    [78.5, 18, 18, 30],
    [78, 14, 16, 48],
    [78.5, 10, 12, 64],
  ] as const;
</script>

{#if theme === 'seabed'}
  {#each WEEDS as [left, h, d], i (i)}
    <svg
      class="piece weed"
      class:back={i % 3 === 1}
      style:left="{left}%"
      style:--h={h}
      style:--d="{d}s"
      viewBox="0 0 20 60"
      preserveAspectRatio="none"><path d={STRANDS[i % 2]} vector-effect="non-scaling-stroke" /></svg
    >
  {/each}
  {#each ROCKS as [left, w], i (i)}
    <span class="piece rock" style:left="{left}%" style:--w={w}></span>
  {/each}
{:else if theme === 'sky'}
  {#each PUFFS as [left, top, w, h, d], i (i)}
    <span
      class="piece puff"
      style:left="{left}%"
      style:width="{w}%"
      style:--top={top}
      style:--h={h}
      style:--d="{d}s"
    ></span>
  {/each}
{:else}
  {#each BOXES as [left, w, h, b], i (i)}
    <span class="piece box" style:left="{left}%" style:--w={w} style:--h={h} style:--b={b}></span>
  {/each}
{/if}

<style>
  .piece {
    position: absolute;
    transition-property: height, width, top, bottom;
    transition-duration: 0.45s;
    transition-timing-function: cubic-bezier(0.3, 1.1, 0.5, 1);
  }
  .weed {
    bottom: calc(14 * var(--u));
    width: calc(var(--h) * 0.3 * var(--u));
    height: calc(var(--h) * var(--u));
    fill: none;
    stroke: color-mix(in srgb, var(--accent) 70%, var(--surface));
    stroke-width: calc(2.4 * var(--u));
    stroke-linecap: round;
    transform-origin: bottom;
    animation: sway 4s ease-in-out var(--d, 0s) infinite;
  }
  .weed.back {
    stroke: color-mix(in srgb, var(--accent) 40%, var(--surface));
  }
  .rock {
    bottom: calc(8 * var(--u));
    width: calc(var(--w) * var(--u));
    height: calc(var(--w) * 0.55 * var(--u));
    translate: -50% 0;
    border-radius: 50% 50% 45% 45% / 65% 65% 35% 35%;
    background: color-mix(in srgb, #7d8590 40%, var(--surface));
  }
  .puff {
    top: calc(var(--top) * var(--u));
    height: calc(var(--h) * var(--u));
    border-radius: 50%;
    background: radial-gradient(closest-side, var(--cloud), transparent);
    animation: float 24s ease-in-out var(--d, 0s) infinite alternate;
  }
  .box {
    bottom: calc(var(--b) * var(--u));
    width: calc(var(--w) * var(--u));
    height: calc(var(--h) * var(--u));
    translate: -50% 0;
    border: 1px solid color-mix(in srgb, var(--wood) 60%, #000);
    border-radius: 2px;
    background: color-mix(in srgb, var(--wood) 80%, var(--surface));
  }
  @keyframes sway {
    50% {
      rotate: 8deg;
    }
  }
  @keyframes float {
    to {
      translate: 20% 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .piece {
      animation: none;
      transition: none;
    }
  }
</style>
