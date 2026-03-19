import * as fs from 'fs';
import * as path from 'path';
import { NormalizedTable, RatesOutput } from './types';

export function buildOutput(tables: NormalizedTable[]): RatesOutput {
  const output: RatesOutput = {};

  for (const table of tables) {
    const tableKey = table.name.trim().toLowerCase();
    const grouped: Record<string, Record<string, unknown>[]> = {};

    for (const row of table.rows) {
      const term = row['term'];
      if (term === null || term === undefined || term === '') {
        continue;
      }
      const termKey = String(term);

      const rowWithoutTerm: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row)) {
        if (k === 'term') continue;
        if (v === null || v === undefined || v === '') continue;
        rowWithoutTerm[k] = v;
      }

      if (Object.keys(rowWithoutTerm).length === 0) continue;

      if (!grouped[termKey]) {
        grouped[termKey] = [];
      }
      grouped[termKey].push(rowWithoutTerm);
    }

    if (Object.keys(grouped).length === 0) continue;

    output[tableKey] = grouped;
  }

  return output;
}

export function exportToFile(data: RatesOutput, filePath?: string): void {
  const outputPath = filePath ?? process.env['OUTPUT_PATH'] ?? 'output/rates.json';

  try {
    const dir = path.dirname(outputPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write rates.json:', err);
    fs.writeFileSync(outputPath, '{}', 'utf-8');
  }
}
