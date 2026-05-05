/* eslint-disable no-console */
// 9-section simulator. Catches whole classes of bugs at design time.

import { TICKERS, type TickerEntry } from "../lib/tickers";
import { basketFor, hedgeBasket, allocate } from "../lib/baskets";
import {
  densityScore,
  phaseFor,
  type Phase,
  type Catalyst,
} from "../lib/catalysts";

let failures = 0;
function fail(msg: string) {
  console.log(`✕ ${msg}`);
  failures++;
}
function pass(msg: string) {
  console.log(`✓ ${msg}`);
}

const PHASES: Phase[] = ["quiet", "moderate", "heavy"];

// 1) coverage
console.log("\n[1] Coverage");
for (const t of TICKERS) {
  for (const p of PHASES) {
    const b = basketFor(t, p);
    if (!b || b.holdings.length === 0) fail(`No basket for ${t.ticker}/${p}`);
  }
}
pass(`Covered ${TICKERS.length} × ${PHASES.length} = ${TICKERS.length * PHASES.length} baskets`);

// 2) invariants
console.log("\n[2] Invariants");
let invariantBad = 0;
for (const t of TICKERS) {
  for (const p of PHASES) {
    const b = basketFor(t, p);
    const sum = b.holdings.reduce((a, h) => a + h.weight, 0);
    if (Math.abs(sum - 100) > 0.01) {
      fail(`Weights sum ${sum} for ${t.ticker}/${p}`);
      invariantBad++;
    }
    if (b.holdings.length < 1 || b.holdings.length > 8)
      fail(`Holdings count ${b.holdings.length} for ${t.ticker}/${p}`);
    const ids = b.holdings.map((h) => h.instrumentId);
    if (new Set(ids).size !== ids.length)
      fail(`Duplicate instrumentId in ${t.ticker}/${p}`);
    for (const h of b.holdings) {
      if (h.instrumentId <= 0) fail(`Bad instrumentId ${h.instrumentId} in ${t.ticker}/${p}`);
      if (h.weight <= 0 || h.weight > 100)
        fail(`Bad weight ${h.weight} for ${h.ticker} in ${t.ticker}/${p}`);
    }
  }
  // Also validate the hedge variant — 4 holdings, all weights ≤ 55%
  const hb = hedgeBasket(t, "heavy");
  if (hb.holdings.length !== 4) fail(`Hedge holdings ${hb.holdings.length} != 4 for ${t.ticker}`);
  const hbMax = Math.max(...hb.holdings.map((h) => h.weight));
  if (hbMax > 55) fail(`Hedge max weight ${hbMax} > 55 for ${t.ticker}`);
}
if (invariantBad === 0) pass("All weights, sizes, IDs valid");

// 3) field consistency
console.log("\n[3] Field consistency");
for (const t of TICKERS) {
  for (const p of PHASES) {
    const b = basketFor(t, p);
    if (b.ticker !== t.ticker) fail(`Ticker mismatch ${b.ticker} vs ${t.ticker}`);
    if (b.phase !== p) fail(`Phase mismatch ${b.phase} vs ${p}`);
  }
}
pass("Basket.ticker / basket.phase mirror inputs");

// 4) phaseFor edge cases
console.log("\n[4] phaseFor edge cases");
const edgeScores: Array<[number, Phase]> = [
  [-100, "quiet"],
  [-1, "quiet"],
  [0, "quiet"],
  [24, "quiet"],
  [25, "moderate"],
  [40, "moderate"],
  [59, "moderate"],
  [60, "heavy"],
  [100, "heavy"],
  [200, "heavy"],
];
for (const [s, expected] of edgeScores) {
  const got = phaseFor(s);
  if (got !== expected) fail(`phaseFor(${s}) = ${got}, expected ${expected}`);
}
pass(`${edgeScores.length} phaseFor edge cases pass`);

// 5) routing matrix
console.log("\n[5] Routing matrix");
let routingBad = 0;
const sample = TICKERS.slice(0, 8);
for (const t of sample) {
  for (const score of [10, 30, 65, 90]) {
    const phase = phaseFor(score);
    const b = basketFor(t, phase);
    if (b.phase !== phase) {
      fail(`Routing ${t.ticker} score=${score} → phase=${phase} but basket=${b.phase}`);
      routingBad++;
    }
  }
}
if (routingBad === 0) pass("Routing phaseFor → basketFor agrees on every tested score");

// 6) allocation math
console.log("\n[6] Allocation math");
const amounts = [1000, 1, 0.1, 100000, 333, 999.99, 50, 10000];
let allocBad = 0;
for (const t of sample) {
  for (const p of PHASES) {
    const b = basketFor(t, p);
    for (const amt of amounts) {
      const allocated = allocate(b, amt);
      const totalAllocated = allocated.reduce((a, h) => a + h.dollars, 0);
      const drift = Math.abs(totalAllocated - amt);
      // Allow 1¢ rounding drift × #holdings
      if (drift > 0.01 * b.holdings.length + 0.01) {
        fail(`Allocation drift ${drift.toFixed(4)} for ${t.ticker}/${p}/$${amt}`);
        allocBad++;
      }
    }
  }
}
if (allocBad === 0) pass("Allocation totals match input amounts within rounding");

// 7) cross-basket consistency
console.log("\n[7] Cross-basket consistency");
const idToSymbol = new Map<number, string>();
for (const t of TICKERS) {
  for (const p of PHASES) {
    const b = basketFor(t, p);
    for (const h of b.holdings) {
      const prev = idToSymbol.get(h.instrumentId);
      if (prev && prev !== h.symbolFull) {
        fail(`InstrumentID ${h.instrumentId} maps to two symbols: ${prev} and ${h.symbolFull}`);
      }
      idToSymbol.set(h.instrumentId, h.symbolFull);
    }
  }
}
pass(`${idToSymbol.size} unique instrumentId↔symbol pairings consistent`);

// 8) density score sanity
console.log("\n[8] Density / phase sanity");
const today = new Date(2026, 4, 5);
const empty: Catalyst[] = [];
if (densityScore(empty, today) !== 0) fail("Empty catalysts should yield score 0");
const synth: Catalyst[] = [
  { id: "1", ticker: "X", category: "earnings", date: "2026-05-12", title: "x", impact: 0.10, confirmed: true, source: "Curated" },
  { id: "2", ticker: "X", category: "fda", date: "2026-05-15", title: "x", impact: 0.15, confirmed: true, source: "Curated" },
];
const score = densityScore(synth, today);
if (score < 60) fail(`Synthetic heavy block produced score ${score} < 60`);
else pass(`Heavy synthetic = ${score} (heavy)`);

// 9) defensive properties — direct basket = 100% underlying;
//    hedge variant = 50% underlying max
console.log("\n[9] Defensive properties");
let defBad = 0;
for (const t of TICKERS as TickerEntry[]) {
  const direct = basketFor(t, "quiet");
  const hb = hedgeBasket(t, "heavy");
  const directUnderlying = direct.holdings.find((h) => h.ticker === t.ticker);
  if (!directUnderlying || directUnderlying.weight !== 100) {
    fail(`Direct basket for ${t.ticker}: underlying weight is ${directUnderlying?.weight}, expected 100`);
    defBad++;
  }
  const hedgeUnderlying = hb.holdings.find((h) => h.ticker === t.ticker);
  if (!hedgeUnderlying || hedgeUnderlying.weight !== 50) {
    fail(`Hedge basket for ${t.ticker}: underlying weight is ${hedgeUnderlying?.weight}, expected 50`);
    defBad++;
  }
}
if (defBad === 0) pass("Direct = 100% underlying; hedge = 50% underlying + 50% defensive");

console.log("");
if (failures > 0) {
  console.error(`✕ ${failures} simulator failures`);
  process.exit(1);
}
console.log("✓ Simulator clean.");
