import { getContext } from 'svelte';
import type { App, AppState } from '../../application/app.ts';
import { createT, type T } from '../../i18n/index.ts';
import type { Platform } from '../../ports/index.ts';

/** Reactive bridge between the application store and Svelte components. */
export class Ui {
  s: AppState = $state()!;
  toast = $state('');
  t: T = $derived(createT(this.s.ds.settings.locale));
  #timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    public app: App,
    public platform: Platform,
  ) {
    this.s = app.state;
    app.subscribe((v) => (this.s = v));
  }

  get locale() {
    return this.s.ds.settings.locale;
  }

  notify(message: string) {
    this.toast = message;
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => (this.toast = ''), 3000);
  }
}

const KEY = Symbol('ui');
/** Pass as `mount(App, { context: uiContext(ui) })`. */
// eslint-disable-next-line svelte/prefer-svelte-reactivity -- static context map, never mutated
export const uiContext = (ui: Ui) => new Map([[KEY, ui]]);
export const useUi = () => getContext<Ui>(KEY);
