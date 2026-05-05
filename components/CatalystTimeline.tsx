"use client";

import { useState } from "react";
import {
  ChevronDown,
  CalendarClock,
  Banknote,
  FlaskConical,
  Sparkles,
  Layers,
  TrendingUp,
  Lock,
  Mic,
} from "lucide-react";
import {
  CATEGORY_LABEL,
  CATEGORY_PLAIN,
  type Catalyst,
  type CatalystCategory,
  parseISO,
  daysBetween,
  humanDate,
} from "@/lib/catalysts";

interface Props {
  catalysts: Catalyst[];
  asOf: string;
  ticker: string;
}

const ICONS: Record<CatalystCategory, React.ComponentType<{ className?: string }>> = {
  earnings: CalendarClock,
  dividend: Banknote,
  fda: FlaskConical,
  product: Sparkles,
  "options-expiry": Layers,
  index: TrendingUp,
  lockup: Lock,
  analyst: Mic,
};

export default function CatalystTimeline({ catalysts, asOf, ticker }: Props) {
  const today = parseISO(asOf);
  const groups = groupByMonth(catalysts);

  if (catalysts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <CalendarClock className="h-7 w-7 text-fg-subtle mb-3" />
        <p className="text-[14px] text-fg-muted font-medium">
          No scheduled catalysts in the next 90 days for {ticker}.
        </p>
        <p className="mt-1 text-[12px] text-fg-subtle max-w-md">
          Calendar is clear. We&apos;ll surface anything that drops onto the calendar within minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pl-12 pr-2 py-4">
      <div className="timeline-rail" aria-hidden />
      <div className="today-marker" style={{ top: 8 }} aria-hidden />
      <div className="ml-2 mb-4 text-[10px] font-mono uppercase tracking-[0.2em] text-fg-subtle">
        Today · {humanDate(asOf)}
      </div>
      {groups.map((g) => (
        <div key={g.label} className="mb-5 last:mb-0">
          <div className="ml-2 mb-2 text-[10px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
            {g.label}
          </div>
          <div className="space-y-2.5">
            {g.items.map((c) => (
              <CatalystCard key={c.id} c={c} daysOut={daysBetween(today, parseISO(c.date))} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CatalystCard({ c, daysOut }: { c: Catalyst; daysOut: number }) {
  const [open, setOpen] = useState(false);
  const Icon = ICONS[c.category];
  const cssVar = catVar(c.category);
  const impactLevel: "low" | "med" | "hi" =
    c.impact >= 0.07 ? "hi" : c.impact >= 0.03 ? "med" : "low";

  const inset = impactLevel === "hi" ? 3 : impactLevel === "med" ? 2 : 1;

  return (
    <div className="relative">
      <div
        className="absolute -left-[34px] top-3 h-3 w-3 rounded-full"
        style={{
          background: "rgb(" + cssVar + ")",
          boxShadow: "0 0 0 4px rgb(var(--bg)), 0 0 0 5px rgb(var(--border))",
        }}
        aria-hidden
      />
      <button
        onClick={() => setOpen((o) => !o)}
        className="fr group w-full text-left rounded-md border border-border bg-surface px-3 py-2.5 hover:border-border-strong transition-colors"
        style={{ boxShadow: "inset " + inset + "px 0 0 rgb(" + cssVar + ")" }}
        aria-expanded={open}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex-shrink-0 inline-flex" style={{ color: "rgb(" + cssVar + ")" }} aria-hidden>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono tracking-[0.16em] text-fg-subtle">
                  {CATEGORY_LABEL[c.category]}
                </span>
                {!c.confirmed && (
                  <span className="text-[9px] font-mono uppercase tracking-[0.16em] rounded bg-fg-subtle/15 px-1 py-0.5 text-fg-subtle">
                    Est
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-[13px] font-medium text-fg truncate">
                {c.title}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <DateBadge daysOut={daysOut} dateISO={c.date} />
            <ImpactPill impact={c.impact} />
            <ChevronDown
              className={"h-4 w-4 text-fg-subtle transition-transform " + (open ? "rotate-180" : "")}
              aria-hidden
            />
          </div>
        </div>
      </button>

      {open && (
        <div className="mt-2 ml-2 rounded-md border border-border bg-surface-2 px-3 py-3 text-[12px] text-fg-muted leading-relaxed fade-in">
          {c.summary && <p className="text-fg">{c.summary}</p>}
          <p className={c.summary ? "mt-2" : ""}>{CATEGORY_PLAIN[c.category]}</p>
          {proDescription(c) && proDescription(c) !== CATEGORY_PLAIN[c.category] && (
            <p className="mt-1.5 text-fg-muted/85">{proDescription(c)}</p>
          )}

          {c.meta?.last4Reactions && c.meta.last4Reactions.length > 0 && (
            <div className="mt-3">
              <div className="text-[10px] uppercase font-mono tracking-[0.16em] text-fg-subtle">
                Last 4 day-of moves
              </div>
              <div className="mt-1 flex gap-1.5 flex-wrap">
                {c.meta.last4Reactions.map((mv, i) => (
                  <span
                    key={i}
                    className="font-mono text-[11px] rounded px-2 py-0.5"
                    style={{
                      background: mv >= 0 ? "rgb(var(--phase-quiet) / 0.12)" : "rgb(var(--phase-heavy) / 0.12)",
                      color: mv >= 0 ? "rgb(var(--phase-quiet))" : "rgb(var(--phase-heavy))",
                    }}
                  >
                    {mv >= 0 ? "+" : ""}
                    {mv.toFixed(1)}%
                  </span>
                ))}
              </div>
            </div>
          )}

          {c.meta?.impliedMove !== undefined && (
            <div className="mt-3 text-[12px] text-fg-muted">
              Implied move:{" "}
              <span className="font-mono text-fg">±{(c.meta.impliedMove * 100).toFixed(1)}%</span>{" "}
              (front-month straddle)
            </div>
          )}

          <div className="mt-3 text-[10px] uppercase tracking-[0.16em] font-mono text-fg-subtle">
            Source · {c.source}
          </div>
        </div>
      )}
    </div>
  );
}

function DateBadge({ daysOut, dateISO }: { daysOut: number; dateISO: string }) {
  let label = "";
  if (daysOut === 0) label = "Today";
  else if (daysOut === 1) label = "Tomorrow";
  else if (daysOut <= 7) label = daysOut + "d";
  else label = humanDate(dateISO);
  const accent = daysOut <= 7;
  return (
    <span
      className={"text-[11px] font-mono px-2 py-0.5 rounded whitespace-nowrap " +
        (accent ? "bg-accent/12 text-accent" : "bg-surface-2 text-fg-muted")}
    >
      {label}
    </span>
  );
}

function ImpactPill({ impact }: { impact: number }) {
  const pct = Math.round(impact * 100);
  const tier = impact >= 0.07 ? "hi" : impact >= 0.03 ? "med" : "low";
  const cls =
    tier === "hi" ? "bg-cat-earn/12 text-cat-earn" :
    tier === "med" ? "bg-cat-opt/12 text-cat-opt" :
    "bg-fg-subtle/12 text-fg-muted";
  return (
    <span className={"text-[11px] font-mono px-2 py-0.5 rounded whitespace-nowrap " + cls}>
      ~{pct}% vol
    </span>
  );
}

function catVar(cat: CatalystCategory): string {
  switch (cat) {
    case "earnings": return "var(--cat-earn)";
    case "dividend": return "var(--cat-div)";
    case "fda": return "var(--cat-fda)";
    case "product": return "var(--cat-prod)";
    case "options-expiry": return "var(--cat-opt)";
    case "index": return "var(--cat-idx)";
    case "lockup": return "var(--cat-lock)";
    case "analyst": return "var(--cat-anal)";
  }
}

function proDescription(c: Catalyst): string {
  switch (c.category) {
    case "earnings":
      return c.meta?.impliedMove
        ? "Front-month straddle pricing implies ±" + (c.meta.impliedMove * 100).toFixed(1) + "% on report."
        : "Quarterly print — typical largest-mover for single names.";
    case "dividend":
      return c.meta?.amount !== undefined
        ? "Ex-div: $" + c.meta.amount.toFixed(2) + "/share. Price drops by ~div amount on the open."
        : "Ex-dividend date.";
    case "fda":
      return c.meta?.drugCandidate
        ? c.meta.drugCandidate + " — " + (c.meta.indication ?? "indication TBD") + ". PDUFA decision deadline."
        : "PDUFA deadline.";
    case "product":
      return c.meta?.eventName
        ? c.meta.eventName + ". Forward-looking guide / launch slate."
        : "Major product or developer event.";
    case "options-expiry":
      return "Monthly OPEX. Open-interest at strikes can pin the close.";
    case "index":
      return c.meta?.indexName
        ? c.meta.indexName + " " + (c.meta.indexAction ?? "review") + ". Passive flows kick in T+1."
        : "Index review.";
    case "lockup":
      return c.meta?.sharesUnlocking
        ? "Lockup expiry. " + c.meta.sharesUnlocking.toLocaleString() + " shares freed."
        : "IPO / secondary lockup expiry.";
    case "analyst":
      return c.meta?.analystEvent ?? "Analyst day or investor conference.";
    default:
      return "";
  }
}

function groupByMonth(items: Catalyst[]) {
  const groups: Array<{ label: string; items: Catalyst[] }> = [];
  for (const c of items) {
    const d = parseISO(c.date);
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(c);
    } else {
      groups.push({ label, items: [c] });
    }
  }
  return groups;
}
