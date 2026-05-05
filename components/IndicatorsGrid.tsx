"use client";

import {
  Activity,
  CalendarClock,
  Gauge,
  Sigma,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  type Catalyst,
  parseISO,
  daysBetween,
  humanDate,
} from "@/lib/catalysts";

interface Props {
  ticker: string;
  catalysts: Catalyst[];
  density: number;
  asOf: string;
}

export default function IndicatorsGrid({ ticker, catalysts, density, asOf }: Props) {
  const today = parseISO(asOf);
  const earnings = catalysts.find((c) => c.category === "earnings");
  const next = catalysts[0];
  const last4 = earnings?.meta?.last4Reactions ?? [];
  const winRate =
    last4.length > 0
      ? Math.round((last4.filter((m) => m > 0).length / last4.length) * 100)
      : null;
  const avgMove =
    last4.length > 0
      ? last4.reduce((a, b) => a + Math.abs(b), 0) / last4.length
      : null;

  return (
    <section className="mt-6 sm:mt-8">
      <div className="mb-3 text-[11px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
        Indicators · {ticker}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <Indicator
          icon={CalendarClock}
          label="Next event"
          primary={next ? humanDate(next.date) : "—"}
          secondary={
            next
              ? `${Math.max(0, daysBetween(today, parseISO(next.date)))} day${
                  daysBetween(today, parseISO(next.date)) === 1 ? "" : "s"
                } away`
              : "Nothing scheduled"
          }
        />
        <Indicator
          icon={Gauge}
          label="Density score"
          primary={String(density)}
          secondary="0–100 (next 30d)"
        />
        <Indicator
          icon={Sigma}
          label="Implied move"
          primary={
            earnings?.meta?.impliedMove
              ? `±${(earnings.meta.impliedMove * 100).toFixed(1)}%`
              : "—"
          }
          secondary={earnings ? "front-month straddle" : "no earnings in window"}
        />
        <Indicator
          icon={Activity}
          label="Catalysts in 90d"
          primary={String(catalysts.length)}
          secondary={
            catalysts.filter((c) => c.confirmed).length === catalysts.length
              ? "all confirmed"
              : `${catalysts.filter((c) => c.confirmed).length} confirmed`
          }
        />

        {last4.length > 0 && (
          <>
            <Indicator
              icon={winRate !== null && winRate >= 50 ? TrendingUp : TrendingDown}
              label="Earnings win rate"
              primary={`${winRate}%`}
              secondary="last 4 prints"
              accent={winRate !== null && winRate >= 50 ? "good" : "bad"}
            />
            <Indicator
              icon={Sigma}
              label="Avg day-of move"
              primary={avgMove !== null ? `${avgMove.toFixed(1)}%` : "—"}
              secondary="abs · last 4"
            />
          </>
        )}
      </div>
    </section>
  );
}

function Indicator({
  icon: Icon,
  label,
  primary,
  secondary,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  primary: string;
  secondary?: string;
  accent?: "good" | "bad";
}) {
  return (
    <div className="rounded-md border border-border bg-surface p-3.5">
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div
        className="mt-1 text-[20px] font-semibold leading-none"
        style={{
          color:
            accent === "good"
              ? "rgb(var(--phase-quiet))"
              : accent === "bad"
              ? "rgb(var(--phase-heavy))"
              : undefined,
        }}
      >
        {primary}
      </div>
      {secondary && <div className="mt-1.5 text-[11px] text-fg-subtle">{secondary}</div>}
    </div>
  );
}
