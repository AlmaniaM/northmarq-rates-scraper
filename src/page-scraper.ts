import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedTable } from './types';

export async function fetchPage(url: string): Promise<string> {
  const response = await axios.get<string>(url, { responseType: 'text' });
  return response.data;
}

export function parseTables(html: string): ScrapedTable[] {
  const $ = cheerio.load(html);
  const tables: ScrapedTable[] = [];

  $('table').each((_i, tableEl) => {
    const $table = $(tableEl);

    const $prev = $table.prev();
    const name = $prev.text().trim();

    const headers: string[] = [];
    $table.find('thead th').each((_j, th) => {
      headers.push($(th).text().trim());
    });

    if (headers.length === 0) {
      $table.find('tr').first().find('th').each((_j, th) => {
        headers.push($(th).text().trim());
      });
    }

    const rows: Record<string, string>[] = [];
    $table.find('tbody tr').each((_j, tr) => {
      const cells: string[] = [];
      $(tr).find('td').each((_k, td) => {
        cells.push($(td).text().trim());
      });

      const allEmpty = cells.every((c) => c === '');
      if (allEmpty) return;

      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = cells[idx] !== undefined ? cells[idx] : '';
      });
      rows.push(row);
    });

    tables.push({ name, headers, rows });
  });

  return tables;
}
