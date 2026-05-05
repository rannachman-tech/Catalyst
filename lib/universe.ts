// Server-side universe loader.
// Reads data/catalog.json (committed file, ~12k stocks).

import type { TickerEntry } from "./tickers";
import { TICKERS } from "./tickers";

export interface UniverseEntry {
  ticker: string;
  symbolFull: string;
  instrumentId: number;
  name: string;
  exchange: number;
}

interface CatalogFile {
  asOf: string;
  count: number;
  stocks: UniverseEntry[];
}

let CACHE: { stocks: UniverseEntry[]; byTicker: Map<string, UniverseEntry> } | null = null;

function load(): { stocks: UniverseEntry[]; byTicker: Map<string, UniverseEntry> } {
  if (CACHE) return CACHE;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const data = require("../data/catalog.json") as CatalogFile;
  const stocks = data.stocks ?? [];
  const byTicker = new Map(stocks.map((s) => [s.ticker.toUpperCase(), s]));
  CACHE = { stocks, byTicker };
  return CACHE;
}

export function findInUniverse(ticker: string): UniverseEntry | null {
  const u = ticker.trim().toUpperCase();
  if (!u) return null;
  return load().byTicker.get(u) ?? null;
}

export interface SearchHit {
  ticker: string;
  symbolFull: string;
  instrumentId: number;
  name: string;
  curated: boolean;
  sector?: TickerEntry["sector"];
}

const CURATED_BY_TICKER = new Map(TICKERS.map((t) => [t.ticker.toUpperCase(), t]));

export function searchUniverse(query: string, limit = 20): SearchHit[] {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  const { stocks } = load();

  const exact: SearchHit[] = [];
  const tickerStarts: SearchHit[] = [];
  const nameStarts: SearchHit[] = [];
  const nameContains: SearchHit[] = [];

  for (const s of stocks) {
    const tk = s.ticker.toUpperCase();
    const nm = s.name.toUpperCase();
    const curated = CURATED_BY_TICKER.get(tk);
    const hit: SearchHit = {
      ticker: s.ticker,
      symbolFull: s.symbolFull,
      instrumentId: s.instrumentId,
      name: s.name,
      curated: !!curated,
      sector: curated?.sector,
    };
    if (tk === q) exact.push(hit);
    else if (tk.startsWith(q)) tickerStarts.push(hit);
    else if (nm.startsWith(q)) nameStarts.push(hit);
    else if (nm.includes(q)) nameContains.push(hit);
    if (
      exact.length + tickerStarts.length + nameStarts.length + nameContains.length >=
      limit * 4
    ) break;
  }

  const sortByCurated = (a: SearchHit, b: SearchHit) =>
    a.curated === b.curated ? 0 : a.curated ? -1 : 1;

  return [
    ...exact.sort(sortByCurated),
    ...tickerStarts.sort(sortByCurated),
    ...nameStarts.sort(sortByCurated),
    ...nameContains.sort(sortByCurated),
  ].slice(0, limit);
}

export function resolveTicker(ticker: string): TickerEntry | null {
  const u = ticker.trim().toUpperCase();
  const curated = CURATED_BY_TICKER.get(u);
  if (curated) return curated;
  const universe = findInUniverse(u);
  if (!universe) return null;
  return {
    ticker: universe.ticker,
    symbolFull: universe.symbolFull,
    instrumentId: universe.instrumentId,
    name: universe.name,
    sector: "Tech",
    country: "US",
  };
}

export function isCurated(ticker: string): boolean {
  return CURATED_BY_TICKER.has(ticker.trim().toUpperCase());
}
