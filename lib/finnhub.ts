// Server-side Finnhub fetcher.
// Free tier endpoints used:
//   - /calendar/earnings?from=...&to=...&symbol=...
//   - /stock/dividend?symbol=...&from=...&to=...
//
// API key is read from FINNHUB_API_KEY at runtime. If missing, return [].
// All calls cached for 6h via Next route revalidate.

import type { Catalyst } from "./catalysts";

const FINNHUB_BASE = "https://finnhub.io/api/v1";

interface FinnhubEarnings {
  date: string;
  epsActual: number | null;
  epsEstimate: number | null;
  hour: "bmo" | "amc" | "" | null;
  quarter: number;
  revenueActual: number | null;
  revenueEstimate: number | null;
  symbol: string;
  year: number;
}

interface FinnhubDividend {
  symbol: string;
  date: string;        // ex-dividend date
  amount: number;
  payDate?: string;
  recordDate?: string;
  declareDate?: string;
  currency?: string;
}

function key() {
  return process.env.FINNHUB_API_KEY ?? "";
}

export async function fetchEarnings(
  ticker: string,
  fromISO: string,
  toISO: string
): Promise<Catalyst[]> {
  const k = key();
  if (!k) return [];
  const url = `${FINNHUB_BASE}/calendar/earnings?from=${fromISO}&to=${toISO}&symbol=${encodeURIComponent(
    ticker
  )}&token=${k}`;
  try {
    const res = await fetch(url, { next: { revalidate: 21600 } });
    if (!res.ok) return [];
    const json = (await res.json()) as { earningsCalendar?: FinnhubEarnings[] };
    return (json.earningsCalendar ?? []).map((e) => ({
      id: `earn:${e.symbol}:${e.date}`,
      ticker: e.symbol.toUpperCase(),
      category: "earnings" as const,
      date: e.date,
      title: `Q${e.quarter} ${e.year} Earnings`,
      summary:
        e.hour === "bmo"
          ? "Before market open"
          : e.hour === "amc"
          ? "After market close"
          : "Time TBC",
      impact: 0.08, // baseline 8% — overridden per ticker via curated meta if available
      confirmed: true,
      source: "Finnhub" as const,
      meta: {
        last4Reactions: [], // populated by historical hook later
      },
    }));
  } catch {
    return [];
  }
}

export async function fetchDividends(
  ticker: string,
  fromISO: string,
  toISO: string
): Promise<Catalyst[]> {
  const k = key();
  if (!k) return [];
  const url = `${FINNHUB_BASE}/stock/dividend?symbol=${encodeURIComponent(
    ticker
  )}&from=${fromISO}&to=${toISO}&token=${k}`;
  try {
    const res = await fetch(url, { next: { revalidate: 21600 } });
    if (!res.ok) return [];
    const json = (await res.json()) as FinnhubDividend[];
    return (json ?? []).map((d) => ({
      id: `div:${d.symbol}:${d.date}`,
      ticker: d.symbol.toUpperCase(),
      category: "dividend" as const,
      date: d.date,
      title: `Ex-dividend: $${d.amount.toFixed(2)}/share`,
      summary: d.payDate ? `Paid ${d.payDate}` : undefined,
      impact: 0.005, // dividends rarely move the stock more than ~0.5%
      confirmed: true,
      source: "Finnhub" as const,
      meta: { amount: d.amount },
    }));
  } catch {
    return [];
  }
}

export function isFinnhubConfigured(): boolean {
  return !!key();
}
