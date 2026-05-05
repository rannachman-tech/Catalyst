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
  className?: string;
}

export default function InsightsCard({
  ticker,
  phase,
  bigSentence,
  catalysts,
  asOf,
  className = "",
}: Props) {
  if (!catalysts) {
    return (
      <section className={"rounded-lg border border-border bg-surface p-4 sm:p-5 " + className}>
        <h2 className="text-base font-semibold">Insights</h2>
        <p className="mt-2 text-[12px] text-fg-subtle">Loading…</p>
      </section>
    );
  }

  const today = parseISO(asOf);
  const next = catalysts[0];
  const insights = buildInsights({ ticker, phase, catalysts, today });

  return (
    <section className={"rounded-lg border border-border bg-surface p-3.5 sm:p-4 " + className}>
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
          Insights
        </h2>
        <PhaseBadge phase={phase} />
      </div>

      <p className="mt-2.5 text-[16px] sm:text-[18px] leading-snug font-semibold text-fg">
        {bigSentence}
      </p>

      <p className="mt-1.5 text-[12.5px] text-fg-muted leading-relaxed">
        {phaseAction(phase)}
      </p>

      {next && (
        <div className="mt-3 rounded-md border border-border bg-bg p-2.5">
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
        <ul className="mt-3 space-y-1.5">
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
}: {
  ticker: string;
  phase: Phase;
  catalysts: Catalyst[];
  today: Date;
}): string[] {
  const out: string[] = [];

  const next = catalysts[0];
  const earnings = catalysts.find((c) => c.category === "earnings");
  const fda = catalysts.find((c) => c.category === "fda");
  const product = catalysts.find((c) => c.category === "product");
  const div = catalysts.find((c) => c.category === "dividend");

  if (earnings && daysBetween(today, parseISO(earnings.date)) <= 21) {
    const im = earnings.meta?.impliedMove;
    out.push(
      ticker + " reports earnings " + humanDate(earnings.date) + " — front-month straddle implies " +
      (im ? "±" + (im * 100).toFixed(1) + "%" : "an outsized move") + " on the day."
    );
  }

  if (fda && daysBetween(today, parseISO(fda.date)) <= 45) {
    const drug = fda.meta?.drugCandidate ?? fda.title.replace("PDUFA: ", "");
    const ind = fda.meta?.indication ? " (" + fda.meta.indication + ")" : "";
    out.push(
      "PDUFA " + humanDate(fda.date) + " · " + drug + ind + " — binary FDA catalyst, day-of move tends to be large."
    );
  }

  if (product && daysBetween(today, parseISO(product.date)) <= 21) {
    const ev = product.meta?.eventName ?? product.title;
    out.push(ev + " lands " + humanDate(product.date) + " — keynote vol often persists beyond the day.");
  }

  if (phase === "quiet" && next) {
    out.push("Calendar is light — next event " + humanDate(next.date) + " (" + next.title.toLowerCase() + ").");
  }

  if (div && daysBetween(today, parseISO(div.date)) <= 14) {
    out.push(
      "Ex-div " + humanDate(div.date) +
      (div.meta?.amount !== undefined ? " · $" + div.meta.amount.toFixed(2) + "/share" : "") +
      " — must hold before this date to receive the payment."
    );
  }

  return out.slice(0, 3);
}
