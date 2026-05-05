"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [mode, setMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const m = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setMode(m);
  }, []);

  function toggle() {
    const next = mode === "dark" ? "light" : "dark";
    if (next === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = next;
    try {
      localStorage.setItem("ec-theme", next);
    } catch { /* ignore */ }
    setMode(next);
  }

  return (
    <button
      onClick={toggle}
      className="fr inline-flex items-center justify-center h-8 w-8 rounded-md border border-border bg-surface hover:bg-surface-2 text-fg-muted"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
