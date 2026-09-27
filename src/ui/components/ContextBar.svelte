<script lang="ts">
  import { switchLocation, switchProject, type Mode } from '../../domain/index.ts';
  import { placeLabel } from '../../application/status.ts';
  import { useUi } from '../state/context.svelte.ts';

  const ui = useUi();
  const ds = $derived(ui.s.ds);
  const projects = $derived(ds.projects.filter((p) => !p.archived));

  function setProject(e: Event) {
    const v = (e.target as HTMLSelectElement).value || undefined;
    void ui.app.update((d, now, id) => switchProject(d, v, now, id(), 'manual'));
  }

  function setPlace(e: Event) {
    const v = (e.target as HTMLSelectElement).value;
    const place = ds.places.find((p) => p.id === v);
    const loc = place ? { placeId: place.id, mode: place.mode } : { mode: v as Mode };
    void ui.app.update((d, now, id) => switchLocation(d, loc, now, id(), 'manual'));
  }
</script>

<div class="bar">
  <label class="field">
    {ui.t('today.project')}
    <select value={ds.current.projectId ?? ''} onchange={setProject} data-testid="project-select">
      <option value="">{ui.t('project.none')}</option>
      {#each projects as p (p.id)}<option value={p.id}>{p.name}</option>{/each}
    </select>
  </label>
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
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  select {
    width: 100%;
  }
</style>
