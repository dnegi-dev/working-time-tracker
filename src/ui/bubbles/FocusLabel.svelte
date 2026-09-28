<script lang="ts">
  import { formatMinutes, type Focus } from '../../domain/index.ts';
  import { useUi } from '../state/context.svelte.ts';

  /** Text inside the focus bubble: the project and its round, or the break and what comes next. */
  let {
    onBreak,
    stopped,
    full,
    name,
    minutes,
    focus,
    total,
    breakMinutes,
    next,
  }: {
    onBreak: boolean;
    stopped: boolean;
    full: boolean;
    name: string;
    minutes: number;
    focus: Focus | undefined;
    total: number;
    breakMinutes: number;
    next?: string;
  } = $props();

  const ui = useUi();
</script>

<div class="label" class:stopped>
  {#if onBreak}
    <span class="title">{ui.t('bubbles.break')}</span>
    <span class="big num" data-testid="break-time">{formatMinutes(breakMinutes)}</span>
    <span class="small">
      <span data-testid="project-current">{name}</span>
      <span class="num" data-testid="project-total">{formatMinutes(minutes)}</span>
    </span>
    {#if next}
      <span class="small next" data-testid="break-next">{ui.t('bubbles.next', { name: next })}</span
      >
    {/if}
  {:else}
    <span class="title" data-testid="project-current">{name}</span>
    <span class="big num" data-testid="project-total">{formatMinutes(minutes)}</span>
    {#if focus}
      <span class="small" class:full>
        {full
          ? ui.t('bubbles.full')
          : ui.t('bubbles.focus', { elapsed: String(focus.elapsed), total: String(total) })}
      </span>
    {/if}
  {/if}
</div>

<style>
  .label {
    position: absolute;
    inset: 0;
    padding: 14%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 2px;
    user-select: none;
    -webkit-user-select: none;
  }
  .title,
  .small {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .title {
    font-weight: 600;
  }
  .big {
    font-size: 1.8rem;
    font-weight: 700;
    line-height: 1.1;
  }
  .small {
    font-size: 0.72rem;
    color: var(--muted);
  }
  .full,
  .next {
    color: var(--tone);
    font-weight: 600;
  }
  .stopped {
    color: var(--muted);
  }
</style>
