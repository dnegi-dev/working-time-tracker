import { App as CapApp } from '@capacitor/app';
import { inAppContext, isNative, redirectToApp } from '../adapters/automation/openInApp.ts';
import { parseCommandUrl } from '../adapters/automation/deeplink.ts';
import { listenForApiRequests } from '../adapters/automation/swBridge.ts';
import type { App } from '../application/app.ts';
import { commandPath } from '../application/commands/links.ts';
import type { Ui } from '../ui/state/context.svelte.ts';

/** Routes deep links (wtt://, #/do/…, web+wtt://) and SW API calls into the command registry. */
export function wireDeepLinks(app: App, ui: Ui, isAuthed: () => boolean): void {
  let pending: string | undefined;

  async function handle(url: string) {
    const parsed = parseCommandUrl(url);
    if (!parsed) return;
    const done = () =>
      location.hash.startsWith('#/do/') && history.replaceState(null, '', '#/today');
    if (parsed.cmd === 'open') {
      done();
      dispatchEvent(new HashChangeEvent('hashchange'));
      return;
    }
    if (app.state.ds.settings.openLinksIn === 'app' && !inAppContext()) {
      const path = commandPath(parsed.cmd, { ...parsed.params, source: parsed.source });
      if (await redirectToApp(path)) return;
    }
    if (!isAuthed()) {
      pending = url;
      return;
    }
    const r = await app.run(parsed.cmd, parsed.params, parsed.source);
    ui.notify(r.ok ? ui.t('cmd.done', { cmd: parsed.cmd }) : r.error);
    done();
    dispatchEvent(new HashChangeEvent('hashchange'));
  }

  addEventListener('hashchange', () => void handle(location.href));
  addEventListener('wtt:login', () => pending && void handle(pending));
  void handle(location.href);

  if (isNative()) {
    void CapApp.addListener('appUrlOpen', (e) => void handle(e.url));
    void CapApp.getLaunchUrl().then((r) => {
      if (r?.url) void handle(r.url);
    });
  } else if (
    app.state.ds.settings.openLinksIn === 'app' &&
    !inAppContext() &&
    !location.hash.startsWith('#/do/')
  ) {
    // Once per browser session, so the web version stays reachable.
    if (!sessionStorage.getItem('wtt:redirected')) {
      sessionStorage.setItem('wtt:redirected', '1');
      void redirectToApp('open');
    }
  }

  listenForApiRequests(async (cmd, params, source) =>
    isAuthed()
      ? app.run(cmd, params, source)
      : { ok: false, status: 401, error: 'Log in to the app first' },
  );
}
