import type { Holiday } from '../../domain/index.ts';

const toISO = (v: string) => `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;

/** Parse all-day VEVENTs (DTSTART;VALUE=DATE). Multi-day events are expanded; DTEND is exclusive. */
export function parseIcal(text: string): Holiday[] {
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
  const out: Holiday[] = [];
  let ev: Record<string, string> | undefined;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') ev = {};
    else if (line === 'END:VEVENT' && ev) {
      const start = ev.DTSTART?.match(/\d{8}/)?.[0];
      const end = ev.DTEND?.match(/\d{8}/)?.[0];
      if (start) {
        const name = (ev.SUMMARY ?? '').replace(/\\,/g, ',').trim();
        const d = new Date(
          Date.UTC(+start.slice(0, 4), +start.slice(4, 6) - 1, +start.slice(6, 8)),
        );
        const last = end ? toISO(end) : undefined;
        do {
          out.push({ date: d.toISOString().slice(0, 10), name });
          d.setUTCDate(d.getUTCDate() + 1);
        } while (last && d.toISOString().slice(0, 10) < last);
      }
      ev = undefined;
    } else if (ev) {
      const i = line.indexOf(':');
      if (i > 0) ev[line.slice(0, i).split(';')[0]!] = line.slice(i + 1);
    }
  }
  return out;
}
