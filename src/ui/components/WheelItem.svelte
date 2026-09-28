<script lang="ts">
  import { formatMinutes } from '../../domain/index.ts';
  import { appear, look, type Slot } from './wheel.ts';

  let {
    slot,
    data,
    offset,
    animate,
    armed,
    leaving,
    running,
    quiet,
    onclick,
  }: {
    slot: 'above' | 'current' | 'below';
    data: Slot | undefined;
    offset: number;
    animate: boolean;
    armed: boolean;
    leaving: boolean;
    running: boolean;
    quiet: boolean;
    onclick: () => void;
  } = $props();

  const main = $derived(slot === 'current');
  const id = (name: string) => (main ? `project-${name}` : undefined);
</script>

<button
  class="item {slot}"
  class:main
  class:animate
  class:armed
  class:leaving
  class:empty={!data}
  style={look(offset, armed)}
  tabindex={main || !data ? -1 : 0}
  aria-hidden={!data}
  data-testid={main ? undefined : `project-${slot}`}
  {onclick}
>
  {#key data?.id}
    <span class="content" in:appear={{ skip: main || quiet }}>
      {#if data}
        <span class="head">
          {#if main}<i class="dot" class:running></i>{/if}
          <span class="name" data-testid={id('current')}>{data.name}</span>
        </span>
        <span class="time num" class:paused={main && !running} data-testid={id('total')}
          >{formatMinutes(data.minutes)}</span
        >
      {/if}
    </span>
  {/key}
</button>

<style>
  .item {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 60px;
    margin-top: -30px;
    padding: 5px 12px;
    display: block;
    text-align: left;
    border-radius: 14px;
    border: 1px solid var(--line);
    background: var(--surface);
    will-change: transform, opacity;
    transition:
      border-color 0.2s,
      background-color 0.2s,
      box-shadow 0.2s;
  }
  .item.animate {
    transition:
      transform 0.26s cubic-bezier(0.2, 0.9, 0.3, 1.15),
      opacity 0.26s,
      border-color 0.2s,
      background-color 0.2s;
  }
  .main {
    border: 2px solid var(--accent);
    box-shadow: 0 4px 14px color-mix(in srgb, var(--accent) 22%, transparent);
    cursor: inherit;
  }
  .main.leaving {
    border-color: var(--line);
    box-shadow: none;
  }
  .armed {
    border: 2px solid var(--accent);
    background: color-mix(in srgb, var(--accent) 14%, var(--surface));
  }
  .empty {
    visibility: hidden;
  }
  .content,
  .head {
    display: flex;
    min-width: 0;
  }
  .content {
    flex-direction: column;
  }
  .above .content {
    padding-right: 30px;
  }
  .head {
    align-items: center;
    gap: 6px;
  }
  .name {
    font-weight: 600;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .time {
    font-size: 1.3rem;
    font-weight: 600;
    line-height: 1.15;
  }
  .paused {
    color: var(--muted);
  }
  .dot {
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 2px solid var(--muted);
  }
  .dot.running {
    border-color: var(--accent);
    background: var(--accent);
    animation: pulse 1.6s ease-out infinite;
  }
  @keyframes pulse {
    from {
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 60%, transparent);
    }
    to {
      box-shadow: 0 0 0 8px transparent;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .item.animate,
    .dot.running {
      transition: none;
      animation: none;
    }
  }
</style>
