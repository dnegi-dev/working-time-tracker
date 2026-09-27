<script lang="ts">
  import {
    removePlace,
    updateSettings,
    upsertPlace,
    type Mode,
    type Settings,
  } from '../../../domain/index.ts';
  import { placeLabel } from '../../../application/status.ts';
  import { useUi } from '../../state/context.svelte.ts';

  const ui = useUi();
  const st = $derived(ui.s.ds.settings);
  const REGIONS = [
    'BW',
    'BY',
    'BE',
    'BB',
    'HB',
    'HH',
    'HE',
    'MV',
    'NI',
    'NW',
    'RP',
    'SL',
    'SN',
    'ST',
    'SH',
    'TH',
  ] as const;
  const set = (patch: Partial<Settings>) => ui.app.update((ds) => updateSettings(ds, patch));
  let building = $state('');
  let room = $state('');
  let mode: Mode = $state('office');

  function addPlace(e: SubmitEvent) {
    e.preventDefault();
    if (!building.trim()) return;
    const place = { building: building.trim(), room: room.trim() || undefined, mode };
    void ui.app.update((ds, _now, id) => upsertPlace(ds, { id: id(), ...place }));
    building = room = '';
  }
  const val = (e: Event) => (e.target as HTMLInputElement).value;
</script>

<h2>{ui.t('settings.office')}</h2>
<div class="card stack">
  <div class="row">
    <select
      value={st.quota.kind}
      onchange={(e) =>
        set({ quota: { kind: val(e) as 'officeDaysPerWeek', value: st.quota.value } })}
      data-testid="quota-kind"
    >
      <option value="officeDaysPerWeek">{ui.t('quota.officeDaysPerWeek')}</option>
      <option value="maxHomePercent">{ui.t('quota.maxHomePercent')}</option>
    </select>
    <input
      type="number"
      min="0"
      step="0.5"
      value={st.quota.value}
      onchange={(e) => set({ quota: { ...st.quota, value: Number(val(e)) } })}
      data-testid="quota-value"
    />
  </div>
  <label class="field">
    {ui.t('settings.region')}
    <select value={st.region} onchange={(e) => set({ region: val(e) })} data-testid="region">
      {#each REGIONS as r (r)}<option value={`DE-${r}`}>{ui.t(`region.${r}`)}</option>{/each}
    </select>
  </label>
  <label class="field">
    {ui.t('settings.holidaySource')}
    <input
      value={st.holidaySource.kind === 'ical' ? st.holidaySource.url : ''}
      placeholder={ui.t('settings.holidayBundled')}
      onchange={(e) =>
        set({ holidaySource: val(e) ? { kind: 'ical', url: val(e) } : { kind: 'bundled' } })}
    />
  </label>

  <strong>{ui.t('settings.places')}</strong>
  <ul class="plain">
    {#each ui.s.ds.places as p (p.id)}
      <li class="row between">
        <span>{placeLabel(p)} · {ui.t(`mode.${p.mode}`)}</span>
        <button class="link" onclick={() => ui.app.update((ds) => removePlace(ds, p.id))}
          >{ui.t('common.delete')}</button
        >
      </li>
    {/each}
  </ul>
  <form class="row" onsubmit={addPlace}>
    <input
      bind:value={building}
      placeholder={ui.t('place.building')}
      data-testid="place-building"
    />
    <input bind:value={room} placeholder={ui.t('place.room')} data-testid="place-room" />
    <select bind:value={mode}>
      <option value="office">{ui.t('mode.office')}</option>
      <option value="home">{ui.t('mode.home')}</option>
    </select>
    <button type="submit">{ui.t('common.add')}</button>
  </form>
  <label class="row">
    <input
      type="checkbox"
      checked={st.multiPlacePerDay}
      onchange={(e) => set({ multiPlacePerDay: (e.target as HTMLInputElement).checked })}
      data-testid="multi-place"
    />
    {ui.t('settings.multiPlace')}
  </label>
</div>

<style>
  .between {
    justify-content: space-between;
  }
  input[type='checkbox'] {
    min-height: 0;
  }
  form input {
    flex: 1 1 100px;
  }
</style>
