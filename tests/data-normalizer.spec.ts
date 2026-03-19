import { normalizeTable, normalizeTables } from '../src/data-normalizer';
import { ScrapedTable, NormalizedTable } from '../src/types';

function makeTable(rows: Record<string, string>[]): ScrapedTable {
  return { name: 'Test Table', headers: [], rows };
}

describe('data-normalizer', () => {
  describe('LTV', () => {
    it('single percentage: "65%" → 0.65', () => {
      const result = normalizeTable(makeTable([{ LTV: '65%' }]));
      expect(result.rows[0]).toEqual({ ltv: 0.65 });
    });

    it('range percentage: "50%-65%" → { ltv_min: 0.50, ltv_max: 0.65 }', () => {
      const result = normalizeTable(makeTable([{ LTV: '50%-65%' }]));
      expect(result.rows[0]).toEqual({ ltv_min: 0.5, ltv_max: 0.65 });
    });
  });

  describe('DSCR', () => {
    it('"1.35x" → 1.35', () => {
      const result = normalizeTable(makeTable([{ DSCR: '1.35x' }]));
      expect(result.rows[0]).toEqual({ dscr: 1.35 });
    });
  });

  describe('Spread (bps)', () => {
    it('"135 - 165" → { spread_min: 135, spread_max: 165 }', () => {
      const result = normalizeTable(makeTable([{ 'Spread (bps)': '135 - 165' }]));
      expect(result.rows[0]).toEqual({ spread_min: 135, spread_max: 165 });
    });
  });

  describe('Rate', () => {
    it('single rate: "3.77%" → 0.0377', () => {
      const result = normalizeTable(makeTable([{ Rate: '3.77%' }]));
      expect(result.rows[0].rate).toBeCloseTo(0.0377, 6);
    });

    it('range rate: "5.53% - 5.83%" → { rate_min: 0.0553, rate_max: 0.0583 }', () => {
      const result = normalizeTable(makeTable([{ Rate: '5.53% - 5.83%' }]));
      expect((result.rows[0].rate_min as number)).toBeCloseTo(0.0553, 6);
      expect((result.rows[0].rate_max as number)).toBeCloseTo(0.0583, 6);
    });

    it('rate column "All-In Rate" is recognized', () => {
      const result = normalizeTable(makeTable([{ 'All-In Rate': '4.50%' }]));
      expect(result.rows[0].rate).toBeCloseTo(0.045, 6);
    });

    it('rate column "Rate Before MIP" is recognized', () => {
      const result = normalizeTable(makeTable([{ 'Rate Before MIP': '3.00%' }]));
      expect(result.rows[0].rate).toBeCloseTo(0.03, 6);
    });

    it('rate range without leading % on first part: "5.25 - 5.70%" → rate_min/rate_max', () => {
      const result = normalizeTable(makeTable([{ Rate: '5.25 - 5.70%' }]));
      expect((result.rows[0].rate_min as number)).toBeCloseTo(0.0525, 6);
      expect((result.rows[0].rate_max as number)).toBeCloseTo(0.057, 6);
    });
  });

  describe('Amortization', () => {
    it('number: "30" → 30', () => {
      const result = normalizeTable(makeTable([{ Amortization: '30' }]));
      expect(result.rows[0]).toEqual({ amortization: 30 });
    });

    it('range: "25-30" → { amortization_min: 25, amortization_max: 30 }', () => {
      const result = normalizeTable(makeTable([{ Amortization: '25-30' }]));
      expect(result.rows[0]).toEqual({ amortization_min: 25, amortization_max: 30 });
    });

    it('string: "Fully Amortizing" → "Fully Amortizing"', () => {
      const result = normalizeTable(makeTable([{ Amortization: 'Fully Amortizing' }]));
      expect(result.rows[0]).toEqual({ amortization: 'Fully Amortizing' });
    });
  });

  describe('Empty values', () => {
    it('empty string value is omitted from output', () => {
      const result = normalizeTable(makeTable([{ LTV: '', Rate: '5.00%' }]));
      expect(result.rows[0]).not.toHaveProperty('ltv');
      expect(result.rows[0]).toHaveProperty('rate');
    });
  });

  describe('Unknown column passthrough', () => {
    it('unknown column key is lowercased and value kept as string', () => {
      const result = normalizeTable(makeTable([{ 'My Custom Field': 'some value' }]));
      expect(result.rows[0]).toEqual({ 'my custom field': 'some value' });
    });
  });

  describe('Full table normalization (end-to-end)', () => {
    it('normalizes a table with multiple columns and rows', () => {
      const table: ScrapedTable = {
        name: 'Agency Rates',
        headers: ['Term', 'LTV', 'DSCR', 'Rate'],
        rows: [
          { Term: '5-Year Treasury', LTV: '65%', DSCR: '1.25x', Rate: '5.53% - 5.83%' },
          { Term: '10-Year Fixed', LTV: '50%-65%', DSCR: '1.35x', Rate: '3.77%' },
        ],
      };

      const result: NormalizedTable = normalizeTable(table);

      expect(result.name).toBe('Agency Rates');
      expect(result.rows).toHaveLength(2);

      expect(result.rows[0]).toMatchObject({
        term: '5-Year Treasury',
        ltv: 0.65,
        dscr: 1.25,
      });
      expect((result.rows[0].rate_min as number)).toBeCloseTo(0.0553, 6);
      expect((result.rows[0].rate_max as number)).toBeCloseTo(0.0583, 6);

      expect(result.rows[1]).toMatchObject({
        term: '10-Year Fixed',
        ltv_min: 0.5,
        ltv_max: 0.65,
        dscr: 1.35,
      });
      expect((result.rows[1].rate as number)).toBeCloseTo(0.0377, 6);
    });

    it('normalizeTables normalizes an array of tables', () => {
      const tables: ScrapedTable[] = [
        { name: 'Table A', headers: ['Rate'], rows: [{ Rate: '4.00%' }] },
        { name: 'Table B', headers: ['LTV'], rows: [{ LTV: '70%' }] },
      ];
      const results = normalizeTables(tables);
      expect(results).toHaveLength(2);
      expect((results[0].rows[0].rate as number)).toBeCloseTo(0.04, 6);
      expect(results[1].rows[0]).toEqual({ ltv: 0.7 });
    });
  });
});
