import { fileRepo } from '../adapters/storage/fileRepo.ts';
import { localStorageRepo } from '../adapters/storage/localStorageRepo.ts';
import { nativeFiles } from '../adapters/storage/nativeFiles.ts';
import { pickWebFolder, rememberedWebFolder } from '../adapters/storage/webFiles.ts';
import type { Dataset, StorageSetting } from '../domain/index.ts';
import type { FileAccess, Repository } from '../ports/index.ts';

/** File mode also mirrors into localStorage, so settings and a cache are always available at start. */
function mirror(primary: Repository, cache: Repository): Repository {
  return {
    async load() {
      return (await primary.load()) ?? cache.load();
    },
    async save(ds: Dataset) {
      await cache.save(ds);
      await primary.save(ds);
    },
  };
}

export const local = localStorageRepo();

export async function repositoryFor(
  setting: StorageSetting,
  isNative: boolean,
  pick = false,
): Promise<Repository | undefined> {
  if (setting.kind === 'local') return local;
  let files: FileAccess | undefined;
  try {
    files = isNative ? nativeFiles : pick ? await pickWebFolder() : await rememberedWebFolder();
  } catch {
    return undefined; // user cancelled the folder picker
  }
  return files ? mirror(fileRepo(files, setting.granularity), local) : undefined;
}
