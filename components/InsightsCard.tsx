"use client";

import { Lightbulb } from "lucide-react";
import {
  type Phase,
  type Catalyst,
  phaseHeadline,
  phaseAction,
  parseISO,
  daysBetween,
  humanDate,
} from "@/lib/catalysts";

interface Props {
  ticker: string;
  phase: Phase;
  bigSentence: string;
  catalysts: Catalyst[];
  asOf: string;
  mode: "plain" | "pro";
  className?: string;
}

export default function InsightsCard({
  ticker,
  phase,
  bigSentence,
  catalysts,
  asOf,
  mode,
  className = "",
}: Props) {
  if (!catalysts) {
    return (
      <section
        className={`rounded-lg border border-border bg-surface p-4 sm:p-5 ${className}`}
      >
        <h2 className="text-base font-semibold">Insights</h2>
        <p className="mt-2 text-[12px] text-fg-subtle">Loading…</p>
      </section>
    );
  }

  const today = parseISO(asOf);
  const next = catalysts[0];
  const insights = buildInsights({ ticker, phase, catalysts, today, mode });

  return (
    <section
      className={`rounded-lg border border-border bg-surface p-4 sm:p-5 ${className}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
          Insights
        </h2>
        <PhaseBadge phase={phase} />
      </div>

      <p className="mt-3 text-[18px] sm:text-[20px] leading-tight font-semibold text-fg">
        {bigSentence}
      </p>

      <p className="mt-2 text-[13px] text-fg-muted leading-relaxed">
        {phaseAction(phase)}
      </p>

      {next && (
        <div className="mt-4 rounded-md border border-border bg-bg p-3">
          <div className="text-[10px] uppercase font-mono tracking-[0.16em] text-fg-subtle">
            Next event · {humanDate(next.date)}
          </div>
          <div className="mt-1 text-[13px] text-fg font-medium">{next.title}</div>
          {next.summary && (
            <div className="mt-1 text-[12px] text-fg-muted">{next.summary}</div>
          )}
          <div className="mt-1 text-[11px] text-fg-subtle">
            in {Math.max(0, daysBetween(today, parseISO(next.date)))} day
            {daysBetween(today, parseISO(next.date)) === 1 ? "" : "s"}
          </div>
        </div>
      )}

      {insights.length > 0 && (
        <ul className="mt-4 space-y-2">
          {insights.map((it, i) => (
            <li key={i} className="flex gap-2 text-[12.5px] text-fg-muted leading-relaxed">
              <Lightbulb className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-accent" aria-hidden />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PhaseBadge({ phase }: { phase: Phase }) {
  const map: Record<Phase, { bg: string; fg: string; label: string }> = {
    quiet: { bg: "rgb(var(--phase-quiet) / 0.14)", fg: "rgb(var(--phase-quiet))", label: "Quiet" },
    moderate: { bg: "rgb(var(--phase-mod) / 0.14)", fg: "rgb(var(--phase-mod))", label: "Moderate" },
    heavy: { bg: "rgb(var(--phase-heavy) / 0.14)", fg: "rgb(var(--phase-heavy))", label: "Heavy" },
  };
  const c = map[phase];
  return (
    <span
      className="text-[10px] font-mono uppercase tracking-[0.18em] rounded px-1.5 py-0.5"
      style={{ background: c.bg, color: c.fg }}
    >
      {phaseHeadline(phase) || c.label}
    </span>
  );
}

function buildInsights({
  ticker,
  phase,
  catalysts,
  today,
  mode,
}: {
  ticker: string;
  phase: Phase;
  catalysts: Catalyst[];
  today: Date;
  mode: "plain" | "pro";
}): string[] {
  const out: string[] = [];

  const next = catalysts[0];
  const earnings = catalysts.find((c) => c.category === "earnings");
  const fda = catalysts.find((c) => c.category === "fda");
  const product = catalysts.find((c) => c.category === "product");
  const div = catalysts.find((c) => c.category === "dividend");

  if (earnings && daysBetween(today, parseISO(earnings.date)) <= 21) {
    const im = earnings.meta?.impliedMove;
    if (mode === "plain") {
      out.push(
        `${ticker} reports earnings ${humanDate(earnings.date)}. The options market is pricing roughly ${
          im ? "±" + (im * 100).toFixed(0) + "%" : "an outsized"
        } move on the day.`
      );
    } else {
      out.push(
        `Earnings ${humanDate(earnings.date)} · ATM straddle implies ±${
          im ? (im * 100).toFixed(1) : "?"
        }% · last 4 day-of moves visible in card.`
      );
    }
  }

  if (fda && daysBetween(today, parseISO(fda.date)) <= 45) {
    out.push(
      mode === "plain"
        ? `An FDA decision (${fda.title.replace("PDUFA: ", "")}) is due ${humanDate(fda.date)} — these tend to be binary moves on the day.`
        : `PDUFA ${humanDate(fda.date)} · ${fda.meta?.drugCandidate ?? ""} ${
            fda.meta?.indication ? "(" + fda.meta.indication + ")" : ""
          } · binary catalyst.`
    );
  }

  if (product && daysBetween(today, parseISO(product.date)) <= 21) {
    out.push(
      mode === "plain"
        ? `${product.meta?.eventName ?? "A major product event"} lands ${humanDate(product.date)} — keynote vol can persist beyond the day.`
        : `Product event ${humanDate(product.date)} · ${product.meta?.eventName ?? product.title}.`
    );
  }

  if (phase === "quiet" && next) {
    out.push(
      mode === "plain"
        ? `Calendar is light. The next event is ${humanDate(next.date)} — a ${next.title.toLowerCase()}.`
        : `Quiet 30d window · next event ${humanDate(next.date)} (${next.category}).`
    );
  }

  if (div && daysBetween(today, parseISO(div.date)) <= 14) {
    out.push(
      `Ex-div ${humanDate(div.date)}${
        div.meta?.amount !== undefined ? ` · $${div.meta.amount.toFixed(2)}/share` : ""
      }. Held shares need to be on the books before that date to receive the payment.`
    );
  }

  // Always cap at 3 — keep card tight
  return out.slice(0, 3);
}
