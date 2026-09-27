<script lang="ts">
  import { updateSettings, type StorageSetting } from '../../../domain/index.ts';
  import BackupRestore from './BackupRestore.svelte';
  import ExportReport from './ExportReport.svelte';
  import { useUi } from '../../state/context.svelte.ts';

  const ui = useUi();
  const storage = $derived(ui.s.ds.settings.storage);
  const value = $derived(storage.kind === 'local' ? 'local' : storage.granularity);
  const fileOk = $derived(ui.platform.isNative || ui.platform.webFilesSupported);

  async function change(e: Event) {
    const v = (e.target as HTMLSelectElement).value;
    const next: StorageSetting =
      v === 'local' ? { kind: 'local' } : { kind: 'file', granularity: v as 'month' };
    if (await ui.platform.useStorage(next, true)) {
      await ui.app.update((ds) => updateSettings(ds, { storage: next }));
      ui.notify(ui.t('storage.switched'));
    }
  }
</script>

<h2>{ui.t('settings.data')}</h2>
<div class="card stack">
  <label class="field">
    {ui.t('storage.label')}
    <select {value} onchange={change} data-testid="storage">
      <option value="local">{ui.t('storage.local')}</option>
      <option value="month" disabled={!fileOk}>{ui.t('storage.month')}</option>
      <option value="year" disabled={!fileOk}>{ui.t('storage.year')}</option>
      <option value="single" disabled={!fileOk}>{ui.t('storage.single')}</option>
    </select>
  </label>
  {#if !fileOk}<p class="muted small">{ui.t('storage.fileUnsupported')}</p>{/if}
  <BackupRestore />
  <ExportReport />
</div>

<style>
  .small {
    font-size: 0.85rem;
    margin: 0;
  }
</style>
