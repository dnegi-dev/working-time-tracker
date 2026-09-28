<script lang="ts">
  import type { Point } from './layout.ts';

  let {
    w,
    h,
    from,
    to,
    target,
  }: { w: number; h: number; from: Point; to: { key: string; at: Point }[]; target?: string } =
    $props();

  /** A soft curve that sags a little sideways, like a line in water. */
  function path(a: Point, b: Point) {
    const mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.12;
    const my = (a.y + b.y) / 2 - (b.x - a.x) * 0.12;
    return `M${a.x} ${a.y}Q${mx} ${my} ${b.x} ${b.y}`;
  }
</script>

<svg class="tethers" viewBox="0 0 {w} {h}" aria-hidden="true">
  {#each to as t (t.key)}
    <path d={path(from, t.at)} class:on={t.key === target} />
  {/each}
</svg>

<style>
  .tethers {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    fill: none;
  }
  path {
    stroke: var(--line);
    stroke-width: 1.5;
    stroke-dasharray: 3 5;
    transition:
      stroke 0.2s,
      stroke-width 0.2s;
  }
  path.on {
    stroke: var(--accent);
    stroke-width: 2.5;
    stroke-dasharray: none;
  }
</style>
