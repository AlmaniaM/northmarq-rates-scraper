export interface ScrapedTable {
  name: string;
  headers: string[];
  rows: Record<string, string>[];
}

export interface NormalizedTable {
  name: string;
  rows: Record<string, unknown>[];
}

export type RatesOutput = Record<string, Record<string, Record<string, unknown>[]>>;
