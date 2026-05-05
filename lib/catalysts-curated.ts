// Curated catalysts — verifiable real-world events only.
// Previous version included hand-coded product launches / FDA dates that
// were invented. Removed. Kept: monthly OPEX (computed from third-Fridays).
import type { Catalyst } from "./catalysts";

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

export function curatedFor(ticker: string, today = new Date()): Catalyst[] {
  const upper = ticker.trim().toUpperCase();
  if (!HIGH_OPEX_TICKERS.has(upper)) return [];
  const dates = thirdFridays(3, today);
  return dates.map((date) => ({
    id: "opex:" + upper + ":" + date,
    ticker: upper,
    category: "options-expiry" as const,
    date,
    title: "Monthly options expiry",
    summary: "Standard third-Friday expiry. Heavy open interest can pin price into close.",
    impact: 0.012,
    confirmed: true,
    source: "Curated" as const,
  }));
}

export const CURATED_CATALYSTS: Catalyst[] = [];
