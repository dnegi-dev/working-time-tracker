<script lang="ts">
  import { atTime, addEntry, type ISODate, type TimeEntry } from '../../domain/index.ts';
  import { useUi } from '../state/context.svelte.ts';
  import EntryRow from './EntryRow.svelte';

  let { date, entries }: { date: ISODate; entries: TimeEntry[] } = $props();
  const ui = useUi();
  let adding = $state(false);
  let from = $state('09:00');
  let to = $state('10:00');

  function add() {
    const { projectId, placeId, mode } = ui.s.ds.current;
    void ui.app.update((ds, _now, id) =>
      addEntry(ds, {
        id: id(),
        start: atTime(date, from),
        end: atTime(date, to),
        projectId,
        placeId,
        mode,
        source: 'manual',
      }),
    );
    adding = false;
  }
</script>

<h2>{ui.t('today.entries')}</h2>
<ul class="plain" data-testid="entries">
  {#each entries as e (e.id)}<EntryRow entry={e} {date} />{/each}
</ul>
{#if adding}
  <div class="row add">
    <input type="time" bind:value={from} aria-label={ui.t('entry.from')} />
    <input type="time" bind:value={to} aria-label={ui.t('entry.to')} />
    <button class="primary" onclick={add}>{ui.t('common.add')}</button>
    <button class="link" onclick={() => (adding = false)}>{ui.t('common.cancel')}</button>
  </div>
{:else}
  <button class="link" onclick={() => (adding = true)} data-testid="add-entry"
    >+ {ui.t('entry.add')}</button
  >
{/if}

<style>
  .add {
    margin-top: 8px;
  }
</style>
