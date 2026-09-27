import { Directory, Filesystem } from '@capacitor/filesystem';
import { isNative } from '../automation/openInApp.ts';

/** Web: browser download. iOS app: written to Documents/WorkingTime/Exports (Files app). */
export async function saveFile(name: string, blob: Blob): Promise<void> {
  if (isNative()) {
    const data = await new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
      r.readAsDataURL(blob);
    });
    await Filesystem.writeFile({
      path: `WorkingTime/Exports/${name}`,
      data,
      directory: Directory.Documents,
      recursive: true,
    });
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function readFile(file: File): Promise<string> {
  return file.text();
}
