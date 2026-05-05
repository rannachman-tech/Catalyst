"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Plug, Wallet } from "lucide-react";
import {
  EtoroSession,
  getEtoroSession,
  onEtoroChange,
} from "@/lib/etoro-session";
import ConnectEtoroModal from "./ConnectEtoroModal";

interface Props {
  variant?: "contextual" | "inline";
  onTradeClick?: () => void;
  ctaLabel?: string;
  description?: string;
}

export default function ConnectEtoroCta({
  variant = "contextual",
  onTradeClick,
  ctaLabel = "Trade on eToro",
  description = "Open the trade preview to see the basket sized to a $ amount you choose.",
}: Props) {
  const [session, setSession] = useState<EtoroSession | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setSession(getEtoroSession());
    return onEtoroChange(() => setSession(getEtoroSession()));
  }, []);

  if (variant === "inline") {
    return (
      <button
        onClick={() => (session && onTradeClick ? onTradeClick() : setShowModal(true))}
        className="fr inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-accent text-accent-fg text-[12px] font-medium hover:opacity-90"
      >
        {session ? <Wallet className="h-3.5 w-3.5" /> : <Plug className="h-3.5 w-3.5" />}
        {session ? ctaLabel : "Connect to trade"}
        <ConnectEtoroModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
        />
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
        <Wallet className="h-3 w-3" />
        Trade on eToro
      </div>
      <p className="mt-2 text-[13px] text-fg leading-relaxed">{description}</p>
      <button
        onClick={() => (session && onTradeClick ? onTradeClick() : setShowModal(true))}
        className="fr mt-4 inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-accent text-accent-fg text-[12px] font-medium hover:opacity-90"
      >
        {session ? ctaLabel : "Connect to start"}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
      {session && (
        <p className="mt-3 text-[11px] text-fg-subtle">
          Connected as <span className="text-fg">@{session.username}</span>
          {session.env === "demo" && " (Virtual)"}.
        </p>
      )}
      <ConnectEtoroModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => setShowModal(false)}
      />
    </div>
  );
}
