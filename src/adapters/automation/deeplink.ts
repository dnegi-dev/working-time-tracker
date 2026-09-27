import type { Source } from '../../domain/index.ts';

export interface ParsedCommand {
  cmd: string;
  params: Record<string, string>;
  source: Source;
}

const SOURCES: Source[] = ['manual', 'nfc', 'qr', 'geofence', 'shortcut', 'api'];

/**
 * Accepts every transport of the command API:
 * `wtt://toggle?place=HQ`, `web+wtt://toggle`, `…#/do/toggle?…`, `…/api/v1/toggle?…`.
 * An optional `source` param (nfc|qr|geofence|shortcut) is split off.
 */
export function parseCommandUrl(input: string): ParsedCommand | undefined {
  const hash = input.match(/#\/do\/(.+)$/)?.[1];
  if (hash?.includes('wtt%3A') || hash?.includes('wtt:'))
    return parseCommandUrl(decodeURIComponent(hash));
  const m =
    (hash ? [hash, hash] : undefined) ??
    input.match(/^(?:web\+)?wtt:\/\/(.+)$/) ??
    input.match(/\/api\/v1\/(.+)$/);
  const rest = m?.[1];
  if (!rest) return undefined;
  const [path = '', query = ''] = rest.split('?');
  const cmd = path.replace(/\/+$/, '');
  if (!cmd) return undefined;
  const params = Object.fromEntries(new URLSearchParams(query));
  const src = params.source as Source | undefined;
  delete params.source;
  const fallback: Source = input.includes('/api/v1/') ? 'api' : 'shortcut';
  return { cmd, params, source: src && SOURCES.includes(src) ? src : fallback };
}
