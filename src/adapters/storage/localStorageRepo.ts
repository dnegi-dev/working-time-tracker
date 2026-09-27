import type { Dataset } from '../../domain/index.ts';
import type { Repository } from '../../ports/index.ts';
import { join, partition } from './partition.ts';

const PREFIX = 'wtt:';

/** One key for settings/projects/places plus one key per month. */
export function localStorageRepo(storage: Storage = localStorage): Repository {
  return {
    async load() {
      const meta = storage.getItem(`${PREFIX}meta`);
      if (!meta) return undefined;
      const parts = Object.keys(storage)
        .filter((k) => k.startsWith(`${PREFIX}m:`))
        .map((k) => JSON.parse(storage.getItem(k) ?? '{}'));
      return join(JSON.parse(meta), parts);
    },
    async save(ds: Dataset) {
      const { meta, parts } = partition(ds, 'month');
      for (const k of Object.keys(storage)) {
        if (k.startsWith(`${PREFIX}m:`) && !(k.slice(PREFIX.length + 2) in parts))
          storage.removeItem(k);
      }
      for (const [k, p] of Object.entries(parts))
        storage.setItem(`${PREFIX}m:${k}`, JSON.stringify(p));
      storage.setItem(`${PREFIX}meta`, JSON.stringify(meta));
    },
  };
}
