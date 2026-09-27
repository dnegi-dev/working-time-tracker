import type { ExportFormat, ReportTable } from '../../ports/index.ts';

const mdCell = (v: unknown) => String(v).replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function toMarkdown(tables: ReportTable[], title: string): string {
  const parts = [`# ${title}`];
  for (const t of tables) {
    parts.push(`## ${t.title}`);
    if (!t.rows.length) {
      parts.push('—');
      continue;
    }
    const row = (cells: unknown[]) => `| ${cells.map(mdCell).join(' | ')} |`;
    parts.push([row(t.columns), row(t.columns.map(() => '---')), ...t.rows.map(row)].join('\n'));
  }
  return parts.join('\n\n') + '\n';
}

const csvCell = (v: unknown) => {
  const s = String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** One CSV; multiple tables are separated by an empty line and a title line. */
export function toCsv(tables: ReportTable[]): string {
  return (
    tables
      .map((t) =>
        [t.title, t.columns, ...t.rows]
          .map((r) => (Array.isArray(r) ? r.map(csvCell).join(',') : csvCell(r)))
          .join('\n'),
      )
      .join('\n\n') + '\n'
  );
}

export function toJson(tables: ReportTable[]): string {
  const data = tables.map((t) => ({
    title: t.title,
    rows: t.rows.map((r) => Object.fromEntries(t.columns.map((c, i) => [c, r[i]]))),
  }));
  return JSON.stringify(data, null, 2);
}

/** Excel: one sheet per table. The library is loaded only when needed. */
export async function toXlsx(tables: ReportTable[]): Promise<Blob> {
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  const sheets = tables.map((t) => ({
    sheet: t.title.slice(0, 31),
    data: [t.columns.map((c) => ({ value: c, fontWeight: 'bold' as const })), ...t.rows],
  }));
  return writeXlsxFile(sheets).toBlob();
}

const MIME: Record<ExportFormat, string> = {
  md: 'text/markdown',
  csv: 'text/csv',
  json: 'application/json',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export async function formatReport(
  tables: ReportTable[],
  format: ExportFormat,
  title: string,
): Promise<Blob> {
  if (format === 'xlsx') return toXlsx(tables);
  const text =
    format === 'md' ? toMarkdown(tables, title) : format === 'csv' ? toCsv(tables) : toJson(tables);
  return new Blob([text], { type: MIME[format] });
}
