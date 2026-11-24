const FORMULA_INJECTION_RE = /^\s*[=+\-@\t\r]/;
const CSV_NEEDS_QUOTING_RE = /[",\n\r]/;

export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    return '';
  }
  let str: string;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return '';
    }
    str = value.toISOString();
  } else {
    str = String(value);
  }
  if (FORMULA_INJECTION_RE.test(str)) {
    return `'${str}`;
  }
  return str;
}

export function escapeCsvField(value: unknown): string {
  const sanitized = sanitizeCsvCell(value);
  if (CSV_NEEDS_QUOTING_RE.test(sanitized)) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}

export function buildCsvString(headers: string[], rows: unknown[][]): string {
  const BOM = '\uFEFF';
  if (headers.length === 0 && rows.length === 0) {
    return BOM;
  }

  const lines: string[] = [];
  if (headers.length > 0) {
    lines.push(headers.map((header) => escapeCsvField(header)).join(','));
  }
  for (const row of rows) {
    lines.push(row.map((cell) => escapeCsvField(cell)).join(','));
  }

  return BOM + lines.join('\r\n');
}
