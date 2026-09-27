import { de } from './de.ts';
import { en } from './en.ts';

export type Locale = 'de' | 'en';
export type Key = keyof typeof en;
export type T = (key: Key, params?: Record<string, string | number>) => string;

const dicts: Record<Locale, Record<Key, string>> = { de, en };

export function createT(locale: Locale): T {
  const dict = dicts[locale];
  return (key, params) =>
    (dict[key] ?? en[key] ?? key).replace(/\{(\w+)\}/g, (_, p: string) =>
      String(params?.[p] ?? `{${p}}`),
    );
}

export function detectLocale(langs: readonly string[] = navigator.languages): Locale {
  return langs.some((l) => l.startsWith('de')) ? 'de' : 'en';
}

export function formatDate(date: string, locale: Locale, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, opts).format(new Date(`${date}T12:00:00`));
}

export function formatTime(instant: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(
    new Date(instant),
  );
}
