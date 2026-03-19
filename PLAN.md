# Northmarq Rates Scraper

Scrap the `https://www.northmarq.com/insights/rates-spreads?reload=1#multifamily-conventional-rates-spreads` web page for rates & spreads and build a JSON output file.

## Tech Stack

We're going to use Node.js, Typescript, Axios, Cheerios, and Jest.

## Output Format

The output file will be a JSON file: root object with table names lowercased as properties -> term names as properties -> store the same terms with differentiating properties as object within the term array:

```json
{
  "fannie mae - conventional": {
    "15-year": [
      { "ltv": 0.65, "dscr": 1.35, "spread_min": 135, "spread_max": 165, "rate_min": 0.0553, "rate_max": 0.0583 }
    ],
    "10-year": [
      { "ltv": 0.55, "dscr": 1.55, "spread_min": 95, "spread_max": 115, "rate_min": 0.0513, "rate_max": 0.0533 }
    ]
  },
  "current index rates": {
    "sofr": [{ "rate": 0.0531 }]
  }
}
```

## Project structure

Follow the project structure below:

```markdown
northmarq-rates-scraper/
├── src/
│   ├── types.ts        # Shared interfaces: ScrapedTable, NormalizedTable, RatesOutput
│   ├── scraper.ts      # fetchPage() and parseTables() — fetch HTML, extract raw string rows
│   ├── normalizer.ts   # normalizeTable() — convert raw strings to typed numbers/ranges
│   ├── exporter.ts     # buildOutput() and exportToFile() — group by table+term, write JSON
│   └── index.ts        # Entry point — wires the pipeline, logs summary, exits 1 on error
├── tests/
│   ├── scraper.spec.ts    # HTML parsing tests using fixture file and inline HTML. Get mock data from data/documents/northmarq-rates-and-spreads.html for testing.
│   ├── normalizer.spec.ts # One test per column parsing rule
│   └── exporter.spec.ts   # Grouping, filtering, and null-omission logic
├── output/
│   └── rates.json      # Generated on npm start (git-ignored)
├── package.json
├── tsconfig.json
├── PLAN.md
└── README.md           # Setup, run, test, assumptions, tradeoffs
```

## Parsing Strategy

The page is server-side rendered, so all table data is present in the raw HTML without any JavaScript execution required. Each data table is selected via the `table.nm-rates-table` CSS class; its name is derived by walking up the DOM to find the nearest preceding `h3.rates-title` sibling, whose trimmed text becomes the table key. Columns are discovered dynamically by reading the `<th>` elements in each table's `<thead>` row — no column names are hardcoded, so any table with any set of headers (e.g. Term, LTV, DSCR, Spread, Rate, Amortization) is parsed correctly without code changes.

**Cell value normalization rules (applied after column discovery):**

- **Integer range** (`"135 - 165"`) → `{ spread_min: 135, spread_max: 165 }`
- **Percentage range** (`"5.53% - 5.83%"`) → `{ rate_min: 0.0553, rate_max: 0.0583 }` (strip `%`, divide by 100)
- **Single percentage** (`"65%"`) → `0.65`
- **Single integer** (`"1.35x"`, `"30"`) → bare number (strip trailing `x` or other units)
- **Plain string** (term names, labels) → kept as-is; no coercion attempted

NOTE: Make sure percentages are limited to four decimal places.

## Implementation Notes

**`scraper.ts`** — Select all `table.nm-rates-table` elements; for each, locate its table name by finding the nearest preceding `h3.rates-title` sibling and trimming its text. Discover column names dynamically from the `<th>` cells in `<thead>`. For each `<tr>` in `<tbody>`, map cells to column names; trim whitespace from every cell value, store blank cells as empty strings (`""`), and skip any row where every cell is empty.

**`normalizer.ts`** — Receives raw string rows keyed by column name and converts values to typed output. Handles the following column types: `Term` (string, kept as-is), `LTV` (single `%` or range `%–%`), `DSCR` (numeric, strip trailing `x`), `Spread (bps)` (integer range `N - N` → `_min`/`_max`), `Rate` (percentage range → `_min`/`_max`), and `Amortization` (string or numeric). All percentages are divided by 100 and rounded to four decimal places. See the Parsing Strategy section for the full normalization rules.

**`exporter.ts`** — Takes normalized rows and builds the output object: table names are lowercased and become root keys; within each table, the `Term` value becomes a property key whose value is an array of data objects — one element per row, each containing that row's remaining typed properties. Multiple rows sharing the same term (but differing in LTV, DSCR, etc.) appear as separate elements in the same array. See the Output Format section for the full schema.

NOTE: Tests should only be written for practicality and maintainability. I do not want 100% test coverage for the sake of 100% test coverage.

## Assumptions

- The page is server-rendered.
- The terms are always defined and present.
- When the same term appears more than once, store the records under the same term property.
- Some column names may be different slightly. Match them lowercased.

## Tradeoffs & Edge Cases

- **Duplicate table names** (e.g. "CMBS SPREADS/RATES" appears twice): rows from all tables sharing the same lowercased name are merged into a single output key rather than overwriting or erroring.
- **Rate column variants** ("Rate" vs "Rates*"): both are treated as the same field during normalization; the asterisk and any trailing punctuation are stripped, and values are stored under the same `rate` / `rate_min` / `rate_max` output properties.
- **Column name inconsistencies**: all `<th>` text is lowercased and trimmed before matching, so minor casing or whitespace differences across tables resolve to the same field without special-casing each variant.

## Phases

- Phase 1: Create the project structure, types and packages so other agents don't have merge conflicts.
- Phase 2: Implement all files. Create an agent per src and spec file so it can test immediately. Finale steps should be to glue the work together, run the scraper, run tests and write the README. 
