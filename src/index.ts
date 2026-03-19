import { fetchPage, parseTables } from './scraper';
import { normalizeTable } from './normalizer';
import { buildOutput, exportToFile } from './exporter';

const URL = 'https://www.northmarq.com/insights/rates-spreads?reload=1';
const OUTPUT_PATH = 'output/rates.json';

async function main(): Promise<void> {
  const html = await fetchPage(URL);
  const tables = parseTables(html);
  const normalized = tables.map(normalizeTable);
  const output = buildOutput(normalized);
  await exportToFile(output, OUTPUT_PATH);

  const tableCount = tables.length;
  const termCount = Object.values(output).reduce((sum, terms) => sum + Object.keys(terms).length, 0);
  console.log(`Scraped ${tableCount} tables. Wrote ${termCount} term entries to ${OUTPUT_PATH}.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
