/**
 * Escapes a single CSV cell value to protect against CSV / Formula Injection
 * (CWE-1236 / Spreadsheet Formula Injection).
 * If a cell starts with =, +, -, @, \t, or \r, prepend a single quote '.
 */
export function sanitizeCsvCell(cell: unknown): string {
  if (cell === null || cell === undefined) {
    return '""';
  }

  let str = String(cell);

  // Check for formula injection triggers
  const triggerChars = ['=', '+', '-', '@', '\t', '\r'];
  if (triggerChars.some((char) => str.startsWith(char))) {
    // Escape by prepending a single quote
    str = `'${str}`;
  }

  // Escape inner double quotes by doubling them
  const escaped = str.replace(/"/g, '""');

  return `"${escaped}"`;
}

/**
 * Builds a sanitized CSV string from headers and 2D row array.
 */
export function buildCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const headerLine = headers.map(sanitizeCsvCell).join(',');
  const rowLines = rows.map((row) => row.map(sanitizeCsvCell).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Initiates browser download of a CSV file.
 */
export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
