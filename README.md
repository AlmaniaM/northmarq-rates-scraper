# Northmarq Rates Scraper

Scrapes the [Northmarq Rates & Spreads](https://www.northmarq.com/insights/rates-spreads?reload=1) page and writes a structured JSON file.

## Setup

```bash
npm install
```

## Run

```bash
npm start
```

Fetches the page, parses all rate tables, normalizes values, and writes `output/rates.json`.

Console output on success:
```
Scraped 12 tables. Wrote 47 term entries to output/rates.json.
```

## Test

```bash
npm test
```

## Output Format

Root object with lowercased table names as keys → term names as keys → array of data objects per row:

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

## Assumptions

- The page is server-rendered.
- The terms are always defined and present.
- When the same term appears more than once, store the records under the same term property.
- Some column names may be different slightly. Match them lowercased.

## Tradeoffs & Edge Cases

- **Duplicate table names** (e.g. "CMBS SPREADS/RATES" appears twice): rows from all tables sharing the same lowercased name are merged into a single output key rather than overwriting or erroring.
- **Rate column variants** ("Rate" vs "Rates*"): both are treated as the same field during normalization; the asterisk and any trailing punctuation are stripped, and values are stored under the same `rate` / `rate_min` / `rate_max` output properties.
- **Column name inconsistencies**: all `<th>` text is lowercased and trimmed before matching, so minor casing or whitespace differences across tables resolve to the same field without special-casing each variant.
