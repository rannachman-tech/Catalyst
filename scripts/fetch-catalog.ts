/* eslint-disable no-console */
// Pulls the eToro public catalog and writes /data/catalog.json with the
// stocks-only subset. No API keys required.

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const CATALOG_URL =
  "https://api.etorostatic.com/sapi/instrumentsmetadata/V1.1/instruments";

interface RawEntry {
  InstrumentID: number;
  SymbolFull: string;
  InstrumentDisplayName: string;
  InstrumentTypeID: number;
  ExchangeID?: number;
}

interface UniverseEntry {
  ticker: string;
  symbolFull: string;
  instrumentId: number;
  name: string;
  exchange: number;
}

async function main() {
  console.log("→ Fetching eToro public catalog…");
  const res = await fetch(CATALOG_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { InstrumentDisplayDatas: RawEntry[] };

  // Filter to stocks (InstrumentTypeID === 5)
  const stocks = json.InstrumentDisplayDatas.filter(
    (it) => it.InstrumentTypeID === 5
  );
  console.log(`  ${stocks.length.toLocaleString()} stocks selected`);

  // Build display ticker — strip ".US" suffix for cleaner picker UX, keep
  // symbolFull intact for trade execution.
  const universe: UniverseEntry[] = stocks.map((it) => ({
    ticker: stripSuffix(it.SymbolFull),
    symbolFull: it.SymbolFull,
    instrumentId: it.InstrumentID,
    name: it.InstrumentDisplayName,
    exchange: it.ExchangeID ?? 0,
  }));

  // Dedupe by ticker — for now, prefer the first listing seen
  // (catalog is roughly ordered most-popular-first; safe default)
  const seen = new Set<string>();
  const deduped: UniverseEntry[] = [];
  for (const u of universe) {
    const k = u.ticker.toUpperCase();
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(u);
  }
  console.log(`  ${deduped.length.toLocaleString()} unique tickers after dedupe`);

  const out = {
    asOf: new Date().toISOString(),
    count: deduped.length,
    stocks: deduped,
  };

  const outPath = join(process.cwd(), "data", "catalog.json");
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out));
  console.log(`✓ wrote ${outPath} (${(JSON.stringify(out).length / 1024).toFixed(0)} kB)`);
}

function stripSuffix(sym: string): string {
  // Bare US listings stay, "JD.US" becomes "JD", but ".L" / ".DE" / ".PA"
  // listings keep their suffix to avoid collisions with the bare US ticker.
  const u = sym.toUpperCase();
  if (u.endsWith(".US")) return u.slice(0, -3);
  return u;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
