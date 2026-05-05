"use client";

import { useMemo, useState } from "react";
import {
  type PortfolioWeek,
  type TickerCatalystSet,
  parseISO,
  daysBetween,
  humanDate,
} from "@/lib/catalysts";

interface Props {
  weeks: PortfolioWeek[];
  sets: TickerCatalystSet[];
}

/**
 * 13-week × N-ticker heatmap. Each cell is the *count* of catalysts in that
 * week for that ticker, coloured by impact-weighted intensity.
 *
 * Top row aggregates across the book.
 */
export default function PortfolioHeatmap({ weeks, sets }: Props) {
  const [hover, setHover] = useState<{ ticker: string; weekISO: string } | null>(null);

  const tickers = sets.map((s) => s.ticker);
  const max = useMemo(
    () => Math.max(0.5, ...weeks.map((w) => w.weightedImpact)),
    [weeks]
  );

  // build a per-(ticker, weekStart) map
  const cellMap = useMemo(() => {
    const map = new Map<string, { count: number; impact: number }>();
    const startDates = weeks.map((w) => parseISO(w.weekStart));
    for (const s of sets) {
      for (const c of s.catalysts) {
        const d = parseISO(c.date);
        let idx = -1;
        for (let i = 0; i < startDates.length; i++) {
          const w0 = startDates[i];
          const w1 = i + 1 < startDates.length ? startDates[i + 1] : new Date(8.64e15);
          if (d >= w0 && d < w1) {
            idx = i;
            break;
          }
        }
        if (idx === -1) continue;
        const k = `${s.ticker}|${weeks[idx].weekStart}`;
        const cur = map.get(k) ?? { count: 0, impact: 0 };
        cur.count += 1;
        cur.impact += c.impact;
        map.set(k, cur);
      }
    }
    return map;
  }, [sets, weeks]);

  const tickerMaxImpact = useMemo(() => {
    let m = 0.5;
    for (const [, v] of cellMap) if (v.impact > m) m = v.impact;
    return m;
  }, [cellMap]);

  return (
    <div>
      {/* Aggregate row */}
      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-fg-subtle mb-1.5">
        Total catalyst load
      </div>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}
      >
        {weeks.map((w) => (
          <CellAgg key={w.weekStart} w={w} max={max} />
        ))}
      </div>

      {/* Per-ticker rows */}
      <div className="mt-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-fg-subtle mb-1.5">
          Per-ticker
        </div>
        <div className="space-y-1.5">
          {tickers.map((tk) => (
            <div
              key={tk}
              className="grid items-center gap-2"
              style={{ gridTemplateColumns: "70px 1fr" }}
            >
              <div className="font-mono text-[11.5px] text-fg-muted truncate">{tk}</div>
              <div
                className="grid gap-1.5"
                style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}
              >
                {weeks.map((w) => {
                  const v = cellMap.get(`${tk}|${w.weekStart}`);
                  return (
                    <Cell
                      key={`${tk}|${w.weekStart}`}
                      ticker={tk}
                      weekStart={w.weekStart}
                      count={v?.count ?? 0}
                      impact={v?.impact ?? 0}
                      max={tickerMaxImpact}
                      onEnter={() => setHover({ ticker: tk, weekISO: w.weekStart })}
                      onLeave={() => setHover(null)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Week labels */}
        <div
          className="mt-2 grid gap-1.5"
          style={{
            gridTemplateColumns: `70px repeat(${weeks.length}, 1fr)`,
          }}
        >
          <div />
          {weeks.map((w, i) => (
            <div
              key={w.weekStart}
              className="text-[9px] font-mono text-fg-subtle text-center truncate"
            >
              {i === 0 ? "this wk" : humanDate(w.weekStart)}
            </div>
          ))}
        </div>
      </div>

      {/* Hover detail */}
      {hover && (
        <HoverDetail
          ticker={hover.ticker}
          weekStart={hover.weekISO}
          set={sets.find((s) => s.ticker === hover.ticker)!}
        />
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
        Less
        <div className="flex gap-1">
          {[0.1, 0.25, 0.5, 0.8, 1].map((a, i) => (
            <div
              key={i}
              className="h-3 w-4 rounded-sm"
              style={{ background: `rgb(var(--phase-heavy) / ${a})` }}
            />
          ))}
        </div>
        More
      </div>
    </div>
  );
}

function CellAgg({ w, max }: { w: PortfolioWeek; max: number }) {
  const intensity = Math.min(1, Math.max(0.04, w.weightedImpact / max));
  const isThisWeek = daysBetween(parseISO(w.weekStart), new Date()) <= 6;
  return (
    <div
      className="heat-cell relative"
      title={`${humanDate(w.weekStart)} · ${w.count} event${w.count === 1 ? "" : "s"}`}
      style={{
        background: w.count === 0 ? "rgb(var(--surface-2))" : `rgb(var(--phase-heavy) / ${intensity})`,
        outline: isThisWeek ? "2px solid rgb(var(--accent))" : undefined,
      }}
    >
      {w.count > 0 && (
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-fg">
          {w.count}
        </span>
      )}
    </div>
  );
}

function Cell({
  count,
  impact,
  max,
  onEnter,
  onLeave,
  weekStart,
}: {
  ticker: string;
  weekStart: string;
  count: number;
  impact: number;
  max: number;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const intensity = count === 0 ? 0 : Math.min(1, Math.max(0.18, impact / max));
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="heat-cell"
      title={`${humanDate(weekStart)} · ${count} event${count === 1 ? "" : "s"}`}
      style={{
        background:
          count === 0
            ? "rgb(var(--surface-2))"
            : `rgb(var(--phase-heavy) / ${intensity})`,
      }}
    />
  );
}

function HoverDetail({
  ticker,
  weekStart,
  set,
}: {
  ticker: string;
  weekStart: string;
  set: TickerCatalystSet;
}) {
  const start = parseISO(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const events = set.catalysts.filter((c) => {
    const d = parseISO(c.date);
    return d >= start && d <= end;
  });
  if (events.length === 0) return null;
  return (
    <div className="mt-3 rounded-md border border-border bg-bg p-3">
      <div className="text-[10px] uppercase font-mono tracking-[0.18em] text-fg-subtle">
        {ticker} · week of {humanDate(weekStart)}
      </div>
      <ul className="mt-2 space-y-1">
        {events.map((e) => (
          <li key={e.id} className="flex items-center gap-2 text-[12px]">
            <span className="text-fg-muted">{humanDate(e.date)}</span>
            <span className="text-fg">{e.title}</span>
            <span className="ml-auto font-mono text-[10.5px] text-fg-subtle">
              ~{Math.round(e.impact * 100)}% vol
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
