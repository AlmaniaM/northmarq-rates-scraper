import { normalizeTable } from '../src/normalizer';
import type { ScrapedTable } from '../src/types';

function makeTable(col: string, value: string): ScrapedTable {
  return {
    name: 'test-table',
    columns: [col],
    rows: [{ [col]: value }],
  };
}

describe('normalizeTable', () => {
  // 1. term → string passthrough
  it('passes term column through as string', () => {
    const result = normalizeTable(makeTable('Term', '15-year'));
    expect(result.rows[0].term).toBe('15-year');
  });

  // 2. ltv single % → decimal
  it('converts single ltv % to decimal', () => {
    const result = normalizeTable(makeTable('LTV', '65%'));
    expect(result.rows[0].ltv).toBe(0.65);
  });

  // 3. ltv range %–% → ltv_min / ltv_max
  it('converts ltv % range to ltv_min and ltv_max', () => {
    const result = normalizeTable(makeTable('LTV', '50%-65%'));
    expect(result.rows[0].ltv_min).toBe(0.5);
    expect(result.rows[0].ltv_max).toBe(0.65);
  });

  // 4. dscr with x suffix → number
  it('strips x suffix from dscr and returns number', () => {
    const result = normalizeTable(makeTable('DSCR', '1.35x'));
    expect(result.rows[0].dscr).toBe(1.35);
  });

  // 5. spread (bps) integer range → spread_min / spread_max
  it('converts spread (bps) integer range to spread_min and spread_max', () => {
    const result = normalizeTable(makeTable('Spread (bps)', '135 - 165'));
    expect(result.rows[0].spread_min).toBe(135);
    expect(result.rows[0].spread_max).toBe(165);
  });

  // 6. rate percentage range → rate_min / rate_max
  it('converts rate % range to rate_min and rate_max', () => {
    const result = normalizeTable(makeTable('Rate', '5.53% - 5.83%'));
    expect(result.rows[0].rate_min).toBe(0.0553);
    expect(result.rows[0].rate_max).toBe(0.0583);
  });

  // 7. rate single % → rate scalar
  it('converts single rate % to rate scalar', () => {
    const result = normalizeTable(makeTable('Rate', '5.31%'));
    expect(result.rows[0].rate).toBe(0.0531);
  });

  // 8. "Rates*" column → same output as rate
  it('normalizes Rates* column name and produces rate scalar', () => {
    const result = normalizeTable(makeTable('Rates*', '5.31%'));
    expect(result.rows[0].rate).toBe(0.0531);
  });

  // 9. amortization numeric string → number
  it('converts amortization numeric string to number', () => {
    const result = normalizeTable(makeTable('Amortization', '30'));
    expect(result.rows[0].amortization).toBe(30);
  });

  // 10. amortization text string → string fallback
  it('keeps amortization text string as string', () => {
    const result = normalizeTable(makeTable('Amortization', 'Fully Amortizing'));
    expect(result.rows[0].amortization).toBe('Fully Amortizing');
  });

  // 11. empty cell → null
  it('converts empty cell to null', () => {
    const result = normalizeTable(makeTable('Rate', ''));
    expect(result.rows[0].rate).toBeNull();
  });
});
