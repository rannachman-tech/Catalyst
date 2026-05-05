// Trade baskets for the "Trade-on-eToro" CTA.
//
// Two basket templates — built dynamically per ticker:
//   - QUIET / MODERATE → "Accumulate" basket: 80% the ticker itself + 20% complement
//   - HEAVY            → "Defensive overlay" basket: 50% ticker + 50% hedge mix
//
// All instrumentIds are pre-resolved from the eToro public catalog
// (see lib/tickers.ts and HEDGE_ETFS).

import type { Phase } from "./catalysts";
import type { TickerEntry } from "./tickers";
import { HEDGE_ETFS } from "./tickers";

export interface BasketHolding {
  ticker: string;
  symbolFull: string;
  instrumentId: number;
  name: string;
  weight: number;
  shortRationale: string;
  longRationale: string;
}

export interface Basket {
  ticker: string;
  phase: Phase;
  title: string;
  thesis: string;
  holdings: BasketHolding[];
}

function hedgeETFs(sector: TickerEntry["sector"]): typeof HEDGE_ETFS {
  const vxx = HEDGE_ETFS.find((h) => h.role === "vol")!;
  const tlt = HEDGE_ETFS.find((h) => h.role === "treasury")!;
  const sh = HEDGE_ETFS.find((h) => h.role === "shortMarket")!;
  const gold = HEDGE_ETFS.find((h) => h.role === "gold")!;
  const staples = HEDGE_ETFS.find((h) => h.role === "staples")!;
  const utilities = HEDGE_ETFS.find((h) => h.role === "utilities")!;
  const healthcare = HEDGE_ETFS.find((h) => h.role === "healthcare")!;

  let sectorHedge = staples;
  if (sector === "Healthcare") sectorHedge = healthcare;
  else if (sector === "Energy" || sector === "Materials" || sector === "Industrials")
    sectorHedge = utilities;
  else if (sector === "Financials") sectorHedge = sh;
  else if (sector === "Crypto-Adj") sectorHedge = gold;

  return [vxx, tlt, sectorHedge];
}

export function basketFor(ticker: TickerEntry, phase: Phase): Basket {
  if (phase === "heavy") {
    const [vxx, tlt, sect] = hedgeETFs(ticker.sector);
    return {
      ticker: ticker.ticker,
      phase,
      title: `Defensive overlay around ${ticker.ticker}`,
      thesis: `${ticker.ticker} has heavy event risk in the next 30 days. This basket keeps a smaller core position (50%) and pairs it with volatility, treasury, and a defensive sleeve so a rough catalyst doesn't dominate the book.`,
      holdings: [
        {
          ticker: ticker.ticker,
          symbolFull: ticker.symbolFull,
          instrumentId: ticker.instrumentId,
          name: ticker.name,
          weight: 50,
          shortRationale: "Smaller core through the event window.",
          longRationale: `Keeps directional exposure to ${ticker.name} but at half size while the catalyst window is heaviest.`,
        },
        {
          ticker: vxx.ticker, symbolFull: vxx.symbolFull, instrumentId: vxx.instrumentId, name: vxx.name,
          weight: 15,
          shortRationale: "Vol spike hedge.",
          longRationale: "VIX-future ETN that gains when realised vol rises around catalyst dates.",
        },
        {
          ticker: tlt.ticker, symbolFull: tlt.symbolFull, instrumentId: tlt.instrumentId, name: tlt.name,
          weight: 15,
          shortRationale: "Risk-off bid.",
          longRationale: "Long-duration Treasuries — flight-to-quality bid when equity vol pops.",
        },
        {
          ticker: sect.ticker, symbolFull: sect.symbolFull, instrumentId: sect.instrumentId, name: sect.name,
          weight: 20,
          shortRationale: "Defensive sector sleeve.",
          longRationale: "Lower-beta sleeve that historically holds better than broad equity during single-name event vol.",
        },
      ],
    };
  }

  const complement = pickComplement(ticker);
  return {
    ticker: ticker.ticker,
    phase,
    title:
      phase === "quiet"
        ? `Accumulate ${ticker.ticker}`
        : `Hold ${ticker.ticker} with light complement`,
    thesis:
      phase === "quiet"
        ? `${ticker.ticker} is in a quiet stretch — low event risk over the next 30 days. Bias is to add or hold.`
        : `${ticker.ticker} has a moderate calendar. Keep core exposure, trim leverage close to dates.`,
    holdings: [
      {
        ticker: ticker.ticker,
        symbolFull: ticker.symbolFull,
        instrumentId: ticker.instrumentId,
        name: ticker.name,
        weight: phase === "quiet" ? 80 : 70,
        shortRationale: phase === "quiet" ? "Add to core." : "Keep core.",
        longRationale: `The 30-day calendar for ${ticker.name} is ${
          phase === "quiet" ? "clear" : "manageable"
        }. The bulk of the basket sits in the underlying.`,
      },
      {
        ticker: complement.ticker,
        symbolFull: complement.symbolFull,
        instrumentId: complement.instrumentId,
        name: complement.name,
        weight: phase === "quiet" ? 20 : 30,
        shortRationale: "Sector complement.",
        longRationale: `Liquid same-sector name to spread idiosyncratic risk while keeping the thesis intact.`,
      },
    ],
  };
}

function pickComplement(t: TickerEntry): TickerEntry {
  const PRIMARY: Record<TickerEntry["sector"], TickerEntry> = {
    Tech: { ticker: "MSFT", symbolFull: "MSFT", instrumentId: 1004, name: "Microsoft", sector: "Tech", country: "US" },
    Semis: { ticker: "AVGO", symbolFull: "AVGO", instrumentId: 4236, name: "Broadcom", sector: "Semis", country: "US" },
    Comm: { ticker: "GOOG", symbolFull: "GOOG", instrumentId: 1002, name: "Alphabet C", sector: "Comm", country: "US" },
    "Consumer-Disc": { ticker: "AMZN", symbolFull: "AMZN", instrumentId: 1005, name: "Amazon.com", sector: "Consumer-Disc", country: "US" },
    "Consumer-Staples": { ticker: "COST", symbolFull: "COST", instrumentId: 1461, name: "Costco", sector: "Consumer-Staples", country: "US" },
    Healthcare: { ticker: "JNJ", symbolFull: "JNJ", instrumentId: 1022, name: "Johnson & Johnson", sector: "Healthcare", country: "US" },
    Financials: { ticker: "JPM", symbolFull: "JPM", instrumentId: 1023, name: "JPMorgan Chase", sector: "Financials", country: "US" },
    Energy: { ticker: "XOM", symbolFull: "XOM", instrumentId: 1036, name: "Exxon-Mobil", sector: "Energy", country: "US" },
    Industrials: { ticker: "CAT", symbolFull: "CAT", instrumentId: 1012, name: "Caterpillar", sector: "Industrials", country: "US" },
    Materials: { ticker: "CAT", symbolFull: "CAT", instrumentId: 1012, name: "Caterpillar", sector: "Industrials", country: "US" },
    Utilities: { ticker: "XLU", symbolFull: "XLU", instrumentId: 3013, name: "Utilities Select Sector SPDR", sector: "Utilities", country: "US" },
    "Real-Estate": { ticker: "XLU", symbolFull: "XLU", instrumentId: 3013, name: "Utilities Select Sector SPDR", sector: "Utilities", country: "US" },
    "Crypto-Adj": { ticker: "COIN", symbolFull: "COIN", instrumentId: 6168, name: "Coinbase", sector: "Crypto-Adj", country: "US" },
  };
  const FALLBACK: Record<TickerEntry["sector"], TickerEntry> = {
    Tech: { ticker: "GOOG", symbolFull: "GOOG", instrumentId: 1002, name: "Alphabet C", sector: "Comm", country: "US" },
    Semis: { ticker: "TSM", symbolFull: "TSM", instrumentId: 4481, name: "Taiwan Semiconductor", sector: "Semis", country: "TW" },
    Comm: { ticker: "META", symbolFull: "META", instrumentId: 1003, name: "Meta Platforms", sector: "Comm", country: "US" },
    "Consumer-Disc": { ticker: "MCD", symbolFull: "MCD", instrumentId: 1025, name: "McDonald's", sector: "Consumer-Disc", country: "US" },
    "Consumer-Staples": { ticker: "WMT", symbolFull: "WMT", instrumentId: 1035, name: "Walmart", sector: "Consumer-Staples", country: "US" },
    Healthcare: { ticker: "UNH", symbolFull: "UNH", instrumentId: 1032, name: "UnitedHealth", sector: "Healthcare", country: "US" },
    Financials: { ticker: "BAC", symbolFull: "BAC", instrumentId: 1011, name: "Bank of America", sector: "Financials", country: "US" },
    Energy: { ticker: "CVX", symbolFull: "CVX.US", instrumentId: 1014, name: "Chevron", sector: "Energy", country: "US" },
    Industrials: { ticker: "GE", symbolFull: "GE", instrumentId: 1017, name: "General Electric", sector: "Industrials", country: "US" },
    Materials: { ticker: "GE", symbolFull: "GE", instrumentId: 1017, name: "General Electric", sector: "Industrials", country: "US" },
    Utilities: { ticker: "XLP", symbolFull: "XLP", instrumentId: 3022, name: "Consumer Staples Select Sector SPDR", sector: "Consumer-Staples", country: "US" },
    "Real-Estate": { ticker: "XLP", symbolFull: "XLP", instrumentId: 3022, name: "Consumer Staples Select Sector SPDR", sector: "Consumer-Staples", country: "US" },
    "Crypto-Adj": { ticker: "MARA", symbolFull: "MARA", instrumentId: 6244, name: "Marathon Digital", sector: "Crypto-Adj", country: "US" },
  };
  const primary = PRIMARY[t.sector];
  if (primary.instrumentId !== t.instrumentId) return primary;
  return FALLBACK[t.sector];
}

export function allocate(b: Basket, amount: number) {
  return b.holdings.map((h) => ({
    ...h,
    dollars: Math.round((h.weight / 100) * amount * 100) / 100,
  }));
}

export function allHoldings(tickers: TickerEntry[]): BasketHolding[] {
  const out: BasketHolding[] = [];
  for (const t of tickers) {
    for (const phase of ["quiet", "moderate", "heavy"] as Phase[]) {
      const b = basketFor(t, phase);
      out.push(...b.holdings);
    }
  }
  return out;
}
