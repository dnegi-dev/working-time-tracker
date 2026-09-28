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
    queued,
    onpick,
    onqueue,
  }: {
    center: {
      name: string;
      minutes: number;
      focus: Focus | undefined;
      total: number;
      mode: FocusState;
      breakMinutes: number;
      next?: string;
    };
    items: OrbitItem[];
    showBreak: boolean;
    queued?: string;
    onpick: (key: string) => void;
    /** During a break: a project bubble was held inside the centre. */
    onqueue: (key: string) => void;
  } = $props();

  const ui = useUi();
  let w = $state(0);
  let h = $state(0);
  let offset = $state<Point>({ x: 0, y: 0 });
  let target = $state<string>();
  /** What is being dragged: the centre bubble or (during a break) a project bubble. */
  let source = $state<string>();
  let start: Point | undefined;

  const r = $derived(radii(w, h));
  const home = $derived({ x: w / 2, y: h / 2 });
  const layout = $derived(orbitSlots(items.length, w, h));
  const moved = (key: string, p: Point) =>
    source === key ? { x: p.x + offset.x, y: p.y + offset.y } : p;
  const slots = $derived(items.map((it, i) => moved(it.key, layout.slots[i]!)));
  const spots = $derived([
    ...items.map((it, i) => ({ key: it.key, at: slots[i]! })),
    ...(showBreak ? [{ key: 'break', at: layout.brk }] : []),
  ]);
  const targets = $derived(spots.filter((s) => s.key !== 'more'));
  const pos = $derived(moved('center', home));
  const full = $derived(center.mode === 'running' && !!center.focus?.full);

  const hold = dragHold({
    enter(key) {
      target = key;
      if (key) ui.platform.haptic('tick');
    },
    confirm(key) {
      const from = source;
      ui.platform.haptic('success');
      release();
      if (key === 'queue' && from) onqueue(from);
      else onpick(key);
    },
  });

  function down(e: PointerEvent) {
    const el = e.target as Element;
    const key = el.closest('.focus')
      ? 'center'
      : center.mode === 'break'
        ? el.closest<HTMLElement>('[data-key]')?.dataset.key
        : undefined;
    if (!key) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    start = { x: e.clientX, y: e.clientY };
    source = key;
  }

  function move(e: PointerEvent) {
    if (!start || !source) return;
    const origin =
      source === 'center' ? home : layout.slots[items.findIndex((i) => i.key === source)]!;
    const x = Math.min(w, Math.max(0, origin.x + e.clientX - start.x));
    const y = Math.min(h, Math.max(0, origin.y + e.clientY - start.y));
    offset = { x: x - origin.x, y: y - origin.y };
    hold.over(
      source === 'center'
        ? hitTarget({ x, y }, targets, r.orbit)
        : hitTarget({ x, y }, [{ key: 'queue', at: home }], r.center - 10),
    );
  }

  function release() {
    start = undefined;
    source = undefined;
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
        at={slots[i]!}
        id={it.kind === 'project' ? it.key : undefined}
        queued={queued === it.key}
        dragging={source === it.key}
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
    <FocusBubble
      {...center}
      at={pos}
      r={r.center}
      dragging={source === 'center'}
      targeted={target === 'queue'}
    />
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
