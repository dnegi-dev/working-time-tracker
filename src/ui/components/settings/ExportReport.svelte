<script lang="ts">
  import {
    buildReport,
    EXPORT_FORMATS,
    REPORT_GOALS,
    type ReportGoal,
  } from '../../../application/report.ts';
  import { dateOf, periodRange, type Period } from '../../../domain/index.ts';
  import type { Key } from '../../../i18n/index.ts';
  import type { ExportFormat } from '../../../ports/index.ts';
  import { useUi } from '../../state/context.svelte.ts';

  const ui = useUi();
  let goals: ReportGoal[] = $state(['hours']);
  let period: Period | 'custom' = $state('month');
  let from = $state('');
  let to = $state('');
  let format: ExportFormat = $state('md');

  async function run() {
    const range =
      period === 'custom' ? { from, to } : periodRange(period, dateOf(ui.s.now.toISOString()));
    if (!range.from || !range.to || !goals.length) return;
    for (let y = +range.from.slice(0, 4); y <= +range.to.slice(0, 4); y++)
      await ui.app.ensureYear(y);
    const label = (k: string) => ui.t(k as Key);
    const tables = buildReport(
      ui.s,
      REPORT_GOALS.filter((g) => goals.includes(g)),
      range.from,
      range.to,
      label,
    );
    const title = `${ui.t('app.name')} ${range.from} – ${range.to}`;
    const blob = await ui.platform.formatReport(tables, format, title);
    await ui.platform.saveFile(`wtt-${goals.join('-')}-${range.from}_${range.to}.${format}`, blob);
  }
</script>

<strong>{ui.t('export.title')}</strong>
<div class="row">
  {#each REPORT_GOALS as g (g)}
    <label class="row chip"
      ><input type="checkbox" value={g} bind:group={goals} />{ui.t(`report.${g}`)}</label
    >
  {/each}
</div>
<div class="row">
  <select bind:value={period} aria-label={ui.t('export.range')}>
    <option value="week">{ui.t('period.week')}</option>
    <option value="month">{ui.t('period.month')}</option>
    <option value="year">{ui.t('period.year')}</option>
    <option value="custom">{ui.t('export.custom')}</option>
  </select>
  {#if period === 'custom'}
    <input type="date" bind:value={from} aria-label={ui.t('entry.from')} />
    <input type="date" bind:value={to} aria-label={ui.t('entry.to')} />
  {/if}
  <select bind:value={format} aria-label={ui.t('export.format')} data-testid="export-format">
    {#each EXPORT_FORMATS as f (f)}<option value={f}>{ui.t(`format.${f}`)}</option>{/each}
  </select>
  <button class="primary" onclick={run} data-testid="export">{ui.t('export.run')}</button>
</div>

<style>
  .chip {
    gap: 4px;
  }
  input[type='checkbox'] {
    min-height: 0;
  }
</style>
