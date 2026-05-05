"use client";

import type { Phase } from "@/lib/catalysts";

interface Props {
  score: number;        // 0..100
  phase: Phase;
  count30: number;
  count90: number;
}

const PHASE_COLOR: Record<Phase, string> = {
  quiet: "var(--phase-quiet)",
  moderate: "var(--phase-mod)",
  heavy: "var(--phase-heavy)",
};

const PHASE_LABEL: Record<Phase, string> = {
  quiet: "Quiet",
  moderate: "Moderate",
  heavy: "Heavy",
};

export default function DensityScore({ score, phase, count30, count90 }: Props) {
  // SVG: 200x70 — semi-circular gauge with score, phase label, two counts
  const max = 100;
  const angle = (Math.min(score, max) / max) * 180; // 0..180

  const cx = 100;
  const cy = 60;
  const r = 50;
  const startX = cx - r;
  const startY = cy;
  const endX = cx + r * Math.cos(Math.PI - (angle * Math.PI) / 180);
  const endY = cy - r * Math.sin(Math.PI - (angle * Math.PI) / 180);
  const largeArc = angle > 180 ? 1 : 0;

  return (
    <div className="w-full max-w-[340px] mx-auto">
      <svg viewBox="0 0 200 80" className="w-full" aria-hidden>
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          stroke="rgb(var(--border))"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        {/* Filled arc */}
        {angle > 1 && (
          <path
            d={`M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`}
            stroke={`rgb(${PHASE_COLOR[phase]})`}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
        )}
        {/* Score */}
        <text
          x="100"
          y="56"
          textAnchor="middle"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
          fontSize="22"
          fontWeight="600"
          fill="rgb(var(--fg))"
        >
          {Math.round(score)}
        </text>
      </svg>
      <div className="mt-2 flex items-center justify-center gap-3 text-[11px] font-mono uppercase tracking-[0.18em]">
        <span style={{ color: `rgb(${PHASE_COLOR[phase]})` }}>{PHASE_LABEL[phase]}</span>
        <span className="text-fg-subtle">·</span>
        <span className="text-fg-subtle">
          {count30} in 30d · {count90} in 90d
        </span>
      </div>
    </div>
  );
}
