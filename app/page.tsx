"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, Compass, Loader2, Search } from "lucide-react";
import RiskBanner from "@/components/RiskBanner";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ThemeToggle";
import ConnectEtoroButton from "@/components/ConnectEtoroButton";
import ConnectEtoroCta from "@/components/ConnectEtoroCta";
import LiveSourcesRow from "@/components/LiveSourcesRow";
import TickerPicker from "@/components/TickerPicker";
import CatalystTimeline from "@/components/CatalystTimeline";
import DensityScore from "@/components/DensityScore";
import InsightsCard from "@/components/InsightsCard";
import IndicatorsGrid from "@/components/IndicatorsGrid";
import DeepHistoryChart from "@/components/DeepHistoryChart";
import PortfolioMode from "@/components/PortfolioMode";
import TradeModal from "@/components/TradeModal";
import {
  bigSentence,
  type TickerCatalystSet,
  type Source,
} from "@/lib/catalysts";
import type { TickerEntry } from "@/lib/tickers";

type Mode = "ticker" | "portfolio";

const RECENTS_KEY = "ec-recents:v1";
const LAST_TICKER_KEY = "ec-last-ticker:v1";

export default function Home() {
  const [mode, setMode] = useState<Mode>("ticker");
  const [ticker, setTicker] = useState<string>("");
  const [recents, setRecents] = useState<string[]>([]);
  const [data, setData] = useState<TickerCatalystSet | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tradeOpen, setTradeOpen] = useState(false);

  // Load recents + last selection
  useEffect(() => {
    try {
      const r = localStorage.getItem(RECENTS_KEY);
      if (r) setRecents(JSON.parse(r) as string[]);
    } catch { /* ignore */ }
    try {
      const last = localStorage.getItem(LAST_TICKER_KEY);
      if (last) setTicker(last);
      else setTicker("NVDA");
    } catch {
      setTicker("NVDA");
    }
  }, []);

  // Persist last + recents
  useEffect(() => {
    if (!ticker) return;
    try {
      localStorage.setItem(LAST_TICKER_KEY, ticker);
      const next = Array.from(new Set([ticker, ...recents])).slice(0, 8);
      setRecents(next);
      localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  // Fetch when ticker changes
  useEffect(() => {
    if (!ticker) {
      setData(null);
      return;
    }
    setLoading(true);
    setErr(null);
    fetch(`/api/catalysts/${encodeURIComponent(ticker)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j: TickerCatalystSet) => setData(j))
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Failed to fetch.";
        setErr(msg);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [ticker]);

  // Build a tickerEntry from the API response — covers any universe ticker,
  // not just the curated 119.
  const tickerEntry = useMemo<TickerEntry | null>(() => {
    if (!data?.entry) return null;
    const e = data.entry;
    return {
      ticker: e.ticker,
      symbolFull: e.symbolFull,
      instrumentId: e.instrumentId,
      name: e.name,
      sector: (e.sector as TickerEntry["sector"]) ?? "Tech",
      country: "US",
    };
  }, [data]);
  const summary = useMemo(() => (data ? bigSentence(data) : null), [data]);

  // Sources health row — honest about what's actually live
  const sources: Array<{ source: Source; ok: boolean; note?: string }> = useMemo(() => {
    if (!data) {
      return [
        { source: "Finnhub", ok: false },
        { source: "Curated", ok: true },
      ];
    }
    const used = new Set(data.catalysts.map((c) => c.source));
    return [
      {
        source: "Finnhub",
        ok: !!data.liveEarnings,
        note: data.liveEarnings
          ? "Live earnings + dividends"
          : "Not configured — set FINNHUB_API_KEY in Vercel env",
      },
      { source: "Curated", ok: used.has("Curated"), note: "Monthly OPEX (third Fridays)" },
    ];
  }, [data]);

  return (
    <div className="min-h-screen flex flex-col">
      <RiskBanner />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-bg/80 backdrop-blur-md border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-accent" aria-hidden />
            <div className="leading-tight">
              <div className="text-[14px] font-semibold tracking-tight">
                Equity Catalyst
              </div>
              <div className="hidden sm:block text-[10px] uppercase tracking-[0.18em] font-mono text-fg-subtle">
                what&apos;s next for your stocks
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ConnectEtoroButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 pb-10">
        {/* Mode tabs + plain/pro */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ModeTabs mode={mode} setMode={setMode} />
          <div className="flex items-center gap-2">
            {data && <LiveSourcesRow sources={sources} asOf={data.asOf} />}
          </div>
        </div>

        {/* Finnhub-not-configured banner */}
        {data && data.liveEarnings === false && (
          <div className="mt-3 rounded-md border border-cat-opt/40 bg-cat-opt/10 px-3 py-2 text-[12px] text-cat-opt flex items-start gap-2">
            <Loader2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" aria-hidden />
            <div>
              <span className="font-medium">Earnings + dividends offline.</span>{" "}
              Add <code className="font-mono text-[11px]">FINNHUB_API_KEY</code> to your Vercel
              env to enable the live calendar. Free tier covers all S&amp;P 1500 names.
              The timeline currently shows monthly options expiry only.
            </div>
          </div>
        )}

        {/* TICKER MODE */}
        {mode === "ticker" && (
          <>
            <section className="mt-4 grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-3 lg:gap-4 items-start">
              {/* LEFT — picker + centerpiece */}
              <div className="rounded-lg border border-border bg-surface p-3.5 sm:p-4 flex flex-col">
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
                  {tickerEntry ? tickerEntry.name : "Pick a ticker"}
                </div>

                <div className="mt-2.5 max-w-[440px] w-full">
                  <TickerPicker
                    value={ticker}
                    onChange={setTicker}
                    recents={recents}
                    onClearRecents={() => {
                      setRecents([]);
                      try {
                        localStorage.removeItem(RECENTS_KEY);
                      } catch { /* ignore */ }
                    }}
                  />
                </div>

                {/* Big sentence */}
                {summary && (
                  <p className="mt-3 text-[17px] sm:text-[19px] leading-snug font-semibold text-fg max-w-[42ch]">
                    {summary.primary}
                  </p>
                )}

                {/* Density score */}
                <div className="mt-3">
                  {loading && !data && (
                    <div className="flex items-center gap-2 py-10 justify-center text-fg-subtle text-[13px]">
                      <Loader2 className="h-4 w-4 animate-spin" /> Pulling catalysts…
                    </div>
                  )}
                  {summary && (
                    <DensityScore
                      score={summary.density}
                      phase={summary.phase}
                      count30={summary.count30}
                      count90={summary.count90}
                    />
                  )}
                </div>

                {err && (
                  <div className="mt-3 rounded-md border border-cat-earn/40 bg-cat-earn/10 p-2.5 text-[12px] text-cat-earn">
                    {err}
                  </div>
                )}
              </div>

              {/* RIGHT — insights + trade CTA */}
              <div className="flex flex-col gap-3">
                {summary ? (
                  <InsightsCard
                    ticker={data!.ticker}
                    phase={summary.phase}
                    bigSentence={summary.primary}
                    catalysts={data!.catalysts}
                    asOf={data!.asOf}
                    className="flex-1"
                  />
                ) : (
                  <section className="rounded-lg border border-border bg-surface p-4 sm:p-5 flex-1">
                    <h2 className="text-[11px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
                      Insights
                    </h2>
                    <p className="mt-3 text-[14px] text-fg-muted">
                      {ticker ? "Loading…" : "Pick a ticker to see what's next."}
                    </p>
                  </section>
                )}

                {tickerEntry && summary && (
                  <ConnectEtoroCta
                    onTradeClick={() => setTradeOpen(true)}
                    ctaLabel={`Buy ${tickerEntry.ticker}`}
                    description={
                      summary.phase === "heavy"
                        ? `${tickerEntry.ticker} is in a heavy week. The trade opens with a one-click buy and an optional defensive overlay (vol + treasuries + sector hedge) you can toggle on.`
                        : `Direct buy of ${tickerEntry.name}. Optional hedge overlay available if you want to cut size and pair with vol + treasuries.`
                    }
                  />
                )}
              </div>
            </section>

            {/* Indicators grid */}
            {data && summary && (
              <IndicatorsGrid
                ticker={data.ticker}
                catalysts={data.catalysts}
                density={summary.density}
                asOf={data.asOf}
              />
            )}

            {/* Timeline (full width) */}
            {data && (
              <section className="mt-4 sm:mt-5 rounded-lg border border-border bg-surface">
                <div className="border-b border-border px-3.5 sm:px-4 py-2.5 flex items-center justify-between">
                  <h3 className="text-[11px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
                    Timeline · next 90 days
                  </h3>
                  <div className="text-[11px] text-fg-subtle">
                    {data.catalysts.length} event{data.catalysts.length === 1 ? "" : "s"}
                  </div>
                </div>
                <CatalystTimeline
                  catalysts={data.catalysts}
                  asOf={data.asOf}
                  ticker={data.ticker}
                />
              </section>
            )}

            {/* History */}
            {data && data.history && data.history.length > 0 && (
              <DeepHistoryChart history={data.history} ticker={data.ticker} />
            )}

            {/* What we track */}
            {data && (
              <section className="mt-5 sm:mt-6 rounded-lg border border-border bg-surface p-4 sm:p-5">
                <h3 className="text-[11px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
                  What we track
                </h3>
                <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-[12px] text-fg-muted">
                  <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cat-earn flex-shrink-0" /><div><span className="text-fg font-medium">Earnings</span> — quarterly print, day-of move history.</div></li>
                  <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cat-div flex-shrink-0" /><div><span className="text-fg font-medium">Dividends</span> — ex-date + amount + yield.</div></li>
                  <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cat-fda flex-shrink-0" /><div><span className="text-fg font-medium">FDA</span> — PDUFA decision dates (biotech).</div></li>
                  <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cat-prod flex-shrink-0" /><div><span className="text-fg font-medium">Product</span> — keynotes, launches, dev conferences.</div></li>
                  <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cat-opt flex-shrink-0" /><div><span className="text-fg font-medium">Options expiry</span> — monthly OPEX pin risk.</div></li>
                  <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cat-idx flex-shrink-0" /><div><span className="text-fg font-medium">Index review</span> — S&amp;P / Russell add &amp; reweight.</div></li>
                  <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cat-lock flex-shrink-0" /><div><span className="text-fg font-medium">Lockup expiry</span> &mdash; IPO &amp; secondary unlocks.</div></li>
                  <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cat-anal flex-shrink-0" /><div><span className="text-fg font-medium">Analyst day</span> &mdash; investor days &amp; conferences.</div></li>
                </ul>
                <p className="mt-3 text-[11px] text-fg-subtle leading-relaxed max-w-3xl">
                  Density score weighs each event by its typical day-of vol impact. A high-impact catalyst in under 7 days adds an extra burst.
                  Earnings + dividends are live from Finnhub when configured; the rest are curated.
                </p>
              </section>
            )}

            {tickerEntry && summary && (
              <TradeModal
                open={tradeOpen}
                onClose={() => setTradeOpen(false)}
                ticker={tickerEntry}
                phase={summary.phase}
              />
            )}
          </>
        )}

        {/* PORTFOLIO MODE */}
        {mode === "portfolio" && (
          <div className="mt-5 sm:mt-6">
            <PortfolioMode />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function ModeTabs({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <div className="inline-flex h-9 rounded-md border border-border bg-surface p-0.5 text-[12.5px] font-medium">
      <button
        onClick={() => setMode("ticker")}
        className={`fr inline-flex items-center gap-1.5 px-3 rounded-[5px] transition-colors ${
          mode === "ticker" ? "bg-surface-2 text-fg" : "text-fg-subtle hover:text-fg"
        }`}
      >
        <Search className="h-3.5 w-3.5" /> Single ticker
      </button>
      <button
        onClick={() => setMode("portfolio")}
        className={`fr inline-flex items-center gap-1.5 px-3 rounded-[5px] transition-colors ${
          mode === "portfolio" ? "bg-surface-2 text-fg" : "text-fg-subtle hover:text-fg"
        }`}
      >
        <Briefcase className="h-3.5 w-3.5" /> My book
      </button>
    </div>
  );
}
