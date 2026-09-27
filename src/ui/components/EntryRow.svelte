<script lang="ts">
  import {
    atTime,
    entryMinutes,
    formatMinutes,
    removeEntry,
    updateEntry,
    type ISODate,
    type TimeEntry,
  } from '../../domain/index.ts';
  import { placeLabel } from '../../application/status.ts';
  import { formatTime } from '../../i18n/index.ts';
  import { useUi } from '../state/context.svelte.ts';

  let { entry, date }: { entry: TimeEntry; date: ISODate } = $props();
  const ui = useUi();
  let editing = $state(false);
  const ds = $derived(ui.s.ds);
  const project = $derived(ds.projects.find((p) => p.id === entry.projectId)?.name);
  const place = $derived(ds.places.find((p) => p.id === entry.placeId));
  const hm = (iso: string) => formatTime(iso, 'de');

  function setTime(field: 'start' | 'end', e: Event) {
    const v = (e.target as HTMLInputElement).value;
    if (v) void ui.app.update((d) => updateEntry(d, entry.id, { [field]: atTime(date, v) }));
  }
  function setProject(e: Event) {
    const projectId = (e.target as HTMLSelectElement).value || undefined;
    void ui.app.update((d) => updateEntry(d, entry.id, { projectId }));
  }
</script>

<li>
  <button class="line" onclick={() => (editing = !editing)} aria-expanded={editing}>
    <span class="num"
      >{formatTime(entry.start, ui.locale)} – {entry.end
        ? formatTime(entry.end, ui.locale)
        : '…'}</span
    >
    <span class="muted what"
      >{project ?? ui.t('project.none')} · {place
        ? placeLabel(place)
        : ui.t(`mode.${entry.mode}`)}</span
    >
    <span class="num">{formatMinutes(entryMinutes(entry, ui.s.now.toISOString()))}</span>
  </button>
  {#if editing}
    <div class="row edit">
      <input
        type="time"
        value={hm(entry.start)}
        onchange={(e) => setTime('start', e)}
        aria-label={ui.t('entry.from')}
      />
      {#if entry.end}
        <input
          type="time"
          value={hm(entry.end)}
          onchange={(e) => setTime('end', e)}
          aria-label={ui.t('entry.to')}
        />
      {/if}
      <select
        value={entry.projectId ?? ''}
        onchange={setProject}
        aria-label={ui.t('today.project')}
      >
        <option value="">{ui.t('project.none')}</option>
        {#each ds.projects as p (p.id)}<option value={p.id}>{p.name}</option>{/each}
      </select>
      <button onclick={() => ui.app.update((d) => removeEntry(d, entry.id))}
        >{ui.t('common.delete')}</button
      >
    </div>
  {/if}
</li>

<style>
  .line {
    all: unset;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 12px;
    width: 100%;
    cursor: pointer;
  }
  .what {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .edit {
    margin-top: 8px;
  }
</style>
