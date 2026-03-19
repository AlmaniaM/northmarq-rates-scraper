import * as fs from 'fs';
import * as path from 'path';
import { parseTables } from '../src/page-scraper';

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../data/datasets/multifamily-conventional-rates-and-spreads.html'
);

const fixtureHtml = fs.readFileSync(FIXTURE_PATH, 'utf-8');

// Minimal inline HTML matching the Northmarq DOM structure:
// .rates-item > .table-title > h3  +  .rates-item > div > table
const INLINE_HTML = `
<html><body>
  <div class="rates-item">
    <div class="table-title">
      <h3 class="rates-title">FANNIE MAE - CONVENTIONAL</h3>
    </div>
    <div class="content">
      <table>
        <thead><tr><th>Term</th><th>LTV</th><th>DSCR</th><th>Spread (bps)</th><th>Rate</th></tr></thead>
        <tbody>
          <tr><td>15-Year</td><td>65%</td><td>1.35x</td><td>135 - 165</td><td>5.53% - 5.83%</td></tr>
          <tr><td>10-Year</td><td>55%</td><td>1.55x</td><td>95 - 115</td><td>5.13% - 5.33%</td></tr>
          <tr><td>  </td><td>  </td><td>  </td><td>  </td><td>  </td></tr>
        </tbody>
      </table>
    </div>
  </div>
</body></html>
`;

describe('parseTables — inline HTML', () => {
  it('parses table name from h3 inside parent sibling .table-title div', () => {
    const tables = parseTables(INLINE_HTML);
    expect(tables).toHaveLength(1);
    expect(tables[0].name).toBe('FANNIE MAE - CONVENTIONAL');
  });

  it('discovers headers dynamically from <th> elements', () => {
    const [table] = parseTables(INLINE_HTML);
    expect(table.headers).toEqual(['Term', 'LTV', 'DSCR', 'Spread (bps)', 'Rate']);
  });

  it('builds rows keyed by header name', () => {
    const [table] = parseTables(INLINE_HTML);
    expect(table.rows[0]).toEqual({
      Term: '15-Year',
      LTV: '65%',
      DSCR: '1.35x',
      'Spread (bps)': '135 - 165',
      Rate: '5.53% - 5.83%',
    });
  });

  it('keeps raw string values — no normalization', () => {
    const [table] = parseTables(INLINE_HTML);
    expect(typeof table.rows[0]['LTV']).toBe('string');
    expect(table.rows[0]['LTV']).toBe('65%');
    expect(table.rows[0]['Rate']).toBe('5.53% - 5.83%');
  });

  it('skips all-empty rows', () => {
    const [table] = parseTables(INLINE_HTML);
    // The whitespace-only row should be skipped — only 2 data rows remain
    expect(table.rows).toHaveLength(2);
  });

  it('trims whitespace from cell values', () => {
    const html = `<html><body>
      <div class="rates-item">
        <div class="table-title"><h3>Test</h3></div>
        <div><table>
          <thead><tr><th> Term </th><th> LTV </th></tr></thead>
          <tbody><tr><td>  5-Year  </td><td>  65%  </td></tr></tbody>
        </table></div>
      </div>
    </body></html>`;
    const [table] = parseTables(html);
    expect(table.rows[0]['Term']).toBe('5-Year');
    expect(table.rows[0]['LTV']).toBe('65%');
  });

  it('stores empty cells as empty string ""', () => {
    const html = `<html><body>
      <div class="rates-item">
        <div class="table-title"><h3>Test</h3></div>
        <div><table>
          <thead><tr><th>Term</th><th>LTV</th></tr></thead>
          <tbody><tr><td>5-Year</td><td></td></tr></tbody>
        </table></div>
      </div>
    </body></html>`;
    const [table] = parseTables(html);
    expect(table.rows[0]['LTV']).toBe('');
  });
});

describe('parseTables — real HTML fixture', () => {
  let tables: ReturnType<typeof parseTables>;

  beforeAll(() => {
    tables = parseTables(fixtureHtml);
  });

  it('finds 16 tables in the fixture', () => {
    expect(tables).toHaveLength(16);
  });

  it('each table has a non-empty name', () => {
    for (const table of tables) {
      expect(table.name.length).toBeGreaterThan(0);
    }
  });

  it('each table has at least one header', () => {
    for (const table of tables) {
      expect(table.headers.length).toBeGreaterThan(0);
    }
  });

  it('rows are keyed by the discovered headers', () => {
    for (const table of tables) {
      for (const row of table.rows) {
        for (const header of table.headers) {
          expect(Object.prototype.hasOwnProperty.call(row, header)).toBe(true);
        }
      }
    }
  });

  it('no all-empty rows in output', () => {
    for (const table of tables) {
      for (const row of table.rows) {
        const allEmpty = Object.values(row).every((v) => v === '');
        expect(allEmpty).toBe(false);
      }
    }
  });

  it('all cell values are trimmed strings', () => {
    for (const table of tables) {
      for (const row of table.rows) {
        for (const val of Object.values(row)) {
          expect(typeof val).toBe('string');
          expect(val).toBe(val.trim());
        }
      }
    }
  });

  it('Fannie Mae table has correct name and headers', () => {
    const fannie = tables.find((t) => t.name === 'FANNIE MAE - CONVENTIONAL');
    expect(fannie).toBeDefined();
    expect(fannie!.headers).toEqual(['Term', 'LTV', 'DSCR', 'Spread (bps)', 'Rate']);
  });

  it('Fannie Mae first row has correct raw string values', () => {
    const fannie = tables.find((t) => t.name === 'FANNIE MAE - CONVENTIONAL')!;
    const row = fannie.rows[0];
    expect(row['Term']).toBe('15-Year');
    expect(row['LTV']).toBe('65%');
    expect(row['DSCR']).toBe('1.35x');
    expect(row['Spread (bps)']).toBe('135 - 165');
    expect(row['Rate']).toBe('5.53% - 5.83%');
  });
});
