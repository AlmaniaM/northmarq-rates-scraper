import type { ScrapedTable, NormalizedTable, NormalizedRow } from './types';

/**
 * Normalize a raw column name:
 * - lowercase
 * - trim whitespace
 * - strip trailing `*` and other punctuation
 */
function normalizeColName(col: string): string {
  return col.toLowerCase().trim().replace(/[*.,;:!?]+$/, '').trim();
}

/**
 * Parse a percentage string (e.g. "65%") to a decimal rounded to 4 dp.
 */
function parsePct(s: string): number {
  const v = parseFloat(s.replace('%', '').trim());
  return parseFloat((v / 100).toFixed(4));
}

/**
 * Normalize a single cell value given the normalized column name.
 * Returns either a scalar (string | number | null) or a plain object
 * with multiple spread fields (for ranges).
 */
function normalizeCell(
  normalizedCol: string,
  raw: string
): Record<string, string | number | null> {
  // Empty cell
  if (raw.trim() === '') {
    return { [normalizedCol]: null };
  }

  if (normalizedCol === 'term') {
    return { term: raw.trim() };
  }

  if (normalizedCol === 'ltv') {
    // Range: "50%-65%" or "65-75%"
    const rangeMatch = raw.match(/^([\d.]+)%?\s*-\s*([\d.]+)%/);
    if (rangeMatch) {
      return {
        ltv_min: parseFloat((parseFloat(rangeMatch[1]) / 100).toFixed(4)),
        ltv_max: parseFloat((parseFloat(rangeMatch[2]) / 100).toFixed(4)),
      };
    }
    // Single: "65%"
    const singleMatch = raw.match(/^([\d.]+)%/);
    if (singleMatch) {
      return { ltv: parseFloat((parseFloat(singleMatch[1]) / 100).toFixed(4)) };
    }
  }

  if (normalizedCol === 'dscr') {
    const v = parseFloat(raw.replace(/x$/i, '').trim());
    if (!isNaN(v)) return { dscr: v };
  }

  if (normalizedCol === 'spread (bps)') {
    // Integer range: "135 - 165"
    const m = raw.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      return {
        spread_min: parseInt(m[1], 10),
        spread_max: parseInt(m[2], 10),
      };
    }
    const n = parseInt(raw.trim(), 10);
    if (!isNaN(n)) return { 'spread (bps)': n };
  }

  if (normalizedCol === 'rate' || normalizedCol === 'rates') {
    // Percentage range: "5.53% - 5.83%"
    const rangeMatch = raw.match(/^([\d.]+)%\s*-\s*([\d.]+)%/);
    if (rangeMatch) {
      return {
        rate_min: parseFloat((parseFloat(rangeMatch[1]) / 100).toFixed(4)),
        rate_max: parseFloat((parseFloat(rangeMatch[2]) / 100).toFixed(4)),
      };
    }
    // Single: "5.31%"
    const singleMatch = raw.match(/^([\d.]+)%/);
    if (singleMatch) {
      return { rate: parseFloat((parseFloat(singleMatch[1]) / 100).toFixed(4)) };
    }
  }

  if (normalizedCol === 'amortization') {
    const n = parseFloat(raw.trim());
    if (!isNaN(n) && raw.trim() !== '') return { amortization: n };
    return { amortization: raw.trim() };
  }

  // Unknown columns: try numeric, fall back to string
  const n = parseFloat(raw.trim());
  if (!isNaN(n)) return { [normalizedCol]: n };
  return { [normalizedCol]: raw.trim() };
}

export function normalizeTable(table: ScrapedTable): NormalizedTable {
  const rows: NormalizedRow[] = table.rows.map((rawRow) => {
    const normalizedRow: NormalizedRow = {};

    for (const col of table.columns) {
      const normCol = normalizeColName(col);
      const rawValue = rawRow[col] ?? '';
      const fields = normalizeCell(normCol, rawValue);
      Object.assign(normalizedRow, fields);
    }

    return normalizedRow;
  });

  return { name: table.name, rows };
}
