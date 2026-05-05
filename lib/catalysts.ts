// Core catalyst types + density math + phase mapping.
// One source of truth — every component reads from here.

export type CatalystCategory =
  | "earnings"
  | "dividend"
  | "fda"
  | "product"
  | "options-expiry"
  | "index"
  | "lockup"
  | "analyst";

export type Source =
  | "Finnhub"
  | "FDA OpenData"
  | "Curated"
  | "CBOE"
  | "Index Provider";

export interface Catalyst {
  id: string;
  ticker: string;
  category: CatalystCategory;
  date: string;            // ISO yyyy-mm-dd
  title: string;            // "Q3 Earnings", "PDUFA: BLA-1234", "GTC Keynote"
  summary?: string;         // one-liner
  // Impact: typical %-vol move this kind of catalyst causes for this name.
  // 0..1, where 0.10 = ~10% expected day-of move.
  impact: number;
  // Whether the date is confirmed (true) or estimated (false).
  confirmed: boolean;
  source: Source;
  // Public URL pointing to the source of this event. When present, the
  // expanded card renders a "Verify on source" link — keeps us honest.
  sourceUrl?: string;
  // Optional category-specific metadata.
  meta?: {
    impliedMove?: number;        // earnings: front-month straddle
    last4Reactions?: number[];   // earnings: prior 4 day-of moves
    amount?: number;              // dividends $/share
    yield?: number;               // dividends %
    drugCandidate?: string;       // FDA
    indication?: string;          // FDA
    eventName?: string;           // product (e.g. "GTC Keynote")
    indexAction?: "add" | "remove" | "reweight";
    indexName?: string;
    sharesUnlocking?: number;
    analystEvent?: string;
  };
}

export interface TickerCatalystSet {
  ticker: string;
  asOf: string;             // ISO date data was generated
  // Resolved eToro instrument info — populated for any universe ticker, not
  // just the curated 119. Used by the Trade CTA + display heading.
  entry?: {
    ticker: string;
    symbolFull: string;
    instrumentId: number;
    name: string;
    sector?: string;
  };
  next?: Catalyst;
  catalysts: Catalyst[];     // sorted by date asc, future-only
  history?: Array<{
    date: string;
    actualMovePct: number;   // signed %, day-of close vs prior close
    type: CatalystCategory;
  }>;
  // True when Finnhub key is configured server-side and earnings/dividends
  // could be queried. False means the timeline shows OPEX-only and we should
  // surface a "configure Finnhub" hint to the user.
  liveEarnings?: boolean;
}

// ----- Density score -----

export type Phase = "quiet" | "moderate" | "heavy";

/**
 * Catalyst Density Score 0..100.
 *
 * Heuristic — designed to be honest and explainable:
 * - count next-30d catalysts, weighted by impact
 * - bonus for any single high-impact (>=7%) within 7 days
 * - capped at 100
 *
 * 0–24  Quiet
 * 25–59 Moderate
 * 60+   Heavy
 */
export function densityScore(catalysts: Catalyst[], today = new Date()): number {
  const now = stripTime(today);
  const horizon30 = addDays(now, 30);

  let score = 0;
  let imminentHeavy = false;
  let bigEventsIn14 = 0;
  let totalIn30 = 0;

  for (const c of catalysts) {
    const d = parseISO(c.date);
    if (d < now) continue;
    if (d > horizon30) continue;
    totalIn30 += 1;
    // Linear in impact, capped: 5%-impact = 10 pts; 10% = 20; 15% = 30 (capped).
    const pts = Math.min(30, Math.max(2, c.impact * 200));
    score += pts;
    const daysOut = Math.floor((d.getTime() - now.getTime()) / 86400000);
    if (daysOut <= 7 && c.impact >= 0.07) imminentHeavy = true;
    if (daysOut <= 14 && c.impact >= 0.07) bigEventsIn14 += 1;
  }
  if (imminentHeavy) score += 15;
  if (bigEventsIn14 >= 2) score += 15;
  if (totalIn30 >= 4) score += 8;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function phaseFor(score: number): Phase {
  if (score >= 60) return "heavy";
  if (score >= 25) return "moderate";
  return "quiet";
}

export function phaseHeadline(phase: Phase): string {
  if (phase === "heavy") return "Heavy week";
  if (phase === "moderate") return "Watch list";
  return "Quiet stretch";
}

export function phaseAction(phase: Phase): string {
  if (phase === "heavy")
    return "Decide: trade the event or sit it out. Trim, hedge, or step aside.";
  if (phase === "moderate") return "Hold core. Avoid adding leverage close to dates.";
  return "Low event risk. Hold or accumulate.";
}

// ----- Big sentence -----

export function bigSentence(t: TickerCatalystSet, today = new Date()): {
  primary: string;
  density: number;
  phase: Phase;
  count30: number;
  count90: number;
} {
  const now = stripTime(today);
  const upcoming = t.catalysts.filter((c) => parseISO(c.date) >= now);
  const next30 = upcoming.filter((c) => daysBetween(now, parseISO(c.date)) <= 30);
  const next90 = upcoming.filter((c) => daysBetween(now, parseISO(c.date)) <= 90);
  const density = densityScore(t.catalysts, today);
  const phase = phaseFor(density);
  const count30 = next30.length;
  const count90 = next90.length;

  let primary: string;
  if (next30.length === 0 && next90.length === 0) {
    primary = `${t.ticker} has no scheduled catalysts in the next 90 days.`;
  } else if (next30.length === 0) {
    primary = `${t.ticker} is quiet for 30 days, then ${count90} ${pl("catalyst", count90)} in the next 90.`;
  } else {
    const next = upcoming[0];
    const daysOut = next ? daysBetween(now, parseISO(next.date)) : 0;
    primary = `${t.ticker} has ${count30} ${pl("catalyst", count30)} in the next 30 days. ${phaseHeadline(phase)}.`;
    if (daysOut <= 7 && next) {
      primary = `${t.ticker} has ${count30} ${pl("catalyst", count30)} in the next 30 days — next is ${humanDate(next.date)}. ${phaseHeadline(phase)}.`;
    }
  }
  return { primary, density, phase, count30, count90 };
}

// ----- Portfolio aggregation -----

export interface PortfolioWeek {
  weekStart: string;        // ISO Monday
  count: number;
  weightedImpact: number;   // sum of impact for that week
  byTicker: Array<{ ticker: string; count: number; impact: number }>;
}

export function aggregatePortfolio(
  sets: TickerCatalystSet[],
  weeks = 13,
  today = new Date()
): { weeks: PortfolioWeek[]; total: number; heaviest: PortfolioWeek | null } {
  const now = stripTime(today);
  const start = monday(now);
  const buckets: PortfolioWeek[] = [];
  for (let i = 0; i < weeks; i++) {
    buckets.push({
      weekStart: toISO(addDays(start, i * 7)),
      count: 0,
      weightedImpact: 0,
      byTicker: [],
    });
  }

  for (const s of sets) {
    for (const c of s.catalysts) {
      const d = parseISO(c.date);
      const wkIdx = Math.floor(daysBetween(start, d) / 7);
      if (wkIdx < 0 || wkIdx >= weeks) continue;
      const b = buckets[wkIdx];
      b.count += 1;
      b.weightedImpact += c.impact;
      const tk = b.byTicker.find((x) => x.ticker === s.ticker);
      if (tk) {
        tk.count += 1;
        tk.impact += c.impact;
      } else {
        b.byTicker.push({ ticker: s.ticker, count: 1, impact: c.impact });
      }
    }
  }
  const total = buckets.reduce((a, b) => a + b.count, 0);
  const heaviest = buckets.reduce<PortfolioWeek | null>(
    (best, b) => (!best || b.weightedImpact > best.weightedImpact ? b : best),
    null
  );
  return { weeks: buckets, total, heaviest };
}

// ----- Date helpers -----

export function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
export function daysBetween(a: Date, b: Date): number {
  return Math.round((stripTime(b).getTime() - stripTime(a).getTime()) / 86400000);
}
export function monday(d: Date): Date {
  const x = stripTime(d);
  const dow = x.getDay(); // 0..6, 0=Sun
  const offset = dow === 0 ? -6 : 1 - dow;
  return addDays(x, offset);
}
export function humanDate(iso: string): string {
  const d = parseISO(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function pl(word: string, n: number): string {
  return n === 1 ? word : `${word}s`;
}

// ----- Category metadata -----

export const CATEGORY_LABEL: Record<CatalystCategory, string> = {
  earnings: "Earnings",
  dividend: "Dividend",
  fda: "FDA",
  product: "Product",
  "options-expiry": "Options Expiry",
  index: "Index",
  lockup: "Lockup Expiry",
  analyst: "Analyst Day",
};

export const CATEGORY_VAR: Record<CatalystCategory, string> = {
  earnings: "cat-earn",
  dividend: "cat-div",
  fda: "cat-fda",
  product: "cat-prod",
  "options-expiry": "cat-opt",
  index: "cat-idx",
  lockup: "cat-lock",
  analyst: "cat-anal",
};

export const CATEGORY_PLAIN: Record<CatalystCategory, string> = {
  earnings: "When the company reports its quarterly numbers. Often the biggest single mover.",
  dividend: "Day you must hold the stock to get the next dividend payment.",
  fda: "FDA approval decision date — for biotech, often a binary outcome.",
  product: "Major product launch, keynote or developer conference.",
  "options-expiry": "Big options-expiry day. Open interest at strikes can pull the price.",
  index: "Stock added to / removed from a major index — passive flows kick in.",
  lockup: "IPO insiders allowed to sell — supply hits the market.",
  analyst: "Investor / analyst day. Guidance and capital-allocation news.",
};
