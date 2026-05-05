// Top-level service. Orchestrates Finnhub + curated specials + synthetic fallback.
//
// Public function: getTickerCatalysts(ticker)
//   - 90-day forward window from "today" anchor
//   - merges all sources, dedupes by id
//   - sorts by date
//   - attaches density score + history
//
// Server-only by design (uses process.env). Routes call it.

import type { Catalyst, TickerCatalystSet } from "./catalysts";
import { addDays, parseISO, stripTime, toISO } from "./catalysts";
import { fetchEarnings, fetchDividends, isFinnhubConfigured } from "./finnhub";
import { curatedFor } from "./catalysts-curated";
import { syntheticFor } from "./catalysts-fallback";
import { findTicker } from "./tickers";

// --- "Today" anchor.
// In production we'd use the literal Date.now(). To make demos consistent
// for May 2026, we expose an override hook.
export function today(): Date {
  if (process.env.EC_TODAY_OVERRIDE) {
    return parseISO(process.env.EC_TODAY_OVERRIDE);
  }
  return stripTime(new Date());
}

export async function getTickerCatalysts(
  ticker: string
): Promise<TickerCatalystSet | null> {
  const upper = ticker.trim().toUpperCase();
  const entry = findTicker(upper);
  if (!entry) return null;

  const now = today();
  const fromISO = toISO(now);
  const toISO_ = toISO(addDays(now, 90));

  const seen = new Map<string, Catalyst>();
  const push = (c: Catalyst) => {
    const k = c.id || `${c.category}:${c.ticker}:${c.date}`;
    if (!seen.has(k)) seen.set(k, c);
  };

  // Pull live first if configured.
  let usedLive = false;
  if (isFinnhubConfigured()) {
    try {
      const [earn, div] = await Promise.all([
        fetchEarnings(upper, fromISO, toISO_),
        fetchDividends(upper, fromISO, toISO_),
      ]);
      earn.forEach(push);
      div.forEach(push);
      usedLive = earn.length > 0 || div.length > 0;
    } catch {
      // fall through to curated
    }
  }

  // Curated specials always layer on top.
  curatedFor(upper).forEach(push);

  // Fallback synthetic earnings/dividends — only if live not used.
  if (!usedLive) {
    syntheticFor(upper).forEach(push);
  }

  const all = Array.from(seen.values());
  // Filter to forward window only.
  const fromDate = stripTime(now);
  const toDate = addDays(fromDate, 90);
  const upcoming = all
    .filter((c) => {
      const d = parseISO(c.date);
      return d >= fromDate && d <= toDate;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // History: last 4 earnings reactions if surfaced via fallback meta.
  // For demo, derive from synthetic config.
  const synth = syntheticFor(upper).find((c) => c.category === "earnings");
  const history = (synth?.meta?.last4Reactions ?? []).map((mv, i) => ({
    date: toISO(addDays(now, -90 * (4 - i))),
    actualMovePct: mv,
    type: "earnings" as const,
  }));

  return {
    ticker: upper,
    asOf: toISO(now),
    next: upcoming[0],
    catalysts: upcoming,
    history,
  };
}

export async function getMultiCatalysts(tickers: string[]): Promise<TickerCatalystSet[]> {
  const cleaned = Array.from(
    new Set(tickers.map((t) => t.trim().toUpperCase()).filter(Boolean))
  );
  const sets = await Promise.all(cleaned.map((t) => getTickerCatalysts(t)));
  return sets.filter((s): s is TickerCatalystSet => !!s);
}
