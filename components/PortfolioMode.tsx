"use client";

// "My book" mode — replaces the previous paste-tickers experience.
// When the user has connected eToro, we fetch their live portfolio and
// run the catalyst aggregation against their actual positions.
// When not connected, show a clear Connect CTA.

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Briefcase,
  Loader2,
  Plug,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  type TickerCatalystSet,
  parseISO,
  daysBetween,
  toISO,
  aggregatePortfolio,
  humanDate,
  type CatalystCategory,
} from "@/lib/catalysts";
import {
  type EtoroSession,
  getEtoroSession,
  onEtoroChange,
} from "@/lib/etoro-session";
import ConnectEtoroModal from "./ConnectEtoroModal";
import PortfolioHeatmap from "./PortfolioHeatmap";

interface Position {
  ticker: string;
  symbolFull: string;
  instrumentId: number;
  name: string;
  amount: number;
  isBuy: boolean;
}

export default function PortfolioMode() {
  const [session, setSession] = useState<EtoroSession | null>(null);
  const [positions, setPositions] = useState<Position[] | null>(null);
  const [sets, setSets] = useState<TickerCatalystSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConnect, setShowConnect] = useState(false);

  useEffect(() => {
    setSession(getEtoroSession());
    return onEtoroChange(() => setSession(getEtoroSession()));
  }, []);

  // When connected, fetch live portfolio. When disconnected, clear.
  useEffect(() => {
    if (!session) {
      setPositions(null);
      setSets([]);
      return;
    }
    void loadPortfolio(session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.cid, session?.env]);

  async function loadPortfolio(s: EtoroSession) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/etoro/portfolio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          apiKey: s.apiKey,
          userKey: s.userKey,
          env: s.env,
        }),
      });
      const j = (await res.json()) as {
        ok: boolean;
        positions?: Position[];
        error?: string;
      };
      if (!j.ok || !j.positions) {
        setError(j.error || "Could not load portfolio.");
        setPositions([]);
        setSets([]);
        return;
      }
      setPositions(j.positions);

      // Pull catalysts for the position tickers
      if (j.positions.length === 0) {
        setSets([]);
      } else {
        const catalystsRes = await fetch("/api/portfolio", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ tickers: j.positions.map((p) => p.ticker) }),
        });
        const c = (await catalystsRes.json()) as { sets?: TickerCatalystSet[] };
        setSets(c.sets ?? []);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Network error.");
    } finally {
      setLoading(false);
    }
  }

  const aggregated = useMemo(() => aggregatePortfolio(sets, 13), [sets]);
  const today = parseISO(toISO(new Date()));
  const heaviestTickers = useMemoHeaviest(sets, today);

  // ---- Disconnected state ----
  if (!session) {
    return (
      <section className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-3 lg:gap-4 items-stretch">
        <div className="rounded-lg border border-border bg-surface p-6 sm:p-8 flex flex-col items-center text-center">
          <Briefcase className="h-7 w-7 text-fg-subtle mb-3" />
          <h3 className="text-[16px] font-semibold text-fg">
            See the catalyst load on your real book
          </h3>
          <p className="mt-2 text-[13px] text-fg-muted max-w-md leading-relaxed">
            Connect your eToro account to pull your current positions. We&apos;ll
            aggregate the next 90 days of catalysts across your portfolio so you
            know which weeks are loaded.
          </p>
          <button
            onClick={() => setShowConnect(true)}
            className="fr mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-accent text-accent-fg text-[13px] font-medium hover:opacity-90"
          >
            <Plug className="h-3.5 w-3.5" />
            Connect eToro
          </button>
          <p className="mt-3 text-[11px] text-fg-subtle">
            Read-only. Keys persist only in your browser.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
            <Sparkles className="h-3 w-3" /> What you get
          </div>
          <ul className="mt-3 space-y-2 text-[13px] text-fg-muted leading-relaxed">
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
              <span>13-week catalyst heatmap across your real positions.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
              <span>&quot;Heaviest week ahead&quot; with the names driving it.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
              <span>Mix-by-category bar — earnings vs FDA vs opex etc.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
              <span>Drill into any single position for the full timeline.</span>
            </li>
          </ul>
        </div>

        <ConnectEtoroModal
          open={showConnect}
          onClose={() => setShowConnect(false)}
          onSuccess={() => setShowConnect(false)}
        />
      </section>
    );
  }

  // ---- Connected, loading or loaded ----
  const tickers = (positions ?? []).map((p) => p.ticker);
  const heaviest = aggregated.heaviest;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-3 lg:gap-4 items-stretch">
      <div className="rounded-lg border border-border bg-surface p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
            <Briefcase className="h-3 w-3" />
            Your eToro book · catalyst load
            {session.env === "demo" && (
              <span className="rounded bg-fg/10 px-1 py-0.5 text-[9px] font-mono uppercase">
                Virtual
              </span>
            )}
          </div>
          <button
            onClick={() => session && loadPortfolio(session)}
            disabled={loading}
            className="fr inline-flex items-center gap-1.5 h-7 px-2 rounded-md border border-border text-[11px] hover:bg-surface-2 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={"h-3 w-3 " + (loading ? "animate-spin" : "")} />
            {loading ? "Refreshing" : "Refresh"}
          </button>
        </div>

        {positions && positions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {positions.slice(0, 30).map((p) => (
              <span
                key={p.instrumentId}
                className="chip"
                title={p.name + " · $" + p.amount.toFixed(0)}
              >
                <span>{p.ticker}</span>
                {!p.isBuy && (
                  <span className="text-cat-earn text-[9px] ml-1">SHORT</span>
                )}
              </span>
            ))}
            {positions.length > 30 && (
              <span className="chip text-fg-subtle">+{positions.length - 30} more</span>
            )}
          </div>
        )}

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-cat-earn/40 bg-cat-earn/10 px-3 py-2 text-[12px] text-cat-earn">
            <AlertTriangle className="h-3.5 w-3.5" />
            {error}
          </div>
        )}

        <div className="mt-4">
          {loading && !positions ? (
            <div className="flex items-center gap-2 py-12 justify-center text-fg-subtle text-[13px]">
              <Loader2 className="h-4 w-4 animate-spin" /> Pulling your book…
            </div>
          ) : positions && positions.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-fg-subtle">
              No open positions on your account.
            </div>
          ) : sets.length > 0 ? (
            <PortfolioHeatmap weeks={aggregated.weeks} sets={sets} />
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="rounded-lg border border-border bg-surface p-3.5 sm:p-4 flex-1">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
            <Sparkles className="h-3 w-3" /> Your verdict
          </div>
          {!positions ? (
            <p className="mt-3 text-[13px] text-fg-muted">Loading…</p>
          ) : positions.length === 0 ? (
            <p className="mt-3 text-[13px] text-fg-muted">
              Once you have open positions on eToro, your catalyst load will appear here.
            </p>
          ) : (
            <>
              <p className="mt-2.5 text-[16px] sm:text-[18px] leading-snug font-semibold text-fg">
                {verdictHeadline(aggregated.total, heaviest, tickers.length)}
              </p>
              <p className="mt-1.5 text-[12.5px] text-fg-muted leading-relaxed">
                {verdictDetail(aggregated.total, heaviest, heaviestTickers)}
              </p>

              {heaviestTickers.length > 0 && (
                <div className="mt-4">
                  <div className="text-[10px] uppercase font-mono tracking-[0.18em] text-fg-subtle">
                    Heaviest single names · 30d
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {heaviestTickers.slice(0, 5).map((t) => (
                      <div
                        key={t.ticker}
                        className="flex items-center justify-between gap-2 text-[13px]"
                      >
                        <span className="font-mono font-medium">{t.ticker}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-fg-subtle text-[12px]">
                            {t.count} event{t.count === 1 ? "" : "s"}
                          </span>
                          {t.next && (
                            <span className="font-mono text-[11px] rounded bg-surface-2 px-1.5 py-0.5 text-fg-muted">
                              next {humanDate(t.next.date)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {sets.length > 0 && (
          <div className="rounded-lg border border-border bg-surface p-3.5 sm:p-4">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
              <TrendingUp className="h-3 w-3" /> Mix by category · next 30d
            </div>
            <CategoryMix sets={sets} today={today} />
          </div>
        )}
      </div>
    </section>
  );
}

function useMemoHeaviest(sets: TickerCatalystSet[], today: Date) {
  return useMemo(() => {
    return sets
      .map((s) => {
        const next30 = s.catalysts.filter((c) => {
          const d = daysBetween(today, parseISO(c.date));
          return d >= 0 && d <= 30;
        });
        const impact = next30.reduce((a, c) => a + c.impact, 0);
        const next = next30[0];
        return { ticker: s.ticker, count: next30.length, impact, next };
      })
      .filter((x) => x.count > 0)
      .sort((a, b) => b.impact - a.impact);
  }, [sets, today]);
}

function verdictHeadline(
  total: number,
  heaviest: ReturnType<typeof aggregatePortfolio>["heaviest"],
  size: number
): string {
  if (total === 0) {
    return size + " position" + (size === 1 ? "" : "s") + " · no scheduled catalysts in 13 weeks.";
  }
  if (heaviest && heaviest.count >= 4) {
    return "Heavy book — " + heaviest.count + " events the week of " + humanDate(heaviest.weekStart) + ".";
  }
  return total + " catalyst" + (total === 1 ? "" : "s") + " across " + size + " position" + (size === 1 ? "" : "s") + " in the next 13 weeks.";
}

function verdictDetail(
  _total: number,
  heaviest: ReturnType<typeof aggregatePortfolio>["heaviest"],
  heaviestTickers: Array<{ ticker: string; count: number }>
): string {
  if (!heaviest || heaviest.count === 0) {
    return "Calendar is clear — no concentrated event-risk weeks in your book.";
  }
  if (heaviest.count >= 4) {
    const names = heaviest.byTicker.slice(0, 3).map((t) => t.ticker).join(", ");
    return "That week has " + heaviest.count + " events across " + heaviest.byTicker.length + " names" +
      (names ? " — driven by " + names + "." : ".") +
      " Consider trimming or hedging the heaviest single names a few days ahead.";
  }
  const top = heaviestTickers[0];
  if (top) {
    return "Most concentrated: " + top.ticker + " carries " + top.count + " of the next 30 days' events.";
  }
  return "Spread is even — no one week dominates.";
}

function CategoryMix({ sets, today }: { sets: TickerCatalystSet[]; today: Date }) {
  const counts = new Map<CatalystCategory, number>();
  for (const s of sets) {
    for (const c of s.catalysts) {
      const d = daysBetween(today, parseISO(c.date));
      if (d >= 0 && d <= 30) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
    }
  }
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return <p className="mt-2 text-[12.5px] text-fg-subtle">Nothing in 30 days.</p>;
  }
  const order: Array<[CatalystCategory, string, string]> = [
    ["earnings", "Earnings", "rgb(var(--cat-earn))"],
    ["dividend", "Dividends", "rgb(var(--cat-div))"],
    ["fda", "FDA", "rgb(var(--cat-fda))"],
    ["product", "Product", "rgb(var(--cat-prod))"],
    ["options-expiry", "Opex", "rgb(var(--cat-opt))"],
    ["index", "Index", "rgb(var(--cat-idx))"],
    ["lockup", "Lockup", "rgb(var(--cat-lock))"],
    ["analyst", "Analyst", "rgb(var(--cat-anal))"],
  ];
  return (
    <>
      <div className="mt-3 flex h-3 rounded overflow-hidden">
        {order.map(([cat, , color]) => {
          const n = counts.get(cat) ?? 0;
          if (n === 0) return null;
          const w = (n / total) * 100;
          return (
            <div
              key={cat}
              style={{ width: w + "%", background: color }}
              title={cat + ": " + n}
            />
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {order.map(([cat, label, color]) => {
          const n = counts.get(cat) ?? 0;
          if (n === 0) return null;
          return (
            <div key={cat} className="flex items-center gap-1.5 text-[11px]">
              <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
              <span className="text-fg-muted">{label}</span>
              <span className="ml-auto font-mono text-fg-subtle">{n}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
