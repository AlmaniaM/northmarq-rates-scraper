import { buildOutput } from '../src/exporter';
import { NormalizedTable } from '../src/types';

describe('buildOutput', () => {
  it('groups rows from the same table under the correct term keys', () => {
    const tables: NormalizedTable[] = [
      {
        name: 'fannie mae',
        rows: [
          { term: '15-year', ltv: 0.65, dscr: 1.35, rate_min: 0.0553, rate_max: 0.0583 },
          { term: '10-year', dscr: 1.55, rate: 0.0513 },
        ],
      },
    ];

    const output = buildOutput(tables);

    expect(output['fannie mae']).toBeDefined();
    expect(output['fannie mae']['15-year']).toHaveLength(1);
    expect(output['fannie mae']['15-year'][0]).toEqual({ ltv: 0.65, dscr: 1.35, rate_min: 0.0553, rate_max: 0.0583 });
    expect(output['fannie mae']['10-year']).toHaveLength(1);
    expect(output['fannie mae']['10-year'][0]).toEqual({ dscr: 1.55, rate: 0.0513 });
  });

  it('merges two NormalizedTable objects with the same name into the same outer key', () => {
    const tables: NormalizedTable[] = [
      {
        name: 'current index rates',
        rows: [{ term: 'sofr', rate: 0.0531 }],
      },
      {
        name: 'current index rates',
        rows: [{ term: 'treasury', rate: 0.0445 }],
      },
    ];

    const output = buildOutput(tables);

    expect(Object.keys(output)).toHaveLength(1);
    expect(output['current index rates']['sofr']).toHaveLength(1);
    expect(output['current index rates']['sofr'][0]).toEqual({ rate: 0.0531 });
    expect(output['current index rates']['treasury']).toHaveLength(1);
    expect(output['current index rates']['treasury'][0]).toEqual({ rate: 0.0445 });
  });

  it('strips null values from row objects in output', () => {
    const tables: NormalizedTable[] = [
      {
        name: 'fannie mae',
        rows: [
          { term: '10-year', ltv: null, dscr: 1.55, rate: 0.0513 },
        ],
      },
    ];

    const output = buildOutput(tables);

    expect(output['fannie mae']['10-year'][0]).not.toHaveProperty('ltv');
    expect(output['fannie mae']['10-year'][0]).toEqual({ dscr: 1.55, rate: 0.0513 });
  });

  it('produces multiple entries in an array when the same term appears in multiple rows', () => {
    const tables: NormalizedTable[] = [
      {
        name: 'fannie mae',
        rows: [
          { term: '15-year', ltv: 0.65, rate_min: 0.0553 },
          { term: '15-year', ltv: 0.70, rate_min: 0.0573 },
        ],
      },
    ];

    const output = buildOutput(tables);

    expect(output['fannie mae']['15-year']).toHaveLength(2);
    expect(output['fannie mae']['15-year'][0]).toEqual({ ltv: 0.65, rate_min: 0.0553 });
    expect(output['fannie mae']['15-year'][1]).toEqual({ ltv: 0.70, rate_min: 0.0573 });
  });
});
