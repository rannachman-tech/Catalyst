// Universe of supported tickers + their pre-resolved eToro instrumentIds.
// Sourced from the eToro public catalog at design time —
// see scripts/verify-baskets.ts for runtime confirmation.

export interface TickerEntry {
  ticker: string;            // display, bare US listing
  symbolFull: string;         // eToro internalSymbolFull
  instrumentId: number;
  name: string;
  sector: Sector;
  country: "US" | "CN" | "TW" | "NL" | "TR";
}

export type Sector =
  | "Tech"
  | "Semis"
  | "Comm"
  | "Consumer-Disc"
  | "Consumer-Staples"
  | "Healthcare"
  | "Financials"
  | "Energy"
  | "Industrials"
  | "Materials"
  | "Utilities"
  | "Real-Estate"
  | "Crypto-Adj";

export const TICKERS: TickerEntry[] = [
  // Mega-cap tech & semis
  { ticker: "NVDA", symbolFull: "NVDA",   instrumentId: 1137, name: "NVIDIA Corporation",            sector: "Semis",          country: "US" },
  { ticker: "AAPL", symbolFull: "AAPL",   instrumentId: 1001, name: "Apple",                          sector: "Tech",           country: "US" },
  { ticker: "MSFT", symbolFull: "MSFT",   instrumentId: 1004, name: "Microsoft",                      sector: "Tech",           country: "US" },
  { ticker: "GOOGL", symbolFull: "GOOGL", instrumentId: 6434, name: "Alphabet Class A",               sector: "Comm",           country: "US" },
  { ticker: "GOOG",  symbolFull: "GOOG",  instrumentId: 1002, name: "Alphabet Class C",               sector: "Comm",           country: "US" },
  { ticker: "META",  symbolFull: "META",  instrumentId: 1003, name: "Meta Platforms",                 sector: "Comm",           country: "US" },
  { ticker: "AMZN",  symbolFull: "AMZN",  instrumentId: 1005, name: "Amazon.com",                     sector: "Consumer-Disc",  country: "US" },
  { ticker: "TSLA",  symbolFull: "TSLA",  instrumentId: 1111, name: "Tesla",                          sector: "Consumer-Disc",  country: "US" },
  { ticker: "AMD",   symbolFull: "AMD",   instrumentId: 1832, name: "Advanced Micro Devices",         sector: "Semis",          country: "US" },
  { ticker: "AVGO",  symbolFull: "AVGO",  instrumentId: 4236, name: "Broadcom",                       sector: "Semis",          country: "US" },
  { ticker: "NFLX",  symbolFull: "NFLX",  instrumentId: 1127, name: "Netflix",                        sector: "Comm",           country: "US" },
  { ticker: "ORCL",  symbolFull: "ORCL",  instrumentId: 1135, name: "Oracle",                         sector: "Tech",           country: "US" },
  { ticker: "CRM",   symbolFull: "CRM",   instrumentId: 1839, name: "Salesforce",                     sector: "Tech",           country: "US" },
  { ticker: "ADBE",  symbolFull: "ADBE",  instrumentId: 1126, name: "Adobe",                          sector: "Tech",           country: "US" },
  { ticker: "INTU",  symbolFull: "INTU",  instrumentId: 1914, name: "Intuit",                         sector: "Tech",           country: "US" },
  { ticker: "NOW",   symbolFull: "NOW",   instrumentId: 4260, name: "ServiceNow",                     sector: "Tech",           country: "US" },
  { ticker: "IBM",   symbolFull: "IBM",   instrumentId: 1020, name: "IBM",                            sector: "Tech",           country: "US" },
  { ticker: "INTC",  symbolFull: "INTC",  instrumentId: 1021, name: "Intel",                          sector: "Semis",          country: "US" },
  { ticker: "QCOM",  symbolFull: "QCOM",  instrumentId: 1485, name: "Qualcomm",                       sector: "Semis",          country: "US" },
  { ticker: "MU",    symbolFull: "MU",    instrumentId: 1130, name: "Micron Technology",              sector: "Semis",          country: "US" },
  { ticker: "TXN",   symbolFull: "TXN",   instrumentId: 1634, name: "Texas Instruments",              sector: "Semis",          country: "US" },
  { ticker: "ASML",  symbolFull: "ASML",  instrumentId: 4244, name: "ASML Holding",                   sector: "Semis",          country: "NL" },
  { ticker: "TSM",   symbolFull: "TSM",   instrumentId: 4481, name: "Taiwan Semiconductor",           sector: "Semis",          country: "TW" },
  { ticker: "SMCI",  symbolFull: "SMCI",  instrumentId: 1069, name: "Super Micro Computer",           sector: "Tech",           country: "US" },
  { ticker: "ANET",  symbolFull: "ANET",  instrumentId: 4294, name: "Arista Networks",                sector: "Tech",           country: "US" },
  { ticker: "PANW",  symbolFull: "PANW",  instrumentId: 4124, name: "Palo Alto Networks",             sector: "Tech",           country: "US" },
  { ticker: "CRWD",  symbolFull: "CRWD",  instrumentId: 5506, name: "CrowdStrike",                    sector: "Tech",           country: "US" },
  { ticker: "ZS",    symbolFull: "ZS",    instrumentId: 4403, name: "Zscaler",                        sector: "Tech",           country: "US" },
  { ticker: "NET",   symbolFull: "NET",   instrumentId: 5712, name: "Cloudflare",                     sector: "Tech",           country: "US" },
  { ticker: "DDOG",  symbolFull: "DDOG",  instrumentId: 6414, name: "Datadog",                        sector: "Tech",           country: "US" },
  { ticker: "MDB",   symbolFull: "MDB",   instrumentId: 4406, name: "MongoDB",                        sector: "Tech",           country: "US" },
  { ticker: "SNOW",  symbolFull: "SNOW",  instrumentId: 7999, name: "Snowflake",                      sector: "Tech",           country: "US" },
  { ticker: "PLTR",  symbolFull: "PLTR",  instrumentId: 7991, name: "Palantir",                       sector: "Tech",           country: "US" },
  { ticker: "VRSN",  symbolFull: "VRSN",  instrumentId: 4178, name: "Verisign",                       sector: "Tech",           country: "US" },
  { ticker: "TEAM",  symbolFull: "TEAM",  instrumentId: 4286, name: "Atlassian",                      sector: "Tech",           country: "US" },
  { ticker: "SHOP",  symbolFull: "SHOP",  instrumentId: 4148, name: "Shopify",                        sector: "Tech",           country: "US" },
  { ticker: "SPOT",  symbolFull: "SPOT",  instrumentId: 1156, name: "Spotify",                        sector: "Comm",           country: "US" },

  // Consumer & retail
  { ticker: "COST",  symbolFull: "COST",  instrumentId: 1461, name: "Costco Wholesale",               sector: "Consumer-Staples", country: "US" },
  { ticker: "WMT",   symbolFull: "WMT",   instrumentId: 1035, name: "Walmart",                        sector: "Consumer-Staples", country: "US" },
  { ticker: "TGT",   symbolFull: "TGT",   instrumentId: 1490, name: "Target",                         sector: "Consumer-Staples", country: "US" },
  { ticker: "HD",    symbolFull: "HD",    instrumentId: 1018, name: "Home Depot",                     sector: "Consumer-Disc",  country: "US" },
  { ticker: "LOW",   symbolFull: "LOW",   instrumentId: 1474, name: "Lowe's",                         sector: "Consumer-Disc",  country: "US" },
  { ticker: "MCD",   symbolFull: "MCD",   instrumentId: 1025, name: "McDonald's",                     sector: "Consumer-Disc",  country: "US" },
  { ticker: "SBUX",  symbolFull: "SBUX",  instrumentId: 1142, name: "Starbucks",                      sector: "Consumer-Disc",  country: "US" },
  { ticker: "DIS",   symbolFull: "DIS",   instrumentId: 1016, name: "Walt Disney",                    sector: "Comm",           country: "US" },
  { ticker: "NKE",   symbolFull: "NKE",   instrumentId: 1042, name: "Nike",                           sector: "Consumer-Disc",  country: "US" },
  { ticker: "LULU",  symbolFull: "LULU",  instrumentId: 4309, name: "Lululemon",                      sector: "Consumer-Disc",  country: "US" },
  { ticker: "PEP",   symbolFull: "PEP",   instrumentId: 1043, name: "PepsiCo",                        sector: "Consumer-Staples", country: "US" },
  { ticker: "KO",    symbolFull: "KO",    instrumentId: 1024, name: "Coca-Cola",                      sector: "Consumer-Staples", country: "US" },
  { ticker: "ABNB",  symbolFull: "ABNB",  instrumentId: 8047, name: "Airbnb",                         sector: "Consumer-Disc",  country: "US" },
  { ticker: "UBER",  symbolFull: "UBER",  instrumentId: 1186, name: "Uber",                           sector: "Industrials",    country: "US" },
  { ticker: "LYFT",  symbolFull: "LYFT",  instrumentId: 1183, name: "Lyft",                           sector: "Industrials",    country: "US" },
  { ticker: "EBAY",  symbolFull: "EBAY",  instrumentId: 1051, name: "eBay",                           sector: "Consumer-Disc",  country: "US" },
  { ticker: "ROKU",  symbolFull: "ROKU",  instrumentId: 4409, name: "Roku",                           sector: "Comm",           country: "US" },
  { ticker: "PINS",  symbolFull: "PINS",  instrumentId: 1184, name: "Pinterest",                      sector: "Comm",           country: "US" },
  { ticker: "SNAP",  symbolFull: "SNAP",  instrumentId: 1979, name: "Snap",                           sector: "Comm",           country: "US" },
  { ticker: "RDDT",  symbolFull: "RDDT",  instrumentId: 1329, name: "Reddit",                         sector: "Comm",           country: "US" },
  { ticker: "RBLX",  symbolFull: "RBLX",  instrumentId: 6916, name: "Roblox",                         sector: "Comm",           country: "US" },

  // Healthcare & biotech
  { ticker: "JNJ",   symbolFull: "JNJ",   instrumentId: 1022, name: "Johnson & Johnson",              sector: "Healthcare",     country: "US" },
  { ticker: "UNH",   symbolFull: "UNH",   instrumentId: 1032, name: "UnitedHealth",                   sector: "Healthcare",     country: "US" },
  { ticker: "PFE",   symbolFull: "PFE",   instrumentId: 1028, name: "Pfizer",                         sector: "Healthcare",     country: "US" },
  { ticker: "LLY",   symbolFull: "LLY",   instrumentId: 1567, name: "Eli Lilly",                      sector: "Healthcare",     country: "US" },
  { ticker: "MRK",   symbolFull: "MRK",   instrumentId: 1027, name: "Merck",                          sector: "Healthcare",     country: "US" },
  { ticker: "BMY",   symbolFull: "BMY",   instrumentId: 1603, name: "Bristol-Myers Squibb",           sector: "Healthcare",     country: "US" },
  { ticker: "ABBV",  symbolFull: "ABBV",  instrumentId: 1452, name: "AbbVie",                         sector: "Healthcare",     country: "US" },
  { ticker: "GILD",  symbolFull: "GILD",  instrumentId: 1465, name: "Gilead Sciences",                sector: "Healthcare",     country: "US" },
  { ticker: "REGN",  symbolFull: "REGN",  instrumentId: 1972, name: "Regeneron Pharmaceuticals",      sector: "Healthcare",     country: "US" },
  { ticker: "BIIB",  symbolFull: "BIIB",  instrumentId: 1454, name: "Biogen",                         sector: "Healthcare",     country: "US" },
  { ticker: "VRTX",  symbolFull: "VRTX",  instrumentId: 4179, name: "Vertex Pharmaceuticals",         sector: "Healthcare",     country: "US" },
  { ticker: "MRNA",  symbolFull: "MRNA",  instrumentId: 6152, name: "Moderna",                        sector: "Healthcare",     country: "US" },
  { ticker: "BNTX",  symbolFull: "BNTX",  instrumentId: 6391, name: "BioNTech",                       sector: "Healthcare",     country: "US" },
  { ticker: "BAX",   symbolFull: "BAX",   instrumentId: 1596, name: "Baxter International",           sector: "Healthcare",     country: "US" },

  // Financials & fintech
  { ticker: "JPM",   symbolFull: "JPM",   instrumentId: 1023, name: "JPMorgan Chase",                 sector: "Financials",     country: "US" },
  { ticker: "BAC",   symbolFull: "BAC",   instrumentId: 1011, name: "Bank of America",                sector: "Financials",     country: "US" },
  { ticker: "WFC",   symbolFull: "WFC",   instrumentId: 1495, name: "Wells Fargo",                    sector: "Financials",     country: "US" },
  { ticker: "GS",    symbolFull: "GS",    instrumentId: 1467, name: "Goldman Sachs",                  sector: "Financials",     country: "US" },
  { ticker: "MS",    symbolFull: "MS",    instrumentId: 1976, name: "Morgan Stanley",                 sector: "Financials",     country: "US" },
  { ticker: "BRK.B", symbolFull: "BRK.B", instrumentId: 1118, name: "Berkshire Hathaway B",           sector: "Financials",     country: "US" },
  { ticker: "V",     symbolFull: "V",     instrumentId: 1046, name: "Visa",                           sector: "Financials",     country: "US" },
  { ticker: "MA",    symbolFull: "MA",    instrumentId: 1041, name: "Mastercard",                     sector: "Financials",     country: "US" },
  { ticker: "PYPL",  symbolFull: "PYPL",  instrumentId: 1484, name: "PayPal",                         sector: "Financials",     country: "US" },
  { ticker: "XYZ",   symbolFull: "XYZ",   instrumentId: 1967, name: "Block (XYZ)",                    sector: "Financials",     country: "US" },
  { ticker: "HOOD",  symbolFull: "HOOD",  instrumentId: 9272, name: "Robinhood",                      sector: "Financials",     country: "US" },
  { ticker: "SOFI",  symbolFull: "SOFI",  instrumentId: 9255, name: "SoFi Technologies",              sector: "Financials",     country: "US" },
  { ticker: "UPST",  symbolFull: "UPST",  instrumentId: 8632, name: "Upstart",                        sector: "Financials",     country: "US" },
  { ticker: "COIN",  symbolFull: "COIN",  instrumentId: 6168, name: "Coinbase",                       sector: "Crypto-Adj",     country: "US" },
  { ticker: "MARA",  symbolFull: "MARA",  instrumentId: 6244, name: "Marathon Digital",               sector: "Crypto-Adj",     country: "US" },
  { ticker: "RIOT",  symbolFull: "RIOT",  instrumentId: 6270, name: "Riot Platforms",                 sector: "Crypto-Adj",     country: "US" },

  // Energy & industrials
  { ticker: "XOM",   symbolFull: "XOM",   instrumentId: 1036, name: "Exxon-Mobil",                    sector: "Energy",         country: "US" },
  { ticker: "CVX",   symbolFull: "CVX.US", instrumentId: 1014, name: "Chevron",                       sector: "Energy",         country: "US" },
  { ticker: "BA",    symbolFull: "BA",    instrumentId: 1010, name: "Boeing",                         sector: "Industrials",    country: "US" },
  { ticker: "CAT",   symbolFull: "CAT",   instrumentId: 1012, name: "Caterpillar",                    sector: "Industrials",    country: "US" },
  { ticker: "GE",    symbolFull: "GE",    instrumentId: 1017, name: "General Electric",               sector: "Industrials",    country: "US" },
  { ticker: "MMM",   symbolFull: "MMM",   instrumentId: 1026, name: "3M",                             sector: "Industrials",    country: "US" },
  { ticker: "GM",    symbolFull: "GM",    instrumentId: 1501, name: "General Motors",                 sector: "Consumer-Disc",  country: "US" },
  { ticker: "F",     symbolFull: "F",     instrumentId: 1112, name: "Ford Motor",                     sector: "Consumer-Disc",  country: "US" },
  { ticker: "RIVN",  symbolFull: "RIVN",  instrumentId: 9287, name: "Rivian Automotive",              sector: "Consumer-Disc",  country: "US" },
  { ticker: "LCID",  symbolFull: "LCID",  instrumentId: 9256, name: "Lucid Group",                    sector: "Consumer-Disc",  country: "US" },
  { ticker: "ON",    symbolFull: "ON",    instrumentId: 4397, name: "ON Semiconductor",               sector: "Semis",          country: "US" },
  { ticker: "UPS",   symbolFull: "UPS",   instrumentId: 1493, name: "United Parcel Service",          sector: "Industrials",    country: "US" },
  { ticker: "FDX",   symbolFull: "FDX",   instrumentId: 1138, name: "FedEx",                          sector: "Industrials",    country: "US" },

  // Travel & leisure
  { ticker: "MGM",   symbolFull: "MGM",   instrumentId: 1680, name: "MGM Resorts",                    sector: "Consumer-Disc",  country: "US" },
  { ticker: "DKNG",  symbolFull: "DKNG",  instrumentId: 7990, name: "DraftKings",                     sector: "Consumer-Disc",  country: "US" },
  { ticker: "PENN",  symbolFull: "PENN",  instrumentId: 6038, name: "Penn Entertainment",             sector: "Consumer-Disc",  country: "US" },
  { ticker: "CCL",   symbolFull: "CCL",   instrumentId: 4272, name: "Carnival",                       sector: "Consumer-Disc",  country: "US" },
  { ticker: "RCL",   symbolFull: "RCL",   instrumentId: 4293, name: "Royal Caribbean",                sector: "Consumer-Disc",  country: "US" },
  { ticker: "UAL",   symbolFull: "UAL",   instrumentId: 1524, name: "United Airlines",                sector: "Industrials",    country: "US" },
  { ticker: "DAL",   symbolFull: "DAL",   instrumentId: 1521, name: "Delta Air Lines",                sector: "Industrials",    country: "US" },
  { ticker: "AAL",   symbolFull: "AAL",   instrumentId: 1451, name: "American Airlines",              sector: "Industrials",    country: "US" },
  { ticker: "LUV",   symbolFull: "LUV",   instrumentId: 1576, name: "Southwest Airlines",             sector: "Industrials",    country: "US" },

  // China ADRs
  { ticker: "BABA",  symbolFull: "BABA",  instrumentId: 1155, name: "Alibaba",                        sector: "Consumer-Disc",  country: "CN" },
  { ticker: "JD",    symbolFull: "JD.US", instrumentId: 1378, name: "JD.com",                         sector: "Consumer-Disc",  country: "CN" },
  { ticker: "PDD",   symbolFull: "PDD",   instrumentId: 4483, name: "PDD Holdings",                   sector: "Consumer-Disc",  country: "CN" },
  { ticker: "BIDU",  symbolFull: "BIDU",  instrumentId: 1141, name: "Baidu",                          sector: "Comm",           country: "CN" },
  { ticker: "MELI",  symbolFull: "MELI",  instrumentId: 4108, name: "MercadoLibre",                   sector: "Consumer-Disc",  country: "US" },
  { ticker: "SE",    symbolFull: "SE",    instrumentId: 5960, name: "Sea Limited",                    sector: "Consumer-Disc",  country: "US" },

  // Meme / high-vol
  { ticker: "GME",   symbolFull: "GME",   instrumentId: 1699, name: "GameStop",                       sector: "Consumer-Disc",  country: "US" },
  { ticker: "AMC",   symbolFull: "AMC",   instrumentId: 6591, name: "AMC Entertainment",              sector: "Comm",           country: "US" },
  { ticker: "BB",    symbolFull: "BB",    instrumentId: 4016, name: "BlackBerry",                     sector: "Tech",           country: "US" },
];

// Defensive overlay ETFs — used when the user is in a "Heavy" phase and we
// want to suggest a hedge basket alongside the underlying ticker.
export interface HedgeETF {
  ticker: string;
  symbolFull: string;
  instrumentId: number;
  name: string;
  role: "vol" | "shortMarket" | "treasury" | "gold" | "staples" | "utilities" | "healthcare";
}

export const HEDGE_ETFS: HedgeETF[] = [
  { ticker: "VXX",  symbolFull: "VXX",  instrumentId: 3163, name: "iPath Series B S&P 500 VIX Short-Term Futures ETN", role: "vol" },
  { ticker: "UVXY", symbolFull: "UVXY", instrumentId: 3246, name: "ProShares Ultra VIX Short-Term Futures",            role: "vol" },
  { ticker: "SH",   symbolFull: "SH",   instrumentId: 3225, name: "ProShares Short S&P500",                              role: "shortMarket" },
  { ticker: "TLT",  symbolFull: "TLT",  instrumentId: 3020, name: "iShares 20+ Year Treasury Bond ETF",                role: "treasury" },
  { ticker: "GLD",  symbolFull: "GLD",  instrumentId: 3025, name: "SPDR Gold Shares",                                     role: "gold" },
  { ticker: "XLP",  symbolFull: "XLP",  instrumentId: 3022, name: "Consumer Staples Select Sector SPDR",               role: "staples" },
  { ticker: "XLU",  symbolFull: "XLU",  instrumentId: 3013, name: "Utilities Select Sector SPDR",                      role: "utilities" },
  { ticker: "XLV",  symbolFull: "XLV",  instrumentId: 3017, name: "Health Care Select Sector SPDR",                    role: "healthcare" },
];

// Lookup helpers
const BY_TICKER = new Map(TICKERS.map((t) => [t.ticker.toUpperCase(), t]));
export function findTicker(input: string): TickerEntry | null {
  return BY_TICKER.get(input.trim().toUpperCase()) ?? null;
}

export function searchTickers(query: string, limit = 8): TickerEntry[] {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  const exact: TickerEntry[] = [];
  const startsWith: TickerEntry[] = [];
  const nameMatch: TickerEntry[] = [];
  for (const t of TICKERS) {
    const tk = t.ticker.toUpperCase();
    const nm = t.name.toUpperCase();
    if (tk === q) exact.push(t);
    else if (tk.startsWith(q)) startsWith.push(t);
    else if (nm.includes(q)) nameMatch.push(t);
  }
  return [...exact, ...startsWith, ...nameMatch].slice(0, limit);
}

export function isSupported(ticker: string): boolean {
  return BY_TICKER.has(ticker.trim().toUpperCase());
}
