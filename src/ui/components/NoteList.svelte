<script lang="ts">
  import {
    addNote,
    removeNote,
    type ISODate,
    type Note,
    type NoteTarget,
  } from '../../domain/index.ts';
  import { formatDate } from '../../i18n/index.ts';
  import { useUi } from '../state/context.svelte.ts';

  let {
    date,
    target,
    filter,
    showDate = false,
  }: {
    date: ISODate;
    target: NoteTarget;
    filter: (n: Note) => boolean;
    showDate?: boolean;
  } = $props();
  const ui = useUi();
  let text = $state('');
  const notes = $derived(ui.s.ds.notes.filter(filter).sort((a, b) => b.date.localeCompare(a.date)));

  function add(e: SubmitEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    void ui.app.update((ds, _now, id) => addNote(ds, { id: id(), date, target, text: value }));
    text = '';
  }
</script>

<ul class="plain" data-testid="notes">
  {#each notes as n (n.id)}
    <li class="row">
      {#if showDate}<span class="muted num"
          >{formatDate(n.date, ui.locale, { dateStyle: 'medium' })}</span
        >{/if}
      <span class="text">{n.text}</span>
      <button
        class="link"
        onclick={() => ui.app.update((ds) => removeNote(ds, n.id))}
        aria-label={ui.t('common.delete')}>×</button
      >
    </li>
  {/each}
</ul>
<form class="row" onsubmit={add}>
  <input bind:value={text} placeholder={ui.t('note.placeholder')} data-testid="note-input" />
  <button type="submit">{ui.t('common.add')}</button>
</form>

<style>
  .text {
    flex: 1;
    white-space: pre-wrap;
  }
  form {
    margin-top: 8px;
  }
  form input {
    flex: 1;
  }
</style>
