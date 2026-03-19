export type RawRow = Record<string, string>;

export interface ScrapedTable {
  name: string;       // lowercased, trimmed h3.rates-title text
  columns: string[];  // th text values in DOM order
  rows: RawRow[];     // one object per non-empty tbody tr
}

export type NormalizedRow = Record<string, string | number | null>;

export interface NormalizedTable {
  name: string;        // same as ScrapedTable.name
  rows: NormalizedRow[];
}

export type RatesOutput = Record<string, Record<string, NormalizedRow[]>>;
