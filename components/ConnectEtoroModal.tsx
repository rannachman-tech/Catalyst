"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, ExternalLink, ShieldCheck } from "lucide-react";
import { saveEtoroSession } from "@/lib/etoro-session";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ValidationResponse {
  ok: boolean;
  detectedEnv?: "real" | "demo";
  username?: string;
  cid?: number;
  error?: string;
}

export default function ConnectEtoroModal({ open, onClose, onSuccess }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [userKey, setUserKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, busy]);

  if (!open || !mounted) return null;

  async function handleConnect() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/etoro/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim(), userKey: userKey.trim() }),
      });
      const json = (await res.json()) as ValidationResponse;
      if (!json.ok || !json.username || !json.cid || !json.detectedEnv) {
        setError(json.error || "Could not validate the keys.");
        setBusy(false);
        return;
      }
      saveEtoroSession({
        apiKey: apiKey.trim(),
        userKey: userKey.trim(),
        env: json.detectedEnv,
        username: json.username,
        cid: json.cid,
        connectedAt: new Date().toISOString(),
      });
      setBusy(false);
      setApiKey("");
      setUserKey("");
      onSuccess?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Network error.";
      setError(msg);
      setBusy(false);
    }
  }

  const node = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55">
      <div
        className="w-full max-w-md rounded-lg border border-border bg-surface text-fg shadow-2xl"
        role="dialog"
        aria-modal
      >
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-semibold">Connect to eToro</h2>
            <p className="mt-1 text-[12px] text-fg-subtle">
              Use your eToro Public API Key + Private Key. Auto-detects real or
              virtual.
            </p>
          </div>
          <button
            onClick={() => !busy && onClose()}
            className="fr -m-1 rounded p-1 text-fg-subtle hover:bg-surface-2"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <Field
            label="Public API Key"
            value={apiKey}
            onChange={setApiKey}
            disabled={busy}
            placeholder="x-api-key"
          />
          <Field
            label="Private Key"
            value={userKey}
            onChange={setUserKey}
            disabled={busy}
            placeholder="x-user-key"
            type="password"
          />

          <details className="text-[12px] text-fg-subtle">
            <summary className="cursor-pointer hover:text-fg">
              Where do I get these?
            </summary>
            <p className="mt-2 leading-relaxed">
              Go to your eToro account &rarr; Settings &rarr; API Access. Create a
              key and copy both the <code className="font-mono">Public API Key</code>{" "}
              and <code className="font-mono">Private Key</code>. The keys live in
              your browser only — Equity Catalyst never sees them on the server
              outside of trade calls you initiate.
              <a
                href="https://www.etoro.com/customer-service/help/2086523492"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-accent ml-1"
              >
                eToro guide <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </details>

          {error && (
            <div className="rounded-md border border-cat-earn/40 bg-cat-earn/10 p-3 text-[12px] text-cat-earn">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-fg-subtle">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            Keys persist only in your browser&apos;s localStorage.
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
          <button
            onClick={onClose}
            disabled={busy}
            className="fr h-9 px-3 rounded-md border border-border text-[13px] hover:bg-surface-2 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={busy || !apiKey.trim() || !userKey.trim()}
            className="fr inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-accent text-accent-fg text-[13px] font-medium hover:opacity-90 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {busy ? "Validating…" : "Test connection"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

function Field({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase font-mono tracking-[0.18em] text-fg-subtle">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="fr mt-1.5 block w-full h-10 rounded-md border border-border bg-bg px-3 text-[13px] text-fg placeholder:text-fg-subtle/60 disabled:opacity-60 font-mono"
      />
    </label>
  );
}
