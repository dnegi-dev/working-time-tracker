<script lang="ts">
  import type { Snippet } from 'svelte';
  import { useUi } from '../state/context.svelte.ts';
  import WheelItem from './WheelItem.svelte';
  import { pull, STEP, type Slot } from './wheel.ts';

  type Side = 'above' | 'below';
  let {
    above,
    current,
    below,
    running,
    onarm,
    onswitch,
    picker,
  }: {
    above: Slot | undefined;
    current: Slot;
    below: Slot | undefined;
    running: boolean;
    onarm: (armed: boolean) => void;
    onswitch: (id: string) => void;
    /** Control shown on the resting "above" row to choose its project. */
    picker?: Snippet;
  } = $props();

  const ANIM_MS = 260;
  const ui = useUi();
  let dy = $state(0);
  let animating = $state(false);
  let target = $state<Side>();
  let quiet = $state<Side[]>([]);
  let startY: number | undefined;
  let moved = false;

  const rows = $derived([
    { slot: 'above' as const, rest: -STEP, data: above },
    { slot: 'current' as const, rest: 0, data: current },
    { slot: 'below' as const, rest: STEP, data: below },
  ]);
  const slotOf = (side: Side) => (side === 'above' ? above : below);

  function down(e: PointerEvent) {
    if (animating || (e.target as Element).closest('select')) return;
    startY = e.clientY;
    moved = false;
  }

  function move(e: PointerEvent) {
    if (startY === undefined) return;
    const raw = e.clientY - startY;
    if (!moved) {
      if (Math.abs(raw) < 6) return;
      moved = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    const side: Side = raw > 0 ? 'above' : 'below';
    dy = pull(raw, !!slotOf(side));
    const next = Math.abs(dy) >= STEP / 2 && slotOf(side) ? side : undefined;
    if (next && next !== target) ui.platform.haptic('tick');
    target = next;
    onarm(!!next);
  }

  function up(e: PointerEvent) {
    if (startY === undefined) return;
    startY = undefined;
    onarm(false);
    if (!moved) return;
    if (target && e.type === 'pointerup') commit(target);
    else settle();
  }

  function settle() {
    animating = true;
    dy = 0;
    target = undefined;
    setTimeout(() => (animating = false), ANIM_MS);
  }

  function commit(side: Side) {
    const id = slotOf(side)?.id;
    if (!id || animating) return;
    animating = true;
    target = side;
    dy = side === 'above' ? STEP : -STEP;
    setTimeout(() => {
      // Swiping down leaves the old current exactly where "below" shows it next.
      quiet = side === 'above' ? ['below'] : [];
      onswitch(id);
      animating = false;
      dy = 0;
      target = undefined;
    }, ANIM_MS);
  }

  function tap(slot: Side | 'current') {
    if (slot !== 'current' && !moved) commit(slot);
  }
</script>

<div
  class="wheel"
  role="group"
  aria-label={ui.t('today.project')}
  onpointerdown={down}
  onpointermove={move}
  onpointerup={up}
  onpointercancel={up}
>
  {#each rows as row (row.slot)}
    <WheelItem
      slot={row.slot}
      data={row.data}
      offset={row.rest + dy}
      animate={animating}
      armed={target === row.slot}
      leaving={row.slot === 'current' && !!target}
      {running}
      quiet={quiet.includes(row.slot as Side)}
      onclick={() => tap(row.slot)}
    />
  {/each}
  {#if picker && above}
    <div class="picker" class:hidden={dy !== 0} style:top="calc(50% - {STEP}px)">
      {@render picker()}
    </div>
  {/if}
</div>

<style>
  .wheel {
    position: relative;
    flex: 1;
    min-height: 176px;
    overflow: hidden;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    cursor: grab;
    mask-image: linear-gradient(transparent, #000 8%, #000 92%, transparent);
  }
  .picker {
    position: absolute;
    right: 14px;
    transform: translateY(-50%);
    transition: opacity 0.15s;
  }
  .picker.hidden {
    opacity: 0;
    pointer-events: none;
  }
</style>
