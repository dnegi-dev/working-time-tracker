<script lang="ts">
  import QRCode from 'qrcode';
  import { commandLinks } from '../../../application/commands/links.ts';
  import { placeLabel } from '../../../application/status.ts';
  import { updateSettings } from '../../../domain/index.ts';
  import { useUi } from '../../state/context.svelte.ts';

  const ui = useUi();
  const ds = $derived(ui.s.ds);
  const CMDS = ['toggle', 'clock-in', 'clock-out', 'switch-project', 'switch-place'] as const;
  let cmd = $state<(typeof CMDS)[number]>('toggle');
  let project = $state('');
  let place = $state('');
  let source = $state('nfc');
  let qr = $state('');

  const needsProject = $derived(cmd !== 'clock-out' && cmd !== 'switch-place');
  const needsPlace = $derived(cmd !== 'clock-out' && cmd !== 'switch-project');
  const links = $derived(
    commandLinks(
      cmd,
      { project: needsProject ? project : '', place: needsPlace ? place : '', source },
      ui.platform.appBaseUrl,
    ),
  );
  // QR/NFC should target the app the user actually uses
  const link = $derived(
    ui.platform.isNative || ds.settings.openLinksIn === 'app' ? links.native : links.web,
  );

  $effect(() => {
    void QRCode.toDataURL(link, { margin: 1, width: 200 }).then((url) => (qr = url));
  });

  function setOpenIn(e: Event) {
    const openLinksIn = (e.target as HTMLSelectElement).value as 'browser' | 'app';
    void ui.app.update((d) => updateSettings(d, { openLinksIn }));
  }
</script>

<h2>{ui.t('settings.automation')}</h2>
<div class="card stack">
  <label class="field">
    {ui.t('automation.openIn')}
    <select value={ds.settings.openLinksIn} onchange={setOpenIn} data-testid="open-in">
      <option value="browser">{ui.t('automation.openHere')}</option>
      <option value="app">{ui.t('automation.openApp')}</option>
    </select>
  </label>

  <strong>{ui.t('automation.builder')}</strong>
  <div class="row">
    <select bind:value={cmd} aria-label={ui.t('automation.command')}>
      {#each CMDS as c (c)}<option value={c}>{c}</option>{/each}
    </select>
    {#if needsProject}
      <select bind:value={project} aria-label={ui.t('today.project')}>
        <option value="">{ui.t('project.none')}</option>
        {#each ds.projects as p (p.id)}<option value={p.name}>{p.name}</option>{/each}
      </select>
    {/if}
    {#if needsPlace}
      <select bind:value={place} aria-label={ui.t('today.place')}>
        <option value="">–</option>
        {#each ds.places as p (p.id)}<option value={placeLabel(p)}>{placeLabel(p)}</option>{/each}
      </select>
    {/if}
    <select bind:value={source} aria-label={ui.t('automation.trigger')}>
      <option value="nfc">NFC</option>
      <option value="qr">QR</option>
      <option value="geofence">{ui.t('automation.geofence')}</option>
      <option value="shortcut">{ui.t('automation.shortcut')}</option>
    </select>
  </div>
  <div class="links">
    <div>
      <span class="muted">{ui.t('automation.nativeLink')}</span><code data-testid="native-link"
        >{links.native}</code
      >
    </div>
    <div>
      <span class="muted">{ui.t('automation.webLink')}</span><code data-testid="web-link"
        >{links.web}</code
      >
    </div>
  </div>
  {#if qr}<img src={qr} alt={ui.t('automation.qrAlt')} width="160" height="160" />{/if}
  <a href={`${ui.platform.appBaseUrl}api.html`} target="_blank" rel="noopener"
    >{ui.t('automation.apiDocs')} ↗</a
  >
</div>

<style>
  .links div {
    display: flex;
    flex-direction: column;
    margin-bottom: 8px;
  }
  code {
    word-break: break-all;
    font-size: 0.85rem;
    background: var(--bg);
    padding: 6px 8px;
    border-radius: 8px;
  }
  a {
    color: var(--accent);
  }
</style>
