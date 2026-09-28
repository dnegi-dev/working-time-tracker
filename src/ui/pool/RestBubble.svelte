<script lang="ts">
  import type { RestTheme } from '../../domain/index.ts';
  import type { Point } from '../bubbles/layout.ts';

  /** A resting project: a sunken bubble, a little cloud or a jar on the shelf. */
  let {
    at,
    r,
    id,
    name,
    theme,
    zoomed,
    dragging,
    onrestore,
  }: {
    at: Point;
    r: number;
    id: string;
    name: string;
    theme: RestTheme;
    zoomed: boolean;
    dragging: boolean;
    onrestore: () => void;
  } = $props();
</script>

<button
  class="rb {theme}"
  class:zoomed
  class:dragging
  style:width="{2 * r}px"
  style:height="{2 * r}px"
  style:transform="translate({at.x - r}px, {at.y - r}px)"
  data-rest={id}
  data-testid="rest-bubble"
  tabindex={zoomed ? 0 : -1}
  aria-label={name}
  onclick={(e) => zoomed && e.detail === 0 && onrestore()}
>
  {#if zoomed}<span>{name}</span>{/if}
</button>

<style>
  .rb {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 1;
    padding: 0;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 1.5px solid color-mix(in srgb, var(--muted) 50%, var(--line));
    background: color-mix(in srgb, var(--surface) 80%, transparent);
    color: var(--muted);
    font: inherit;
    font-size: 0.66rem;
    font-weight: 600;
    opacity: 0.85;
    pointer-events: none;
    transition:
      transform 0.5s cubic-bezier(0.3, 1.2, 0.5, 1),
      width 0.5s,
      height 0.5s;
  }
  .zoomed {
    pointer-events: auto;
    cursor: grab;
    touch-action: none;
  }
  .dragging {
    z-index: 3;
    opacity: 1;
    transition: none;
    cursor: grabbing;
  }
  span {
    max-width: 84%;
    overflow: hidden;
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
  .seabed {
    background: color-mix(in srgb, #d8bf85 30%, var(--surface));
    border-color: color-mix(in srgb, #b89a5a 60%, var(--line));
  }
  .sky {
    border-color: transparent;
    background: color-mix(in srgb, #ffffff 75%, var(--calm) 15%);
    box-shadow:
      calc(var(--s, 1) * 6px) 2px 0 -2px color-mix(in srgb, #ffffff 75%, var(--calm) 15%),
      -6px 3px 0 -2px color-mix(in srgb, #ffffff 75%, var(--calm) 15%);
    color: color-mix(in srgb, var(--calm) 70%, #000);
  }
  .attic {
    border-radius: 28% 28% 38% 38%;
    border-color: color-mix(in srgb, #8b5e34 60%, var(--line));
    background: color-mix(in srgb, var(--calm) 10%, var(--surface));
  }
  .attic::before {
    content: '';
    position: absolute;
    top: -5px;
    left: 18%;
    right: 18%;
    height: 5px;
    border-radius: 2px;
    background: color-mix(in srgb, #8b5e34 70%, var(--surface));
  }
</style>
