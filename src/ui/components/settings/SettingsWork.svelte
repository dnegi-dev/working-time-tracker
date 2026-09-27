<script lang="ts">
  import { updateSettings, type Settings } from '../../../domain/index.ts';
  import { formatDate } from '../../../i18n/index.ts';
  import { useUi } from '../../state/context.svelte.ts';

  const ui = useUi();
  const st = $derived(ui.s.ds.settings);
  // 2024-01-01 is a Monday
  const dayName = (i: number) => formatDate(`2024-01-0${i + 1}`, ui.locale, { weekday: 'short' });
  const set = (patch: Partial<Settings>) => ui.app.update((ds) => updateSettings(ds, patch));

  function setTarget(i: number, e: Event) {
    const hours = Number((e.target as HTMLInputElement).value) || 0;
    const list = [...st.targetMinutesPerWeekday];
    list[i] = Math.round(hours * 60);
    void set({ targetMinutesPerWeekday: list });
  }
</script>

<h2>{ui.t('settings.work')}</h2>
<div class="card stack">
  <label class="field">
    {ui.t('settings.language')}
    <select
      value={st.locale}
      onchange={(e) => set({ locale: (e.target as HTMLSelectElement).value as 'de' | 'en' })}
      data-testid="locale"
    >
      <option value="de">Deutsch</option>
      <option value="en">English</option>
    </select>
  </label>
  <div class="field">
    {ui.t('settings.hoursPerDay')}
    <div class="days">
      {#each st.targetMinutesPerWeekday as min, i (i)}
        <label>
          <span>{dayName(i)}</span>
          <input
            type="number"
            min="0"
            max="24"
            step="0.25"
            value={min / 60}
            onchange={(e) => setTarget(i, e)}
          />
        </label>
      {/each}
    </div>
  </div>
  <label class="row">
    <input
      type="checkbox"
      checked={st.breakRule.enabled}
      onchange={(e) =>
        set({ breakRule: { ...st.breakRule, enabled: (e.target as HTMLInputElement).checked } })}
    />
    {ui.t('settings.breakRule', { a: st.breakRule.after6h, b: st.breakRule.after9h })}
  </label>
</div>

<style>
  .days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }
  .days label {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 0.8rem;
  }
  .days input {
    width: 100%;
    padding: 6px 2px;
    text-align: center;
  }
  input[type='checkbox'] {
    min-height: 0;
  }
</style>
