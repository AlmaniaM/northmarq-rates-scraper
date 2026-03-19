import { fetchPage } from './page-scraper';
import { parseTables } from './page-scraper';
import { normalizeTables } from './data-normalizer';
import { buildOutput, exportToFile } from './json-exporter';

const URL = 'https://www.northmarq.com/insights/rates-spreads?reload=1#multifamily-conventional-rates-spreads';

async function main() {
  const html = await fetchPage(URL);
  const tables = parseTables(html);
  const normalized = normalizeTables(tables);
  const output = buildOutput(normalized);
  exportToFile(output);
  console.log(`Done: ${tables.length} tables, ${normalized.flatMap(t => t.rows).length} rows → output/rates.json`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
