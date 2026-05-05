// Trade baskets — stock-first, hedge as opt-in.
//
// Default action for any phase: 100% the underlying. We don't dilute the
// thesis with a sector "complement" — if the user came to buy COIN, sell
// them COIN, not COIN+MARA.
//
// When the user opts in to a hedge overlay (typically prompted on Heavy
// phases), the basket becomes 50% underlying + 50% defensive sleeve
// (volatility, treasuries, sector defensive). That's a coherent overlay
// strategy used by event-driven traders.

import type { Phase } from "./catalysts";
import type { TickerEntry } from "./tickers";
import { HEDGE_ETFS, TICKERS } from "./tickers";

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
  hedge: boolean;          // true = with overlay, false = direct
  title: string;
  thesis: string;
  holdings: BasketHolding[];
}

// ---- Direct basket: 100% underlying ----
export function directBasket(ticker: TickerEntry, phase: Phase): Basket {
  return {
    ticker: ticker.ticker,
    phase,
    hedge: false,
    title: `Buy ${ticker.ticker}`,
    thesis: `Direct exposure to ${ticker.name}.`,
    holdings: [
      {
        ticker: ticker.ticker,
        symbolFull: ticker.symbolFull,
        instrumentId: ticker.instrumentId,
        name: ticker.name,
        weight: 100,
        shortRationale: "Direct buy.",
        longRationale: `100% of the order goes to ${ticker.name}.`,
      },
    ],
  };
}

// ---- Hedge overlay: 50% underlying + 50% defensive sleeve ----
export function hedgeBasket(ticker: TickerEntry, phase: Phase): Basket {
  const [vxx, tlt, sect] = hedgeETFs(ticker.sector);
  return {
    ticker: ticker.ticker,
    phase,
    hedge: true,
    title: `${ticker.ticker} with defensive overlay`,
    thesis: `Half-sized core in ${ticker.name} paired with volatility, treasuries, and a defensive sector sleeve. Designed for weeks where one rough catalyst could dominate the book.`,
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

// Public dispatcher — kept for backwards compat with the simulator.
export function basketFor(ticker: TickerEntry, phase: Phase, withHedge = false): Basket {
  if (withHedge) return hedgeBasket(ticker, phase);
  return directBasket(ticker, phase);
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
  else if (sector === "Energy" || sector === "Materials" || sector === "Industrials") sectorHedge = utilities;
  else if (sector === "Financials") sectorHedge = sh;
  else if (sector === "Crypto-Adj") sectorHedge = gold;

  return [vxx, tlt, sectorHedge];
}

export function allocate(b: Basket, amount: number) {
  return b.holdings.map((h) => ({
    ...h,
    dollars: Math.round((h.weight / 100) * amount * 100) / 100,
  }));
}

// Used by verify-baskets — emits both direct and hedge variants for every ticker.
export function allHoldings(tickers: TickerEntry[]): BasketHolding[] {
  const out: BasketHolding[] = [];
  for (const t of tickers) {
    out.push(...directBasket(t, "quiet").holdings);
    out.push(...hedgeBasket(t, "heavy").holdings);
  }
  return out;
}

void TICKERS;
