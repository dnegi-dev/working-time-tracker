<script lang="ts">
  import type { RestTheme } from '../../domain/index.ts';

  /**
   * Backdrop of the resting place: sand and seaweed, a cloud bank or attic planks.
   * Art is sized in `--u`: it grows with the strip (and so the field) and by `--zoom` when zoomed.
   */
  let { theme, zoomed = false }: { theme: RestTheme; zoomed?: boolean } = $props();
</script>

<div class="scene {theme}" class:zoomed aria-hidden="true">
  <div class="ground"></div>
  {#if theme === 'seabed'}
    <svg class="weed" style:left="8%" viewBox="0 0 20 60"
      ><path d="M10 60C4 45 16 35 9 20S12 5 10 0" /></svg
    >
    <svg class="weed" style:left="88%" style:--d="-1.4s" viewBox="0 0 20 60"
      ><path d="M10 60C16 48 4 38 11 24S8 8 10 0" /></svg
    >
  {:else if theme === 'sky'}
    <span class="puff" style:left="-4%"></span>
    <span class="puff" style:left="30%" style:--d="-6s"></span>
    <span class="puff" style:left="66%" style:--d="-12s"></span>
  {:else}
    <span class="beam" style:left="12%"></span>
    <span class="beam" style:left="84%"></span>
  {/if}
</div>

<style>
  .scene {
    --sand: color-mix(in srgb, #d8bf85 55%, var(--surface));
    --wood: color-mix(in srgb, #8b5e34 45%, var(--surface));
    --cloud: color-mix(in srgb, #ffffff 70%, var(--calm) 12%);
    --u: calc(var(--strip, 64px) / 64);
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }
  .zoomed {
    --u: calc(var(--strip, 64px) / 64 * var(--zoom, 1));
  }
  .scene > * {
    transition-property: height, width, top, bottom, border-radius;
    transition-duration: 0.45s;
    transition-timing-function: cubic-bezier(0.3, 1.1, 0.5, 1);
  }
  .ground {
    position: absolute;
    left: 0;
    right: 0;
    /* GROUND (0.45) of a 64px strip */
    height: calc(28.8 * var(--u));
  }
  .seabed {
    background: linear-gradient(
      to bottom,
      color-mix(in srgb, var(--calm) 6%, transparent),
      color-mix(in srgb, var(--calm) 22%, transparent)
    );
  }
  .seabed .ground,
  .attic .ground {
    bottom: 0;
  }
  .seabed .ground {
    background: var(--sand);
    border-radius: 50% 50% 0 0 / calc(14 * var(--u)) calc(14 * var(--u)) 0 0;
  }
  .weed {
    position: absolute;
    bottom: calc(14 * var(--u));
    width: calc(14 * var(--u));
    height: calc(44 * var(--u));
    fill: none;
    stroke: color-mix(in srgb, var(--accent) 70%, var(--surface));
    stroke-width: 3;
    stroke-linecap: round;
    transform-origin: bottom;
    animation: sway 4s ease-in-out var(--d, 0s) infinite;
  }
  .sky {
    background: linear-gradient(
      to top,
      color-mix(in srgb, var(--calm) 4%, transparent),
      color-mix(in srgb, var(--calm) 20%, transparent)
    );
  }
  .sky .ground {
    top: 0;
    background: var(--cloud);
    opacity: 0.6;
  }
  .puff {
    position: absolute;
    top: calc(4 * var(--u));
    width: 42%;
    height: calc(44 * var(--u));
    border-radius: 50%;
    background: radial-gradient(closest-side, var(--cloud), transparent);
    animation: float 24s ease-in-out var(--d, 0s) infinite alternate;
  }
  .attic {
    background: repeating-linear-gradient(
      to bottom,
      color-mix(in srgb, var(--wood) 16%, transparent) 0 22px,
      color-mix(in srgb, var(--wood) 28%, transparent) 22px 23px
    );
  }
  .attic .ground {
    height: calc(10 * var(--u));
    background: var(--wood);
    box-shadow: 0 -2px 0 color-mix(in srgb, var(--wood) 70%, #000);
  }
  .beam {
    position: absolute;
    top: 0;
    bottom: calc(10 * var(--u));
    width: calc(8 * var(--u));
    background: var(--wood);
    opacity: 0.7;
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
    .weed,
    .puff {
      animation: none;
    }
    .scene > * {
      transition: none;
    }
  }
</style>
