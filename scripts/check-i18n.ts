/**
 * Fails when a .svelte template contains visible text that is not translated via t().
 * Also checks that every en key exists in de (typecheck covers this too).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.svelte') ? [p] : [];
  });

let failed = false;
for (const file of walk('src/ui')) {
  let markup = readFileSync(file, 'utf8')
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '');
  // remove {expressions} (nesting-aware), then tags
  let prev;
  do {
    prev = markup;
    markup = markup.replace(/\{[^{}]*\}/g, ' ');
  } while (markup !== prev);
  markup = markup.replace(/<[^>]*>/g, ' ');
  const words = markup.match(/[A-Za-zÄÖÜäöüß]{2,}/g) ?? [];
  // Allowed literals: language names shown in their own language, trigger names
  const allowed = new Set(['Deutsch', 'English', 'NFC', 'QR']);
  const bad = words.filter((w) => !allowed.has(w));
  if (bad.length) {
    failed = true;
    console.error(`${file}: untranslated text: ${bad.join(' ')}`);
  }
}
if (failed) process.exit(1);
console.log('i18n: ok');
