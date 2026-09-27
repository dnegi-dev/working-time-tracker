/**
 * Fetches public holidays for all German states from OpenHolidays (iCal) and writes
 * public/holidays/DE-XX.json. Runs at build time because the API sends no CORS headers.
 * Usage: npm run gen:holidays
 */
import { writeFileSync } from 'node:fs';
import { parseIcal } from '../src/adapters/holidays/ical.ts';

const STATES = [
  'BW',
  'BY',
  'BE',
  'BB',
  'HB',
  'HH',
  'HE',
  'MV',
  'NI',
  'NW',
  'RP',
  'SL',
  'SN',
  'ST',
  'SH',
  'TH',
];
const year = new Date().getFullYear();
const years = [year - 1, year, year + 1, year + 2]; // API allows max. 1095 days per request

for (const s of STATES) {
  const region = `DE-${s}`;
  const list = [];
  for (const y of years) {
    const url = `https://openholidaysapi.org/PublicHolidays?countryIsoCode=DE&subdivisionCode=${region}&validFrom=${y}-01-01&validTo=${y}-12-31&languageIsoCode=DE`;
    const res = await fetch(url, { headers: { Accept: 'text/calendar' } });
    if (!res.ok) throw new Error(`${region} ${y}: HTTP ${res.status}`);
    list.push(...parseIcal(await res.text()));
  }
  list.sort((a, b) => a.date.localeCompare(b.date));
  writeFileSync(`public/holidays/${region}.json`, JSON.stringify(list));
  console.log(`${region}: ${list.length} holidays`);
}
