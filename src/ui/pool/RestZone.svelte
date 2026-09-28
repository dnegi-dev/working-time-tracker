<script lang="ts">
  import type { RestTheme } from '../../domain/index.ts';
  import HoldRing from '../bubbles/HoldRing.svelte';
  import type { Point } from '../bubbles/layout.ts';
  import { useUi } from '../state/context.svelte.ts';

  /** Where a project is dragged and held to be removed; plays the goodbye of the last one. */
  let {
    at,
    theme,
    targeted,
    gone,
  }: {
    at: Point;
    theme: RestTheme;
    targeted: boolean;
    gone?: { name: string; n: number };
  } = $props();

  const ui = useUi();
  const R = 26;
</script>

<div
  class="zone {theme}"
  class:targeted
  style:transform="translate({at.x - R}px, {at.y - R}px)"
  style:--r="{R}px"
  data-testid="rest-zone"
  data-theme={theme}
>
  <span class="hole">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {#if theme === 'seabed'}
        <path
          class="spin"
          d="M12 12m-1 0a1 1 0 1 1 2 0a3 3 0 1 1-6 0a5 5 0 1 1 10 0a7 7 0 1 1-14 0"
        />
      {:else if theme === 'sky'}
        <path d="M12 19V7M7 11l5-5 5 5" />
      {:else}
        <path d="M4 10h16v10H4zM4 10l3-5h10l3 5M10 14h4" />
      {/if}
    </svg>
    <HoldRing active={targeted} />
  </span>
  <span class="label">{ui.t(`rest.${theme}.drop`)}</span>
  {#key gone?.n}
    {#if gone}<span class="ghost" aria-hidden="true">{gone.name}</span>{/if}
  {/key}
</div>

<style>
  .zone {
    --tone: var(--calm);
    position: absolute;
    left: 0;
    top: 0;
    z-index: 1;
    width: calc(2 * var(--r));
    height: calc(2 * var(--r));
    pointer-events: none;
  }
  .targeted {
    z-index: 4;
  }
  .attic {
    --tone: color-mix(in srgb, #8b5e34 75%, var(--muted));
  }
  .hole {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: color-mix(in srgb, var(--tone) 18%, var(--surface));
    border: 2px dashed var(--tone);
  }
  svg {
    width: 60%;
    fill: none;
    stroke: var(--tone);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .spin {
    transform-origin: 12px 12px;
    animation: spin 3s linear infinite;
  }
  .label {
    position: absolute;
    left: 50%;
    top: 50%;
    translate: calc(var(--r) + 8px) -50%;
    white-space: nowrap;
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--tone);
  }
  .ghost {
    position: absolute;
    left: 50%;
    top: 50%;
    padding: 18px 8px;
    translate: -50% -50%;
    border-radius: 50%;
    border: 1.5px solid var(--accent);
    background: var(--surface);
    font-size: 0.7rem;
    font-weight: 600;
    white-space: nowrap;
    opacity: 0;
    animation: sink 0.9s ease-in forwards;
  }
  .sky .ghost {
    animation-name: rise;
  }
  .attic .ghost {
    animation-name: pack;
  }
  @keyframes spin {
    to {
      rotate: -360deg;
    }
  }
  @keyframes sink {
    from {
      opacity: 1;
      scale: 1;
      rotate: 0deg;
    }
    to {
      opacity: 0;
      scale: 0.1;
      rotate: 540deg;
    }
  }
  @keyframes rise {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
      translate: -50% -160%;
      scale: 0.6;
    }
  }
  @keyframes pack {
    from {
      opacity: 1;
      translate: -50% -140%;
    }
    60% {
      opacity: 1;
      translate: -50% -50%;
      scale: 0.8 0.6;
    }
    to {
      opacity: 0;
      scale: 0.3;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .spin,
    .ghost {
      animation: none;
    }
  }
</style>
