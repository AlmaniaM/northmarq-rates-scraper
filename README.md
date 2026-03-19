# Northmarq Rates Scraper

Scrapes the [Northmarq rates & spreads page](https://www.northmarq.com/insights/rates-spreads) and outputs structured JSON containing current commercial real estate loan rates across multiple loan types and terms.

## Prerequisites

- Node.js >= 18

## Install

```bash
npm install
```

## Usage

```bash
npm start
```

Fetches the Northmarq rates page, parses all rate tables, normalizes the data, and writes the result to `output/rates.json`.

## Test

```bash
npm test
```

## Output

The scraper writes `output/rates.json` with the following structure:

```json
{
  "<table name (lowercase)>": {
    "<term>": [
      {
        "rate_min": 0.065,
        "rate_max": 0.072,
        "ltv": 0.75,
        "dscr": 1.25,
        "spread_min": 150,
        "spread_max": 200,
        "amortization": 30
      }
    ]
  }
}
```

- **Top-level keys** — table name (e.g. `"multifamily conventional rates & spreads"`)
- **Second-level keys** — loan term (e.g. `"5 Year"`, `"10 Year"`)
- **Array values** — rate rows with typed numeric fields; rates and LTV are expressed as decimals (e.g. `0.065` = 6.5%), spreads are in basis points
