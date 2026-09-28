<script lang="ts">
  import type { Point } from './layout.ts';

  let { active, from, r }: { active: boolean; from: Point; r: number } = $props();

  interface Puff {
    id: number;
    x: number;
    size: number;
    dur: number;
  }
  let puffs = $state<Puff[]>([]);
  let next = 0;

  function spawn() {
    const n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      puffs.push({
        id: next++,
        x: (Math.random() - 0.5) * r * 0.9,
        size: 5 + Math.random() * 7,
        dur: 3.5 + Math.random() * 2.5 + i * 0.4,
      });
    }
  }

  $effect(() => {
    if (!active || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let timer = setTimeout(function tick() {
      spawn();
      timer = setTimeout(tick, 4000 + Math.random() * 4000);
    }, 1200);
    return () => clearTimeout(timer);
  });
</script>

{#each puffs as p (p.id)}
  <span
    class="puff"
    style:left="{from.x + p.x - p.size / 2}px"
    style:top="{from.y - r * 0.8}px"
    style:width="{p.size}px"
    style:height="{p.size}px"
    style:--rise="-{from.y - r * 0.8 + 20}px"
    style:--dur="{p.dur}s"
    onanimationend={() => (puffs = puffs.filter((q) => q.id !== p.id))}
  ></span>
{/each}

<style>
  .puff {
    position: absolute;
    z-index: 0;
    border-radius: 50%;
    border: 1.5px solid color-mix(in srgb, var(--accent) 55%, transparent);
    background: radial-gradient(
      circle at 35% 35%,
      color-mix(in srgb, var(--surface) 90%, transparent),
      color-mix(in srgb, var(--accent) 12%, transparent)
    );
    pointer-events: none;
    animation: rise var(--dur) ease-in forwards;
  }
  @keyframes rise {
    from {
      transform: translate(0, 0);
      opacity: 0;
    }
    10% {
      opacity: 0.9;
    }
    50% {
      transform: translate(6px, calc(var(--rise) * 0.5));
    }
    to {
      transform: translate(-4px, var(--rise));
      opacity: 0;
    }
  }
</style>
