import { AlertTriangle } from "lucide-react";

export default function RiskBanner() {
  return (
    <div className="border-b border-border bg-surface-2 text-fg-muted text-[11px] leading-snug">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-2 flex items-start gap-2">
        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" aria-hidden />
        <p>
          <span className="font-medium text-fg">Investing involves risk of loss.</span>{" "}
          Past performance is not indicative of future results. This tool surfaces
          publicly-known catalysts; it is information, not financial advice.
        </p>
      </div>
    </div>
  );
}
