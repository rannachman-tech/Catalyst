"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Loader2,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import {
  type Basket,
  type BasketHolding,
  allocate,
  directBasket,
  hedgeBasket,
} from "@/lib/baskets";
import type { Phase } from "@/lib/catalysts";
import type { TickerEntry } from "@/lib/tickers";
import {
  type EtoroSession,
  getEtoroSession,
  onEtoroChange,
} from "@/lib/etoro-session";

interface Props {
  open: boolean;
  onClose: () => void;
  ticker: TickerEntry;
  phase: Phase;
}

type Step = "review" | "confirm" | "executing" | "result";

interface TradeResultRow {
  ticker: string;
  amount: number;
  ok: boolean;
  positionId?: number;
  error?: string;
}

const QUICK_AMOUNTS = [100, 250, 500, 1000];

export default function TradeModal({ open, onClose, ticker, phase }: Props) {
  const [session, setSession] = useState<EtoroSession | null>(null);
  const [step, setStep] = useState<Step>("review");
  const [amount, setAmount] = useState(500);
  const [withHedge, setWithHedge] = useState(false);
  const [hedgeExpanded, setHedgeExpanded] = useState(phase === "heavy");
  const [results, setResults] = useState<TradeResultRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setSession(getEtoroSession());
    return onEtoroChange(() => setSession(getEtoroSession()));
  }, []);

  const basket: Basket = useMemo(
    () => (withHedge ? hedgeBasket(ticker, phase) : directBasket(ticker, phase)),
    [ticker, phase, withHedge]
  );
  const allocated = useMemo(() => allocate(basket, amount), [basket, amount]);
  const total = allocated.reduce((a, b) => a + b.dollars, 0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && step !== "executing") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, step]);

  useEffect(() => {
    if (open) {
      setStep("review");
      setResults([]);
      setError(null);
      // Reset hedge toggle on each open: heavy → expanded but not enabled by default
      setWithHedge(false);
      setHedgeExpanded(phase === "heavy");
    }
  }, [open, phase]);

  if (!open || !mounted) return null;

  async function execute() {
    if (!session) {
      setError("Not connected to eToro.");
      return;
    }
    setStep("executing");
    setError(null);
    try {
      const res = await fetch("/api/etoro/trade-basket", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          apiKey: session.apiKey,
          userKey: session.userKey,
          env: session.env,
          basket: allocated.map((h) => ({
            ticker: h.ticker,
            amount: h.dollars,
            instrumentId: h.instrumentId,
          })),
        }),
      });
      const json = (await res.json()) as { ok: boolean; results: TradeResultRow[]; error?: string };
      if (!res.ok) {
        setError(json.error || "Trade request failed.");
        setStep("result");
        return;
      }
      setResults(json.results);
      setStep("result");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Network error.";
      setError(msg);
      setStep("result");
    }
  }

  const heavyPhase = phase === "heavy";

  const node = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55">
      <div
        className="w-full max-w-lg rounded-lg border border-border bg-surface text-fg shadow-2xl flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal
      >
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-accent" />
              <h2 className="text-base font-semibold">{withHedge ? basket.title : `Buy ${ticker.ticker}`}</h2>
            </div>
            <p className="mt-1 text-[12px] text-fg-subtle leading-relaxed">
              {withHedge
                ? basket.thesis
                : `Direct buy of ${ticker.name}. Single position on eToro.`}
            </p>
          </div>
          <button
            onClick={() => step !== "executing" && onClose()}
            className="fr -m-1 rounded p-1 text-fg-subtle hover:bg-surface-2"
            aria-label="Close"
            disabled={step === "executing"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {step === "review" && (
            <Review
              allocated={allocated}
              amount={amount}
              setAmount={setAmount}
              session={session}
              ticker={ticker}
              withHedge={withHedge}
              setWithHedge={setWithHedge}
              hedgeExpanded={hedgeExpanded}
              setHedgeExpanded={setHedgeExpanded}
              heavyPhase={heavyPhase}
            />
          )}
          {step === "confirm" && <Confirm allocated={allocated} total={total} session={session} />}
          {step === "executing" && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-7 w-7 text-accent animate-spin" />
              <p className="mt-3 text-[13px] text-fg-muted">Sending orders to eToro…</p>
            </div>
          )}
          {step === "result" && <ResultPanel results={results} error={error} />}
        </div>

        <div className="flex items-center justify-between gap-2 p-5 border-t border-border">
          {step === "review" && (
            <>
              <span className="text-[11px] text-fg-subtle">
                Sized to ${amount.toLocaleString()}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="fr h-9 px-3 rounded-md border border-border text-[13px] hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  onClick={() => session && setStep("confirm")}
                  disabled={!session}
                  className="fr h-9 px-4 rounded-md bg-accent text-accent-fg text-[13px] font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {session ? "Continue" : "Connect first"}
                </button>
              </div>
            </>
          )}
          {step === "confirm" && (
            <>
              <button
                onClick={() => setStep("review")}
                className="fr h-9 px-3 rounded-md border border-border text-[13px] hover:bg-surface-2 inline-flex items-center gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </button>
              <button
                onClick={execute}
                className="fr h-9 px-4 rounded-md bg-accent text-accent-fg text-[13px] font-medium hover:opacity-90"
              >
                Execute
              </button>
            </>
          )}
          {step === "result" && (
            <>
              <span className="text-[11px] text-fg-subtle">
                {results.filter((r) => r.ok).length}/{results.length || allocated.length} filled
              </span>
              <button
                onClick={onClose}
                className="fr h-9 px-4 rounded-md bg-accent text-accent-fg text-[13px] font-medium hover:opacity-90"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
  return createPortal(node, document.body);
}

function Review({
  allocated,
  amount,
  setAmount,
  session,
  ticker,
  withHedge,
  setWithHedge,
  hedgeExpanded,
  setHedgeExpanded,
  heavyPhase,
}: {
  allocated: Array<BasketHolding & { dollars: number }>;
  amount: number;
  setAmount: (v: number) => void;
  session: EtoroSession | null;
  ticker: TickerEntry;
  withHedge: boolean;
  setWithHedge: (v: boolean) => void;
  hedgeExpanded: boolean;
  setHedgeExpanded: (v: boolean) => void;
  heavyPhase: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-fg-subtle mb-1.5">
          Total amount
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-subtle text-[14px]">
              $
            </span>
            <input
              type="number"
              min={50}
              step={50}
              value={amount}
              onChange={(e) =>
                setAmount(Math.max(50, Math.round(Number(e.target.value) || 0)))
              }
              className="fr h-10 w-32 rounded-md border border-border bg-bg pl-6 pr-3 text-[14px] font-mono text-fg"
            />
          </div>
          <div className="flex gap-1">
            {QUICK_AMOUNTS.map((a) => (
              <button
                key={a}
                onClick={() => setAmount(a)}
                className={`fr h-10 px-3 rounded-md border text-[12px] font-mono ${
                  amount === a
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-surface hover:bg-surface-2 text-fg-muted"
                }`}
              >
                ${a}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AllocationTable allocated={allocated} ticker={ticker} />

      {/* Hedge overlay opt-in */}
      <div
        className={`rounded-md border ${
          heavyPhase ? "border-cat-opt/40 bg-cat-opt/8" : "border-border bg-bg"
        }`}
      >
        <button
          onClick={() => setHedgeExpanded(!hedgeExpanded)}
          className="fr w-full flex items-center justify-between gap-3 p-3 text-left"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck
              className={`h-4 w-4 ${heavyPhase ? "text-cat-opt" : "text-fg-subtle"}`}
            />
            <div>
              <div className="text-[13px] font-medium text-fg">
                {heavyPhase ? "Heavy week — add a defensive overlay?" : "Add a defensive overlay (optional)"}
              </div>
              <div className="text-[11px] text-fg-subtle mt-0.5">
                Halves the {ticker.ticker} position and pairs it with vol + treasuries + a sector hedge.
              </div>
            </div>
          </div>
          {hedgeExpanded ? (
            <ChevronUp className="h-4 w-4 text-fg-subtle flex-shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-fg-subtle flex-shrink-0" />
          )}
        </button>
        {hedgeExpanded && (
          <div className="px-3 pb-3 fade-in">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={withHedge}
                onChange={(e) => setWithHedge(e.target.checked)}
                className="fr mt-1 h-4 w-4 rounded border-border accent-accent"
              />
              <span className="text-[12px] text-fg-muted leading-relaxed">
                Use the overlay basket. {ticker.ticker} sized to 50% of your amount; the other 50% goes to{" "}
                <span className="font-mono">VXX</span> (15%),{" "}
                <span className="font-mono">TLT</span> (15%), and a{" "}
                <span className="font-mono">defensive sector ETF</span> (20%). Coherent for weeks where one
                rough catalyst could dominate the book.
              </span>
            </label>
          </div>
        )}
      </div>

      {!session && (
        <div className="flex items-center gap-2 rounded-md border border-cat-opt/40 bg-cat-opt/10 px-3 py-2 text-[12px] text-cat-opt">
          <AlertCircle className="h-3.5 w-3.5" />
          Connect your eToro account to execute. Your keys never leave your browser.
        </div>
      )}
    </div>
  );
}

function Confirm({
  allocated,
  total,
  session,
}: {
  allocated: Array<BasketHolding & { dollars: number }>;
  total: number;
  session: EtoroSession | null;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-bg p-4">
        <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
          Confirm this order
        </div>
        <table className="mt-2 w-full text-[12.5px]">
          <thead>
            <tr className="text-fg-subtle text-left">
              <th className="font-medium pb-1.5">Ticker</th>
              <th className="font-medium pb-1.5">Weight</th>
              <th className="font-medium pb-1.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {allocated.map((h) => (
              <tr key={h.instrumentId} className="border-t border-border">
                <td className="py-2 font-mono">{h.ticker}</td>
                <td className="py-2 text-fg-muted">{h.weight}%</td>
                <td className="py-2 text-right font-mono">${h.dollars.toFixed(2)}</td>
              </tr>
            ))}
            <tr className="border-t border-border-strong">
              <td className="py-2 font-medium">Total</td>
              <td />
              <td className="py-2 text-right font-mono font-medium">
                ${total.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-[12px] text-fg-muted leading-relaxed">
        Make sure you have the required funds available in your account. Orders
        execute as market-open buy positions on{" "}
        <strong>eToro {session?.env === "demo" ? "Virtual" : "Real"}</strong>
        {session ? <> as <span className="font-mono">@{session.username}</span></> : null}.
      </p>
    </div>
  );
}

function AllocationTable({
  allocated,
  ticker,
}: {
  allocated: Array<BasketHolding & { dollars: number }>;
  ticker: TickerEntry;
}) {
  if (allocated.length === 1) {
    const h = allocated[0];
    return (
      <div className="rounded-md border border-border bg-bg p-4">
        <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
          Order preview
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <div>
            <div className="font-mono text-[16px] font-semibold text-fg">{h.ticker}</div>
            <div className="text-[12px] text-fg-subtle">{h.name}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[16px] font-semibold text-fg">
              ${h.dollars.toFixed(2)}
            </div>
            <div className="text-[11px] text-fg-subtle">market buy</div>
          </div>
        </div>
        <div className="mt-3 text-[11px] text-fg-subtle leading-relaxed">
          Direct exposure to {ticker.name}. Order routes to eToro market-open at the next available price.
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-md border border-border bg-bg">
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="text-fg-subtle text-left">
            <th className="font-medium px-3 py-2">Ticker · Name</th>
            <th className="font-medium px-3 py-2">Weight</th>
            <th className="font-medium px-3 py-2 text-right">$</th>
          </tr>
        </thead>
        <tbody>
          {allocated.map((h) => (
            <tr key={h.instrumentId} className="border-t border-border align-top">
              <td className="px-3 py-2.5">
                <div className="font-mono font-medium">{h.ticker}</div>
                <div className="text-fg-subtle text-[11px] truncate max-w-[260px]">
                  {h.name}
                </div>
                <div className="mt-1 text-[11px] text-fg-muted leading-snug">
                  {h.shortRationale}
                </div>
              </td>
              <td className="px-3 py-2.5 text-fg-muted">{h.weight}%</td>
              <td className="px-3 py-2.5 text-right font-mono">${h.dollars.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultPanel({
  results,
  error,
}: {
  results: TradeResultRow[];
  error: string | null;
}) {
  if (error && results.length === 0) {
    return (
      <div className="rounded-md border border-cat-earn/40 bg-cat-earn/10 p-4 text-[13px] text-cat-earn">
        <div className="flex items-center gap-2 font-medium">
          <AlertCircle className="h-4 w-4" />
          Trade failed
        </div>
        <p className="mt-1 text-[12.5px]">{error}</p>
      </div>
    );
  }
  return (
    <div className="rounded-md border border-border bg-bg">
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="text-fg-subtle text-left">
            <th className="font-medium px-3 py-2">Ticker</th>
            <th className="font-medium px-3 py-2">Result</th>
            <th className="font-medium px-3 py-2 text-right">$</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.ticker} className="border-t border-border">
              <td className="px-3 py-2.5 font-mono">{r.ticker}</td>
              <td className="px-3 py-2.5">
                {r.ok ? (
                  <span className="inline-flex items-center gap-1 text-accent">
                    <Check className="h-3.5 w-3.5" /> filled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-cat-earn">
                    <X className="h-3.5 w-3.5" /> {r.error?.slice(0, 50) ?? "failed"}
                  </span>
                )}
              </td>
              <td className="px-3 py-2.5 text-right font-mono">${r.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
