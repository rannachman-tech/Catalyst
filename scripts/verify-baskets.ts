/* eslint-disable no-console */
// Verifies that every instrumentId we use across baskets resolves in the
// live eToro public catalog and that SymbolFull matches.
// No API keys needed.

import { TICKERS, HEDGE_ETFS } from "../lib/tickers";
import { allHoldings } from "../lib/baskets";

const CATALOG_URL =
  "https://api.etorostatic.com/sapi/instrumentsmetadata/V1.1/instruments";

interface CatalogEntry {
  InstrumentID: number;
  SymbolFull: string;
  InstrumentDisplayName: string;
  InstrumentTypeID: number;
}

async function main() {
  console.log("→ Fetching eToro public catalog…");
  const res = await fetch(CATALOG_URL);
  if (!res.ok) {
    console.error(`! HTTP ${res.status}`);
    process.exit(1);
  }
  const json = (await res.json()) as { InstrumentDisplayDatas: CatalogEntry[] };
  const catalog = new Map<number, CatalogEntry>(
    json.InstrumentDisplayDatas.map((it) => [it.InstrumentID, it])
  );
  console.log(`  ${catalog.size.toLocaleString()} instruments loaded`);

  let fail = 0;
  let ok = 0;

  // 1) all tickers
  for (const t of TICKERS) {
    const e = catalog.get(t.instrumentId);
    if (!e) {
      console.log(`✕ ${t.ticker} id=${t.instrumentId} — NOT FOUND`);
      fail++;
      continue;
    }
    if (e.SymbolFull.toUpperCase() !== t.symbolFull.toUpperCase()) {
      console.log(
        `✕ ${t.ticker} id=${t.instrumentId} — symbol drift catalog="${e.SymbolFull}" expected="${t.symbolFull}"`
      );
      fail++;
      continue;
    }
    ok++;
  }

  // 2) hedge ETFs
  for (const h of HEDGE_ETFS) {
    const e = catalog.get(h.instrumentId);
    if (!e) {
      console.log(`✕ HEDGE ${h.ticker} id=${h.instrumentId} — NOT FOUND`);
      fail++;
      continue;
    }
    if (e.SymbolFull.toUpperCase() !== h.symbolFull.toUpperCase()) {
      console.log(
        `✕ HEDGE ${h.ticker} id=${h.instrumentId} — symbol drift catalog="${e.SymbolFull}" expected="${h.symbolFull}"`
      );
      fail++;
      continue;
    }
    ok++;
  }

  // 3) every basket holding (covers complement table indirectly)
  const holdings = allHoldings(TICKERS);
  const seen = new Set<string>();
  for (const h of holdings) {
    const key = `${h.instrumentId}|${h.symbolFull}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const e = catalog.get(h.instrumentId);
    if (!e) {
      console.log(`✕ BASKET ${h.ticker} id=${h.instrumentId} — NOT FOUND`);
      fail++;
      continue;
    }
    if (e.SymbolFull.toUpperCase() !== h.symbolFull.toUpperCase()) {
      console.log(
        `✕ BASKET ${h.ticker} — symbol drift catalog="${e.SymbolFull}" expected="${h.symbolFull}"`
      );
      fail++;
      continue;
    }
  }

  console.log(`✓ ${ok} tickers + hedges verified`);
  console.log(`✓ ${seen.size} basket holdings verified`);
  if (fail > 0) {
    console.error(`✕ ${fail} failures`);
    process.exit(1);
  }
  console.log("All clear.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
