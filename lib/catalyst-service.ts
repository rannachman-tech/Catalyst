import type { Catalyst, TickerCatalystSet } from "./catalysts";
import { addDays, parseISO, stripTime, toISO } from "./catalysts";
import { fetchEarnings, fetchDividends, isFinnhubConfigured } from "./finnhub";
import { curatedFor } from "./catalysts-curated";
import { resolveTicker, isCurated } from "./universe";

function genericOpexCatalysts(ticker: string, today: Date): Catalyst[] {
  const out: Catalyst[] = [];
  for (let i = 0; i <= 3; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    let day = 1;
    while (new Date(d.getFullYear(), d.getMonth(), day).getDay() !== 5) day++;
    const fri = new Date(d.getFullYear(), d.getMonth(), day + 14);
    if (fri >= today) {
      const y = fri.getFullYear();
      const m = String(fri.getMonth() + 1).padStart(2, "0");
      const dd = String(fri.getDate()).padStart(2, "0");
      const date = y + "-" + m + "-" + dd;
      out.push({
        id: "opex:" + ticker + ":" + date,
        ticker,
        category: "options-expiry",
        date,
        title: "Monthly options expiry",
        summary: "Third-Friday expiry — pin risk into close on high-OI strikes.",
        impact: 0.01,
        confirmed: true,
        source: "Curated",
      });
    }
  }
  return out;
}

export function today(): Date {
  if (process.env.EC_TODAY_OVERRIDE) return parseISO(process.env.EC_TODAY_OVERRIDE);
  return stripTime(new Date());
}

export async function getTickerCatalysts(ticker: string): Promise<TickerCatalystSet | null> {
  const upper = ticker.trim().toUpperCase();
  const entry = resolveTicker(upper);
  if (!entry) return null;
  const curatedName = isCurated(upper);

  const now = today();
  const fromISO = toISO(now);
  const toISO_ = toISO(addDays(now, 90));

  const seen = new Map<string, Catalyst>();
  const push = (c: Catalyst) => {
    const k = c.id || (c.category + ":" + c.ticker + ":" + c.date);
    if (!seen.has(k)) seen.set(k, c);
  };

  const liveAvailable = isFinnhubConfigured();
  if (liveAvailable) {
    try {
      const [earn, div] = await Promise.all([
        fetchEarnings(upper, fromISO, toISO_),
        fetchDividends(upper, fromISO, toISO_),
      ]);
      earn.forEach(push);
      div.forEach(push);
    } catch {}
  }

  if (curatedName) curatedFor(upper, now).forEach(push);
  if (!curatedName) genericOpexCatalysts(upper, now).forEach(push);

  const all = Array.from(seen.values());
  const fromDate = stripTime(now);
  const toDate = addDays(fromDate, 90);
  const upcoming = all
    .filter((c) => {
      const d = parseISO(c.date);
      return d >= fromDate && d <= toDate;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    ticker: upper,
    asOf: toISO(now),
    entry: {
      ticker: entry.ticker,
      symbolFull: entry.symbolFull,
      instrumentId: entry.instrumentId,
      name: entry.name,
      sector: entry.sector,
    },
    next: upcoming[0],
    catalysts: upcoming,
    history: [],
    liveEarnings: liveAvailable,
  };
}

export async function getMultiCatalysts(tickers: string[]): Promise<TickerCatalystSet[]> {
  const cleaned = Array.from(new Set(tickers.map((t) => t.trim().toUpperCase()).filter(Boolean)));
  const sets = await Promise.all(cleaned.map((t) => getTickerCatalysts(t)));
  return sets.filter((s): s is TickerCatalystSet => !!s);
}
