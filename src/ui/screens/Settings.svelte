<script lang="ts">
  import SettingsAutomation from '../components/settings/SettingsAutomation.svelte';
  import SettingsData from '../components/settings/SettingsData.svelte';
  import SettingsOffice from '../components/settings/SettingsOffice.svelte';
  import SettingsWork from '../components/settings/SettingsWork.svelte';
  import { logout } from '../state/auth.ts';
  import { useUi } from '../state/context.svelte.ts';

  let { onLogout }: { onLogout: () => void } = $props();
  const ui = useUi();
</script>

<h1>{ui.t('nav.settings')}</h1>
<SettingsWork />
<SettingsOffice />
<SettingsData />
<SettingsAutomation />
{#if !ui.platform.isNative}
  <h2>{ui.t('settings.account')}</h2>
  <button onclick={() => (logout(), onLogout())}>{ui.t('login.logout')}</button>
{/if}
