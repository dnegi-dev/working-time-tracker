<script lang="ts">
  import type { RestTheme } from '../../domain/index.ts';
  import HoldRing from '../bubbles/HoldRing.svelte';
  import type { Point } from '../bubbles/layout.ts';
  import { useUi } from '../state/context.svelte.ts';

  /** Hold a resting bubble here to bring it back. */
  let { at, theme, active }: { at: Point; theme: RestTheme; active: boolean } = $props();
  const ui = useUi();
</script>

<div
  class="back"
  class:active
  style:transform="translate({at.x}px, {at.y}px)"
  data-testid="rest-return"
>
  <span class="ring"><HoldRing {active} /></span>
  <span>{ui.t(`rest.${theme}.return`)}</span>
</div>

<style>
  .back {
    --tone: var(--accent);
    position: absolute;
    left: 0;
    top: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    translate: -50% -22px;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--tone);
    pointer-events: none;
  }
  .ring {
    position: relative;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 2px dashed var(--tone);
    background: color-mix(in srgb, var(--tone) 12%, var(--surface));
    transition: scale 0.2s;
  }
  .active .ring {
    scale: 1.2;
    border-style: solid;
  }
</style>
