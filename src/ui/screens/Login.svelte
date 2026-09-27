<script lang="ts">
  import { checkLogin } from '../../application/auth.ts';
  import { rememberLogin } from '../state/auth.ts';
  import { useUi } from '../state/context.svelte.ts';

  let { onLogin }: { onLogin: () => void } = $props();
  const ui = useUi();
  let user = $state('');
  let pass = $state('');
  let failed = $state(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (await checkLogin(user, pass, ui.platform.loginHash)) {
      rememberLogin(ui.platform.loginHash);
      onLogin();
      dispatchEvent(new Event('wtt:login'));
    } else failed = true;
  }
</script>

<form class="card stack" onsubmit={submit}>
  <h1>{ui.t('app.name')}</h1>
  <p class="muted">{ui.t('login.hint')}</p>
  <label class="field">
    {ui.t('login.user')}
    <input bind:value={user} autocomplete="username" name="user" />
  </label>
  <label class="field">
    {ui.t('login.password')}
    <input bind:value={pass} type="password" autocomplete="current-password" name="password" />
  </label>
  {#if failed}<p class="warn" role="alert">{ui.t('login.failed')}</p>{/if}
  <button class="primary" type="submit">{ui.t('login.submit')}</button>
</form>

<style>
  form {
    max-width: 360px;
    margin: 20vh auto 0;
    display: flex;
    flex-direction: column;
  }
  .warn {
    color: var(--warn);
    margin: 0;
  }
</style>
