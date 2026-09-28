<script lang="ts">
  import { switchLocation, type Mode } from '../../domain/index.ts';
  import { placeLabel } from '../../application/status.ts';
  import { useUi } from '../state/context.svelte.ts';

  const ui = useUi();
  const ds = $derived(ui.s.ds);

  function setPlace(e: Event) {
    const v = (e.target as HTMLSelectElement).value;
    const place = ds.places.find((p) => p.id === v);
    const loc = place ? { placeId: place.id, mode: place.mode } : { mode: v as Mode };
    void ui.app.update((d, now, id) => switchLocation(d, loc, now, id(), 'manual'));
  }
</script>

<div class="bar">
  <label class="field">
    {ui.t('today.place')}
    <select
      value={ds.current.placeId ?? ds.current.mode}
      onchange={setPlace}
      data-testid="place-select"
    >
      <option value="office">{ui.t('mode.office')}</option>
      <option value="home">{ui.t('mode.home')}</option>
      {#each ds.places as p (p.id)}
        <option value={p.id}>{placeLabel(p)} · {ui.t(`mode.${p.mode}`)}</option>
      {/each}
    </select>
  </label>
</div>

<style>
  .bar {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  select {
    width: 100%;
  }
</style>
