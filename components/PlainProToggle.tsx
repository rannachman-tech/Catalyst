"use client";

interface Props {
  value: "plain" | "pro";
  onChange: (next: "plain" | "pro") => void;
}

export default function PlainProToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex h-8 rounded-md border border-border bg-surface p-0.5 text-[12px] font-medium">
      <button
        onClick={() => onChange("plain")}
        className={`fr px-3 rounded-[5px] transition-colors ${
          value === "plain" ? "bg-surface-2 text-fg" : "text-fg-subtle hover:text-fg"
        }`}
      >
        Plain English
      </button>
      <button
        onClick={() => onChange("pro")}
        className={`fr px-3 rounded-[5px] transition-colors ${
          value === "pro" ? "bg-surface-2 text-fg" : "text-fg-subtle hover:text-fg"
        }`}
      >
        Pro
      </button>
    </div>
  );
}
