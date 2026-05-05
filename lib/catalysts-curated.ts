// Curated catalysts — verifiable real-world events only.
// Every entry below has a sourceUrl pointing to the original announcement.
import type { Catalyst, CatalystCategory } from "./catalysts";

interface CuratedSeed {
  ticker: string;
  category: CatalystCategory;
  date: string;
  title: string;
  summary?: string;
  impact: number;
  confirmed: boolean;
  sourceUrl?: string;
  meta?: Catalyst["meta"];
}

const REAL_EVENTS: CuratedSeed[] = [
  {
    ticker: "AAPL",
    category: "product",
    date: "2026-06-08",
    title: "WWDC 2026 Keynote",
    summary: "Annual Worldwide Developers Conference — software roadmap reveal.",
    impact: 0.04,
    confirmed: true,
    sourceUrl: "https://developer.apple.com/wwdc26/",
    meta: { eventName: "WWDC 2026" },
  },
  {
    ticker: "RDDT",
    category: "index",
    date: "2026-06-26",
    title: "Russell 2026 reconstitution effective",
    summary: "Annual rebalance of Russell 1000 / 2000 / 3000. Passive flows kick in at close.",
    impact: 0.03,
    confirmed: true,
    sourceUrl: "https://www.lseg.com/en/ftse-russell/index-reconstitution",
    meta: { indexAction: "reweight", indexName: "Russell" },
  },
  {
    ticker: "PLTR",
    category: "index",
    date: "2026-06-26",
    title: "Russell 2026 reconstitution effective",
    summary: "Annual rebalance day.",
    impact: 0.02,
    confirmed: true,
    sourceUrl: "https://www.lseg.com/en/ftse-russell/index-reconstitution",
    meta: { indexAction: "reweight", indexName: "Russell" },
  },
  {
    ticker: "SMCI",
    category: "index",
    date: "2026-06-26",
    title: "Russell 2026 reconstitution effective",
    summary: "Annual rebalance day.",
    impact: 0.025,
    confirmed: true,
    sourceUrl: "https://www.lseg.com/en/ftse-russell/index-reconstitution",
    meta: { indexAction: "reweight", indexName: "Russell" },
  },
];

export function curatedFor(ticker: string, today = new Date()): Catalyst[] {
  const upper = ticker.trim().toUpperCase();
  const out: Catalyst[] = [];

  for (const e of REAL_EVENTS) {
    if (e.ticker !== upper) continue;
    const eventDate = new Date(e.date + "T00:00:00");
    if (eventDate < today) continue;
    out.push({
      id: e.category + ":" + upper + ":" + e.date,
      ticker: upper,
      category: e.category,
      date: e.date,
      title: e.title,
      summary: e.summary,
      impact: e.impact,
      confirmed: e.confirmed,
      source: "Curated",
      sourceUrl: e.sourceUrl,
      meta: e.meta,
    });
  }

  if (HIGH_OPEX_TICKERS.has(upper)) {
    const dates = thirdFridays(3, today);
    for (const date of dates) {
      out.push({
        id: "opex:" + upper + ":" + date,
        ticker: upper,
        category: "options-expiry",
        date,
        title: "Monthly options expiry",
        summary: "Standard third-Friday expiry. Heavy open interest can pin price into close.",
        impact: 0.012,
        confirmed: true,
        source: "Curated",
      });
    }
  }

  return out;
}

function thirdFridays(monthsAhead: number, today: Date): string[] {
  const out: string[] = [];
  for (let i = 0; i <= monthsAhead; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    let day = 1;
    while (new Date(d.getFullYear(), d.getMonth(), day).getDay() !== 5) day++;
    const fri = new Date(d.getFullYear(), d.getMonth(), day + 14);
    if (fri >= today) {
      const y = fri.getFullYear();
      const m = String(fri.getMonth() + 1).padStart(2, "0");
      const dd = String(fri.getDate()).padStart(2, "0");
      out.push(y + "-" + m + "-" + dd);
    }
  }
  return out;
}

const HIGH_OPEX_TICKERS = new Set([
  "NVDA", "TSLA", "AAPL", "AMD", "META", "AMZN", "GOOGL", "GOOG", "MSFT",
  "SMCI", "PLTR", "COIN", "GME", "AMC", "MARA", "RIOT",
  "NFLX", "AVGO", "MU", "ARM", "CRWD", "PANW", "SNOW",
]);

export const CURATED_CATALYSTS: Catalyst[] = [];
