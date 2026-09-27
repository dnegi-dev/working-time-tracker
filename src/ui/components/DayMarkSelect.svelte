<script lang="ts">
  import { dayTarget, setDayMark, type DayType, type ISODate } from '../../domain/index.ts';
  import { useUi } from '../state/context.svelte.ts';

  let { date }: { date: ISODate } = $props();
  const ui = useUi();
  const mark = $derived(ui.s.ds.dayMarks.find((m) => m.date === date)?.type ?? '');
  // Label the unmarked state by what the day normally is (weekends/holidays are days off).
  const normal = $derived(
    dayTarget({ ...ui.s.ds, dayMarks: [] }, date, ui.s.holidays) > 0 ? 'day.work' : 'day.off',
  );

  function change(e: Event) {
    const v = (e.target as HTMLSelectElement).value as DayType | '';
    void ui.app.update((ds) => setDayMark(ds, date, v || undefined));
  }
</script>

<select value={mark} onchange={change} data-testid="day-type">
  <option value="">{ui.t(normal)}</option>
  <option value="vacation">{ui.t('day.vacation')}</option>
  <option value="sick">{ui.t('day.sick')}</option>
  <option value="holiday">{ui.t('day.holiday')}</option>
</select>
