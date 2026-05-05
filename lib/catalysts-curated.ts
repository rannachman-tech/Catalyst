// Curated catalysts — FDA PDUFA, product launches, lockup expiries, index rebalances,
// analyst days, options expiries. Hand-curated per ticker. Refreshed weekly.
//
// Earnings + dividends are NOT here — those flow from Finnhub via lib/finnhub.ts.
// Curated data is the moat: events Finnhub doesn't know about (GTC keynote, WWDC,
// FDA decision dates, S&P inclusion, IPO lockups).
//
// Today anchor: 2026-05-05. Dates relative to that for demo realism.
// In production these come from a GitHub Action committing data/curated.json weekly.

import type { Catalyst } from "./catalysts";

type CuratedSeed = Omit<Catalyst, "id"> & { id?: string };

function id(c: CuratedSeed): Catalyst {
  return { ...c, id: c.id ?? `${c.category}:${c.ticker}:${c.date}` };
}

// ---- Standard monthly options expiries (3rd Friday of each month) ----
// Big-OI tickers get them flagged.
const MONTHLY_OPEX_2026: string[] = [
  "2026-05-15",
  "2026-06-19",
  "2026-07-17",
  "2026-08-21",
];

const HIGH_OPEX_TICKERS = [
  "NVDA", "TSLA", "AAPL", "AMD", "META", "AMZN", "GOOGL", "MSFT", "SMCI",
  "PLTR", "COIN", "GME", "AMC", "MARA", "RIOT",
];

function opexCatalysts(): Catalyst[] {
  const out: Catalyst[] = [];
  for (const date of MONTHLY_OPEX_2026) {
    for (const t of HIGH_OPEX_TICKERS) {
      out.push(
        id({
          ticker: t,
          category: "options-expiry",
          date,
          title: "Monthly options expiry",
          summary: "Heavy open interest — pin risk into close.",
          impact: 0.015,
          confirmed: true,
          source: "Curated",
        })
      );
    }
  }
  return out;
}

// ---- Curated specials ----
const CURATED_BASE: CuratedSeed[] = [
  // ===== Tech / AI keynotes & product events =====
  {
    ticker: "NVDA",
    category: "product",
    date: "2026-05-28",
    title: "GTC Spring Keynote",
    summary: "AI infrastructure roadmap — historically a 5–10% mover.",
    impact: 0.07,
    confirmed: true,
    source: "Curated",
    meta: { eventName: "GTC Spring 2026" },
  },
  {
    ticker: "AAPL",
    category: "product",
    date: "2026-06-08",
    title: "WWDC Keynote",
    summary: "Annual developer conference — software roadmap.",
    impact: 0.04,
    confirmed: true,
    source: "Curated",
    meta: { eventName: "WWDC 2026" },
  },
  {
    ticker: "TSLA",
    category: "product",
    date: "2026-05-22",
    title: "Robotaxi Network Update",
    summary: "Quarterly autonomy progress note.",
    impact: 0.06,
    confirmed: false,
    source: "Curated",
    meta: { eventName: "FSD Update" },
  },
  {
    ticker: "GOOGL",
    category: "product",
    date: "2026-05-19",
    title: "Google I/O Keynote",
    summary: "Gemini roadmap, Search updates, Pixel reveals.",
    impact: 0.04,
    confirmed: true,
    source: "Curated",
    meta: { eventName: "I/O 2026" },
  },
  {
    ticker: "META",
    category: "product",
    date: "2026-09-23",
    title: "Connect Keynote",
    summary: "AR/VR + Meta AI roadmap.",
    impact: 0.04,
    confirmed: false,
    source: "Curated",
    meta: { eventName: "Meta Connect 2026" },
  },
  {
    ticker: "AMD",
    category: "product",
    date: "2026-06-04",
    title: "Computex MI400 Reveal",
    summary: "Next-gen AI accelerator details.",
    impact: 0.06,
    confirmed: false,
    source: "Curated",
    meta: { eventName: "Computex 2026" },
  },
  {
    ticker: "MSFT",
    category: "product",
    date: "2026-05-19",
    title: "Build Conference",
    summary: "Copilot + Azure AI updates.",
    impact: 0.03,
    confirmed: true,
    source: "Curated",
    meta: { eventName: "Build 2026" },
  },
  {
    ticker: "AMZN",
    category: "product",
    date: "2026-07-08",
    title: "Prime Day",
    summary: "Two-day retail event — often nudges Q3 guidance tone.",
    impact: 0.025,
    confirmed: false,
    source: "Curated",
  },

  // ===== FDA PDUFA dates (biotech) =====
  {
    ticker: "MRNA",
    category: "fda",
    date: "2026-05-29",
    title: "PDUFA: mRNA-1083 (combo flu+COVID)",
    summary: "BLA decision date. Binary for the franchise.",
    impact: 0.18,
    confirmed: true,
    source: "FDA OpenData",
    meta: { drugCandidate: "mRNA-1083", indication: "Flu+COVID combo" },
  },
  {
    ticker: "BIIB",
    category: "fda",
    date: "2026-06-12",
    title: "PDUFA: Leqembi label expansion",
    summary: "Subcutaneous formulation review.",
    impact: 0.10,
    confirmed: true,
    source: "FDA OpenData",
    meta: { drugCandidate: "Leqembi SC", indication: "Alzheimer's" },
  },
  {
    ticker: "REGN",
    category: "fda",
    date: "2026-07-22",
    title: "PDUFA: Eylea HD pediatric",
    summary: "Pediatric supplemental BLA.",
    impact: 0.06,
    confirmed: true,
    source: "FDA OpenData",
    meta: { drugCandidate: "Eylea HD", indication: "Pediatric retinal" },
  },
  {
    ticker: "VRTX",
    category: "fda",
    date: "2026-06-30",
    title: "PDUFA: VX-548 chronic pain",
    summary: "Non-opioid Nav1.8 — large addressable market.",
    impact: 0.14,
    confirmed: true,
    source: "FDA OpenData",
    meta: { drugCandidate: "VX-548", indication: "Chronic pain" },
  },
  {
    ticker: "BMY",
    category: "fda",
    date: "2026-07-09",
    title: "PDUFA: KarXT MDD",
    summary: "Major depressive disorder add-on indication.",
    impact: 0.08,
    confirmed: true,
    source: "FDA OpenData",
    meta: { drugCandidate: "KarXT", indication: "Adjunctive MDD" },
  },
  {
    ticker: "GILD",
    category: "fda",
    date: "2026-06-18",
    title: "PDUFA: lenacapavir PrEP",
    summary: "Long-acting HIV prevention.",
    impact: 0.07,
    confirmed: true,
    source: "FDA OpenData",
    meta: { drugCandidate: "lenacapavir", indication: "HIV PrEP" },
  },
  {
    ticker: "LLY",
    category: "fda",
    date: "2026-07-15",
    title: "PDUFA: orforglipron oral",
    summary: "Oral GLP-1. Big strategic catalyst.",
    impact: 0.10,
    confirmed: true,
    source: "FDA OpenData",
    meta: { drugCandidate: "orforglipron", indication: "Type 2 diabetes" },
  },

  // ===== Analyst / Investor days =====
  {
    ticker: "NVDA",
    category: "analyst",
    date: "2026-09-30",
    title: "Investor Day",
    summary: "Long-term capex + datacenter outlook.",
    impact: 0.03,
    confirmed: false,
    source: "Curated",
    meta: { analystEvent: "Annual Investor Day" },
  },
  {
    ticker: "JPM",
    category: "analyst",
    date: "2026-05-19",
    title: "Investor Day",
    summary: "Capital framework + 2026/27 ROTCE targets.",
    impact: 0.025,
    confirmed: true,
    source: "Curated",
    meta: { analystEvent: "JPM Investor Day" },
  },
  {
    ticker: "WMT",
    category: "analyst",
    date: "2026-06-04",
    title: "Walmart US Associate Conference",
    summary: "Strategy + advertising / Walmart+ updates.",
    impact: 0.02,
    confirmed: true,
    source: "Curated",
  },
  {
    ticker: "DIS",
    category: "analyst",
    date: "2026-08-12",
    title: "D23 Expo",
    summary: "Streaming + parks + IP slate reveal.",
    impact: 0.04,
    confirmed: true,
    source: "Curated",
  },
  {
    ticker: "TSLA",
    category: "analyst",
    date: "2026-07-30",
    title: "Annual Shareholder Meeting",
    summary: "Compensation, governance, FSD progress.",
    impact: 0.05,
    confirmed: false,
    source: "Curated",
  },
  {
    ticker: "BA",
    category: "analyst",
    date: "2026-06-10",
    title: "Investor Conference",
    summary: "Free cash flow target reset post-737.",
    impact: 0.05,
    confirmed: false,
    source: "Curated",
  },
  {
    ticker: "GS",
    category: "analyst",
    date: "2026-06-04",
    title: "Investor Day",
    summary: "Asset & wealth management margin path.",
    impact: 0.025,
    confirmed: true,
    source: "Curated",
  },

  // ===== Index reconstitution =====
  {
    ticker: "RDDT",
    category: "index",
    date: "2026-06-26",
    title: "Russell rebalance — possible inclusion",
    summary: "Russell 1000 inclusion adds passive flow.",
    impact: 0.04,
    confirmed: false,
    source: "Index Provider",
    meta: { indexAction: "add", indexName: "Russell 1000" },
  },
  {
    ticker: "PLTR",
    category: "index",
    date: "2026-09-19",
    title: "S&P 500 quarterly review",
    summary: "Already in — review confirms weighting.",
    impact: 0.02,
    confirmed: false,
    source: "Index Provider",
    meta: { indexAction: "reweight", indexName: "S&P 500" },
  },
  {
    ticker: "SMCI",
    category: "index",
    date: "2026-06-26",
    title: "Russell rebalance",
    summary: "Mid-cap migration could shift passive demand.",
    impact: 0.03,
    confirmed: false,
    source: "Index Provider",
    meta: { indexAction: "reweight", indexName: "Russell" },
  },

  // ===== IPO lockup expiries =====
  {
    ticker: "RDDT",
    category: "lockup",
    date: "2026-09-21",
    title: "Secondary lockup expiry",
    summary: "Insiders cleared to sell. Supply overhang risk.",
    impact: 0.05,
    confirmed: true,
    source: "Curated",
  },
  {
    ticker: "RIVN",
    category: "lockup",
    date: "2026-06-15",
    title: "Convertible note window opens",
    summary: "Non-IPO supply, but tracked by event traders.",
    impact: 0.03,
    confirmed: false,
    source: "Curated",
  },
];

export const CURATED_CATALYSTS: Catalyst[] = [
  ...CURATED_BASE.map(id),
  ...opexCatalysts(),
];

export function curatedFor(ticker: string): Catalyst[] {
  const upper = ticker.trim().toUpperCase();
  return CURATED_CATALYSTS.filter((c) => c.ticker === upper).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}
