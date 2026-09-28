<script lang="ts">
  import {
    dateOf,
    previousProjectId,
    projectMinutesOn,
    runningEntry,
    switchProject,
  } from '../../domain/index.ts';
  import { useUi } from '../state/context.svelte.ts';
  import ProjectWheel from './ProjectWheel.svelte';

  const KEY = 'wtt:nextProject';
  const ui = useUi();
  const ds = $derived(ui.s.ds);
  const now = $derived(ui.s.now.toISOString());
  const running = $derived(!!runningEntry(ds));
  const current = $derived(ds.current.projectId);
  const prev = $derived(previousProjectId(ds));
  const choices = $derived(
    ds.projects.filter((p) => !p.archived && p.id !== current && p.id !== prev),
  );
  let chosen = $state(read());
  let armed = $state(false);
  const next = $derived((choices.find((p) => p.id === chosen) ?? choices[0])?.id);

  function slot(id: string | undefined) {
    return {
      id,
      name: ds.projects.find((p) => p.id === id)?.name ?? ui.t('project.none'),
      minutes: projectMinutesOn(ds, dateOf(now), id, now),
    };
  }

  function read() {
    try {
      return localStorage.getItem(KEY) ?? undefined;
    } catch {
      return undefined;
    }
  }

  function choose(e: Event) {
    chosen = (e.target as HTMLSelectElement).value;
    try {
      localStorage.setItem(KEY, chosen);
    } catch {
      /* per-viewer convenience only */
    }
  }

  function go(id: string) {
    if (id !== current)
      void ui.app.update((d, t, newId) => switchProject(d, id, t, newId(), 'manual'));
  }
</script>

<section class="card" data-testid="project-timer">
  <h2 class:armed>{armed ? ui.t('today.release') : ui.t('today.project')}</h2>
  <ProjectWheel
    above={next ? slot(next) : undefined}
    current={slot(current)}
    below={prev ? slot(prev) : undefined}
    {running}
    onarm={(a) => (armed = a)}
    onswitch={go}
    picker={choices.length > 1 ? pickNext : undefined}
  />
</section>

{#snippet pickNext()}
  <label class="pick" title={ui.t('today.nextProject')}>
    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6.5l4 4 4-4" /></svg>
    <select value={next} onchange={choose} aria-label={ui.t('today.nextProject')}>
      {#each choices as p (p.id)}
        <option value={p.id}>{p.name}</option>
      {/each}
    </select>
  </label>
{/snippet}

<style>
  .card {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-inline: 10px;
  }
  h2 {
    margin: 0;
    padding-inline: 6px;
    font-size: 0.9rem;
    transition: color 0.15s;
  }
  h2.armed {
    color: var(--accent);
  }
  .pick {
    position: relative;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--accent);
  }
  .pick svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .pick select {
    position: absolute;
    inset: 0;
    opacity: 0;
    min-height: 0;
    padding: 0;
    cursor: pointer;
  }
</style>
