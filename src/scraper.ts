import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedTable, RawRow } from './types';

export async function fetchPage(url: string): Promise<string> {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'NorthmarqRatesScraper/1.0 (automated data collection)',
    },
  });
  return response.data;
}

export function parseTables(html: string): ScrapedTable[] {
  const $ = cheerio.load(html);
  const tables: ScrapedTable[] = [];

  $('table.nm-rates-table').each((_, tableEl) => {
    // Traverse up to find the nearest ancestor that contains h3.rates-title
    const $table = $(tableEl);

    // Walk up ancestors to find the container with a rates-title
    let name = '';
    let $el = $table;
    while ($el.length) {
      const $parent = $el.parent();
      if (!$parent.length) break;
      const $title = $parent.find('h3.rates-title').first();
      if ($title.length) {
        name = $title.text().trim().toLowerCase();
        break;
      }
      $el = $parent;
    }

    // Fallback: look for nearest preceding h3.rates-title in the whole document
    if (!name) {
      let $prev = $table.prev();
      while ($prev.length) {
        if ($prev.is('h3.rates-title')) {
          name = $prev.text().trim().toLowerCase();
          break;
        }
        const $found = $prev.find('h3.rates-title').last();
        if ($found.length) {
          name = $found.text().trim().toLowerCase();
          break;
        }
        $prev = $prev.prev();
      }
    }

    // Columns from thead th elements
    const columns: string[] = [];
    $table.find('thead th').each((_, th) => {
      columns.push($(th).text().trim());
    });

    // Rows from tbody tr elements
    const rows: RawRow[] = [];
    $table.find('tbody tr').each((_, tr) => {
      const cells: string[] = [];
      $(tr).find('td').each((_, td) => {
        cells.push($(td).text().trim());
      });

      // Skip rows where every cell is empty
      if (cells.every((cell) => cell === '')) {
        return;
      }

      const row: RawRow = {};
      columns.forEach((col, idx) => {
        row[col] = cells[idx] !== undefined ? cells[idx] : '';
      });
      rows.push(row);
    });

    tables.push({ name, columns, rows });
  });

  return tables;
}
