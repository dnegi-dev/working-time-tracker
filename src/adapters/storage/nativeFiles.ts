import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import type { FileAccess } from '../../ports/index.ts';

const DIR = 'WorkingTime';

/** iOS: files live in the app's Documents folder, visible in the Files app. */
export const nativeFiles: FileAccess = {
  async list() {
    try {
      const r = await Filesystem.readdir({ path: DIR, directory: Directory.Documents });
      return r.files.map((f) => f.name);
    } catch {
      return [];
    }
  },
  async read(name) {
    try {
      const r = await Filesystem.readFile({
        path: `${DIR}/${name}`,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      return typeof r.data === 'string' ? r.data : await r.data.text();
    } catch {
      return undefined;
    }
  },
  async write(name, text) {
    await Filesystem.writeFile({
      path: `${DIR}/${name}`,
      data: text,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true,
    });
  },
};
