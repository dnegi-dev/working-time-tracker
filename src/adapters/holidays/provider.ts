import type { Holiday, Settings } from '../../domain/index.ts';
import type { HolidayProvider } from '../../ports/index.ts';
import { parseIcal } from './ical.ts';

interface Options {
  /** App base URL, e.g. `/working-time-tracker/`. */
  base: string;
  source: () => Settings['holidaySource'];
  fetchText?: (url: string) => Promise<string>;
  cache?: Storage;
}

const defaultFetch = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.text();
};

/**
 * `bundled`: JSON generated at build time from OpenHolidays iCal (scripts/fetch-holidays.ts).
 * `ical`: a custom URL; `{year}` and `{region}` placeholders are replaced. On the web this
 * needs a CORS-enabled source; in the iOS app CapacitorHttp bypasses CORS.
 */
export function holidayProvider(o: Options): HolidayProvider {
  const fetchText = o.fetchText ?? defaultFetch;
  return {
    async forYear(region, year) {
      const src = o.source();
      const url =
        src.kind === 'bundled'
          ? `${o.base}holidays/${region}.json`
          : src.url.replace('{year}', String(year)).replace('{region}', region);
      const key = `wtt:hol:${url}`;
      try {
        const text = await fetchText(url);
        o.cache?.setItem(key, text);
        return filter(src.kind === 'bundled' ? JSON.parse(text) : parseIcal(text), year);
      } catch {
        const cached = o.cache?.getItem(key);
        if (!cached) return [];
        return filter(src.kind === 'bundled' ? JSON.parse(cached) : parseIcal(cached), year);
      }
    },
  };
}

const filter = (list: Holiday[], year: number) => list.filter((h) => h.date.startsWith(`${year}-`));
