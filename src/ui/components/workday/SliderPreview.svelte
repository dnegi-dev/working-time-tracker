<script lang="ts">
  import { fade } from 'svelte/transition';
  import { useUi } from '../../state/context.svelte.ts';
  import Pocket from './Pocket.svelte';
  import { options, type PocketKind, type SliderState } from './sliderGesture.ts';

  /** Where each direction leads: the far end of the track and the pockets below it. */
  let {
    phase,
    legal,
    show,
    pocket,
    dipped,
  }: {
    phase: SliderState;
    /** Minutes the left dip adds as legal break; 0 hides that pocket. */
    legal: number;
    /** Show every option: while the knob is pressed and a moment after a tap. */
    show: boolean;
    /** The pocket the knob is over right now. */
    pocket?: PocketKind;
    dipped: boolean;
  } = $props();

  const ui = useUi();
  const offer = $derived(options(phase, legal > 0));
  const end = $derived(
    phase === 'idle'
      ? `${ui.t('mode.home')} →`
      : phase === 'running'
        ? `← ${ui.t('today.stop')}`
        : `↑ ${ui.t('today.resume')}`,
  );
  const caption = (kind: PocketKind) =>
    kind === 'office'
      ? ui.t('mode.office')
      : kind === 'lunch'
        ? ui.t('today.goLunch')
        : ui.t('today.goLegal', { min: legal });
</script>

{#if show}
  <span
    class="end"
    class:left={phase === 'running'}
    data-testid="slider-preview"
    transition:fade={{ duration: 150 }}>{end}</span
  >
{/if}
{#each offer.pockets as kind (kind)}
  {#if show || kind === pocket || phase === 'lunch'}
    <Pocket
      {kind}
      active={kind === pocket && dipped}
      label="+{legal}"
      caption={show ? caption(kind) : undefined}
    />
  {/if}
{/each}

<style>
  .end {
    position: absolute;
    top: 32px;
    right: 16px;
    z-index: 1;
    translate: 0 -50%;
    padding: 4px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--t) 14%, var(--surface));
    color: var(--t);
    font-size: 0.8rem;
    font-weight: 600;
    white-space: nowrap;
    pointer-events: none;
  }
  .left {
    right: auto;
    left: 16px;
  }
</style>
