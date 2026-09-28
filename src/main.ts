/**
 * Composition root: the only module that wires adapters to ports.
 * UI and application code never import adapters directly.
 */
import { mount } from 'svelte';
import { registerSW } from 'virtual:pwa-register';
import { isNative, inAppContext, redirectToApp } from './adapters/automation/openInApp.ts';
import { haptic } from './adapters/device/haptics.ts';
import { formatReport } from './adapters/export/formatters.ts';
import { saveFile } from './adapters/export/download.ts';
import { holidayProvider } from './adapters/holidays/provider.ts';
import { webFilesSupported } from './adapters/storage/webFiles.ts';
import { createApp } from './application/app.ts';
import { DEFAULT_LOGIN_HASH } from './application/auth.ts';
import { detectLocale } from './i18n/index.ts';
import type { Platform } from './ports/index.ts';
import App from './ui/App.svelte';
import './ui/app.css';
import { isLoggedIn } from './ui/state/auth.ts';
import { Ui, uiContext } from './ui/state/context.svelte.ts';
import { wireDeepLinks } from './wiring/deeplinks.ts';
import { local, repositoryFor } from './wiring/storage.ts';

const base = import.meta.env.BASE_URL;
const native = isNative();
const loginHash = import.meta.env.VITE_LOGIN_HASH || DEFAULT_LOGIN_HASH;

const app = createApp({
  repo: local,
  clock: { now: () => new Date() },
  holidays: holidayProvider({
    base,
    source: () => app.state.ds.settings.holidaySource,
    cache: localStorage,
  }),
  locale: detectLocale(),
});

const platform: Platform = {
  isNative: native,
  inApp: inAppContext(),
  webFilesSupported: webFilesSupported(),
  appBaseUrl: new URL(base, location.href).href,
  loginHash,
  saveFile,
  formatReport,
  redirectToApp,
  haptic: haptic(native),
  async useStorage(setting, pick) {
    const repo = await repositoryFor(setting, native, pick);
    if (!repo) return false;
    await app.useRepository(repo);
    return true;
  },
};

async function start() {
  await app.init();
  // Settings live in localStorage too; if they point to files, reload from there.
  const storage = app.state.ds.settings.storage;
  if (storage.kind === 'file') {
    const repo = await repositoryFor(storage, native);
    const ds = repo && (await repo.load());
    if (repo && ds) {
      await app.useRepository(repo);
      await app.update(() => ds);
    }
  }
  const ui = new Ui(app, platform);
  mount(App, { target: document.getElementById('app')!, context: uiContext(ui) });
  wireDeepLinks(app, ui, () => native || isLoggedIn(loginHash));
  setInterval(() => app.tick(), 15_000);
  addEventListener('visibilitychange', () => document.hidden || app.tick());
  if (!native) registerSW({ immediate: true });
}

void start();
