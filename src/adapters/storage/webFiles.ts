import type { FileAccess } from '../../ports/index.ts';

type DirHandle = FileSystemDirectoryHandle & {
  values(): AsyncIterable<FileSystemHandle>;
  queryPermission?(o: { mode: 'readwrite' }): Promise<PermissionState>;
};
type PickerWindow = Window & { showDirectoryPicker?: (o?: object) => Promise<DirHandle> };

const DB = 'wtt-files';

function idb<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB, 1);
    open.onupgradeneeded = () => open.result.createObjectStore('h');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const req = fn(open.result.transaction('h', mode).objectStore('h'));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    };
  });
}

export const webFilesSupported = () =>
  typeof (window as PickerWindow).showDirectoryPicker === 'function';

/** Ask the user for a folder (File System Access API, Chromium desktop) and remember it. */
export async function pickWebFolder(): Promise<FileAccess> {
  const dir = await (window as PickerWindow).showDirectoryPicker!({ mode: 'readwrite' });
  await idb('readwrite', (s) => s.put(dir, 'dir'));
  return webFiles(dir);
}

export async function rememberedWebFolder(): Promise<FileAccess | undefined> {
  if (!webFilesSupported()) return undefined;
  const dir = await idb<DirHandle | undefined>('readonly', (s) => s.get('dir'));
  // Without a user gesture we may only query; if not granted, the localStorage mirror is used.
  if (!dir || (await dir.queryPermission?.({ mode: 'readwrite' })) !== 'granted') return undefined;
  return webFiles(dir);
}

function webFiles(dir: DirHandle): FileAccess {
  return {
    async list() {
      const out: string[] = [];
      for await (const h of dir.values()) if (h.kind === 'file') out.push(h.name);
      return out;
    },
    async read(name) {
      try {
        return await (await (await dir.getFileHandle(name)).getFile()).text();
      } catch {
        return undefined;
      }
    },
    async write(name, text) {
      const w = await (await dir.getFileHandle(name, { create: true })).createWritable();
      await w.write(text);
      await w.close();
    },
  };
}
