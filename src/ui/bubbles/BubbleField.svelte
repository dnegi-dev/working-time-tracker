<script lang="ts" module>
  export interface OrbitItem {
    key: string;
    kind: 'project' | 'more';
    label: string;
    sub?: string;
    options?: { id: string; name: string }[];
  }
</script>

<script lang="ts">
  import type { Focus } from '../../domain/index.ts';
  import { useUi } from '../state/context.svelte.ts';
  import FocusBubble, { type FocusState } from './FocusBubble.svelte';
  import OrbitBubble from './OrbitBubble.svelte';
  import Oxygen from './Oxygen.svelte';
  import Tethers from './Tethers.svelte';
  import { dragHold } from './gesture.ts';
  import { hitTarget, orbitSlots, radii, type Point } from './layout.ts';

  let {
    center,
    items,
    showBreak,
    onpick,
  }: {
    center: {
      name: string;
      minutes: number;
      focus: Focus | undefined;
      total: number;
      mode: FocusState;
      breakMinutes: number;
    };
    items: OrbitItem[];
    showBreak: boolean;
    onpick: (key: string) => void;
  } = $props();

  const ui = useUi();
  let w = $state(0);
  let h = $state(0);
  let offset = $state<Point>({ x: 0, y: 0 });
  let target = $state<string>();
  let dragging = $state(false);
  let start: Point | undefined;

  const r = $derived(radii(w, h));
  const home = $derived({ x: w / 2, y: h / 2 });
  const layout = $derived(orbitSlots(items.length, w, h));
  const spots = $derived([
    ...items.map((it, i) => ({ key: it.key, at: layout.slots[i]! })),
    ...(showBreak ? [{ key: 'break', at: layout.brk }] : []),
  ]);
  const targets = $derived(spots.filter((s) => s.key !== 'more'));
  const pos = $derived({ x: home.x + offset.x, y: home.y + offset.y });
  const full = $derived(center.mode === 'running' && !!center.focus?.full);

  const hold = dragHold({
    enter(key) {
      target = key;
      if (key) ui.platform.haptic('tick');
    },
    confirm(key) {
      ui.platform.haptic('success');
      release();
      onpick(key);
    },
  });

  function down(e: PointerEvent) {
    if (!(e.target as Element).closest('.focus')) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    start = { x: e.clientX, y: e.clientY };
    dragging = true;
  }

  function move(e: PointerEvent) {
    if (!start) return;
    const x = Math.min(w, Math.max(0, home.x + e.clientX - start.x));
    const y = Math.min(h, Math.max(0, home.y + e.clientY - start.y));
    offset = { x: x - home.x, y: y - home.y };
    hold.over(hitTarget({ x, y }, targets, r.orbit));
  }

  function release() {
    start = undefined;
    dragging = false;
    offset = { x: 0, y: 0 };
    hold.end();
  }
</script>

<div
  class="field"
  bind:clientWidth={w}
  bind:clientHeight={h}
  role="group"
  aria-label={ui.t('today.project')}
  onpointerdown={down}
  onpointermove={move}
  onpointerup={release}
  onpointercancel={release}
>
  {#if w > 0}
    <Tethers {w} {h} from={pos} to={spots} {target} />
    <Oxygen active={center.mode === 'running'} from={home} r={r.center} />
    {#each items as it, i (it.key)}
      <OrbitBubble
        at={layout.slots[i]!}
        r={r.orbit}
        index={i}
        kind={it.kind}
        label={it.label}
        sub={it.sub}
        options={it.options}
        moreLabel={ui.t('bubbles.more')}
        targeted={target === it.key}
        still={center.mode === 'stopped'}
        onactivate={(id) => onpick(id ?? it.key)}
      />
    {/each}
    {#if showBreak}
      <OrbitBubble
        at={layout.brk}
        r={r.orbit}
        index={items.length}
        kind="break"
        label={ui.t('bubbles.break')}
        targeted={target === 'break'}
        glow={full}
        onactivate={() => onpick('break')}
      />
    {/if}
    <FocusBubble {...center} at={pos} r={r.center} {dragging} />
  {/if}
</div>

<style>
  .field {
    position: relative;
    flex: 1;
    min-height: 340px;
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
