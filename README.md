# Equity Catalyst

Type a ticker. See every catalyst in the next 90 days. Or paste your portfolio
and see the catalyst load on your whole book.

The eToro AppStore Compass for **single-stock event timing**.

## What it answers

- **Single ticker** — *What's the next thing that could move this stock?*
  - Vertical 90-day timeline anchored to today
  - Catalyst Density Score (0–100, Quiet / Moderate / Heavy)
  - Big sentence ("NVDA has 3 catalysts in the next 21 days. Heavy week.")
  - Per-event card: implied move, last 4 reactions, plain-English explainer
  - Phase-aware Trade-on-eToro CTA: Quiet → accumulate, Heavy → defensive overlay

- **My book** — *What's the catalyst load on my portfolio?*
  - Paste tickers, get a 13-week × per-ticker heatmap
  - "Heaviest week ahead" callout
  - Mix-by-category bar (earnings vs FDA vs opex vs index, etc.)

## Stack

Next.js 14 · TypeScript · Tailwind 3 · Geist Sans/Mono · lucide-react · Recharts.
Edge runtime for eToro API. Static JSON + curated TS for catalysts.
Cost: $0/month on Vercel Hobby.

## Data sources

- **Finnhub** — earnings + dividend calendars (free tier, optional)
- **FDA OpenData** — PDUFA decision dates (curated)
- **Curated** — product launches, lockup expiries, opex, analyst days, index reviews
- **eToro public catalog** — confirmed-tradeable instrumentIds

When `FINNHUB_API_KEY` isn't set, the app uses synthetic earnings/dividends so
first paint is never empty. The source-health row is honest about it.

## Run

```bash
npm install
npm run dev
```

## Verify

```bash
npm run typecheck
npm run verify:baskets   # every instrumentId resolves on the eToro public catalog
npm run simulate:baskets # invariants, allocation math, defensive properties
npm run build
```

No API keys required to run verify or simulate.

## Trade flow

`/api/etoro/validate` — POST `{ apiKey, userKey }` → `{ ok, detectedEnv, username, cid }`.
Auto-detects real vs Virtual via `/trading/info/portfolio` probe.

`/api/etoro/trade-basket` — POST `{ apiKey, userKey, env, basket: [{ ticker, amount, instrumentId }] }`.
Edge runtime. PascalCase body to eToro: `{ InstrumentID, IsBuy: true, Leverage: 1, Amount }`.

Keys never leave the browser except inside the trade calls the user initiates.

## Compliance chrome (mandatory)

- Risk warning banner (top)
- Connect-eToro CTA (header + contextual)
- Plain English / Pro mode toggle
- Live sources health row
- Not-financial-advice disclaimer in footer
- No PII, no fingerprinting, no cookies
