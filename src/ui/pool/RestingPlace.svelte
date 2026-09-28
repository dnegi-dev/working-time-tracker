<script lang="ts">
  import type { RestTheme } from '../../domain/index.ts';
  import { dragHold } from '../bubbles/gesture.ts';
  import { hitTarget, type Point } from '../bubbles/layout.ts';
  import { useUi } from '../state/context.svelte.ts';
  import { stripFor } from './poolLayout.ts';
  import { LARGE, SCENE_ZOOM, SMALL, returnSpot, sceneSpots, stripSpots } from './restLayout.ts';
  import RestBubble from './RestBubble.svelte';
  import RestScene from './RestScene.svelte';
  import ReturnSpot from './ReturnSpot.svelte';

  /**
   * Removed projects rest in a strip at the field's edge. Tap, pinch or ctrl+scroll
   * zooms in; drag a bubble to the far edge and hold it there to bring it back.
   */
  let {
    theme,
    edge,
    w,
    h,
    items,
    onrestore,
  }: {
    theme: RestTheme;
    edge: 'top' | 'bottom';
    w: number;
    h: number;
    items: { id: string; name: string }[];
    onrestore: (id: string) => void;
  } = $props();

  const ui = useUi();
  let zoomed = $state(false);
  const zoom = (on: boolean) => {
    if (on !== zoomed) ui.platform.haptic('tick');
    zoomed = on;
  };
  let target = $state(false);
  let drag = $state<{ id: string; from: Point; start: Point; at: Point }>();
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- pinch bookkeeping, never rendered
  const pointers = new Map<number, Point>();
  let spread = 0;

  const spots = $derived(
    zoomed ? sceneSpots(items.length, w, h, edge) : stripSpots(items.length, w, h, edge),
  );
  const back = $derived(returnSpot(w, h, edge));
  const r = $derived(zoomed ? LARGE : SMALL);

  const hold = dragHold({
    enter: (key) => (target = !!key),
    haptic: ui.platform.haptic,
    confirm() {
      const id = drag?.id;
      ui.platform.haptic('success');
      end();
      if (id) onrestore(id);
    },
  });

  const distance = () => {
    const [a, b] = [...pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };

  function down(e: PointerEvent) {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    spread = distance();
    const el = (e.target as Element).closest<HTMLElement>('[data-rest]');
    const i = items.findIndex((it) => it.id === el?.dataset.rest);
    if (!zoomed || i < 0) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const start = { x: e.clientX, y: e.clientY };
    drag = { id: items[i]!.id, from: spots[i]!, start, at: spots[i]! };
    ui.platform.haptic('grab');
  }

  function move(e: PointerEvent) {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2 && spread && Math.abs(distance() - spread) > 40) {
      zoom(distance() > spread);
      spread = 0;
    }
    if (!drag) return;
    const at = {
      x: drag.from.x + e.clientX - drag.start.x,
      y: drag.from.y + e.clientY - drag.start.y,
    };
    drag = { ...drag, at };
    hold.over(hitTarget(at, [{ key: 'back', at: back }], 36));
  }

  function end(e?: PointerEvent) {
    if (e) pointers.delete(e.pointerId);
    drag = undefined;
    hold.end();
  }

  function wheel(e: WheelEvent) {
    if (!e.ctrlKey) return;
    e.preventDefault();
    zoom(e.deltaY < 0);
  }
</script>

<div
  class="rest {edge}"
  class:zoomed
  style:--strip="{stripFor(h)}px"
  style:--zoom={SCENE_ZOOM}
  data-testid="rest-place"
  data-theme={theme}
  data-zoomed={zoomed}
  role="group"
  aria-label={ui.t(`rest.${theme}`)}
  onpointerdown={down}
  onpointermove={move}
  onpointerup={end}
  onpointercancel={end}
  onwheel={wheel}
>
  <RestScene {theme} {zoomed} />
  {#if zoomed}
    <ReturnSpot at={back} {theme} active={target} />
    <button class="close" onclick={() => zoom(false)}>{ui.t('rest.close')}</button>
    {#if !items.length}<p class="empty">{ui.t('rest.empty')}</p>{/if}
  {:else}
    <button
      class="open"
      data-testid="rest-open"
      aria-label={ui.t('rest.open')}
      onclick={() => zoom(true)}
    ></button>
  {/if}
  {#each items as it, i (it.id)}
    <RestBubble
      at={drag?.id === it.id ? drag.at : spots[i]!}
      {r}
      id={it.id}
      name={it.name}
      {theme}
      {zoomed}
      dragging={drag?.id === it.id}
      onrestore={() => onrestore(it.id)}
    />
  {/each}
</div>

<style>
  /* Always as big as the field; the clip shows the strip (and art rising over it) until zoomed. */
  .rest {
    --over: calc(var(--strip) * 0.8);
    position: absolute;
    inset: 0;
    z-index: 1;
    overflow: hidden;
    pointer-events: none;
    transition: clip-path 0.45s cubic-bezier(0.3, 1.1, 0.5, 1);
  }
  .top {
    clip-path: inset(0 0 calc(100% - var(--strip) - var(--over)) 0);
  }
  .bottom {
    clip-path: inset(calc(100% - var(--strip) - var(--over)) 0 0 0);
  }
  .zoomed {
    z-index: 6;
    clip-path: inset(0 0 0 0);
    pointer-events: auto;
    background: var(--bg);
    touch-action: none;
  }
  .open {
    position: absolute;
    inset: 0 0 auto;
    height: var(--strip);
    min-height: 0;
    border: none;
    background: none;
    cursor: zoom-in;
    pointer-events: auto;
  }
  .bottom .open {
    inset: auto 0 0;
  }
  .close {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;
  }
  .empty {
    position: absolute;
    inset: 45% 0 auto;
    margin: 0;
    text-align: center;
    color: var(--muted);
  }
</style>
