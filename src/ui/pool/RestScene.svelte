<script lang="ts">
  import type { RestTheme } from '../../domain/index.ts';
  import RestArt from './RestArt.svelte';

  /**
   * Backdrop of the resting place: sand and seaweed, a cloud bank or attic planks.
   * Art is sized in `--u`: it grows with the strip (and so the field) and by `--zoom` when zoomed.
   */
  let { theme, zoomed = false }: { theme: RestTheme; zoomed?: boolean } = $props();
  const BEAMS = [6, 34, 62, 90];
</script>

<div class="scene {theme}" class:zoomed aria-hidden="true">
  <div class="backdrop">
    {#if theme === 'attic'}
      {#each BEAMS as left (left)}<span class="beam" style:left="{left}%"></span>{/each}
    {/if}
  </div>
  <div class="ground"></div>
  <RestArt {theme} />
</div>

<style>
  .scene {
    --sand: color-mix(in srgb, #d8bf85 55%, var(--surface));
    --wood: color-mix(in srgb, #8b5e34 45%, var(--surface));
    --cloud: color-mix(in srgb, var(--calm) 28%, var(--surface));
    --u: calc(var(--strip, 64px) / 64);
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }
  .zoomed {
    --u: calc(var(--strip, 64px) / 64 * var(--zoom, 1));
  }
  /* Strip-high at the edge, fading out towards the field; fills the field when zoomed. */
  .backdrop,
  .ground {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    transition-property: height, border-radius;
    transition-duration: 0.45s;
    transition-timing-function: cubic-bezier(0.3, 1.1, 0.5, 1);
  }
  .backdrop {
    height: var(--strip, 64px);
    mask-image: linear-gradient(to bottom, transparent, #000 calc(24 * var(--u)));
  }
  .zoomed .backdrop {
    height: 100%;
  }
  .ground {
    /* GROUND (0.45) of a 64px strip */
    height: calc(28.8 * var(--u));
  }
  .seabed .backdrop {
    background: linear-gradient(
      to bottom,
      color-mix(in srgb, var(--calm) 8%, transparent),
      color-mix(in srgb, var(--calm) 22%, transparent)
    );
  }
  .seabed .ground {
    background: var(--sand);
    border-radius: 50% 50% 0 0 / calc(14 * var(--u)) calc(14 * var(--u)) 0 0;
  }
  .sky .backdrop,
  .sky .ground {
    top: 0;
    bottom: auto;
  }
  .sky .backdrop {
    mask-image: linear-gradient(to top, transparent, #000 calc(24 * var(--u)));
    background: linear-gradient(
      to top,
      color-mix(in srgb, var(--calm) 6%, transparent),
      color-mix(in srgb, var(--calm) 20%, transparent)
    );
  }
  .sky .ground {
    background: var(--cloud);
    opacity: 0.6;
    border-radius: 0 0 50% 50% / 0 0 calc(10 * var(--u)) calc(10 * var(--u));
  }
  .attic .backdrop {
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
  @media (prefers-reduced-motion: reduce) {
    .backdrop,
    .ground {
      transition: none;
    }
  }
</style>
