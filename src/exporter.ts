import * as fs from 'fs';
import * as path from 'path';
import { NormalizedTable, RatesOutput, NormalizedRow } from './types';

export function buildOutput(tables: NormalizedTable[]): RatesOutput {
  const output: RatesOutput = {};

  for (const table of tables) {
    const tableName = table.name.toLowerCase();

    if (!output[tableName]) {
      output[tableName] = {};
    }

    for (const row of table.rows) {
      // Find term field (try lowercase first, then case-insensitive)
      let termKey = 'term';
      if (!(termKey in row)) {
        const found = Object.keys(row).find(k => k.toLowerCase() === 'term');
        if (found) {
          termKey = found;
        }
      }

      const termValue = row[termKey];
      const termStr = termValue != null ? String(termValue).toLowerCase() : '';

      // Build cleaned row without term field and without null values
      const cleaned: NormalizedRow = {};
      for (const [key, value] of Object.entries(row)) {
        if (key === termKey) continue;
        if (value === null) continue;
        cleaned[key] = value;
      }

      if (!output[tableName][termStr]) {
        output[tableName][termStr] = [];
      }
      output[tableName][termStr].push(cleaned);
    }
  }

  return output;
}

export async function exportToFile(output: RatesOutput, filePath: string): Promise<void> {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, JSON.stringify(output, null, 2));
}
