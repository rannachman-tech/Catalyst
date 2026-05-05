"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Briefcase,
  Loader2,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import {
  type TickerCatalystSet,
  parseISO,
  addDays,
  daysBetween,
  toISO,
  monday,
  aggregatePortfolio,
  humanDate,
  type CatalystCategory,
} from "@/lib/catalysts";
import PortfolioHeatmap from "./PortfolioHeatmap";

const STORAGE_KEY = "ec-portfolio:v1";

const SUGGESTIONS = [
  ["NVDA", "AAPL", "MSFT", "META", "TSLA"],
  ["NVDA", "TSLA", "AMD", "PLTR", "COIN", "MARA"],
  ["LLY", "MRNA", "VRTX", "BIIB", "GILD"],
  ["NICE", "ETOR", "CHKP", "WIX", "MNDY", "CYBR"],
];

export default function PortfolioMode() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sets, setSets] = useState<TickerCatalystSet[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed)) setTickers(parsed.filter((t) => /^[A-Z][A-Z0-9.]{0,7}$/.test(t)));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickers));
    } catch { /* ignore */ }
  }, [tickers]);

  useEffect(() => {
    if (tickers.length === 0) {
      setSets([]);
      return;
    }
    setLoading(true);
    setError(null);
    fetch("/api/portfolio", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tickers }),
    })
      .then((r) => r.json())
      .then((j: { sets?: TickerCatalystSet[]; error?: string }) => {
        if (j.error) {
          setError(j.error);
          setSets([]);
        } else {
          setSets(j.sets ?? []);
        }
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Failed to fetch.";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [tickers]);

  const aggregated = useMemo(() => aggregatePortfolio(sets, 13), [sets]);
  const today = parseISO(toISO(new Date()));

  async function addTickers(input: string) {
    const parts = input
      .split(/[\s,;]+/)
      .map((s) => s.trim().toUpperCase())
      .filter((p) => /^[A-Z][A-Z0-9.]{0,7}$/.test(p));
    if (parts.length === 0) {
      setError(null);
      return;
    }
    const checks = await Promise.all(
      parts.map((p) =>
        fetch(`/api/search?q=${encodeURIComponent(p)}&limit=1`)
          .then((r) => r.json())
          .then((j: { hits?: Array<{ ticker: string }> }) => {
            const hit = (j.hits ?? []).find(
              (h) => h.ticker.toUpperCase() === p.toUpperCase()
            );
            return hit ? p : null;
          })
          .catch(() => null)
      )
    );
    const valid = checks.filter((x): x is string => !!x);
    const invalid = parts.filter((p, i) => !checks[i]);
    setTickers((prev) => Array.from(new Set([...prev, ...valid])).slice(0, 20));
    if (invalid.length > 0) {
      setError(`Not on the eToro stock catalog: ${invalid.join(", ")}.`);
    } else {
      setError(null);
    }
  }

  function remove(t: string) {
    setTickers((prev) => prev.filter((x) => x !== t));
  }

  const heaviest = aggregated.heaviest;
  const heaviestTickers = useMemo(() => {
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

  return (
    <section className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-4 lg:gap-6 items-stretch">
      <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
          <Briefcase className="h-3 w-3" />
          Your portfolio · catalyst load
        </div>

        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addTickers(input);
                setInput("");
              }
            }}
            placeholder="Paste tickers — NVDA NICE ETOR…"
            className="fr flex-1 h-10 rounded-md border border-border bg-bg px-3 text-[13px] font-mono text-fg placeholder:text-fg-subtle/60"
          />
          <button
            onClick={() => {
              addTickers(input);
              setInput("");
            }}
            className="fr h-10 px-4 rounded-md bg-accent text-accent-fg text-[13px] font-medium hover:opacity-90"
          >
            Add
          </button>
        </div>

        {tickers.length === 0 && (
          <div className="mt-3 space-y-2">
            <div className="text-[11px] uppercase font-mono tracking-[0.18em] text-fg-subtle">
              Try one
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setTickers(s)}
                  className="fr text-[11px] rounded-md border border-border bg-bg px-2.5 py-1.5 hover:bg-surface-2 text-fg-muted"
                >
                  {s.join(" · ")}
                </button>
              ))}
            </div>
          </div>
        )}

        {tickers.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tickers.map((t) => (
              <span key={t} className="chip group">
                <span>{t}</span>
                <button
                  onClick={() => remove(t)}
                  className="-mr-1 rounded p-0.5 text-fg-subtle hover:text-fg hover:bg-fg/10"
                  aria-label={`Remove ${t}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-cat-opt/40 bg-cat-opt/10 px-3 py-2 text-[12px] text-cat-opt">
            <AlertTriangle className="h-3.5 w-3.5" />
            {error}
          </div>
        )}

        <div className="mt-5">
          {loading ? (
            <div className="flex items-center gap-2 py-12 justify-center text-fg-subtle text-[13px]">
              <Loader2 className="h-4 w-4 animate-spin" /> Fetching catalysts…
            </div>
          ) : sets.length === 0 ? (
            <EmptyHeatmap />
          ) : (
            <PortfolioHeatmap weeks={aggregated.weeks} sets={sets} />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-border bg-surface p-4 sm:p-5 flex-1">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
            <Sparkles className="h-3 w-3" />
            Your verdict
          </div>

          {sets.length === 0 ? (
            <p className="mt-3 text-[14px] text-fg-muted leading-relaxed">
              Paste your portfolio tickers and we&apos;ll show you exactly which weeks
              are loaded with events and which names are driving the load.
            </p>
          ) : (
            <>
              <p className="mt-3 text-[18px] sm:text-[20px] leading-tight font-semibold text-fg">
                {verdictHeadline(aggregated.total, heaviest, sets.length)}
              </p>
              <p className="mt-2 text-[13px] text-fg-muted leading-relaxed">
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
          <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
              <TrendingUp className="h-3 w-3" />
              Mix by category · next 30d
            </div>
            <CategoryMix sets={sets} today={today} />
          </div>
        )}
      </div>
    </section>
  );
}

function verdictHeadline(
  total: number,
  heaviest: ReturnType<typeof aggregatePortfolio>["heaviest"],
  size: number
): string {
  if (total === 0) {
    return `${size} ticker${size === 1 ? "" : "s"} · no scheduled catalysts in the next 13 weeks.`;
  }
  if (heaviest && heaviest.count >= 4) {
    return `Heavy book — ${heaviest.count} events the week of ${humanDate(heaviest.weekStart)}.`;
  }
  return `${total} catalyst${total === 1 ? "" : "s"} across ${size} name${size === 1 ? "" : "s"} in the next 13 weeks.`;
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
    return `That week has ${heaviest.count} events across ${heaviest.byTicker.length} names${
      names ? ` — driven by ${names}.` : "."
    } Consider trimming or hedging the heaviest single names a few days ahead.`;
  }
  const top = heaviestTickers[0];
  if (top) {
    return `Most concentrated: ${top.ticker} carries ${top.count} of the next 30 days' events. Drill in for the ticker view.`;
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
              style={{ width: `${w}%`, background: color }}
              title={`${cat}: ${n}`}
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

function EmptyHeatmap() {
  const start = monday(new Date());
  return (
    <div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(13, 1fr)" }}>
        {Array.from({ length: 13 }).map((_, i) => (
          <div
            key={i}
            className="heat-cell"
            style={{
              background: "rgb(var(--surface-2))",
              opacity: 0.5,
            }}
            title={humanDate(toISO(addDays(start, i * 7)))}
          />
        ))}
      </div>
      <p className="mt-3 text-[12px] text-fg-subtle">
        Add tickers above to see your weekly catalyst load.
      </p>
    </div>
  );
}
