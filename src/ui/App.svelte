<script lang="ts">
  import Nav from './components/Nav.svelte';
  import Toast from './components/Toast.svelte';
  import Login from './screens/Login.svelte';
  import Overview from './screens/Overview.svelte';
  import ProjectDetail from './screens/ProjectDetail.svelte';
  import Projects from './screens/Projects.svelte';
  import Settings from './screens/Settings.svelte';
  import Today from './screens/Today.svelte';
  import { useUi } from './state/context.svelte.ts';
  import { isLoggedIn } from './state/auth.ts';
  import { router } from './state/router.svelte.ts';

  const ui = useUi();
  let loggedIn = $state(ui.platform.isNative || isLoggedIn(ui.platform.loginHash));
  const route = $derived(router.route);
</script>

{#if !loggedIn}
  <Login onLogin={() => (loggedIn = true)} />
{:else}
  <div class="shell">
    <Nav />
    <main>
      {#if route.name === 'overview'}
        <Overview />
      {:else if route.name === 'projects'}
        <Projects />
      {:else if route.name === 'project'}
        <ProjectDetail id={route.id} />
      {:else if route.name === 'settings'}
        <Settings onLogout={() => (loggedIn = false)} />
      {:else}
        <Today />
      {/if}
    </main>
  </div>
{/if}
<Toast />

<style>
  .shell {
    min-height: 100dvh;
  }
  main {
    max-width: 640px;
    margin: 0 auto;
    padding: calc(16px + env(safe-area-inset-top)) 16px calc(96px + env(safe-area-inset-bottom));
  }
  @media (min-width: 768px) {
    .shell {
      display: grid;
      grid-template-columns: 200px 1fr;
    }
    main {
      padding: 32px;
    }
  }
</style>
