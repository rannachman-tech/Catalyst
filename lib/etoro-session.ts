"use client";

// localStorage-persisted eToro session.
// Cross-component sync via window event "ec-etoro-changed".

const KEY = "ec-etoro:v1";
const EVT = "ec-etoro-changed";

export interface EtoroSession {
  apiKey: string;
  userKey: string;
  env: "real" | "demo";
  username: string;
  cid: number;
  connectedAt: string;
}

export function getEtoroSession(): EtoroSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EtoroSession;
  } catch {
    return null;
  }
}

export function saveEtoroSession(s: EtoroSession): void {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event(EVT));
}

export function clearEtoroSession(): void {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVT));
}

export function onEtoroChange(cb: () => void): () => void {
  window.addEventListener(EVT, cb);
  // also storage changes from other tabs
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener("storage", onStorage);
  };
}
