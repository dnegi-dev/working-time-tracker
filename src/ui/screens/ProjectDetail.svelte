<script lang="ts">
  import { dateOf, entryMinutes, formatMinutes, upsertProject } from '../../domain/index.ts';
  import NoteList from '../components/NoteList.svelte';
  import { useUi } from '../state/context.svelte.ts';

  let { id }: { id: string } = $props();
  const ui = useUi();
  const project = $derived(ui.s.ds.projects.find((p) => p.id === id));
  const total = $derived.by(() => {
    const now = ui.s.now.toISOString();
    return ui.s.ds.entries
      .filter((e) => e.projectId === id)
      .reduce((m, e) => m + entryMinutes(e, now), 0);
  });
  const today = $derived(dateOf(ui.s.now.toISOString()));

  function rename(e: Event) {
    const name = (e.target as HTMLInputElement).value.trim();
    if (project && name) void ui.app.update((ds) => upsertProject(ds, { ...project, name }));
  }
</script>

<a href="#/projects" class="back">← {ui.t('nav.projects')}</a>
{#if project}
  <input class="title" value={project.name} onchange={rename} aria-label={ui.t('project.name')} />
  <p class="muted num">{ui.t('project.total', { time: formatMinutes(total) })}</p>
  <button
    onclick={() =>
      ui.app.update((ds) => upsertProject(ds, { ...project, archived: !project.archived }))}
  >
    {project.archived ? ui.t('project.unarchive') : ui.t('project.archive')}
  </button>
  <h2>{ui.t('project.notes')}</h2>
  <NoteList
    date={today}
    target={{ kind: 'project', projectId: id }}
    filter={(n) => n.target.kind === 'project' && n.target.projectId === id}
    showDate
  />
{:else}
  <p class="muted">{ui.t('project.notFound')}</p>
{/if}

<style>
  .back {
    color: var(--accent);
    text-decoration: none;
  }
  .title {
    display: block;
    width: 100%;
    font-size: 1.35rem;
    font-weight: 600;
    border: none;
    background: none;
    padding: 12px 0 4px;
  }
</style>
