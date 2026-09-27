<script lang="ts">
  import { useUi } from '../state/context.svelte.ts';
  import { router } from '../state/router.svelte.ts';

  const ui = useUi();
  const tabs = [
    { path: 'today', key: 'nav.today', icon: '◷' },
    { path: 'overview', key: 'nav.overview', icon: '▦' },
    { path: 'projects', key: 'nav.projects', icon: '▤' },
    { path: 'settings', key: 'nav.settings', icon: '⚙' },
  ] as const;
  const active = $derived(router.route.name === 'project' ? 'projects' : router.route.name);
</script>

<nav aria-label={ui.t('nav.label')}>
  {#each tabs as tab (tab.path)}
    <a href={`#/${tab.path}`} class:active={active === tab.path} data-testid={`nav-${tab.path}`}>
      <span aria-hidden="true">{tab.icon}</span>
      {ui.t(tab.key)}
    </a>
  {/each}
</nav>

<style>
  nav {
    position: fixed;
    inset: auto 0 0 0;
    display: flex;
    justify-content: space-around;
    background: var(--surface);
    border-top: 1px solid var(--line);
    padding: 6px 0 calc(6px + env(safe-area-inset-bottom));
    z-index: 10;
  }
  a {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    font-size: 0.75rem;
    color: var(--muted);
    text-decoration: none;
    padding: 4px 12px;
  }
  a span {
    font-size: 1.2rem;
  }
  a.active {
    color: var(--accent);
  }
  @media (min-width: 768px) {
    nav {
      position: sticky;
      top: 0;
      height: 100dvh;
      flex-direction: column;
      justify-content: flex-start;
      gap: 4px;
      border-top: none;
      border-right: 1px solid var(--line);
      padding: 32px 12px;
    }
    a {
      flex-direction: row;
      font-size: 0.95rem;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 10px;
    }
    a.active {
      background: var(--bg);
    }
  }
</style>
