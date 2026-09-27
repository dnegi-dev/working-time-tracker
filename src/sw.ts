/// <reference lib="webworker" />
/**
 * Service worker: offline app shell + the `/api/v1/<command>` bridge.
 * Data lives in the app tab's localStorage, so API calls are forwarded to an open app tab.
 */
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

async function bridge(url: URL): Promise<Response> {
  const cmd = url.pathname.split('/api/v1/')[1] ?? '';
  const params = Object.fromEntries(url.searchParams);
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const client = clients.find((c) => !new URL(c.url).pathname.endsWith('api.html'));
  if (!client)
    return json(503, {
      ok: false,
      error: 'Open the app in another tab first; it executes API calls.',
    });
  const reply = await new Promise<{ ok: boolean; status?: number }>((resolve) => {
    const ch = new MessageChannel();
    const timer = setTimeout(() => resolve({ ok: false, status: 504 }), 5000);
    ch.port1.onmessage = (e) => {
      clearTimeout(timer);
      resolve(e.data);
    };
    client.postMessage({ type: 'wtt-api', cmd, params }, [ch.port2]);
  });
  return json(reply.ok ? 200 : (reply.status ?? 500), reply);
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin === self.location.origin && url.pathname.includes('/api/v1/'))
    e.respondWith(bridge(url));
});

void self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
