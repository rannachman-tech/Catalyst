"use client";

import { Activity } from "lucide-react";
import type { Source } from "@/lib/catalysts";

interface Props {
  sources: Array<{ source: Source; ok: boolean; note?: string }>;
  asOf: string;
}

const SOURCE_LABEL: Record<Source, string> = {
  Finnhub: "Finnhub",
  "FDA OpenData": "FDA",
  Curated: "Curated",
  CBOE: "CBOE",
  "Index Provider": "Index",
};

export default function LiveSourcesRow({ sources, asOf }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-fg-subtle">
      <span className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.18em]">
        <Activity className="h-3 w-3" />
        Live
      </span>
      <span className="text-fg-subtle/60">·</span>
      {sources.map((s) => (
        <span
          key={s.source}
          className="inline-flex items-center gap-1.5"
          title={s.note ?? ""}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              s.ok ? "bg-accent" : "bg-fg-subtle/40"
            }`}
          />
          {SOURCE_LABEL[s.source]}
        </span>
      ))}
      <span className="text-fg-subtle/60">·</span>
      <span>updated {timeAgo(asOf)}</span>
    </div>
  );
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  const hours = Math.floor(diff / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
