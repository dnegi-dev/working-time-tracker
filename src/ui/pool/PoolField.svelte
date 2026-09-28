<script lang="ts" module>
  export interface PoolItem {
    id: string;
    name: string;
    sub: string;
    share: number;
  }
</script>

<script lang="ts">
  import type { RestTheme } from '../../domain/index.ts';
  import OrbitBubble from '../bubbles/OrbitBubble.svelte';
  import { dragHold } from '../bubbles/gesture.ts';
  import { hitTarget, type Point } from '../bubbles/layout.ts';
  import { useUi } from '../state/context.svelte.ts';
  import { MAX_SHOWN, poolLayout, restEdge, sizeFor } from './poolLayout.ts';
  import PumpBubble from './PumpBubble.svelte';
  import RestingPlace from './RestingPlace.svelte';
  import RestZone from './RestZone.svelte';
  import StatsBubble, { type PoolPeriod, type PoolStats } from './StatsBubble.svelte';

  let {
    items,
    resting,
    theme,
    period,
    stats,
    onperiod,
    onopen,
    oncreate,
    onrest,
    onrestore,
  }: {
    items: PoolItem[];
    resting: { id: string; name: string }[];
    theme: RestTheme;
    period: PoolPeriod;
    stats: PoolStats;
    onperiod: () => void;
    onopen: (id: string) => void;
    oncreate: (name: string) => void;
    /** Returns false when the project can't rest right now. */
    onrest: (id: string) => boolean;
    onrestore: (id: string) => void;
  } = $props();

  const ui = useUi();
  let w = $state(0);
  let h = $state(0);
  let drag = $state<{ id: string; start: Point; offset: Point; moved: boolean }>();
  let targeted = $state(false);
  let gone = $state<{ name: string; n: number }>();

  const edge = $derived(restEdge(theme));
  const shown = $derived(items.length > MAX_SHOWN ? items.slice(0, MAX_SHOWN - 1) : items);
  const rest = $derived(items.slice(shown.length));
  const count = $derived(shown.length + (rest.length ? 1 : 0));
  const layout = $derived(poolLayout(count, w, h, edge));
  const place = (i: number, id: string) => {
    const p = layout.slots[i]!;
    return drag?.id === id ? { x: p.x + drag.offset.x, y: p.y + drag.offset.y } : p;
  };

  const hold = dragHold({
    enter(key) {
      targeted = !!key;
      if (key) ui.platform.haptic('tick');
    },
    confirm() {
      const it = items.find((i) => i.id === drag?.id);
      release();
      if (it && onrest(it.id)) {
        ui.platform.haptic('success');
        gone = { name: it.name, n: (gone?.n ?? 0) + 1 };
      }
    },
  });

  function down(e: PointerEvent) {
    const id = (e.target as Element).closest<HTMLElement>('[data-key]')?.dataset.key;
    if (!id) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    drag = { id, start: { x: e.clientX, y: e.clientY }, offset: { x: 0, y: 0 }, moved: false };
  }

  function move(e: PointerEvent) {
    if (!drag) return;
    const offset = { x: e.clientX - drag.start.x, y: e.clientY - drag.start.y };
    const moved = drag.moved || Math.hypot(offset.x, offset.y) > 8;
    drag = { ...drag, offset, moved };
    const i = shown.findIndex((it) => it.id === drag!.id);
    const p = layout.slots[i]!;
    if (moved)
      hold.over(
        hitTarget({ x: p.x + offset.x, y: p.y + offset.y }, [{ key: 'rest', at: layout.zone }], 30),
      );
  }

  function up() {
    if (drag && !drag.moved) onopen(drag.id);
    release();
  }

  function release() {
    drag = undefined;
    hold.end();
  }
</script>

<div
  class="field"
  bind:clientWidth={w}
  bind:clientHeight={h}
  role="group"
  aria-label={ui.t('nav.projects')}
  data-testid="pool"
  onpointerdown={down}
  onpointermove={move}
  onpointerup={up}
  onpointercancel={release}
>
  {#if w > 0}
    <RestingPlace {theme} {edge} {w} {h} items={resting} {onrestore} />
    <RestZone at={layout.zone} {theme} {targeted} {gone} />
    {#each shown as it, i (it.id)}
      <OrbitBubble
        at={place(i, it.id)}
        r={sizeFor(layout.orbit, it.share)}
        index={i}
        kind="project"
        id={it.id}
        label={it.name}
        sub={it.sub}
        dragging={drag?.id === it.id && drag.moved}
        onactivate={() => onopen(it.id)}
      />
    {/each}
    {#if rest.length}
      <OrbitBubble
        at={layout.slots[shown.length]!}
        r={layout.orbit}
        index={shown.length}
        kind="more"
        label={`+${rest.length}`}
        options={rest.map((it) => ({ id: it.id, name: it.name }))}
        moreLabel={ui.t('bubbles.more')}
        onactivate={(id) => id && onopen(id)}
      />
    {/if}
    <PumpBubble
      at={layout.pump}
      mid={layout.mid}
      r={layout.orbit}
      rOpen={layout.center}
      {oncreate}
    />
    <StatsBubble at={layout.mid} r={layout.center} {period} {stats} onnext={onperiod} />
  {/if}
</div>

<style>
  .field {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    border-radius: var(--radius);
    background: radial-gradient(
      closest-side,
      color-mix(in srgb, var(--accent) 9%, transparent),
      transparent
    );
  }
</style>
