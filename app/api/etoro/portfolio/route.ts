// Reads the connected user's live eToro portfolio.
// Calls /trading/info/portfolio with their keys, extracts instrumentIds,
// maps them back to tickers via the public catalog (server-side, not edge,
// so it can use the cached universe loader).

import { NextRequest, NextResponse } from "next/server";
import { findByInstrumentId } from "@/lib/universe";

const BASE = "https://public-api.etoro.com/api/v1";

function rid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? (crypto as { randomUUID: () => string }).randomUUID()
    : Math.random().toString(36).slice(2);
}

interface RawPosition {
  InstrumentID?: number;
  instrumentId?: number;
  Direction?: number;
  IsBuy?: boolean;
  Amount?: number;
  OpenAmount?: number;
  amount?: number;
}

interface PositionView {
  ticker: string;
  symbolFull: string;
  instrumentId: number;
  name: string;
  amount: number;
  isBuy: boolean;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    apiKey?: string;
    userKey?: string;
    env?: "real" | "demo";
  };
  const { apiKey, userKey, env } = body;
  if (!apiKey || !userKey || !env) {
    return NextResponse.json(
      { ok: false, error: "Missing apiKey / userKey / env." },
      { status: 400 }
    );
  }

  const path =
    env === "demo"
      ? `${BASE}/trading/info/demo/portfolio`
      : `${BASE}/trading/info/portfolio`;

  try {
    const res = await fetch(path, {
      headers: {
        "x-api-key": apiKey,
        "x-user-key": userKey,
        "x-request-id": rid(),
        accept: "application/json",
      },
    });
    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json(
        { ok: false, error: `eToro returned ${res.status}: ${txt.slice(0, 160)}` },
        { status: 200 }
      );
    }
    const data = (await res.json()) as Record<string, unknown>;

    const containers = collectPositions(data);

    // Aggregate by instrumentId — sum dollar amounts, keep the dominant direction.
    const byId = new Map<
      number,
      { instrumentId: number; amount: number; longDollars: number; shortDollars: number }
    >();
    for (const p of containers) {
      const id = p.InstrumentID ?? p.instrumentId;
      if (!id) continue;
      const isBuy =
        typeof p.IsBuy === "boolean"
          ? p.IsBuy
          : typeof p.Direction === "number"
          ? p.Direction === 1
          : true;
      const amt = p.OpenAmount ?? p.Amount ?? p.amount ?? 0;
      const cur = byId.get(id) ?? {
        instrumentId: id,
        amount: 0,
        longDollars: 0,
        shortDollars: 0,
      };
      cur.amount += amt;
      if (isBuy) cur.longDollars += amt;
      else cur.shortDollars += amt;
      byId.set(id, cur);
    }

    const positions: PositionView[] = [];
    for (const [, p] of byId) {
      const u = findByInstrumentId(p.instrumentId);
      if (!u) continue;
      positions.push({
        ticker: u.ticker,
        symbolFull: u.symbolFull,
        instrumentId: p.instrumentId,
        name: u.name,
        amount: Math.round(p.amount * 100) / 100,
        isBuy: p.longDollars >= p.shortDollars,
      });
    }
    positions.sort((a, b) => b.amount - a.amount);

    return NextResponse.json({ ok: true, positions });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Network error.";
    return NextResponse.json({ ok: false, error: msg }, { status: 200 });
  }
}

// eToro response shape varies — walk the object and collect anything that
// looks like a position (any field with InstrumentID/instrumentId).
function collectPositions(data: Record<string, unknown>): RawPosition[] {
  const out: RawPosition[] = [];
  function visit(node: unknown) {
    if (!node) return;
    if (Array.isArray(node)) {
      for (const item of node) {
        if (item && typeof item === "object") {
          const r = item as RawPosition;
          if (r.InstrumentID || r.instrumentId) out.push(r);
          else visit(item);
        }
      }
      return;
    }
    if (typeof node === "object") {
      for (const v of Object.values(node as Record<string, unknown>)) visit(v);
    }
  }
  visit(data);
  return out;
}
