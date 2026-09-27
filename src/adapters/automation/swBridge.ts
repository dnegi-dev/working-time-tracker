import type { Source } from '../../domain/index.ts';

type Runner = (cmd: string, params: Record<string, string>, source: Source) => Promise<unknown>;
interface ApiMessage {
  type: 'wtt-api';
  cmd: string;
  params: Record<string, string>;
}

/** Answer API requests the service worker forwards from `/api/v1/*` (see src/sw.ts). */
export function listenForApiRequests(run: Runner): void {
  navigator.serviceWorker?.addEventListener('message', (e: MessageEvent<ApiMessage>) => {
    if (e.data?.type !== 'wtt-api') return;
    void run(e.data.cmd, e.data.params, 'api').then((r) => e.ports[0]?.postMessage(r));
  });
}
