<script lang="ts">
  import {
    dateOf,
    entryMinutes,
    formatMinutes,
    periodRange,
    upsertProject,
  } from '../../domain/index.ts';
  import { useUi } from '../state/context.svelte.ts';

  const ui = useUi();
  const s = $derived(ui.s);
  let name = $state('');
  let showArchived = $state(false);

  const monthMinutes = $derived.by(() => {
    const now = s.now.toISOString();
    const { from, to } = periodRange('month', dateOf(now));
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- rebuilt on every derive
    const sums = new Map<string, number>();
    for (const e of s.ds.entries) {
      const d = dateOf(e.start);
      if (e.projectId && d >= from && d <= to)
        sums.set(e.projectId, (sums.get(e.projectId) ?? 0) + entryMinutes(e, now));
    }
    return sums;
  });
  const list = $derived(s.ds.projects.filter((p) => showArchived || !p.archived));

  function add(e: SubmitEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    void ui.app.update((ds, _now, id) => upsertProject(ds, { id: id(), name: n, archived: false }));
    name = '';
  }
</script>

<h1>{ui.t('nav.projects')}</h1>
<form class="row" onsubmit={add}>
  <input bind:value={name} placeholder={ui.t('project.new')} data-testid="project-name" />
  <button class="primary" type="submit">{ui.t('common.add')}</button>
</form>

<ul class="plain list" data-testid="project-list">
  {#each list as p (p.id)}
    <li>
      <a href={`#/project/${p.id}`} class:archived={p.archived}>
        <span>{p.name}</span>
        <span class="muted num"
          >{formatMinutes(monthMinutes.get(p.id) ?? 0)} {ui.t('project.thisMonth')}</span
        >
      </a>
    </li>
  {:else}
    <li class="muted">{ui.t('project.empty')}</li>
  {/each}
</ul>
<label class="row muted"
  ><input type="checkbox" bind:checked={showArchived} /> {ui.t('project.showArchived')}</label
>

<style>
  .list {
    margin: 16px 0;
  }
  a {
    display: flex;
    justify-content: space-between;
    color: inherit;
    text-decoration: none;
  }
  .archived {
    opacity: 0.5;
  }
  form input {
    flex: 1;
  }
  input[type='checkbox'] {
    min-height: 0;
  }
</style>
