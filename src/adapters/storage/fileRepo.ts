import type { Dataset } from '../../domain/index.ts';
import type { FileAccess, Repository } from '../../ports/index.ts';
import { join, partition, type Granularity } from './partition.ts';

const META = 'wtt-settings.json';
const name = (key: string) => `wtt-${key}.json`;

/** Stores data as JSON files: one per month, per year, or a single file. */
export function fileRepo(files: FileAccess, granularity: Granularity): Repository {
  const written = new Map<string, string>();
  return {
    async load() {
      const meta = await files.read(META);
      if (!meta) return undefined;
      const names = (await files.list()).filter((n) => /^wtt-(\d{4}(-\d{2})?|all)\.json$/.test(n));
      const parts = await Promise.all(
        names.map(async (n) => JSON.parse((await files.read(n)) ?? '{}')),
      );
      return join(JSON.parse(meta), parts);
    },
    async save(ds: Dataset) {
      const { meta, parts } = partition(ds, granularity);
      const out: [string, string][] = [[META, JSON.stringify(meta, null, 2)]];
      for (const [k, p] of Object.entries(parts)) out.push([name(k), JSON.stringify(p, null, 2)]);
      for (const [file, text] of out) {
        if (written.get(file) === text) continue;
        await files.write(file, text);
        written.set(file, text);
      }
    },
  };
}
