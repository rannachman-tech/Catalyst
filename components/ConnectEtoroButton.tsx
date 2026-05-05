"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Plug } from "lucide-react";
import {
  EtoroSession,
  clearEtoroSession,
  getEtoroSession,
  onEtoroChange,
} from "@/lib/etoro-session";
import ConnectEtoroModal from "./ConnectEtoroModal";

export default function ConnectEtoroButton() {
  const [session, setSession] = useState<EtoroSession | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPop, setShowPop] = useState(false);

  useEffect(() => {
    setSession(getEtoroSession());
    const off = onEtoroChange(() => setSession(getEtoroSession()));
    return off;
  }, []);

  if (session) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowPop((s) => !s)}
          className="fr inline-flex items-center gap-2 h-8 px-3 rounded-md border border-border bg-surface hover:bg-surface-2 text-[12px] font-medium"
        >
          <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          @{session.username}
          {session.env === "demo" && (
            <span className="ml-1 rounded bg-fg/10 px-1 py-0.5 text-[9px] font-mono uppercase tracking-wide">
              Virtual
            </span>
          )}
        </button>
        {showPop && (
          <div className="absolute right-0 top-9 z-30 w-56 rounded-md border border-border bg-surface shadow-lg p-2 fade-in">
            <div className="px-2 py-1 text-[11px] text-fg-subtle">
              Connected to eToro {session.env === "demo" ? "Virtual" : "Real"}
            </div>
            <button
              onClick={() => {
                clearEtoroSession();
                setShowPop(false);
              }}
              className="fr w-full text-left text-[12px] px-2 py-1.5 rounded hover:bg-surface-2 text-fg"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fr inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-surface hover:bg-surface-2 text-[12px] font-medium"
      >
        <Plug className="h-3.5 w-3.5" />
        Connect eToro
      </button>
      <ConnectEtoroModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setShowModal(false);
        }}
      />
    </>
  );
}

export function ConnectedDot() {
  const [s, setS] = useState<EtoroSession | null>(null);
  useEffect(() => {
    setS(getEtoroSession());
    return onEtoroChange(() => setS(getEtoroSession()));
  }, []);
  if (!s) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-fg-subtle">
      <CheckCircle2 className="h-3 w-3 text-accent" /> Connected
    </span>
  );
}
