<script lang="ts">
  import {
    balance,
    balanceBetween,
    canArchive,
    dateOf,
    formatMinutes,
    periodRange,
    projectMinutesBetween,
    quotaStatus,
    recentProjectIds,
    setArchived,
    upsertProject,
  } from '../../domain/index.ts';
  import { formatDate } from '../../i18n/index.ts';
  import PoolField, { type PoolItem } from '../pool/PoolField.svelte';
  import { POOL_PERIODS, type PoolPeriod, type PoolStats } from '../pool/StatsBubble.svelte';
  import { useUi } from '../state/context.svelte.ts';
  import { router } from '../state/router.svelte.ts';

  const ui = useUi();
  const s = $derived(ui.s);
  const now = $derived(s.now.toISOString());
  const today = $derived(dateOf(now));
  let period = $state<PoolPeriod>('month');

  const first = $derived(s.ds.entries.reduce((m, e) => (e.start < m ? e.start : m), now));
  const range = $derived(
    period === 'all' ? { from: dateOf(first), to: today } : periodRange(period, today),
  );
  const stats: PoolStats = $derived(
    period === 'all'
      ? {
          balance: balanceBetween(s.ds, range.from, range.to, s.holidays, now),
          since: formatDate(range.from, ui.locale, { month: 'short', year: 'numeric' }),
        }
      : {
          balance: balance(s.ds, period, today, s.holidays, now),
          quota: quotaStatus(s.ds, period, today, s.holidays),
        },
  );

  const sums = $derived(projectMinutesBetween(s.ds, range.from, range.to, now));
  const items: PoolItem[] = $derived.by(() => {
    const total = [...sums.values()].reduce((a, b) => a + b, 0);
    return recentProjectIds(s.ds)
      .map((id) => {
        const m = sums.get(id) ?? 0;
        const share = total ? m / total : 0;
        const name = s.ds.projects.find((p) => p.id === id)!.name;
        return { id, name, share, sub: `${formatMinutes(m)} · ${Math.round(share * 100)}%` };
      })
      .sort((a, b) => b.share - a.share);
  });
  const resting = $derived(s.ds.projects.filter((p) => p.archived));

  function nextPeriod() {
    period = POOL_PERIODS[(POOL_PERIODS.indexOf(period) + 1) % POOL_PERIODS.length]!;
  }

  function rest(id: string) {
    if (!canArchive(s.ds, id)) {
      ui.notify(ui.t('pool.running'));
      return false;
    }
    void ui.app.update((ds) => setArchived(ds, id, true));
    return true;
  }

  function restore(id: string) {
    const name = s.ds.projects.find((p) => p.id === id)?.name ?? '';
    void ui.app.update((ds) => setArchived(ds, id, false));
    ui.notify(ui.t('rest.restored', { name }));
  }

  function create(name: string) {
    void ui.app.update((ds, _now, id) => upsertProject(ds, { id: id(), name, archived: false }));
  }
</script>

<div class="overview">
  <h1>{ui.t('nav.overview')}</h1>
  <PoolField
    {items}
    {resting}
    theme={s.ds.settings.restTheme}
    {period}
    {stats}
    onperiod={nextPeriod}
    onopen={(id) => router.go(`project/${id}`)}
    oncreate={create}
    onrest={rest}
    onrestore={restore}
  />
</div>

<style>
  /* App gives the overview a screen-high column; the field takes what the title leaves. */
  .overview {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
</style>
