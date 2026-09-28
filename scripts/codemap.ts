/**
 * Prints a compact map of the codebase: one line per file with its size and what it exports.
 * Agents read this instead of exploring the tree file by file (`npm run -s codemap`).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOTS = ['src', 'tests', 'scripts'];
const MAX_NAMES = 14;

const walk = (dir: string): string[] =>
  readdirSync(dir)
    .sort()
    .flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? walk(p) : /\.(ts|svelte)$/.test(p) ? [p] : [];
    });

const all = (text: string, re: RegExp): string[] => [...text.matchAll(re)].map((m) => m[1] ?? '');

function tsSummary(text: string): string[] {
  const names = all(
    text,
    /^export (?:default )?(?:async )?(?:function\*?|const|let|class|type|interface|enum) (\w+)/gm,
  );
  const lists = all(text, /^export (?:type )?\{([^}]+)\}/gm).flatMap((l) =>
    l.split(',').map((n) => n.trim().split(/\s+as\s+/)[1] ?? n.trim()),
  );
  const stars = all(text, /^export \* from '\.\/([\w.-]+)'/gm).map((f) => `*${f}`);
  return [...names, ...lists, ...stars].filter(Boolean);
}

function svelteSummary(text: string): string[] {
  const props = /let\s*\{([\s\S]*?)\}\s*(?::[\s\S]*?)?=\s*\$props\(\)/.exec(text)?.[1] ?? '';
  const names = props
    .split(',')
    .map((p) => p.trim().split(/[\s=:]/)[0] ?? '')
    .filter((p) => /^\w+$/.test(p));
  const ids = all(text, /data-testid=("[^"]*"|\{[^}]*\})/g).flatMap((v) =>
    v.startsWith('"') ? [v.slice(1, -1)] : all(v, /['`]([\w-]+)/g),
  );
  return [
    ...(names.length ? [`props ${names.join(' ')}`] : []),
    ...(ids.length ? [`testid ${[...new Set(ids)].join(' ')}`] : []),
  ];
}

function testSummary(text: string): string[] {
  const count = all(text, /^\s*(?:it|test)\(\s*['"`]/gm).length;
  return count ? [`${count} tests`] : [];
}

function summary(file: string, text: string): string[] {
  if (/\.(spec|test)\.ts$/.test(file)) return testSummary(text);
  return file.endsWith('.svelte') ? svelteSummary(text) : tsSummary(text);
}

const byDir = new Map<string, string[]>();
for (const path of ROOTS.flatMap(walk)) {
  const file = relative('.', path);
  const text = readFileSync(path, 'utf8');
  const dir = file.slice(0, file.lastIndexOf('/'));
  const names = summary(file, text);
  const shown = names.slice(0, MAX_NAMES).join(', ');
  const more = names.length > MAX_NAMES ? ` +${names.length - MAX_NAMES}` : '';
  const line = `  ${file.slice(dir.length + 1)} ${text.split('\n').length}`;
  byDir.set(dir, [...(byDir.get(dir) ?? []), `${line}${shown ? `: ${shown}${more}` : ''}`]);
}
console.log([...byDir].map(([dir, lines]) => [`${dir}/`, ...lines].join('\n')).join('\n'));
