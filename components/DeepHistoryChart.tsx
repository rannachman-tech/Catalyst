"use client";

interface Props {
  history: Array<{ date: string; actualMovePct: number; type: string }>;
  ticker: string;
}

/**
 * Deep history chart — vertical bars showing the last N earnings reactions,
 * one bar per print, signed by direction. Hover-free, simple, honest.
 */
export default function DeepHistoryChart({ history, ticker }: Props) {
  if (!history || history.length === 0) return null;

  const max = Math.max(20, ...history.map((h) => Math.abs(h.actualMovePct)));
  const padded = history.slice().sort((a, b) => a.date.localeCompare(b.date));

  return (
    <section className="mt-6 sm:mt-8 rounded-lg border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline gap-3">
        <h3 className="text-[11px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
          Earnings reaction history · {ticker}
        </h3>
        <span className="text-[11px] text-fg-subtle">
          how the stock moved on the day, last {history.length} prints
        </span>
      </div>

      <div className="mt-4 h-[160px] sm:h-[200px] flex items-end gap-3">
        {padded.map((h, i) => {
          const heightPct = (Math.abs(h.actualMovePct) / max) * 100;
          const positive = h.actualMovePct >= 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full">
              <div className="flex-1 w-full flex items-end justify-center">
                <div
                  className="w-full rounded-t-sm relative"
                  style={{
                    height: `${heightPct}%`,
                    background: positive
                      ? "rgb(var(--phase-quiet) / 0.85)"
                      : "rgb(var(--phase-heavy) / 0.85)",
                    transition: "height 320ms ease-out",
                    minHeight: 4,
                  }}
                  title={`${h.date}: ${h.actualMovePct.toFixed(1)}%`}
                >
                  <span
                    className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono whitespace-nowrap"
                    style={{
                      color: positive
                        ? "rgb(var(--phase-quiet))"
                        : "rgb(var(--phase-heavy))",
                    }}
                  >
                    {positive ? "+" : ""}
                    {h.actualMovePct.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="text-[10px] font-mono text-fg-subtle whitespace-nowrap">
                {humanDate(h.date)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function humanDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}
