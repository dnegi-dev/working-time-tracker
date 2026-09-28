<script lang="ts">
  import HoldRing from './HoldRing.svelte';
  import type { Point } from './layout.ts';

  let {
    at,
    r,
    index,
    kind,
    label,
    sub,
    id,
    targeted = false,
    queued = false,
    dragging = false,
    glow = false,
    still = false,
    options = [],
    moreLabel = '',
    onactivate,
  }: {
    at: Point;
    r: number;
    index: number;
    kind: 'project' | 'break' | 'more';
    label: string;
    sub?: string;
    id?: string;
    targeted?: boolean;
    queued?: boolean;
    dragging?: boolean;
    glow?: boolean;
    still?: boolean;
    options?: { id: string; name: string }[];
    moreLabel?: string;
    onactivate: (id?: string) => void;
  } = $props();

  const style = $derived(
    `transform: translate(${at.x - r}px, ${at.y - r}px); width: ${2 * r}px; height: ${2 * r}px;` +
      `--drift: ${7 + (index % 3) * 1.7}s; --delay: -${index * 1.3}s`,
  );
</script>

{#if kind === 'more'}
  <label class="orbit more" class:still {style} data-testid="orbit-more">
    <span class="bubble"><span class="name">{label}</span></span>
    <select
      aria-label={moreLabel}
      value=""
      onchange={(e) => onactivate((e.target as HTMLSelectElement).value)}
    >
      <option value="" disabled>{moreLabel}</option>
      {#each options as o (o.id)}<option value={o.id}>{o.name}</option>{/each}
    </select>
  </label>
{:else}
  <button
    class="orbit {kind}"
    class:targeted
    class:queued
    class:dragging
    class:glow
    class:still
    {style}
    data-key={id}
    data-queued={queued}
    data-testid={kind === 'break' ? 'orbit-break' : 'orbit'}
    onclick={(e) => e.detail === 0 && onactivate()}
  >
    <span class="bubble">
      {#if kind === 'break'}
        <svg class="pause" viewBox="0 0 16 16" aria-hidden="true"
          ><path d="M5.5 3v10M10.5 3v10" /></svg
        >
      {/if}
      <span class="name">{label}</span>
      {#if sub}<span class="sub num">{sub}</span>{/if}
      <HoldRing active={targeted} />
    </span>
  </button>
{/if}

<style>
  .orbit {
    --tone: var(--accent);
    position: absolute;
    left: 0;
    top: 0;
    z-index: 1;
    padding: 0;
    min-height: 0;
    border: none;
    background: none;
    transition: transform 0.5s ease;
  }
  .orbit.break {
    --tone: var(--calm);
  }
  .bubble {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--surface);
    border: 1.5px solid color-mix(in srgb, var(--tone) 45%, var(--line));
    box-shadow: 0 3px 10px color-mix(in srgb, var(--tone) 14%, transparent);
    animation: drift var(--drift) ease-in-out var(--delay) infinite;
    transition:
      scale 0.2s,
      background-color 0.2s,
      border-color 0.2s;
  }
  .still .bubble {
    animation: none;
  }
  .break .bubble {
    border-style: dashed;
    background: color-mix(in srgb, var(--tone) 10%, var(--surface));
  }
  .glow .bubble {
    border-style: solid;
    border-color: var(--tone);
    box-shadow: 0 0 0 6px color-mix(in srgb, var(--tone) 22%, transparent);
  }
  .targeted {
    z-index: 3;
  }
  .targeted .bubble {
    scale: 1.18;
    border-color: var(--tone);
    background: color-mix(in srgb, var(--tone) 18%, var(--surface));
  }
  .name {
    max-width: 86%;
    font-size: 0.72rem;
    font-weight: 600;
    line-height: 1.15;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow-wrap: anywhere;
  }
  .sub {
    font-size: 0.66rem;
    color: var(--muted);
  }
  .pause {
    width: 14px;
    height: 14px;
    stroke: var(--tone);
    stroke-width: 2.4;
    stroke-linecap: round;
  }
  .queued .bubble {
    border: 2.5px solid var(--tone);
    background: color-mix(in srgb, var(--tone) 12%, var(--surface));
  }
  .dragging {
    z-index: 3;
    transition: none;
  }
  .dragging .bubble {
    animation: none;
    scale: 0.92;
  }
  .more select {
    position: absolute;
    inset: 0;
    opacity: 0;
    min-height: 0;
    cursor: pointer;
  }
  @keyframes drift {
    0%,
    100% {
      translate: 0 0;
    }
    33% {
      translate: 4px -5px;
    }
    66% {
      translate: -4px 3px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .bubble {
      animation: none;
    }
  }
</style>
