import { ScrapedTable, NormalizedTable } from './types';

const RATE_COLUMNS = /^(rates?|all-in rate|rate before mip)$/i;
const RANGE_REGEX = /^[\d.]+\s*[-–]\s*[\d.]+/;

function stripPercent(val: string): string {
  return val.replace(/%/g, '').trim();
}

function isRange(val: string): boolean {
  return RANGE_REGEX.test(val);
}

function parseRange(val: string): [number, number] {
  const parts = val.split(/[-–]/).map((p) => parseFloat(p.trim()));
  return [parts[0], parts[1]];
}

function parseCell(
  column: string,
  raw: string
): Record<string, unknown> | null {
  const value = raw.trim();
  if (value === '' || value === null) return null;

  const col = column.trim();
  const colLower = col.toLowerCase();

  // Term
  if (/^term$/i.test(col)) {
    return { term: value };
  }

  // LTV
  if (/^ltv$/i.test(col)) {
    const stripped = stripPercent(value);
    if (isRange(stripped)) {
      const [lo, hi] = parseRange(stripped);
      return { ltv_min: lo / 100, ltv_max: hi / 100 };
    }
    const n = parseFloat(stripped);
    if (isNaN(n)) return null;
    return { ltv: n / 100 };
  }

  // DSCR
  if (/^dscr$/i.test(col)) {
    const stripped = value.replace(/x$/i, '').trim();
    const n = parseFloat(stripped);
    if (isNaN(n)) return null;
    return { dscr: n };
  }

  // Spread (bps)
  if (/^spread\s*\(bps\)$/i.test(col)) {
    if (isRange(value)) {
      const [lo, hi] = parseRange(value);
      return { spread_min: lo, spread_max: hi };
    }
    const n = parseFloat(value);
    if (isNaN(n)) return null;
    return { spread: n };
  }

  // Rate columns
  if (RATE_COLUMNS.test(col)) {
    const stripped = stripPercent(value);
    if (isRange(stripped)) {
      const [lo, hi] = parseRange(stripped);
      return { rate_min: lo / 100, rate_max: hi / 100 };
    }
    const n = parseFloat(stripped);
    if (isNaN(n)) return null;
    return { rate: n / 100 };
  }

  // Amortization
  if (/^amortization$/i.test(col)) {
    if (/[a-zA-Z]/.test(value)) {
      return { amortization: value };
    }
    if (isRange(value)) {
      const [lo, hi] = parseRange(value);
      return { amortization_min: lo, amortization_max: hi };
    }
    const n = parseFloat(value);
    if (isNaN(n)) return null;
    return { amortization: n };
  }

  // Index
  if (/^index$/i.test(col)) {
    return { index: value };
  }

  // Product
  if (/^product$/i.test(col)) {
    return { product: value };
  }

  // Unknown column — passthrough, key lowercased
  return { [colLower]: value };
}

export function normalizeTable(table: ScrapedTable): NormalizedTable {
  const rows: Record<string, unknown>[] = table.rows.map((raw) => {
    const out: Record<string, unknown> = {};
    for (const [col, val] of Object.entries(raw)) {
      if (val === undefined || val === null || val.trim() === '') continue;
      const parsed = parseCell(col, val);
      if (parsed !== null) {
        Object.assign(out, parsed);
      }
    }
    return out;
  });

  return { name: table.name, rows };
}

export function normalizeTables(tables: ScrapedTable[]): NormalizedTable[] {
  return tables.map(normalizeTable);
}
