<script lang="ts">
  import { balance, dateOf, formatMinutes, periodRange, quotaStatus } from '../../domain/index.ts';
  import { formatDate } from '../../i18n/index.ts';
  import Progress from '../components/Progress.svelte';
  import { useUi } from '../state/context.svelte.ts';

  const ui = useUi();
  const s = $derived(ui.s);
  const now = $derived(s.now.toISOString());
  const today = $derived(dateOf(now));
  const periods = ['week', 'month', 'year'] as const;
  const month = $derived(periodRange('month', today));
  const holidays = $derived([...s.holidayNames].filter(([d]) => d >= month.from && d <= month.to));
</script>

<h1>{ui.t('nav.overview')}</h1>

<h2>{ui.t('overview.hours')}</h2>
<div class="card">
  <table>
    <thead>
      <tr
        ><th></th><th>{ui.t('col.target')}</th><th>{ui.t('col.worked')}</th><th
          >{ui.t('overview.left')}</th
        ></tr
      >
    </thead>
    <tbody>
      {#each periods as p (p)}
        {@const b = balance(s.ds, p, today, s.holidays, now)}
        <tr data-testid={`balance-${p}`}>
          <th>{ui.t(`period.${p}`)}</th>
          <td class="num">{formatMinutes(b.target)}</td>
          <td class="num">{formatMinutes(b.worked)}</td>
          <td class="num" class:over={b.remaining < 0}>{formatMinutes(b.remaining)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<h2>{ui.t('overview.quota')}</h2>
{#each ['month', 'year'] as const as p (p)}
  {@const q = quotaStatus(s.ds, p, today, s.holidays)}
  <div class="card stack quota" data-testid={`quota-${p}`}>
    <div class="row between">
      <strong>{ui.t(`period.${p}`)}</strong>
      <span class="num">{ui.t('quota.progress', { done: q.done, required: q.required })}</span>
    </div>
    <Progress value={q.done} max={q.required} label={ui.t('overview.quota')} />
    <p class="muted" class:warn={!q.reachable}>
      {q.needed === 0
        ? ui.t('quota.reached')
        : ui.t('quota.needed', { needed: q.needed, left: q.daysLeft, workdays: q.workdays })}
    </p>
  </div>
{/each}

{#if holidays.length}
  <h2>{ui.t('overview.holidays')}</h2>
  <ul class="plain">
    {#each holidays as [d, name] (d)}
      <li class="row between">
        <span>{name}</span><span class="muted"
          >{formatDate(d, ui.locale, { weekday: 'short', day: 'numeric', month: 'short' })}</span
        >
      </li>
    {/each}
  </ul>
{/if}

<style>
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th,
  td {
    text-align: right;
    padding: 6px 4px;
  }
  th:first-child {
    text-align: left;
  }
  thead th {
    color: var(--muted);
    font-weight: 500;
    font-size: 0.85rem;
  }
  .over {
    color: var(--accent);
  }
  .between {
    justify-content: space-between;
  }
  .quota + .quota {
    margin-top: 12px;
  }
  .warn {
    color: var(--warn);
  }
  p {
    margin: 0;
  }
</style>
