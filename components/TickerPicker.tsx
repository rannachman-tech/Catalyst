"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { searchTickers, findTicker, type TickerEntry } from "@/lib/tickers";

interface SearchHit {
  ticker: string;
  symbolFull: string;
  instrumentId: number;
  name: string;
  curated: boolean;
  sector?: string;
}

interface Props {
  value: string;
  onChange: (ticker: string) => void;
  recents: string[];
  onClearRecents: () => void;
  autoFocus?: boolean;
}

export default function TickerPicker({
  value,
  onChange,
  recents,
  onClearRecents,
  autoFocus,
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [remoteHits, setRemoteHits] = useState<SearchHit[]>([]);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const localHits = useMemo<SearchHit[]>(() => {
    if (!q.trim()) {
      return recents
        .map((t) => findTicker(t))
        .filter((x): x is TickerEntry => !!x)
        .map((t) => ({
          ticker: t.ticker,
          symbolFull: t.symbolFull,
          instrumentId: t.instrumentId,
          name: t.name,
          curated: true,
          sector: t.sector,
        }))
        .slice(0, 6);
    }
    return searchTickers(q, 6).map((t) => ({
      ticker: t.ticker,
      symbolFull: t.symbolFull,
      instrumentId: t.instrumentId,
      name: t.name,
      curated: true,
      sector: t.sector,
    }));
  }, [q, recents]);

  useEffect(() => {
    if (!q.trim() || q.trim().length < 1) {
      setRemoteHits([]);
      return;
    }
    const myId = ++reqIdRef.current;
    const t = setTimeout(() => {
      setBusy(true);
      fetch(`/api/search?q=${encodeURIComponent(q)}&limit=12`)
        .then((r) => r.json())
        .then((j: { hits?: SearchHit[] }) => {
          if (myId !== reqIdRef.current) return;
          setRemoteHits(j.hits ?? []);
        })
        .catch(() => {
          if (myId === reqIdRef.current) setRemoteHits([]);
        })
        .finally(() => {
          if (myId === reqIdRef.current) setBusy(false);
        });
    }, 140);
    return () => clearTimeout(t);
  }, [q]);

  const results = useMemo<SearchHit[]>(() => {
    const seen = new Set<string>();
    const merged: SearchHit[] = [];
    for (const h of [...localHits, ...remoteHits]) {
      const k = h.ticker.toUpperCase();
      if (seen.has(k)) continue;
      seen.add(k);
      merged.push(h);
    }
    return merged.slice(0, 12);
  }, [localHits, remoteHits]);

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  function pick(t: SearchHit) {
    onChange(t.ticker);
    setQ("");
    setOpen(false);
    setActive(0);
  }

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-subtle" />
        <input
          ref={inputRef}
          type="text"
          value={q || value || ""}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const next = results[active];
              if (next) pick(next);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder="Search any eToro stock — NICE, ETOR, NVDA, MRNA…"
          className="fr w-full h-12 sm:h-14 rounded-lg border border-border bg-bg pl-10 pr-10 text-base sm:text-lg font-medium text-fg placeholder:text-fg-subtle/70 font-mono"
          autoComplete="off"
          spellCheck={false}
        />
        {(q || value) && (
          <button
            onClick={() => {
              setQ("");
              onChange("");
              inputRef.current?.focus();
            }}
            className="fr absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg"
            aria-label="Clear"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full rounded-md border border-border bg-surface shadow-lg fade-in max-h-[420px] overflow-auto">
          {!q && recents.length > 0 && (
            <div className="flex items-center justify-between px-3 pt-2.5 pb-1 text-[10px] uppercase tracking-[0.18em] font-mono text-fg-subtle">
              <span>Recent</span>
              <button
                className="hover:text-fg"
                onClick={(e) => {
                  e.preventDefault();
                  onClearRecents();
                }}
              >
                Clear
              </button>
            </div>
          )}
          {!q && recents.length === 0 && (
            <div className="px-3 pt-2.5 pb-1 text-[10px] uppercase tracking-[0.18em] font-mono text-fg-subtle">
              Suggested
            </div>
          )}

          {q && results.length > 0 && (
            <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-[0.18em] font-mono text-fg-subtle">
              {busy ? "Searching the eToro catalog…" : `${results.length} matches`}
            </div>
          )}

          {results.length === 0 && (
            <div className="px-3 py-3 text-[12px] text-fg-subtle">
              {busy ? "Searching…" : `No matches in eToro's stock catalog for "${q}".`}
            </div>
          )}

          {results.map((t, i) => (
            <button
              key={`${t.ticker}-${t.instrumentId}`}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(t);
              }}
              className={`fr w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-surface-2 ${
                i === active ? "bg-surface-2" : ""
              }`}
            >
              <span className="font-mono text-[12px] font-semibold w-16 truncate">
                {t.ticker}
              </span>
              <span className="text-[12px] text-fg-muted truncate flex-1">
                {t.name}
              </span>
              {t.curated ? (
                <span
                  className="text-[9px] uppercase font-mono tracking-[0.16em] text-accent"
                  title="Curated — has FDA / product / lockup data on top of earnings"
                >
                  Curated
                </span>
              ) : (
                t.sector && (
                  <span className="text-[9px] uppercase font-mono tracking-[0.16em] text-fg-subtle">
                    {t.sector}
                  </span>
                )
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
