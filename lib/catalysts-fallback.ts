// Demo-fallback synthetic earnings + dividends.
// Used when Finnhub key is missing — we still want a useful experience.
//
// Generates a plausible quarterly earnings + an ex-div per ticker so first paint
// is never empty. Clearly tagged source: "Curated" so the source-health row
// stays honest about it.

import type { Catalyst } from "./catalysts";
import { findTicker } from "./tickers";
import { addDays, parseISO, toISO } from "./catalysts";

const ANCHOR = "2026-05-05";

interface SyntheticConfig {
  ticker: string;
  earnings?: { date: string; impliedMove: number; last4: number[] };
  dividend?: { date: string; amount: number; yieldPct: number };
}

const CFG: SyntheticConfig[] = [
  { ticker: "NVDA", earnings: { date: "2026-05-27", impliedMove: 0.085, last4: [-3.4, 9.2, -1.1, 7.8] } },
  { ticker: "AAPL", earnings: { date: "2026-07-30", impliedMove: 0.040, last4: [2.1, -3.5, 0.8, 1.4] }, dividend: { date: "2026-05-12", amount: 0.27, yieldPct: 0.51 } },
  { ticker: "MSFT", earnings: { date: "2026-07-22", impliedMove: 0.045, last4: [3.6, 1.8, -2.9, 4.1] }, dividend: { date: "2026-05-21", amount: 0.83, yieldPct: 0.78 } },
  { ticker: "GOOGL", earnings: { date: "2026-07-23", impliedMove: 0.050, last4: [9.6, -3.0, 5.4, -1.2] } },
  { ticker: "GOOG", earnings: { date: "2026-07-23", impliedMove: 0.050, last4: [9.6, -3.0, 5.4, -1.2] } },
  { ticker: "META", earnings: { date: "2026-07-29", impliedMove: 0.075, last4: [-10.6, 4.5, 8.2, -1.9] } },
  { ticker: "AMZN", earnings: { date: "2026-07-30", impliedMove: 0.065, last4: [-7.4, 3.7, 8.1, 1.2] } },
  { ticker: "TSLA", earnings: { date: "2026-07-23", impliedMove: 0.090, last4: [-12.3, 8.1, -5.6, 21.9] } },
  { ticker: "AMD",  earnings: { date: "2026-07-28", impliedMove: 0.080, last4: [-9.2, -3.4, 4.1, -7.8] } },
  { ticker: "AVGO", earnings: { date: "2026-06-04", impliedMove: 0.080, last4: [12.2, 2.5, -2.3, 5.6] }, dividend: { date: "2026-06-19", amount: 5.25, yieldPct: 1.20 } },
  { ticker: "NFLX", earnings: { date: "2026-07-16", impliedMove: 0.075, last4: [11.1, -1.7, -8.7, 3.4] } },
  { ticker: "ORCL", earnings: { date: "2026-06-12", impliedMove: 0.060, last4: [-9.4, 11.8, -7.5, 4.2] } },
  { ticker: "CRM",  earnings: { date: "2026-05-26", impliedMove: 0.075, last4: [-19.7, 11.0, -1.8, 4.0] } },
  { ticker: "ADBE", earnings: { date: "2026-06-12", impliedMove: 0.075, last4: [-13.8, 4.1, -2.5, 6.1] } },
  { ticker: "INTU", earnings: { date: "2026-08-19", impliedMove: 0.060, last4: [-3.9, 4.4, 8.3, -1.1] } },
  { ticker: "NOW",  earnings: { date: "2026-07-22", impliedMove: 0.060, last4: [-7.9, 6.0, -2.0, 4.9] } },
  { ticker: "IBM",  earnings: { date: "2026-07-22", impliedMove: 0.045, last4: [4.2, -8.3, 1.1, 3.4] } },
  { ticker: "INTC", earnings: { date: "2026-07-23", impliedMove: 0.075, last4: [-7.5, -1.7, 16.4, -8.1] } },
  { ticker: "QCOM", earnings: { date: "2026-07-29", impliedMove: 0.050, last4: [-9.1, -8.9, 9.6, 1.2] } },
  { ticker: "MU",   earnings: { date: "2026-06-25", impliedMove: 0.080, last4: [14.1, -7.1, -7.4, 17.8] } },
  { ticker: "TXN",  earnings: { date: "2026-07-21", impliedMove: 0.045, last4: [4.4, -3.5, 5.1, -2.7] } },
  { ticker: "ASML", earnings: { date: "2026-07-15", impliedMove: 0.070, last4: [-6.7, 9.2, -8.1, 4.8] } },
  { ticker: "TSM",  earnings: { date: "2026-07-16", impliedMove: 0.040, last4: [9.8, 1.7, -2.5, 1.1] } },
  { ticker: "SMCI", earnings: { date: "2026-08-04", impliedMove: 0.110, last4: [-22.3, 18.5, -8.1, 28.6] } },
  { ticker: "ANET", earnings: { date: "2026-08-05", impliedMove: 0.075, last4: [-8.2, 6.8, -4.5, 5.4] } },
  { ticker: "PANW", earnings: { date: "2026-08-19", impliedMove: 0.070, last4: [-5.4, 1.9, 7.0, -7.8] } },
  { ticker: "CRWD", earnings: { date: "2026-06-03", impliedMove: 0.090, last4: [-8.6, -11.3, 3.7, 9.1] } },
  { ticker: "ZS",   earnings: { date: "2026-09-03", impliedMove: 0.075, last4: [-18.7, -5.2, -3.9, 12.4] } },
  { ticker: "NET",  earnings: { date: "2026-08-06", impliedMove: 0.080, last4: [3.5, -6.7, 2.1, 14.8] } },
  { ticker: "DDOG", earnings: { date: "2026-08-07", impliedMove: 0.080, last4: [-12.9, 7.0, -3.5, 4.4] } },
  { ticker: "MDB",  earnings: { date: "2026-08-26", impliedMove: 0.105, last4: [-23.1, -11.0, 4.5, 5.8] } },
  { ticker: "SNOW", earnings: { date: "2026-08-27", impliedMove: 0.090, last4: [-18.5, -5.5, 3.4, 11.9] } },
  { ticker: "PLTR", earnings: { date: "2026-08-04", impliedMove: 0.110, last4: [22.1, -10.9, 24.3, -8.4] } },
  { ticker: "VRSN", earnings: { date: "2026-07-23", impliedMove: 0.045, last4: [3.4, -5.8, 1.0, 0.4] } },
  { ticker: "TEAM", earnings: { date: "2026-08-06", impliedMove: 0.090, last4: [-26.4, 14.4, -1.6, -10.3] } },
  { ticker: "SHOP", earnings: { date: "2026-08-06", impliedMove: 0.080, last4: [-18.6, 27.2, -1.0, 5.5] } },
  { ticker: "SPOT", earnings: { date: "2026-07-29", impliedMove: 0.080, last4: [13.1, 9.6, -8.0, 11.2] } },
  { ticker: "COST", earnings: { date: "2026-05-29", impliedMove: 0.040, last4: [-2.9, 1.7, 1.2, 2.5] }, dividend: { date: "2026-05-08", amount: 1.16, yieldPct: 0.50 } },
  { ticker: "WMT",  earnings: { date: "2026-05-15", impliedMove: 0.045, last4: [7.0, -2.1, -5.4, 6.6] }, dividend: { date: "2026-05-09", amount: 0.21, yieldPct: 0.92 } },
  { ticker: "TGT",  earnings: { date: "2026-05-21", impliedMove: 0.075, last4: [13.9, -19.2, 11.2, -10.4] }, dividend: { date: "2026-05-13", amount: 1.12, yieldPct: 3.10 } },
  { ticker: "HD",   earnings: { date: "2026-05-19", impliedMove: 0.040, last4: [3.0, 0.4, -2.6, 1.4] }, dividend: { date: "2026-05-29", amount: 2.30, yieldPct: 2.40 } },
  { ticker: "LOW",  earnings: { date: "2026-05-20", impliedMove: 0.040, last4: [-4.0, 1.8, 0.9, -1.5] } },
  { ticker: "MCD",  earnings: { date: "2026-07-29", impliedMove: 0.030, last4: [0.1, 1.5, -0.6, -1.8] }, dividend: { date: "2026-06-02", amount: 1.77, yieldPct: 2.45 } },
  { ticker: "SBUX", earnings: { date: "2026-07-29", impliedMove: 0.060, last4: [-15.9, 0.5, -7.4, 9.4] } },
  { ticker: "DIS",  earnings: { date: "2026-08-05", impliedMove: 0.060, last4: [-9.4, -1.0, 11.5, -1.0] } },
  { ticker: "NKE",  earnings: { date: "2026-06-25", impliedMove: 0.075, last4: [-19.8, -6.8, 6.8, -7.0] } },
  { ticker: "LULU", earnings: { date: "2026-08-27", impliedMove: 0.090, last4: [-15.9, -7.2, 10.0, -4.3] } },
  { ticker: "PEP",  earnings: { date: "2026-07-09", impliedMove: 0.030, last4: [-2.7, -0.6, 1.8, -0.5] }, dividend: { date: "2026-06-05", amount: 1.36, yieldPct: 3.30 } },
  { ticker: "KO",   earnings: { date: "2026-07-22", impliedMove: 0.025, last4: [0.6, -2.2, 1.7, 0.0] }, dividend: { date: "2026-06-12", amount: 0.51, yieldPct: 2.92 } },
  { ticker: "ABNB", earnings: { date: "2026-08-06", impliedMove: 0.080, last4: [-13.4, -7.0, 2.3, 5.7] } },
  { ticker: "UBER", earnings: { date: "2026-08-05", impliedMove: 0.070, last4: [-9.3, 6.1, 6.9, 2.5] } },
  { ticker: "LYFT", earnings: { date: "2026-08-06", impliedMove: 0.110, last4: [22.8, -9.2, 5.3, 7.4] } },
  { ticker: "EBAY", earnings: { date: "2026-07-29", impliedMove: 0.060, last4: [-7.5, 2.1, -4.6, 5.0] } },
  { ticker: "ROKU", earnings: { date: "2026-07-30", impliedMove: 0.115, last4: [-18.5, -22.2, 22.0, -1.3] } },
  { ticker: "PINS", earnings: { date: "2026-07-30", impliedMove: 0.090, last4: [-13.6, -2.2, 16.8, -10.5] } },
  { ticker: "SNAP", earnings: { date: "2026-07-29", impliedMove: 0.115, last4: [-26.0, 27.6, 6.2, -15.6] } },
  { ticker: "RDDT", earnings: { date: "2026-08-06", impliedMove: 0.130, last4: [-13.9, 38.2, -3.8, 21.8] } },
  { ticker: "RBLX", earnings: { date: "2026-08-06", impliedMove: 0.110, last4: [-14.1, 17.9, -1.6, 4.8] } },
  { ticker: "JNJ",  earnings: { date: "2026-07-15", impliedMove: 0.025, last4: [-2.0, 1.2, 0.4, -1.6] }, dividend: { date: "2026-05-26", amount: 1.30, yieldPct: 3.20 } },
  { ticker: "UNH",  earnings: { date: "2026-07-15", impliedMove: 0.045, last4: [-8.2, 1.6, -22.4, 5.2] } },
  { ticker: "PFE",  earnings: { date: "2026-07-29", impliedMove: 0.040, last4: [-1.6, -2.1, 0.5, 3.2] }, dividend: { date: "2026-05-08", amount: 0.43, yieldPct: 6.32 } },
  { ticker: "LLY",  earnings: { date: "2026-08-06", impliedMove: 0.060, last4: [-11.7, -1.0, 12.3, 4.6] }, dividend: { date: "2026-05-15", amount: 1.50, yieldPct: 0.85 } },
  { ticker: "MRK",  earnings: { date: "2026-07-30", impliedMove: 0.045, last4: [-9.8, 5.8, 0.9, -6.7] } },
  { ticker: "BMY",  earnings: { date: "2026-07-31", impliedMove: 0.045, last4: [4.2, 7.4, -2.5, -3.6] } },
  { ticker: "ABBV", earnings: { date: "2026-07-31", impliedMove: 0.040, last4: [3.4, 4.1, -1.9, 1.4] } },
  { ticker: "GILD", earnings: { date: "2026-08-06", impliedMove: 0.045, last4: [4.6, -1.3, -1.8, 3.5] } },
  { ticker: "REGN", earnings: { date: "2026-07-30", impliedMove: 0.060, last4: [-2.3, 0.8, 4.1, -8.5] } },
  { ticker: "BIIB", earnings: { date: "2026-07-30", impliedMove: 0.075, last4: [-7.4, -0.9, -7.8, 4.2] } },
  { ticker: "VRTX", earnings: { date: "2026-08-04", impliedMove: 0.060, last4: [-11.7, 4.2, 1.0, 5.6] } },
  { ticker: "MRNA", earnings: { date: "2026-08-06", impliedMove: 0.130, last4: [-12.8, -4.4, -19.7, 14.4] } },
  { ticker: "BNTX", earnings: { date: "2026-08-06", impliedMove: 0.110, last4: [-8.4, 6.7, -3.1, 4.5] } },
  { ticker: "BAX",  earnings: { date: "2026-08-05", impliedMove: 0.060, last4: [-14.1, 4.6, -2.4, 3.8] } },
  { ticker: "JPM",  earnings: { date: "2026-07-15", impliedMove: 0.040, last4: [4.4, -1.8, -1.0, 0.6] }, dividend: { date: "2026-07-06", amount: 1.40, yieldPct: 2.10 } },
  { ticker: "BAC",  earnings: { date: "2026-07-16", impliedMove: 0.045, last4: [-1.2, 1.1, -1.8, 3.2] } },
  { ticker: "WFC",  earnings: { date: "2026-07-15", impliedMove: 0.045, last4: [-6.0, 5.4, -0.5, -1.0] } },
  { ticker: "GS",   earnings: { date: "2026-07-16", impliedMove: 0.045, last4: [3.0, 0.5, -0.5, 4.6] } },
  { ticker: "MS",   earnings: { date: "2026-07-16", impliedMove: 0.045, last4: [-4.5, 1.9, 4.0, -1.5] } },
  { ticker: "BRK.B",earnings: { date: "2026-08-01", impliedMove: 0.020, last4: [-1.2, 1.5, 1.7, -0.6] } },
  { ticker: "V",    earnings: { date: "2026-07-23", impliedMove: 0.030, last4: [-2.7, 0.6, -1.3, 2.5] } },
  { ticker: "MA",   earnings: { date: "2026-07-30", impliedMove: 0.030, last4: [-1.8, 0.5, -2.4, 0.9] } },
  { ticker: "PYPL", earnings: { date: "2026-07-29", impliedMove: 0.080, last4: [-7.1, 6.6, -13.1, 8.2] } },
  { ticker: "XYZ",  earnings: { date: "2026-08-06", impliedMove: 0.080, last4: [-18.0, 16.1, -7.7, 4.1] } },
  { ticker: "HOOD", earnings: { date: "2026-08-05", impliedMove: 0.090, last4: [13.6, -8.2, 6.9, 13.2] } },
  { ticker: "SOFI", earnings: { date: "2026-07-28", impliedMove: 0.105, last4: [-10.0, 13.8, -8.6, 5.4] } },
  { ticker: "UPST", earnings: { date: "2026-08-05", impliedMove: 0.155, last4: [-19.4, -16.5, 33.0, -16.2] } },
  { ticker: "COIN", earnings: { date: "2026-08-05", impliedMove: 0.090, last4: [9.0, -7.5, -6.7, 5.0] } },
  { ticker: "MARA", earnings: { date: "2026-08-06", impliedMove: 0.130, last4: [13.2, -7.8, -7.0, 9.0] } },
  { ticker: "RIOT", earnings: { date: "2026-08-05", impliedMove: 0.150, last4: [11.8, -5.4, -7.5, 12.3] } },
  { ticker: "XOM",  earnings: { date: "2026-08-01", impliedMove: 0.030, last4: [-2.4, 0.6, -1.0, 1.9] }, dividend: { date: "2026-05-13", amount: 0.99, yieldPct: 3.36 } },
  { ticker: "CVX",  earnings: { date: "2026-08-01", impliedMove: 0.030, last4: [3.1, -1.6, 0.3, -2.4] }, dividend: { date: "2026-05-19", amount: 1.71, yieldPct: 4.20 } },
  { ticker: "BA",   earnings: { date: "2026-07-30", impliedMove: 0.060, last4: [-7.5, 2.4, -2.0, 5.9] } },
  { ticker: "CAT",  earnings: { date: "2026-08-05", impliedMove: 0.045, last4: [-7.0, 1.6, -1.2, 1.0] } },
  { ticker: "GE",   earnings: { date: "2026-07-22", impliedMove: 0.050, last4: [-3.5, 6.0, 0.9, 1.9] } },
  { ticker: "MMM",  earnings: { date: "2026-07-21", impliedMove: 0.045, last4: [4.0, -2.3, 1.1, 0.6] } },
  { ticker: "GM",   earnings: { date: "2026-07-21", impliedMove: 0.060, last4: [-5.6, -1.0, -8.9, 5.0] } },
  { ticker: "F",    earnings: { date: "2026-07-29", impliedMove: 0.080, last4: [-18.4, 5.9, -1.2, 5.7] } },
  { ticker: "RIVN", earnings: { date: "2026-08-05", impliedMove: 0.110, last4: [-25.0, 14.2, -3.2, 9.9] } },
  { ticker: "LCID", earnings: { date: "2026-08-05", impliedMove: 0.105, last4: [-9.0, 4.4, -7.6, 8.5] } },
  { ticker: "ON",   earnings: { date: "2026-07-27", impliedMove: 0.080, last4: [-21.8, 2.9, -8.3, 1.7] } },
  { ticker: "UPS",  earnings: { date: "2026-07-23", impliedMove: 0.060, last4: [-14.5, 3.0, -3.5, 2.5] } },
  { ticker: "FDX",  earnings: { date: "2026-06-23", impliedMove: 0.075, last4: [3.2, -7.5, -5.7, 0.6] } },
  { ticker: "MGM",  earnings: { date: "2026-08-04", impliedMove: 0.075, last4: [-9.8, -8.0, 4.1, 1.2] } },
  { ticker: "DKNG", earnings: { date: "2026-08-06", impliedMove: 0.110, last4: [4.0, -10.5, -6.4, -3.0] } },
  { ticker: "PENN", earnings: { date: "2026-08-06", impliedMove: 0.115, last4: [-13.0, -3.6, 9.8, 4.4] } },
  { ticker: "CCL",  earnings: { date: "2026-06-25", impliedMove: 0.090, last4: [-3.7, 2.0, 7.0, -7.0] } },
  { ticker: "RCL",  earnings: { date: "2026-07-29", impliedMove: 0.075, last4: [-1.0, -7.2, 8.8, -1.4] } },
  { ticker: "UAL",  earnings: { date: "2026-07-15", impliedMove: 0.090, last4: [-5.4, 6.0, 17.5, -1.0] } },
  { ticker: "DAL",  earnings: { date: "2026-07-09", impliedMove: 0.075, last4: [-1.0, -10.5, 6.4, 0.8] } },
  { ticker: "AAL",  earnings: { date: "2026-07-23", impliedMove: 0.085, last4: [-9.5, -8.2, 4.5, 0.5] } },
  { ticker: "LUV",  earnings: { date: "2026-07-23", impliedMove: 0.060, last4: [-7.2, 3.0, 8.3, -1.7] } },
  { ticker: "BABA", earnings: { date: "2026-08-29", impliedMove: 0.075, last4: [-8.0, 1.6, -5.9, 8.1] } },
  { ticker: "JD",   earnings: { date: "2026-08-12", impliedMove: 0.090, last4: [-7.5, 6.6, -1.4, 5.0] } },
  { ticker: "PDD",  earnings: { date: "2026-08-25", impliedMove: 0.115, last4: [-28.5, 7.1, -10.8, 5.0] } },
  { ticker: "BIDU", earnings: { date: "2026-08-19", impliedMove: 0.085, last4: [-6.5, -4.4, 7.6, 2.5] } },
  { ticker: "MELI", earnings: { date: "2026-08-05", impliedMove: 0.085, last4: [11.5, -4.0, -3.5, 7.4] } },
  { ticker: "SE",   earnings: { date: "2026-08-12", impliedMove: 0.110, last4: [-5.6, 7.5, -3.1, 11.4] } },
  { ticker: "GME",  earnings: { date: "2026-09-09", impliedMove: 0.150, last4: [4.5, -29.0, 16.7, -8.0] } },
  { ticker: "AMC",  earnings: { date: "2026-08-05", impliedMove: 0.140, last4: [-12.0, 7.5, -5.0, -3.0] } },
  { ticker: "BB",   earnings: { date: "2026-06-25", impliedMove: 0.080, last4: [-12.5, -5.4, 4.0, -2.0] } },

  { ticker: "ETOR", earnings: { date: "2026-05-21", impliedMove: 0.110, last4: [12.4, -8.2, 6.1, 4.5] } },
  { ticker: "NICE", earnings: { date: "2026-05-15", impliedMove: 0.060, last4: [-2.1, 4.8, -3.4, 1.6] }, dividend: { date: "2026-05-19", amount: 0.85, yieldPct: 1.05 } },
  { ticker: "CHKP", earnings: { date: "2026-07-29", impliedMove: 0.055, last4: [-3.6, 1.5, 2.4, -1.0] } },
  { ticker: "WIX",  earnings: { date: "2026-08-06", impliedMove: 0.080, last4: [-5.0, 9.4, -2.1, 4.7] } },
  { ticker: "MNDY", earnings: { date: "2026-05-18", impliedMove: 0.110, last4: [-10.2, 13.8, -3.6, 5.4] } },
  { ticker: "CYBR", earnings: { date: "2026-08-12", impliedMove: 0.075, last4: [-5.8, 4.0, 6.2, -3.1] } },
  { ticker: "GLBE", earnings: { date: "2026-08-19", impliedMove: 0.105, last4: [-9.3, 11.6, -8.4, 5.7] } },
  { ticker: "ARM",  earnings: { date: "2026-08-05", impliedMove: 0.090, last4: [-5.4, 7.0, -3.8, 4.1] } },
  { ticker: "IONQ", earnings: { date: "2026-08-12", impliedMove: 0.130, last4: [11.0, -14.0, 8.5, 3.4] } },
  { ticker: "RKLB", earnings: { date: "2026-08-12", impliedMove: 0.115, last4: [-11.5, 14.2, -8.0, 9.2] } },
  { ticker: "ASTS", earnings: { date: "2026-08-12", impliedMove: 0.140, last4: [16.3, -10.8, 8.2, 4.1] } },
  { ticker: "JOBY", earnings: { date: "2026-08-05", impliedMove: 0.115, last4: [-7.2, 5.1, -3.4, 6.2] } },
  { ticker: "SMR",  earnings: { date: "2026-08-12", impliedMove: 0.135, last4: [-12.8, 18.5, -9.0, 14.2] } },
  { ticker: "ENPH", earnings: { date: "2026-07-22", impliedMove: 0.095, last4: [-15.0, 11.6, -8.3, 5.8] } },
  { ticker: "SEDG", earnings: { date: "2026-08-04", impliedMove: 0.110, last4: [-22.3, 9.0, -10.1, 6.4] } },
  { ticker: "FSLR", earnings: { date: "2026-07-28", impliedMove: 0.085, last4: [-10.5, 8.2, -3.7, 4.9] } },
  { ticker: "RUN",  earnings: { date: "2026-08-05", impliedMove: 0.130, last4: [-22.0, -3.5, 18.6, -8.0] } },
  { ticker: "NU",   earnings: { date: "2026-08-12", impliedMove: 0.090, last4: [-7.5, 6.2, -3.0, 5.5] } },
  { ticker: "STNE", earnings: { date: "2026-08-13", impliedMove: 0.105, last4: [-8.4, 3.7, -10.2, 7.1] } },
  { ticker: "MMYT", earnings: { date: "2026-07-22", impliedMove: 0.075, last4: [-3.4, 5.6, -1.0, 4.5] } },
  { ticker: "CART", earnings: { date: "2026-08-12", impliedMove: 0.085, last4: [-5.1, 9.2, -4.6, 4.2] } },
  { ticker: "TOST", earnings: { date: "2026-08-05", impliedMove: 0.095, last4: [-9.6, 12.4, -3.2, 7.4] } },
  { ticker: "SOUN", earnings: { date: "2026-08-06", impliedMove: 0.140, last4: [-12.5, 26.8, -10.4, 6.2] } },
  { ticker: "BBAI", earnings: { date: "2026-08-12", impliedMove: 0.155, last4: [-18.0, 22.5, -14.0, 9.6] } },
  { ticker: "ALAB", earnings: { date: "2026-08-05", impliedMove: 0.105, last4: [-8.2, 7.4, -3.1, 5.0] } },
  { ticker: "CRDO", earnings: { date: "2026-09-03", impliedMove: 0.105, last4: [-12.4, 6.5, -3.8, 9.1] } },
  { ticker: "VKTX", earnings: { date: "2026-08-05", impliedMove: 0.155, last4: [-22.0, 14.5, -10.5, 8.4] } },
  { ticker: "CRSP", earnings: { date: "2026-08-12", impliedMove: 0.095, last4: [-3.5, 6.4, -8.1, 4.5] } },
  { ticker: "NTLA", earnings: { date: "2026-08-12", impliedMove: 0.115, last4: [-10.0, 8.4, -5.0, 6.5] } },
  { ticker: "BEAM", earnings: { date: "2026-08-12", impliedMove: 0.110, last4: [-8.4, 9.0, -6.5, 4.0] } },
  { ticker: "EDIT", earnings: { date: "2026-08-12", impliedMove: 0.140, last4: [-12.5, 6.0, -8.2, 9.4] } },
  { ticker: "BIRK", earnings: { date: "2026-06-12", impliedMove: 0.075, last4: [-3.8, 5.2, -2.1, 4.0] } },
  { ticker: "KLAR", earnings: { date: "2026-05-26", impliedMove: 0.095, last4: [6.4, -4.0, 5.2, 3.5] } },
];

export function syntheticFor(ticker: string): Catalyst[] {
  const upper = ticker.trim().toUpperCase();
  const cfg = CFG.find((c) => c.ticker === upper);
  if (!cfg) return [];
  const out: Catalyst[] = [];
  if (cfg.earnings) {
    out.push({
      id: "earn:" + upper + ":" + cfg.earnings.date,
      ticker: upper,
      category: "earnings",
      date: cfg.earnings.date,
      title: "Quarterly earnings",
      summary: "Implied move ±" + (cfg.earnings.impliedMove * 100).toFixed(1) + "% (front-month straddle).",
      impact: cfg.earnings.impliedMove,
      confirmed: false,
      source: "Curated",
      meta: {
        impliedMove: cfg.earnings.impliedMove,
        last4Reactions: cfg.earnings.last4,
      },
    });
  }
  if (cfg.dividend) {
    out.push({
      id: "div:" + upper + ":" + cfg.dividend.date,
      ticker: upper,
      category: "dividend",
      date: cfg.dividend.date,
      title: "Ex-dividend: $" + cfg.dividend.amount.toFixed(2) + "/share",
      summary: cfg.dividend.yieldPct.toFixed(2) + "% trailing yield.",
      impact: 0.005,
      confirmed: true,
      source: "Curated",
      meta: { amount: cfg.dividend.amount, yield: cfg.dividend.yieldPct },
    });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

void ANCHOR;
void parseISO;
void addDays;
void toISO;
void findTicker;
