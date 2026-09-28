<script lang="ts">
  import { onDestroy, tick } from 'svelte';
  import { useUi } from '../state/context.svelte.ts';
  import type { Point } from '../bubbles/layout.ts';

  /**
   * Pump it up to create a project: every press adds air, holding keeps inflating,
   * idle air leaks out. Once full it floats to the middle and asks for a name.
   */
  let {
    at,
    mid,
    r,
    rOpen,
    oncreate,
  }: { at: Point; mid: Point; r: number; rOpen: number; oncreate: (name: string) => void } =
    $props();

  const ui = useUi();
  const STEP = 40;
  let air = $state(0);
  let pressed = false;
  let open = $state(false);
  let name = $state('');
  let input = $state<HTMLInputElement>();
  let timer: ReturnType<typeof setInterval> | undefined;

  const size = $derived(open ? rOpen : r * (0.8 + air * 0.9));
  const pos = $derived(open ? mid : at);

  function pump(amount: number) {
    const before = Math.floor(air * 4);
    air = Math.min(1, air + amount);
    if (Math.floor(air * 4) > before) ui.platform.haptic('tick');
    if (air >= 1) void inflate();
    else run();
  }

  function run() {
    timer ??= setInterval(() => {
      if (open) return stop();
      if (pressed) return pump(STEP / 1000);
      air = Math.max(0, air - STEP / 4000);
      if (air === 0) stop();
    }, STEP);
  }

  function stop() {
    clearInterval(timer);
    timer = undefined;
  }

  async function inflate() {
    stop();
    pressed = false;
    open = true;
    ui.platform.haptic('success');
    await tick();
    input?.focus();
  }

  function deflate() {
    open = false;
    air = 0;
    name = '';
  }

  function submit(e: SubmitEvent) {
    e.preventDefault();
    const n = name.trim();
    if (n) oncreate(n);
    deflate();
  }

  function down(e: PointerEvent) {
    if (open) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    pressed = true;
    pump(0.12);
  }

  onDestroy(stop);
</script>

<div
  class="pump"
  class:open
  style:width="{2 * size}px"
  style:height="{2 * size}px"
  style:transform="translate({pos.x - size}px, {pos.y - size}px)"
  style:--air={air}
  data-testid="pump"
  data-air={air.toFixed(2)}
>
  {#if open}
    <form class="bubble" onsubmit={submit}>
      <input
        bind:this={input}
        bind:value={name}
        placeholder={ui.t('project.new')}
        aria-label={ui.t('project.name')}
        data-testid="project-name"
        onkeydown={(e) => e.key === 'Escape' && deflate()}
        onblur={() => !name.trim() && deflate()}
      />
    </form>
  {:else}
    <button
      class="bubble"
      aria-label={ui.t('pool.pump')}
      onpointerdown={down}
      onpointerup={() => (pressed = false)}
      onpointercancel={() => (pressed = false)}
      onclick={(e) => e.detail === 0 && pump(0.25)}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>
      <span class="hint">{ui.t('pool.pumpShort')}</span>
    </button>
  {/if}
</div>

<style>
  .pump {
    --tone: var(--accent);
    position: absolute;
    left: 0;
    top: 0;
    z-index: 2;
    /* size follows the air quickly; moving and room changes spring softly */
    transition:
      transform 0.6s var(--spring),
      width 0.25s var(--spring),
      height 0.25s var(--spring);
  }
  .open {
    z-index: 5;
  }
  .bubble {
    width: 100%;
    height: 100%;
    min-height: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: var(--tone);
    background: color-mix(in srgb, var(--tone) calc(var(--air) * 22%), var(--surface));
    border: 1.5px dashed color-mix(in srgb, var(--tone) 60%, var(--line));
    box-shadow: 0 3px 12px color-mix(in srgb, var(--tone) calc(8% + var(--air) * 30%), transparent);
    touch-action: none;
    animation: wobble 1.6s ease-in-out infinite;
  }
  .open .bubble {
    border: 3px solid var(--tone);
    background: var(--surface);
    animation: none;
  }
  svg {
    width: 40%;
    max-width: 22px;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
  }
  .hint {
    font-size: 0.62rem;
    font-weight: 600;
  }
  input {
    width: 78%;
    text-align: center;
    font-weight: 600;
  }
  @keyframes wobble {
    0%,
    100% {
      scale: 1 1;
    }
    50% {
      scale: 1.04 0.97;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .pump {
      transition: none;
    }
    .bubble {
      animation: none;
    }
  }
</style>
