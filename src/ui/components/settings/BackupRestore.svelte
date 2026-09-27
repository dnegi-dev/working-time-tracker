<script lang="ts">
  import {
    createBackup,
    mergeDatasets,
    readBackup,
    type BackupPreview,
  } from '../../../application/backup.ts';
  import type { Dataset } from '../../../domain/index.ts';
  import type { Key } from '../../../i18n/index.ts';
  import { useUi } from '../../state/context.svelte.ts';

  const ui = useUi();
  let pending: { ds: Dataset; preview: BackupPreview } | undefined = $state();

  async function backup() {
    const text = createBackup(ui.s.ds, ui.s.now);
    const name = `wtt-backup-${ui.s.now.toISOString().slice(0, 10)}.json`;
    await ui.platform.saveFile(name, new Blob([text], { type: 'application/json' }));
  }

  async function pick(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const r = readBackup(await file.text());
    if (r.ok) pending = r;
    else ui.notify(ui.t(r.error as Key));
  }

  async function restore(mode: 'replace' | 'merge') {
    const incoming = pending!.ds;
    await ui.app.update((ds) =>
      mode === 'replace'
        ? { ...incoming, settings: { ...incoming.settings, storage: ds.settings.storage } }
        : mergeDatasets(ds, incoming),
    );
    pending = undefined;
    ui.notify(ui.t('backup.restored'));
  }
</script>

<strong>{ui.t('backup.title')}</strong>
<div class="row">
  <button onclick={backup} data-testid="backup">{ui.t('backup.create')}</button>
  <label class="button">
    {ui.t('backup.restore')}
    <input
      type="file"
      accept="application/json,.json"
      onchange={pick}
      data-testid="restore-file"
      hidden
    />
  </label>
</div>
{#if pending}
  <div class="card stack" data-testid="restore-preview">
    <p>
      {ui.t('backup.preview', {
        entries: pending.preview.entries,
        projects: pending.preview.projects,
        notes: pending.preview.notes,
        from: pending.preview.from ?? '–',
        to: pending.preview.to ?? '–',
      })}
    </p>
    <div class="row">
      <button class="primary" onclick={() => restore('replace')} data-testid="restore-replace"
        >{ui.t('backup.replace')}</button
      >
      <button onclick={() => restore('merge')}>{ui.t('backup.merge')}</button>
      <button class="link" onclick={() => (pending = undefined)}>{ui.t('common.cancel')}</button>
    </div>
  </div>
{/if}

<style>
  .button {
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 8px 14px;
    cursor: pointer;
    background: var(--surface);
  }
  p {
    margin: 0;
  }
</style>
