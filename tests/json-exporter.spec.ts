import { buildOutput } from '../src/json-exporter';
import { NormalizedTable } from '../src/types';

describe('buildOutput', () => {
  it('groups rows by lowercased table name and term', () => {
    const tables: NormalizedTable[] = [
      {
        name: 'FANNIE MAE - CONVENTIONAL',
        rows: [
          { term: '10-Year', ltv: 0.65, dscr: 1.35 },
          { term: '5-Year', ltv: 0.55, dscr: 1.55 },
        ],
      },
    ];

    const output = buildOutput(tables);

    expect(Object.keys(output)).toEqual(['fannie mae - conventional']);
    expect(output['fannie mae - conventional']['10-Year']).toBeDefined();
    expect(output['fannie mae - conventional']['5-Year']).toBeDefined();
  });

  it('excludes the term field from row objects', () => {
    const tables: NormalizedTable[] = [
      {
        name: 'Test Table',
        rows: [{ term: '10-Year', ltv: 0.65, rate: 0.0553 }],
      },
    ];

    const output = buildOutput(tables);
    const row = output['test table']['10-Year'][0];
    expect(row).not.toHaveProperty('term');
    expect(row).toHaveProperty('ltv', 0.65);
    expect(row).toHaveProperty('rate', 0.0553);
  });

  it('omits fields with null, undefined, or empty string values from row objects', () => {
    const tables: NormalizedTable[] = [
      {
        name: 'Test Table',
        rows: [{ term: '10-Year', ltv: null, rate: undefined, dscr: '', spread_min: 135 }],
      },
    ];

    const output = buildOutput(tables);
    const row = output['test table']['10-Year'][0];
    expect(row).not.toHaveProperty('ltv');
    expect(row).not.toHaveProperty('rate');
    expect(row).not.toHaveProperty('dscr');
    expect(row).toHaveProperty('spread_min', 135);
  });

  it('omits rows with no non-term fields after filtering', () => {
    const tables: NormalizedTable[] = [
      {
        name: 'Test Table',
        rows: [
          { term: '10-Year', ltv: null },
          { term: '5-Year', ltv: 0.65 },
        ],
      },
    ];

    const output = buildOutput(tables);
    expect(Object.keys(output['test table'])).toEqual(['5-Year']);
  });

  it('omits table keys with no rows after filtering', () => {
    const tables: NormalizedTable[] = [
      {
        name: 'Empty Table',
        rows: [{ term: '10-Year', ltv: null }],
      },
      {
        name: 'Good Table',
        rows: [{ term: '5-Year', ltv: 0.65 }],
      },
    ];

    const output = buildOutput(tables);
    expect(output).not.toHaveProperty('empty table');
    expect(output).toHaveProperty('good table');
  });

  it('skips rows with no term field', () => {
    const tables: NormalizedTable[] = [
      {
        name: 'Test Table',
        rows: [
          { ltv: 0.65 },
          { term: '', ltv: 0.55 },
          { term: '10-Year', ltv: 0.75 },
        ],
      },
    ];

    const output = buildOutput(tables);
    expect(Object.keys(output['test table'])).toEqual(['10-Year']);
  });

  it('handles multiple tables', () => {
    const tables: NormalizedTable[] = [
      {
        name: 'Fannie Mae',
        rows: [{ term: '10-Year', ltv: 0.65 }],
      },
      {
        name: 'Freddie Mac',
        rows: [{ term: '7-Year', ltv: 0.55 }],
      },
    ];

    const output = buildOutput(tables);
    expect(Object.keys(output)).toEqual(['fannie mae', 'freddie mac']);
  });

  it('trims table names before lowercasing', () => {
    const tables: NormalizedTable[] = [
      {
        name: '  FANNIE MAE  ',
        rows: [{ term: '10-Year', ltv: 0.65 }],
      },
    ];

    const output = buildOutput(tables);
    expect(output).toHaveProperty('fannie mae');
  });

  it('returns empty object for empty input', () => {
    expect(buildOutput([])).toEqual({});
  });
});
